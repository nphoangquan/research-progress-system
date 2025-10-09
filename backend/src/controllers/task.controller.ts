import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new task
 */
export const createTask = async (req: Request, res: Response) => {
  try {
    const { projectId, title, description, assigneeId, priority = 'MEDIUM', dueDate } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Validation
    if (!projectId || !title || !assigneeId) {
      return res.status(400).json({ 
        error: 'Project ID, title, and assignee ID are required' 
      });
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
      where: { id: assigneeId },
      select: { id: true, fullName: true, role: true }
    });

    if (!assignee) {
      return res.status(400).json({ 
        error: 'Invalid assignee ID' 
      });
    }

    // Check if assignee is part of the project
    const isStudentInProject = project.students.some(
      (ps: any) => ps.studentId === assigneeId
    );
    if (!isStudentInProject && assigneeId !== project.lecturerId) {
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
        assigneeId,
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
    const { projectId } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!projectId) {
      return res.status(400).json({ 
        error: 'Project ID is required' 
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

    const tasks = await prisma.task.findMany({
      where: { projectId: projectId as string },
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

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status) updateData.status = status;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (assigneeId) updateData.assigneeId = assigneeId;

    // Set completedAt if status is DONE
    if (status === 'DONE' && existingTask.status !== 'DONE') {
      updateData.completedAt = new Date();
    } else if (status !== 'DONE' && existingTask.status === 'DONE') {
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
