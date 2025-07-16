import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { AuthenticatedRequest } from '../types';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 * Provides comprehensive error handling, logging, and client-friendly responses
 */
export const errorHandler = (
  err: Error | AppError,
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  // Log the error with context
  logger.error('Unhandled error occurred', {
    error: err.message,
    stack: err.stack,
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.body,
    query: req.query,
    params: req.params
  });

  // Set default error values
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errorCode = 'INTERNAL_ERROR';

  if ('statusCode' in err) {
    statusCode = err.statusCode;
    errorCode = err.errorCode;
    message = err.message;
  } else {
    // Handle specific error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorCode = 'VALIDATION_ERROR';
      message = 'Validation failed';
    } else if (err.name === 'CastError') {
      statusCode = 400;
      errorCode = 'INVALID_ID';
      message = 'Invalid ID format';
    } else if ((err as any).code === '23505') { // PostgreSQL unique constraint violation
      statusCode = 409;
      errorCode = 'DUPLICATE_ENTRY';
      message = 'Resource already exists';
    } else if ((err as any).code === '23503') { // PostgreSQL foreign key constraint violation
      statusCode = 400;
      errorCode = 'FOREIGN_KEY_VIOLATION';
      message = 'Referenced resource does not exist';
    } else if ((err as any).code === '23514') { // PostgreSQL check constraint violation
      statusCode = 400;
      errorCode = 'CHECK_CONSTRAINT_VIOLATION';
      message = 'Data validation failed';
    } else if ((err as any).code === 'ECONNREFUSED') {
      statusCode = 503;
      errorCode = 'DATABASE_UNAVAILABLE';
      message = 'Database connection failed';
    } else if ((err as any).code === 'ENOTFOUND') {
      statusCode = 503;
      errorCode = 'SERVICE_UNAVAILABLE';
      message = 'Service temporarily unavailable';
    }
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
      ...(req.requestId && { requestId: req.requestId })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    requestId: (req as AuthenticatedRequest).requestId
  });

  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      ...((req as AuthenticatedRequest).requestId && { 
        requestId: (req as AuthenticatedRequest).requestId 
      })
    },
    timestamp: new Date().toISOString()
  });
};

/**
 * Async error wrapper for route handlers
 * Eliminates the need for try-catch blocks in route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}; 