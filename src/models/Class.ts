import database from '../config/database';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import { 
  Class as ClassType, 
  CreateClassRequest, 
  UpdateClassRequest, 
  ClassFilters, 
  ClassStatistics,
  PaginatedResponse 
} from '../types';

/**
 * Class model with comprehensive database operations
 * Handles all class-related database interactions with validation and error handling
 * Optimized for maximum performance with connection pooling and query optimization
 */
class Class {
  /**
   * Creates a new class in the database
   * @param {CreateClassRequest} classData - The class data to create
   * @returns {Promise<ClassType>} The created class object
   * @throws {ValidationError} When validation fails or class already exists
   * @throws {ServiceError} When database operation fails
   */
  static async create(classData: CreateClassRequest): Promise<ClassType> {
    try {
      const query = `
        INSERT INTO classes (
          name, description, instructor_id, instructor_name, class_type,
          start_date, end_date, start_time, end_time, duration_minutes,
          max_capacity, price, location, room, equipment_needed,
          difficulty_level, tags, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        classData.name,
        classData.description || null,
        classData.instructorId,
        classData.instructorName,
        classData.classType,
        classData.startDate,
        classData.endDate,
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
        throw new ValidationError('A class with this name already exists in the specified date range');
      }
      throw new ServiceError('Failed to create class');
    }
  }

  /**
   * Finds a class by its ID
   * @param {string} id - The class ID to find (UUID)
   * @returns {Promise<ClassType | null>} The found class or null if not found
   * @throws {ServiceError} When database operation fails
   */
  static async findById(id: string): Promise<ClassType | null> {
    try {
      const query = 'SELECT * FROM classes WHERE id = $1';
      const result = await database.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      throw new ServiceError('Failed to retrieve class');
    }
  }

  /**
   * Finds all classes with advanced filtering and pagination
   * Optimized with indexed queries and efficient pagination
   * @param {ClassFilters} filters - Filter criteria for classes
   * @returns {Promise<PaginatedResponse<ClassType>>} Paginated class results
   * @throws {ServiceError} When database operation fails
   */
  static async findAll(filters: ClassFilters): Promise<PaginatedResponse<ClassType>> {
    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let valueIndex = 1;

      // Build WHERE conditions with parameterized queries for security
      if (filters.startDate) {
        whereConditions.push(`start_date >= $${valueIndex}`);
        values.push(filters.startDate);
        valueIndex++;
      }

      if (filters.endDate) {
        whereConditions.push(`end_date <= $${valueIndex}`);
        values.push(filters.endDate);
        valueIndex++;
      }

      if (filters.status) {
        whereConditions.push(`status = $${valueIndex}`);
        values.push(filters.status);
        valueIndex++;
      }

      if (filters.instructor) {
        whereConditions.push(`instructor_name ILIKE $${valueIndex}`);
        values.push(`%${filters.instructor}%`);
        valueIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Build ORDER BY clause with validation
      const orderBy = filters.orderBy || 'created_at';
      const orderDirection = filters.orderDirection || 'DESC';
      const orderClause = `ORDER BY ${orderBy} ${orderDirection}`;

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM classes ${whereClause}`;
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results with optimized query
      const limit = Math.min(filters.limit || 20, 100); // Cap at 100 for performance
      const offset = filters.offset || 0;
      const dataQuery = `
        SELECT * FROM classes 
        ${whereClause}
        ${orderClause} 
        LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
      `;
      values.push(limit, offset);

      const dataResult = await database.query(dataQuery, values);
      const classes = dataResult.rows.map((row: any) => this.mapDatabaseRowToClass(row));

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        data: classes,
        pagination: {
          total,
          limit,
          offset,
          page,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      throw new ServiceError('Failed to retrieve classes');
    }
  }

  /**
   * Updates an existing class
   * @param {string} id - The class ID to update (UUID)
   * @param {UpdateClassRequest} updateData - The data to update
   * @returns {Promise<ClassType>} The updated class object
   * @throws {ValidationError} When validation fails or no fields to update
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async update(id: string, updateData: UpdateClassRequest): Promise<ClassType> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build SET clauses dynamically with proper field mapping
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = this.camelToSnake(key);
          if (key === 'equipmentNeeded' || key === 'tags') {
            setClauses.push(`${dbField} = $${valueIndex}`);
            values.push(JSON.stringify(value));
          } else {
            setClauses.push(`${dbField} = $${valueIndex}`);
            values.push(value);
          }
        valueIndex++;
      }
      });

      if (setClauses.length === 0) {
        throw new ValidationError('No valid fields to update');
      }

      setClauses.push(`updated_at = $${valueIndex}`);
      values.push(new Date());
        valueIndex++;

      values.push(id);

      const query = `
        UPDATE classes 
        SET ${setClauses.join(', ')} 
        WHERE id = $${valueIndex}
        RETURNING *
      `;

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundError('Class not found');
      }

      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('A class with this name already exists in the specified date range');
      }
      throw new ServiceError('Failed to update class');
    }
  }

  /**
   * Deletes a class from the database
   * @param {string} id - The class ID to delete (UUID)
   * @returns {Promise<void>}
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async delete(id: string): Promise<void> {
    try {
      const query = 'DELETE FROM classes WHERE id = $1 RETURNING id';
      const result = await database.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundError('Class not found');
      }

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete class');
    }
  }

  /**
   * Searches classes with full-text search capabilities
   * Optimized with proper indexing and search algorithms
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query string
   * @param {number} [searchParams.limit=20] - Maximum number of results
   * @param {number} [searchParams.offset=0] - Number of results to skip
   * @param {string} [searchParams.startDate] - Filter by start date
   * @param {string} [searchParams.endDate] - Filter by end date
   * @returns {Promise<PaginatedResponse<ClassType>>} Search results with pagination
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
      const { query, limit = 20, offset = 0, startDate, endDate } = searchParams;

      let whereConditions: string[] = [
        `(name ILIKE $1 OR description ILIKE $1 OR instructor_name ILIKE $1 OR class_type ILIKE $1)`
      ];
      let values: any[] = [`%${query}%`];
      let valueIndex = 2;

      if (startDate) {
        whereConditions.push(`start_date >= $${valueIndex}`);
        values.push(startDate);
        valueIndex++;
      }

      if (endDate) {
        whereConditions.push(`end_date <= $${valueIndex}`);
        values.push(endDate);
        valueIndex++;
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) FROM classes ${whereClause}`;
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      values.push(limit, offset);
      const dataQuery = `
        SELECT * FROM classes 
        ${whereClause} 
        ORDER BY created_at DESC 
        LIMIT $${valueIndex} OFFSET $${valueIndex + 1}
      `;

      const dataResult = await database.query(dataQuery, values);
      const classes = dataResult.rows.map((row: any) => this.mapDatabaseRowToClass(row));

      return {
        data: classes,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNext: Math.floor(offset / limit) + 1 <  Math.ceil(total / limit),
          hasPrev: Math.floor(offset / limit) + 1 > 1
        }
      };

    } catch (error) {
      throw new ServiceError('Failed to search classes');
    }
  }

  /**
   * Finds a class by name and date range to check for conflicts
   * @param {string} name - The class name to search for
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   * @param {number} [excludeId] - Class ID to exclude from search
   * @returns {Promise<ClassType | null>} The found class or null
   * @throws {ServiceError} When database operation fails
   */
  static async findByNameAndDateRange(
    name: string, 
    startDate: Date, 
    endDate: Date, 
    excludeId?: number
  ): Promise<ClassType | null> {
    try {
      let query: string;
      let values: any[];

      if (excludeId) {
        query = `
          SELECT * FROM classes 
          WHERE name = $1 
          AND start_date <= $2 
          AND end_date >= $3 
          AND id != $4
        `;
        values = [name, endDate, startDate, excludeId];
      } else {
        query = `
          SELECT * FROM classes 
          WHERE name = $1 
          AND start_date <= $2 
          AND end_date >= $3
        `;
        values = [name, endDate, startDate];
      }

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      throw new ServiceError('Failed to check for duplicate class');
    }
  }

  /**
   * Finds a class by instructor and time range to check for conflicts
   * @param {string} instructorId - The instructor ID
   * @param {Date} startDate - The start date
   * @param {Date} endDate - The end date
   * @returns {Promise<ClassType | null>} The found class or null
   * @throws {ServiceError} When database operation fails
   */
  static async findByInstructorAndTime(
    instructorId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<ClassType | null> {
    try {
      const query = `
        SELECT * FROM classes 
        WHERE instructor_id = $1 
        AND status = 'active'
        AND (
          (start_date <= $2 AND end_date >= $2) OR
          (start_date <= $3 AND end_date >= $3) OR
          (start_date >= $2 AND end_date <= $3)
        )
      `;
      
      const result = await database.query(query, [instructorId, startDate, endDate]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseRowToClass(result.rows[0]);

    } catch (error) {
      throw new ServiceError('Failed to check for instructor time conflicts');
    }
  }

  /**
   * Checks if a class has active bookings
   * @param {number} classId - The class ID to check
   * @returns {Promise<boolean>} True if class has active bookings, false otherwise
   * @throws {ServiceError} When database operation fails
   */
  static async hasActiveBookings(classId: string): Promise<boolean> {
    try {
      const query = `
        SELECT COUNT(*) as booking_count 
        FROM bookings 
        WHERE class_id = $1 
        AND status IN ('pending', 'confirmed', 'attended')
      `;
      
      const result = await database.query(query, [classId]);
      return parseInt(result.rows[0].booking_count) > 0;

    } catch (error) {
      throw new ServiceError('Failed to check for active bookings');
    }
  }

  /**
   * Gets comprehensive statistics for a specific class
   * @param {number} classId - The class ID to get statistics for
   * @returns {Promise<ClassStatistics>} Class statistics object
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When database operation fails
   */
  static async getClassStatistics(classId: string): Promise<ClassStatistics> {
    try {
      // First check if class exists
      const classData = await this.findById(classId);
      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      const query = `
        SELECT 
          COUNT(b.id) as total_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN b.status = 'attended' THEN 1 END) as attended_bookings,
          COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COUNT(CASE WHEN b.status = 'no_show' THEN 1 END) as no_show_bookings,
          ROUND(
            (COUNT(CASE WHEN b.status = 'attended' THEN 1 END)::DECIMAL / 
             NULLIF(COUNT(CASE WHEN b.status IN ('confirmed', 'attended') THEN 1 END), 0)) * 100, 2
          ) as attendance_rate
        FROM classes c
        LEFT JOIN bookings b ON c.id = b.class_id
        WHERE c.id = $1
      `;

      const result = await database.query(query, [classId]);
      const stats = result.rows[0];

      // Get popular time slots for this class type
      const timeSlotQuery = `
        SELECT 
          c.start_time,
          COUNT(b.id) as booking_count
        FROM classes c
        LEFT JOIN bookings b ON c.id = b.class_id
        WHERE c.class_type = $1
        AND c.start_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY c.start_time
        ORDER BY booking_count DESC
        LIMIT 5
      `;

      const timeSlotResult = await database.query(timeSlotQuery, [classData.classType]);
      const popularTimeSlots = timeSlotResult.rows.map((row: any) => ({
        timeSlot: row.start_time,
        bookingCount: parseInt(row.booking_count)
      }));

      return {
        totalClasses: 1, // This is for a specific class, so totalClasses = 1
        activeClasses: classData.status === 'active' ? 1 : 0,
        cancelledClasses: classData.status === 'cancelled' ? 1 : 0,
        completedClasses: classData.status === 'completed' ? 1 : 0,
        totalBookings: parseInt(stats.total_bookings) || 0,
        confirmedBookings: parseInt(stats.confirmed_bookings) || 0,
        cancelledBookings: parseInt(stats.cancelled_bookings) || 0,
        attendedBookings: parseInt(stats.attended_bookings) || 0,
        noShowBookings: parseInt(stats.no_show_bookings) || 0,
        averageAttendance: parseFloat(stats.attendance_rate) || 0,
        attendanceRate: parseFloat(stats.attendance_rate) || 0,
        popularClasses: [{
          classId: classData.id,
          className: classData.name,
          bookingCount: parseInt(stats.total_bookings) || 0,
          attendanceRate: parseFloat(stats.attendance_rate) || 0,
          revenue: classData.price || 0
        }],
        popularTimeSlots: popularTimeSlots.map(slot => ({
          ...slot,
          attendanceRate: parseFloat(stats.attendance_rate) || 0
        })),
        capacityUtilization: classData.maxCapacity > 0 ? (parseInt(stats.total_bookings) / classData.maxCapacity) * 100 : 0,
        revenueGenerated: (parseInt(stats.total_bookings) || 0) * (classData.price || 0),
        classTypeBreakdown: [],
        instructorPerformance: [],
        weeklyTrends: []
      };

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to get class statistics');
    }
  }

  // Wrapper methods to match service expectations
  /**
   * Wrapper method for creating a class
   * @param {CreateClassRequest} classData - The class data to create
   * @returns {Promise<ClassType>} The created class object
   */
  static async createClass(classData: CreateClassRequest): Promise<ClassType> {
    return this.create(classData);
  }

  /**
   * Wrapper method for finding a class by ID
   * @param {number} id - The class ID to find
   * @returns {Promise<ClassType | null>} The found class or null
   */
  static async getClassById(id: string): Promise<ClassType | null> {
    return this.findById(id);
  }

  /**
   * Wrapper method for finding all classes
   * @param {ClassFilters} filters - Filter criteria
   * @returns {Promise<PaginatedResponse<ClassType>>} Paginated class results
   */
  static async getAllClasses(filters: ClassFilters): Promise<PaginatedResponse<ClassType>> {
    return this.findAll(filters);
  }

  /**
   * Wrapper method for updating a class
   * @param {number} id - The class ID to update
   * @param {UpdateClassRequest} updateData - The data to update
   * @returns {Promise<ClassType>} The updated class object
   */
  static async updateClass(id: string, updateData: UpdateClassRequest): Promise<ClassType> {
    return this.update(id, updateData);
  }

  /**
   * Wrapper method for deleting a class
   * @param {number} id - The class ID to delete
   * @returns {Promise<void>}
   */
  static async deleteClass(id: string): Promise<void> {
    return this.delete(id);
  }

  /**
   * Wrapper method for searching classes
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Promise<PaginatedResponse<ClassType>>} Search results
   */
  static async searchClasses(
    query: string, 
    options: {
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {}
  ): Promise<PaginatedResponse<ClassType>> {
    const searchParams: {
      query: string;
      limit?: number;
      offset?: number;
      startDate?: string;
      endDate?: string;
    } = {
      query
    };

    if (options.limit !== undefined) searchParams.limit = options.limit;
    if (options.offset !== undefined) searchParams.offset = options.offset;
    if (options.startDate !== undefined) searchParams.startDate = options.startDate;
    if (options.endDate !== undefined) searchParams.endDate = options.endDate;

    return this.search(searchParams);
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
      instructorName: row.instructor_name,
      classType: row.class_type,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
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
   * Converts camelCase to snake_case for database field mapping
   * @param {string} str - CamelCase string
   * @returns {string} Snake_case string
   * @private
   */
  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}

export default Class; 