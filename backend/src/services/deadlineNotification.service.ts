import { PrismaClient } from '@prisma/client';
import { createNotification } from './notification.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Check for tasks with approaching deadlines and create notifications
 * This should be called periodically (e.g., every hour)
 */
export async function checkApproachingDeadlines(): Promise<void> {
  try {
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    // Find tasks with deadlines in the next 24 hours or 3 days
    const tasks = await prisma.task.findMany({
      where: {
        dueDate: {
          gte: now,
          lte: threeDaysFromNow,
        },
        status: {
          not: 'COMPLETED',
        },
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    for (const task of tasks) {
      if (!task.dueDate || !task.assigneeId) continue;

      const hoursUntilDeadline = (task.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const daysUntilDeadline = hoursUntilDeadline / 24;

      // Check if notification already exists for this task and deadline period
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: task.assigneeId,
          type: 'DEADLINE_APPROACHING',
          projectId: task.projectId,
          createdAt: {
            gte: new Date(now.getTime() - 12 * 60 * 60 * 1000), // Last 12 hours
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Only create notification if:
      // - Within 24 hours and no notification in last 12 hours
      // - Within 3 days and no notification in last 12 hours (for 3-day warning)
      if (hoursUntilDeadline <= 24 && hoursUntilDeadline > 0) {
        if (!existingNotification) {
          await createNotification({
            userId: task.assigneeId,
            projectId: task.projectId,
            type: 'DEADLINE_APPROACHING',
            title: 'Deadline sắp đến',
            message: `Task "${task.title}" có deadline trong ${Math.round(hoursUntilDeadline)} giờ`,
          });
        }
      } else if (daysUntilDeadline <= 3 && daysUntilDeadline > 1) {
        // Only notify once for 3-day warning if no recent notification
        if (!existingNotification) {
          await createNotification({
            userId: task.assigneeId,
            projectId: task.projectId,
            type: 'DEADLINE_APPROACHING',
            title: 'Deadline sắp đến',
            message: `Task "${task.title}" có deadline trong ${Math.round(daysUntilDeadline)} ngày`,
          });
        }
      }
    }

    logger.info(`Checked approaching deadlines: ${tasks.length} tasks found`);
  } catch (error) {
    logger.error('Error checking approaching deadlines:', error);
  }
}

