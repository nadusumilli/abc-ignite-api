import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import Instructor from '../models/Instructor';
import { CreateInstructorRequest, UpdateInstructorRequest } from '../models/Instructor';

/**
 * Instructor service with comprehensive business logic
 * Handles all instructor-related operations with validation and error handling
 */
class InstructorService {
  /**
   * Creates a new instructor with comprehensive validation
   * @param {CreateInstructorRequest} instructorData - The instructor data to create
   * @returns {Promise<Instructor>} The created instructor object
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When operation fails
   */
  static async createInstructor(instructorData: CreateInstructorRequest): Promise<Instructor> {
    try {
      // Validate instructor data
      if (!instructorData.name || !instructorData.email) {
        throw new ValidationError('Name and email are required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(instructorData.email)) {
        throw new ValidationError('Invalid email format');
      }

      // Validate name length
      if (instructorData.name.length < 2 || instructorData.name.length > 100) {
        throw new ValidationError('Name must be between 2 and 100 characters');
      }

      // Create the instructor
      return await Instructor.create(instructorData);

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to create instructor');
    }
  }

  /**
   * Gets an instructor by their ID
   * @param {string} instructorId - The instructor ID to retrieve
   * @returns {Promise<Instructor>} The found instructor object
   * @throws {ValidationError} When instructor ID is invalid
   * @throws {NotFoundError} When instructor is not found
   * @throws {ServiceError} When operation fails
   */
  static async getInstructorById(instructorId: string): Promise<Instructor> {
    try {
      if (!instructorId) {
        throw new ValidationError('Instructor ID is required');
      }

      const instructor = await Instructor.findById(instructorId);

      if (!instructor) {
        throw new NotFoundError('Instructor not found');
      }

      return instructor;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve instructor');
    }
  }

  /**
   * Gets all instructors with optional filtering
   * @param {Object} filters - Optional filter criteria
   * @returns {Promise<Instructor[]>} Array of instructors
   * @throws {ServiceError} When operation fails
   */
  static async getAllInstructors(filters: { status?: string; specialization?: string } = {}): Promise<Instructor[]> {
    try {
      return await Instructor.findAll(filters);
    } catch (error) {
      throw new ServiceError('Failed to retrieve instructors');
    }
  }

  /**
   * Updates an existing instructor
   * @param {string} instructorId - The instructor ID to update
   * @param {UpdateInstructorRequest} updateData - The data to update
   * @returns {Promise<Instructor>} The updated instructor object
   * @throws {ValidationError} When validation fails or instructor ID is invalid
   * @throws {NotFoundError} When instructor is not found
   * @throws {ServiceError} When operation fails
   */
  static async updateInstructor(instructorId: string, updateData: UpdateInstructorRequest): Promise<Instructor> {
    try {
      if (!instructorId) {
        throw new ValidationError('Instructor ID is required');
      }

      // Validate email format if being updated
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          throw new ValidationError('Invalid email format');
        }
      }

      // Validate name length if being updated
      if (updateData.name && (updateData.name.length < 2 || updateData.name.length > 100)) {
        throw new ValidationError('Name must be between 2 and 100 characters');
      }

      return await Instructor.update(instructorId, updateData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to update instructor');
    }
  }

  /**
   * Deletes an instructor
   * @param {string} instructorId - The instructor ID to delete
   * @returns {Promise<void>}
   * @throws {ValidationError} When instructor ID is invalid
   * @throws {NotFoundError} When instructor is not found
   * @throws {ServiceError} When operation fails
   */
  static async deleteInstructor(instructorId: string): Promise<void> {
    try {
      if (!instructorId) {
        throw new ValidationError('Instructor ID is required');
      }

      await Instructor.delete(instructorId);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete instructor');
    }
  }

  /**
   * Searches instructors by name, specialization, or bio
   * @param {string} query - Search query
   * @returns {Promise<Instructor[]>} Array of matching instructors
   * @throws {ValidationError} When search query is invalid
   * @throws {ServiceError} When operation fails
   */
  static async searchInstructors(query: string): Promise<Instructor[]> {
    try {
      if (!query || query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      if (query.trim().length < 2) {
        throw new ValidationError('Search query must be at least 2 characters');
      }

      return await Instructor.search(query.trim());

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to search instructors');
    }
  }

  /**
   * Gets instructor statistics
   * @returns {Promise<Object>} Instructor statistics
   * @throws {ServiceError} When operation fails
   */
  static async getInstructorStatistics(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    specializations: { [key: string]: number };
  }> {
    try {
      const allInstructors = await Instructor.findAll();
      
      const stats = {
        total: allInstructors.length,
        active: allInstructors.filter(i => i.status === 'active').length,
        inactive: allInstructors.filter(i => i.status === 'inactive').length,
        suspended: allInstructors.filter(i => i.status === 'suspended').length,
        specializations: {} as { [key: string]: number }
      };

      // Count specializations
      allInstructors.forEach(instructor => {
        if (instructor.specialization) {
          stats.specializations[instructor.specialization] = 
            (stats.specializations[instructor.specialization] || 0) + 1;
        }
      });

      return stats;

    } catch (error) {
      throw new ServiceError('Failed to get instructor statistics');
    }
  }
}

export default InstructorService; 