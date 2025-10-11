import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import ActivityService from '../services/activity.service';

const prisma = new PrismaClient();

/**
 * Get analytics data
 */
export const getAnalytics = async (req: Request, res: Response) => {
  try {
    const { timeRange = 'month' } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Build base where clause based on user role
    let baseWhereClause: any = {};
    if (currentUserRole === 'STUDENT') {
      baseWhereClause.students = {
        some: {
          studentId: currentUserId
        }
      };
    } else if (currentUserRole === 'LECTURER') {
      baseWhereClause.lecturerId = currentUserId;
    }
    // ADMIN can see all data

    // Projects Analytics
    const projects = await prisma.project.findMany({
      where: {
        ...baseWhereClause,
        createdAt: { gte: startDate }
      },
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true
              }
            }
          }
        }
      }
    });

    // Tasks Analytics
    const tasks = await prisma.task.findMany({
      where: {
        project: baseWhereClause,
        createdAt: { gte: startDate }
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true
          }
        }
      }
    });

    // Documents Analytics
    const documents = await prisma.document.findMany({
      where: {
        project: baseWhereClause,
        createdAt: { gte: startDate }
      }
    });

    // Users Analytics
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    });

    // Process Projects Data
    const projectsByStatus = projects.reduce((acc: any, project) => {
      const status = project.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const projectsByProgress = projects.reduce((acc: any, project) => {
      let range = '0-25';
      if (project.progress > 75) range = '75-100';
      else if (project.progress > 50) range = '50-75';
      else if (project.progress > 25) range = '25-50';
      
      acc[range] = (acc[range] || 0) + 1;
      return acc;
    }, {});

    const projectsByLecturer = projects.reduce((acc: any, project) => {
      const lecturer = project.lecturer.fullName;
      acc[lecturer] = (acc[lecturer] || 0) + 1;
      return acc;
    }, {});

    // Process Tasks Data
    const tasksByStatus = tasks.reduce((acc: any, task) => {
      const status = task.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const tasksByPriority = tasks.reduce((acc: any, task) => {
      const priority = task.priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now && task.status !== 'COMPLETED';
    }).length;

    const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;

    // Process Documents Data
    const documentsByStatus = documents.reduce((acc: any, doc) => {
      const status = doc.status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const documentsByType = documents.reduce((acc: any, doc) => {
      let type = 'other';
      if (doc.mimeType.includes('pdf')) type = 'pdf';
      else if (doc.mimeType.includes('word') || doc.mimeType.includes('document')) type = 'doc';
      else if (doc.mimeType.includes('excel') || doc.mimeType.includes('spreadsheet')) type = 'xls';
      else if (doc.mimeType.includes('powerpoint') || doc.mimeType.includes('presentation')) type = 'ppt';
      else if (doc.mimeType.includes('image')) type = 'image';
      else if (doc.mimeType.includes('zip') || doc.mimeType.includes('rar') || doc.mimeType.includes('7z')) type = 'archive';
      
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const totalDocumentSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0);

    // Process Users Data
    const usersByRole = users.reduce((acc: any, user) => {
      const role = user.role;
      acc[role] = (acc[role] || 0) + 1;
      return acc;
    }, {});

    const activeUsers = users.filter(user => user.isActive).length;

    // Recent Activity
    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(project => ({
        id: project.id,
        title: project.title,
        status: project.status,
        createdAt: project.createdAt
      }));

    const recentTasks = tasks
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(task => ({
        id: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt
      }));

    const recentDocuments = documents
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5)
      .map(doc => ({
        id: doc.id,
        fileName: doc.fileName,
        status: doc.status,
        createdAt: doc.createdAt
      }));

    // Enhanced Analytics - Additional Metrics
    const completionRate = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;
    const averageProjectProgress = projects.length > 0 ? 
      projects.reduce((sum, project) => sum + project.progress, 0) / projects.length : 0;
    
    // Productivity metrics
    const tasksCompletedThisPeriod = tasks.filter(task => 
      task.status === 'COMPLETED' && 
      task.updatedAt >= startDate
    ).length;
    
    const documentsUploadedThisPeriod = documents.filter(doc => 
      doc.createdAt >= startDate
    ).length;
    
    // Time-based trends (mock data for now - in real implementation, you'd calculate from actual data)
    const trends = {
      projectsCreated: [
        { date: '2024-01-01', count: 2 },
        { date: '2024-01-02', count: 1 },
        { date: '2024-01-03', count: 3 },
        { date: '2024-01-04', count: 1 },
        { date: '2024-01-05', count: 2 }
      ],
      tasksCompleted: [
        { date: '2024-01-01', count: 5 },
        { date: '2024-01-02', count: 3 },
        { date: '2024-01-03', count: 7 },
        { date: '2024-01-04', count: 4 },
        { date: '2024-01-05', count: 6 }
      ],
      documentsUploaded: [
        { date: '2024-01-01', count: 3 },
        { date: '2024-01-02', count: 2 },
        { date: '2024-01-03', count: 5 },
        { date: '2024-01-04', count: 1 },
        { date: '2024-01-05', count: 4 }
      ]
    };

    // Performance indicators
    const performanceIndicators = {
      completionRate: Math.round(completionRate * 100) / 100,
      averageProjectProgress: Math.round(averageProjectProgress * 100) / 100,
      tasksCompletedThisPeriod,
      documentsUploadedThisPeriod,
      overdueTaskRate: tasks.length > 0 ? Math.round((overdueTasks / tasks.length) * 100 * 100) / 100 : 0,
      activeProjectRate: projects.length > 0 ? 
        Math.round((projects.filter(p => p.status === 'IN_PROGRESS').length / projects.length) * 100 * 100) / 100 : 0
    };

    // Format response
    const analyticsData = {
      projects: {
        total: projects.length,
        byStatus: Object.entries(projectsByStatus).map(([status, count]) => ({
          status,
          count: count as number
        })),
        byProgress: Object.entries(projectsByProgress).map(([range, count]) => ({
          range,
          count: count as number
        })),
        byLecturer: Object.entries(projectsByLecturer).map(([lecturer, count]) => ({
          lecturer,
          count: count as number
        }))
      },
      tasks: {
        total: tasks.length,
        byStatus: Object.entries(tasksByStatus).map(([status, count]) => ({
          status,
          count: count as number
        })),
        byPriority: Object.entries(tasksByPriority).map(([priority, count]) => ({
          priority,
          count: count as number
        })),
        overdue: overdueTasks,
        completed: completedTasks
      },
      documents: {
        total: documents.length,
        byStatus: Object.entries(documentsByStatus).map(([status, count]) => ({
          status,
          count: count as number
        })),
        byType: Object.entries(documentsByType).map(([type, count]) => ({
          type,
          count: count as number
        })),
        totalSize: totalDocumentSize
      },
      users: {
        total: users.length,
        byRole: Object.entries(usersByRole).map(([role, count]) => ({
          role,
          count: count as number
        })),
        active: activeUsers
      },
      activity: {
        recentProjects,
        recentTasks,
        recentDocuments
      },
      // Enhanced Analytics
      performance: performanceIndicators,
      trends: trends,
      timeRange: {
        start: startDate.toISOString(),
        end: now.toISOString(),
        period: timeRange
      }
    };

    res.json({
      message: 'Analytics data retrieved successfully',
      ...analyticsData
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve analytics data' 
    });
  }
};

/**
 * Get detailed analytics with custom date range
 */
export const getDetailedAnalytics = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, projectId, userId } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Parse date range
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Build filters
    let filters: any = {
      createdAt: { gte: start, lte: end }
    };

    if (projectId) {
      filters.id = projectId;
    }

    // Role-based access
    if (currentUserRole === 'STUDENT') {
      filters.students = {
        some: { studentId: currentUserId }
      };
    } else if (currentUserRole === 'LECTURER') {
      filters.lecturerId = currentUserId;
    }

    // Get detailed project data
    const projects = await prisma.project.findMany({
      where: filters,
      include: {
        lecturer: { select: { id: true, fullName: true } },
        students: {
          include: {
            student: { select: { id: true, fullName: true } }
          }
        },
        tasks: {
          include: {
            assignee: { select: { id: true, fullName: true } }
          }
        },
        documents: true
      }
    });

    // Calculate detailed metrics
    const projectMetrics = projects.map(project => ({
      id: project.id,
      title: project.title,
      status: project.status,
      progress: project.progress,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lecturer: project.lecturer,
      studentCount: project.students.length,
      taskCount: project.tasks.length,
      completedTasks: project.tasks.filter(t => t.status === 'COMPLETED').length,
      overdueTasks: project.tasks.filter(t => 
        t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED'
      ).length,
      documentCount: project.documents.length,
      totalDocumentSize: project.documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      completionRate: project.tasks.length > 0 ? 
        Math.round((project.tasks.filter(t => t.status === 'COMPLETED').length / project.tasks.length) * 100 * 100) / 100 : 0
    }));

    // User productivity metrics
    const userProductivity = await prisma.user.findMany({
      where: {
        ...(userId ? { id: userId as string } : {}),
        ...(currentUserRole === 'STUDENT' ? { id: currentUserId } : {})
      },
      include: {
        tasks: {
          where: {
            updatedAt: { gte: start, lte: end }
          }
        },
        documents: {
          where: {
            createdAt: { gte: start, lte: end }
          }
        }
      }
    });

    const productivityMetrics = userProductivity.map(user => ({
      id: user.id,
      fullName: user.fullName,
      role: user.role,
      tasksCompleted: user.tasks.filter((t: any) => t.status === 'COMPLETED').length,
      tasksAssigned: user.tasks.length,
      documentsUploaded: user.documents.length,
      totalDocumentSize: user.documents.reduce((sum: number, doc: any) => sum + doc.fileSize, 0),
      productivityScore: user.tasks.length > 0 ? 
        Math.round((user.tasks.filter((t: any) => t.status === 'COMPLETED').length / user.tasks.length) * 100 * 100) / 100 : 0
    }));

    res.json({
      message: 'Detailed analytics retrieved successfully',
      data: {
        projectMetrics,
        productivityMetrics,
        timeRange: {
          start: start.toISOString(),
          end: end.toISOString()
        },
        summary: {
          totalProjects: projects.length,
          totalTasks: projects.reduce((sum, p) => sum + p.tasks.length, 0),
          totalDocuments: projects.reduce((sum, p) => sum + p.documents.length, 0),
          averageProgress: projects.length > 0 ? 
            Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length * 100) / 100 : 0
        }
      }
    });

  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve detailed analytics data' 
    });
  }
};

/**
 * Get user activity data
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const { timeRange = 'month' } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        break;
      case 'quarter':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
        break;
      case 'year':
        startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    }

    // Get recent activities
    const recentActivities = await ActivityService.getRecentActivities(20);

    // Get user stats
    const userStats = await ActivityService.getUserActivityStats(currentUserId, startDate, now);

    // Get top active users
    const topActiveUsers = await ActivityService.getTopActiveUsers(10, 30);

    // Get activity by day data
    const activityByDay = await ActivityService.getUserActivityStats(currentUserId, startDate, now);

    res.json({
      message: 'User activity data retrieved successfully',
      recentActivities: recentActivities.map((activity: any) => ({
        id: activity.id,
        type: activity.type.toLowerCase(),
        description: activity.description,
        userId: activity.userId,
        userName: activity.user.fullName,
        projectId: activity.projectId,
        projectName: activity.project?.title,
        createdAt: activity.createdAt.toISOString(),
        metadata: activity.metadata
      })),
      userStats: {
        totalTasks: userStats.activityCounts.TASK_CREATED || 0,
        completedTasks: userStats.activityCounts.TASK_COMPLETED || 0,
        uploadedDocuments: userStats.activityCounts.DOCUMENT_UPLOADED || 0,
        commentsAdded: userStats.activityCounts.COMMENT_ADDED || 0,
        projectsInvolved: userStats.projectsInvolved
      },
      activityByDay: activityByDay.activitiesByDay,
      topActiveUsers: topActiveUsers.map((user: any) => ({
        userId: user.userId,
        userName: user.userName,
        activityCount: user.activityCount
      }))
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user activity data' 
    });
  }
};
