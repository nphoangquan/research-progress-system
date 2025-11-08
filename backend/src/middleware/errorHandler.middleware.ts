import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError, ErrorCode } from '../utils/errors';
import logger from '../utils/logger';

/**
 * Global error handler middleware
 * Handles all errors in a structured way
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // If it's our custom AppError, use its properties
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(process.env.NODE_ENV === 'development' && {
          details: err.details,
          stack: err.stack,
        }),
      },
    });
  }

  // Handle Zod validation errors (from validation middleware)
  if (err.name === 'ZodError' || err instanceof z.ZodError) {
    const zodError = err as z.ZodError;
    const errors = zodError.issues.map((issue: z.ZodIssue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return res.status(400).json({
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Dữ liệu không hợp lệ',
        details: errors,
      },
    });
  }

  // Handle Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    
    // Unique constraint violation
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: ErrorCode.ALREADY_EXISTS,
          message: 'A record with this value already exists',
          details: {
            field: prismaError.meta?.target,
          },
        },
      });
    }
    
    // Record not found
    if (prismaError.code === 'P2025') {
      return res.status(404).json({
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Record not found',
        },
      });
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: err.name === 'TokenExpiredError' ? ErrorCode.TOKEN_EXPIRED : ErrorCode.TOKEN_INVALID,
        message: err.name === 'TokenExpiredError' 
          ? 'Token expired. Please login again.' 
          : 'Invalid token.',
      },
    });
  }

  // Default to 500 server error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });
  
  res.status(500).json({
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'development' 
        ? err.message 
        : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    },
  });
};

