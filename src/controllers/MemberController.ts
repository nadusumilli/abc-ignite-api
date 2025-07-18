import { Request, Response } from 'express';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import { ApiResponse, CreateMemberRequest, UpdateMemberRequest, MemberFilters } from '../types';
import logger from '../utils/logger';
import Member from '../models/Member';

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
      
      const member = await Member.create(memberData);
      
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
      
      const member = await Member.findById(id);
      
      if (!member) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: 'Member not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
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
      
      const member = await Member.findOne({ email });
      
      if (!member) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: 'Member not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
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
      
      const member = await Member.findByIdAndUpdate(id, memberData, { new: true });
      
      if (!member) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: 'Member not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
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
      
      const member = await Member.findByIdAndDelete(id);
      
      if (!member) {
        const response: ApiResponse = {
          success: false,
          error: 'Not found',
          message: 'Member not found',
          timestamp: new Date().toISOString()
        };
        res.status(404).json(response);
        return;
      }
      
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
      
      const members = await Member.find(filters);
      const total = await Member.countDocuments(filters);
      const totalPages = Math.ceil(total / (filters.limit || 10));
      const hasNext = filters.page < totalPages;
      const hasPrev = filters.page > 1;

      const response: ApiResponse = {
        success: true,
        data: members,
        message: 'Members retrieved successfully',
        timestamp: new Date().toISOString()
      };
      
      // Add pagination info to response headers
      res.set({
        'X-Total-Count': total.toString(),
        'X-Page': filters.page.toString(),
        'X-Limit': filters.limit.toString(),
        'X-Total-Pages': totalPages.toString(),
        'X-Has-Next': hasNext.toString(),
        'X-Has-Prev': hasPrev.toString()
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
      
      const totalMembers = await Member.countDocuments();
      const activeMembers = await Member.countDocuments({ membershipStatus: 'active' });
      const inactiveMembers = await Member.countDocuments({ membershipStatus: 'inactive' });
      const totalRevenue = await Member.aggregate([
        { $group: { _id: null, totalRevenue: { $sum: '$totalRevenue' } } }
      ]);

      const response: ApiResponse = {
        success: true,
        data: {
          totalMembers,
          activeMembers,
          inactiveMembers,
          totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0
        },
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
      
      const member = await Member.findOne({ email: memberData.email });
      
      if (member) {
        const response: ApiResponse = {
          success: true,
          data: member,
          message: 'Existing member found',
          timestamp: new Date().toISOString()
        };
        res.status(200).json(response);
        return;
      }

      const newMember = await Member.create(memberData);
      
      const response: ApiResponse = {
        success: true,
        data: newMember,
        message: 'Member created successfully',
        timestamp: new Date().toISOString()
      };
      
      res.status(201).json(response);
      
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