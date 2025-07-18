import database from '../config/database';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import { 
  Member as MemberType, 
  CreateMemberRequest, 
  UpdateMemberRequest, 
  MemberFilters, 
  PaginatedResponse 
} from '../types';

/**
 * Member model with comprehensive database operations
 * Handles all member-related database interactions with validation and error handling
 * Optimized for maximum performance with connection pooling and query optimization
 */
class Member {
  /**
   * Creates a new member in the database
   * @param {CreateMemberRequest} memberData - The member data to create
   * @returns {Promise<MemberType>} The created member object
   * @throws {ValidationError} When validation fails or member already exists
   * @throws {ServiceError} When database operation fails
   */
  static async create(memberData: CreateMemberRequest): Promise<MemberType> {
    try {
      const query = `
        INSERT INTO members (
          name, email, phone, date_of_birth, membership_type,
          membership_status, emergency_contact_name, emergency_contact_phone,
          medical_notes, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING *
      `;

      const values = [
        memberData.name,
        memberData.email,
        memberData.phone || null,
        memberData.dateOfBirth || null,
        memberData.membershipType || 'standard',
        'active',
        memberData.emergencyContactName || null,
        memberData.emergencyContactPhone || null,
        memberData.medicalNotes || null
      ];

      const result = await database.query(query, values);
      return this.mapDatabaseRowToMember(result.rows[0]);

    } catch (error) {
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('A member with this email already exists');
      }
      throw new ServiceError('Failed to create member');
    }
  }

  /**
   * Finds a member by ID
   * @param {string} id - The member ID
   * @returns {Promise<MemberType | null>} The found member or null
   * @throws {ServiceError} When database operation fails
   */
  static async findById(id: string): Promise<MemberType | null> {
    try {
      const query = `
        SELECT * FROM members 
        WHERE id = $1
      `;
      
      const result = await database.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseRowToMember(result.rows[0]);

    } catch (error) {
      throw new ServiceError('Failed to find member by ID');
    }
  }

  /**
   * Finds a member by email
   * @param {string} email - The member email
   * @returns {Promise<MemberType | null>} The found member or null
   * @throws {ServiceError} When database operation fails
   */
  static async findByEmail(email: string): Promise<MemberType | null> {
    if (!email) {
      return null;
    }

    try {
      const query = `
        SELECT * FROM members 
        WHERE email = $1
      `;
      
      const result = await database.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapDatabaseRowToMember(result.rows[0]);

    } catch (error) {
      throw new ServiceError('Failed to find member by email');
    }
  }

  /**
   * Updates a member in the database
   * @param {string} id - The member ID
   * @param {UpdateMemberRequest} memberData - The member data to update
   * @returns {Promise<MemberType>} The updated member object
   * @throws {NotFoundError} When member is not found
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When database operation fails
   */
  static async update(id: string, memberData: UpdateMemberRequest): Promise<MemberType> {
    try {
      // Check if member exists
      const existingMember = await this.findById(id);
      if (!existingMember) {
        throw new NotFoundError('Member not found');
      }

      // Build dynamic query based on provided fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      if (memberData.name !== undefined) {
        updateFields.push(`name = $${paramCount++}`);
        values.push(memberData.name);
      }

      if (memberData.email !== undefined) {
        updateFields.push(`email = $${paramCount++}`);
        values.push(memberData.email);
      }

      if (memberData.phone !== undefined) {
        updateFields.push(`phone = $${paramCount++}`);
        values.push(memberData.phone);
      }

      if (memberData.dateOfBirth !== undefined) {
        updateFields.push(`date_of_birth = $${paramCount++}`);
        values.push(memberData.dateOfBirth);
      }

      if (memberData.membershipType !== undefined) {
        updateFields.push(`membership_type = $${paramCount++}`);
        values.push(memberData.membershipType);
      }

      if (memberData.membershipStatus !== undefined) {
        updateFields.push(`membership_status = $${paramCount++}`);
        values.push(memberData.membershipStatus);
      }

      if (memberData.emergencyContactName !== undefined) {
        updateFields.push(`emergency_contact_name = $${paramCount++}`);
        values.push(memberData.emergencyContactName);
      }

      if (memberData.emergencyContactPhone !== undefined) {
        updateFields.push(`emergency_contact_phone = $${paramCount++}`);
        values.push(memberData.emergencyContactPhone);
      }

      if (memberData.medicalNotes !== undefined) {
        updateFields.push(`medical_notes = $${paramCount++}`);
        values.push(memberData.medicalNotes);
      }

      if (updateFields.length === 0) {
        return existingMember;
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(id);

      const query = `
        UPDATE members 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await database.query(query, values);
      return this.mapDatabaseRowToMember(result.rows[0]);

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      if ((error as any).code === '23505') { // Unique constraint violation
        throw new ValidationError('A member with this email already exists');
      }
      throw new ServiceError('Failed to update member');
    }
  }

  /**
   * Deletes a member from the database
   * @param {string} id - The member ID
   * @returns {Promise<boolean>} True if member was deleted
   * @throws {NotFoundError} When member is not found
   * @throws {ServiceError} When database operation fails
   */
  static async delete(id: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM members 
        WHERE id = $1
      `;
      
      const result = await database.query(query, [id]);

      if (result.rowCount === 0) {
        throw new NotFoundError('Member not found');
      }

      return true;

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete member');
    }
  }

  /**
   * Gets all members with pagination and filtering
   * @param {MemberFilters} filters - Filter options
   * @returns {Promise<PaginatedResponse<MemberType>>} Paginated members
   * @throws {ServiceError} When database operation fails
   */
  static async getAll(filters: MemberFilters = {}): Promise<PaginatedResponse<MemberType>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        membershipStatus,
        membershipType,
        sortBy = 'created_at',
        sortOrder = 'desc'
      } = filters;

      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const values: any[] = [];
      let paramCount = 1;

      // Add search condition
      if (search) {
        conditions.push(`(
          name ILIKE $${paramCount} OR 
          email ILIKE $${paramCount} OR 
          phone ILIKE $${paramCount}
        )`);
        values.push(`%${search}%`);
        paramCount++;
      }

      // Add membership status filter
      if (membershipStatus) {
        conditions.push(`membership_status = $${paramCount++}`);
        values.push(membershipStatus);
      }

      // Add membership type filter
      if (membershipType) {
        conditions.push(`membership_type = $${paramCount++}`);
        values.push(membershipType);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      // Get total count
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM members 
        ${whereClause}
      `;
      
      const countResult = await database.query(countQuery, values);
      const total = parseInt(countResult.rows[0].total);

      // Get paginated results
      const dataQuery = `
        SELECT * FROM members 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder.toUpperCase()}
        LIMIT $${paramCount++} OFFSET $${paramCount++}
      `;
      
      const dataValues = [...values, limit, offset];
      const dataResult = await database.query(dataQuery, dataValues);

      const members = dataResult.rows.map(row => this.mapDatabaseRowToMember(row));

      return {
        data: members,
        pagination: {
          total,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: Math.ceil(total / limit),
          hasNext: Math.floor(offset / limit) + 1 < Math.ceil(total / limit),
          hasPrev: Math.floor(offset / limit) + 1 > 1
        }
      };

    } catch (error) {
      throw new ServiceError('Failed to get members');
    }
  }

  /**
   * Searches members with full-text search capabilities
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query string
   * @param {number} [searchParams.limit=20] - Maximum number of results
   * @param {number} [searchParams.offset=0] - Number of results to skip
   * @returns {Promise<PaginatedResponse<MemberType>>} Search results with pagination
   * @throws {ServiceError} When operation fails
   */
  static async search(searchParams: {
    query: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<MemberType>> {
    try {
      const { query, limit = 20, offset = 0 } = searchParams;

      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      // Count query
      const countQuery = `
        SELECT COUNT(*) 
        FROM members 
        WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
      `;

      const countResult = await database.query(countQuery, [`%${query.trim()}%`]);
      const total = parseInt(countResult.rows[0].count);

      // Data query
      const dataQuery = `
        SELECT * FROM members 
        WHERE name ILIKE $1 OR email ILIKE $1 OR phone ILIKE $1
        ORDER BY name ASC
        LIMIT $2 OFFSET $3
      `;

      const dataResult = await database.query(dataQuery, [
        `%${query.trim()}%`,
        limit,
        offset
      ]);

      const members = dataResult.rows.map(row => this.mapDatabaseRowToMember(row));

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);
      
      return {
        data: members,
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
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to search members');
    }
  }

  /**
   * Gets member statistics
   * @returns {Promise<any>} Member statistics
   * @throws {ServiceError} When database operation fails
   */
  static async getStatistics(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_members,
          COUNT(CASE WHEN membership_status = 'active' THEN 1 END) as active_members,
          COUNT(CASE WHEN membership_status = 'inactive' THEN 1 END) as inactive_members,
          COUNT(CASE WHEN membership_status = 'suspended' THEN 1 END) as suspended_members,
          COUNT(CASE WHEN membership_status = 'expired' THEN 1 END) as expired_members,
          COUNT(CASE WHEN membership_type = 'standard' THEN 1 END) as standard_members,
          COUNT(CASE WHEN membership_type = 'premium' THEN 1 END) as premium_members,
          COUNT(CASE WHEN membership_type = 'vip' THEN 1 END) as vip_members
        FROM members
      `;
      
      const result = await database.query(query);
      return result.rows[0];

    } catch (error) {
      throw new ServiceError('Failed to get member statistics');
    }
  }

  /**
   * Maps database row to Member object with proper camelCase conversion
   * @param {any} row - Database row object
   * @returns {MemberType} Mapped member object
   * @private
   */
  private static mapDatabaseRowToMember(row: any): MemberType {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      ...(row.date_of_birth && { dateOfBirth: new Date(row.date_of_birth) }),
      membershipType: row.membership_type,
      membershipStatus: row.membership_status,
      emergencyContactName: row.emergency_contact_name,
      emergencyContactPhone: row.emergency_contact_phone,
      medicalNotes: row.medical_notes,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

export default Member; 