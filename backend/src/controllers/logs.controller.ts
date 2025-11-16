import { Request, Response } from 'express';
import { PrismaClient, ActivityType } from '@prisma/client';
import logger from '../utils/logger';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

/**
 * Get activity logs with filters
 * @route GET /api/admin/logs/activities
 */
export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      type,
      projectId,
      startDate,
      endDate,
      search,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 50), 200); // Max 200 per page
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (type) {
      where.type = type as ActivityType;
    }

    if (projectId) {
      where.projectId = projectId as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    if (search) {
      where.description = {
        contains: search as string,
        mode: 'insensitive',
      };
    }

    const [activities, total] = await Promise.all([
      prisma.activity.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
          project: {
            select: {
              id: true,
              title: true,
            },
          },
          task: {
            select: {
              id: true,
              title: true,
            },
          },
          document: {
            select: {
              id: true,
              fileName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.activity.count({ where }),
    ]);

    res.json({
      logs: activities,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching activity logs:', error);
    res.status(500).json({ error: 'Không thể tải nhật ký hoạt động' });
  }
};

/**
 * Get audit logs with filters
 * @route GET /api/admin/logs/audit
 */
export const getAuditLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      action,
      entityType,
      entityId,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 50), 200); // Max 200 per page
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (action) {
      where.action = action as string;
    }

    if (entityType) {
      where.entityType = entityType as string;
    }

    if (entityId) {
      where.entityId = entityId as string;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [auditLogs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs: auditLogs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Không thể tải nhật ký kiểm tra' });
  }
};

/**
 * Get login attempt logs with filters
 * @route GET /api/admin/logs/login-attempts
 */
export const getLoginAttemptLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      email,
      success,
      ipAddress,
      startDate,
      endDate,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 50), 200); // Max 200 per page
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (email) {
      where.email = {
        contains: email as string,
        mode: 'insensitive',
      };
    }

    if (success !== undefined) {
      where.success = success === 'true';
    }

    if (ipAddress) {
      where.ipAddress = {
        contains: ipAddress as string,
        mode: 'insensitive',
      };
    }

    if (startDate || endDate) {
      where.failedAt = {};
      if (startDate) {
        where.failedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.failedAt.lte = new Date(endDate as string);
      }
    }

    const [loginAttempts, total] = await Promise.all([
      prisma.loginAttempt.findMany({
        where,
        orderBy: {
          failedAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.loginAttempt.count({ where }),
    ]);

    res.json({
      logs: loginAttempts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching login attempt logs:', error);
    res.status(500).json({ error: 'Không thể tải nhật ký đăng nhập' });
  }
};

/**
 * Get session logs with filters
 * @route GET /api/admin/logs/sessions
 */
export const getSessionLogs = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '50',
      userId,
      ipAddress,
      startDate,
      endDate,
      activeOnly,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
    const limitNum = Math.min(Math.max(1, parseInt(limit as string, 10) || 50), 200); // Max 200 per page
    const offset = (pageNum - 1) * limitNum;

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (ipAddress) {
      where.ipAddress = {
        contains: ipAddress as string,
        mode: 'insensitive',
      };
    }

    if (activeOnly === 'true') {
      const now = new Date();
      where.expiresAt = {
        gt: now,
      };
      where.lastActivityAt = {
        gte: new Date(now.getTime() - 60 * 60 * 1000), // Active within last hour
      };
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate as string);
      }
    }

    const [sessions, total] = await Promise.all([
      prisma.session.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limitNum,
      }),
      prisma.session.count({ where }),
    ]);

    res.json({
      logs: sessions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error('Error fetching session logs:', error);
    res.status(500).json({ error: 'Không thể tải nhật ký phiên' });
  }
};

/**
 * Get system logs from Winston log files
 * @route GET /api/admin/logs/system
 */
export const getSystemLogs = async (req: Request, res: Response) => {
  try {
    const { level, limit = '100', startDate, endDate } = req.query;
    const limitNum = Math.min(parseInt(limit as string, 10) || 100, 1000); // Max 1000 lines

    const logsDir = path.join(process.cwd(), 'logs');
    const logFile = path.join(logsDir, 'combined.log');

    if (!fs.existsSync(logFile)) {
      return res.json({
        logs: [],
        message: 'Không tìm thấy file log hệ thống',
      });
    }

    // Read log file
    const logContent = fs.readFileSync(logFile, 'utf-8');
    const lines = logContent.split('\n').filter((line) => line.trim());

    // Parse and filter logs
    let parsedLogs: any[] = [];
    for (let i = lines.length - 1; i >= 0 && parsedLogs.length < limitNum; i--) {
      try {
        const logLine = lines[i];
        if (!logLine) continue;

        const log = JSON.parse(logLine);

        // Filter by level
        if (level && log.level !== level) {
          continue;
        }

        // Filter by date
        if (startDate || endDate) {
          const logDate = new Date(log.timestamp);
          if (startDate && logDate < new Date(startDate as string)) {
            continue;
          }
          if (endDate && logDate > new Date(endDate as string)) {
            continue;
          }
        }

        parsedLogs.push({
          timestamp: log.timestamp,
          level: log.level,
          message: log.message,
          service: log.service,
          ...log,
        });
      } catch (parseError) {
        // Skip invalid JSON lines
        continue;
      }
    }

    // Reverse to show oldest first
    parsedLogs.reverse();

    res.json({
      logs: parsedLogs,
      total: parsedLogs.length,
    });
  } catch (error) {
    logger.error('Error fetching system logs:', error);
    res.status(500).json({ error: 'Không thể tải nhật ký hệ thống' });
  }
};

/**
 * Export logs to CSV
 * @route GET /api/admin/logs/export
 */
export const exportLogs = async (req: Request, res: Response) => {
  try {
    const { type, ...filters } = req.query;
    const logType = (type as string) || 'activities';

    let csvData = '';
    let filename = '';

    switch (logType) {
      case 'activities': {
        const where: any = {};
        if (filters.userId) where.userId = filters.userId as string;
        if (filters.type) where.type = filters.type as ActivityType;
        if (filters.projectId) where.projectId = filters.projectId as string;
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = new Date(filters.startDate as string);
          if (filters.endDate) where.createdAt.lte = new Date(filters.endDate as string);
        }

        const activities = await prisma.activity.findMany({
          where,
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000, // Limit export to 10k records
        });

        csvData = 'Thời gian,Loại,Mô tả,Người dùng,Dự án\n';
        activities.forEach((activity) => {
          csvData += `"${activity.createdAt.toISOString()}","${activity.type}","${activity.description.replace(/"/g, '""')}","${activity.user?.email || 'N/A'}","${activity.projectId || ''}"\n`;
        });

        filename = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'audit': {
        const where: any = {};
        if (filters.userId) where.userId = filters.userId as string;
        if (filters.action) where.action = filters.action as string;
        if (filters.entityType) where.entityType = filters.entityType as string;
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = new Date(filters.startDate as string);
          if (filters.endDate) where.createdAt.lte = new Date(filters.endDate as string);
        }

        const auditLogs = await prisma.auditLog.findMany({
          where,
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });

        csvData = 'Thời gian,Hành động,Loại thực thể,ID thực thể,Người dùng,IP,Thay đổi\n';
        auditLogs.forEach((log) => {
          csvData += `"${log.createdAt.toISOString()}","${log.action}","${log.entityType}","${log.entityId || ''}","${log.user?.email || ''}","${log.ipAddress || ''}","${JSON.stringify(log.changes).replace(/"/g, '""')}"\n`;
        });

        filename = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'login-attempts': {
        const where: any = {};
        if (filters.email) where.email = { contains: filters.email as string, mode: 'insensitive' };
        if (filters.success !== undefined) where.success = filters.success === 'true';
        if (filters.startDate || filters.endDate) {
          where.failedAt = {};
          if (filters.startDate) where.failedAt.gte = new Date(filters.startDate as string);
          if (filters.endDate) where.failedAt.lte = new Date(filters.endDate as string);
        }

        const attempts = await prisma.loginAttempt.findMany({
          where,
          orderBy: { failedAt: 'desc' },
          take: 10000,
        });

        csvData = 'Thời gian,Email,Thành công,IP,User Agent\n';
        attempts.forEach((attempt) => {
          csvData += `"${attempt.failedAt.toISOString()}","${attempt.email}","${attempt.success}","${attempt.ipAddress || ''}","${(attempt.userAgent || '').replace(/"/g, '""')}"\n`;
        });

        filename = `login-attempts-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'sessions': {
        const where: any = {};
        if (filters.userId) where.userId = filters.userId as string;
        if (filters.ipAddress) where.ipAddress = { contains: filters.ipAddress as string, mode: 'insensitive' };
        if (filters.activeOnly === 'true') {
          const now = new Date();
          where.expiresAt = { gt: now };
          where.lastActivityAt = { gte: new Date(now.getTime() - 60 * 60 * 1000) };
        }
        if (filters.startDate || filters.endDate) {
          where.createdAt = {};
          if (filters.startDate) where.createdAt.gte = new Date(filters.startDate as string);
          if (filters.endDate) where.createdAt.lte = new Date(filters.endDate as string);
        }

        const sessions = await prisma.session.findMany({
          where,
          include: {
            user: {
              select: {
                email: true,
                fullName: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10000,
        });

        csvData = 'Thời gian tạo,Người dùng,IP,User Agent,Hết hạn,Hoạt động cuối,Trạng thái\n';
        sessions.forEach((session) => {
          const isActive = new Date(session.expiresAt) > new Date();
          csvData += `"${session.createdAt.toISOString()}","${session.user?.email || ''}","${session.ipAddress || ''}","${(session.userAgent || '').replace(/"/g, '""')}","${session.expiresAt.toISOString()}","${session.lastActivityAt.toISOString()}","${isActive ? 'Hoạt động' : 'Hết hạn'}"\n`;
        });

        filename = `session-logs-${new Date().toISOString().split('T')[0]}.csv`;
        break;
      }

      case 'system': {
        // System logs export is not supported (file-based)
        return res.status(400).json({ error: 'Không thể xuất nhật ký hệ thống. Vui lòng truy cập trực tiếp file log.' });
      }

      default:
        return res.status(400).json({ error: 'Loại log không hợp lệ' });
    }

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\ufeff' + csvData); // BOM for Excel UTF-8 support
  } catch (error) {
    logger.error('Error exporting logs:', error);
    res.status(500).json({ error: 'Không thể xuất nhật ký' });
  }
};

