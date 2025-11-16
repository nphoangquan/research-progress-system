import { cleanupExpiredSessions } from './session.service';
import { cleanupOldAttempts } from './loginAttempt.service';
import logger from '../utils/logger';

/**
 * Run all cleanup tasks
 * Should be called periodically (e.g., via cron job or scheduled task)
 */
export async function runCleanupTasks(): Promise<void> {
  try {
    logger.info('Starting cleanup tasks...');
    
    const [sessionsDeleted, attemptsDeleted] = await Promise.all([
      cleanupExpiredSessions(),
      cleanupOldAttempts(),
    ]);
    
    logger.info(`Cleanup completed: ${sessionsDeleted} expired sessions, ${attemptsDeleted} old login attempts deleted`);
  } catch (error) {
    logger.error('Error running cleanup tasks:', error);
  }
}

/**
 * Setup periodic cleanup (runs every hour)
 * Call this in your server startup
 */
export function setupPeriodicCleanup(): NodeJS.Timeout {
  // Run cleanup every hour (sessions, login attempts)
  const cleanupInterval = setInterval(async () => {
    await runCleanupTasks();
  }, 60 * 60 * 1000); // 1 hour

  // Run immediately on startup
  runCleanupTasks().catch(err => {
    logger.error('Error running initial cleanup:', err);
  });

  return cleanupInterval;
}

