import { Request, Response } from 'express';
import Booking from '../models/Booking';
import Class from '../models/Class';
import Member from '../models/Member';
import { ValidationError, NotFoundError, ConflictError, ServiceError } from '../utils/errors';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, BookingFilters, CreateBookingRequest, UpdateBookingRequest } from '../types';

/**
 * Booking controller with comprehensive request handling and error management
 * Provides RESTful endpoints for booking management with performance monitoring
 */
class BookingController {
  /**
   * Create a new booking
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static createBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingData: CreateBookingRequest = req.body;
      // Validate required fields
      if (!bookingData.classId || !bookingData.memberId || !bookingData.participationDate) {
        throw new ValidationError('Class ID, member ID, and participation date are required');
      }
      // Check if class exists and is active
      const classData = await Class.findById(bookingData.classId);
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
      const classDate = new Date(classData.classDate);
      if (participationDate.getTime() !== classDate.getTime()) {
        throw new ValidationError('Participation date must match the class date');
      }
      // Check if member exists
      const member = await Member.findById(bookingData.memberId);
      if (!member) {
        throw new NotFoundError('Member not found');
      }
      // Check if member already has a booking for this class
      const existingBooking = await Booking.findByClassAndMember(bookingData.classId, bookingData.memberId);
      if (existingBooking) {
        throw new ConflictError('Member already has a booking for this class');
      }
      // Check class capacity
      const currentBookings = await Booking.findAll({ classId: bookingData.classId });
      if (currentBookings.data.length >= classData.maxCapacity) {
        throw new ValidationError('Class is at maximum capacity');
      }
      // Create booking
      const result = await Booking.create(bookingData);
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', '/api/bookings', 201, responseTime, { bookingId: result.id, classId: result.classId });
      res.status(201).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof ValidationError) {
        logger.logRequest('POST', '/api/bookings', 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof ConflictError) {
        logger.logRequest('POST', '/api/bookings', 409, responseTime, { error: error.message });
        res.status(409).json({ success: false, error: 'Conflict Error', message: error.message, details: error.details });
        return;
      }
      logger.logError('Booking creation failed', error, { requestBody: req.body, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to create booking' });
    }
  });

  /**
   * Get booking by ID
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getBookingById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingId = req.params['id'];
      if (!bookingId || bookingId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid booking ID' });
        return;
      }
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      // Fetch full member details
      let member = null;
      if (booking.memberId) {
        try {
          member = await Member.findById(booking.memberId);
        } catch {}
      }
      const result = { ...booking, member };
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/bookings/${bookingId}`, 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({ success: false, error: 'Not Found', message: error.message });
        return;
      }
      logger.logError('Booking retrieval failed', error, { bookingId, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to retrieve booking' });
    }
  });

  /**
   * Get all bookings with filtering
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getAllBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const orderBy = req.query['orderBy'] as string;
      const orderDirection = req.query['orderDirection'] as 'ASC' | 'DESC';
      const status = req.query['status'] as string;
      const memberName = req.query['memberName'] as string;
      const classId = req.query['classId'] as string;
      const startDate = req.query['startDate'] as string;
      const endDate = req.query['endDate'] as string;
      const filters: BookingFilters = {
        ...(orderDirection && { orderDirection }),
        ...(orderBy && { orderBy }),
        ...(offset !== undefined && { offset }),
        ...(limit !== undefined && { limit }),
        ...(status && { status }),
        ...(memberName && { memberName }),
        ...(classId && { classId }),
        ...(endDate && { endDate }),
        ...(startDate && { startDate }),
      };
      // Validate filters
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        throw new ValidationError('Invalid limit filter');
      }
      const result = await Booking.findAll(filters);
      // Attach full member details to each booking
      const bookingsWithMembers = await Promise.all(
        result.data.map(async (booking: any) => {
          let member = null;
          if (booking.memberId) {
            try {
              member = await Member.findById(booking.memberId);
            } catch {}
          }
          return { ...booking, member };
        })
      );
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings', 200, responseTime, { count: bookingsWithMembers.length });
      res.status(200).json({ ...result, data: bookingsWithMembers });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings', 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      logger.logError('Bookings retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to retrieve bookings' });
    }
  });

  /**
   * Update booking
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static updateBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingId = req.params['id'];
      if (!bookingId || bookingId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid booking ID' });
        return;
      }
      const updateData: UpdateBookingRequest = req.body;
      // Validate required fields
      if (!updateData.status) {
        throw new ValidationError('Status is required for update');
      }
      // Check if booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      // Update booking
      const result = await Booking.update(bookingId, updateData);
      const responseTime = Date.now() - startTime;
      logger.logRequest('PUT', `/api/bookings/${bookingId}`, 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      if (error instanceof ValidationError) {
        logger.logRequest('PUT', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof NotFoundError) {
        logger.logRequest('PUT', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({ success: false, error: 'Not Found', message: error.message });
        return;
      }
      logger.logError('Booking update failed', error, { bookingId, updateData: req.body, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to update booking' });
    }
  });

  /**
   * Delete booking
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static deleteBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingId = req.params['id'];
      if (!bookingId || bookingId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('DELETE', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid booking ID' });
        return;
      }
      // Check if booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      // Delete booking
      const result = await Booking.delete(bookingId);
      const responseTime = Date.now() - startTime;
      logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      if (error instanceof ValidationError) {
        logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof NotFoundError) {
        logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({ success: false, error: 'Not Found', message: error.message });
        return;
      }
      logger.logError('Booking deletion failed', error, { bookingId, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to delete booking' });
    }
  });

  /**
   * Search bookings
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static searchBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const query = req.query['q'] as string;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const startDate = req.query['startDate'] as string;
      const endDate = req.query['endDate'] as string;
      const classId = req.query['classId'] as string;
      const filters: BookingFilters = {
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(classId && { classId }),
      };
      // Validate filters
      if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
        throw new ValidationError('Invalid limit filter');
      }
      const result = await Booking.search(query, filters);
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings/search', 200, responseTime, { query, count: result.data?.length });
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings/search', 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      logger.logError('Booking search failed', error, { query: req.query, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to search bookings' });
    }
  });

  /**
   * Cancel booking
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static cancelBooking = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingId = req.params['id'];
      if (!bookingId || bookingId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('POST', `/api/bookings/${req.params['id']}/cancel`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid booking ID' });
        return;
      }
      const { reason } = req.body;
      // Check if booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      // Cancel booking
      const result = await Booking.cancel(bookingId, reason);
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      if (error instanceof ValidationError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof NotFoundError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 404, responseTime, { error: error.message });
        res.status(404).json({ success: false, error: 'Not Found', message: error.message });
        return;
      }
      logger.logError('Booking cancellation failed', error, { bookingId, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to cancel booking' });
    }
  });

  /**
   * Mark booking as attended
   */
  static markBookingAttended = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const bookingId = req.params['id'];
      if (!bookingId || bookingId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('POST', `/api/bookings/${req.params['id']}/attend`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({ success: false, error: 'Validation Error', message: 'Invalid booking ID' });
        return;
      }
      // Check if booking exists
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        throw new NotFoundError('Booking not found');
      }
      // Mark booking as attended
      const result = await Booking.markAttended(bookingId);
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      if (error instanceof ValidationError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      if (error instanceof NotFoundError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 404, responseTime, { error: error.message });
        res.status(404).json({ success: false, error: 'Not Found', message: error.message });
        return;
      }
      logger.logError('Mark booking attended failed', error, { bookingId, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to mark booking as attended' });
    }
  });

  /**
   * Get booking statistics
   */
  static getBookingStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
      const options = {
        ...(req.query['startDate'] && { startDate: req.query['startDate'] as string }),
        ...(req.query['endDate'] && { endDate: req.query['endDate'] as string }),
        ...(req.query['classId'] && { classId: String(req.query['classId']) }),
      };
      const result = await Booking.getStatistics(options);
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings/statistics', 200, responseTime);
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings/statistics', 400, responseTime, { error: error.message });
        res.status(400).json({ success: false, error: 'Validation Error', message: error.message, details: error.details });
        return;
      }
      logger.logError('Booking statistics retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({ success: false, error: 'Internal Server Error', message: 'Failed to retrieve booking statistics' });
    }
  });
}

export default BookingController; 