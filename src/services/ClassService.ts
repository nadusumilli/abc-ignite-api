import { ValidationError, NotFoundError, ConflictError, ServiceError } from '../utils/errors';
import Class from '../models/Class';
import { 
  Class as ClassType, 
  CreateClassRequest, 
  UpdateClassRequest, 
  ClassFilters, 
  ClassStatistics,
  PaginatedResponse 
} from '../types';

/**
 * Class service with comprehensive business logic
 * Handles all class-related operations with validation and error handling
 * Optimized for maximum performance and clean code
 */
class ClassService {
  /**
   * Creates a new class with comprehensive validation
   * @param {CreateClassRequest} classData - The class data to create
   * @returns {Promise<ClassType>} The created class object
   * @throws {ValidationError} When validation fails
   * @throws {ConflictError} When class already exists
   * @throws {ServiceError} When operation fails
   */
  static async createClass(classData: CreateClassRequest): Promise<ClassType> {
    try {
      // Validate class data
      if (!classData.name || !classData.instructorId || !classData.instructorName || !classData.classType) {
        throw new ValidationError('Missing required fields');
      }

      // Validate dates
      const startDate = new Date(classData.startDate);
      const endDate = new Date(classData.endDate);
      
      if (startDate >= endDate) {
        throw new ValidationError('Start date must be before end date');
      }

      if (startDate < new Date()) {
        throw new ValidationError('Cannot create classes in the past');
      }

      // Validate capacity
      if (classData.maxCapacity <= 0) {
        throw new ValidationError('Maximum capacity must be greater than 0');
      }

      // Check for conflicts (same instructor, same time slot)
      const existingClass = await Class.findByInstructorAndTime(
        classData.instructorId,
        startDate,
        endDate
      );

      if (existingClass) {
        throw new ConflictError('Instructor already has a class at this time');
      }

      // Create the class
      return await Class.create(classData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new ServiceError('Failed to create class');
    }
  }

  /**
   * Gets a class by its ID
   * @param {number} classId - The class ID to retrieve
   * @returns {Promise<ClassType>} The found class object
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async getClassById(classId: number): Promise<ClassType> {
    try {
      if (!classId || classId <= 0) {
        throw new ValidationError('Invalid class ID');
      }

      const classData = await Class.findById(classId);

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      return classData;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve class');
    }
  }

  /**
   * Gets all classes with filtering and pagination
   * @param {ClassFilters} filters - Filter criteria for classes
   * @returns {Promise<PaginatedResponse<ClassType>>} Paginated class results
   * @throws {ValidationError} When filters are invalid
   * @throws {ServiceError} When operation fails
   */
  static async getAllClasses(filters: ClassFilters): Promise<PaginatedResponse<ClassType>> {
    try {
      // Validate filters
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        throw new ValidationError('Invalid limit filter');
      }

      return await Class.findAll(filters);

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve classes');
    }
  }

  /**
   * Updates an existing class
   * @param {number} classId - The class ID to update
   * @param {UpdateClassRequest} updateData - The data to update
   * @returns {Promise<ClassType>} The updated class object
   * @throws {ValidationError} When validation fails or class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async updateClass(classId: number, updateData: UpdateClassRequest): Promise<ClassType> {
    try {
      if (!classId || classId <= 0) {
        throw new ValidationError('Invalid class ID');
      }

      // Check if class exists
      const existingClass = await Class.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      // Validate dates if being updated
      if (updateData.startDate && updateData.endDate) {
        const startDate = new Date(updateData.startDate);
        const endDate = new Date(updateData.endDate);
        
        if (startDate >= endDate) {
          throw new ValidationError('Start date must be before end date');
        }

        if (startDate < new Date()) {
          throw new ValidationError('Cannot update to past date');
        }
      }

      return await Class.update(classId, updateData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to update class');
    }
  }

  /**
   * Deletes a class
   * @param {number} classId - The class ID to delete
   * @returns {Promise<void>}
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async deleteClass(classId: number): Promise<void> {
    try {
      if (!classId || classId <= 0) {
        throw new ValidationError('Invalid class ID');
      }

      // Check if class exists
      const existingClass = await Class.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      // Check if class can be deleted (not in the past)
      const startDate = new Date(existingClass.startDate);
      if (startDate <= new Date()) {
        throw new ValidationError('Cannot delete classes that have already started');
      }

      await Class.delete(classId);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete class');
    }
  }

  /**
   * Gets comprehensive class statistics
   * @param {number} classId - The class ID to get statistics for
   * @returns {Promise<ClassStatistics>} Class statistics object
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async getClassStatistics(classId: number): Promise<ClassStatistics> {
    try {
      if (!classId || classId <= 0) {
        throw new ValidationError('Invalid class ID');
      }

      // Check if class exists
      const existingClass = await Class.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      return await Class.getClassStatistics(classId);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to get class statistics');
    }
  }

  /**
   * Searches classes with full-text search capabilities
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query string
   * @param {number} [searchParams.limit=20] - Maximum number of results
   * @param {number} [searchParams.offset=0] - Number of results to skip
   * @param {string} [searchParams.startDate] - Filter by start date
   * @param {string} [searchParams.endDate] - Filter by end date
   * @returns {Promise<PaginatedResponse<ClassType>>} Search results with pagination
   * @throws {ServiceError} When operation fails
   */
  static async searchClasses(searchParams: {
    query: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<PaginatedResponse<ClassType>> {
    try {
      if (!searchParams.query || searchParams.query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      return await Class.search(searchParams);

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to search classes');
    }
  }
}

export default ClassService; 