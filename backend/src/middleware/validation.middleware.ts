import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Validation middleware factory
 * Creates a middleware that validates request body against a Zod schema
 * Throws ZodError to be handled by global error handler for consistent format
 */
export const validate = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      // Throw ZodError to be handled by global error handler
      // This ensures consistent error format across the application
      if (error instanceof z.ZodError) {
        // Re-throw to let errorHandler.middleware.ts handle it
        return next(error);
      }

      // For non-Zod errors, pass to error handler
      return next(error);
    }
  };
};

/**
 * Validation schemas for authentication
 */
export const authSchemas = {
  register: z.object({
    email: z.string().email('Địa chỉ email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên quá dài'),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT']).optional(),
    studentId: z.string().optional(),
  }),

  login: z.object({
    email: z.string().email('Địa chỉ email không hợp lệ'),
    password: z.string().min(1, 'Mật khẩu là bắt buộc'),
  }),

  updateProfile: z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên quá dài').optional(),
    avatarUrl: z.string().url('URL avatar không hợp lệ').optional().or(z.literal('')),
    studentId: z.string().optional().or(z.literal('')),
  }),

  forgotPassword: z.object({
    email: z.string().email('Địa chỉ email không hợp lệ'),
  }),

  resetPassword: z.object({
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  }),
};

/**
 * Validation schemas for projects
 */
export const projectSchemas = {
  create: z.object({
    title: z.string().min(1, 'Tiêu đề dự án là bắt buộc').max(200, 'Tiêu đề dự án không được vượt quá 200 ký tự'),
    description: z.string().min(1, 'Mô tả dự án là bắt buộc').max(5000, 'Mô tả dự án không được vượt quá 5000 ký tự'),
    studentIds: z.array(z.string().uuid('ID sinh viên không hợp lệ')).min(1, 'Vui lòng chọn ít nhất một sinh viên'),
    lecturerId: z.string().uuid('ID giảng viên không hợp lệ'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày bắt đầu phải có định dạng YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải có định dạng YYYY-MM-DD').optional().or(z.literal('')),
  }),

  update: z.object({
    title: z.string().min(1, 'Tiêu đề dự án là bắt buộc').max(200, 'Tiêu đề dự án không được vượt quá 200 ký tự').optional(),
    description: z.string().max(5000, 'Mô tả dự án không được vượt quá 5000 ký tự').optional(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
    progress: z.number().min(0, 'Tiến độ phải từ 0 đến 100').max(100, 'Tiến độ phải từ 0 đến 100').optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày kết thúc phải có định dạng YYYY-MM-DD').optional().or(z.literal('')),
  }),
};

/**
 * Validation schemas for tasks
 */
export const taskSchemas = {
  create: z.object({
    projectId: z.string().uuid('ID dự án không hợp lệ'),
    title: z.string().min(1, 'Tiêu đề nhiệm vụ là bắt buộc').max(200, 'Tiêu đề nhiệm vụ không được vượt quá 200 ký tự'),
    description: z.string().max(2000, 'Mô tả nhiệm vụ không được vượt quá 2000 ký tự').optional(),
    assigneeId: z.string().uuid('ID người được giao không hợp lệ').optional().nullable(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn phải có định dạng YYYY-MM-DD').optional().or(z.literal('')),
  }),

  update: z.object({
    title: z.string().min(1, 'Tiêu đề nhiệm vụ là bắt buộc').max(200, 'Tiêu đề nhiệm vụ không được vượt quá 200 ký tự').optional(),
    description: z.string().max(2000, 'Mô tả nhiệm vụ không được vượt quá 2000 ký tự').optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày hết hạn phải có định dạng YYYY-MM-DD').optional().nullable().or(z.literal('')),
    assigneeId: z.string().uuid('ID người được giao không hợp lệ').optional().nullable(),
  }),

  submit: z.object({
    taskId: z.string().uuid('ID nhiệm vụ không hợp lệ'),
    content: z.string().min(1, 'Nội dung nộp bài là bắt buộc').max(10000, 'Nội dung nộp bài không được vượt quá 10000 ký tự'),
  }),
};

/**
 * Validation schemas for documents
 */
export const documentSchemas = {
  update: z.object({
    description: z.string().max(5000, 'Mô tả tài liệu không được vượt quá 5000 ký tự').optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    category: z.enum(['PROJECT', 'REFERENCE', 'TEMPLATE', 'GUIDELINE', 'SYSTEM']).optional(),
  }),
};

/**
 * Validation schemas for comments
 */
export const commentSchemas = {
  create: z.object({
    content: z.string().min(1, 'Nội dung bình luận là bắt buộc').max(2000, 'Nội dung bình luận không được vượt quá 2000 ký tự'),
  }),

  update: z.object({
    content: z.string().min(1, 'Nội dung bình luận là bắt buộc').max(2000, 'Nội dung bình luận không được vượt quá 2000 ký tự'),
  }),
};

/**
 * Validation schemas for users
 */
export const userSchemas = {
  update: z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên quá dài').optional(),
    email: z.string().email('Địa chỉ email không hợp lệ').optional(),
    studentId: z.string().optional().or(z.literal('')),
  }),

  changePassword: z.object({
    currentPassword: z.string().min(1, 'Mật khẩu hiện tại là bắt buộc'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  }),

  updatePreferences: z.object({
    timezone: z.string().optional(),
    language: z.string().optional(),
    theme: z.enum(['light', 'dark', 'auto']).optional(),
  }),
};

/**
 * Validation schemas for admin operations
 */
export const adminSchemas = {
  createUser: z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên quá dài'),
    email: z.string().email('Địa chỉ email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT'], {
      message: 'Vai trò phải là ADMIN, LECTURER hoặc STUDENT',
    }),
    studentId: z.string().optional().or(z.literal('')),
    requireEmailVerification: z.boolean().optional(),
  }),

  updateUser: z.object({
    fullName: z.string().min(2, 'Họ tên phải có ít nhất 2 ký tự').max(100, 'Họ tên quá dài').optional(),
    email: z.string().email('Địa chỉ email không hợp lệ').optional(),
    role: z.enum(['ADMIN', 'LECTURER', 'STUDENT'], {
      message: 'Vai trò phải là ADMIN, LECTURER hoặc STUDENT',
    }).optional(),
    studentId: z.string().optional().or(z.literal('')),
  }),

  activateUser: z.object({
    isActive: z.boolean({
      message: 'isActive phải là true hoặc false',
    }),
  }),

  resetPassword: z.object({
    newPassword: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự').optional(),
    generatePassword: z.boolean().optional(),
    sendEmail: z.boolean().optional(),
  }).refine(
    (data) => data.newPassword || data.generatePassword,
    {
      message: 'Phải cung cấp newPassword hoặc set generatePassword = true',
    }
  ),
};

/**
 * Validation schemas for system settings
 */
export const systemSettingsSchemas = {
  general: z.object({
    systemName: z.string().min(1, 'Tên hệ thống là bắt buộc').max(200, 'Tên hệ thống quá dài').optional(),
    systemDescription: z.string().max(1000, 'Mô tả hệ thống quá dài').optional(),
    logoUrl: z.union([z.string().url('URL logo không hợp lệ'), z.literal(''), z.null()]).optional(),
    faviconUrl: z.union([z.string().url('URL favicon không hợp lệ'), z.literal(''), z.null()]).optional(),
    defaultLanguage: z.string().min(2, 'Ngôn ngữ mặc định là bắt buộc').max(10).optional(),
  }),

  email: z.object({
    fromEmail: z.string().email('Địa chỉ email không hợp lệ').optional().or(z.literal('')),
    fromName: z.string().max(200, 'Tên người gửi quá dài').optional(),
    welcomeEmailTemplate: z.string().optional().nullable(),
    passwordResetEmailTemplate: z.string().optional().nullable(),
    verificationEmailTemplate: z.string().optional().nullable(),
  }),

  storage: z.object({
    maxFileSize: z.number().int().min(1024, 'Kích thước file tối thiểu là 1KB').optional(),
    allowedFileTypes: z.array(z.string()).optional(),
    maxDocumentsPerProject: z.number().int().min(1, 'Số lượng tài liệu tối thiểu là 1').max(1000, 'Số lượng tài liệu tối đa là 1000').optional(),
    autoIndexing: z.boolean().optional(),
    maxAvatarSize: z.number().int().min(1024, 'Kích thước avatar tối thiểu là 1KB').optional(),
    allowedAvatarTypes: z.array(z.string()).optional(),
  }),

  security: z.object({
    passwordMinLength: z.number().int().min(6, 'Độ dài mật khẩu tối thiểu là 6').max(128, 'Độ dài mật khẩu tối đa là 128').optional(),
    passwordRequireUppercase: z.boolean().optional(),
    passwordRequireLowercase: z.boolean().optional(),
    passwordRequireNumbers: z.boolean().optional(),
    passwordRequireSpecialChars: z.boolean().optional(),
    sessionTimeout: z.number().int().min(1, 'Thời gian session tối thiểu là 1 phút').optional(),
    maxConcurrentSessions: z.number().int().min(1, 'Số session đồng thời tối thiểu là 1').max(10, 'Số session đồng thời tối đa là 10').optional(),
    maxLoginAttempts: z.number().int().min(1, 'Số lần đăng nhập tối thiểu là 1').max(20, 'Số lần đăng nhập tối đa là 20').optional(),
    lockoutDuration: z.number().int().min(1, 'Thời gian khóa tài khoản tối thiểu là 1 phút').optional(),
    requireEmailVerification: z.boolean().optional(),
  }),

  maintenance: z.object({
    enabled: z.boolean().optional(),
    message: z.string().max(2000, 'Thông báo bảo trì quá dài').optional(),
    allowedIPs: z
      .array(
        z
          .string()
          .regex(
            /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/,
            'Địa chỉ IP không hợp lệ'
          )
      )
      .optional(),
    scheduledStart: z.string().datetime('Thời gian bắt đầu không hợp lệ').optional().nullable(),
    scheduledEnd: z.string().datetime('Thời gian kết thúc không hợp lệ').optional().nullable(),
    // Allow null or empty for indefinite maintenance, or min 1 minute if provided
    duration: z.union([
      z.number().int().min(1, 'Thời gian bảo trì tối thiểu là 1 phút'),
      z.null(),
    ]).optional().nullable(),
  }),

  testEmail: z.object({
    testEmail: z.string().email('Địa chỉ email test không hợp lệ'),
  }),
};

