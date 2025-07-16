import database from '../config/database';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';

interface Instructor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: Date;
  updatedAt: Date;
}

interface CreateInstructorRequest {
  name: string;
  email: string;
  phone?: string;
  specialization?: string;
  bio?: string;
}

interface UpdateInstructorRequest {
  name?: string;
  email?: string;
  phone?: string;
  specialization?: string;
  bio?: string;
  status?: 'active' | 'inactive' | 'suspended';
}

class Instructor {
  /**
   * Creates a new instructor in the database
   * @param {CreateInstructorRequest} instructorData - The instructor data to create
   * @returns {Promise<Instructor>} The created instructor object
   * @throws {ValidationError} When validation fails or instructor already exists
   * @throws {ServiceError} When database operation fails
   */
  static async create(instructorData: CreateInstructorRequest): Promise<Instructor> {
    try {
      // Validate required fields
      if (!instructorData.name || !instructorData.email) {
        throw new ValidationError('Name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(instructorData.email)) {
        throw new ValidationError('Invalid email format');
      }

      const query = `
        INSERT INTO instructors (name, email, phone, specialization, bio, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `;

      const values = [
        instructorData.name,
        instructorData.email,
        instructorData.phone || null,
        instructorData.specialization || null,
        instructorData.bio || null,
        'active'
      ];

      const result = await database.query(query, values);
      return this.mapDatabaseRowToInstructor(result.rows[0]);

    } catch (error) {
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('An instructor with this email already exists');
      }
      throw new ServiceError('Failed to create instructor');
    }
  }

  /**
   * Finds an instructor by their ID
   * @param {string} id - The instructor ID to find
   * @returns {Promise<Instructor | null>} The found instructor or null if not found
   * @throws {ServiceError} When database operation fails
   */
  static async findById(id: string): Promise<Instructor | null> {
    try {
      const query = 'SELECT * FROM instructors WHERE id = $1';
      const result = await database.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseRowToInstructor(result.rows[0]);
    } catch (error) {
      throw new ServiceError('Failed to retrieve instructor');
    }
  }

  /**
   * Finds all instructors with optional filtering
   * @param {Object} filters - Optional filter criteria
   * @returns {Promise<Instructor[]>} Array of instructors
   * @throws {ServiceError} When database operation fails
   */
  static async findAll(filters: { status?: string; specialization?: string } = {}): Promise<Instructor[]> {
    try {
      let whereConditions: string[] = [];
      let values: any[] = [];
      let valueIndex = 1;

      if (filters.status) {
        whereConditions.push(`status = $${valueIndex}`);
        values.push(filters.status);
        valueIndex++;
      }

      if (filters.specialization) {
        whereConditions.push(`specialization ILIKE $${valueIndex}`);
        values.push(`%${filters.specialization}%`);
        valueIndex++;
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
      const query = `SELECT * FROM instructors ${whereClause} ORDER BY name ASC`;

      const result = await database.query(query, values);
      return result.rows.map((row: any) => this.mapDatabaseRowToInstructor(row));
    } catch (error) {
      throw new ServiceError('Failed to retrieve instructors');
    }
  }

  /**
   * Updates an existing instructor
   * @param {string} id - The instructor ID to update
   * @param {UpdateInstructorRequest} updateData - The data to update
   * @returns {Promise<Instructor>} The updated instructor object
   * @throws {ValidationError} When validation fails or no fields to update
   * @throws {NotFoundError} When instructor is not found
   * @throws {ServiceError} When database operation fails
   */
  static async update(id: string, updateData: UpdateInstructorRequest): Promise<Instructor> {
    try {
      const setClauses: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build SET clauses dynamically
      Object.entries(updateData).forEach(([key, value]) => {
        if (value !== undefined) {
          const dbField = this.camelToSnake(key);
          setClauses.push(`${dbField} = $${valueIndex}`);
          values.push(value);
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
        UPDATE instructors 
        SET ${setClauses.join(', ')} 
        WHERE id = $${valueIndex} 
        RETURNING *
      `;

      const result = await database.query(query, values);

      if (result.rows.length === 0) {
        throw new NotFoundError('Instructor not found');
      }

      return this.mapDatabaseRowToInstructor(result.rows[0]);
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('An instructor with this email already exists');
      }
      throw new ServiceError('Failed to update instructor');
    }
  }

  /**
   * Deletes an instructor
   * @param {string} id - The instructor ID to delete
   * @returns {Promise<void>}
   * @throws {NotFoundError} When instructor is not found
   * @throws {ServiceError} When database operation fails
   */
  static async delete(id: string): Promise<void> {
    try {
      // Check if instructor exists
      const existingInstructor = await this.findById(id);
      if (!existingInstructor) {
        throw new NotFoundError('Instructor not found');
      }

      // Check if instructor has active classes
      const activeClassesQuery = `
        SELECT COUNT(*) FROM classes 
        WHERE instructor_id = $1 AND status = 'active'
      `;
      const activeClassesResult = await database.query(activeClassesQuery, [id]);
      const activeClassesCount = parseInt(activeClassesResult.rows[0].count);

      if (activeClassesCount > 0) {
        throw new ValidationError('Cannot delete instructor with active classes');
      }

      const query = 'DELETE FROM instructors WHERE id = $1';
      const result = await database.query(query, [id]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Instructor not found');
      }
    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete instructor');
    }
  }

  /**
   * Searches instructors by name or specialization
   * @param {string} query - Search query
   * @returns {Promise<Instructor[]>} Array of matching instructors
   * @throws {ServiceError} When database operation fails
   */
  static async search(query: string): Promise<Instructor[]> {
    try {
      const searchQuery = `
        SELECT * FROM instructors 
        WHERE name ILIKE $1 OR specialization ILIKE $1 OR bio ILIKE $1
        ORDER BY name ASC
      `;
      const result = await database.query(searchQuery, [`%${query}%`]);
      return result.rows.map((row: any) => this.mapDatabaseRowToInstructor(row));
    } catch (error) {
      throw new ServiceError('Failed to search instructors');
    }
  }

  /**
   * Maps database row to Instructor object
   * @param {any} row - Database row object
   * @returns {Instructor} Mapped instructor object
   * @private
   */
  private static mapDatabaseRowToInstructor(row: any): Instructor {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      specialization: row.specialization,
      bio: row.bio,
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

export default Instructor;
export type { Instructor, CreateInstructorRequest, UpdateInstructorRequest }; 