import { Request, Response, NextFunction } from 'express';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Custom error class with status code and error code
 */
export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(statusCode: number, code: string, message: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Map common error types to HTTP status codes and error codes
 */
function mapErrorToResponse(error: any): { statusCode: number; code: string; message: string; details?: any } {
  // Handle custom AppError
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      code: error.code,
      message: error.message,
      details: error.details,
    };
  }

  // Handle MongoDB/Mongoose errors
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Invalid data provided',
      details: error.message,
    };
  }

  if (error.name === 'CastError') {
    return {
      statusCode: 400,
      code: 'INVALID_ID',
      message: 'Invalid ID format',
      details: error.message,
    };
  }

  if (error.code === 11000) {
    return {
      statusCode: 409,
      code: 'DUPLICATE_ENTRY',
      message: 'Resource already exists',
      details: error.message,
    };
  }

  // Handle Firebase errors
  if (error.code && error.code.startsWith('auth/')) {
    return {
      statusCode: 401,
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      details: error.message,
    };
  }

  // Handle AWS SDK / Storage errors
  if (error.name === 'NoSuchKey' || error.Code === 'NoSuchKey') {
    return {
      statusCode: 404,
      code: 'STORAGE_FILE_NOT_FOUND',
      message: 'File not found in storage',
      details: error.message,
    };
  }

  if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
    return {
      statusCode: 403,
      code: 'STORAGE_ACCESS_DENIED',
      message: 'Access denied to storage resource',
      details: error.message,
    };
  }

  if (error.$metadata || error.name?.includes('S3')) {
    return {
      statusCode: 500,
      code: 'STORAGE_ERROR',
      message: 'Storage operation failed',
      details: error.message,
    };
  }

  // Handle multer file upload errors
  if (error.name === 'MulterError') {
    return {
      statusCode: 400,
      code: 'FILE_UPLOAD_ERROR',
      message: error.message,
      details: error.field,
    };
  }

  // Default to internal server error
  return {
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected error occurred',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  };
}

/**
 * Log error with context information
 */
function logError(error: any, req: Request): void {
  const timestamp = new Date().toISOString();
  const userId = (req as any).userId || 'unauthenticated';
  const method = req.method;
  const path = req.path;
  const ip = req.ip || req.socket.remoteAddress;

  console.error('=== Error Log ===');
  console.error(`Timestamp: ${timestamp}`);
  console.error(`User ID: ${userId}`);
  console.error(`Request: ${method} ${path}`);
  console.error(`IP: ${ip}`);
  console.error(`Error Name: ${error.name || 'Unknown'}`);
  console.error(`Error Message: ${error.message || 'No message'}`);
  
  if (error.stack && process.env.NODE_ENV === 'development') {
    console.error(`Stack Trace:\n${error.stack}`);
  }
  
  console.error('================\n');
}

/**
 * Global error handling middleware
 * Must be registered after all routes
 */
export function errorHandler(
  error: any,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error with context
  logError(error, req);

  // Map error to response format
  const { statusCode, code, message, details } = mapErrorToResponse(error);

  // Format error response
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  // Send error response
  res.status(statusCode).json(errorResponse);
}

/**
 * Handle 404 Not Found errors
 * Should be registered after all routes but before error handler
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  const error = new AppError(
    404,
    'ROUTE_NOT_FOUND',
    `Cannot ${req.method} ${req.path}`
  );
  next(error);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, _res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
