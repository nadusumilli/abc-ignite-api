import { config } from 'dotenv';
import path from 'path';

// Load environment variables
config({ path: path.resolve(__dirname, '.env.local') });
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import { randomUUID } from 'crypto';
import routes from './src/routes';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';
import logger from './src/utils/logger';
import database from './src/config/database';
import { AuthenticatedRequest } from './src/types';

const app: Application = express();
const PORT: number = parseInt(process.env.PORT || '3000', 10);

/**
 * Security middleware with enhanced configuration
 * Provides comprehensive security headers and protection
 */
// Configure Helmet with relaxed cross-origin policies to support CORS for frontend on a different port
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable to allow cross-origin requests from frontend
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

/**
 * CORS configuration with enhanced security
 * Allows cross-origin requests with proper validation
 */
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',') 
  : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:8080'];

app.use(cors({
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: process.env.CORS_CREDENTIALS === 'true',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Request-ID', 'X-Total-Count'],
  maxAge: 86400 // 24 hours
}));

/**
 * Rate limiting with enhanced configuration
 * Prevents abuse and ensures fair resource usage
 */
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_ERROR',
      message: 'Too many requests from this IP, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  skipFailedRequests: false,
  keyGenerator: (req: Request) => {
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  handler: (req: Request, res: Response) => {
    logger.logSecurity('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_ERROR',
        message: 'Too many requests from this IP, please try again later.'
      }
    });
  }
});

// Apply rate limiting to all routes
if (process.env.NODE_ENV !== 'test') {
  app.use(limiter);
}

/**
 * Compression middleware for better performance
 * Reduces response size for faster data transfer
 */
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

/**
 * Request logging middleware
 * Logs all HTTP requests with performance metrics
 */
app.use(morgan('combined', { 
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  } 
}));

/**
 * Body parsing middleware with size limits
 * Parses JSON and URL-encoded bodies with security limits
 */
app.use(express.json({ 
  limit: process.env.BODY_LIMIT || '10mb',
  verify: (req: AuthenticatedRequest, res: Response, buf: Buffer) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ 
  extended: true, 
  limit: process.env.BODY_LIMIT || '10mb' 
}));

/**
 * Request ID middleware
 * Adds unique request ID for tracking and debugging
 */
app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.requestId = req.headers['x-request-id'] as string || randomUUID();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

/**
 * Request timing middleware
 * Measures request processing time for performance monitoring
 */
app.use((req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  req.startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - req.startTime!;
    logger.logPerformance('request_duration', duration, 'ms', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      requestId: req.requestId
    });
  });
  next();
});

/**
 * API routes
 * Mounts all application routes under /api prefix
 */
app.use('/api', routes);

/**
 * Health check endpoint
 * Provides system health status for monitoring
 */
app.get('/health', async (req: Request, res: Response) => {
  const startTime = Date.now();
  
  try {
    const dbHealth = await database.healthCheck();
    const duration = Date.now() - startTime;
    
    res.status(200).json({
      success: true,
      message: 'Service is healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      duration: `${duration}ms`,
      database: dbHealth.status,
      version: process.env['npm_package_version'] || '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Health check failed', { error: (error as Error).message, duration });
    
    res.status(503).json({
      success: false,
      message: 'Service is unhealthy',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      database: 'unhealthy',
      error: (error as Error).message
    });
  }
});

/**
 * 404 handler for undefined routes
 */
app.use(notFoundHandler);

/**
 * Global error handler
 * Must be the last middleware
 */
app.use(errorHandler);

/**
 * Graceful server startup
 * Initializes database connection and starts the server
 */
const startServer = async (): Promise<void> => {
  try {
    // Initialize database connection
    await database.initialize();
    logger.info('Database connection established');

    // Start the server
    const server = app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
      logger.info(`Health check available at http://localhost:${PORT}/health`);
      logger.info(`API documentation available at http://localhost:${PORT}/api`);
    });

    // Graceful shutdown handling
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await database.close();
          logger.info('Database connections closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown', { error: (error as Error).message });
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection', { promise: promise.toString(), reason: reason?.toString() });
      process.exit(1);
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error: (error as Error).message });
    process.exit(1);
  }
};

// Start the server
startServer();

export default app; 