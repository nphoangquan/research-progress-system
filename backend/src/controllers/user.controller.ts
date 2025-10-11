import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { uploadFile, deleteFile } from '../utils/cloudinary';
import { cleanupLocalFile } from '../middleware/upload.middleware';

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

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        error: 'New password must be at least 6 characters long' 
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

    res.json({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ 
      error: 'Failed to change password' 
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

    // File validation
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        error: 'File type not allowed. Only JPEG, PNG, GIF, and WEBP images are allowed.' 
      });
    }

    // File size validation (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (req.file.size > maxSize) {
      return res.status(400).json({ 
        error: 'File size exceeds 5MB limit.' 
      });
    }

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
