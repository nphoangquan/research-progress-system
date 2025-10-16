import { Router } from 'express';
import { 
  getUsers,
  getProjectMembers,
  getUserById,
  updateUser,
  changePassword,
  uploadAvatar
} from '../controllers/user.controller';
import { verifyToken, requireUser } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

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
 * @route   GET /api/users/project/:projectId
 * @desc    Get project members (for students to see users in their projects)
 * @access  Private (Project members)
 */
router.get('/project/:projectId', getProjectMembers);

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

/**
 * @route   PUT /api/users/:id/password
 * @desc    Change user password
 * @access  Private (User can change own password, Admin can change any)
 * @body    { currentPassword, newPassword }
 */
router.put('/:id/password', requireUser, changePassword);

/**
 * @route   POST /api/users/:id/avatar
 * @desc    Upload user avatar
 * @access  Private (User can upload own avatar, Admin can upload any)
 * @body    FormData with image file
 */
router.post('/:id/avatar', requireUser, upload.single('avatar'), uploadAvatar);

export default router;
