import { PrismaClient } from '@prisma/client';
import { getSecuritySettings } from '../utils/systemSettings';
import logger from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Check if account is locked out
 */
export async function isAccountLocked(email: string): Promise<{ locked: boolean; lockoutUntil?: Date }> {
  try {
    const securitySettings = await getSecuritySettings();
    
    // Edge case: if maxLoginAttempts is 0 or lockoutDuration is 0, no lockout
    if (securitySettings.maxLoginAttempts <= 0 || securitySettings.lockoutDuration <= 0) {
      return { locked: false };
    }
    
    // Get recent failed attempts
    const recentAttempts = await prisma.loginAttempt.findMany({
      where: {
        email: email.toLowerCase(),
        success: false,
        failedAt: {
          gte: new Date(Date.now() - securitySettings.lockoutDuration * 60 * 1000),
        },
      },
      orderBy: { failedAt: 'desc' },
    });

    // Check if lockout threshold reached
    if (recentAttempts.length >= securitySettings.maxLoginAttempts) {
      const oldestFailedAttempt = recentAttempts[recentAttempts.length - 1];
      const lockoutUntil = new Date(
        oldestFailedAttempt.failedAt.getTime() + securitySettings.lockoutDuration * 60 * 1000
      );

      // Check if still locked out
      if (lockoutUntil > new Date()) {
        return { locked: true, lockoutUntil };
      }
    }

    return { locked: false };
  } catch (error) {
    logger.error('Error checking account lockout:', error);
    return { locked: false };
  }
}

/**
 * Record a failed login attempt
 */
export async function recordFailedAttempt(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        success: false,
      },
    });
  } catch (error) {
    logger.error('Error recording failed login attempt:', error);
    // Don't throw - logging failure shouldn't break login
  }
}

/**
 * Record a successful login attempt
 */
export async function recordSuccessfulAttempt(
  email: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    await prisma.loginAttempt.create({
      data: {
        email: email.toLowerCase(),
        ipAddress,
        userAgent,
        success: true,
      },
    });
  } catch (error) {
    logger.error('Error recording successful login attempt:', error);
    // Don't throw - logging failure shouldn't break login
  }
}

/**
 * Clean up old login attempts (should be called periodically)
 * Cleans up both successful and failed attempts older than 30 days
 */
export async function cleanupOldAttempts(): Promise<number> {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    // Delete attempts older than 30 days (both successful and failed)
    const result = await prisma.loginAttempt.deleteMany({
      where: {
        failedAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    logger.info(`Cleaned up ${result.count} old login attempts`);
    return result.count;
  } catch (error) {
    logger.error('Error cleaning up old login attempts:', error);
    return 0;
  }
}

