import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { JWTPayload } from '../middleware/auth.middleware';
import emailService from '../services/email.service';
import { createError } from '../utils/errors';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role = 'STUDENT', studentId } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (existingUser) {
      throw createError.conflict('User with this email already exists');
    }

    // Check if studentId is unique (if provided)
    if (studentId) {
      const existingStudent = await prisma.user.findUnique({ 
        where: { studentId } 
      });
      
      if (existingStudent) {
        throw createError.conflict('Student ID already exists');
      }
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        role,
        studentId: studentId || null,
        emailVerified: false, // New users need to verify email
      },
    });

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await emailService.sendWelcomeEmail(
        { email: user.email, fullName: user.fullName },
        verificationToken
      );
    } catch (emailError) {
      logger.warn('Failed to send verification email:', { error: emailError, userId: user.id });
      // Continue even if email fails - user can request resend
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully. Please check your email to verify your account.',
      user: userResponse,
      token
    });

  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({ 
      where: { email: email.toLowerCase() } 
    });
    
    if (!user) {
      throw createError.unauthorized('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw createError.unauthorized('Account is deactivated. Please contact administrator.');
    }

    // Verify password
    if (!user.passwordHash) {
      throw createError.unauthorized('Invalid email or password');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!validPassword) {
      throw createError.unauthorized('Invalid email or password');
    }

    // Check if email is verified (warning but not blocking)
    if (!user.emailVerified) {
      // Still allow login but return warning
      // Frontend can show a banner to remind user to verify
    }

    // Generate JWT token
    const tokenPayload: JWTPayload = {
      userId: user.id,
      role: user.role,
      email: user.email
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userResponse = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      studentId: user.studentId,
      isActive: user.isActive,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt
    };

    res.json({
      message: user.emailVerified ? 'Login successful' : 'Login successful. Please verify your email address.',
      user: userResponse,
      token
    });

  } catch (error) {
    // Let error handler middleware handle it
    throw error;
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        studentId: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      throw createError.notFound('User not found');
    }

    res.json({
      message: 'Profile retrieved successfully',
      user
    });

  } catch (error) {
    throw error;
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { fullName, avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName,
        avatarUrl: avatarUrl || null,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        studentId: true,
        avatarUrl: true,
        isActive: true,
        updatedAt: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    throw error;
  }
};

/**
 * Verify email address
 */
export const verifyEmail = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;

    if (!token) {
      throw createError.badRequest('Verification token is required');
    }

    // Find verification token
    const verificationToken = await prisma.emailVerificationToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!verificationToken) {
      throw createError.badRequest('Invalid or expired verification token');
    }

    // Check if token is expired
    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw createError.badRequest('Verification token has expired. Please request a new one.');
    }

    // Check if email is already verified
    if (verificationToken.user.emailVerified) {
      // Delete token as it's no longer needed
      await prisma.emailVerificationToken.delete({
        where: { id: verificationToken.id },
      });
      throw createError.badRequest('Email is already verified');
    }

    // Verify email
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: { emailVerified: true },
    });

    // Delete used token
    await prisma.emailVerificationToken.delete({
      where: { id: verificationToken.id },
    });

    res.json({
      message: 'Email verified successfully',
    });

  } catch (error) {
    throw error;
  }
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw createError.notFound('User not found');
    }

    // Check if already verified
    if (user.emailVerified) {
      throw createError.badRequest('Email is already verified');
    }

    // Delete old verification tokens for this user
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        token: verificationToken,
        expiresAt,
      },
    });

    // Send verification email
    try {
      await emailService.sendWelcomeEmail(
        { email: user.email, fullName: user.fullName },
        verificationToken
      );
    } catch (emailError) {
      logger.error('Failed to send verification email:', { error: emailError, userId: user.id });
      throw createError.internal('Failed to send verification email. Please try again later.');
    }

    res.json({
      message: 'Verification email sent successfully. Please check your inbox.',
    });

  } catch (error) {
    throw error;
  }
};

/**
 * Request password reset
 */
export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent email enumeration
    // Don't reveal if email exists or not
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Delete old password reset tokens for this user
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
    });

    // Send password reset email
    try {
      await emailService.sendPasswordResetEmail(
        { email: user.email, fullName: user.fullName },
        resetToken
      );
    } catch (emailError) {
      logger.warn('Failed to send password reset email:', { error: emailError, email: user.email });
      // Still return success to prevent email enumeration
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
    });

  } catch (error) {
    throw error;
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      throw createError.badRequest('Reset token is required');
    }

    // Find reset token
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!resetToken) {
      throw createError.badRequest('Invalid or expired reset token');
    }

    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      });
      throw createError.badRequest('Reset token has expired. Please request a new one.');
    }

    // Check if token has been used
    if (resetToken.used) {
      throw createError.badRequest('This reset token has already been used. Please request a new one.');
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Update user password
    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Send password changed confirmation email
    try {
      await emailService.sendPasswordChangedEmail({
        email: resetToken.user.email,
        fullName: resetToken.user.fullName,
      });
    } catch (emailError) {
      logger.warn('Failed to send password changed email:', { error: emailError, userId: resetToken.userId });
      // Continue even if email fails
    }

    res.json({
      message: 'Password reset successfully. You can now login with your new password.',
    });

  } catch (error) {
    throw error;
  }
};
