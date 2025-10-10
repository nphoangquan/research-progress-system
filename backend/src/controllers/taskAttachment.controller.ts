import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile } from '../utils/cloudinary';
import fs from 'fs';

const prisma = new PrismaClient();

/**
 * Upload attachment to a task
 */
export const uploadAttachment = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file provided' 
      });
    }

    const { taskId } = req.params;
    const { description } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
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

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = task.project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject && task.assigneeId !== currentUserId) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    } else if (currentUserRole === 'LECTURER') {
      if (task.project.lecturerId !== currentUserId) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    }
    // ADMIN can access all tasks

    // Upload to Cloudinary
    const cloudinaryResult = await uploadFile(req.file);

    // Save to database
    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId,
        fileName: req.file.originalname,
        fileUrl: cloudinaryResult.secure_url,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedBy: currentUserId,
        description: description || null,
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    // Delete local file
    fs.unlinkSync(req.file.path);

    res.status(201).json({
      message: 'Attachment uploaded successfully',
      attachment
    });

  } catch (error) {
    console.error('Upload attachment error:', error);
    res.status(500).json({ 
      error: 'Failed to upload attachment' 
    });
  }
};

/**
 * Get attachments for a task
 */
export const getAttachments = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if task exists and user has access
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        projectId: true,
        assigneeId: true,
        project: {
          select: {
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

    if (!task) {
      return res.status(404).json({ 
        error: 'Task not found' 
      });
    }

    // Check access permissions
    if (currentUserRole === 'STUDENT') {
      const isStudentInProject = task.project.students.some(
        (ps: any) => ps.studentId === currentUserId
      );
      if (!isStudentInProject && task.assigneeId !== currentUserId) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    } else if (currentUserRole === 'LECTURER') {
      if (task.project.lecturerId !== currentUserId) {
        return res.status(403).json({ 
          error: 'Access denied to this task' 
        });
      }
    }
    // ADMIN can access all tasks

    const attachments = await prisma.taskAttachment.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      message: 'Attachments retrieved successfully',
      attachments
    });

  } catch (error) {
    console.error('Get attachments error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve attachments' 
    });
  }
};

/**
 * Delete an attachment
 */
export const deleteAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if attachment exists
    const attachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          select: {
            projectId: true,
            assigneeId: true,
            project: {
              select: {
                lecturerId: true,
                students: {
                  select: {
                    studentId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({ 
        error: 'Attachment not found' 
      });
    }

    // Check permissions - only uploader, lecturer, or admin can delete
    if (attachment.uploadedBy !== currentUserId) {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({ 
          error: 'You can only delete your own attachments' 
        });
      } else if (currentUserRole === 'LECTURER') {
        if (attachment.task.project.lecturerId !== currentUserId) {
          return res.status(403).json({ 
            error: 'Access denied to this attachment' 
          });
        }
      }
      // ADMIN can delete any attachment
    }

    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    });

    res.json({
      message: 'Attachment deleted successfully'
    });

  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ 
      error: 'Failed to delete attachment' 
    });
  }
};

/**
 * Update attachment description
 */
export const updateAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    const { description } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if attachment exists
    const existingAttachment = await prisma.taskAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        task: {
          select: {
            projectId: true,
            assigneeId: true,
            project: {
              select: {
                lecturerId: true,
                students: {
                  select: {
                    studentId: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!existingAttachment) {
      return res.status(404).json({ 
        error: 'Attachment not found' 
      });
    }

    // Check permissions - only uploader, lecturer, or admin can update
    if (existingAttachment.uploadedBy !== currentUserId) {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({ 
          error: 'You can only update your own attachments' 
        });
      } else if (currentUserRole === 'LECTURER') {
        if (existingAttachment.task.project.lecturerId !== currentUserId) {
          return res.status(403).json({ 
            error: 'Access denied to this attachment' 
          });
        }
      }
      // ADMIN can update any attachment
    }

    const updatedAttachment = await prisma.taskAttachment.update({
      where: { id: attachmentId },
      data: {
        description: description || null
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Attachment updated successfully',
      attachment: updatedAttachment
    });

  } catch (error) {
    console.error('Update attachment error:', error);
    res.status(500).json({ 
      error: 'Failed to update attachment' 
    });
  }
};
