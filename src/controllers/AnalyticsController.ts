import { Request, Response } from 'express';
import { ValidationError, NotFoundError, ServiceError } from '../utils/errors';
import logger from '../utils/logger';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, DashboardStatistics } from '../types';
import ClassService from '../services/ClassService';
import BookingService from '../services/BookingService';
import MemberService from '../services/MemberService';
import InstructorService from '../services/InstructorService';

/**
 * Analytics controller with comprehensive business intelligence
 * Provides detailed statistics and insights for gym management
 */
class AnalyticsController {
  /**
   * Get comprehensive dashboard statistics
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getDashboardStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const startDate = req.query['startDate'] as string;
      const endDate = req.query['endDate'] as string;
      
      // Get basic statistics - use default pagination (no limit override)
      const classStats = await ClassService.getAllClasses({ startDate, endDate });
      const bookingStats = await BookingService.getAllBookings({ startDate, endDate });
      const memberStats = await MemberService.getAllMembers({});
      const instructorStats = await InstructorService.getAllInstructors({});

      // Calculate overview metrics
      const totalClasses = classStats.data.length;
      const totalBookings = bookingStats.data.length;
      const totalMembers = memberStats.data.length;
      const totalInstructors = instructorStats.length;
      
      const activeClasses = classStats.data.filter((c: any) => c.status === 'active').length;
      const pendingBookings = bookingStats.data.filter((b: any) => b.status === 'pending').length;
      
      // Calculate today's bookings
      const today = new Date().toISOString().split('T')[0];
      const todayBookings = bookingStats.data.filter((b: any) => 
        b.participationDate.toISOString().split('T')[0] === today
      ).length;

      // Calculate this week's revenue
      const thisWeekStart = new Date();
      thisWeekStart.setDate(thisWeekStart.getDate() - 7);
      const thisWeekRevenue = classStats.data
        .filter((c: any) => new Date(c.startDate) >= thisWeekStart)
        .reduce((sum: number, c: any) => sum + (c.price || 0), 0);

      // Calculate performance metrics
      const attendedBookings = bookingStats.data.filter((b: any) => b.status === 'attended').length;
      const cancelledBookings = bookingStats.data.filter((b: any) => b.status === 'cancelled').length;
      const noShowBookings = bookingStats.data.filter((b: any) => b.status === 'no_show').length;
      
      const attendanceRate = totalBookings > 0 ? (attendedBookings / totalBookings) * 100 : 0;
      const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;
      const noShowRate = totalBookings > 0 ? (noShowBookings / totalBookings) * 100 : 0;

      // Calculate capacity utilization
      const totalCapacity = classStats.data.reduce((sum: number, c: any) => sum + c.maxCapacity, 0);
      const capacityUtilization = totalCapacity > 0 ? (totalBookings / totalCapacity) * 100 : 0;

      // Calculate average bookings per member
      const averageBookingsPerMember = totalMembers > 0 ? totalBookings / totalMembers : 0;

      // Calculate average revenue per class
      const totalRevenue = classStats.data.reduce((sum: number, c: any) => sum + (c.price || 0), 0);
      const averageRevenuePerClass = totalClasses > 0 ? totalRevenue / totalClasses : 0;

      // Generate popular classes
      const classBookingCounts = new Map<string, { name: string; bookings: number; revenue: number }>();
      classStats.data.forEach((c: any) => {
        const bookings = bookingStats.data.filter((b: any) => b.classId === c.id).length;
        classBookingCounts.set(c.id, {
          name: c.name,
          bookings,
          revenue: c.price || 0
        });
      });

      const popularClasses = Array.from(classBookingCounts.entries())
        .map(([id, data]) => ({ name: data.name, bookings: data.bookings, revenue: data.revenue }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 5);

      // Generate top instructors
      const instructorStatsMap = new Map<string, { name: string; classes: number; attendance: number }>();
      classStats.data.forEach((c: any) => {
        const existing = instructorStatsMap.get(c.instructorId) || { name: c.instructorName, classes: 0, attendance: 0 };
        const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
        const attended = classBookings.filter((b: any) => b.status === 'attended').length;
        
        instructorStatsMap.set(c.instructorId, {
          name: c.instructorName,
          classes: existing.classes + 1,
          attendance: existing.attendance + attended
        });
      });

      const topInstructors = Array.from(instructorStatsMap.values())
        .sort((a, b) => b.attendance - a.attendance)
        .slice(0, 5);

      // Generate alerts
      const lowAttendanceClasses = classStats.data
        .filter((c: any) => {
          const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
          const attended = classBookings.filter((b: any) => b.status === 'attended').length;
          const attendanceRate = classBookings.length > 0 ? (attended / classBookings.length) * 100 : 0;
          return attendanceRate < 50 && classBookings.length > 0;
        })
        .map((c: any) => ({
          classId: c.id,
          className: c.name,
          attendanceRate: (() => {
            const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
            const attended = classBookings.filter((b: any) => b.status === 'attended').length;
            return classBookings.length > 0 ? (attended / classBookings.length) * 100 : 0;
          })()
        }))
        .slice(0, 5);

      const highCancellationClasses = classStats.data
        .filter((c: any) => {
          const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
          const cancelled = classBookings.filter((b: any) => b.status === 'cancelled').length;
          const cancellationRate = classBookings.length > 0 ? (cancelled / classBookings.length) * 100 : 0;
          return cancellationRate > 30 && classBookings.length > 0;
        })
        .map((c: any) => ({
          classId: c.id,
          className: c.name,
          cancellationRate: (() => {
            const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
            const cancelled = classBookings.filter((b: any) => b.status === 'cancelled').length;
            return classBookings.length > 0 ? (cancelled / classBookings.length) * 100 : 0;
          })()
        }))
        .slice(0, 5);

      const upcomingFullClasses = classStats.data
        .filter((c: any) => {
          const classBookings = bookingStats.data.filter((b: any) => b.classId === c.id);
          return classBookings.length >= c.maxCapacity * 0.9 && c.status === 'active';
        })
        .map((c: any) => ({
          classId: c.id,
          className: c.name,
          capacity: c.maxCapacity,
          bookings: bookingStats.data.filter((b: any) => b.classId === c.id).length
        }))
        .slice(0, 5);

      const dashboardStats: DashboardStatistics = {
        overview: {
          totalClasses,
          totalBookings,
          totalMembers,
          totalInstructors,
          activeClasses,
          pendingBookings,
          todayBookings,
          thisWeekRevenue
        },
        performance: {
          attendanceRate: Math.round(attendanceRate * 100) / 100,
          capacityUtilization: Math.round(capacityUtilization * 100) / 100,
          cancellationRate: Math.round(cancellationRate * 100) / 100,
          noShowRate: Math.round(noShowRate * 100) / 100,
          averageBookingsPerMember: Math.round(averageBookingsPerMember * 100) / 100,
          averageRevenuePerClass: Math.round(averageRevenuePerClass * 100) / 100
        },
        trends: {
          weeklyBookings: [],
          monthlyRevenue: [],
          popularClasses,
          topInstructors
        },
        alerts: {
          lowAttendanceClasses,
          highCancellationClasses,
          upcomingFullClasses
        }
      };

      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/analytics/dashboard', 200, responseTime, { 
        totalClasses, 
        totalBookings,
        totalMembers 
      });
      
      res.status(200).json({
        success: true,
        data: dashboardStats
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/analytics/dashboard', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Dashboard statistics retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve dashboard statistics'
      });
    }
  });

  /**
   * Get enhanced class statistics
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getEnhancedClassStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const classId = req.params['id'] || '';
      
      if (!classId || classId.trim() === '') {
        const responseTime = Date.now() - startTime;
        logger.logRequest('GET', `/api/analytics/classes/${req.params['id']}/statistics`, 400, responseTime, { error: 'Invalid class ID' });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: 'Invalid class ID'
        });
        return;
      }
      
      const result = await ClassService.getClassStatistics(classId);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', `/api/analytics/classes/${classId}/statistics`, 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const classId = req.params['id'];
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', `/api/analytics/classes/${classId}/statistics`, 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      if (error instanceof NotFoundError) {
        logger.logRequest('GET', `/api/analytics/classes/${classId}/statistics`, 404, responseTime, { error: error.message });
        res.status(404).json({
          success: false,
          error: 'Not Found',
          message: error.message
        });
        return;
      }
      
      logger.logError('Enhanced class statistics retrieval failed', error, { classId, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve enhanced class statistics'
      });
    }
  });

  /**
   * Get enhanced booking statistics
   * @param req - Authenticated request object
   * @param res - Response object
   */
  static getEnhancedBookingStatistics = asyncHandler(async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    
    try {
      const options = {
        ...(req.query['startDate'] && { startDate: req.query['startDate'] as string }),
        ...(req.query['endDate'] && { endDate: req.query['endDate'] as string }),
        ...(req.query['classId'] && { classId: parseInt(req.query['classId'] as string) }),
      };
      
      const result = await BookingService.getBookingStatistics(options);
      
      const responseTime = Date.now() - startTime;
      logger.logRequest('GET', '/api/analytics/bookings/statistics', 200, responseTime);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      if (error instanceof ValidationError) {
        logger.logRequest('GET', '/api/analytics/bookings/statistics', 400, responseTime, { error: error.message });
        res.status(400).json({
          success: false,
          error: 'Validation Error',
          message: error.message,
          details: error.details
        });
        return;
      }
      
      logger.logError('Enhanced booking statistics retrieval failed', error, { query: req.query, responseTime });
      res.status(500).json({
        success: false,
        error: 'Internal Server Error',
        message: 'Failed to retrieve enhanced booking statistics'
      });
    }
  });
}

export default AnalyticsController; 