import winston from 'winston';
import { LogLevel, LogEntry } from '../types';

/**
 * Custom log levels with numeric values
 */
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

/**
 * Color scheme for different log levels
 */
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

winston.addColors(colors);

/**
 * Custom format for log messages
 */
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info['timestamp']} ${info.level}: ${info.message}`
  )
);

/**
 * Winston logger configuration
 */
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format,
  transports: [
    // Console transport for development
    new winston.transports.Console(),
    
    // File transport for errors
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    }),
    
    // File transport for all logs
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      )
    })
  ]
});

/**
 * Enhanced logger with additional methods for specific use cases
 */
class EnhancedLogger {
  /**
   * Log a request with performance metrics
   * @param method - HTTP method
   * @param url - Request URL
   * @param statusCode - HTTP status code
   * @param responseTime - Response time in milliseconds
   * @param meta - Additional metadata
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    meta?: Record<string, any>
  ): void {
    const message = `${method} ${url} ${statusCode} ${responseTime}ms`;
    logger.info(message, meta);
  }

  /**
   * Log performance metrics
   * @param metric - Metric name
   * @param value - Metric value
   * @param unit - Unit of measurement
   * @param meta - Additional metadata
   */
  logPerformance(
    metric: string,
    value: number,
    unit: string,
    meta?: Record<string, any>
  ): void {
    logger.info(`PERFORMANCE: ${metric} = ${value}${unit}`, meta);
  }

  /**
   * Log security events
   * @param event - Security event description
   * @param meta - Additional metadata
   */
  logSecurity(
    event: string,
    meta?: Record<string, any>
  ): void {
    logger.warn(`SECURITY: ${event}`, meta);
  }

  /**
   * Log error with additional context
   * @param message - Error message
   * @param error - Error object or string
   * @param meta - Additional metadata
   */
  logError(
    message: string,
    error: Error | unknown,
    meta?: Record<string, any>
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(message, {
      error: errorMessage,
      stack: errorStack,
      ...meta
    });
  }

  /**
   * Log warning with context
   * @param message - Warning message
   * @param meta - Additional metadata
   */
  logWarning(
    message: string,
    meta?: Record<string, any>
  ): void {
    logger.warn(message, meta);
  }

  /**
   * Log info with context
   * @param message - Info message
   * @param meta - Additional metadata
   */
  logInfo(
    message: string,
    meta?: Record<string, any>
  ): void {
    logger.info(message, meta);
  }

  /**
   * Log debug with context
   * @param message - Debug message
   * @param meta - Additional metadata
   */
  logDebug(
    message: string,
    meta?: Record<string, any>
  ): void {
    logger.debug(message, meta);
  }

  /**
   * Log HTTP requests
   * @param message - HTTP message
   * @param meta - Additional metadata
   */
  logHttp(
    message: string,
    meta?: Record<string, any>
  ): void {
    logger.http(message, meta);
  }

  // Standard logger methods for compatibility
  error(message: string, meta?: Record<string, any>): void {
    logger.error(message, meta);
  }

  warn(message: string, meta?: Record<string, any>): void {
    logger.warn(message, meta);
  }

  info(message: string, meta?: Record<string, any>): void {
    logger.info(message, meta);
  }

  debug(message: string, meta?: Record<string, any>): void {
    logger.debug(message, meta);
  }

  http(message: string, meta?: Record<string, any>): void {
    logger.http(message, meta);
  }
}

export default new EnhancedLogger(); 