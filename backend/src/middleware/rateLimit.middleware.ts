import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints
 * Prevents brute force attacks on login/register
 * Disabled in development, enabled in production
 */
export const authLimiter = process.env.NODE_ENV === 'production' 
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 20, // 20 requests per window per IP
      message: 'Quá nhiều lần thử đăng nhập từ IP này, vui lòng thử lại sau 15 phút.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: true,
      skipFailedRequests: false,
    })
  : (req: any, res: any, next: any) => next(); // No rate limit in development

/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset functionality
 * Disabled in development, enabled in production
 */
export const passwordResetLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per hour per IP
      message: 'Quá nhiều yêu cầu đặt lại mật khẩu từ IP này, vui lòng thử lại sau 1 giờ.',
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req: any, res: any, next: any) => next(); // No rate limit in development

/**
 * Rate limiter for email verification resend
 * Prevents spam of verification emails
 * Disabled in development, enabled in production
 */
export const emailVerificationLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per hour per IP
      message: 'Quá nhiều yêu cầu gửi lại email xác minh từ IP này, vui lòng thử lại sau 1 giờ.',
      standardHeaders: true,
      legacyHeaders: false,
    })
  : (req: any, res: any, next: any) => next(); // No rate limit in development

/**
 * General API rate limiter
 * Applied to all API endpoints
 * Disabled in development, enabled in production
 */
export const apiLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 5 * 60 * 1000, // 5 minutes
      max: 1000, // 1000 requests per window per IP
      message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau.',
      standardHeaders: true,
      legacyHeaders: false,
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
    })
  : (req: any, res: any, next: any) => next(); // No rate limit in development

