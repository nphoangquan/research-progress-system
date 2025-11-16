import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../utils/cloudinary';
import { cleanupLocalFile } from '../middleware/upload.middleware';
import { getStorageSettings } from '../utils/systemSettings';
import { validatePassword } from '../utils/passwordValidator';
import { deleteUserSessions } from '../services/session.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Get all users (for dropdowns and user management)
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Only admins and lecturers can see all users
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'LECTURER') {
      return res.status(403).json({ 
        error: 'Access denied. Only admins and lecturers can view all users.' 
      });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: [
        { role: 'asc' },
        { fullName: 'asc' }
      ]
    });

    res.json({
      message: 'Users retrieved successfully',
      users
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve users' 
    });
  }
};

/**
 * Get project members (for students to see users in their projects)
 */
export const getProjectMembers = async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Check if project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: projectId },
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

    // Get all users in this project
    const projectMembers = await prisma.user.findMany({
      where: {
        OR: [
          { id: project.lecturerId },
          { 
            projectStudents: {
              some: {
                projectId: projectId
              }
            }
          }
        ]
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true
      },
      orderBy: { fullName: 'asc' }
    });

    res.json({
      message: 'Project members retrieved successfully',
      users: projectMembers
    });

  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve project members' 
    });
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Users can only see their own profile unless they're admin/lecturer
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'LECTURER' && id !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to this user profile' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    res.json({
      message: 'User retrieved successfully',
      user
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve user' 
    });
  }
};

/**
 * Update user profile
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, studentId } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Users can only update their own profile unless they're admin
    if (currentUserRole !== 'ADMIN' && id !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to update this user profile' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (studentId) updateData.studentId = studentId;

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      error: 'Failed to update user' 
    });
  }
};

/**
 * Change user password
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Users can only change their own password unless they're admin
    if (currentUserRole !== 'ADMIN' && id !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to change this user password' 
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        passwordHash: true 
      }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Verify current password
    const bcrypt = require('bcrypt');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, existingUser.passwordHash);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ 
        error: 'Current password is incorrect' 
      });
    }

    // Validate new password against security settings
    const passwordValidation = await validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: passwordValidation.errors.join('. '),
        errors: passwordValidation.errors,
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash: newPasswordHash }
    });

    // Invalidate all existing sessions for security (user needs to login again)
    try {
      await deleteUserSessions(id);
      logger.info(`Invalidated all sessions for user ${id} after password change`);
    } catch (sessionError) {
      logger.error('Error invalidating sessions after password change:', sessionError);
      // Continue even if session deletion fails
    }

    res.json({
      message: 'Password changed successfully. Please login again with your new password.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password' 
    });
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    if (currentUserRole !== 'ADMIN' && id !== currentUserId) {
      return res.status(403).json({
        error: 'Access denied to retrieve preferences for this user'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        preferences: true
      }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'Preferences retrieved successfully',
      preferences: user.preferences ?? {}
    });
  } catch (error) {
    console.error('Get user preferences error:', error);
    res.status(500).json({
      error: 'Failed to retrieve user preferences'
    });
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;
    const { preferences } = req.body;

    if (currentUserRole !== 'ADMIN' && id !== currentUserId) {
      return res.status(403).json({
        error: 'Access denied to update preferences for this user'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        preferences: preferences ?? {}
      },
      select: {
        id: true,
        preferences: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Preferences updated successfully',
      preferences: updatedUser.preferences ?? {}
    });
  } catch (error) {
    console.error('Update user preferences error:', error);
    res.status(500).json({
      error: 'Failed to update user preferences'
    });
  }
};

/**
 * Upload user avatar
 */
export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    // Users can only upload their own avatar unless they're admin
    if (currentUserRole !== 'ADMIN' && id !== currentUserId) {
      return res.status(403).json({ 
        error: 'Access denied to upload avatar for this user' 
      });
    }

    if (!req.file) {
      return res.status(400).json({ 
        error: 'No file provided' 
      });
    }

    // File validation and size check are handled by uploadAvatar middleware

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, 
        avatarUrl: true 
      }
    });

    if (!existingUser) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Upload to Cloudinary
    const cloudinaryResult = await uploadFile(req.file);

    try {
      // Update user avatar in database
      const updatedUser = await prisma.user.update({
        where: { id },
        data: { avatarUrl: cloudinaryResult.secure_url },
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          studentId: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true
        }
      });

      // Clean up local file
      cleanupLocalFile(req.file.path);

      // Delete old avatar from Cloudinary if it exists
      if (existingUser.avatarUrl) {
        try {
          // Extract public_id from the old URL
          const oldUrlParts = existingUser.avatarUrl.split('/');
          const oldPublicId = oldUrlParts[oldUrlParts.length - 1].split('.')[0];
          await deleteFile(oldPublicId);
        } catch (deleteError) {
          console.error('Failed to delete old avatar:', deleteError);
          // Don't fail the request if old avatar deletion fails
        }
      }

      res.json({
        message: 'Avatar uploaded successfully',
        user: updatedUser
      });

    } catch (dbError) {
      // If DB update failed, clean up Cloudinary file
      console.error('Database update error:', dbError);
      try {
        await deleteFile(cloudinaryResult.public_id);
      } catch (cleanupError) {
        console.error('Cloudinary cleanup error:', cleanupError);
      }
      
      // Clean up local file
      cleanupLocalFile(req.file.path);
      
      throw dbError; // Re-throw to be caught by outer catch
    }

  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // Clean up local file if upload failed
    if (req.file) {
      cleanupLocalFile(req.file.path);
    }
    
    res.status(500).json({ 
      error: 'Upload failed. Please try again.' 
    });
  }
};
