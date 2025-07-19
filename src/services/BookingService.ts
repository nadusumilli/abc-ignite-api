import { ValidationError, NotFoundError, ServiceError, ConflictError, ErrorFactory } from '../utils/errors';
import Booking from '../models/Booking';
import Class from '../models/Class';
import MemberService from './MemberService';
import { 
  Booking as BookingType, 
  CreateBookingRequest, 
  UpdateBookingRequest, 
  BookingFilters, 
  BookingStatistics,
  PaginatedResponse,
  CreateMemberRequest
} from '../types';

/**
 * Booking service with comprehensive business logic
 * Handles all booking-related operations with validation and error handling
 * Optimized for maximum performance and clean code
 */
class BookingService {
  /**
   * Creates a new booking with comprehensive validation
   * @param {CreateBookingRequest} bookingData - The booking data to create
   * @returns {Promise<BookingType>} The created booking object
   * @throws {ValidationError} When validation fails or booking already exists
   * @throws {ServiceError} When database operation fails
   */
  /**
   * Creates a booking for a class according to business requirements
   * @param {CreateBookingRequest} bookingData - The booking data to create
   * @returns {Promise<BookingType>} The created booking object
   * @throws {ValidationError} When validation fails
   * @throws {NotFoundError} When class not found
   * @throws {ServiceError} When operation fails
   */
  static async createBooking(bookingData: CreateBookingRequest): Promise<BookingType> {
    try {
      // Validate required fields according to business requirements
      if (!bookingData.classId || !bookingData.memberName || !bookingData.participationDate) {
        throw new ValidationError('Class ID, member name, and participation date are required');
      }

      // Check if class exists and is active - handle both UUID and integer IDs
      let classData;
      // Use UUID for classId
      classData = await Class.findById(bookingData.classId);

      if (!classData) {
        throw new NotFoundError('Class not found');
      }

      if (classData.status !== 'active') {
        throw new ValidationError('Cannot book an inactive class');
      }
      
      // Check if participation date is from tomorrow onwards (business requirement)
      const participationDate = new Date(bookingData.participationDate);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (participationDate < tomorrow) {
        throw ErrorFactory.business('Participation date must be from tomorrow onwards', 'BOOKING_PAST_DATE');
      }
      
      // Check if class is available on the participation date
      const classStartDate = new Date(classData.startDate);
      const classEndDate = new Date(classData.endDate);

      if (participationDate < classStartDate || participationDate > classEndDate) {
        throw ErrorFactory.business('Participation date must be within the class date range', 'BOOKING_DATE_OUT_OF_RANGE');
      }

      // Create or find member using MemberService (if email provided)
      let member;
      if (bookingData.memberEmail) {
      const memberData: CreateMemberRequest = {
        name: bookingData.memberName,
        email: bookingData.memberEmail,
        ...(bookingData.memberPhone && { phone: bookingData.memberPhone })
      };
        member = await MemberService.createMemberIfNotExists(memberData);
      } else {
        // Create a temporary member record for bookings without email
        const memberData: CreateMemberRequest = {
          name: bookingData.memberName,
          email: `${bookingData.memberName.toLowerCase().replace(/\s+/g, '.')}@temp.local`,
          ...(bookingData.memberPhone && { phone: bookingData.memberPhone })
        };
        member = await MemberService.createMemberIfNotExists(memberData);
      }

      // Note: Business requirements state "A member may book multiple classes for the same day and time"
      // So we don't check for existing bookings
      
      // Check class capacity
      const currentBookings = await Booking.getAllBookings({ 
        classId: bookingData.classId || "" 
      });
      if (currentBookings.data.length >= classData.maxCapacity) {
        throw ErrorFactory.business('Class is at maximum capacity', 'BOOKING_CLASS_FULL');
      }
      
      // Create booking with member ID from the created/found member
      const bookingWithMemberId = {
        ...bookingData,
        memberId: member.id
      };
      
      const booking = await Booking.create(bookingWithMemberId);
      return booking;

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        throw error;
      }
      throw new ServiceError('Failed to create booking');
    }
  }

  /**
   * Gets a booking by its ID
   * @param {number} bookingId - The booking ID to retrieve
   * @returns {Promise<BookingType>} The found booking object
   * @throws {ValidationError} When booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async getBookingById(bookingId: string): Promise<any> {
    try {
      if (!bookingId || bookingId.trim() === '') {
        throw new ValidationError('Invalid booking ID');
      }

      const booking = await Booking.findById(bookingId);

      if (!booking) {
        throw new NotFoundError('Booking not found');
      }

      // Fetch full member details
      let member = null;
      if (booking.memberId) {
        try {
          member = await MemberService.getMemberById(booking.memberId);
        } catch {}
      }

      return { ...booking, member };

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve booking');
    }
  }

  /**
   * Gets all bookings with filtering and pagination
   * @param {BookingFilters} filters - Filter criteria for bookings
   * @returns {Promise<PaginatedResponse<BookingType>>} Paginated booking results
   * @throws {ValidationError} When filters are invalid
   * @throws {ServiceError} When operation fails
   */
  static async getAllBookings(filters: BookingFilters): Promise<any> {
    try {
      // Validate filters
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        throw new ValidationError('Invalid limit filter');
      }

      if (filters.classId && parseInt(filters.classId) <= 0) {
        throw new ValidationError('Invalid class ID filter');
      }

      const result = await Booking.findAll(filters);
      // Attach full member details to each booking
      const bookingsWithMembers = await Promise.all(
        result.data.map(async (booking: any) => {
          let member = null;
          if (booking.memberId) {
            try {
              member = await MemberService.getMemberById(booking.memberId);
            } catch {}
          }
          return { ...booking, member };
        })
      );


      // Attach class details to each booking for business requirements
      const bookingsWithClassDetails = await Promise.all(
        result.data.map(async (booking: any) => {
          const classData = await Class.findById(booking.classId);
          return {
            ...booking,
            className: classData?.name,
            classStartTime: classData?.startTime,
            class: classData
          };
        })
      );

      return { ...result, data: bookingsWithClassDetails };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve bookings');
    }
  }

  /**
   * Updates an existing booking
   * @param {string} bookingId - The booking ID to update (UUID)
   * @param {UpdateBookingRequest} updateData - The data to update
   * @returns {Promise<BookingType>} The updated booking object
   * @throws {ValidationError} When validation fails or booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async updateBooking(bookingId: string, updateData: UpdateBookingRequest): Promise<BookingType> {
    try {
      if (!bookingId || bookingId.trim() === '') {
        throw new ValidationError('Invalid booking ID');
      }

      // Check if booking exists
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      // --- CLASS VALIDATION ---
      if (updateData.classId && updateData.classId !== existingBooking.classId) {
        // Check if the new class exists and is active
        const newClass = await Class.findById(updateData.classId);
        if (!newClass) {
          throw new NotFoundError('Selected class not found');
        }
        
        if (newClass.status !== 'active') {
          throw new ValidationError('Cannot book inactive class');
        }

        // Check if the new class has available capacity
        const existingBookings = await Booking.findAll({
          classId: updateData.classId,
          limit: 1000
        });

        const confirmedBookings = existingBookings.data.filter(
          (booking: any) => booking.status === 'confirmed' && booking.id !== bookingId
        );

        if (confirmedBookings.length >= newClass.maxCapacity) {
          throw new ValidationError('Selected class is at full capacity');
        }
      }

      // --- MEMBER UPDATE LOGIC ---
      let memberId = existingBooking.memberId;
      if (updateData.memberName || updateData.memberEmail || updateData.memberPhone) {
        // If memberEmail is being updated, try to find or create the member
        const memberEmail = updateData.memberEmail || existingBooking.memberEmail;
        const memberName = updateData.memberName || existingBooking.memberName;
        const memberPhone = updateData.memberPhone || existingBooking.memberPhone;
        
        const memberData: CreateMemberRequest = {
          name: memberName,
          email: memberEmail,
          ...(memberPhone && { phone: memberPhone })
        };
        
        // Use the member service to update or create
        const member = await MemberService.createMemberIfNotExists(memberData);
        memberId = member.id;
      }

      // --- STATUS VALIDATION ---
      if (updateData.status) {
        const newStatus = updateData.status;
        const currentStatus = existingBooking.status;

        // Allow all status transitions for now (business rules can be added later)
        // Only prevent changing from final states if needed
        if (currentStatus === 'attended' && newStatus !== 'attended') {
          throw new ValidationError('Cannot change status of attended booking');
        }

        // Add timestamps for status changes
        if (newStatus === 'attended' && currentStatus !== 'attended') {
          updateData.attendedAt = new Date();
        }
        
        if (newStatus === 'cancelled' && currentStatus !== 'cancelled') {
          updateData.cancelledAt = new Date();
          // You can add cancelledBy logic here if user context is available
        }
      }

      // --- DATE VALIDATION ---
      if (updateData.participationDate) {
        const participationDate = new Date(updateData.participationDate);
        
        // Validate date format
        if (isNaN(participationDate.getTime())) {
          throw new ValidationError('Invalid participation date format');
        }

        // Check if the date is not in the past (allow same day)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        participationDate.setHours(0, 0, 0, 0);
        
        if (participationDate < today) {
          throw new ValidationError('Participation date cannot be in the past');
        }

        // If changing class and date, validate capacity for the new date
        if (updateData.classId && updateData.classId !== existingBooking.classId) {
          const targetClass = await Class.findById(updateData.classId);
          if (targetClass) {
            const existingBookings = await Booking.findAll({
              classId: updateData.classId,
              limit: 1000
            });

            const confirmedBookings = existingBookings.data.filter(
              (booking: any) => booking.status === 'confirmed' && booking.id !== bookingId
            );

            if (confirmedBookings.length >= targetClass.maxCapacity) {
              throw new ValidationError('Selected class is at full capacity for the chosen date');
            }
          }
        }
      }

      // --- CANCELLATION REASON VALIDATION ---
      if (updateData.cancellationReason && updateData.status !== 'cancelled') {
        throw new ValidationError('Cancellation reason can only be set when status is cancelled');
      }

      // Always update booking with the resolved memberId
      const updateWithMemberId = { ...updateData, memberId };
      return await Booking.update(bookingId, updateWithMemberId);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to update booking');
    }
  }

  /**
   * Deletes a booking
   * @param {string} bookingId - The booking ID to delete (UUID)
   * @returns {Promise<void>}
   * @throws {ValidationError} When booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async deleteBooking(bookingId: string): Promise<void> {
    try {
      if (!bookingId || bookingId.trim() === '') {
        throw new ValidationError('Invalid booking ID');
      }

      // Check if booking exists
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      // Check if booking can be deleted (not attended)
      if (existingBooking.status === 'attended') {
        throw new ValidationError('Cannot delete attended booking');
      }

      await Booking.delete(bookingId);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to delete booking');
    }
  }

  /**
   * Searches bookings with full-text search capabilities
   * @param {Object} searchParams - Search parameters
   * @param {string} searchParams.query - Search query string
   * @param {number} [searchParams.limit=20] - Maximum number of results
   * @param {number} [searchParams.offset=0] - Number of results to skip
   * @param {string} [searchParams.startDate] - Filter by start date
   * @param {string} [searchParams.endDate] - Filter by end date
   * @param {number} [searchParams.classId] - Filter by class ID
   * @returns {Promise<PaginatedResponse<BookingType>>} Search results with pagination
   * @throws {ServiceError} When operation fails
   */
  /**
   * Search bookings according to business requirements
   * @param {Object} searchParams - Search parameters
   * @param {string} [searchParams.memberName] - Search by member name
   * @param {string} [searchParams.startDate] - Filter by start date
   * @param {string} [searchParams.endDate] - Filter by end date
   * @param {number} [searchParams.limit=20] - Maximum number of results
   * @param {number} [searchParams.offset=0] - Number of results to skip
   * @returns {Promise<PaginatedResponse<BookingType>>} Search results with pagination
   * @throws {ServiceError} When operation fails
   */
  static async searchBookings(searchParams: {
    memberName?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaginatedResponse<BookingType>> {
    try {
      // Validate that at least one search parameter is provided
      if (!searchParams.memberName && !searchParams.startDate && !searchParams.endDate) {
        throw new ValidationError('At least one search parameter is required: memberName, startDate, or endDate');
      }

      // Build filters for the existing findAll method
      const filters: BookingFilters = {
        ...(searchParams.memberName && { memberName: searchParams.memberName }),
        ...(searchParams.startDate && { startDate: searchParams.startDate }),
        ...(searchParams.endDate && { endDate: searchParams.endDate }),
        ...(searchParams.limit && { limit: searchParams.limit }),
        ...(searchParams.offset && { offset: searchParams.offset })
      };

      const result = await Booking.findAll(filters);
      
      // Attach class details to each booking for business requirements
      const bookingsWithClassDetails = await Promise.all(
        result.data.map(async (booking: any) => {
          const classData = await Class.findById(booking.classId);
          return {
            ...booking,
            className: classData?.name,
            classStartTime: classData?.startTime,
            class: classData
          };
        })
      );

      return { ...result, data: bookingsWithClassDetails };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to search bookings');
    }
  }

  /**
   * Cancels a booking with optional reason
   * @param {number} bookingId - The booking ID to cancel
   * @param {string} [reason] - Cancellation reason
   * @returns {Promise<BookingType>} The cancelled booking object
   * @throws {ValidationError} When booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async cancelBooking(bookingId: string, reason?: string): Promise<BookingType> {
    try {
      if (!bookingId || bookingId.trim() === '') {
        throw new ValidationError('Invalid booking ID');
      }

      // Check if booking exists
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      // Check if booking can be cancelled
      if (existingBooking.status === 'attended') {
        throw new ValidationError('Cannot cancel attended booking');
      }

      if (existingBooking.status === 'cancelled') {
        throw new ValidationError('Booking is already cancelled');
      }

      const updateData: UpdateBookingRequest = {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledBy: 'system' // This should come from authentication context
      };

      if (reason) {
        updateData.cancellationReason = reason;
      }

      return await Booking.update(bookingId, updateData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to cancel booking');
    }
  }

  /**
   * Marks a booking as attended
   * @param {number} bookingId - The booking ID to mark as attended
   * @returns {Promise<BookingType>} The updated booking object
   * @throws {ValidationError} When booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async markBookingAttended(bookingId: string): Promise<BookingType> {
    try {
      if (!bookingId || bookingId.trim() === '') {
        throw new ValidationError('Invalid booking ID');
      }

      // Check if booking exists
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
      }

      // Check if booking can be marked as attended
      if (existingBooking.status === 'attended') {
        throw new ValidationError('Booking is already marked as attended');
      }

      if (existingBooking.status === 'cancelled') {
        throw new ValidationError('Cannot mark cancelled booking as attended');
      }

      if (existingBooking.status === 'no_show') {
        throw new ValidationError('Cannot mark no-show booking as attended');
      }

      const updateData: UpdateBookingRequest = {
        status: 'attended',
        attendedAt: new Date()
      };

      return await Booking.update(bookingId, updateData);

    } catch (error) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      throw new ServiceError('Failed to mark booking as attended');
    }
  }

  /**
   * Gets comprehensive booking statistics
   * @param {Object} options - Statistics options
   * @param {string} [options.startDate] - Start date filter
   * @param {string} [options.endDate] - End date filter
   * @param {number} [options.classId] - Class ID filter
   * @returns {Promise<BookingStatistics>} Booking statistics object
   * @throws {ServiceError} When operation fails
   */
  static async getBookingStatistics(options: {
    startDate?: string;
    endDate?: string;
    classId?: number;
  }): Promise<BookingStatistics> {
    try {
      return await Booking.getStatistics(options);

    } catch (error) {
      throw new ServiceError('Failed to get booking statistics');
    }
  }
}

export default BookingService; 