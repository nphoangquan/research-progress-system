import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { wsService } from '../index';

const prisma = new PrismaClient();

/**
 * Get user's notifications
 * @route GET /api/notifications
 */
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { page = '1', limit = '20', isRead, type } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = Math.min(parseInt(limit as string, 10), 100);
    const skip = (pageNum - 1) * limitNum;

    const where: any = {
      userId,
    };

    if (isRead !== undefined) {
      where.isRead = isRead === 'true';
    }

    if (type) {
      where.type = type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        include: {
          project: {
            select: {
              id: true,
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
      prisma.notification.count({ where }),
    ]);

    res.json({
      notifications,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Không thể tải thông báo' });
  }
};

/**
 * Get unread notifications count
 * @route GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({ count });
  } catch (error) {
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Không thể tải số lượng thông báo chưa đọc' });
  }
};

/**
 * Mark notification as read
 * @route PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Không có quyền truy cập thông báo này' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    // Emit updated count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    wsService.emitNotificationCount(userId, unreadCount);

    res.json({ notification: updated });
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Không thể cập nhật thông báo' });
  }
};

/**
 * Mark all notifications as read
 * @route PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    // Emit updated count
    wsService.emitNotificationCount(userId, 0);

    res.json({ updated: result.count });
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Không thể cập nhật thông báo' });
  }
};

/**
 * Delete notification
 * @route DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Không tìm thấy thông báo' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Không có quyền xóa thông báo này' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    // Emit updated count
    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    wsService.emitNotificationCount(userId, unreadCount);

    res.json({ message: 'Đã xóa thông báo' });
  } catch (error) {
    logger.error('Error deleting notification:', error);
    res.status(500).json({ error: 'Không thể xóa thông báo' });
  }
};

/**
 * Delete all read notifications
 * @route DELETE /api/notifications/read
 */
export const deleteAllRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const result = await prisma.notification.deleteMany({
      where: {
        userId,
        isRead: true,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
    wsService.emitNotificationCount(userId, unreadCount);

    res.json({ deleted: result.count });
  } catch (error) {
    logger.error('Error deleting read notifications:', error);
    res.status(500).json({ error: 'Không thể xóa thông báo' });
  }
};

