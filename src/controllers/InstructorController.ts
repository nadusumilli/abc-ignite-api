import { Request, Response } from 'express';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../types';
import Instructor from '../models/Instructor';

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
      
      // Basic validation
      if (!instructorData.name || !instructorData.email || !instructorData.specialization) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('POST', '/api/instructors', 400, responseTime, { error: 'Missing required fields' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Missing required fields (name, email, specialization)'
        });
        return;
      }

      // Check if email is already in use
      const existingInstructor = await Instructor.findOne({ email: instructorData.email });
      if (existingInstructor) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('POST', '/api/instructors', 400, responseTime, { error: 'Email already in use' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Email already in use'
        });
        return;
      }

      const newInstructor = new Instructor(instructorData);
      await newInstructor.save();
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('POST', '/api/instructors', 201, responseTime, { instructorId: newInstructor.id });
      
      res.status(201).json({
        success: true,
        data: newInstructor
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
      
      const instructor = await Instructor.findById(instructorId);
      
      if (!instructor) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/instructors/${instructorId}`, 404, responseTime, { error: 'Instructor not found' });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Instructor not found'
        });
        return;
      }
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/instructors/${instructorId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: instructor
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
      const filters: { [key: string]: any } = {};
      if (req.query['status']) {
        filters.status = req.query['status'] as string;
      }
      if (req.query['specialization']) {
        filters.specialization = req.query['specialization'] as string;
      }
      
      const instructors = await Instructor.find(filters);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/instructors', 200, responseTime, { 
        count: instructors.length 
      });
      
      res.status(200).json({
        success: true,
        data: instructors
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
      
      // Basic validation for update
      if (!updateData.name && !updateData.email && !updateData.specialization) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/instructors/${instructorId}`, 400, responseTime, { error: 'No fields to update' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'No fields to update'
        });
        return;
      }

      const existingInstructor = await Instructor.findById(instructorId);
      if (!existingInstructor) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('PUT', `/api/instructors/${instructorId}`, 404, responseTime, { error: 'Instructor not found' });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Instructor not found'
        });
        return;
      }

      // Check if email is already in use by another instructor
      if (updateData.email && updateData.email !== existingInstructor.email) {
        const emailInUse = await Instructor.findOne({ email: updateData.email });
        if (emailInUse) {
          const responseTime = Date.now() - startTime;
          logger.logRequest('PUT', `/api/instructors/${instructorId}`, 400, responseTime, { error: 'Email already in use' });
          res.status(400).json({
            success: false,
            error: 'Validation Error',
            message: 'Email already in use'
          });
          return;
        }
      }

      Object.assign(existingInstructor, updateData);
      await existingInstructor.save();
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('PUT', `/api/instructors/${instructorId}`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: existingInstructor
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
      
      const instructor = await Instructor.findById(instructorId);
      
      if (!instructor) {
        const responseTime = Date.now() - startTime;
        logger.logRequest('DELETE', `/api/instructors/${instructorId}`, 404, responseTime, { error: 'Instructor not found' });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: 'Instructor not found'
        });
        return;
      }

      await instructor.deleteOne();
      
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
      
      const instructors = await Instructor.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } },
          { specialization: { $regex: query, $options: 'i' } },
        ]
      });
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/instructors/search', 200, responseTime, { 
        query,
        count: instructors.length 
      });
      
      res.status(200).json({
        success: true,
        data: instructors
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
      const totalInstructors = await Instructor.countDocuments();
      const activeInstructors = await Instructor.countDocuments({ status: 'active' });
      const inactiveInstructors = await Instructor.countDocuments({ status: 'inactive' });
      const totalSpecializations = await Instructor.distinct('specialization');

      const result = {
        totalInstructors,
        activeInstructors,
        inactiveInstructors,
        totalSpecializations: totalSpecializations.length,
      };
      
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