import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
 * Throws ZodError to be handled by global error handler for consistent format
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      // Throw ZodError to be handled by global error handler
      // This ensures consistent error format across the application
      if (error instanceof z.ZodError) {
        // Re-throw to let errorHandler.middleware.ts handle it
        return next(error);
      }

      // For non-Zod errors, pass to error handler
      return next(error);
    }
  };
};

/**
 * Validation schemas for authentication
 */
export const authSchemas = {
  register: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long'),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(),
    studentId: z.string().optional(),
  }),

  login: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name is too long').optional(),
    avatarUrl: z.string().url('Invalid avatar URL').optional().or(z.literal('')),
    studentId: z.string().optional().or(z.literal('')),
  }),

  forgotPassword: z.object({
    email: z.string().email('Invalid email address'),
  }),

  resetPassword: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};

