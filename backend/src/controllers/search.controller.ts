import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Global search across projects, tasks, and documents
 */
export const globalSearch = async (req: Request, res: Response) => {
  try {
    const { q, types, status, priority, dateRange } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    const searchQuery = q.trim();
    const searchTypes = types ? (types as string).split(',') : ['project', 'task', 'document'];
    const results: any[] = [];

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

    // Search Projects
    if (searchTypes.includes('project')) {
      let projectWhere: any = {
        ...baseWhereClause,
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      };

      // Apply additional filters
      if (status) {
        projectWhere.status = status;
      }

      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'this_week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        projectWhere.createdAt = { gte: startDate };
      }

      const projects = await prisma.project.findMany({
        where: projectWhere,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          lecturer: {
            select: {
              fullName: true
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      results.push(...projects.map(project => ({
        id: project.id,
        type: 'project',
        title: project.title,
        description: project.description,
        status: project.status,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        lecturer: project.lecturer.fullName
      })));
    }

    // Search Tasks
    if (searchTypes.includes('task')) {
      let taskWhere: any = {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      };

      // Apply role-based filtering for tasks
      if (currentUserRole === 'STUDENT') {
        taskWhere.project = {
          students: {
            some: {
              studentId: currentUserId
            }
          }
        };
      } else if (currentUserRole === 'LECTURER') {
        taskWhere.project = {
          lecturerId: currentUserId
        };
      }

      // Apply additional filters
      if (status) {
        taskWhere.status = status;
      }

      if (priority) {
        taskWhere.priority = priority;
      }

      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'this_week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        taskWhere.createdAt = { gte: startDate };
      }

      const tasks = await prisma.task.findMany({
        where: taskWhere,
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              title: true
            }
          },
          assignee: {
            select: {
              fullName: true
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      results.push(...tasks.map(task => ({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        projectTitle: task.project.title,
        assignee: task.assignee?.fullName
      })));
    }

    // Search Documents
    if (searchTypes.includes('document')) {
      let documentWhere: any = {
        OR: [
          { fileName: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      };

      // Apply role-based filtering for documents
      if (currentUserRole === 'STUDENT') {
        documentWhere.project = {
          students: {
            some: {
              studentId: currentUserId
            }
          }
        };
      } else if (currentUserRole === 'LECTURER') {
        documentWhere.project = {
          lecturerId: currentUserId
        };
      }

      // Apply additional filters
      if (status) {
        documentWhere.status = status;
      }

      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'this_week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case 'this_month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'this_year':
            startDate = new Date(now.getFullYear(), 0, 1);
            break;
          default:
            startDate = new Date(0);
        }
        
        documentWhere.createdAt = { gte: startDate };
      }

      const documents = await prisma.document.findMany({
        where: documentWhere,
        select: {
          id: true,
          fileName: true,
          description: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          project: {
            select: {
              id: true,
              title: true
            }
          },
          uploader: {
            select: {
              fullName: true
            }
          }
        },
        take: 10,
        orderBy: { updatedAt: 'desc' }
      });

      results.push(...documents.map(document => ({
        id: document.id,
        type: 'document',
        title: document.fileName,
        description: document.description,
        status: document.status,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        projectTitle: document.project.title,
        uploader: document.uploader?.fullName
      })));
    }

    // Sort results by relevance and recency
    results.sort((a, b) => {
      // First by type priority (projects, then tasks, then documents)
      const typePriority = { project: 3, task: 2, document: 1 };
      const aPriority = typePriority[a.type as keyof typeof typePriority] || 0;
      const bPriority = typePriority[b.type as keyof typeof typePriority] || 0;
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      // Then by recency
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    res.json({
      message: 'Search completed successfully',
      query: searchQuery,
      results: results.slice(0, 20), // Limit to 20 results
      total: results.length
    });

  } catch (error) {
    console.error('Global search error:', error);
    res.status(500).json({
      error: 'Search failed. Please try again.'
    });
  }
};

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const suggestions: any[] = [];

    // Recent searches (mock data for now)
    const recentSearches = [
      { id: '1', text: 'Machine Learning', type: 'recent' },
      { id: '2', text: 'Data Analysis', type: 'recent' },
      { id: '3', text: 'Research Paper', type: 'recent' }
    ];

    // Popular searches (mock data for now)
    const popularSearches = [
      { id: '4', text: 'AI Research', type: 'popular' },
      { id: '5', text: 'Project Management', type: 'popular' },
      { id: '6', text: 'Documentation', type: 'popular' }
    ];

    // Get recent project titles as suggestions
    let projectWhere: any = {};
    if (currentUserRole === 'STUDENT') {
      projectWhere.students = {
        some: {
          studentId: currentUserId
        }
      };
    } else if (currentUserRole === 'LECTURER') {
      projectWhere.lecturerId = currentUserId;
    }

    const recentProjects = await prisma.project.findMany({
      where: projectWhere,
      select: {
        title: true
      },
      take: 5,
      orderBy: { updatedAt: 'desc' }
    });

    const projectSuggestions = recentProjects.map((project, index) => ({
      id: `project-${index}`,
      text: project.title,
      type: 'suggestion'
    }));

    suggestions.push(...recentSearches, ...popularSearches, ...projectSuggestions);

    res.json({
      message: 'Search suggestions retrieved successfully',
      suggestions: suggestions.slice(0, 10) // Limit to 10 suggestions
    });

  } catch (error) {
    console.error('Get search suggestions error:', error);
    res.status(500).json({
      error: 'Failed to retrieve search suggestions'
    });
  }
};
