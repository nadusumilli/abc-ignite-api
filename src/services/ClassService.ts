import { ValidationError, NotFoundError, ConflictError, ServiceError, BusinessError, ErrorFactory } from '../utils/errors';
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
  /**
   * Creates multiple classes for a date range according to business requirements
   * @param {CreateClassRequest} classData - The class data to create
   * @returns {Promise<ClassType[]>} Array of created class objects (one per day)
   * @throws {ValidationError} When validation fails
   * @throws {ServiceError} When operation fails
   */
  static async createClass(classData: CreateClassRequest): Promise<ClassType[]> {
    try {
      // Validate required fields according to business requirements
      if (!classData.name || !classData.startDate || !classData.endDate || 
          !classData.startTime || !classData.durationMinutes || !classData.maxCapacity) {
        throw new ValidationError('Missing required fields: name, startDate, endDate, startTime, durationMinutes, maxCapacity');
      }

      // Validate dates - start time can only be from tomorrow
      const startDate = new Date(classData.startDate);
      const endDate = new Date(classData.endDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); // Reset time to start of day
      
      if (startDate >= endDate) {
        throw new ValidationError('Start date must be before end date');
      }

      if (startDate < tomorrow) {
        throw new ValidationError('Start date must be from tomorrow onwards');
      }

      // Validate capacity (must be at least 1)
      if (classData.maxCapacity < 1) {
        throw new ValidationError('Capacity must be at least 1');
      }

      // Validate time format
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(classData.startTime)) {
        throw new ValidationError('Start time must be in HH:MM format');
      }

      // Calculate end time based on duration
      const [hours, minutes] = classData.startTime.split(':').map(Number);
      const startDateTime = new Date();
      startDateTime.setHours(hours || 0, minutes || 0, 0, 0);
      const endDateTime = new Date(startDateTime.getTime() + (classData.durationMinutes || 60) * 60000);
      const endTime = endDateTime.toTimeString().slice(0, 5);

      // Generate classes for each day from start date to end date (one class per day)
      const classes: ClassType[] = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        const classDate = new Date(currentDate);
        
        // Create class data for this specific day
        const dailyClassData = {
          ...classData,
          startDate: classDate,
          endDate: classDate, // Same day
          startTime: classData.startTime,
          endTime: endTime,
          // Ensure required fields are present
          instructorId: classData.instructorId || 'default-instructor',
          instructorName: classData.instructorName || 'Default Instructor',
          classType: classData.classType || 'general',
          description: classData.description || `${classData.name} class`,
          price: classData.price || 0,
          status: 'active' as const
        };

        // Create the class for this day
        const createdClass = await Class.create(dailyClassData);
        classes.push(createdClass);

        // Move to next day
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return classes;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof ConflictError) {
        throw error;
      }
      throw new ServiceError('Failed to create classes');
    }
  }

  /**
   * Gets a class by its ID
   * @param {string} classId - The class ID to retrieve (UUID)
   * @returns {Promise<ClassType>} The found class object
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async getClassById(classId: string): Promise<ClassType> {
    try {
      if (!classId || classId.trim() === '') {
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
   * @param {string} classId - The class ID to update (UUID)
   * @param {UpdateClassRequest} updateData - The data to update
   * @returns {Promise<ClassType>} The updated class object
   * @throws {ValidationError} When validation fails or class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async updateClass(classId: string, updateData: UpdateClassRequest): Promise<ClassType> {
    try {
      if (!classId || classId.trim() === '') {
        throw new ValidationError('Invalid class ID');
      }

      // Check if class exists
      const existingClass = await Class.findById(classId);
      if (!existingClass) {
        throw new NotFoundError('Class not found');
      }

      // Validate dates for updates - start date should be from tomorrow onwards
      if (updateData.startDate && updateData.endDate) {
        const startDate = new Date(updateData.startDate);
        const endDate = new Date(updateData.endDate);
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0); // Reset time to start of day
        
        // Validate date format
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new ValidationError('Invalid date format');
        }
        
        // Start date should be from tomorrow onwards
        if (startDate > existingClass.startDate) {
          throw ErrorFactory.business('Start date must be from tomorrow onwards', 'CLASS_PAST_DATE');
        }
        
        // Start date must be before end date
        if (startDate >= endDate) {
          throw ErrorFactory.business('Start date must be before end date', 'CLASS_INVALID_DATE_RANGE');
        }

        // Only check for overlaps if we're changing the date or time
        const isChangingDate = updateData.startDate !== existingClass.startDate || 
                              updateData.endDate !== existingClass.endDate;
        const isChangingTime = updateData.startTime !== existingClass.startTime || 
                              updateData.endTime !== existingClass.endTime;

        if (isChangingDate || isChangingTime) {
          // Get the new time values (use existing if not provided in update)
          const newStartTime = updateData.startTime || existingClass.startTime;
          const newEndTime = updateData.endTime || existingClass.endTime;
          
          // Check for overlap with other classes on the same date
          const overlappingClasses = await Class.findAll({
            startDate: startDate.toISOString().split('T')[0] || '',
            endDate: endDate.toISOString().split('T')[0] || '',
            limit: 1000 // Get all classes in the date range
          });
          
          // Filter out the current class and check for time overlaps
          const otherClasses = overlappingClasses.data.filter((cls: any) => cls.id !== classId);
          
          // Check for time overlaps with other classes
          for (const otherClass of otherClasses) {
            const otherStartTime = otherClass.startTime;
            const otherEndTime = otherClass.endTime;
            
            // Check if time slots overlap
            if (newStartTime < otherEndTime && newEndTime > otherStartTime) {
              throw ErrorFactory.business(
                `Class schedule overlaps with existing class "${otherClass.name}" on ${otherClass.startDate}`, 
                'CLASS_OVERLAP'
              );
            }
          }
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
   * @param {string} classId - The class ID to delete (UUID)
   * @returns {Promise<void>}
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async deleteClass(classId: string): Promise<void> {
    try {
      if (!classId || classId.trim() === '') {
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
   * @param {string} classId - The class ID to get statistics for (UUID)
   * @returns {Promise<ClassStatistics>} Class statistics object
   * @throws {ValidationError} When class ID is invalid
   * @throws {NotFoundError} When class is not found
   * @throws {ServiceError} When operation fails
   */
  static async getClassStatistics(classId: string): Promise<ClassStatistics> {
    try {
      if (!classId || classId.trim() === '') {
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