import { Request, Response, NextFunction } from 'express';
import { getMaintenanceSettings } from '../utils/systemSettings';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

/**
 * Middleware to check maintenance mode
 * Blocks requests when enabled, except admin users and whitelisted IPs
 */
export const checkMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip maintenance check for these endpoints
    const bypassPaths = ['/health', '/api/health', '/api/settings/storage', '/api/settings/general', '/api/settings/maintenance-status'];
    if (bypassPaths.includes(req.path)) {
      return next();
    }
    
    if ((req.path === '/api/auth/login' || req.path === '/api/auth/register') && req.method === 'POST') {
      return next();
    }

    const maintenance = await getMaintenanceSettings();
    if (!maintenance.enabled) {
      return next();
    }

    // Check if user is admin (decode JWT manually since verifyToken runs after this)
    let userRole: string | undefined = req.user?.role;
    if (!userRole) {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const token = authHeader.split(' ')[1];
          if (token) {
            const decoded = jwt.decode(token) as { role?: string } | null;
            if (decoded?.role) {
              userRole = decoded.role;
            }
          }
        }
      } catch (error) {
        // Ignore decode errors
      }
    }
    
    if (userRole === 'ADMIN') {
      logger.info('Admin user bypassing maintenance mode', { userId: req.user?.userId, path: req.path });
      return next();
    }

    // Check IP whitelist
    let clientIP = req.ip || req.socket.remoteAddress || '';
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.toString();
      clientIP = ips.split(',')[0].trim();
    }

    if (maintenance.allowedIPs?.length > 0 && clientIP) {
      const isWhitelisted = maintenance.allowedIPs.some((allowedIP) => {
        if (!allowedIP) return false;
        if (allowedIP === clientIP) return true;
        
        // Basic CIDR support (/24 only)
        if (allowedIP.includes('/')) {
          const [network, prefix] = allowedIP.split('/');
          if (parseInt(prefix) === 24 && network && clientIP) {
            const networkParts = network.split('.');
            const clientParts = clientIP.split('.');
            if (networkParts.length === 4 && clientParts.length === 4) {
              return networkParts[0] === clientParts[0] &&
                     networkParts[1] === clientParts[1] &&
                     networkParts[2] === clientParts[2];
            }
          }
        }
        return false;
      });

      if (isWhitelisted) {
        logger.info('Whitelisted IP bypassing maintenance mode', { ip: clientIP, path: req.path });
        return next();
      }
    }

    logger.warn('Request blocked by maintenance mode', { ip: clientIP, path: req.path, method: req.method, userRole });
    res.status(503).json({
      error: 'Hệ thống đang bảo trì',
      message: maintenance.message || 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
      maintenance: true,
    });
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    next(); // Fail open to prevent breaking the system
  }
};

