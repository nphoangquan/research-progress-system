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
    description: z.string().max(5000, 'Mô tả dự án không được vượt quá 5000 ký tự').optional(),
    studentId: z.string().uuid('ID sinh viên không hợp lệ').optional(),
    lecturerId: z.string().uuid('ID giảng viên không hợp lệ').optional(),
    startDate: z.string().datetime('Ngày bắt đầu không hợp lệ').optional().or(z.literal('')),
    endDate: z.string().datetime('Ngày kết thúc không hợp lệ').optional().or(z.literal('')),
  }),

  update: z.object({
    title: z.string().min(1, 'Tiêu đề dự án là bắt buộc').max(200, 'Tiêu đề dự án không được vượt quá 200 ký tự').optional(),
    description: z.string().max(5000, 'Mô tả dự án không được vượt quá 5000 ký tự').optional(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'ARCHIVED']).optional(),
    progress: z.number().min(0, 'Tiến độ phải từ 0 đến 100').max(100, 'Tiến độ phải từ 0 đến 100').optional(),
    endDate: z.string().datetime('Ngày kết thúc không hợp lệ').optional().or(z.literal('')),
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
    assigneeId: z.string().uuid('ID người được giao không hợp lệ').optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().datetime('Ngày hết hạn không hợp lệ').optional().or(z.literal('')),
  }),

  update: z.object({
    title: z.string().min(1, 'Tiêu đề nhiệm vụ là bắt buộc').max(200, 'Tiêu đề nhiệm vụ không được vượt quá 200 ký tự').optional(),
    description: z.string().max(2000, 'Mô tả nhiệm vụ không được vượt quá 2000 ký tự').optional().nullable(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
    dueDate: z.string().datetime('Ngày hết hạn không hợp lệ').optional().nullable().or(z.literal('')),
    assigneeId: z.string().uuid('ID người được giao không hợp lệ').optional(),
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
    sendWelcomeEmail: z.boolean().optional(),
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

