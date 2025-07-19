"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const path_1 = __importDefault(require("path"));
// Load environment variables
(0, dotenv_1.config)({ path: path_1.default.resolve(__dirname, '.env.local') });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const morgan_1 = __importDefault(require("morgan"));
const crypto_1 = require("crypto");
const routes_1 = __importDefault(require("./src/routes"));
const errorHandler_1 = require("./src/middleware/errorHandler");
const logger_1 = __importDefault(require("./src/utils/logger"));
const database_1 = __importDefault(require("./src/config/database"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3000', 10);
/**
 * Security middleware with enhanced configuration
 * Provides comprehensive security headers and protection
 */
// Configure Helmet with relaxed cross-origin policies to support CORS for frontend on a different port
app.use((0, helmet_1.default)({
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
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        }
        else {
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
const limiter = (0, express_rate_limit_1.default)({
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
    keyGenerator: (req) => {
        return req.ip || req.connection.remoteAddress || 'unknown';
    },
    handler: (req, res) => {
        logger_1.default.logSecurity('Rate limit exceeded', {
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
app.use((0, compression_1.default)({
    level: 6,
    threshold: 1024,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression_1.default.filter(req, res);
    }
}));
/**
 * Request logging middleware
 * Logs all HTTP requests with performance metrics
 */
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.default.info(message.trim())
    }
}));
/**
 * Body parsing middleware with size limits
 * Parses JSON and URL-encoded bodies with security limits
 */
app.use(express_1.default.json({
    limit: process.env.BODY_LIMIT || '10mb',
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));
app.use(express_1.default.urlencoded({
    extended: true,
    limit: process.env.BODY_LIMIT || '10mb'
}));
/**
 * Request ID middleware
 * Adds unique request ID for tracking and debugging
 */
app.use((req, res, next) => {
    req.requestId = req.headers['x-request-id'] || (0, crypto_1.randomUUID)();
    res.setHeader('X-Request-ID', req.requestId);
    next();
});
/**
 * Request timing middleware
 * Measures request processing time for performance monitoring
 */
app.use((req, res, next) => {
    req.startTime = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - req.startTime;
        logger_1.default.logPerformance('request_duration', duration, 'ms', {
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
app.use('/api', routes_1.default);
/**
 * Health check endpoint
 * Provides system health status for monitoring
 */
app.get('/health', async (req, res) => {
    const startTime = Date.now();
    try {
        const dbHealth = await database_1.default.healthCheck();
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
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger_1.default.error('Health check failed', { error: error.message, duration });
        res.status(503).json({
            success: false,
            message: 'Service is unhealthy',
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            database: 'unhealthy',
            error: error.message
        });
    }
});
/**
 * 404 handler for undefined routes
 */
app.use(errorHandler_1.notFoundHandler);
/**
 * Global error handler
 * Must be the last middleware
 */
app.use(errorHandler_1.errorHandler);
/**
 * Graceful server startup
 * Initializes database connection and starts the server
 */
const startServer = async () => {
    try {
        // Initialize database connection
        await database_1.default.initialize();
        logger_1.default.info('Database connection established');
        // Start the server
        const server = app.listen(PORT, () => {
            logger_1.default.info(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
            logger_1.default.info(`Health check available at http://localhost:${PORT}/health`);
            logger_1.default.info(`API documentation available at http://localhost:${PORT}/api`);
        });
        // Graceful shutdown handling
        const gracefulShutdown = async (signal) => {
            logger_1.default.info(`Received ${signal}. Starting graceful shutdown...`);
            server.close(async () => {
                logger_1.default.info('HTTP server closed');
                try {
                    await database_1.default.close();
                    logger_1.default.info('Database connections closed');
                    process.exit(0);
                }
                catch (error) {
                    logger_1.default.error('Error during shutdown', { error: error.message });
                    process.exit(1);
                }
            });
            // Force shutdown after 30 seconds
            setTimeout(() => {
                logger_1.default.error('Forced shutdown after timeout');
                process.exit(1);
            }, 30000);
        };
        // Handle shutdown signals
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        // Handle unhandled promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            logger_1.default.error('Unhandled Rejection', { promise: promise.toString(), reason: reason?.toString() });
            process.exit(1);
        });
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            logger_1.default.error('Uncaught Exception:', error);
            process.exit(1);
        });
    }
    catch (error) {
        logger_1.default.error('Failed to start server', { error: error.message });
        process.exit(1);
    }
};
// Start the server
startServer();
exports.default = app;
//# sourceMappingURL=index.js.map