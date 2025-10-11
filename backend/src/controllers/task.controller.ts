import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { wsService } from '../index';

const prisma = new PrismaClient();

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const { projectId, title, description, assigneeId, priority = 'MEDIUM', dueDate } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Input length validation
    if (title && title.length > 200) {
      return res.status(400).json({ 
        error: 'Task title must be 200 characters or less' 
      });
    }

    if (description && description.length > 2000) {
      return res.status(400).json({ 
        error: 'Task description must be 2000 characters or less' 
      });
    }

    // Validation
    if (!projectId || !title) {
      return res.status(400).json({ 
        error: 'Project ID and title are required' 
      });
    }

    // Assignee ID is optional - if not provided, assign to lecturer
    let finalAssigneeId = assigneeId;
    if (!assigneeId || assigneeId.trim() === '') {
      // Get project lecturer as default assignee
      const projectForLecturer = await prisma.project.findUnique({
        where: { id: projectId },
        select: { lecturerId: true }
      });
      if (!projectForLecturer) {
        return res.status(404).json({ error: 'Project not found' });
      }
      finalAssigneeId = projectForLecturer.lecturerId;
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true, 
        lecturerId: true,
        title: true,
        students: {
          select: {
            studentId: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this project' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && project.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    // Verify assignee exists and is part of the project
    const assignee = await prisma.user.findUnique({
      where: { id: finalAssigneeId },
      select: { id: true, fullName: true, role: true }
    });

    if (!assignee) {
      return res.status(400).json({ 
        error: 'Invalid assignee ID' 
      });
    }

    // Check if assignee is part of the project
    const isStudentInProject = project.students.some(
      (ps: any) => ps.studentId === finalAssigneeId
    );
    if (!isStudentInProject && finalAssigneeId !== project.lecturerId) {
      return res.status(400).json({ 
        error: 'Assignee must be part of the project' 
      });
    }

    // Create task
    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        assigneeId: finalAssigneeId,
        priority,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'TODO'
      },
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Recalculate project progress
    const completedTasks = await prisma.task.count({
      where: { 
        projectId,
        status: 'COMPLETED'
      }
    });
    
    const totalTasks = await prisma.task.count({
      where: { projectId }
    });
    
    const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    await prisma.project.update({
      where: { id: projectId },
      data: { progress: newProgress }
    });

    // Emit WebSocket event for task creation
    wsService.emitTaskCreated(task, projectId);

    res.status(201).json({
      message: 'Task created successfully',
      task
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ 
      error: 'Failed to create task' 
    });
  }
};

/**
 * Get tasks for a project
 */
export const getTasks = async (req: Request, res: Response) => {
  try {
    const { projectId, status, priority, assignee, dueDate, search } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Build filter conditions
    const buildFilters = (baseWhere: any) => {
      let filters = { ...baseWhere };

      // Status filter
      if (status) {
        filters.status = status;
      }

      // Priority filter
      if (priority) {
        filters.priority = priority;
      }

      // Assignee filter
      if (assignee) {
        filters.assigneeId = assignee;
      }

      // Due date filter
      if (dueDate) {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const nextWeek = new Date(today);
        nextWeek.setDate(nextWeek.getDate() + 7);
        const nextMonth = new Date(today);
        nextMonth.setMonth(nextMonth.getMonth() + 1);

        switch (dueDate) {
          case 'overdue':
            filters.dueDate = { lt: today };
            break;
          case 'today':
            filters.dueDate = { gte: today, lt: tomorrow };
            break;
          case 'this_week':
            filters.dueDate = { gte: today, lt: nextWeek };
            break;
          case 'next_week':
            const weekAfter = new Date(nextWeek);
            weekAfter.setDate(weekAfter.getDate() + 7);
            filters.dueDate = { gte: nextWeek, lt: weekAfter };
            break;
          case 'this_month':
            filters.dueDate = { gte: today, lt: nextMonth };
            break;
          case 'no_due_date':
            filters.dueDate = null;
            break;
        }
      }

      // Search filter
      if (search) {
        filters.OR = [
          { title: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      return filters;
    };

    // If no projectId, get all tasks for the user
    if (!projectId) {
      let whereClause: any = {};

      if (currentUserRole === 'STUDENT') {
        // Students can only see tasks from projects they're part of
        whereClause = {
          project: {
            students: {
              some: {
                studentId: currentUserId
              }
            }
          }
        };
      } else if (currentUserRole === 'LECTURER') {
        // Lecturers can see tasks from their projects
        whereClause = {
          project: {
            lecturerId: currentUserId
          }
        };
      }
      // ADMIN can see all tasks (no additional where clause)

      // Apply filters
      whereClause = buildFilters(whereClause);

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              title: true
            }
          },
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      return res.json({
        message: 'Tasks retrieved successfully',
        tasks
      });
    }

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId as string },
      select: { 
        id: true, 
        lecturerId: true,
        title: true,
        students: {
          select: {
            studentId: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this project' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && project.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    // Apply filters for project-specific tasks
    const whereClause = buildFilters({ projectId: projectId as string });

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      message: 'Tasks retrieved successfully',
      tasks
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve tasks' 
    });
  }
};

/**
 * Get task by ID
 */
export const getTaskById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = task.project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && task.project.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this task' 
      });
    }

    res.json({
      message: 'Task retrieved successfully',
      task
    });

  } catch (error) {
    console.error('Get task by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve task' 
    });
  }
};

/**
 * Update task
 */
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, assigneeId } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Input length validation
    if (title && title.length > 200) {
      return res.status(400).json({ 
        error: 'Task title must be 200 characters or less' 
      });
    }

    if (description !== undefined && description && description.length > 2000) {
      return res.status(400).json({ 
        error: 'Task description must be 2000 characters or less' 
      });
    }

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = existingTask.project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && existingTask.project.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this task' 
      });
    }

    // Validate assignee if provided
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId },
        select: { id: true, fullName: true, role: true }
      });

      if (!assignee) {
        return res.status(400).json({ 
          error: 'Invalid assignee ID' 
        });
      }

      // Check if assignee is part of the project
      const isStudentInProject = existingTask.project.students.some(
        (ps: any) => ps.studentId === assigneeId
      );
      if (!isStudentInProject && assigneeId !== existingTask.project.lecturerId) {
        return res.status(400).json({ 
          error: 'Assignee must be part of the project' 
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (assigneeId) updateData.assigneeId = assigneeId;

    // Set completedAt if status is COMPLETED
    if (status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      updateData.completedAt = new Date();
    } else if (status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      updateData.completedAt = null;
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: {
          select: {
            id: true,
            title: true
          }
        },
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Recalculate project progress if task status changed
    if (status && status !== existingTask.status) {
      const completedTasks = await prisma.task.count({
        where: { 
          projectId: existingTask.projectId,
          status: 'COMPLETED'
        }
      });
      
      const totalTasks = await prisma.task.count({
        where: { projectId: existingTask.projectId }
      });
      
      const newProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      await prisma.project.update({
        where: { id: existingTask.projectId },
        data: { progress: newProgress }
      });

      // Emit WebSocket event for status change
      wsService.emitTaskStatusChanged(updatedTask, existingTask.projectId, existingTask.status, status);
    }

    // Emit WebSocket event for task update
    const changes = {
      title: title ? { old: existingTask.title, new: title } : undefined,
      description: description !== undefined ? { old: existingTask.description, new: description } : undefined,
      status: status ? { old: existingTask.status, new: status } : undefined,
      priority: priority ? { old: existingTask.priority, new: priority } : undefined,
      dueDate: dueDate ? { old: existingTask.dueDate, new: dueDate } : undefined,
      assigneeId: assigneeId ? { old: existingTask.assigneeId, new: assigneeId } : undefined
    };
    
    wsService.emitTaskUpdated(updatedTask, existingTask.projectId, changes);

    res.json({
      message: 'Task updated successfully',
      task: updatedTask
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ 
      error: 'Failed to update task' 
    });
  }
};

/**
 * Delete task
 */
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: {
                studentId: true
              }
            }
          }
        }
      }
    });

    if (!existingTask) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = existingTask.project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && existingTask.project.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this task' 
      });
    }

    await prisma.task.delete({
      where: { id }
    });

    // Emit WebSocket event for task deletion
    wsService.emitTaskDeleted(id, existingTask.projectId);

    res.json({
      message: 'Task deleted successfully'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ 
      error: 'Failed to delete task' 
    });
  }
};
