import { Router } from 'express';
import {
  getUsers,
  createUser,
  getUserById,
  updateUser,
  deleteUser,
  activateUser,
  resetUserPassword,
  getUserStats,
} from '../controllers/admin.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';
import { validate, adminSchemas } from '../middleware/validation.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(verifyToken);
router.use(requireAdmin);

/**
 * @route   GET /api/admin/users
 * @desc    Get all users with pagination, search, and filters
 * @access  Private (Admin only)
 * @query   page, limit, search, role, isActive, emailVerified, sortBy, sortOrder
 */
router.get('/users', getUsers);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new user
 * @access  Private (Admin only)
 * @body    { fullName, email, password, role, studentId?, sendWelcomeEmail?, requireEmailVerification? }
 */
router.post('/users', validate(adminSchemas.createUser), createUser);

/**
 * @route   GET /api/admin/users/stats
 * @desc    Get user statistics
 * @access  Private (Admin only)
 * @query   timeRange (days, default: 30)
 */
router.get('/users/stats', getUserStats);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get('/users/:id', getUserById);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 * @body    { fullName?, email?, role?, studentId? }
 */
router.put('/users/:id', validate(adminSchemas.updateUser), updateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete user
 * @access  Private (Admin only)
 * @query   transferProjectsTo?, transferTasksTo?
 */
router.delete('/users/:id', deleteUser);

/**
 * @route   PATCH /api/admin/users/:id/activate
 * @desc    Activate/Deactivate user
 * @access  Private (Admin only)
 * @body    { isActive: boolean }
 */
router.patch('/users/:id/activate', validate(adminSchemas.activateUser), activateUser);

/**
 * @route   POST /api/admin/users/:id/reset-password
 * @desc    Reset user password
 * @access  Private (Admin only)
 * @body    { newPassword?, generatePassword?, sendEmail? }
 */
router.post('/users/:id/reset-password', validate(adminSchemas.resetPassword), resetUserPassword);

export default router;

