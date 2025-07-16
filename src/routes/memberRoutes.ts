import express from 'express';
import MemberController from '../controllers/MemberController';
import { validateRequest, sanitizeRequest } from '../middleware/middleware';
import { createMemberSchema, updateMemberSchema, validateData } from '../utils/validators';

const router = express.Router();

/**
 * Member routes with comprehensive validation and error handling
 * Provides RESTful endpoints for member management
 */

/**
 * Create a new member
 * POST /api/members
 * @body {Object} memberData - Member information
 */
router.post('/', 
  sanitizeRequest,
  validateRequest,
  (req, res, next) => {
    try {
      // Validate member data using Joi schema
      req.body = validateData(req.body, createMemberSchema);
      next();
    } catch (error) {
      next(error);
    }
  },
  MemberController.createMember
);

/**
 * Get all members with pagination and filtering
 * GET /api/members
 * @query {string} search - Search term for name, email, or phone
 * @query {string} membershipStatus - Filter by membership status
 * @query {string} membershipType - Filter by membership type
 * @query {number} page - Page number for pagination
 * @query {number} limit - Number of items per page
 * @query {string} sortBy - Field to sort by
 * @query {string} sortOrder - Sort order (asc or desc)
 */
router.get('/', 
  validateRequest,
  MemberController.getAllMembers
);

/**
 * Get member statistics
 * GET /api/members/statistics
 */
router.get('/statistics', 
  validateRequest,
  MemberController.getMemberStatistics
);

/**
 * Get a member by email
 * GET /api/members/email/:email
 * @param {string} email - Member email address
 */
router.get('/email/:email', 
  validateRequest,
  MemberController.getMemberByEmail
);

/**
 * Get a member by ID
 * GET /api/members/:id
 * @param {string} id - Member ID
 */
router.get('/:id', 
  validateRequest,
  MemberController.getMemberById
);

/**
 * Update a member
 * PUT /api/members/:id
 * @param {string} id - Member ID
 * @body {Object} memberData - Member data to update
 */
router.put('/:id', 
  sanitizeRequest,
  validateRequest,
  (req, res, next) => {
    try {
      // Validate member data using Joi schema
      req.body = validateData(req.body, updateMemberSchema);
      next();
    } catch (error) {
      next(error);
    }
  },
  MemberController.updateMember
);

/**
 * Delete a member
 * DELETE /api/members/:id
 * @param {string} id - Member ID
 */
router.delete('/:id', 
  validateRequest,
  MemberController.deleteMember
);

/**
 * Create a member if it doesn't exist, or return existing member
 * POST /api/members/create-if-not-exists
 * @body {Object} memberData - Member information
 */
router.post('/create-if-not-exists', 
  sanitizeRequest,
  validateRequest,
  (req, res, next) => {
    try {
      // Validate member data using Joi schema
      req.body = validateData(req.body, createMemberSchema);
      next();
    } catch (error) {
      next(error);
    }
  },
  MemberController.createMemberIfNotExists
);

export default router; 