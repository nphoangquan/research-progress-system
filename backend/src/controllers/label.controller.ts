import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get labels
 * Query params: projectId (optional) - if not provided, returns global labels + project labels user has access to
 */
export const getLabels = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.query;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    let labels;

    if (projectId) {
      // Get project-specific labels
      // Check if user has access to project
      const project = await prisma.project.findUnique({
        where: { id: projectId as string },
        select: {
          id: true,
          lecturerId: true,
          students: {
            select: { studentId: true }
          }
        }
      });

      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
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

      // Get project labels + global labels
      labels = await prisma.label.findMany({
        where: {
          OR: [
            { projectId: projectId as string },
            { projectId: null } // Global labels
          ]
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true
            }
          },
          project: projectId ? {
            select: {
              id: true,
              title: true
            }
          } : false
        },
        orderBy: [
          { projectId: 'asc' }, // Global labels first (null)
          { name: 'asc' }
        ]
      });
    } else {
      // Get all labels user has access to
      if (currentUserRole === 'ADMIN') {
        // Admin can see all labels
        labels = await prisma.label.findMany({
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
          },
          orderBy: [
            { projectId: 'asc' },
            { name: 'asc' }
          ]
        });
      } else if (currentUserRole === 'LECTURER') {
        // Lecturer can see their project labels + global labels
        const lecturerProjects = await prisma.project.findMany({
          where: { lecturerId: currentUserId },
          select: { id: true }
        });
        const projectIds = lecturerProjects.map(p => p.id);

        labels = await prisma.label.findMany({
          where: {
            OR: [
              { projectId: { in: projectIds } },
              { projectId: null } // Global labels
            ]
          },
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
          },
          orderBy: [
            { projectId: 'asc' },
            { name: 'asc' }
          ]
        });
      } else {
        // Student can see labels from their projects + global labels
        const studentProjects = await prisma.projectStudent.findMany({
          where: { studentId: currentUserId },
          select: { projectId: true }
        });
        const projectIds = studentProjects.map(sp => sp.projectId);

        labels = await prisma.label.findMany({
          where: {
            OR: [
              { projectId: { in: projectIds } },
              { projectId: null } // Global labels
            ]
          },
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
          },
          orderBy: [
            { projectId: 'asc' },
            { name: 'asc' }
          ]
        });
      }
    }

    res.json(labels);
  } catch (error: any) {
    console.error('Error fetching labels:', error);
    res.status(500).json({
      error: 'Failed to fetch labels',
      message: error.message
    });
  }
};

/**
 * Create a new label
 */
export const createLabel = async (req: Request, res: Response) => {
  try {
    const { name, color, projectId } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({
        error: 'Label name is required'
      });
    }

    if (name.length > 50) {
      return res.status(400).json({
        error: 'Label name must be 50 characters or less'
      });
    }

    // Validate color format (hex color)
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    const finalColor = color || '#3B82F6';
    if (!colorRegex.test(finalColor)) {
      return res.status(400).json({
        error: 'Invalid color format. Use hex color (e.g., #3B82F6)'
      });
    }

    // Global label (projectId = null) - only admin can create
    if (!projectId || projectId === null) {
      if (currentUserRole !== 'ADMIN') {
        return res.status(403).json({
          error: 'Only administrators can create global labels'
        });
      }

      // Check if global label with same name already exists
      const existingGlobalLabel = await prisma.label.findFirst({
        where: {
          projectId: null,
          name: name.trim()
        }
      });

      if (existingGlobalLabel) {
        return res.status(409).json({
          error: 'A global label with this name already exists'
        });
      }

      const label = await prisma.label.create({
        data: {
          name: name.trim(),
          color: finalColor,
          projectId: null,
          createdBy: currentUserId
        },
        include: {
          creator: {
            select: {
              id: true,
              fullName: true
            }
          }
        }
      });

      return res.status(201).json(label);
    }

    // Project-specific label
    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        lecturerId: true,
        students: {
          select: { studentId: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Check permissions (ADMIN or LECTURER of project can create labels)
    if (currentUserRole !== 'ADMIN') {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({
          error: 'Students cannot create labels'
        });
      }

      if (currentUserRole === 'LECTURER' && project.lecturerId !== currentUserId) {
        return res.status(403).json({
          error: 'Access denied. Only project lecturer can create labels for this project'
        });
      }
    }

    // Check if project label with same name already exists
    const existingLabel = await prisma.label.findUnique({
      where: {
        projectId_name: {
          projectId: projectId,
          name: name.trim()
        }
      }
    });

    if (existingLabel) {
      return res.status(409).json({
        error: 'A label with this name already exists in this project'
      });
    }

    const label = await prisma.label.create({
      data: {
        name: name.trim(),
        color: finalColor,
        projectId: projectId,
        createdBy: currentUserId
      },
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
    });

    res.status(201).json(label);
  } catch (error: any) {
    console.error('Error creating label:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A label with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to create label',
      message: error.message
    });
  }
};

/**
 * Update a label
 */
export const updateLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Find label
    const label = await prisma.label.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true
          }
        }
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Check permissions
    if (currentUserRole !== 'ADMIN') {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({
          error: 'Students cannot update labels'
        });
      }

      // For global labels, only admin can update
      if (!label.projectId) {
        return res.status(403).json({
          error: 'Only administrators can update global labels'
        });
      }

      // For project labels, only lecturer of that project can update
      if (label.project && label.project.lecturerId !== currentUserId) {
        return res.status(403).json({
          error: 'Access denied. Only project lecturer can update labels'
        });
      }
    }

    // Validation
    const updateData: any = {};

    if (name !== undefined) {
      if (!name || name.trim() === '') {
        return res.status(400).json({
          error: 'Label name cannot be empty'
        });
      }
      if (name.length > 50) {
        return res.status(400).json({
          error: 'Label name must be 50 characters or less'
        });
      }
      updateData.name = name.trim();
    }

    if (color !== undefined) {
      const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!colorRegex.test(color)) {
        return res.status(400).json({
          error: 'Invalid color format. Use hex color (e.g., #3B82F6)'
        });
      }
      updateData.color = color;
    }

    // Check for duplicate name if name is being updated
    if (updateData.name && updateData.name !== label.name) {
      const existingLabel = label.projectId
        ? await prisma.label.findUnique({
            where: {
              projectId_name: {
                projectId: label.projectId,
                name: updateData.name
              }
            }
          })
        : await prisma.label.findFirst({
            where: {
              projectId: null,
              name: updateData.name
            }
          });

      if (existingLabel) {
        return res.status(409).json({
          error: 'A label with this name already exists'
        });
      }
    }

    const updatedLabel = await prisma.label.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: {
            id: true,
            fullName: true
          }
        },
        project: label.projectId ? {
          select: {
            id: true,
            title: true
          }
        } : false
      }
    });

    res.json(updatedLabel);
  } catch (error: any) {
    console.error('Error updating label:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'A label with this name already exists'
      });
    }

    res.status(500).json({
      error: 'Failed to update label',
      message: error.message
    });
  }
};

/**
 * Delete a label
 */
export const deleteLabel = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Find label
    const label = await prisma.label.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            lecturerId: true
          }
        }
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Check permissions
    if (currentUserRole !== 'ADMIN') {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({
          error: 'Students cannot delete labels'
        });
      }

      // For global labels, only admin can delete
      if (!label.projectId) {
        return res.status(403).json({
          error: 'Only administrators can delete global labels'
        });
      }

      // For project labels, only lecturer of that project can delete
      if (label.project && label.project.lecturerId !== currentUserId) {
        return res.status(403).json({
          error: 'Access denied. Only project lecturer can delete labels'
        });
      }
    }

    // Delete label (TaskLabel will be cascade deleted)
    await prisma.label.delete({
      where: { id }
    });

    res.json({ message: 'Label deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting label:', error);
    res.status(500).json({
      error: 'Failed to delete label',
      message: error.message
    });
  }
};

/**
 * Get labels for a specific task
 */
export const getTaskLabels = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Find task and check access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: { studentId: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (ADMIN has access to all projects)
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

    // Get labels for this task
    const taskLabels = await prisma.taskLabel.findMany({
      where: { taskId },
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
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    res.json(taskLabels.map(tl => tl.label));
  } catch (error: any) {
    console.error('Error fetching task labels:', error);
    res.status(500).json({
      error: 'Failed to fetch task labels',
      message: error.message
    });
  }
};

/**
 * Add label to task
 */
export const addLabelToTask = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { labelId } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!labelId) {
      return res.status(400).json({
        error: 'Label ID is required'
      });
    }

    // Find task and check access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: { studentId: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (ADMIN has access to all projects)
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

    // Find label and verify it belongs to the same project (or is global)
    const label = await prisma.label.findUnique({
      where: { id: labelId },
      select: {
        id: true,
        projectId: true
      }
    });

    if (!label) {
      return res.status(404).json({ error: 'Label not found' });
    }

    // Verify label is accessible for this project
    if (label.projectId && label.projectId !== task.projectId) {
      return res.status(400).json({
        error: 'Label does not belong to this project'
      });
    }

    // Check if label is already assigned to task
    const existingTaskLabel = await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId
        }
      }
    });

    if (existingTaskLabel) {
      return res.status(409).json({
        error: 'Label is already assigned to this task'
      });
    }

    // Add label to task
    const taskLabel = await prisma.taskLabel.create({
      data: {
        taskId,
        labelId
      },
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
    });

    res.status(201).json(taskLabel.label);
  } catch (error: any) {
    console.error('Error adding label to task:', error);
    
    if (error.code === 'P2002') {
      return res.status(409).json({
        error: 'Label is already assigned to this task'
      });
    }

    res.status(500).json({
      error: 'Failed to add label to task',
      message: error.message
    });
  }
};

/**
 * Remove label from task
 */
export const removeLabelFromTask = async (req: Request, res: Response) => {
  try {
    const { taskId, labelId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Find task and check access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        project: {
          select: {
            id: true,
            lecturerId: true,
            students: {
              select: { studentId: true }
            }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions (ADMIN has access to all projects)
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

    // Find task label
    const taskLabel = await prisma.taskLabel.findUnique({
      where: {
        taskId_labelId: {
          taskId,
          labelId
        }
      }
    });

    if (!taskLabel) {
      return res.status(404).json({
        error: 'Label is not assigned to this task'
      });
    }

    // Remove label from task
    await prisma.taskLabel.delete({
      where: {
        taskId_labelId: {
          taskId,
          labelId
        }
      }
    });

    res.json({ message: 'Label removed from task successfully' });
  } catch (error: any) {
    console.error('Error removing label from task:', error);
    res.status(500).json({
      error: 'Failed to remove label from task',
      message: error.message
    });
  }
};

