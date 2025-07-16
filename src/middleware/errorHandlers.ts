import { Request, Response, NextFunction } from 'express';
import { ValidationError, NotFoundError, ServiceError, DatabaseError } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler middleware with comprehensive error processing
 * Handles all types of errors and provides appropriate HTTP responses
 * @param {Error} error - The error object
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const globalErrorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error with request context
  logger.error('Global error handler caught:', {
    error: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.details,
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  if (error instanceof ServiceError) {
    res.status(500).json({
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(503).json({
      success: false,
      message: 'Database service temporarily unavailable',
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  // Handle PostgreSQL specific errors
  if (error.name === 'QueryFailedError') {
    const pgError = error as any;
    
    // Handle unique constraint violations
    if (pgError.code === '23505') {
      res.status(409).json({
        success: false,
        message: 'Resource already exists',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Handle foreign key constraint violations
    if (pgError.code === '23503') {
      res.status(400).json({
        success: false,
        message: 'Referenced resource does not exist',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }

    // Handle check constraint violations
    if (pgError.code === '23514') {
      res.status(400).json({
        success: false,
        message: 'Invalid data provided',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  // Handle rate limiting errors
  if (error.message.includes('rate limit')) {
    res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      timestamp: new Date().toISOString(),
      path: req.path
    });
    return;
  }

  // Default error response
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    message: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString(),
    path: req.path
  });
};

/**
 * 404 handler for unmatched routes
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found:', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    availableRoutes: [
      'GET /api/classes',
      'POST /api/classes',
      'GET /api/classes/:id',
      'PUT /api/classes/:id',
      'DELETE /api/classes/:id',
      'GET /api/classes/search',
      'GET /api/classes/:id/statistics',
      'GET /api/bookings',
      'POST /api/bookings',
      'GET /api/bookings/:id',
      'PUT /api/bookings/:id',
      'DELETE /api/bookings/:id',
      'GET /health',
      'GET /api'
    ]
  });
};

/**
 * Request timeout handler
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const timeoutHandler = (req: Request, res: Response, next: NextFunction): void => {
  const timeout = parseInt(process.env['REQUEST_TIMEOUT'] || '30000');
  
  req.setTimeout(timeout, () => {
    logger.warn('Request timeout:', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      timeout
    });
    
    if (!res.headersSent) {
      res.status(408).json({
        success: false,
        message: 'Request timeout',
        timestamp: new Date().toISOString(),
        path: req.path
      });
    }
  });
  
  next();
};

/**
 * Request size limit handler
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requestSizeHandler = (req: Request, res: Response, next: NextFunction): void => {
  const maxSize = parseInt(process.env['MAX_REQUEST_SIZE'] || '10485760'); // 10MB default
  
  let dataSize = 0;
  
  req.on('data', (chunk) => {
    dataSize += chunk.length;
    
    if (dataSize > maxSize) {
      logger.warn('Request size limit exceeded:', {
        method: req.method,
        url: req.url,
        ip: req.ip,
        dataSize,
        maxSize
      });
      
      res.status(413).json({
        success: false,
        message: 'Request entity too large',
        timestamp: new Date().toISOString(),
        path: req.path
      });
      
      req.destroy();
      return;
    }
  });
  
  next();
};

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function with error handling
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Performance monitoring middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Monitor response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const slowQueryThreshold = parseInt(process.env.SLOW_QUERY_THRESHOLD || '1000');
    
    logger.info('PERFORMANCE: request_duration = ' + duration + 'ms', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // Log slow queries
    if (duration > slowQueryThreshold) {
      logger.warn('Slow query detected:', {
        method: req.method,
        url: req.url,
        duration,
        threshold: slowQueryThreshold,
        ip: req.ip
      });
    }
  });
  
  next();
};

/**
 * Security headers middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const securityHeaders = (req: Request, res: Response, next: NextFunction): void => {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  next();
};

/**
 * Request logging middleware
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      contentLength: res.get('Content-Length'),
      timestamp: new Date().toISOString()
    });
  });
  
  next();
}; 