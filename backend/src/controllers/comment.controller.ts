import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get comments for a task
 */
export const getComments = async (req: Request, res: Response) => {
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

    const comments = await prisma.comment.findMany({
      where: { taskId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json({
      message: 'Comments retrieved successfully',
      comments
    });

  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve comments' 
    });
  }
};

/**
 * Add a comment to a task
 */
export const addComment = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Comment content is required' 
      });
    }

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

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        taskId,
        authorId: currentUserId
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    // Create notification for task assignee (if different from commenter)
    if (task.assigneeId !== currentUserId) {
      // Get commenter's name
      const commenter = await prisma.user.findUnique({
        where: { id: currentUserId },
        select: { fullName: true }
      });

      await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          projectId: task.projectId,
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          message: `${commenter?.fullName || 'Someone'} commented on a task`,
          isRead: false
        }
      });
    }

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });

  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ 
      error: 'Failed to add comment' 
    });
  }
};

/**
 * Update a comment
 */
export const updateComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ 
        error: 'Comment content is required' 
      });
    }

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
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

    if (!existingComment) {
      return res.status(404).json({ 
        error: 'Comment not found' 
      });
    }

    // Check permissions - only comment author, lecturer, or admin can update
    if (existingComment.authorId !== currentUserId) {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({ 
          error: 'You can only edit your own comments' 
        });
      } else if (currentUserRole === 'LECTURER') {
        if (existingComment.task.project.lecturerId !== currentUserId) {
          return res.status(403).json({ 
            error: 'Access denied to this comment' 
          });
        }
      }
      // ADMIN can edit any comment
    }

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: content.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true
          }
        }
      }
    });

    res.json({
      message: 'Comment updated successfully',
      comment: updatedComment
    });

  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({ 
      error: 'Failed to update comment' 
    });
  }
};

/**
 * Delete a comment
 */
export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { commentId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if comment exists
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId },
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

    if (!existingComment) {
      return res.status(404).json({ 
        error: 'Comment not found' 
      });
    }

    // Check permissions - only comment author, lecturer, or admin can delete
    if (existingComment.authorId !== currentUserId) {
      if (currentUserRole === 'STUDENT') {
        return res.status(403).json({ 
          error: 'You can only delete your own comments' 
        });
      } else if (currentUserRole === 'LECTURER') {
        if (existingComment.task.project.lecturerId !== currentUserId) {
          return res.status(403).json({ 
            error: 'Access denied to this comment' 
          });
        }
      }
      // ADMIN can delete any comment
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ 
      error: 'Failed to delete comment' 
    });
  }
};
