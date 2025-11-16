import { PrismaClient } from '@prisma/client';
import { getSecuritySettings } from '../utils/systemSettings';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface CreateSessionParams {
  userId: string;
  token: string;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Create a new session
 */
export async function createSession(params: CreateSessionParams): Promise<void> {
  try {
    const securitySettings = await getSecuritySettings();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + securitySettings.sessionTimeout);

    // Check max concurrent sessions and create new session in transaction to prevent race condition
    await prisma.$transaction(async (tx) => {
      const now = new Date();
      const timeoutMs = Math.max(1, securitySettings.sessionTimeout) * 60 * 1000;
      const inactivityThreshold = new Date(now.getTime() - timeoutMs);

      // Get active sessions (not expired by time or inactivity)
      const sessions = await tx.session.findMany({
        where: {
          userId: params.userId,
          expiresAt: { gt: now },
          lastActivityAt: { gte: inactivityThreshold },
        },
        orderBy: { lastActivityAt: 'desc' },
      });

      // If exceeds max concurrent sessions, delete oldest sessions
      if (sessions.length >= securitySettings.maxConcurrentSessions) {
        const sessionsToDelete = sessions.slice(securitySettings.maxConcurrentSessions - 1);
        const sessionIds = sessionsToDelete.map(s => s.id);
        
        await tx.session.deleteMany({
          where: { id: { in: sessionIds } },
        });
        
        logger.info(`Deleted ${sessionsToDelete.length} old sessions for user ${params.userId} due to max concurrent sessions limit`);
      }

      // Create new session within the same transaction
      await tx.session.create({
        data: {
          userId: params.userId,
          token: params.token,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          expiresAt,
        },
      });
    });
  } catch (error) {
    logger.error('Error creating session:', error);
    throw error;
  }
}

/**
 * Verify session and update last activity
 */
export async function verifySession(token: string): Promise<{ valid: boolean; userId?: string }> {
  try {
    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: { select: { isActive: true } } },
    });

    if (!session) {
      return { valid: false };
    }

    // Check if session expired
    if (session.expiresAt < new Date()) {
      // Delete expired session
      await prisma.session.delete({ where: { id: session.id } });
      return { valid: false };
    }

    // Check if user is still active
    if (!session.user.isActive) {
      // Delete session for inactive user
      await prisma.session.delete({ where: { id: session.id } });
      return { valid: false };
    }

    // Check session timeout based on last activity before updating
    const securitySettings = await getSecuritySettings();
    const lastActivity = session.lastActivityAt;
    const timeoutMs = Math.max(1, securitySettings.sessionTimeout) * 60 * 1000; // Ensure positive
    const now = new Date();
    
    // Check both expiresAt (absolute) and lastActivityAt (inactivity timeout)
    if (now.getTime() - lastActivity.getTime() > timeoutMs) {
      // Session timed out based on inactivity
      await prisma.session.delete({ where: { id: session.id } });
      return { valid: false };
    }

    // Update last activity
    await prisma.session.update({
      where: { id: session.id },
      data: { lastActivityAt: new Date() },
    });

    return { valid: true, userId: session.userId };
  } catch (error) {
    logger.error('Error verifying session:', error);
    return { valid: false };
  }
}

/**
 * Delete session by token
 */
export async function deleteSession(token: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { token },
    });
  } catch (error) {
    logger.error('Error deleting session:', error);
    // Don't throw - session deletion failure shouldn't break logout
  }
}

/**
 * Delete all sessions for a user
 */
export async function deleteUserSessions(userId: string): Promise<void> {
  try {
    await prisma.session.deleteMany({
      where: { userId },
    });
  } catch (error) {
    logger.error('Error deleting user sessions:', error);
    // Don't throw - session deletion failure shouldn't break the operation
  }
}

/**
 * Clean up expired sessions (should be called periodically)
 * Cleans up both:
 * - Sessions expired by absolute time (expiresAt)
 * - Sessions expired by inactivity (lastActivityAt + timeout)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const now = new Date();
    const securitySettings = await getSecuritySettings();
    const timeoutMs = Math.max(1, securitySettings.sessionTimeout) * 60 * 1000;
    const inactivityThreshold = new Date(now.getTime() - timeoutMs);

    // Delete sessions expired by absolute time OR by inactivity
    const result = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { lastActivityAt: { lt: inactivityThreshold } },
        ],
      },
    });
    
    logger.info(`Cleaned up ${result.count} expired sessions`);
    return result.count;
  } catch (error) {
    logger.error('Error cleaning up expired sessions:', error);
    return 0;
  }
}

