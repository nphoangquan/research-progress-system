import { Request, Response, NextFunction } from 'express';
import { getMaintenanceSettings } from '../utils/systemSettings';
import logger from '../utils/logger';

/**
 * Middleware to check maintenance mode
 * Blocks all requests except:
 * - Admin users
 * - IPs in whitelist
 * - Health check endpoint
 */
export const checkMaintenanceMode = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Skip maintenance check for health endpoint
    if (req.path === '/health' || req.path === '/api/health') {
      return next();
    }

    // Get maintenance settings
    const maintenance = await getMaintenanceSettings();

    // If maintenance is not enabled, continue
    if (!maintenance.enabled) {
      return next();
    }

    // Check scheduled maintenance times
    const now = new Date();
    if (maintenance.scheduledStart) {
      const startTime = new Date(maintenance.scheduledStart);
      if (now < startTime) {
        // Maintenance hasn't started yet
        return next();
      }
    }

    if (maintenance.scheduledEnd) {
      const endTime = new Date(maintenance.scheduledEnd);
      if (now > endTime) {
        // Maintenance has ended
        return next();
      }
    }

    /**
     * Check if user is admin
     * This middleware runs before verifyToken, so req.user may be undefined
     * We check it anyway - if user is authenticated and is admin, allow access
     */
    const userRole = req.user?.role;
    if (userRole === 'ADMIN') {
      logger.info('Admin user bypassing maintenance mode', {
        userId: req.user?.userId,
        path: req.path,
      });
      return next();
    }

    // Check IP whitelist
    // Extract client IP (handle proxy headers)
    let clientIP = req.ip || req.socket.remoteAddress || '';
    
    // Check x-forwarded-for header (first IP is the original client)
    const forwardedFor = req.headers['x-forwarded-for'];
    if (forwardedFor) {
      const ips = Array.isArray(forwardedFor) 
        ? forwardedFor[0] 
        : forwardedFor.toString();
      clientIP = ips.split(',')[0].trim();
    }

    if (maintenance.allowedIPs && maintenance.allowedIPs.length > 0 && clientIP) {
      // Check if client IP is in whitelist
      const isWhitelisted = maintenance.allowedIPs.some((allowedIP) => {
        if (!allowedIP) return false;
        
        // Support both exact match and CIDR notation (basic)
        if (allowedIP === clientIP) {
          return true;
        }
        
        // Basic CIDR check (for /24 networks only)
        if (allowedIP.includes('/')) {
          const [network, prefix] = allowedIP.split('/');
          const prefixLength = parseInt(prefix);
          
          // Only support /24 for now (can be extended later)
          if (prefixLength === 24 && network && clientIP) {
            const networkParts = network.split('.');
            const clientParts = clientIP.split('.');
            
            // Validate IPv4 format
            if (networkParts.length === 4 && clientParts.length === 4) {
              return (
                networkParts[0] === clientParts[0] &&
                networkParts[1] === clientParts[1] &&
                networkParts[2] === clientParts[2]
              );
            }
          }
        }
        return false;
      });

      if (isWhitelisted) {
        logger.info('Whitelisted IP bypassing maintenance mode', {
          ip: clientIP,
          path: req.path,
        });
        return next();
      }
    }

    // Block the request
    logger.warn('Request blocked by maintenance mode', {
      ip: clientIP,
      path: req.path,
      method: req.method,
      userRole,
    });

    res.status(503).json({
      error: 'Hệ thống đang bảo trì',
      message: maintenance.message || 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
      maintenance: true,
    });
  } catch (error) {
    logger.error('Error checking maintenance mode:', error);
    // On error, allow request to continue (fail open)
    // This prevents maintenance mode from breaking the system if there's a DB error
    next();
  }
};

