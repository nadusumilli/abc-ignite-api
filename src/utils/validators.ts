import Joi from 'joi';
import { ValidationError } from './errors';

/**
 * Pagination schema for list endpoints
 */
const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  offset: Joi.number().integer().min(0).default(0),
  orderBy: Joi.string().valid('createdAt', 'updatedAt', 'name', 'startDate').default('createdAt'),
  order: Joi.string().valid('ASC', 'DESC').default('ASC')
});

/**
 * Date range schema for filtering by date
 */
const dateRangeSchema = Joi.object({
  startDate: Joi.date().iso().max('now'),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).max('now')
});

/**
 * Class creation schema (camelCase, production-grade)
 */
const createClassSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  description: Joi.string().trim().max(500).optional(),
  instructorId: Joi.string().guid({ version: 'uuidv4' }).required(),
  instructorName: Joi.string().trim().max(100).optional(),
  classType: Joi.string().trim().max(50).required(),
  startDate: Joi.date().iso().min('now').required(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).required(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
  durationMinutes: Joi.number().integer().min(15).max(480).required(),
  maxCapacity: Joi.number().integer().min(1).max(100).required(),
  price: Joi.number().min(0).max(10000).default(0),
  location: Joi.string().trim().max(255).optional(),
  room: Joi.string().trim().max(100).optional(),
  equipmentNeeded: Joi.array().items(Joi.string().trim().max(100)).optional(),
  difficultyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all_levels').default('all_levels'),
  tags: Joi.array().items(Joi.string().trim().max(50)).optional()
});

/**
 * Class update schema (camelCase, partial)
 */
const updateClassSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  description: Joi.string().trim().max(500).optional(),
  instructorId: Joi.string().guid({ version: 'uuidv4' }).optional(),
  instructorName: Joi.string().trim().max(100).optional(),
  classType: Joi.string().trim().max(50).optional(),
  startDate: Joi.date().iso().min('now').optional(),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  startTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  endTime: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  durationMinutes: Joi.number().integer().min(15).max(480).optional(),
  maxCapacity: Joi.number().integer().min(1).max(100).optional(),
  price: Joi.number().min(0).max(10000).optional(),
  location: Joi.string().trim().max(255).optional(),
  room: Joi.string().trim().max(100).optional(),
  equipmentNeeded: Joi.array().items(Joi.string().trim().max(100)).optional(),
  difficultyLevel: Joi.string().valid('beginner', 'intermediate', 'advanced', 'all_levels').optional(),
  tags: Joi.array().items(Joi.string().trim().max(50)).optional(),
  status: Joi.string().valid('active', 'cancelled', 'completed', 'inactive').optional()
});

/**
 * Booking creation schema (camelCase, production-grade)
 */
const createBookingSchema = Joi.object({
  classId: Joi.string().required(),  // Remove UUID validation to allow both formats
  memberId: Joi.string().guid({ version: 'uuidv4' }).optional(),
  memberName: Joi.string().trim().min(1).max(100).required(),
  memberEmail: Joi.string().email().max(255).required(),
  memberPhone: Joi.string().trim().max(50).optional(),
  participationDate: Joi.date().iso().min('now').required(),
  notes: Joi.string().trim().max(500).optional()
});

/**
 * Booking update schema (camelCase, partial)
 */
const updateBookingSchema = Joi.object({
  memberName: Joi.string().trim().min(1).max(100).optional(),
  memberEmail: Joi.string().email().max(255).optional(),
  memberPhone: Joi.string().trim().max(50).optional(),
  participationDate: Joi.date().iso().min('now').optional(),
  notes: Joi.string().trim().max(500).optional(),
  status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'attended', 'no_show').optional(),
  attendedAt: Joi.date().iso().optional(),
  cancelledAt: Joi.date().iso().optional(),
  cancelledBy: Joi.string().guid({ version: 'uuidv4' }).optional(),
  cancellationReason: Joi.string().trim().max(255).optional()
});

/**
 * Member creation schema (camelCase, production-grade)
 */
const createMemberSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().max(255).required(),
  phone: Joi.string().trim().max(50).optional(),
  dateOfBirth: Joi.date().iso().max('now').optional(),
  membershipType: Joi.string().valid('standard', 'premium', 'vip').default('standard'),
  emergencyContactName: Joi.string().trim().max(100).optional(),
  emergencyContactPhone: Joi.string().trim().max(50).optional(),
  medicalNotes: Joi.string().trim().max(1000).optional()
});

/**
 * Member update schema (camelCase, partial)
 */
const updateMemberSchema = Joi.object({
  name: Joi.string().trim().min(1).max(100).optional(),
  email: Joi.string().email().max(255).optional(),
  phone: Joi.string().trim().max(50).optional(),
  dateOfBirth: Joi.date().iso().max('now').optional(),
  membershipType: Joi.string().valid('standard', 'premium', 'vip').optional(),
  membershipStatus: Joi.string().valid('active', 'inactive', 'suspended', 'expired').optional(),
  emergencyContactName: Joi.string().trim().max(100).optional(),
  emergencyContactPhone: Joi.string().trim().max(50).optional(),
  medicalNotes: Joi.string().trim().max(1000).optional()
});

/**
 * ID parameter schema
 */
const idParamSchema = Joi.object({
  id: Joi.string().guid({ version: 'uuidv4' }).required()
});

/**
 * Search query schema
 */
const searchQuerySchema = Joi.object({
  q: Joi.string().trim().min(1).max(100).required(),
  type: Joi.string().valid('class', 'booking', 'member').optional()
});

/**
 * Validate data against a schema
 */
const validateData = (data: any, schema: Joi.Schema, options: Joi.ValidationOptions = {}): any => {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    ...options
  });
  
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      value: detail.context?.value
    }));
    throw new ValidationError('Validation failed', details);
  }
  
  return value;
};

/**
 * Validate request data
 */
const validateRequest = (req: any, schemas: {
  body?: Joi.Schema;
  query?: Joi.Schema;
  params?: Joi.Schema;
} = {}): any => {
  const validatedData: any = {};
  
  if (schemas.body) {
    validatedData.body = validateData(req.body, schemas.body);
  }
  
  if (schemas.query) {
    validatedData.query = validateData(req.query, schemas.query);
  }
  
  if (schemas.params) {
    validatedData.params = validateData(req.params, schemas.params);
  }
  
  return validatedData;
};

/**
 * Sanitize pagination parameters
 */
const sanitizePagination = (query: any): any => {
  const pagination = validateData(query, paginationSchema);
  if (pagination.page && !pagination.offset) {
    pagination.offset = (pagination.page - 1) * pagination.limit;
  }
  return pagination;
};

/**
 * Sanitize date range parameters
 */
const sanitizeDateRange = (query: any): any => {
  return validateData(query, dateRangeSchema);
};

/**
 * Sanitize search parameters
 */
const sanitizeSearch = (query: any): any => {
  return validateData(query, searchQuerySchema);
};

export {
  paginationSchema,
  dateRangeSchema,
  createClassSchema,
  updateClassSchema,
  createBookingSchema,
  updateBookingSchema,
  createMemberSchema,
  updateMemberSchema,
  idParamSchema,
  searchQuerySchema,
  validateData,
  validateRequest,
  sanitizePagination,
  sanitizeDateRange,
  sanitizeSearch
}; 