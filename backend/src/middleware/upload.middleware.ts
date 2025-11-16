import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getStorageSettings } from '../utils/systemSettings';

// Ensure uploads directory exists
const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

/**
 * Create file filter function with dynamic allowed types from DB
 */
const createFileFilter = (allowedTypes: string[]) => {
  return (req: any, file: Express.Multer.File, cb: any) => {
    // Check file type
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      const allowedTypesList = allowedTypes
        .map(type => {
          if (type.startsWith('image/')) return 'ảnh';
          if (type.includes('pdf')) return 'PDF';
          if (type.includes('word') || type.includes('msword')) return 'DOC/DOCX';
          if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
          if (type.includes('powerpoint') || type.includes('presentation')) return 'PPT/PPTX';
          if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'tệp nén';
          if (type.includes('text/plain')) return 'TXT';
          return null;
        })
        .filter(Boolean)
        .join(', ');
      
      cb(new Error(`Loại tệp không được phép. Chỉ cho phép: ${allowedTypesList || 'các loại tệp đã cấu hình'}`), false);
    }
  };
};

/**
 * Create multer instance with dynamic settings from DB
 */
const createMulterInstance = (maxFileSize: number, allowedTypes: string[], maxFiles: number = 1) => {
  const fileFilter = createFileFilter(allowedTypes);
  
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: maxFileSize,
      files: maxFiles
    }
  });
};

/**
 * Get multer instance for regular file uploads (documents, task attachments)
 * Uses dynamic settings from database
 */
export const getUploadMiddleware = async () => {
  const settings = await getStorageSettings();
  return createMulterInstance(settings.maxFileSize, settings.allowedFileTypes, 1);
};

/**
 * Get multer instance for multiple file uploads
 * Uses dynamic settings from database
 */
export const getUploadMultipleMiddleware = async (maxFiles: number = 10) => {
  const settings = await getStorageSettings();
  return createMulterInstance(settings.maxFileSize, settings.allowedFileTypes, maxFiles);
};

/**
 * Get multer instance for avatar uploads
 * Uses dynamic avatar settings from database
 */
export const getUploadAvatarMiddleware = async () => {
  const settings = await getStorageSettings();
  return createMulterInstance(settings.maxAvatarSize, settings.allowedAvatarTypes, 1);
};

/**
 * Cache for multer instances to avoid recreating on every request
 * Cache is invalidated when storage settings are updated
 */
let cachedUpload: multer.Multer | null = null;
let cachedUploadMultiple: multer.Multer | null = null;
let cachedUploadMultipleMaxFiles: number | undefined = undefined;
let cachedUploadAvatar: multer.Multer | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Invalidate upload middleware cache
 * Should be called when storage settings are updated
 */
export function invalidateUploadCache(): void {
  cachedUpload = null;
  cachedUploadMultiple = null;
  cachedUploadMultipleMaxFiles = undefined;
  cachedUploadAvatar = null;
  cacheTimestamp = 0;
}

/**
 * Get or create cached upload middleware
 */
const getCachedUpload = async () => {
  const now = Date.now();
  if (!cachedUpload || (now - cacheTimestamp) > CACHE_TTL) {
    cachedUpload = await getUploadMiddleware();
    cacheTimestamp = now;
  }
  return cachedUpload;
};

/**
 * Get or create cached upload multiple middleware
 */
const getCachedUploadMultiple = async (maxFiles?: number) => {
  const now = Date.now();
  // If maxFiles is different from cached, or cache expired, recreate
  if (!cachedUploadMultiple || 
      cachedUploadMultipleMaxFiles !== maxFiles || 
      (now - cacheTimestamp) > CACHE_TTL) {
    cachedUploadMultiple = await getUploadMultipleMiddleware(maxFiles);
    cachedUploadMultipleMaxFiles = maxFiles;
    cacheTimestamp = now;
  }
  return cachedUploadMultiple;
};

/**
 * Get or create cached upload avatar middleware
 */
const getCachedUploadAvatar = async () => {
  const now = Date.now();
  if (!cachedUploadAvatar || (now - cacheTimestamp) > CACHE_TTL) {
    cachedUploadAvatar = await getUploadAvatarMiddleware();
    cacheTimestamp = now;
  }
  return cachedUploadAvatar;
};

/**
 * Wrapper middleware that loads settings and applies them
 */
export const upload = {
  single: (fieldName: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUpload();
        multerInstance.single(fieldName)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  array: (fieldName: string, maxCount?: number) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUploadMultiple(maxCount);
        multerInstance.array(fieldName, maxCount)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  fields: (fields: multer.Field[]) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUpload();
        multerInstance.fields(fields)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  any: () => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUpload();
        multerInstance.any()(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  none: () => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUpload();
        multerInstance.none()(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
};

export const uploadMultiple = {
  single: (fieldName: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUploadMultiple();
        multerInstance.single(fieldName)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
  array: (fieldName: string, maxCount?: number) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUploadMultiple(maxCount);
        multerInstance.array(fieldName, maxCount)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
};

export const uploadAvatar = {
  single: (fieldName: string) => {
    return async (req: any, res: any, next: any) => {
      try {
        const multerInstance = await getCachedUploadAvatar();
        multerInstance.single(fieldName)(req, res, next);
      } catch (error) {
        next(error);
      }
    };
  },
};

/**
 * Error handling middleware for multer
 * Uses dynamic settings from database for error messages
 * Detects avatar uploads vs regular file uploads based on route path
 */
export const handleUploadError = async (error: any, req: any, res: any, next: any) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      try {
        const settings = await getStorageSettings();
        // Check if this is an avatar upload (route contains /avatar)
        const isAvatarUpload = req.path?.includes('/avatar') || req.originalUrl?.includes('/avatar');
        const maxSize = isAvatarUpload ? settings.maxAvatarSize : settings.maxFileSize;
        const maxSizeMB = Math.round(maxSize / (1024 * 1024));
        const fileType = isAvatarUpload ? 'avatar' : 'tệp';
        
        return res.status(400).json({
          error: `${fileType === 'avatar' ? 'Ảnh đại diện' : 'Tệp'} quá lớn. Kích thước tối đa là ${maxSizeMB}MB.`
        });
      } catch (settingsError) {
        return res.status(400).json({
          error: 'Tệp quá lớn. Vui lòng kiểm tra giới hạn kích thước tệp.'
        });
      }
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Quá nhiều tệp. Vui lòng kiểm tra giới hạn số lượng tệp.'
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        error: 'Trường tệp không hợp lệ.'
      });
    }
  }

  // Handle custom file type errors
  if (error.message && error.message.includes('Loại tệp không được phép')) {
    return res.status(400).json({
      error: error.message
    });
  }

  next(error);
};

// Cleanup function to delete local file after upload
export const cleanupLocalFile = (filePath: string) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error cleaning up local file:', error);
  }
};
