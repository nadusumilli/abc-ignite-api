import express from 'express';
import AnalyticsController from '../controllers/AnalyticsController';
import { sanitizeRequest, validateRequest } from '../middleware/middleware';

const router = express.Router();

/**
 * Analytics routes for comprehensive business intelligence
 * Provides advanced analytics for actionable insights in gym management
 */

/**
 * Get comprehensive analytics dashboard
 * GET /api/analytics/dashboard
 * @query {string} startDate - Filter by start date (ISO 8601)
 * @query {string} endDate - Filter by end date (ISO 8601)
 * @returns {Object} Comprehensive analytics dashboard data
 */
router.get('/dashboard',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getDashboard
);

/**
 * Get class performance analytics
 * GET /api/analytics/class-performance
 * @query {string} startDate - Filter by start date (ISO 8601)
 * @query {string} endDate - Filter by end date (ISO 8601)
 * @query {number} limit - Limit for top classes (default: 5)
 * @returns {Object} Class performance analytics including top classes and attendance rates
 */
router.get('/class-performance',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getClassPerformance
);

/**
 * Get member engagement analytics
 * GET /api/analytics/member-engagement
 * @query {string} startDate - Filter by start date (ISO 8601)
 * @query {string} endDate - Filter by end date (ISO 8601)
 * @query {number} limit - Limit for top members (default: 10)
 * @returns {Object} Member engagement analytics including active members and retention metrics
 */
router.get('/member-engagement',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getMemberEngagement
);

/**
 * Get time-based trend analytics
 * GET /api/analytics/time-trends
 * @query {string} startDate - Filter by start date (ISO 8601)
 * @query {string} endDate - Filter by end date (ISO 8601)
 * @returns {Object} Time-based trend analytics including weekly trends, peak hours, and day-of-week demand
 */
router.get('/time-trends',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getTimeTrends
);

/**
 * Get operational metrics analytics
 * GET /api/analytics/operational-metrics
 * @query {string} startDate - Filter by start date (ISO 8601)
 * @query {string} endDate - Filter by end date (ISO 8601)
 * @returns {Object} Operational metrics analytics including capacity utilization and booking distribution
 */
router.get('/operational-metrics',
  sanitizeRequest,
  validateRequest,
  AnalyticsController.getOperationalMetrics
);

export default router; 