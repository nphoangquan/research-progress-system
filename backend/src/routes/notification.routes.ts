import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllRead,
} from '../controllers/notification.controller';
import { verifyToken } from '../middleware/auth.middleware';

const router = Router();

// All notification routes require authentication
router.use(verifyToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user's notifications
 * @access  Private
 * @query   page, limit, isRead, type
 */
router.get('/', getNotifications);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get unread notifications count
 * @access  Private
 */
router.get('/unread-count', getUnreadCount);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.patch('/:id/read', markAsRead);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all notifications as read
 * @access  Private
 */
router.patch('/read-all', markAllAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', deleteNotification);

/**
 * @route   DELETE /api/notifications/read
 * @desc    Delete all read notifications
 * @access  Private
 */
router.delete('/read', deleteAllRead);

export default router;

