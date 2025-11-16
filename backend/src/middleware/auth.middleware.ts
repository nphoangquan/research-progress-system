import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { verifySession } from '../services/session.service';

const prisma = new PrismaClient();

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        email: string;
      };
    }
  }
}

export interface JWTPayload {
  userId: string;
  role: string;
  email: string;
}

/**
 * Middleware to verify JWT token and check if user is active
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const token = authHeader.split(' ')[1]; // Bearer <token>
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token format.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify session (checks timeout, max concurrent sessions, etc.)
    const sessionCheck = await verifySession(token);
    if (!sessionCheck.valid) {
      logger.warn('Invalid or expired session:', { userId: decoded.userId, path: req.path });
      return res.status(401).json({
        error: {
          code: 'SESSION_EXPIRED',
          message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        },
      });
    }
    
    // Check if user is still active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      logger.warn('Inactive user attempted to access:', { userId: decoded.userId, path: req.path });
      return res.status(403).json({
        error: {
          code: 'ACCOUNT_DEACTIVATED',
          message: 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.',
        },
      });
    }
    
    // Attach user info to request
    req.user = {
      userId: decoded.userId,
      role: decoded.role,
      email: decoded.email
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      logger.warn('Token expired:', { path: req.path });
      return res.status(401).json({ 
        error: 'Token expired. Please login again.' 
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      logger.warn('Invalid token:', { path: req.path, error: error.message });
      return res.status(401).json({ 
        error: 'Invalid token.' 
      });
    }
    
    logger.error('Token verification failed:', { error, path: req.path });
    return res.status(500).json({ 
      error: 'Token verification failed.' 
    });
  }
};

/**
 * Middleware to check if user has required role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Access denied. Please login first.' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${roles.join(' or ')}` 
      });
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(['ADMIN']);

/**
 * Middleware to check if user is lecturer or admin
 */
export const requireLecturer = requireRole(['LECTURER', 'ADMIN']);

/**
 * Middleware to check if user is student, lecturer, or admin
 */
export const requireUser = requireRole(['STUDENT', 'LECTURER', 'ADMIN']);
