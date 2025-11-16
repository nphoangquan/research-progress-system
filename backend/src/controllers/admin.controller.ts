import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import emailService from '../services/email.service';
import logger from '../utils/logger';
import { validatePassword } from '../utils/passwordValidator';
import { deleteUserSessions } from '../services/session.service';

const prisma = new PrismaClient();

/**
 * Helper function to log admin actions
 */
const logAdminAction = async (
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  changes?: any,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes,
        ipAddress: req?.ip || req?.socket.remoteAddress || null,
        userAgent: req?.get('user-agent') || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', { error, userId, action });
    // Don't throw - audit logging failure shouldn't break the main operation
  }
};

/**
 * Get all users with pagination, search, and filters
 * @route GET /api/admin/users
 */
export const getUsers = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '20',
      search = '',
      role,
      isActive,
      emailVerified,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    // Search filter
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { studentId: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Role filter
    if (role && (role === 'ADMIN' || role === 'LECTURER' || role === 'STUDENT')) {
      where.role = role;
    }

    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    // Email verified filter
    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified === 'true';
    }

    // Build orderBy
    const orderBy: any = {};
    const validSortFields = ['fullName', 'email', 'role', 'createdAt', 'updatedAt'];
    if (validSortFields.includes(sortBy as string)) {
      orderBy[sortBy as string] = sortOrder === 'asc' ? 'asc' : 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    // Get users and total count
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          studentId: true,
          avatarUrl: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      message: 'Users retrieved successfully',
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({
      error: 'Không thể lấy danh sách người dùng',
    });
  }
};

/**
 * Create a new user (Admin only)
 * @route POST /api/admin/users
 */
export const createUser = async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role, studentId, requireEmailVerification } = req.body;
    const adminUserId = req.user!.userId;

    // Validate required fields
    if (!fullName || !email || !password || !role) {
      return res.status(400).json({
        error: 'Họ tên, email, mật khẩu và vai trò là bắt buộc',
      });
    }

    // Validate role
    if (!['ADMIN', 'LECTURER', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        error: 'Vai trò không hợp lệ',
      });
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return res.status(400).json({
        error: 'Email đã tồn tại trong hệ thống',
      });
    }

    // Check if studentId is unique (if provided)
    if (studentId) {
      const existingStudent = await prisma.user.findUnique({
        where: { studentId },
      });

      if (existingStudent) {
        return res.status(400).json({
          error: 'Mã sinh viên đã tồn tại',
        });
      }
    }

    // Validate password against security settings
    const passwordValidation = await validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        error: passwordValidation.errors.join('. '),
        errors: passwordValidation.errors,
      });
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
        emailVerified: !requireEmailVerification, // If requireEmailVerification is true, set to false
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate email verification token if required
    let verificationToken: string | null = null;
    if (requireEmailVerification) {
      verificationToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      await prisma.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: verificationToken,
          expiresAt,
        },
      });
    }

    /**
     * Send verification email if required
     * Welcome email will be sent automatically after user verifies their email
     */
    if (requireEmailVerification && verificationToken) {
      try {
        await emailService.sendVerificationEmail(
          { email: user.email, fullName: user.fullName },
          verificationToken
        );
      } catch (emailError) {
        logger.warn('Failed to send verification email:', { error: emailError, userId: user.id });
        logger.warn('User created with email verification required but email sending failed. User may need to request resend verification email.');
      }
    }

    // Log admin action
    await logAdminAction(
      adminUserId,
      'CREATE',
      'User',
      user.id,
      { created: { fullName, email, role, studentId } },
      req
    );

    res.status(201).json({
      message: 'Người dùng đã được tạo thành công',
      user,
    });
  } catch (error: any) {
    logger.error('Create user error:', error);
    
    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({
          error: 'Email đã tồn tại trong hệ thống',
        });
      }
      if (field === 'studentId') {
        return res.status(400).json({
          error: 'Mã sinh viên đã tồn tại',
        });
      }
    }

    res.status(500).json({
      error: 'Không thể tạo người dùng',
    });
  }
};

/**
 * Get user by ID (Admin only)
 * @route GET /api/admin/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        avatarUrl: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        // Count related entities
        _count: {
          select: {
            projectsAsLecturer: true,
            projectStudents: true,
            tasks: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Không tìm thấy người dùng',
      });
    }

    res.json({
      message: 'Người dùng đã được lấy thành công',
      user,
    });
  } catch (error) {
    logger.error('Get user by ID error:', error);
    res.status(500).json({
      error: 'Không thể lấy thông tin người dùng',
    });
  }
};

/**
 * Update user (Admin only)
 * @route PUT /api/admin/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, role, studentId } = req.body;
    const adminUserId = req.user!.userId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Không tìm thấy người dùng',
      });
    }

    // Validate role if provided
    if (role && !['ADMIN', 'LECTURER', 'STUDENT'].includes(role)) {
      return res.status(400).json({
        error: 'Vai trò không hợp lệ',
      });
    }

    // Check if email is unique (if changed)
    if (email && email.toLowerCase() !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (emailExists) {
        return res.status(400).json({
          error: 'Email đã tồn tại trong hệ thống',
        });
      }
    }

    // Check if studentId is unique (if changed)
    if (studentId && studentId !== existingUser.studentId) {
      if (studentId === '') {
        // Allow clearing studentId
      } else {
        const studentIdExists = await prisma.user.findUnique({
          where: { studentId },
        });

        if (studentIdExists) {
          return res.status(400).json({
            error: 'Mã sinh viên đã tồn tại',
          });
        }
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email.toLowerCase();
    if (role) updateData.role = role;
    if (studentId !== undefined) updateData.studentId = studentId || null;

    // Track changes for audit log
    const changes: any = {};
    if (fullName && fullName !== existingUser.fullName) {
      changes.fullName = { old: existingUser.fullName, new: fullName };
    }
    if (email && email.toLowerCase() !== existingUser.email) {
      changes.email = { old: existingUser.email, new: email.toLowerCase() };
    }
    if (role && role !== existingUser.role) {
      changes.role = { old: existingUser.role, new: role };
    }
    if (studentId !== undefined && studentId !== existingUser.studentId) {
      changes.studentId = { old: existingUser.studentId, new: studentId || null };
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        studentId: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Log admin action
    if (Object.keys(changes).length > 0) {
      await logAdminAction(
        adminUserId,
        'UPDATE',
        'User',
        id,
        changes,
        req
      );
    }

    res.json({
      message: 'Người dùng đã được cập nhật thành công',
      user: updatedUser,
    });
  } catch (error: any) {
    logger.error('Update user error:', error);

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return res.status(400).json({
          error: 'Email đã tồn tại trong hệ thống',
        });
      }
      if (field === 'studentId') {
        return res.status(400).json({
          error: 'Mã sinh viên đã tồn tại',
        });
      }
    }

    res.status(500).json({
      error: 'Không thể cập nhật người dùng',
    });
  }
};

/**
 * Delete user (Admin only)
 * @route DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { transferProjectsTo, transferTasksTo } = req.query;
    const adminUserId = req.user!.userId;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            projectsAsLecturer: true,
            projectStudents: true,
            tasks: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Không tìm thấy người dùng',
      });
    }

    // Check if user is the last admin
    if (user.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Không thể xóa admin cuối cùng trong hệ thống',
        });
      }
    }

    // Check if user has active projects as lecturer
    if (user._count.projectsAsLecturer > 0) {
      if (!transferProjectsTo) {
        return res.status(400).json({
          error: 'Người dùng này đang là giảng viên của các dự án. Vui lòng chuyển quyền sở hữu trước khi xóa.',
          requiresTransfer: true,
          transferType: 'projects',
        });
      }

      // Validate transfer target
      const transferUser = await prisma.user.findUnique({
        where: { id: transferProjectsTo as string },
      });

      if (!transferUser) {
        return res.status(400).json({
          error: 'Người dùng để chuyển quyền sở hữu không tồn tại',
        });
      }

      if (transferUser.role !== 'LECTURER' && transferUser.role !== 'ADMIN') {
        return res.status(400).json({
          error: 'Chỉ có thể chuyển quyền sở hữu dự án cho giảng viên hoặc admin',
        });
      }

      // Transfer projects
      await prisma.project.updateMany({
        where: { lecturerId: id },
        data: { lecturerId: transferProjectsTo as string },
      });
    }

    // Check if user has assigned tasks
    if (user._count.tasks > 0) {
      if (!transferTasksTo) {
        return res.status(400).json({
          error: 'Người dùng này có các nhiệm vụ được giao. Vui lòng chuyển quyền sở hữu trước khi xóa.',
          requiresTransfer: true,
          transferType: 'tasks',
        });
      }

      // Validate transfer target
      const transferUser = await prisma.user.findUnique({
        where: { id: transferTasksTo as string },
      });

      if (!transferUser) {
        return res.status(400).json({
          error: 'Người dùng để chuyển quyền sở hữu không tồn tại',
        });
      }

      // Transfer tasks
      await prisma.task.updateMany({
        where: { assigneeId: id },
        data: { assigneeId: transferTasksTo as string },
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id },
    });

    // Log admin action
    await logAdminAction(
      adminUserId,
      'DELETE',
      'User',
      id,
      { deleted: { fullName: user.fullName, email: user.email, role: user.role } },
      req
    );

    res.json({
      message: 'Người dùng đã được xóa thành công',
    });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({
      error: 'Không thể xóa người dùng',
    });
  }
};

/**
 * Activate/Deactivate user (Admin only)
 * @route PATCH /api/admin/users/:id/activate
 */
export const activateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    const adminUserId = req.user!.userId;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive phải là true hoặc false',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Không tìm thấy người dùng',
      });
    }

    // Check if trying to deactivate last admin
    if (existingUser.role === 'ADMIN' && !isActive) {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'Không thể vô hiệu hóa admin cuối cùng trong hệ thống',
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // If deactivating user, delete all their sessions
    if (!isActive) {
      try {
        await deleteUserSessions(id);
        logger.info(`Deleted all sessions for deactivated user ${id}`);
      } catch (sessionError) {
        logger.error('Error deleting user sessions on deactivation:', sessionError);
        // Continue even if session deletion fails
      }
    }

    // Log admin action
    await logAdminAction(
      adminUserId,
      isActive ? 'ACTIVATE' : 'DEACTIVATE',
      'User',
      id,
      { isActive: { old: existingUser.isActive, new: isActive } },
      req
    );

    res.json({
      message: isActive ? 'Người dùng đã được kích hoạt' : 'Người dùng đã được vô hiệu hóa',
      user: updatedUser,
    });
  } catch (error) {
    logger.error('Activate user error:', error);
    res.status(500).json({
      error: 'Không thể cập nhật trạng thái người dùng',
    });
  }
};

/**
 * Reset user password (Admin only)
 * @route POST /api/admin/users/:id/reset-password
 */
export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword, generatePassword, sendEmail } = req.body;
    const adminUserId = req.user!.userId;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: 'Không tìm thấy người dùng',
      });
    }

    // Generate or use provided password
    let finalPassword: string;
    if (generatePassword) {
      // Generate random password that meets security requirements
      // Generate a secure random password with mixed case, numbers, and special chars
      const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const lowercase = 'abcdefghijklmnopqrstuvwxyz';
      const numbers = '0123456789';
      const special = '!@#$%^&*';
      const allChars = uppercase + lowercase + numbers + special;
      
      // Get security settings to ensure generated password meets requirements
      const { getSecuritySettings } = require('../utils/systemSettings');
      const securitySettings = await getSecuritySettings();
      const minLength = Math.max(securitySettings.passwordMinLength, 12);
      
      // Generate password with at least one of each required type
      let generated = '';
      if (securitySettings.passwordRequireUppercase) {
        generated += uppercase[Math.floor(Math.random() * uppercase.length)];
      }
      if (securitySettings.passwordRequireLowercase) {
        generated += lowercase[Math.floor(Math.random() * lowercase.length)];
      }
      if (securitySettings.passwordRequireNumbers) {
        generated += numbers[Math.floor(Math.random() * numbers.length)];
      }
      if (securitySettings.passwordRequireSpecialChars) {
        generated += special[Math.floor(Math.random() * special.length)];
      }
      
      // Fill the rest randomly
      for (let i = generated.length; i < minLength; i++) {
        generated += allChars[Math.floor(Math.random() * allChars.length)];
      }
      
      // Shuffle the password
      finalPassword = generated.split('').sort(() => Math.random() - 0.5).join('');
    } else {
      // Validate provided password against security settings
      const passwordValidation = await validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          error: passwordValidation.errors.join('. '),
          errors: passwordValidation.errors,
        });
      }
      finalPassword = newPassword;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(finalPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    // Invalidate all existing sessions for security (user needs to login again)
    try {
      await deleteUserSessions(id);
      logger.info(`Invalidated all sessions for user ${id} after admin password reset`);
    } catch (sessionError) {
      logger.error('Error invalidating sessions after admin password reset:', sessionError);
      // Continue even if session deletion fails
    }

    // Send email if requested
    if (sendEmail) {
      try {
        await emailService.sendAdminPasswordResetEmail(
          { email: existingUser.email, fullName: existingUser.fullName },
          finalPassword
        );
      } catch (emailError) {
        logger.warn('Failed to send password reset email:', { error: emailError, userId: id });
        // Continue even if email fails
      }
    }

    // Log admin action
    await logAdminAction(
      adminUserId,
      'RESET_PASSWORD',
      'User',
      id,
      { passwordReset: true },
      req
    );

    res.json({
      message: 'Mật khẩu đã được đặt lại thành công',
      password: generatePassword ? finalPassword : undefined, // Only return if generated
    });
  } catch (error) {
    logger.error('Reset password error:', error);
    res.status(500).json({
      error: 'Không thể đặt lại mật khẩu',
    });
  }
};

/**
 * Get user statistics (Admin only)
 * @route GET /api/admin/users/stats
 */
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const { timeRange = '30' } = req.query;
    const days = parseInt(timeRange as string, 10);

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get total counts
    const [
      total,
      byRole,
      active,
      inactive,
      verified,
      unverified,
      newUsers,
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      
      // Active users
      prisma.user.count({ where: { isActive: true } }),
      
      // Inactive users
      prisma.user.count({ where: { isActive: false } }),
      
      // Email verified
      prisma.user.count({ where: { emailVerified: true } }),
      
      // Email unverified
      prisma.user.count({ where: { emailVerified: false } }),
      
      // New users over time
      prisma.user.findMany({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        select: {
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      }),
    ]);

    // Process new users by date
    const newUsersByDate: { [key: string]: number } = {};
    newUsers.forEach((user) => {
      const date = user.createdAt.toISOString().split('T')[0];
      newUsersByDate[date] = (newUsersByDate[date] || 0) + 1;
    });

    const timeline = Object.entries(newUsersByDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Format byRole
    const roleStats: { [key: string]: number } = {};
    byRole.forEach((item) => {
      roleStats[item.role] = item._count;
    });

    res.json({
      total,
      byRole: {
        ADMIN: roleStats.ADMIN || 0,
        LECTURER: roleStats.LECTURER || 0,
        STUDENT: roleStats.STUDENT || 0,
      },
      active,
      inactive,
      verified,
      unverified,
      newUsers: timeline,
    });
  } catch (error) {
    logger.error('Get user stats error:', error);
    res.status(500).json({
      error: 'Không thể lấy thống kê người dùng',
    });
  }
};

