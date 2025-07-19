import { Request, Response } from 'express';
import MemberService from '../services/MemberService';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import { ApiResponse, CreateMemberRequest, UpdateMemberRequest, MemberFilters } from '../types';
import logger from '../utils/logger';

/**
 * Member controller with comprehensive HTTP handlers
 * Handles all member-related HTTP requests with proper error handling and logging
 * Optimized for maximum performance and clean code
 */
class MemberController {
  /**
   * Creates a new member
   * POST /api/members
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async createMember(req: Request, res: Response): Promise<void> {
    try {
      const memberData: CreateMemberRequest = req.body;
      
      logger.info('Creating new member', { email: memberData.email });
      
      const member = await MemberService.createMember(memberData);
      
      const response: ApiResponse = {
        success: true,
        data: member,
        message: 'Member created successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
      
      logger.info('Member created successfully', { memberId: member.id });
      
    } catch (error) {
      logger.error('Failed to create member:', error as Error);
      
      if (error instanceof ValidationError) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: error.details,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Gets a member by ID
   * GET /api/members/:id
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async getMemberById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Bad request',
          message: 'Member ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info('Getting member by ID', { memberId: id });
      
      const member = await MemberService.getMemberById(id);
      
      const response: ApiResponse = {
        success: true,
        data: member,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      logger.error('Failed to get member by ID:', error as Error);
      
      if (error instanceof NotFoundError) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to get member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Gets a member by email
   * GET /api/members/email/:email
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async getMemberByEmail(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.params;
      
      if (!email) {
        const response: ApiResponse = {
          success: false,
          error: 'Bad request',
          message: 'Email is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info('Getting member by email', { email });
      
      const member = await MemberService.getMemberByEmail(email);
      
      const response: ApiResponse = {
        success: true,
        data: member,
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      logger.error('Failed to get member by email:', error as Error);
      
      if (error instanceof NotFoundError) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to get member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Updates a member
   * PUT /api/members/:id
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async updateMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const memberData: UpdateMemberRequest = req.body;
      
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Bad request',
          message: 'Member ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info('Updating member', { memberId: id });
      
      const member = await MemberService.updateMember(id, memberData);
      
      const response: ApiResponse = {
        success: true,
        data: member,
        message: 'Member updated successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
      logger.info('Member updated successfully', { memberId: id });
      
    } catch (error) {
      logger.error('Failed to update member:', error as Error);
      
      if (error instanceof NotFoundError) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      if (error instanceof ValidationError) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: error.details,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to update member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Deletes a member
   * DELETE /api/members/:id
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async deleteMember(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        const response: ApiResponse = {
          success: false,
          error: 'Bad request',
          message: 'Member ID is required',
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      logger.info('Deleting member', { memberId: id });
      
      await MemberService.deleteMember(id);
      
      const response: ApiResponse = {
        success: true,
        message: 'Member deleted successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
      logger.info('Member deleted successfully', { memberId: id });
      
    } catch (error) {
      logger.error('Failed to delete member:', error as Error);
      
      if (error instanceof NotFoundError) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to delete member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Gets all members with pagination and filtering
   * GET /api/members
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async getAllMembers(req: Request, res: Response): Promise<void> {
    try {
      const filters: MemberFilters = {};
      
      if (req.query['search']) {
        filters.search = req.query['search'] as string;
      }
      if (req.query['membershipStatus']) {
        filters.membershipStatus = req.query['membershipStatus'] as string;
      }
      if (req.query['membershipType']) {
        filters.membershipType = req.query['membershipType'] as string;
      }
      if (req.query['page']) {
        filters.page = parseInt(req.query['page'] as string);
      }
      if (req.query['limit']) {
        filters.limit = parseInt(req.query['limit'] as string);
      }
      if (req.query['sortBy']) {
        filters.sortBy = req.query['sortBy'] as string;
      }
      if (req.query['sortOrder']) {
        filters.sortOrder = req.query['sortOrder'] as 'asc' | 'desc';
      }
      
      logger.info('Getting all members', { filters });
      
      const result = await MemberService.getAllMembers(filters);
      
      const response: ApiResponse = {
        success: true,
        data: result.data,
        message: 'Members retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      // Add pagination info to response headers
      res.set({
        'X-Total-Count': result.pagination.total.toString(),
        'X-Page': result.pagination.page.toString(),
        'X-Limit': result.pagination.limit.toString(),
        'X-Total-Pages': result.pagination.totalPages.toString(),
        'X-Has-Next': (result.pagination.hasNext || false).toString(),
        'X-Has-Prev': (result.pagination.hasPrev || false).toString()
      });
      
      res.status(200).json(response);
      
    } catch (error) {
      logger.error('Failed to get all members:', error as Error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to get members',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Gets member statistics
   * GET /api/members/statistics
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async getMemberStatistics(req: Request, res: Response): Promise<void> {
    try {
      logger.info('Getting member statistics');
      
      const statistics = await MemberService.getMemberStatistics();
      
      const response: ApiResponse = {
        success: true,
        data: statistics,
        message: 'Member statistics retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      logger.error('Failed to get member statistics:', error as Error);
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to get member statistics',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }

  /**
   * Creates a member if it doesn't exist, or returns existing member
   * POST /api/members/create-if-not-exists
   * @param {Request} req - Express request object
   * @param {Response} res - Express response object
   */
  static async createMemberIfNotExists(req: Request, res: Response): Promise<void> {
    try {
      const memberData: CreateMemberRequest = req.body;
      
      logger.info('Creating member if not exists', { email: memberData.email });
      
      const member = await MemberService.createMemberIfNotExists(memberData);
      
      const response: ApiResponse = {
        success: true,
        data: member,
        message: member.id ? 'Existing member found' : 'Member created successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(200).json(response);
      
    } catch (error) {
      logger.error('Failed to create member if not exists:', error as Error);
      
      if (error instanceof ValidationError) {
        const response: ApiResponse = {
          success: false,
          error: 'Validation failed',
          details: error.details,
          message: error.message,
          timestamp: new Date().toISOString()
        };
        res.status(400).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Failed to create or find member',
        timestamp: new Date().toISOString()
      };
      res.status(500).json(response);
    }
  }
}

export default MemberController; 