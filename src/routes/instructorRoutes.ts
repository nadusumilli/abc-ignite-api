import { Router } from 'express';
import InstructorController from '../controllers/InstructorController';
import { rateLimiter, requestLogger } from '../middleware/middleware';

const router = Router();

/**
 * @route   POST /api/instructors
 * @desc    Create a new instructor
 * @access  Public (no authentication required)
 * @body    {
 *   "name": "string (required)",
 *   "email": "string (required, valid email)",
 *   "phone": "string (optional)",
 *   "specialization": "string (optional)",
 *   "bio": "string (optional)"
 * }
 */
router.post(
  '/',
  rateLimiter,
  requestLogger,
  InstructorController.createInstructor
);

/**
 * @route   GET /api/instructors
 * @desc    Get all instructors with optional filtering
 * @access  Public (no authentication required)
 * @query   {
 *   "status": "string (optional) - active, inactive, suspended",
 *   "specialization": "string (optional) - filter by specialization"
 * }
 */
router.get(
  '/',
  rateLimiter,
  requestLogger,
  InstructorController.getAllInstructors
);

/**
 * @route   GET /api/instructors/:id
 * @desc    Get instructor by ID
 * @access  Public (no authentication required)
 * @param   {string} id - Instructor ID (UUID)
 */
router.get(
  '/:id',
  rateLimiter,
  requestLogger,
  InstructorController.getInstructorById
);

/**
 * @route   PUT /api/instructors/:id
 * @desc    Update instructor
 * @access  Public (no authentication required)
 * @param   {string} id - Instructor ID (UUID)
 * @body    {
 *   "name": "string (optional)",
 *   "email": "string (optional, valid email)",
 *   "phone": "string (optional)",
 *   "specialization": "string (optional)",
 *   "bio": "string (optional)",
 *   "status": "string (optional) - active, inactive, suspended"
 * }
 */
router.put(
  '/:id',
  rateLimiter,
  requestLogger,
  InstructorController.updateInstructor
);

/**
 * @route   DELETE /api/instructors/:id
 * @desc    Delete instructor
 * @access  Public (no authentication required)
 * @param   {string} id - Instructor ID (UUID)
 */
router.delete(
  '/:id',
  rateLimiter,
  requestLogger,
  InstructorController.deleteInstructor
);

/**
 * @route   GET /api/instructors/search
 * @desc    Search instructors by name, specialization, or bio
 * @access  Public (no authentication required)
 * @query   {
 *   "q": "string (required) - search query (min 2 characters)"
 * }
 */
router.get(
  '/search',
  rateLimiter,
  requestLogger,
  InstructorController.searchInstructors
);

/**
 * @route   GET /api/instructors/statistics
 * @desc    Get instructor statistics
 * @access  Public (no authentication required)
 */
router.get(
  '/statistics',
  rateLimiter,
  requestLogger,
  InstructorController.getInstructorStatistics
);

export default router; 