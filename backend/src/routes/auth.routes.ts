import { Router } from 'express';
import { 
  register, 
  login, 
  getProfile, 
  updateProfile 
} from '../controllers/auth.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 * @body    { email, password, fullName, role?, studentId? }
 */
router.post('/register', register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 * @body    { email, password }
 */
router.post('/login', login);

/**
 * @route   GET /api/auth/profile
 * @desc    Get current user profile
 * @access  Private (requires token)
 */
router.get('/profile', verifyToken, getProfile);

/**
 * @route   PUT /api/auth/profile
 * @desc    Update current user profile
 * @access  Private (requires token)
 * @body    { fullName, avatarUrl? }
 */
router.put('/profile', verifyToken, updateProfile);

export default router;
