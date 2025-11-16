import { Router } from 'express';
import { getStorageSettings, getGeneralSettings, getMaintenanceStatus } from '../controllers/systemSettings.controller';

const router = Router();

/**
 * @route   GET /api/settings/storage
 * @desc    Get storage settings (public, for frontend validation)
 * @access  Public
 */
router.get('/storage', getStorageSettings);

/**
 * @route   GET /api/settings/general
 * @desc    Get general settings (public, for frontend display)
 * @access  Public
 */
router.get('/general', getGeneralSettings);

/**
 * @route   GET /api/settings/maintenance-status
 * @desc    Get maintenance mode status (public, for frontend to check before rendering)
 * @access  Public
 */
router.get('/maintenance-status', getMaintenanceStatus);

export default router;

