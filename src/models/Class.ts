import database from '../config/database';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import { 
  Class as ClassType, 
  CreateClassRequest, 
  UpdateClassRequest, 
  ClassFilters, 
  PaginatedResponse 
} from '../types';

/**
 * Class model with comprehensive database operations
 * Handles all class-related database interactions with validation and error handling
 * Optimized for maximum performance with connection pooling and query optimization
 */
class Class {
  /**
   * Creates a new class
   * @param {CreateClassRequest} classData - The class data to create
   * @returns {Promise<ClassType>} The created class object
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When database operation fails
   */
  static async create(classData: CreateClassRequest): Promise<ClassType> {
    try {
      // Validate required fields and business rules
      this.validateClassRequirements(classData);

      const query = `
        INSERT INTO classes (
          name, description, instructor_id, class_type,
          class_date, start_time, end_time, duration_minutes,
          max_capacity, price, location, room, equipment_needed,
          difficulty_level, tags, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        classData.name,
        classData.description || null,
        classData.instructorId,
        classData.classType,
        classData.classDate,
        classData.startTime,
        classData.endTime,
        classData.durationMinutes,
        classData.maxCapacity,
        classData.price || 0,
        classData.location || null,
        classData.room || null,
        classData.equipmentNeeded ? JSON.stringify(classData.equipmentNeeded) : null,
        classData.difficultyLevel || 'all_levels',
        classData.tags ? JSON.stringify(classData.tags) : null,
        'active'
      ];

      const result = await database.query(query, values);
      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('A class already exists for this instructor on this date and time');
      }
      // Re-throw ValidationError as-is
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to create class');
    }
  }

  /**
   * Gets a class by its ID
   * @param {string} classId - The class ID to retrieve
   * @returns {Promise<ClassType>} The found class object
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async findById(classId: string): Promise<ClassType | null> {
    try {
      const query = `
        SELECT c.*, i.name as instructor_name
        FROM classes c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        WHERE c.id = $1
      `;
      
      const result = await database.query(query, [classId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDatabaseRowToClass(result.rows[0]);
    } catch (error) {
      throw new ServiceError('Failed to retrieve class');
    }
  }

  /**
   * Gets all classes with filtering and pagination
   * @param {ClassFilters} filters - Filter criteria for classes
   * @returns {Promise<PaginatedResponse<ClassType>>} Paginated class results
   * @throws {ServiceError} When database operation fails
   */
  static async findAll(filters: ClassFilters = {}): Promise<PaginatedResponse<ClassType>> {
    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let valueIndex = 1;

      // Add filter conditions
      if (filters.startDate) {
        whereConditions.push(`c.class_date >= $${valueIndex}`);
        values.push(filters.startDate);
        valueIndex++;
      }

      if (filters.endDate) {
        whereConditions.push(`c.class_date <= $${valueIndex}`);
        values.push(filters.endDate);
        valueIndex++;
      }

      if (filters.status) {
        whereConditions.push(`c.status = $${valueIndex}`);
        values.push(filters.status);
        valueIndex++;
      }

      if (filters.instructor) {
        whereConditions.push(`c.instructor_id = $${valueIndex}`);
        values.push(filters.instructor);
        valueIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM classes c ${whereClause}`;
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const limit = Math.min(filters.limit || 20, 100);
      const offset = filters.offset || 0;
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'DESC';

      const dataQuery = `
        SELECT c.*, i.name as instructor_name
        FROM classes c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        ${whereClause}
        ORDER BY c.${orderBy} ${orderDirection}
        LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
      `;

      values.push(limit, offset);
      const dataResult = await database.query(dataQuery, values);

      const data = dataResult.rows.map(row => this.mapDatabaseRowToClass(row));

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
          hasNext: Math.floor(offset / limit) + 1 < Math.ceil(total / limit),
          hasPrev: Math.floor(offset / limit) + 1 > 1
        }
      };

    } catch (error) {
      throw new ServiceError('Failed to retrieve classes');
    }
  }

  /**
   * Updates an existing class
   * @param {string} classId - The class ID to update
   * @param {UpdateClassRequest} updateData - The data to update
   * @returns {Promise<ClassType>} The updated class object
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async update(classId: string, updateData: UpdateClassRequest): Promise<ClassType> {
    try {
      const existingClass = await this.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      if (updateData.name !== undefined) {
        updateFields.push(`name = $${valueIndex}`);
        values.push(updateData.name);
        valueIndex++;
      }

      if (updateData.description !== undefined) {
        updateFields.push(`description = $${valueIndex}`);
        values.push(updateData.description);
        valueIndex++;
      }

      if (updateData.instructorId !== undefined) {
        updateFields.push(`instructor_id = $${valueIndex}`);
        values.push(updateData.instructorId);
        valueIndex++;
      }

      if (updateData.classType !== undefined) {
        updateFields.push(`class_type = $${valueIndex}`);
        values.push(updateData.classType);
        valueIndex++;
      }

      if (updateData.classDate !== undefined) {
        updateFields.push(`class_date = $${valueIndex}`);
        values.push(updateData.classDate);
        valueIndex++;
      }

      if (updateData.startTime !== undefined) {
        updateFields.push(`start_time = $${valueIndex}`);
        values.push(updateData.startTime);
        valueIndex++;
      }

      if (updateData.endTime !== undefined) {
        updateFields.push(`end_time = $${valueIndex}`);
        values.push(updateData.endTime);
        valueIndex++;
      }

      if (updateData.durationMinutes !== undefined) {
        updateFields.push(`duration_minutes = $${valueIndex}`);
        values.push(updateData.durationMinutes);
        valueIndex++;
      }

      if (updateData.maxCapacity !== undefined) {
        updateFields.push(`max_capacity = $${valueIndex}`);
        values.push(updateData.maxCapacity);
        valueIndex++;
      }

      if (updateData.price !== undefined) {
        updateFields.push(`price = $${valueIndex}`);
        values.push(updateData.price);
        valueIndex++;
      }

      if (updateData.location !== undefined) {
        updateFields.push(`location = $${valueIndex}`);
        values.push(updateData.location);
        valueIndex++;
      }

      if (updateData.room !== undefined) {
        updateFields.push(`room = $${valueIndex}`);
        values.push(updateData.room);
        valueIndex++;
      }

      if (updateData.equipmentNeeded !== undefined) {
        updateFields.push(`equipment_needed = $${valueIndex}`);
        values.push(updateData.equipmentNeeded ? JSON.stringify(updateData.equipmentNeeded) : null);
        valueIndex++;
      }

      if (updateData.difficultyLevel !== undefined) {
        updateFields.push(`difficulty_level = $${valueIndex}`);
        values.push(updateData.difficultyLevel);
        valueIndex++;
      }

      if (updateData.tags !== undefined) {
        updateFields.push(`tags = $${valueIndex}`);
        values.push(updateData.tags ? JSON.stringify(updateData.tags) : null);
        valueIndex++;
      }

      if (updateData.status !== undefined) {
        updateFields.push(`status = $${valueIndex}`);
        values.push(updateData.status);
        valueIndex++;
      }

      if (updateFields.length === 0) {
        return existingClass;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(classId);

      const query = `
        UPDATE classes 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await database.query(query, values);
      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to update class');
    }
  }

  /**
   * Deletes a class
   * @param {string} classId - The class ID to delete
   * @returns {Promise<void>}
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async delete(classId: string): Promise<void> {
    try {
      const existingClass = await this.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      const query = 'DELETE FROM classes WHERE id = $1';
      await database.query(query, [classId]);

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete class');
    }
  }

  /**
   * Gets class statistics
   * @param {string} classId - The class ID to get statistics for
   * @returns {Promise<any>} The class statistics
   * @throws {ServiceError} When database operation fails
   */
  static async getClassStatistics(classId: string): Promise<any> {
    try {
      const query = `
        SELECT * FROM class_statistics 
        WHERE id = $1
      `;
      
      const result = await database.query(query, [classId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return result.rows[0];
    } catch (error) {
      throw new ServiceError('Failed to get class statistics');
    }
  }

  /**
   * Searches classes with full-text search capabilities
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<PaginatedResponse<ClassType>>} Search results
   * @throws {ServiceError} When database operation fails
   */
  static async search(searchParams: {
    query: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<ClassType>> {
    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let valueIndex = 1;

      // Add search query condition
      whereConditions.push(`to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')) @@ plainto_tsquery('english', $${valueIndex})`);
      values.push(searchParams.query);
      valueIndex++;

      // Add date range conditions if provided
      if (searchParams.startDate) {
        whereConditions.push(`c.class_date >= $${valueIndex}`);
        values.push(searchParams.startDate);
        valueIndex++;
      }

      if (searchParams.endDate) {
        whereConditions.push(`c.class_date <= $${valueIndex}`);
        values.push(searchParams.endDate);
        valueIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM classes c ${whereClause}`;
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const limit = Math.min(searchParams.limit || 20, 100);
      const offset = searchParams.offset || 0;
      const dataQuery = `
        SELECT c.*, i.name as instructor_name, ts_rank(to_tsvector('english', c.name || ' ' || COALESCE(c.description, '')), plainto_tsquery('english', $1)) as rank
        FROM classes c
        LEFT JOIN instructors i ON c.instructor_id = i.id
        ${whereClause} 
        ORDER BY rank DESC, c.created_at DESC
        LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
      `;

      values.push(limit, offset);
      const dataResult = await database.query(dataQuery, values);

      const data = dataResult.rows.map(row => this.mapDatabaseRowToClass(row));

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          currentPage: Math.floor(offset / limit) + 1,
          hasNext: Math.floor(offset / limit) + 1 < Math.ceil(total / limit),
          hasPrev: Math.floor(offset / limit) + 1 > 1
        }
      };

    } catch (error) {
      throw new ServiceError('Failed to search classes');
    }
  }

  /**
   * Maps database row to Class object with proper camelCase conversion
   * @param {any} row - Database row object
   * @returns {ClassType} Mapped class object
   * @private
   */
  private static mapDatabaseRowToClass(row: any): ClassType {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      instructorId: row.instructor_id,
      classType: row.class_type,
      classDate: new Date(row.class_date),
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      maxCapacity: row.max_capacity,
      price: row.price,
      location: row.location,
      room: row.room,
      equipmentNeeded: row.equipment_needed ? JSON.parse(row.equipment_needed) : undefined,
      difficultyLevel: row.difficulty_level,
      tags: row.tags ? JSON.parse(row.tags) : undefined,
      status: row.status,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  /**
   * Validates class requirements
   * @param {CreateClassRequest} classData - The class data to validate
   * @throws {ValidationError} When validation fails
   */
  private static validateClassRequirements(classData: CreateClassRequest): void {
    if (!classData.name || classData.name.trim() === '') {
      throw new ValidationError('Class name is required');
    }

    if (!classData.instructorId || classData.instructorId.trim() === '') {
      throw new ValidationError('Instructor ID is required');
    }

    if (!classData.classType || classData.classType.trim() === '') {
      throw new ValidationError('Class type is required');
    }

    if (!classData.classDate) {
      throw new ValidationError('Class date is required');
    }

    if (!classData.startTime || classData.startTime.trim() === '') {
      throw new ValidationError('Start time is required');
    }

    if (!classData.endTime || classData.endTime.trim() === '') {
      throw new ValidationError('End time is required');
    }

    if (!classData.durationMinutes || classData.durationMinutes < 15 || classData.durationMinutes > 480) {
      throw new ValidationError('Duration must be between 15 and 480 minutes');
    }

    if (!classData.maxCapacity || classData.maxCapacity < 1 || classData.maxCapacity > 100) {
      throw new ValidationError('Max capacity must be between 1 and 100');
    }

    // Validate date is in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const classDate = new Date(classData.classDate);
    classDate.setHours(0, 0, 0, 0);
    
    if (classDate < today) {
      throw new ValidationError('Class date must be in the future');
    }

    // Validate time format and logic
    const startTime = classData.startTime;
    const endTime = classData.endTime;
    
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      throw new ValidationError('Invalid start time format (HH:MM)');
    }
    
    if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime)) {
      throw new ValidationError('Invalid end time format (HH:MM)');
    }
    
    if (startTime >= endTime) {
      throw new ValidationError('End time must be after start time');
    }
  }
}

export default Class; 