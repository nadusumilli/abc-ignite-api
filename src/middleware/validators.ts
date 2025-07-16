import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';

/**
 * Validation result handler with comprehensive error processing
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @throws {ValidationError} When validation fails
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction): void => {
  const validationErrors = validationResult(req);
  
  if (!validationErrors.isEmpty()) {
    const errorMessages = validationErrors.array().map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      value: (error as any).value || undefined
    }));
    
    throw new ValidationError('Validation failed', errorMessages);
  }
  
  next();
};

/**
 * Class creation validation rules with comprehensive field validation
 * @returns {Array} Array of validation rules
 */
export const validateCreateClass = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Class name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Class name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('instructorId')
    .isUUID(4)
    .withMessage('Instructor ID must be a valid UUID'),
  
  body('instructorName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Instructor name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Instructor name can only contain letters and spaces'),
  
  body('classType')
    .isIn(['yoga', 'pilates', 'cardio', 'strength', 'dance', 'martial-arts', 'swimming', 'cycling', 'boxing', 'crossfit'])
    .withMessage('Class type must be one of the allowed values'),
  
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date')
    .custom((value) => {
      const startDate = new Date(value);
      const now = new Date();
      if (startDate <= now) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      const endDate = new Date(value);
      const startDate = new Date(req.body.startDate);
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
    .custom((value, { req }) => {
      const startTime = req.body.startTime;
      if (value <= startTime) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  
  body('durationMinutes')
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('maxCapacity')
    .isInt({ min: 1, max: 100 })
    .withMessage('Max capacity must be between 1 and 100'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Price must be between 0 and 1000'),
  
  body('room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room name must be less than 50 characters'),
  
  body('equipmentNeeded')
    .optional()
    .isArray({ min: 0, max: 20 })
    .withMessage('Equipment needed must be an array with 0-20 items'),
  
  body('equipmentNeeded.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Equipment item must be between 1 and 50 characters'),
  
  body('difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty level must be beginner, intermediate, or advanced'),
  
  body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with 0-10 items'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  
  handleValidationErrors
];

/**
 * Class update validation rules with optional fields
 * @returns {Array} Array of validation rules
 */
export const validateUpdateClass = [
  param('id')
    .isUUID(4)
    .withMessage('Class ID must be a valid UUID'),
  
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Class name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Class name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('instructorId')
    .optional()
    .isUUID(4)
    .withMessage('Instructor ID must be a valid UUID'),
  
  body('instructorName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Instructor name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Instructor name can only contain letters and spaces'),
  
  body('classType')
    .optional()
    .isIn(['yoga', 'pilates', 'cardio', 'strength', 'dance', 'martial-arts', 'swimming', 'cycling', 'boxing', 'crossfit'])
    .withMessage('Class type must be one of the allowed values'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  body('startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  
  body('durationMinutes')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('maxCapacity')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Max capacity must be between 1 and 100'),
  
  body('price')
    .optional()
    .isFloat({ min: 0, max: 1000 })
    .withMessage('Price must be between 0 and 1000'),
  
  body('room')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Room name must be less than 50 characters'),
  
  body('equipmentNeeded')
    .optional()
    .isArray({ min: 0, max: 20 })
    .withMessage('Equipment needed must be an array with 0-20 items'),
  
  body('equipmentNeeded.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Equipment item must be between 1 and 50 characters'),
  
  body('difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty level must be beginner, intermediate, or advanced'),
  
  body('tags')
    .optional()
    .isArray({ min: 0, max: 10 })
    .withMessage('Tags must be an array with 0-10 items'),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 30 })
    .withMessage('Tag must be between 1 and 30 characters'),
  
  handleValidationErrors
];

/**
 * Class ID parameter validation
 * @returns {Array} Array of validation rules
 */
export const validateClassId = [
  param('id')
    .isUUID(4)
    .withMessage('Class ID must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Class query parameters validation for filtering and pagination
 * @returns {Array} Array of validation rules
 */
export const validateClassQuery = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  query('classType')
    .optional()
    .isIn(['yoga', 'pilates', 'cardio', 'strength', 'dance', 'martial-arts', 'swimming', 'cycling', 'boxing', 'crossfit'])
    .withMessage('Class type must be one of the allowed values'),
  
  query('instructorId')
    .optional()
    .isUUID(4)
    .withMessage('Instructor ID must be a valid UUID'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('minPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Min price must be a non-negative number'),
  
  query('maxPrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Max price must be a non-negative number'),
  
  query('difficultyLevel')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced'])
    .withMessage('Difficulty level must be beginner, intermediate, or advanced'),
  
  query('sortBy')
    .optional()
    .isIn(['name', 'startDate', 'price', 'createdAt', 'updatedAt'])
    .withMessage('Sort by must be one of the allowed fields'),
  
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
  
  handleValidationErrors
];

/**
 * Class search validation
 * @returns {Array} Array of validation rules
 */
export const validateClassSearch = [
  query('query')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
];

/**
 * Booking creation validation rules
 * @returns {Array} Array of validation rules
 */
export const validateCreateBooking = [
  body('classId')
    .isUUID(4)
    .withMessage('Class ID must be a valid UUID'),
  
  body('userId')
    .isUUID(4)
    .withMessage('User ID must be a valid UUID'),
  
  body('bookingDate')
    .isISO8601()
    .withMessage('Booking date must be a valid ISO 8601 date'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  handleValidationErrors
];

/**
 * Booking update validation rules
 * @returns {Array} Array of validation rules
 */
export const validateUpdateBooking = [
  param('id')
    .isUUID(4)
    .withMessage('Booking ID must be a valid UUID'),
  
  body('bookingDate')
    .optional()
    .isISO8601()
    .withMessage('Booking date must be a valid ISO 8601 date'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
  
  body('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'pending', 'completed'])
    .withMessage('Status must be one of the allowed values'),
  
  handleValidationErrors
];

/**
 * Booking ID parameter validation
 * @returns {Array} Array of validation rules
 */
export const validateBookingId = [
  param('id')
    .isUUID(4)
    .withMessage('Booking ID must be a valid UUID'),
  
  handleValidationErrors
];

/**
 * Booking query parameters validation
 * @returns {Array} Array of validation rules
 */
export const validateBookingQuery = [
  query('classId')
    .optional()
    .isUUID(4)
    .withMessage('Class ID must be a valid UUID'),
  
  query('userId')
    .optional()
    .isUUID(4)
    .withMessage('User ID must be a valid UUID'),
  
  query('status')
    .optional()
    .isIn(['confirmed', 'cancelled', 'pending', 'completed'])
    .withMessage('Status must be one of the allowed values'),
  
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer'),
  
  handleValidationErrors
]; 