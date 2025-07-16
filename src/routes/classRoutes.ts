import express from 'express';
import ClassController from '../controllers/ClassController';
import { validateRequest, sanitizeRequest } from '../middleware/middleware';

const router = express.Router();

/**
 * Class routes with comprehensive validation and error handling
 * Provides RESTful endpoints for class management
 */

/**
 * Create a new class
 * POST /api/classes
 * @body {Object} classData - Class information
 */
router.post('/', 
  sanitizeRequest,
  validateRequest,
  ClassController.createClass
);

/**
 * Get all classes with filtering and pagination
 * GET /api/classes
 * @query {string} startDate - Filter by start date
 * @query {string} endDate - Filter by end date
 * @query {string} status - Filter by status (active, cancelled, completed)
 * @query {string} instructor - Filter by instructor name
 * @query {number} limit - Number of results per page (default: 20, max: 100)
 * @query {number} offset - Number of results to skip (default: 0)
 * @query {string} orderBy - Sort field (created_at, updated_at, name, start_date)
 * @query {string} orderDirection - Sort direction (ASC, DESC)
 */
router.get('/', 
  sanitizeRequest,
  validateRequest,
  ClassController.getAllClasses
);

/**
 * Search classes with full-text search
 * GET /api/classes/search
 * @query {string} q - Search query (required)
 * @query {number} limit - Number of results per page (default: 20, max: 100)
 * @query {number} offset - Number of results to skip (default: 0)
 * @query {string} startDate - Filter by start date
 * @query {string} endDate - Filter by end date
 */
router.get('/search',
  sanitizeRequest,
  validateRequest,
  ClassController.searchClasses
);

/**
 * Get class by ID
 * GET /api/classes/:id
 * @param {number} id - Class ID
 */
router.get('/:id',
  sanitizeRequest,
  validateRequest,
  ClassController.getClassById
);

/**
 * Update class
 * PUT /api/classes/:id
 * @param {number} id - Class ID
 * @body {Object} updateData - Class data to update
 */
router.put('/:id',
  sanitizeRequest,
  validateRequest,
  ClassController.updateClass
);

/**
 * Delete class
 * DELETE /api/classes/:id
 * @param {number} id - Class ID
 */
router.delete('/:id',
  sanitizeRequest,
  validateRequest,
  ClassController.deleteClass
);

/**
 * Get class statistics
 * GET /api/classes/:id/statistics
 * @param {number} id - Class ID
 */
router.get('/:id/statistics',
  sanitizeRequest,
  validateRequest,
  ClassController.getClassStatistics
);

/**
 * Get class bookings
 * GET /api/classes/:id/bookings
 * @param {number} id - Class ID
 * @query {number} limit - Number of results per page (default: 20, max: 100)
 * @query {number} offset - Number of results to skip (default: 0)
 * @query {string} status - Filter by booking status
 */
router.get('/:id/bookings',
  sanitizeRequest,
  validateRequest,
  ClassController.getClassBookings
);

export default router; 