/**
 * Custom error classes for structured error handling
 */

export enum ErrorCode {
  // Authentication errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  EMAIL_NOT_VERIFIED = 'EMAIL_NOT_VERIFIED',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  CONFLICT = 'CONFLICT',
  
  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: any;
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    code: ErrorCode,
    message: string,
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;
    
    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error factory functions for common errors
 */
export const createError = {
  badRequest: (message: string, details?: any) =>
    new AppError(400, ErrorCode.INVALID_INPUT, message, details),
  
  unauthorized: (message: string = 'Không được phép truy cập') =>
    new AppError(401, ErrorCode.UNAUTHORIZED, message),
  
  forbidden: (message: string = 'Truy cập bị từ chối') =>
    new AppError(403, ErrorCode.FORBIDDEN, message),
  
  notFound: (message: string = 'Không tìm thấy dữ liệu') =>
    new AppError(404, ErrorCode.NOT_FOUND, message),
  
  conflict: (message: string, details?: any) =>
    new AppError(409, ErrorCode.CONFLICT, message, details),
  
  internal: (message: string = 'Lỗi máy chủ. Vui lòng thử lại sau.', details?: any) =>
    new AppError(500, ErrorCode.INTERNAL_ERROR, message, details, false),
  
  database: (message: string = 'Lỗi cơ sở dữ liệu', details?: any) =>
    new AppError(500, ErrorCode.DATABASE_ERROR, message, details, false),
};

