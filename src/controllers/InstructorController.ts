import { Request, Response } from 'express';
import InstructorService from '../services/InstructorService';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';

/**
 * Instructor controller with comprehensive request handling and error management
 * Provides RESTful endpoints for instructor management
 */
class InstructorController {
  /**
   * Create a new instructor
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static createInstructor = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const instructorData = req.body;
      
      const result = await InstructorService.createInstructor(instructorData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', '/api/instructors', 201, responseTime, { instructorId: result.id });
      
      res.status(201).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('POST', '/api/instructors', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
      
      logger.logError('Instructor creation failed', error, { requestBody: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to create instructor'
      });
    }
  });

  /**
   * Get instructor by ID
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getInstructorById = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const instructorId = req.params['id'];
      
      if (!instructorId) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/instructors/${req.params['id']}`, 400, responseTime, { error: 'Invalid instructor ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid instructor ID'
        });
        return;
      }
      
      const result = await InstructorService.getInstructorById(instructorId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/instructors/${instructorId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const instructorId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/instructors/${instructorId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/instructors/${instructorId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Instructor retrieval failed', error, { instructorId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve instructor'
      });
    }
  });

  /**
   * Get all instructors with filtering
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getAllInstructors = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const filters = {
        ...(req.query['status'] && { status: req.query['status'] as string }),
        ...(req.query['specialization'] && { specialization: req.query['specialization'] as string }),
      };
      
      const result = await InstructorService.getAllInstructors(filters);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/instructors', 200, responseTime, { 
        count: result.length 
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.logError('Instructors retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve instructors'
      });
    }
  });

  /**
   * Update instructor
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static updateInstructor = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const instructorId = req.params['id'];
      
      if (!instructorId) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/instructors/${req.params['id']}`, 400, responseTime, { error: 'Invalid instructor ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid instructor ID'
        });
        return;
      }
      
      const updateData = req.body;
      
      const result = await InstructorService.updateInstructor(instructorId, updateData);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('PUT', `/api/instructors/${instructorId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const instructorId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('PUT', `/api/instructors/${instructorId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('PUT', `/api/instructors/${instructorId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Instructor update failed', error, { instructorId, requestBody: req.body, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to update instructor'
      });
    }
  });

  /**
   * Delete instructor
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static deleteInstructor = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const instructorId = req.params['id'];
      
      if (!instructorId) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('DELETE', `/api/instructors/${req.params['id']}`, 400, responseTime, { error: 'Invalid instructor ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid instructor ID'
        });
        return;
      }
      
      await InstructorService.deleteInstructor(instructorId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('DELETE', `/api/instructors/${instructorId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        message: 'Instructor deleted successfully'
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const instructorId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('DELETE', `/api/instructors/${instructorId}`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('DELETE', `/api/instructors/${instructorId}`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Instructor deletion failed', error, { instructorId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to delete instructor'
      });
    }
  });

  /**
   * Search instructors
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static searchInstructors = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const query = req.query['q'] as string;
      
      if (!query) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', '/api/instructors/search', 400, responseTime, { error: 'Search query is required' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Search query is required'
        });
        return;
      }
      
      const result = await InstructorService.searchInstructors(query);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/instructors/search', 200, responseTime, { 
        query,
        count: result.length 
      });
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/instructors/search', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message
        });
        return;
      }
      
      logger.logError('Instructor search failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to search instructors'
      });
    }
  });

  /**
   * Get instructor statistics
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getInstructorStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const result = await InstructorService.getInstructorStatistics();
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/instructors/statistics', 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logger.logError('Instructor statistics failed', error, { responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to get instructor statistics'
      });
    }
  });
}

export default InstructorController; 