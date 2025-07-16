import express, { Request, Response } from 'express';
import classRoutes from './classRoutes';
import bookingRoutes from './bookingRoutes';
import instructorRoutes from './instructorRoutes';
import memberRoutes from './memberRoutes';
import logger from '../utils/logger';
import database from '../config/database';

const router = express.Router();

/**
 * API documentation endpoint
 * Provides information about available endpoints and API version
 */
router.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ABC Ignite API',
    version: process.env['npm_package_version'] || '1.0.0',
    documentation: {
      classes: '/api/classes',
      bookings: '/api/bookings',
      instructors: '/api/instructors',
      members: '/api/members',
      health: '/health'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * API health check endpoint
 * Provides detailed health status for monitoring
 */
router.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const dbHealth = await database.healthCheck();
    const duration = Date.now() - startTime;
    
    res.status(200).json({
      success: true,
      status: 'OK',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      database: dbHealth.status,
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.logError('API health check failed', error as Error, { duration });
    
    res.status(503).json({
      success: false,
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      error: (error as Error).message
    });
  }
});

/**
 * Mount route modules
 * Organizes routes by resource type for better maintainability
 */
router.use('/classes', classRoutes);
router.use('/bookings', bookingRoutes);
router.use('/instructors', instructorRoutes);
router.use('/members', memberRoutes);

/**
 * 404 handler for undefined API routes
 * Returns consistent error response for missing API endpoints
 */
router.use('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'API_NOT_FOUND',
      message: 'API endpoint not found',
      path: req.originalUrl,
      availableEndpoints: {
        classes: '/api/classes',
        bookings: '/api/bookings',
        instructors: '/api/instructors',
        members: '/api/members',
        health: '/api/health'
      }
    }
  });
});

export default router; 