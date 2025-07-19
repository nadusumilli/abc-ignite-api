import { ValidationErrorDetails } from '../types';

/**
 * Base application error class
 * Provides consistent error handling across the application
 */
export class AppError extends Error {
  public statusCode: number;
  public errorCode: string;
  public details?: ValidationErrorDetails[];

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    details?: ValidationErrorDetails[]
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    if (details) {
      this.details = details;
    }
  }
}

/**
 * Validation error for input validation failures
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: ValidationErrorDetails[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

/**
 * Not found error for missing resources
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Conflict error for resource conflicts
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

/**
 * Service error for business logic failures
 */
export class ServiceError extends AppError {
  constructor(message: string) {
    super(message, 500, 'SERVICE_ERROR');
    this.name = 'ServiceError';
  }
}

/**
 * Database error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

/**
 * Authentication error for authentication failures
 */
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error for authorization failures
 */
export class AuthorizationError extends AppError {
  constructor(message: string) {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Rate limit error for rate limiting
 */
export class RateLimitError extends AppError {
  constructor(message: string) {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

/**
 * Business logic error for specific business rule violations
 * Uses 422 Unprocessable Entity for business rule violations
 */
export class BusinessError extends AppError {
  constructor(message: string, errorCode: string) {
    super(message, 422, errorCode);
    this.name = 'BusinessError';
  }
}

/**
 * Error factory for creating appropriate error types
 */
export class ErrorFactory {
  /**
   * Creates a validation error
   */
  static validation(message: string, details?: ValidationErrorDetails[]): ValidationError {
    return new ValidationError(message, details);
  }

  /**
   * Creates a not found error
   */
  static notFound(message: string): NotFoundError {
    return new NotFoundError(message);
  }

  /**
   * Creates a conflict error
   */
  static conflict(message: string): ConflictError {
    return new ConflictError(message);
  }

  /**
   * Creates a service error
   */
  static service(message: string): ServiceError {
    return new ServiceError(message);
  }

  /**
   * Creates a database error
   */
  static database(message: string): DatabaseError {
    return new DatabaseError(message);
  }

  /**
   * Creates an authentication error
   */
  static authentication(message: string): AuthenticationError {
    return new AuthenticationError(message);
  }

  /**
   * Creates an authorization error
   */
  static authorization(message: string): AuthorizationError {
    return new AuthorizationError(message);
  }

  /**
   * Creates a rate limit error
   */
  static rateLimit(message: string): RateLimitError {
    return new RateLimitError(message);
  }

  /**
   * Creates a business logic error
   */
  static business(message: string, errorCode: string): BusinessError {
    return new BusinessError(message, errorCode);
  }
}