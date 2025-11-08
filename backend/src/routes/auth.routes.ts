import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword
} from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';
import { 
  authLimiter, 
  passwordResetLimiter, 
  emailVerificationLimiter 
} from '../middleware/rateLimit.middleware';
import { validate, authSchemas } from '../middleware/validation.middleware';

const router = Router();

// Apply rate limiting and validation to authentication endpoints
router.post('/register', authLimiter, validate(authSchemas.register), register);
router.post('/login', authLimiter, validate(authSchemas.login), login);
router.get('/verify-email/:token', verifyEmail); // No rate limit needed (one-time use token)
router.post('/resend-verification', emailVerificationLimiter, verifyToken, resendVerificationEmail);
router.post('/forgot-password', passwordResetLimiter, validate(authSchemas.forgotPassword), forgotPassword);
router.post('/reset-password/:token', passwordResetLimiter, validate(authSchemas.resetPassword), resetPassword);
router.get('/profile', verifyToken, getProfile);
router.put('/profile', verifyToken, validate(authSchemas.updateProfile), updateProfile);

export default router;
