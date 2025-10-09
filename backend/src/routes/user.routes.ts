import { Router } from 'express';
import { 
  getUsers,
  getUserById,
  updateUser
} from '../controllers/user.controller';
import { verifyToken, requireUser } from '../middleware/auth.middleware';

const router = Router();

// All user routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/users
 * @desc    Get all users (for dropdowns and user management)
 * @access  Private (Admin, Lecturer)
 */
router.get('/', getUsers);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (User can see own profile, Admin/Lecturer can see all)
 */
router.get('/:id', getUserById);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user profile
 * @access  Private (User can update own profile, Admin can update any)
 * @body    { fullName?, email?, studentId? }
 */
router.put('/:id', requireUser, updateUser);

export default router;
