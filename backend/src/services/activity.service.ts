import { PrismaClient, ActivityType } from '@prisma/client';

const prisma = new PrismaClient();

export interface ActivityLogData {
  userId: string;
  type: ActivityType;
  description: string;
  projectId?: string;
  taskId?: string;
  documentId?: string;
  metadata?: any;
}

export class ActivityService {
  /**
   * Log a new activity
   */
  static async logActivity(data: ActivityLogData) {
    try {
      const activity = await prisma.activity.create({
        data: {
          userId: data.userId,
          type: data.type,
          description: data.description,
          projectId: data.projectId,
          taskId: data.taskId,
          documentId: data.documentId,
          metadata: data.metadata || {}
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true
            }
          },
          project: {
            select: {
              id: true,
              title: true
            }
          },
          task: {
            select: {
              id: true,
              title: true
            }
          },
          document: {
            select: {
              id: true,
              fileName: true
            }
          }
        }
      });

      return activity;
    } catch (error) {
      console.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Get user activities with pagination
   */
  static async getUserActivities(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: ActivityType;
      projectId?: string;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ) {
    const {
      limit = 50,
      offset = 0,
      type,
      projectId,
      startDate,
      endDate
    } = options;

    const where: any = {
      userId
    };

    if (type) where.type = type;
    if (projectId) where.projectId = projectId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        },
        document: {
          select: {
            id: true,
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    const total = await prisma.activity.count({ where });

    return {
      activities,
      total,
      hasMore: offset + limit < total
    };
  }

  /**
   * Get activity statistics for a user
   */
  static async getUserActivityStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const where: any = { userId };
    
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    // Get activity counts by type
    const activityCounts = await prisma.activity.groupBy({
      by: ['type'],
      where,
      _count: {
        type: true
      }
    });

    // Get total activities
    const totalActivities = await prisma.activity.count({ where });

    // Get unique projects involved
    const projectsInvolved = await prisma.activity.findMany({
      where: {
        ...where,
        projectId: { not: null }
      },
      select: {
        projectId: true
      },
      distinct: ['projectId']
    });

    // Get activity by day for chart
    const activitiesByDay = await prisma.activity.groupBy({
      by: ['createdAt'],
      where: {
        userId,
        ...(startDate || endDate ? {
          createdAt: {
            ...(startDate ? { gte: startDate } : {}),
            ...(endDate ? { lte: endDate } : {})
          }
        } : {})
      },
      _count: {
        id: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 30
    });

    // Format the data for chart
    const formattedActivitiesByDay = activitiesByDay.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      count: item._count.id
    }));

    return {
      totalActivities,
      activityCounts: activityCounts.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<ActivityType, number>),
      projectsInvolved: projectsInvolved.length,
      activitiesByDay: formattedActivitiesByDay
    };
  }

  /**
   * Get top active users
   */
  static async getTopActiveUsers(limit: number = 10, days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const topUsers = await prisma.activity.groupBy({
      by: ['userId'],
      where: {
        createdAt: {
          gte: startDate
        }
      },
      _count: {
        userId: true
      },
      orderBy: {
        _count: {
          userId: 'desc'
        }
      },
      take: limit
    });

    // Get user details
    const userIds = topUsers.map(user => user.userId);
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds }
      },
      select: {
        id: true,
        fullName: true,
        role: true
      }
    });

    return topUsers.map(user => {
      const userDetails = users.find(u => u.id === user.userId);
      return {
        userId: user.userId,
        userName: userDetails?.fullName || 'Unknown User',
        role: userDetails?.role || 'STUDENT',
        activityCount: user._count.userId
      };
    });
  }

  /**
   * Get recent activities across all users (for admin)
   */
  static async getRecentActivities(
    limit: number = 20,
    projectId?: string,
    userId?: string
  ) {
    const where: any = {};
    
    if (projectId) where.projectId = projectId;
    if (userId) where.userId = userId;

    const activities = await prisma.activity.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        },
        task: {
          select: {
            id: true,
            title: true
          }
        },
        document: {
          select: {
            id: true,
            fileName: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return activities;
  }
}

export default ActivityService;
