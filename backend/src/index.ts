import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { apiLimiter } from './middleware/rateLimit.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import logger from './utils/logger';
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import documentRoutes from './routes/document.routes';
import userRoutes from './routes/user.routes';
import commentRoutes from './routes/comment.routes';
import analyticsRoutes from './routes/analytics.routes';
import searchRoutes from './routes/search.routes';
import filterRoutes from './routes/filter.routes';
import taskAttachmentRoutes from './routes/taskAttachment.routes';
import labelRoutes from './routes/label.routes';
import adminRoutes from './routes/admin.routes';
import WebSocketService from './services/websocket.service';
import { checkMaintenanceMode } from './middleware/maintenance.middleware';

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['JWT_SECRET', 'DATABASE_URL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error(`ERROR: Thiếu các biến môi trường bắt buộc: ${missingEnvVars.join(', ')}`);
  logger.error('Vui lòng đặt các biến này trong file .env trước khi khởi động server.');
  logger.error('Xem file .env.example để biết cấu hình mẫu.');
  process.exit(1);
}

// Validate JWT_SECRET strength in production
if (process.env.NODE_ENV === 'production' && process.env.JWT_SECRET) {
  if (process.env.JWT_SECRET.length < 32) {
    logger.warn('WARNING: JWT_SECRET quá ngắn. Nên sử dụng ít nhất 32 ký tự trong môi trường production.');
  }
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
    logger.error('ERROR: JWT_SECRET vẫn là giá trị mặc định. Vui lòng thay đổi trong môi trường production!');
    process.exit(1);
  }
}

// Log configuration status
logger.info('Cấu hình môi trường:');
logger.info(`   - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
logger.info(`   - PORT: ${process.env.PORT || 3000}`);
logger.info(`   - FRONTEND_URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
logger.info(`   - Email Service: ${process.env.SMTP_USER && process.env.SMTP_PASS ? 'OK - Đã cấu hình' : 'MISSING - Chưa cấu hình'}`);
logger.info(`   - Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'OK - Đã cấu hình' : 'MISSING - Chưa cấu hình (sử dụng local storage)'}`);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3000;

// Initialize WebSocket service
const wsService = new WebSocketService(server);

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
}));

// Security headers (basic)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Check maintenance mode (before rate limiting)
app.use(checkMaintenanceMode);

// Apply general API rate limiting (except auth routes - they have their own limiters)
app.use('/api', (req, res, next) => {
  // Skip rate limiting for auth routes (they have specific limiters)
  if (req.path.startsWith('/auth')) {
    return next();
  }
  apiLimiter(req, res, next);
});

// Health check endpoint (no rate limiting)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    message: 'Research Progress System API is running'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/users', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/filters', filterRoutes);
app.use('/api/task-attachments', taskAttachmentRoutes);
app.use('/api/labels', labelRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler (must be before error handler)
app.use((req, res) => {
  res.status(404).json({ 
    error: {
      code: 'NOT_FOUND',
      message: 'Route not found'
    }
  });
});

// Global error handler (must be last, after all routes)
app.use(errorHandler);

// Start server
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
  logger.info(`WebSocket server initialized`);
});

// Export WebSocket service for use in controllers
export { wsService };
export default app;
