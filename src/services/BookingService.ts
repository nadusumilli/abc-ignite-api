import { ValidationError, NotFoundError, ServiceError, ConflictError } from '../utils/errors';
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
  static async createBooking(bookingData: CreateBookingRequest): Promise<BookingType> {
    try {
      // Validate required fields
      if (!bookingData.classId || !bookingData.memberName || !bookingData.memberEmail || !bookingData.participationDate) {
        throw new ValidationError('Class ID, member name, member email, and participation date are required');
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
      
      // Check if participation date is in the future
      const participationDate = new Date(bookingData.participationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (participationDate < today) {
        throw new ValidationError('Participation date must be today or in the future');
      }
      
      // Check if class is available on the participation date
      const classStartDate = new Date(classData.startDate);
      const classEndDate = new Date(classData.endDate);

      if (participationDate < classStartDate || participationDate > classEndDate) {
        throw new ValidationError('Participation date must be within the class date range');
      }

      // Create or find member using MemberService
      const memberData: CreateMemberRequest = {
        name: bookingData.memberName,
        email: bookingData.memberEmail,
        ...(bookingData.memberPhone && { phone: bookingData.memberPhone })
      };


      const member = await MemberService.createMemberIfNotExists(memberData);

      // Check if member already has a booking for this class
      const existingBooking = await Booking.findByClassAndMember(bookingData.classId, member.id);
      if (existingBooking) {
        throw new ConflictError('Member already has a booking for this class');
      }
      
      // Check class capacity
      const currentBookings = await Booking.getAllBookings({ 
        classId: bookingData.classId || "" 
      });
      if (currentBookings.data.length >= classData.maxCapacity) {
        throw new ValidationError('Class is at maximum capacity');
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
  static async getBookingById(bookingId: number): Promise<any> {
    try {
      if (!bookingId || bookingId <= 0) {
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

      if (filters.classId && filters.classId <= 0) {
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
      return { ...result, data: bookingsWithMembers };

    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ServiceError('Failed to retrieve bookings');
    }
  }

  /**
   * Updates an existing booking
   * @param {number} bookingId - The booking ID to update
   * @param {UpdateBookingRequest} updateData - The data to update
   * @returns {Promise<BookingType>} The updated booking object
   * @throws {ValidationError} When validation fails or booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async updateBooking(bookingId: number, updateData: UpdateBookingRequest): Promise<BookingType> {
    try {
      if (!bookingId || bookingId <= 0) {
        throw new ValidationError('Invalid booking ID');
      }

      // Check if booking exists
      const existingBooking = await Booking.findById(bookingId);
      if (!existingBooking) {
        throw new NotFoundError('Booking not found');
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

      // Validate status transitions
      if (updateData.status) {
        const validTransitions: Record<string, string[]> = {
          'pending': ['confirmed', 'cancelled'],
          'confirmed': ['attended', 'cancelled', 'no_show'],
          'attended': [],
          'cancelled': [],
          'no_show': []
        };

        const currentStatus = existingBooking.status;
        const newStatus = updateData.status;

        if (!validTransitions[currentStatus]?.includes(newStatus)) {
          throw new ValidationError(`Invalid status transition from ${currentStatus} to ${newStatus}`);
        }
      }

      // Validate participation date if being updated
      if (updateData.participationDate) {
        const participationDate = new Date(updateData.participationDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (participationDate <= today) {
          throw new ValidationError('Cannot update to past or today date');
        }

        // Check if new date is within class date range
        const classData = await Class.findById(parseInt(existingBooking.classId));
        if (classData) {
          const classStartDate = new Date(classData.startDate);
          const classEndDate = new Date(classData.endDate);

          if (participationDate < classStartDate || participationDate > classEndDate) {
            throw new ValidationError('Participation date must be within class date range');
          }
        }
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
   * @param {number} bookingId - The booking ID to delete
   * @returns {Promise<void>}
   * @throws {ValidationError} When booking ID is invalid
   * @throws {NotFoundError} When booking is not found
   * @throws {ServiceError} When operation fails
   */
  static async deleteBooking(bookingId: number): Promise<void> {
    try {
      if (!bookingId || bookingId <= 0) {
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
  static async searchBookings(searchParams: {
    query: string;
    limit?: number;
    offset?: number;
    startDate?: string;
    endDate?: string;
    classId?: number;
  }): Promise<PaginatedResponse<BookingType>> {
    try {
      if (!searchParams.query || searchParams.query.trim().length === 0) {
        throw new ValidationError('Search query is required');
      }

      return await Booking.search(searchParams);

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
  static async cancelBooking(bookingId: number, reason?: string): Promise<BookingType> {
    try {
      if (!bookingId || bookingId <= 0) {
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
  static async markBookingAttended(bookingId: number): Promise<BookingType> {
    try {
      if (!bookingId || bookingId <= 0) {
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