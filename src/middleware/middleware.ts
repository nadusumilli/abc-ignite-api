import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import database from '../config/database';

/**
 * Rate limiter configuration for API protection
 */
export const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    logger.logWarning('Rate limit exceeded', { 
      ip: req.ip, 
      userAgent: req.get('User-Agent') 
    });
    res.status(429).json({
      success: false,
      error: 'Too Many Requests',
      message: 'Too many requests from this IP, please try again later.'
    });
  }
});

/**
 * Request logger middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  
  // Log request start
  logger.logRequest(req.method, req.originalUrl, 0, 0, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type')
  });
  
  // Override res.end to log response
  const originalEnd = res.end;
  (res as any).end = function(chunk: any, encoding?: BufferEncoding) {
    const responseTime = Date.now() - startTime;
    
    logger.logRequest(req.method, req.originalUrl, res.statusCode, responseTime, {
      contentLength: res.get('Content-Length'),
      responseTime
    });
    
    originalEnd.call(this, chunk, encoding || 'utf8');
  };
  
  next();
};

/**
 * Security middleware configuration
 */
export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    }
  }),
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }),
  compression({
    level: 6,
    threshold: 1024,
    filter: (req: Request, res: Response) => {
      if (req.headers['x-no-compression']) {
        return false;
      }
      return compression.filter(req, res);
    }
  })
];

/**
 * Database connection middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const databaseMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check database connection
    await database.query('SELECT 1');
    next();
  } catch (err) {
    logger.logError('Database connection failed', err);
    res.status(503).json({
      success: false,
      error: 'Service Unavailable',
      message: 'Database connection failed'
    });
  }
};

/**
 * Request validation middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Validate request size
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 1024 * 1024) { // 1MB limit
    res.status(413).json({
      success: false,
      error: 'Payload Too Large',
      message: 'Request body too large'
    });
    return;
  }
  
  // Validate content type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      req.headers['content-type'] !== 'application/json') {
    res.status(415).json({
      success: false,
      error: 'Unsupported Media Type',
      message: 'Content-Type must be application/json'
    });
    return;
  }
  
  next();
};

/**
 * Request sanitization middleware
 * @param req - Express request object
 * @param res - Express response object
 * @param next - Express next function
 */
export const sanitizeRequest = (req: Request, res: Response, next: NextFunction): void => {
  // Sanitize body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    });
  }
  
  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    });
  }
  
  // Sanitize params
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = req.params[key].trim();
      }
    });
  }
  
  next();
};