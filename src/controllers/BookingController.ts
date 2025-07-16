import { Request, Response } from 'express';
import BookingService from '../services/BookingService';
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
      
      const result = await BookingService.createBooking(bookingData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', '/api/bookings', 201, responseTime, { 
        bookingId: result.id,
        classId: result.classId 
      });
      
      res.status(201).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('POST', '/api/bookings', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof ConflictError) {
        logger.logRequest('POST', '/api/bookings', 409, responseTime, { error: error.message });
        res.status(409).json({
          success: false,
          error: 'Conflict Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Booking creation failed', error, { requestBody: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create booking'
      });
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
      const bookingId = parseInt(req.params['id'] || '');
      
      if (isNaN(bookingId)) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid booking ID'
        });
        return;
      }
      
      const result = await BookingService.getBookingById(bookingId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/bookings/${bookingId}`, 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Booking retrieval failed', error, { bookingId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve booking'
      });
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
      const filters: BookingFilters = {
        ...(req.query['startDate'] && { startDate: req.query['startDate'] as string }),
        ...(req.query['endDate'] && { endDate: req.query['endDate'] as string }),
        ...(req.query['classId'] && { classId: parseInt(req.query['classId'] as string) }),
        ...(req.query['memberName'] && { memberName: req.query['memberName'] as string }),
        ...(req.query['status'] && { status: req.query['status'] as string }),
        ...(req.query['limit'] && { limit: parseInt(req.query['limit'] as string) }),
        ...(req.query['offset'] && { offset: parseInt(req.query['offset'] as string) }),
        ...(req.query['orderBy'] && { orderBy: req.query['orderBy'] as string }),
        ...(req.query['orderDirection'] && { orderDirection: req.query['orderDirection'] as 'ASC' | 'DESC' }),
      };
      
      const result = await BookingService.getAllBookings(filters);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings', 200, responseTime, { 
        count: result.data?.length 
      });
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Bookings retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve bookings'
      });
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
      const bookingId = parseInt(req.params['id'] || '');
      
      if (isNaN(bookingId)) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid booking ID'
        });
        return;
      }
      
      const updateData: UpdateBookingRequest = req.body;
      
      const result = await BookingService.updateBooking(bookingId, updateData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('PUT', `/api/bookings/${bookingId}`, 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('PUT', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('PUT', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Booking update failed', error, { bookingId, updateData: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update booking'
      });
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
      const bookingId = parseInt(req.params['id'] || '');
      
      if (isNaN(bookingId)) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('DELETE', `/api/bookings/${req.params['id']}`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid booking ID'
        });
        return;
      }
      
      const result = await BookingService.deleteBooking(bookingId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('DELETE', `/api/bookings/${bookingId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Booking deletion failed', error, { bookingId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete booking'
      });
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
      const classId = req.query['classId'] ? parseInt(req.query['classId'] as string) : undefined;
      
      if (!query) {
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Query parameter q is required.'
        });
        return;
      }
      const result = await BookingService.searchBookings({
        query,
        ...(limit && { limit }),
        ...(offset && { offset }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(classId !== undefined ? { classId } : {}),
      });
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings/search', 200, responseTime, { 
        query, 
        count: result.data?.length 
      });
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings/search', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Booking search failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to search bookings'
      });
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
      const bookingId = parseInt(req.params['id'] || '');
      
      if (isNaN(bookingId)) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('POST', `/api/bookings/${req.params['id']}/cancel`, 400, responseTime, { error: 'Invalid booking ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid booking ID'
        });
        return;
      }
      
      const { reason } = req.body;
      
      const result = await BookingService.cancelBooking(bookingId, reason);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/cancel`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Booking cancellation failed', error, { bookingId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to cancel booking'
      });
    }
  });

  /**
   * Mark booking as attended
   */
  static markBookingAttended = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const bookingId = parseInt(req.params['id'] || '');
      
      const result = await BookingService.markBookingAttended(bookingId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const bookingId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('POST', `/api/bookings/${bookingId}/attend`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Mark booking attended failed', error, { bookingId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to mark booking as attended'
      });
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
        ...(req.query['classId'] && { classId: parseInt(req.query['classId'] as string) }),
      };
      
      const result = await BookingService.getBookingStatistics(options);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/bookings/statistics', 200, responseTime);
      
      res.status(200).json(result);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/bookings/statistics', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Booking statistics retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve booking statistics'
      });
    }
  });
}

export default BookingController; 