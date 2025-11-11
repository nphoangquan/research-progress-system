import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { wsService } from '../index';
import ActivityService from '../services/activity.service';

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

    // Check permissions (ADMIN has access to all projects)
    if (currentUserRole !== 'ADMIN') {
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

    // Log activity
    await ActivityService.logActivity({
      userId: currentUserId,
      type: 'TASK_CREATED',
      description: `created task "${title}"`,
      projectId: projectId,
      taskId: task.id,
      metadata: {
        taskTitle: title,
        assigneeId: assigneeId,
        priority: priority
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
    const { projectId, status, priority, assignee, dueDate, search, labelIds, page = '1', limit = '20' } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Parse pagination parameters
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

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

      // Assignee filter (support multiple assignees)
      if (assignee) {
        if (Array.isArray(assignee)) {
          filters.assigneeId = { in: assignee };
        } else {
          filters.assigneeId = assignee;
        }
      }

      // Due date filter
      if (dueDate) {
        // Check if it's a custom date range (format: "custom:startDate|endDate")
        if (typeof dueDate === 'string' && dueDate.startsWith('custom:')) {
          const dateRangeStr = dueDate.replace('custom:', '');
          const [startDateStr, endDateStr] = dateRangeStr.split('|');
          
          if (startDateStr && startDateStr !== 'null') {
            const startDate = new Date(startDateStr);
            startDate.setHours(0, 0, 0, 0);
            
            if (endDateStr && endDateStr !== 'null') {
              const endDate = new Date(endDateStr);
              endDate.setHours(23, 59, 59, 999);
              filters.dueDate = { gte: startDate, lte: endDate };
            } else {
              filters.dueDate = { gte: startDate };
            }
          } else if (endDateStr && endDateStr !== 'null') {
            const endDate = new Date(endDateStr);
            endDate.setHours(23, 59, 59, 999);
            filters.dueDate = { lte: endDate };
          }
        } else {
          // Preset options
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

      // Label filter
      if (labelIds) {
        const labelIdArray = Array.isArray(labelIds) ? labelIds : [labelIds];
        whereClause.labels = {
          some: {
            labelId: {
              in: labelIdArray
            }
          }
        };
      }

      const [tasks, totalCount] = await Promise.all([
        prisma.task.findMany({
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
            },
            labels: {
              include: {
                label: {
                  include: {
                    creator: {
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
                    }
                  }
                }
              }
            }
          },
          orderBy: [
            { status: 'asc' },
            { priority: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limitNum
        }),
        prisma.task.count({
          where: whereClause
        })
      ]);

      const totalPages = Math.ceil(totalCount / limitNum);

      return res.json({
        message: 'Tasks retrieved successfully',
        tasks: tasks.map(task => ({
          ...task,
          labels: task.labels.map(tl => tl.label)
        })),
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalCount,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
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

    // Check permissions (ADMIN has access to all projects)
    if (currentUserRole !== 'ADMIN') {
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
    }

    // Apply filters for project-specific tasks
    const whereClause = buildFilters({ projectId: projectId as string });

    // Label filter
    if (labelIds) {
      const labelIdArray = Array.isArray(labelIds) ? labelIds : [labelIds];
      whereClause.labels = {
        some: {
          labelId: {
            in: labelIdArray
          }
        }
      };
    }

    const [tasks, totalCount] = await Promise.all([
      prisma.task.findMany({
        where: whereClause,
        include: {
          assignee: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          labels: {
            include: {
              label: {
                include: {
                  creator: {
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
                  }
                }
              }
            }
          }
        },
        orderBy: [
          { status: 'asc' },
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.task.count({
        where: whereClause
      })
    ]);

    const totalPages = Math.ceil(totalCount / limitNum);

    res.json({
      message: 'Tasks retrieved successfully',
      tasks: tasks.map(task => ({
        ...task,
        labels: task.labels.map(tl => tl.label)
      })),
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
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
        },
        submittedByUser: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        labels: {
          include: {
            label: {
              include: {
                creator: {
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
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check permissions (ADMIN has access to all tasks)
    if (currentUserRole !== 'ADMIN') {
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
    }

    res.json({
      message: 'Task retrieved successfully',
      task: {
        ...task,
        labels: task.labels.map(tl => tl.label)
      }
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

    // Check permissions (ADMIN has access to all tasks)
    if (currentUserRole !== 'ADMIN') {
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

    // Log activity
    await ActivityService.logActivity({
      userId: currentUserId,
      type: 'TASK_UPDATED',
      description: `updated task "${existingTask.title}"`,
      projectId: existingTask.projectId,
      taskId: existingTask.id,
      metadata: {
        changes: changes,
        oldStatus: existingTask.status,
        newStatus: updatedTask.status
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

    // Check permissions (ADMIN has access to all tasks)
    if (currentUserRole !== 'ADMIN') {
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

/**
 * Submit task completion by student
 */
export const submitTask = async (req: Request, res: Response) => {
  try {
    const { taskId, content } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Only students can submit tasks
    if (currentUserRole !== 'STUDENT') {
      return res.status(403).json({ 
        error: 'Only students can submit tasks' 
      });
    }

    // Check if task exists and user is assigned to it
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            students: {
              select: { studentId: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check if user is assigned to this task or is a student in the project
    const isAssigned = task.assigneeId === currentUserId;
    const isProjectStudent = task.project.students.some(
      (ps: any) => ps.studentId === currentUserId
    );

    if (!isAssigned && !isProjectStudent) {
      return res.status(403).json({ 
        error: 'You are not assigned to this task or not a member of this project' 
      });
    }

    // Handle file uploads if any
    const uploadedFiles = [];
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        // Here you would upload to Cloudinary or your file storage
        // For now, we'll just store the file info
        uploadedFiles.push({
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedBy: currentUserId
        });
      }
    }

    // Update task with submission
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        submissionContent: content,
        submittedAt: new Date(),
        submittedBy: currentUserId
      },
      include: {
        assignee: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        project: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Log activity
    await ActivityService.logActivity({
      userId: currentUserId,
      type: 'TASK_SUBMITTED',
      description: `Submitted task: ${task.title}`,
      taskId: taskId,
      projectId: task.projectId,
      metadata: {
        taskTitle: task.title,
        projectTitle: task.project.title,
        submissionContent: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
        filesUploaded: uploadedFiles.length
      }
    });

    res.json({
      message: 'Task submitted successfully',
      task: updatedTask,
      uploadedFiles
    });

  } catch (error) {
    console.error('Submit task error:', error);
    res.status(500).json({ 
      error: 'Failed to submit task' 
    });
  }
};
