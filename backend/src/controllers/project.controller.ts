import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Create a new project
 */
export const createProject = async (req: Request, res: Response) => {
  try {
    const { title, description, studentIds, lecturerId, startDate, endDate } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Validation
    if (!title || !description || !studentIds || !Array.isArray(studentIds) || studentIds.length === 0 || !lecturerId) {
      return res.status(400).json({ 
        error: 'Title, description, studentIds (array), and lecturerId are required' 
      });
    }

    // Check permissions
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'LECTURER') {
      return res.status(403).json({ 
        error: 'Only admins and lecturers can create projects' 
      });
    }

    // Verify lecturer exists
    const lecturer = await prisma.user.findUnique({ 
      where: { id: lecturerId },
      select: { id: true, fullName: true, role: true }
    });

    if (!lecturer || lecturer.role !== 'LECTURER') {
      return res.status(400).json({ 
        error: 'Invalid lecturer ID or user is not a lecturer' 
      });
    }

    // Verify all students exist and are students
    const students = await prisma.user.findMany({
      where: { 
        id: { in: studentIds },
        role: 'STUDENT'
      },
      select: { id: true, fullName: true, role: true }
    });

    if (students.length !== studentIds.length) {
      return res.status(400).json({ 
        error: 'One or more student IDs are invalid or users are not students' 
      });
    }

    // Create project with transaction
    const project = await prisma.$transaction(async (tx) => {
      // Create project
      const newProject = await tx.project.create({
        data: {
          title,
          description,
          lecturerId,
          startDate: startDate ? new Date(startDate) : new Date(),
          endDate: endDate ? new Date(endDate) : null,
          status: 'NOT_STARTED',
          progress: 0
        }
      });

      // Add students to project
      await tx.projectStudent.createMany({
        data: studentIds.map((studentId: string, index: number) => ({
          projectId: newProject.id,
          studentId,
          role: index === 0 ? 'LEAD' : 'MEMBER' // First student is lead
        }))
      });

      // Return project with relations
      return await tx.project.findUnique({
        where: { id: newProject.id },
        include: {
          lecturer: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  studentId: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
              documents: true
            }
          }
        }
      });
    });

    res.status(201).json({
      message: 'Project created successfully',
      project
    });

  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      error: 'Failed to create project' 
    });
  }
};

/**
 * Get all projects (filtered by user role)
 */
export const getProjects = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const { status, page = 1, limit = 10 } = req.query;

    let whereClause: any = {};

    // Filter by user role
    if (currentUserRole === 'STUDENT') {
      whereClause.students = {
        some: {
          studentId: currentUserId
        }
      };
    } else if (currentUserRole === 'LECTURER') {
      whereClause.lecturerId = currentUserId;
    }
    // ADMIN can see all projects

    // Filter by status if provided
    if (status && typeof status === 'string') {
      whereClause.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where: whereClause,
        include: {
          lecturer: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          },
          students: {
            include: {
              student: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  studentId: true
                }
              }
            }
          },
          _count: {
            select: {
              tasks: true,
              documents: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.project.count({ where: whereClause })
    ]);

    res.json({
      message: 'Projects retrieved successfully',
      projects,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve projects' 
    });
  }
};

/**
 * Get project by ID
 */
export const getProjectById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentId: true
              }
            }
          }
        },
        tasks: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignee: {
              select: {
                id: true,
                fullName: true,
                email: true
              }
            }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            description: true,
            indexStatus: true,
            chunkCount: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            tasks: true,
            documents: true
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check access permissions
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

    res.json({
      message: 'Project retrieved successfully',
      project
    });

  } catch (error) {
    console.error('Get project by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project' 
    });
  }
};

/**
 * Update project
 */
export const updateProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title, description, status, progress, endDate } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { 
        id: true, 
        lecturerId: true,
        students: {
          select: {
            studentId: true
          }
        }
      }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = existingProject.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject) {
        return res.status(403).json({ 
          error: 'Access denied to this project' 
        });
      }
    }

    if (currentUserRole === 'LECTURER' && existingProject.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = Math.max(0, Math.min(100, progress));
    if (endDate) updateData.endDate = new Date(endDate);

    const updatedProject = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        lecturer: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        },
        students: {
          include: {
            student: {
              select: {
                id: true,
                fullName: true,
                email: true,
                studentId: true
              }
            }
          }
        },
        _count: {
          select: {
            tasks: true,
            documents: true
          }
        }
      }
    });

    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });

  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      error: 'Failed to update project' 
    });
  }
};

/**
 * Delete project
 */
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { id: true, lecturerId: true }
    });

    if (!existingProject) {
      return res.status(404).json({ 
        error: 'Project not found' 
      });
    }

    // Check permissions (only admin and lecturer can delete)
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'LECTURER') {
      return res.status(403).json({ 
        error: 'Only admins and lecturers can delete projects' 
      });
    }

    if (currentUserRole === 'LECTURER' && existingProject.lecturerId !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this project' 
      });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.json({
      message: 'Project deleted successfully'
    });

  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      error: 'Failed to delete project' 
    });
  }
};
