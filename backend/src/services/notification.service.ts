import { PrismaClient, NotificationType } from '@prisma/client';
import logger from '../utils/logger';
import { wsService } from '../index';

const prisma = new PrismaClient();

interface CreateNotificationParams {
  userId: string;
  projectId?: string;
  type: NotificationType;
  title: string;
  message: string;
}

/**
 * Create a notification for a user
 */
export async function createNotification(params: CreateNotificationParams): Promise<void> {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: params.userId,
        projectId: params.projectId || null,
        type: params.type,
        title: params.title,
        message: params.message,
        isRead: false,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    // Emit WebSocket event
    wsService.emitNotification(params.userId, notification);

    // Emit updated count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: params.userId,
        isRead: false,
      },
    });
    wsService.emitNotificationCount(params.userId, unreadCount);
  } catch (error) {
    logger.error('Error creating notification:', error);
    // Don't throw - notifications are not critical
  }
}

/**
 * Create notifications for multiple users
 */
export async function createNotificationsForUsers(
  userIds: string[],
  params: Omit<CreateNotificationParams, 'userId'>
): Promise<void> {
  try {
    if (userIds.length === 0) return;

    // Create notifications one by one to emit WebSocket events
    for (const userId of userIds) {
      await createNotification({
        userId,
        ...params,
      });
    }
  } catch (error) {
    logger.error('Error creating notifications for users:', error);
    // Don't throw - notifications are not critical
  }
}

