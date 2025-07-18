import express from 'express';
import ClassController from '../controllers/ClassController';
import { sanitizeRequest } from '../middleware/middleware';
import { validateCreateClass, validateUpdateClass, validateClassId, validateClassQuery, validateClassSearch } from '../middleware/validators';

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
  ...validateCreateClass,
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
  ...validateClassQuery,
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
  ...validateClassSearch,
  ClassController.searchClasses
);

/**
 * Get class by ID
 * GET /api/classes/:id
 * @param {number} id - Class ID
 */
router.get('/:id',
  sanitizeRequest,
  ...validateClassId,
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
  ...validateUpdateClass,
  ClassController.updateClass
);

/**
 * Delete class
 * DELETE /api/classes/:id
 * @param {number} id - Class ID
 */
router.delete('/:id',
  sanitizeRequest,
  ...validateClassId,
  ClassController.deleteClass
);

/**
 * Get class statistics
 * GET /api/classes/:id/statistics
 * @param {number} id - Class ID
 */
router.get('/:id/statistics',
  sanitizeRequest,
  ...validateClassId,
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
  ...validateClassId,
  ClassController.getClassBookings
);

/**
 * Create multiple classes for date range (ABC Ignite requirement)
 * POST /api/classes/date-range
 */
router.post('/date-range', 
  validateCreateClass,
  ClassController.createClassesForDateRange
);

export default router; 