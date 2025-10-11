import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

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
        project: {
          ...baseWhereClause,
          createdAt: { gte: startDate }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Documents Analytics
    const documents = await prisma.document.findMany({
      where: {
        project: {
          ...baseWhereClause,
          createdAt: { gte: startDate }
        }
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        }
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
 * Get user activity data
 */
export const getUserActivity = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Mock data for now - in a real implementation, you'd track activities in a separate table
    const recentActivities = [
      {
        id: '1',
        type: 'task_created',
        description: 'created a new task',
        userId: currentUserId,
        userName: 'Current User',
        projectId: 'project-1',
        projectName: 'Research Project Alpha',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        metadata: { taskTitle: 'Data Analysis Task' }
      },
      {
        id: '2',
        type: 'document_uploaded',
        description: 'uploaded a document',
        userId: currentUserId,
        userName: 'Current User',
        projectId: 'project-1',
        projectName: 'Research Project Alpha',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        metadata: { fileName: 'research_paper.pdf' }
      },
      {
        id: '3',
        type: 'comment_added',
        description: 'added a comment',
        userId: currentUserId,
        userName: 'Current User',
        projectId: 'project-1',
        projectName: 'Research Project Alpha',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        metadata: { commentContent: 'Great progress!' }
      }
    ];

    // Get user stats
    const userStats = {
      totalTasks: 15,
      completedTasks: 8,
      uploadedDocuments: 12,
      commentsAdded: 25,
      projectsInvolved: 3
    };

    // Mock activity by day data
    const activityByDay = [
      { date: '2024-01-01', count: 5 },
      { date: '2024-01-02', count: 8 },
      { date: '2024-01-03', count: 3 },
      { date: '2024-01-04', count: 12 },
      { date: '2024-01-05', count: 7 }
    ];

    // Mock top active users
    const topActiveUsers = [
      { userId: 'user-1', userName: 'Dr. Smith', activityCount: 45 },
      { userId: 'user-2', userName: 'John Doe', activityCount: 38 },
      { userId: 'user-3', userName: 'Jane Wilson', activityCount: 32 },
      { userId: 'user-4', userName: 'Mike Johnson', activityCount: 28 },
      { userId: 'user-5', userName: 'Sarah Brown', activityCount: 25 }
    ];

    const userActivityData = {
      recentActivities,
      userStats,
      activityByDay,
      topActiveUsers
    };

    res.json({
      message: 'User activity data retrieved successfully',
      ...userActivityData
    });

  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user activity data' 
    });
  }
};
