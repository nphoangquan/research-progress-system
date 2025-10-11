import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRole?: string;
}

export class WebSocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        // Verify user exists in database
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, role: true, fullName: true }
        });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.id;
        socket.userRole = user.role;
        
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`🔌 User ${socket.userId} connected (${socket.id})`);
      
      // Track connected user
      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);
        
        // Join user to their personal room
        socket.join(`user:${socket.userId}`);
        
        // Join user to project rooms based on their role
        this.joinProjectRooms(socket);
      }

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.userId} disconnected (${socket.id})`);
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });

      // Handle joining specific project room
      socket.on('join-project', (projectId: string) => {
        socket.join(`project:${projectId}`);
        console.log(`📁 User ${socket.userId} joined project room: ${projectId}`);
      });

      // Handle leaving specific project room
      socket.on('leave-project', (projectId: string) => {
        socket.leave(`project:${projectId}`);
        console.log(`📁 User ${socket.userId} left project room: ${projectId}`);
      });
    });
  }

  private async joinProjectRooms(socket: AuthenticatedSocket) {
    if (!socket.userId) return;

    try {
      if (socket.userRole === 'ADMIN') {
        // Admin joins all project rooms
        const projects = await prisma.project.findMany({
          select: { id: true }
        });
        projects.forEach(project => {
          socket.join(`project:${project.id}`);
        });
      } else if (socket.userRole === 'LECTURER') {
        // Lecturer joins their managed projects
        const projects = await prisma.project.findMany({
          where: { lecturerId: socket.userId },
          select: { id: true }
        });
        projects.forEach(project => {
          socket.join(`project:${project.id}`);
        });
      } else if (socket.userRole === 'STUDENT') {
        // Student joins their assigned projects
        const projectStudents = await prisma.projectStudent.findMany({
          where: { studentId: socket.userId },
          select: { projectId: true }
        });
        projectStudents.forEach(ps => {
          socket.join(`project:${ps.projectId}`);
        });
      }
    } catch (error) {
      console.error('Error joining project rooms:', error);
    }
  }

  // Task Events
  public emitTaskCreated(task: any, projectId: string) {
    this.io.to(`project:${projectId}`).emit('task-created', {
      task,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 Task created event sent to project ${projectId}`);
  }

  public emitTaskUpdated(task: any, projectId: string, changes: any) {
    this.io.to(`project:${projectId}`).emit('task-updated', {
      task,
      changes,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 Task updated event sent to project ${projectId}`);
  }

  public emitTaskDeleted(taskId: string, projectId: string) {
    this.io.to(`project:${projectId}`).emit('task-deleted', {
      taskId,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 Task deleted event sent to project ${projectId}`);
  }

  public emitTaskStatusChanged(task: any, projectId: string, oldStatus: string, newStatus: string) {
    this.io.to(`project:${projectId}`).emit('task-status-changed', {
      task,
      oldStatus,
      newStatus,
      timestamp: new Date().toISOString()
    });
    console.log(`📝 Task status changed event sent to project ${projectId}: ${oldStatus} → ${newStatus}`);
  }

  // Comment Events
  public emitCommentAdded(comment: any, taskId: string, projectId: string) {
    this.io.to(`project:${projectId}`).emit('comment-added', {
      comment,
      taskId,
      timestamp: new Date().toISOString()
    });
    console.log(`💬 Comment added event sent to project ${projectId}`);
  }

  public emitCommentUpdated(comment: any, taskId: string, projectId: string) {
    this.io.to(`project:${projectId}`).emit('comment-updated', {
      comment,
      taskId,
      timestamp: new Date().toISOString()
    });
    console.log(`💬 Comment updated event sent to project ${projectId}`);
  }

  public emitCommentDeleted(commentId: string, taskId: string, projectId: string) {
    this.io.to(`project:${projectId}`).emit('comment-deleted', {
      commentId,
      taskId,
      timestamp: new Date().toISOString()
    });
    console.log(`💬 Comment deleted event sent to project ${projectId}`);
  }

  // User Presence
  public emitUserOnline(userId: string) {
    this.io.emit('user-online', {
      userId,
      timestamp: new Date().toISOString()
    });
  }

  public emitUserOffline(userId: string) {
    this.io.emit('user-offline', {
      userId,
      timestamp: new Date().toISOString()
    });
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Get user's socket ID
  public getUserSocketId(userId: string): string | undefined {
    return this.connectedUsers.get(userId);
  }
}

export default WebSocketService;
