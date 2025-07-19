import { Router } from 'express';
import AnalyticsController from '../controllers/AnalyticsController';
import { validateRequest, sanitizeRequest } from '../middleware/middleware';

const router = Router();

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get comprehensive dashboard statistics
 * @access  Public
 */
router.get('/dashboard',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getDashboardStatistics
);

/**
 * @route   GET /api/analytics/classes/:id/statistics
 * @desc    Get enhanced class statistics
 * @access  Public
 */
router.get('/classes/:id/statistics',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getEnhancedClassStatistics
);

/**
 * @route   GET /api/analytics/bookings/statistics
 * @desc    Get enhanced booking statistics
 * @access  Public
 */
router.get('/bookings/statistics',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getEnhancedBookingStatistics
);

export default router; 