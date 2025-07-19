import { Request, Response } from 'express';
import ClassService from '../services/ClassService';
import { ValidationError, NotFoundError, ConflictError, ServiceError, BusinessError } from '../utils/errors';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, ClassFilters, CreateClassRequest, UpdateClassRequest } from '../types';

/**
 * Class controller with comprehensive request handling and error management
 * Provides RESTful endpoints for class management with performance monitoring
 */
class ClassController {
  /**
   * Create a new class
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static createClass = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classData: CreateClassRequest = req.body;
      
      const result = await ClassService.createClass(classData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', '/api/classes', 201, responseTime, { 
        classesCreated: result.length,
        classIds: result.map(c => c.id)
      });
      
      res.status(201).json({
        success: true,
        data: result,
        message: `Successfully created ${result.length} classes`
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('POST', '/api/classes', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof ConflictError) {
        logger.logRequest('POST', '/api/classes', 409, responseTime, { error: error.message });
        res.status(409).json({
          success: false,
          error: 'Conflict Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Class creation failed', error, { requestBody: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create class'
      });
    }
  });

  /**
   * Get class by ID
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getClassById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      
      if (!classId || classId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/classes/${req.params['id']}`, 400, responseTime, { error: 'Invalid class ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid class ID'
        });
        return;
      }
      
      const result = await ClassService.getClassById(classId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/classes/${classId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/classes/${classId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/classes/${classId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Class retrieval failed', error, { classId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve class'
      });
    }
  });

  /**
   * Get all classes with filtering
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getAllClasses = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const filters: ClassFilters = {
        ...(req.query['startDate'] && { startDate: req.query['startDate'] as string }),
        ...(req.query['endDate'] && { endDate: req.query['endDate'] as string }),
        ...(req.query['status'] && { status: req.query['status'] as string }),
        ...(req.query['instructor'] && { instructor: req.query['instructor'] as string }),
        ...(req.query['limit'] && { limit: parseInt(req.query['limit'] as string) }),
        ...(req.query['offset'] && { offset: parseInt(req.query['offset'] as string) }),
        ...(req.query['orderBy'] && { orderBy: req.query['orderBy'] as string }),
        ...(req.query['orderDirection'] && { orderDirection: req.query['orderDirection'] as 'ASC' | 'DESC' }),
      };
      
      const result = await ClassService.getAllClasses(filters);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/classes', 200, responseTime, { 
        count: result.data?.length 
      });
      
      res.status(200).json({
        success: true,
        ...result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/classes', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Classes retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve classes'
      });
    }
  });

  /**
   * Update class
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static updateClass = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      
      if (!classId || classId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/classes/${req.params['id']}`, 400, responseTime, { error: 'Invalid class ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid class ID'
        });
        return;
      }
      
      const updateData: UpdateClassRequest = req.body;
      
      const result = await ClassService.updateClass(classId, updateData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('PUT', `/api/classes/${classId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('PUT', `/api/classes/${classId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          errorCode: error.errorCode,
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('PUT', `/api/classes/${classId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      if (error instanceof ConflictError) {
        logger.logRequest('PUT', `/api/classes/${classId}`, 409, responseTime, { error: error.message });
        res.status(409).json({
          success: false,
          error: 'Conflict Error',
          errorCode: error.errorCode,
          message: error.message,
          details: error.details
        });
        return;
      }

      // Handle BusinessError (custom business logic errors)
      if (error instanceof BusinessError) {
        logger.logRequest('PUT', `/api/classes/${classId}`, 422, responseTime, { error: error.message });
        res.status(422).json({
          success: false,
          error: 'Business Rule Violation',
          errorCode: error.errorCode,
          message: error.message
        });
        return;
      }
      
      logger.logError('Class update failed', error, { classId, updateData: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update class'
      });
    }
  });

  /**
   * Delete class
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static deleteClass = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      
      if (!classId || classId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('DELETE', `/api/classes/${req.params['id']}`, 400, responseTime, { error: 'Invalid class ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid class ID'
        });
        return;
      }
      
      const result = await ClassService.deleteClass(classId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('DELETE', `/api/classes/${classId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('DELETE', `/api/classes/${classId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('DELETE', `/api/classes/${classId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Class deletion failed', error, { classId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete class'
      });
    }
  });

  /**
   * Get class statistics
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getClassStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      
      if (!classId || classId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/classes/${req.params['id']}/statistics`, 400, responseTime, { error: 'Invalid class ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid class ID'
        });
        return;
      }
      
      const result = await ClassService.getClassStatistics(classId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/classes/${classId}/statistics`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/classes/${classId}/statistics`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/classes/${classId}/statistics`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Class statistics retrieval failed', error, { classId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve class statistics'
      });
    }
  });

  /**
   * Search classes
   */
  static searchClasses = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const query = req.query['q'] as string;
      const limit = parseInt(req.query['limit'] as string) || 20;
      const offset = parseInt(req.query['offset'] as string) || 0;
      const startDate = req.query['startDate'] as string;
      const endDate = req.query['endDate'] as string;
      
      const result = await ClassService.searchClasses({ query, limit, offset, startDate, endDate });
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/classes/search', 200, responseTime, { 
        query, 
        count: result.data?.length 
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/classes/search', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Class search failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to search classes'
      });
    }
  });

  /**
   * Get class bookings
   */
  static getClassBookings = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      const filters = {
        classId,
        limit: parseInt(req.query['limit'] as string) || 20,
        offset: parseInt(req.query['offset'] as string) || 0,
        status: req.query['status'] as string
      };
      
      const BookingService = require('../services/BookingService').default;
      const result = await BookingService.getAllBookings(filters);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/classes/${classId}/bookings`, 200, responseTime, { 
        count: result.data?.length 
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/classes/${classId}/bookings`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/classes/${classId}/bookings`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Class bookings retrieval failed', error, { classId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve class bookings'
      });
    }
  });
}

export default ClassController; 