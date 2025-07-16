import express from 'express';
import BookingController from '../controllers/BookingController';
import { validateRequest, sanitizeRequest } from '../middleware/middleware';
import { createBookingSchema, validateData } from '../utils/validators';

const router = express.Router();

/**
 * Booking routes with comprehensive validation and error handling
 * Provides RESTful endpoints for booking management
 */

/**
 * Create a new booking
 * POST /api/bookings
 * @body {Object} bookingData - Booking information
 */
router.post('/', 
  sanitizeRequest,
  validateRequest,
  (req, res, next) => {
    try {
      // Validate booking data using Joi schema
      req.body = validateData(req.body, createBookingSchema);
      next();
    } catch (error) {
      next(error);
    }
  },
  BookingController.createBooking
);

/**
 * Get all bookings with filtering and pagination
 * GET /api/bookings
 * @query {string} startDate - Filter by participation start date
 * @query {string} endDate - Filter by participation end date
 * @query {number} classId - Filter by class ID
 * @query {string} memberName - Filter by member name
 * @query {string} status - Filter by status (confirmed, cancelled, attended, no_show)
 * @query {number} limit - Number of results per page (default: 20, max: 100)
 * @query {number} offset - Number of results to skip (default: 0)
 * @query {string} orderBy - Sort field (created_at, updated_at, participation_date, member_name)
 * @query {string} orderDirection - Sort direction (ASC, DESC)
 */
router.get('/', 
  sanitizeRequest,
  validateRequest,
  BookingController.getAllBookings
);

/**
 * Search bookings with full-text search
 * GET /api/bookings/search
 * @query {string} q - Search query (required)
 * @query {number} limit - Number of results per page (default: 20, max: 100)
 * @query {number} offset - Number of results to skip (default: 0)
 * @query {string} startDate - Filter by participation start date
 * @query {string} endDate - Filter by participation end date
 * @query {number} classId - Filter by class ID
 */
router.get('/search',
  sanitizeRequest,
  validateRequest,
  BookingController.searchBookings
);

/**
 * Get booking by ID
 * GET /api/bookings/:id
 * @param {number} id - Booking ID
 */
router.get('/:id',
  sanitizeRequest,
  validateRequest,
  BookingController.getBookingById
);

/**
 * Update booking
 * PUT /api/bookings/:id
 * @param {number} id - Booking ID
 * @body {Object} updateData - Booking data to update
 */
router.put('/:id',
  sanitizeRequest,
  validateRequest,
  BookingController.updateBooking
);

/**
 * Delete booking
 * DELETE /api/bookings/:id
 * @param {number} id - Booking ID
 */
router.delete('/:id',
  sanitizeRequest,
  validateRequest,
  BookingController.deleteBooking
);

/**
 * Cancel booking
 * POST /api/bookings/:id/cancel
 * @param {number} id - Booking ID
 * @body {Object} cancelData - Cancellation information
 */
router.post('/:id/cancel',
  sanitizeRequest,
  validateRequest,
  BookingController.cancelBooking
);

/**
 * Mark booking as attended
 * POST /api/bookings/:id/attend
 * @param {number} id - Booking ID
 */
router.post('/:id/attend',
  sanitizeRequest,
  validateRequest,
  BookingController.markBookingAttended
);

/**
 * Get booking statistics
 * GET /api/bookings/statistics
 * @query {string} startDate - Filter by participation start date
 * @query {string} endDate - Filter by participation end date
 * @query {number} classId - Filter by class ID
 */
router.get('/statistics',
  sanitizeRequest,
  validateRequest,
  BookingController.getBookingStatistics
);

export default router; 