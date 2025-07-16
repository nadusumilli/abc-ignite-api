import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import Member from '../models/Member';
import { 
  Member as MemberType, 
  CreateMemberRequest, 
  UpdateMemberRequest, 
  MemberFilters, 
  PaginatedResponse 
} from '../types';

/**
 * Member service with comprehensive business logic
 * Handles all member-related operations with validation and error handling
 * Optimized for maximum performance and clean code
 */
class MemberService {
  /**
   * Creates a new member with comprehensive validation
   * @param {CreateMemberRequest} memberData - The member data to create
   * @returns {Promise<MemberType>} The created member object
   * @throws {ValidationError} When validation fails or member already exists
   * @throws {ServiceError} When database operation fails
   */
  static async createMember(memberData: CreateMemberRequest): Promise<MemberType> {
    try {
      // Validate required fields
      if (!memberData.name || !memberData.email) {
        throw new ValidationError('Name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(memberData.email)) {
        throw new ValidationError('Invalid email format');
      }

      // Check if member with email already exists
      const existingMember = await Member.findByEmail(memberData.email);
      if (existingMember) {
        throw new ValidationError('A member with this email already exists');
      }

      // Validate phone number if provided
      if (memberData.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(memberData.phone.replace(/[\s\-\(\)]/g, ''))) {
          throw new ValidationError('Invalid phone number format');
        }
      }

      // Validate date of birth if provided
      if (memberData.dateOfBirth) {
        const dob = new Date(memberData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        
        if (age < 13 || age > 100) {
          throw new ValidationError('Date of birth must be for a person between 13 and 100 years old');
        }
      }

      // Validate emergency contact phone if provided
      if (memberData.emergencyContactPhone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(memberData.emergencyContactPhone.replace(/[\s\-\(\)]/g, ''))) {
          throw new ValidationError('Invalid emergency contact phone number format');
        }
      }

      // Create member
      const member = await Member.create(memberData);
      return member;

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to create member');
    }
  }

  /**
   * Gets a member by ID
   * @param {string} id - The member ID
   * @returns {Promise<MemberType>} The member object
   * @throws {NotFoundError} When member is not found
   * @throws {ServiceError} When database operation fails
   */
  static async getMemberById(id: string): Promise<MemberType> {
    try {
      const member = await Member.findById(id);
      if (!member) {
        throw new NotFoundError('Member not found');
      }
      return member;

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to get member');
    }
  }

  /**
   * Gets a member by email
   * @param {string} email - The member email
   * @returns {Promise<MemberType>} The member object
   * @throws {NotFoundError} When member is not found
   * @throws {ServiceError} When database operation fails
   */
  static async getMemberByEmail(email: string): Promise<MemberType> {
    try {
      const member = await Member.findByEmail(email);
      if (!member) {
        throw new NotFoundError('Member not found');
      }
      return member;

    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to get member');
    }
  }

  /**
   * Updates a member with comprehensive validation
   * @param {string} id - The member ID
   * @param {UpdateMemberRequest} memberData - The member data to update
   * @returns {Promise<MemberType>} The updated member object
   * @throws {NotFoundError} When member is not found
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When database operation fails
   */
  static async updateMember(id: string, memberData: UpdateMemberRequest): Promise<MemberType> {
    try {
      // Check if member exists
      const existingMember = await Member.findById(id);
      if (!existingMember) {
        throw new NotFoundError('Member not found');
      }

      // Validate email format if provided
      if (memberData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(memberData.email)) {
          throw new ValidationError('Invalid email format');
        }

        // Check if email is already taken by another member
        const memberWithEmail = await Member.findByEmail(memberData.email);
        if (memberWithEmail && memberWithEmail.id !== id) {
          throw new ValidationError('A member with this email already exists');
        }
      }

      // Validate phone number if provided
      if (memberData.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(memberData.phone.replace(/[\s\-\(\)]/g, ''))) {
          throw new ValidationError('Invalid phone number format');
        }
      }

      // Validate date of birth if provided
      if (memberData.dateOfBirth) {
        const dob = new Date(memberData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        
        if (age < 13 || age > 100) {
          throw new ValidationError('Date of birth must be for a person between 13 and 100 years old');
        }
      }

      // Validate emergency contact phone if provided
      if (memberData.emergencyContactPhone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(memberData.emergencyContactPhone.replace(/[\s\-\(\)]/g, ''))) {
          throw new ValidationError('Invalid emergency contact phone number format');
        }
      }

      // Update member
      const member = await Member.update(id, memberData);
      return member;

    } catch (error) {
      if (error instanceof NotFoundError || error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to update member');
    }
  }

  /**
   * Deletes a member
   * @param {string} id - The member ID
   * @returns {Promise<boolean>} True if member was deleted
   * @throws {NotFoundError} When member is not found
   * @throws {ServiceError} When database operation fails
   */
  static async deleteMember(id: string): Promise<boolean> {
    try {
      // Check if member exists
      const existingMember = await Member.findById(id);
      if (!existingMember) {
        throw new NotFoundError('Member not found');
      }

      // Delete member
      const result = await Member.delete(id);
      return result;

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
  static async getAllMembers(filters: MemberFilters = {}): Promise<PaginatedResponse<MemberType>> {
    try {
      const result = await Member.getAll(filters);
      return result;

    } catch (error) {
      throw new ServiceError('Failed to get members');
    }
  }

  /**
   * Gets member statistics
   * @returns {Promise<any>} Member statistics
   * @throws {ServiceError} When database operation fails
   */
  static async getMemberStatistics(): Promise<any> {
    try {
      const statistics = await Member.getStatistics();
      return statistics;

    } catch (error) {
      throw new ServiceError('Failed to get member statistics');
    }
  }

  /**
   * Creates a member if it doesn't exist, or returns existing member
   * @param {CreateMemberRequest} memberData - The member data
   * @returns {Promise<MemberType>} The member object (created or existing)
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When database operation fails
   */
  static async createMemberIfNotExists(memberData: CreateMemberRequest): Promise<MemberType> {
    try {
      
      // Check if member with email already exists
      const existingMember = await Member.findByEmail(memberData.email);
      if (existingMember) {
        return existingMember;
      }

      // Create new member
      const member = await this.createMember(memberData);
      return member;

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to create or find member');
    }
  }
}

export default MemberService; 