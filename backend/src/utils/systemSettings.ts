import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient();

// Cache for system settings to avoid querying DB on every request
interface SettingsCache {
  [key: string]: {
    value: any;
    timestamp: number;
  };
}

const cache: SettingsCache = {};
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Get a system setting value from database with caching
 */
async function getSetting(key: string, defaultValue: any = null): Promise<any> {
  // Check cache first
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key },
    });

    const value = setting ? setting.value : defaultValue;

    // Update cache
    cache[key] = {
      value,
      timestamp: Date.now(),
    };

    return value;
  } catch (error) {
    logger.error(`Error fetching system setting ${key}:`, error);
    return defaultValue;
  }
}

/**
 * Get all settings for a category
 * For email category, filters out sensitive SMTP credentials
 */
async function getCategorySettings(category: string): Promise<Record<string, any>> {
  try {
    const settings = await prisma.systemSetting.findMany({
      where: { category },
    });

    const result: Record<string, any> = {};
    const sensitiveEmailKeys = ['smtpHost', 'smtpPort', 'smtpSecure', 'smtpUsername', 'smtpPassword'];

    settings.forEach((setting) => {
      // Remove category prefix from key (e.g., "maintenance.enabled" -> "enabled")
      const key = setting.key.startsWith(`${category}.`)
        ? setting.key.replace(`${category}.`, '')
        : setting.key;

      // Filter out sensitive SMTP credentials for email category
      if (category === 'email' && sensitiveEmailKeys.includes(key)) {
        return; // Skip sensitive credentials
      }

      result[key] = setting.value;
    });

    return result;
  } catch (error) {
    logger.error(`Error fetching category settings ${category}:`, error);
    return {};
  }
}

/**
 * Invalidate cache for a specific key or all keys
 */
export function invalidateCache(key?: string): void {
  if (key) {
    delete cache[key];
  } else {
    Object.keys(cache).forEach((k) => delete cache[k]);
  }
}

/**
 * Get maintenance mode settings
 */
export async function getMaintenanceSettings(): Promise<{
  enabled: boolean;
  message: string;
  allowedIPs: string[];
  scheduledStart: string | null;
  scheduledEnd: string | null;
  duration: number | null;
}> {
  const defaults = {
    enabled: false,
    message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    allowedIPs: [],
    scheduledStart: null,
    scheduledEnd: null,
    duration: null,
  };

  const settings = await getCategorySettings('maintenance');

  return {
    enabled: settings.enabled ?? defaults.enabled,
    message: settings.message ?? defaults.message,
    allowedIPs: Array.isArray(settings.allowedIPs) ? settings.allowedIPs : defaults.allowedIPs,
    scheduledStart: settings.scheduledStart ?? defaults.scheduledStart,
    scheduledEnd: settings.scheduledEnd ?? defaults.scheduledEnd,
    duration: settings.duration ?? defaults.duration,
  };
}

/**
 * Get general settings
 */
export async function getGeneralSettings(): Promise<{
  systemName: string;
  systemDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
}> {
  const defaults = {
    systemName: 'Research Progress Management System',
    systemDescription: 'Hệ thống quản lý tiến độ nghiên cứu',
    logoUrl: null,
    faviconUrl: null,
  };

  const settings = await getCategorySettings('general');

  return {
    systemName: settings.systemName ?? defaults.systemName,
    systemDescription: settings.systemDescription ?? defaults.systemDescription,
    logoUrl: settings.logoUrl ?? defaults.logoUrl,
    faviconUrl: settings.faviconUrl ?? defaults.faviconUrl,
  };
}

/**
 * Get storage settings
 */
export async function getStorageSettings(): Promise<{
  maxFileSize: number;
  allowedFileTypes: string[];
  maxDocumentsPerProject: number;
  autoIndexing: boolean;
  maxAvatarSize: number;
  allowedAvatarTypes: string[];
}> {
  const defaults = {
    maxFileSize: 25 * 1024 * 1024, // 25MB
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
    maxAvatarSize: 5 * 1024 * 1024, // 5MB
    allowedAvatarTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  };

  const settings = await getCategorySettings('storage');

  return {
    maxFileSize: settings.maxFileSize ?? defaults.maxFileSize,
    allowedFileTypes: Array.isArray(settings.allowedFileTypes)
      ? settings.allowedFileTypes
      : defaults.allowedFileTypes,
    maxDocumentsPerProject: settings.maxDocumentsPerProject ?? defaults.maxDocumentsPerProject,
    autoIndexing: settings.autoIndexing ?? defaults.autoIndexing,
    maxAvatarSize: settings.maxAvatarSize ?? defaults.maxAvatarSize,
    allowedAvatarTypes: Array.isArray(settings.allowedAvatarTypes)
      ? settings.allowedAvatarTypes
      : defaults.allowedAvatarTypes,
  };
}

/**
 * Get email settings (non-sensitive only)
 * SMTP credentials are stored in environment variables, not database
 */
export async function getEmailSettings(): Promise<{
  fromEmail: string;
  fromName: string;
}> {
  const defaults = {
    fromEmail: '',
    fromName: 'Research Progress Management System',
  };

  const settings = await getCategorySettings('email');

  return {
    fromEmail: settings.fromEmail ?? defaults.fromEmail,
    fromName: settings.fromName ?? defaults.fromName,
  };
}

/**
 * Get security settings
 */
export async function getSecuritySettings(): Promise<{
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
}> {
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

  const settings = await getCategorySettings('security');

  return {
    passwordMinLength: settings.passwordMinLength ?? defaults.passwordMinLength,
    passwordRequireUppercase: settings.passwordRequireUppercase ?? defaults.passwordRequireUppercase,
    passwordRequireLowercase: settings.passwordRequireLowercase ?? defaults.passwordRequireLowercase,
    passwordRequireNumbers: settings.passwordRequireNumbers ?? defaults.passwordRequireNumbers,
    passwordRequireSpecialChars:
      settings.passwordRequireSpecialChars ?? defaults.passwordRequireSpecialChars,
    sessionTimeout: settings.sessionTimeout ?? defaults.sessionTimeout,
    maxConcurrentSessions: settings.maxConcurrentSessions ?? defaults.maxConcurrentSessions,
    maxLoginAttempts: settings.maxLoginAttempts ?? defaults.maxLoginAttempts,
    lockoutDuration: settings.lockoutDuration ?? defaults.lockoutDuration,
    requireEmailVerification:
      settings.requireEmailVerification ?? defaults.requireEmailVerification,
  };
}

