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
import {
  getGeneralSettings,
  updateGeneralSettings,
  getEmailSettings,
  updateEmailSettings,
  testEmail,
  getStorageSettings,
  updateStorageSettings,
  getSecuritySettings,
  updateSecuritySettings,
  getMaintenanceSettings,
  updateMaintenanceSettings,
  getSystemHealth,
} from '../controllers/systemSettings.controller';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';
import { validate, adminSchemas, systemSettingsSchemas } from '../middleware/validation.middleware';

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

// ============================================================================
// SYSTEM SETTINGS
// ============================================================================

/**
 * @route   GET /api/admin/settings/general
 * @desc    Get general system settings
 * @access  Private (Admin only)
 */
router.get('/settings/general', getGeneralSettings);

/**
 * @route   PUT /api/admin/settings/general
 * @desc    Update general system settings
 * @access  Private (Admin only)
 * @body    { systemName?, systemDescription?, logoUrl?, faviconUrl?, timezone?, defaultLanguage?, dateFormat? }
 */
router.put('/settings/general', validate(systemSettingsSchemas.general), updateGeneralSettings);

/**
 * @route   GET /api/admin/settings/email
 * @desc    Get email settings
 * @access  Private (Admin only)
 */
router.get('/settings/email', getEmailSettings);

/**
 * @route   PUT /api/admin/settings/email
 * @desc    Update email settings
 * @access  Private (Admin only)
 * @body    { smtpHost?, smtpPort?, smtpSecure?, smtpUsername?, smtpPassword?, fromEmail?, fromName?, ... }
 */
router.put('/settings/email', validate(systemSettingsSchemas.email), updateEmailSettings);

/**
 * @route   POST /api/admin/settings/email/test
 * @desc    Test email sending
 * @access  Private (Admin only)
 * @body    { testEmail }
 */
router.post('/settings/email/test', validate(systemSettingsSchemas.testEmail), testEmail);

/**
 * @route   GET /api/admin/settings/storage
 * @desc    Get storage settings
 * @access  Private (Admin only)
 */
router.get('/settings/storage', getStorageSettings);

/**
 * @route   PUT /api/admin/settings/storage
 * @desc    Update storage settings
 * @access  Private (Admin only)
 * @body    { maxFileSize?, allowedFileTypes?, maxDocumentsPerProject?, autoIndexing?, maxAvatarSize?, allowedAvatarTypes? }
 */
router.put('/settings/storage', validate(systemSettingsSchemas.storage), updateStorageSettings);

/**
 * @route   GET /api/admin/settings/security
 * @desc    Get security settings
 * @access  Private (Admin only)
 */
router.get('/settings/security', getSecuritySettings);

/**
 * @route   PUT /api/admin/settings/security
 * @desc    Update security settings
 * @access  Private (Admin only)
 * @body    { passwordMinLength?, passwordRequireUppercase?, ... }
 */
router.put('/settings/security', validate(systemSettingsSchemas.security), updateSecuritySettings);

/**
 * @route   GET /api/admin/settings/maintenance
 * @desc    Get maintenance mode settings
 * @access  Private (Admin only)
 */
router.get('/settings/maintenance', getMaintenanceSettings);

/**
 * @route   PUT /api/admin/settings/maintenance
 * @desc    Update maintenance mode settings
 * @access  Private (Admin only)
 * @body    { enabled?, message?, allowedIPs?, scheduledStart?, scheduledEnd? }
 */
router.put('/settings/maintenance', validate(systemSettingsSchemas.maintenance), updateMaintenanceSettings);

/**
 * @route   GET /api/admin/settings/health
 * @desc    Get system health status
 * @access  Private (Admin only)
 */
router.get('/settings/health', getSystemHealth);

export default router;

