import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import emailService from '../services/email.service';
import { invalidateCache } from '../utils/systemSettings';
import { invalidateUploadCache } from '../middleware/upload.middleware';
import { wsService } from '../index';

const prisma = new PrismaClient();

/**
 * Helper function to log admin actions for system settings
 */
const logAdminAction = async (
  userId: string,
  action: string,
  category: string,
  changes?: any,
  req?: Request
) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType: 'SystemSetting',
        entityId: category,
        changes,
        ipAddress: req?.ip || req?.socket.remoteAddress || null,
        userAgent: req?.get('user-agent') || null,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', { error, userId, action });
  }
};

/**
 * Helper function to update system setting
 */
const updateSetting = async (
  key: string,
  category: string,
  value: any,
  userId: string,
  req?: Request
) => {
  const oldSetting = await prisma.systemSetting.findUnique({
    where: { key },
  });

  const oldValue = oldSetting?.value || null;

  const setting = await prisma.systemSetting.upsert({
    where: { key },
    update: {
      value,
      updatedBy: userId,
    },
    create: {
      key,
      value,
      category,
      updatedBy: userId,
    },
  });

  // Log the change
  await logAdminAction(
    userId,
    'UPDATE',
    category,
    {
      key: { old: oldValue, new: value },
    },
    req
  );

  return setting;
};

// ============================================================================
// GENERAL SETTINGS
// ============================================================================

/**
 * Get general settings
 * @route GET /api/admin/settings/general
 */
export const getGeneralSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'general' },
    });

    // Default values
    const defaults = {
      systemName: 'Research Progress Management System',
      systemDescription: 'Hệ thống quản lý tiến độ nghiên cứu',
      logoUrl: null,
      faviconUrl: null,
      defaultLanguage: 'vi',
    };

    const result: any = { ...defaults };

    settings.forEach((setting) => {
      const key = setting.key.replace('general.', '');
      result[key] = setting.value;
    });

    res.json({ settings: result });
  } catch (error) {
    logger.error('Error fetching general settings:', error);
    res.status(500).json({ error: 'Không thể tải cài đặt chung' });
  }
};

/**
 * Update general settings
 * @route PUT /api/admin/settings/general
 */
export const updateGeneralSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      systemName,
      systemDescription,
      logoUrl,
      faviconUrl,
      defaultLanguage,
    } = req.body;

    const updates = [];

    if (systemName !== undefined) {
      updates.push(updateSetting('general.systemName', 'general', systemName, userId, req));
    }
    if (systemDescription !== undefined) {
      updates.push(
        updateSetting('general.systemDescription', 'general', systemDescription, userId, req)
      );
    }
    if (logoUrl !== undefined) {
      updates.push(updateSetting('general.logoUrl', 'general', logoUrl, userId, req));
    }
    if (faviconUrl !== undefined) {
      updates.push(updateSetting('general.faviconUrl', 'general', faviconUrl, userId, req));
    }
    if (defaultLanguage !== undefined) {
      updates.push(
        updateSetting('general.defaultLanguage', 'general', defaultLanguage, userId, req)
      );
    }

    await Promise.all(updates);

    res.json({ message: 'Cài đặt chung đã được cập nhật thành công' });
  } catch (error) {
    logger.error('Error updating general settings:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt chung' });
  }
};

// ============================================================================
// EMAIL SETTINGS
// ============================================================================

/**
 * Get email settings
 * @route GET /api/admin/settings/email
 */
export const getEmailSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'email' },
    });

    // Default values - only non-sensitive settings
    const defaults = {
      fromEmail: '',
      fromName: 'Research Progress Management System',
      welcomeEmailTemplate: null,
      passwordResetEmailTemplate: null,
      verificationEmailTemplate: null,
    };

    const result: any = { ...defaults };

    settings.forEach((setting) => {
      const key = setting.key.replace('email.', '');
      // Only return non-sensitive settings
      if (['fromEmail', 'fromName', 'welcomeEmailTemplate', 'passwordResetEmailTemplate', 'verificationEmailTemplate'].includes(key)) {
        result[key] = setting.value;
      }
    });

    res.json({ settings: result });
  } catch (error) {
    logger.error('Error fetching email settings:', error);
    res.status(500).json({ error: 'Không thể tải cài đặt email' });
  }
};

/**
 * Update email settings
 * @route PUT /api/admin/settings/email
 */
export const updateEmailSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      fromEmail,
      fromName,
      welcomeEmailTemplate,
      passwordResetEmailTemplate,
      verificationEmailTemplate,
    } = req.body;

    // Reject any attempt to update SMTP credentials
    if (req.body.smtpHost !== undefined || req.body.smtpPort !== undefined || 
        req.body.smtpSecure !== undefined || req.body.smtpUsername !== undefined || 
        req.body.smtpPassword !== undefined) {
      return res.status(400).json({ 
        error: 'SMTP credentials không thể cập nhật qua API. Vui lòng sử dụng biến môi trường (.env file).' 
      });
    }

    const updates = [];

    if (fromEmail !== undefined) {
      updates.push(updateSetting('email.fromEmail', 'email', fromEmail, userId, req));
    }
    if (fromName !== undefined) {
      updates.push(updateSetting('email.fromName', 'email', fromName, userId, req));
    }
    if (welcomeEmailTemplate !== undefined) {
      updates.push(
        updateSetting('email.welcomeEmailTemplate', 'email', welcomeEmailTemplate, userId, req)
      );
    }
    if (passwordResetEmailTemplate !== undefined) {
      updates.push(
        updateSetting(
          'email.passwordResetEmailTemplate',
          'email',
          passwordResetEmailTemplate,
          userId,
          req
        )
      );
    }
    if (verificationEmailTemplate !== undefined) {
      updates.push(
        updateSetting(
          'email.verificationEmailTemplate',
          'email',
          verificationEmailTemplate,
          userId,
          req
        )
      );
    }

    await Promise.all(updates);

    res.json({ message: 'Cài đặt email đã được cập nhật thành công' });
  } catch (error) {
    logger.error('Error updating email settings:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt email' });
  }
};

/**
 * Test email sending
 * @route POST /api/admin/settings/email/test
 */
export const testEmail = async (req: Request, res: Response) => {
  try {
    const { testEmail: email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email test không được để trống' });
    }

    // Check if SMTP is configured in environment variables
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return res.status(400).json({
        error: 'SMTP chưa được cấu hình. Vui lòng cấu hình SMTP_HOST, SMTP_USER, SMTP_PASS trong file .env.',
      });
    }

    /**
     * Send test email using environment variables for SMTP credentials
     */
    try {
      const testEmailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #F3F4F6; color: #1F2937; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 2px solid #E5E7EB; }
              .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
              .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Email Test Thành công</h1>
              </div>
              <div class="content">
                <p>Xin chào,</p>
                <p>Đây là email test từ Hệ thống Quản lý Tiến độ Nghiên cứu.</p>
                <p>Nếu bạn nhận được email này, có nghĩa là cấu hình SMTP của hệ thống đang hoạt động bình thường.</p>
                <p>Thời gian gửi: ${new Date().toLocaleString('vi-VN')}</p>
                <p><strong>Lưu ý:</strong> Email này được gửi bằng cấu hình SMTP từ environment variables. Để sử dụng cấu hình từ database, cần cập nhật email service.</p>
              </div>
              <div class="footer">
                <p>© ${new Date().getFullYear()} Hệ thống Quản lý Tiến độ Nghiên cứu. Bảo lưu mọi quyền.</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await emailService.sendTestEmail(email, testEmailHtml);

      res.json({ message: 'Email test đã được gửi thành công' });
    } catch (emailError) {
      logger.error('Error sending test email:', emailError);
      res.status(500).json({
        error: 'Không thể gửi email test. Vui lòng kiểm tra cấu hình SMTP.',
        details: (emailError as Error).message,
      });
    }
  } catch (error) {
    logger.error('Error testing email:', error);
    res.status(500).json({ error: 'Không thể thực hiện test email' });
  }
};

// ============================================================================
// STORAGE SETTINGS
// ============================================================================

/**
 * Get storage settings
 * @route GET /api/admin/settings/storage
 */
export const getStorageSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'storage' },
    });

    // Default values
    const defaults = {
      maxFileSize: 25 * 1024 * 1024, // 25MB in bytes
      allowedFileTypes: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/gif',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/zip',
        'application/x-rar-compressed',
      ],
      maxDocumentsPerProject: 100,
      autoIndexing: true,
      maxAvatarSize: 5 * 1024 * 1024, // 5MB in bytes
      allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    };

    const result: any = { ...defaults };

    settings.forEach((setting) => {
      const key = setting.key.replace('storage.', '');
      // Ensure arrays are properly handled
      if (key === 'allowedFileTypes' || key === 'allowedAvatarTypes') {
        result[key] = Array.isArray(setting.value) ? setting.value : defaults[key];
      } else {
        result[key] = setting.value;
      }
    });

    res.json({ settings: result });
  } catch (error) {
    logger.error('Error fetching storage settings:', error);
    res.status(500).json({ error: 'Không thể tải cài đặt lưu trữ' });
  }
};

/**
 * Update storage settings
 * @route PUT /api/admin/settings/storage
 */
export const updateStorageSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      maxFileSize,
      allowedFileTypes,
      maxDocumentsPerProject,
      autoIndexing,
      maxAvatarSize,
      allowedAvatarTypes,
    } = req.body;

    const updates = [];

    if (maxFileSize !== undefined) {
      updates.push(updateSetting('storage.maxFileSize', 'storage', maxFileSize, userId, req));
    }
    if (allowedFileTypes !== undefined) {
      updates.push(
        updateSetting('storage.allowedFileTypes', 'storage', allowedFileTypes, userId, req)
      );
    }
    if (maxDocumentsPerProject !== undefined) {
      updates.push(
        updateSetting('storage.maxDocumentsPerProject', 'storage', maxDocumentsPerProject, userId, req)
      );
    }
    if (autoIndexing !== undefined) {
      updates.push(updateSetting('storage.autoIndexing', 'storage', autoIndexing, userId, req));
    }
    if (maxAvatarSize !== undefined) {
      updates.push(updateSetting('storage.maxAvatarSize', 'storage', maxAvatarSize, userId, req));
    }
    if (allowedAvatarTypes !== undefined) {
      updates.push(
        updateSetting('storage.allowedAvatarTypes', 'storage', allowedAvatarTypes, userId, req)
      );
    }

    await Promise.all(updates);

    // Invalidate caches to ensure new settings are used immediately
    invalidateCache();
    invalidateUploadCache();

    res.json({ message: 'Cài đặt lưu trữ đã được cập nhật thành công' });
  } catch (error) {
    logger.error('Error updating storage settings:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt lưu trữ' });
  }
};

// ============================================================================
// SECURITY SETTINGS
// ============================================================================

/**
 * Get security settings
 * @route GET /api/admin/settings/security
 */
export const getSecuritySettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'security' },
    });

    // Default values
    const defaults = {
      passwordMinLength: 8,
      passwordRequireUppercase: false,
      passwordRequireLowercase: false,
      passwordRequireNumbers: false,
      passwordRequireSpecialChars: false,
      sessionTimeout: 60 * 24, // 24 hours in minutes
      maxConcurrentSessions: 3,
      maxLoginAttempts: 5,
      lockoutDuration: 30, // minutes
      requireEmailVerification: false,
    };

    const result: any = { ...defaults };

    settings.forEach((setting) => {
      const key = setting.key.replace('security.', '');
      result[key] = setting.value;
    });

    res.json({ settings: result });
  } catch (error) {
    logger.error('Error fetching security settings:', error);
    res.status(500).json({ error: 'Không thể tải cài đặt bảo mật' });
  }
};

/**
 * Update security settings
 * @route PUT /api/admin/settings/security
 */
export const updateSecuritySettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      passwordMinLength,
      passwordRequireUppercase,
      passwordRequireLowercase,
      passwordRequireNumbers,
      passwordRequireSpecialChars,
      sessionTimeout,
      maxConcurrentSessions,
      maxLoginAttempts,
      lockoutDuration,
      requireEmailVerification,
    } = req.body;

    const updates = [];

    if (passwordMinLength !== undefined) {
      updates.push(
        updateSetting('security.passwordMinLength', 'security', passwordMinLength, userId, req)
      );
    }
    if (passwordRequireUppercase !== undefined) {
      updates.push(
        updateSetting(
          'security.passwordRequireUppercase',
          'security',
          passwordRequireUppercase,
          userId,
          req
        )
      );
    }
    if (passwordRequireLowercase !== undefined) {
      updates.push(
        updateSetting(
          'security.passwordRequireLowercase',
          'security',
          passwordRequireLowercase,
          userId,
          req
        )
      );
    }
    if (passwordRequireNumbers !== undefined) {
      updates.push(
        updateSetting(
          'security.passwordRequireNumbers',
          'security',
          passwordRequireNumbers,
          userId,
          req
        )
      );
    }
    if (passwordRequireSpecialChars !== undefined) {
      updates.push(
        updateSetting(
          'security.passwordRequireSpecialChars',
          'security',
          passwordRequireSpecialChars,
          userId,
          req
        )
      );
    }
    if (sessionTimeout !== undefined) {
      updates.push(
        updateSetting('security.sessionTimeout', 'security', sessionTimeout, userId, req)
      );
    }
    if (maxConcurrentSessions !== undefined) {
      updates.push(
        updateSetting(
          'security.maxConcurrentSessions',
          'security',
          maxConcurrentSessions,
          userId,
          req
        )
      );
    }
    if (maxLoginAttempts !== undefined) {
      updates.push(
        updateSetting('security.maxLoginAttempts', 'security', maxLoginAttempts, userId, req)
      );
    }
    if (lockoutDuration !== undefined) {
      updates.push(
        updateSetting('security.lockoutDuration', 'security', lockoutDuration, userId, req)
      );
    }
    if (requireEmailVerification !== undefined) {
      updates.push(
        updateSetting(
          'security.requireEmailVerification',
          'security',
          requireEmailVerification,
          userId,
          req
        )
      );
    }

    await Promise.all(updates);

    res.json({ message: 'Cài đặt bảo mật đã được cập nhật thành công' });
  } catch (error) {
    logger.error('Error updating security settings:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt bảo mật' });
  }
};

// ============================================================================
// MAINTENANCE MODE
// ============================================================================

/**
 * Get maintenance mode settings
 * @route GET /api/admin/settings/maintenance
 */
export const getMaintenanceSettings = async (req: Request, res: Response) => {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category: 'maintenance' },
    });

    // Default values
    const defaults = {
      enabled: false,
      message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
      allowedIPs: [],
      scheduledStart: null,
      scheduledEnd: null,
      duration: null,
    };

    const result: any = { ...defaults };

    settings.forEach((setting) => {
      const key = setting.key.replace('maintenance.', '');
      // Ensure arrays are properly handled
      if (key === 'allowedIPs') {
        result[key] = Array.isArray(setting.value) ? setting.value : defaults[key];
      } else {
        result[key] = setting.value;
      }
    });

    res.json({ settings: result });
  } catch (error) {
    logger.error('Error fetching maintenance settings:', error);
    res.status(500).json({ error: 'Không thể tải cài đặt bảo trì' });
  }
};

/**
 * Update maintenance mode settings
 * @route PUT /api/admin/settings/maintenance
 */
export const updateMaintenanceSettings = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { enabled, message, allowedIPs, scheduledStart, scheduledEnd, duration } = req.body;

    const updates = [];

    if (enabled !== undefined) {
      updates.push(updateSetting('maintenance.enabled', 'maintenance', enabled, userId, req));
    }
    if (message !== undefined) {
      updates.push(updateSetting('maintenance.message', 'maintenance', message, userId, req));
    }
    if (allowedIPs !== undefined) {
      updates.push(
        updateSetting('maintenance.allowedIPs', 'maintenance', allowedIPs, userId, req)
      );
    }
    if (scheduledStart !== undefined) {
      updates.push(
        updateSetting('maintenance.scheduledStart', 'maintenance', scheduledStart, userId, req)
      );
    }
    if (scheduledEnd !== undefined) {
      updates.push(
        updateSetting('maintenance.scheduledEnd', 'maintenance', scheduledEnd, userId, req)
      );
    }
    if (duration !== undefined) {
      updates.push(
        updateSetting('maintenance.duration', 'maintenance', duration, userId, req)
      );
    }

    await Promise.all(updates);

    // Invalidate cache to ensure maintenance mode is checked immediately
    invalidateCache();

    res.json({ message: 'Cài đặt bảo trì đã được cập nhật thành công' });
  } catch (error) {
    logger.error('Error updating maintenance settings:', error);
    res.status(500).json({ error: 'Không thể cập nhật cài đặt bảo trì' });
  }
};

// ============================================================================
// SYSTEM HEALTH
// ============================================================================

/**
 * Get system health status
 * @route GET /api/admin/settings/health
 */
export const getSystemHealth = async (req: Request, res: Response) => {
  try {
    const health: any = {
      database: { status: 'ok', latency: 0 },
      storage: { status: 'ok' },
      email: { status: 'ok' },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      },
      activeUsers: 0,
      recentErrors: 0,
    };

    // Test database connection
    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      health.database.latency = Date.now() - start;
      health.database.status = 'ok';
    } catch (error) {
      health.database.status = 'error';
      health.database.error = (error as Error).message;
    }

    // Check email service
    try {
      // Check if email service is configured via environment variables
      const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

      health.email.status = hasSmtpConfig ? 'ok' : 'not_configured';
    } catch (error) {
      health.email.status = 'error';
    }

    /**
     * Get real-time active users (connected via WebSocket)
     * Fallback to 0 if WebSocket service is unavailable
     */
    try {
      health.activeUsers = wsService?.getConnectedUsersCount() ?? 0;
    } catch (error) {
      logger.error('Error getting active users from WebSocket service:', error);
      health.activeUsers = 0;
    }

    // Get recent errors from audit logs
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      health.recentErrors = await prisma.auditLog.count({
        where: {
          action: {
            contains: 'ERROR',
          },
          createdAt: {
            gte: oneDayAgo,
          },
        },
      });
    } catch (error) {
      logger.error('Error counting recent errors:', error);
    }

    res.json(health);
  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.status(500).json({ error: 'Không thể tải trạng thái hệ thống' });
  }
};

