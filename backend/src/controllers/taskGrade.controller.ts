import { Request, Response } from 'express';
import { PrismaClient, ActivityType, NotificationType } from '@prisma/client';
import ActivityService from '../services/activity.service';
import { createNotification } from '../services/notification.service';
import logger from '../utils/logger';

const prisma = new PrismaClient();

const gradeInclude = {
  grader: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  }
};

async function getTaskWithAccess(taskId: string) {
  return prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          lecturerId: true,
          students: {
            select: {
              studentId: true
            }
          }
        }
      },
      assignee: {
        select: {
          id: true,
          fullName: true,
          email: true
        }
      },
      grade: {
        include: {
          grader: {
            select: {
              id: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  });
}

function ensureCanViewTask(task: any, userId: string, role: string) {
  if (role === 'ADMIN') return;

  if (role === 'LECTURER') {
    if (task.project.lecturerId !== userId) {
      throw new Error('FORBIDDEN');
    }
    return;
  }

  if (role === 'STUDENT') {
    const isMember = task.project.students.some(
      (student: { studentId: string }) => student.studentId === userId
    );

    if (!isMember) {
      throw new Error('FORBIDDEN');
    }
  }
}

function ensureCanGrade(task: any, userId: string, role: string) {
  if (role === 'ADMIN') return;

  if (role === 'LECTURER' && task.project.lecturerId === userId) {
    return;
  }

  throw new Error('FORBIDDEN');
}

export const getTaskGrade = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const task = await getTaskWithAccess(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });
    }

    try {
      ensureCanViewTask(task, currentUserId, currentUserRole);
    } catch (error) {
      return res.status(403).json({ error: 'Bạn không có quyền xem nhiệm vụ này' });
    }

    return res.json({
      message: 'Lấy điểm nhiệm vụ thành công',
      grade: task.grade
    });
  } catch (error) {
    logger.error('getTaskGrade error', error);
    return res.status(500).json({ error: 'Không thể lấy thông tin điểm' });
  }
};

export const createTaskGrade = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { score, feedback } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const task = await getTaskWithAccess(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });
    }

    try {
      ensureCanGrade(task, currentUserId, currentUserRole);
    } catch (error) {
      return res.status(403).json({ error: 'Bạn không có quyền chấm điểm nhiệm vụ này' });
    }

    if (task.grade) {
      return res.status(400).json({ error: 'Nhiệm vụ đã được chấm điểm, vui lòng chỉnh sửa' });
    }

    const grade = await prisma.taskGrade.create({
      data: {
        taskId,
        score,
        feedback: feedback?.trim() ? feedback.trim() : null,
        gradedBy: currentUserId
      },
      include: gradeInclude
    });

    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        projectId: task.project.id,
        type: NotificationType.TASK_GRADED,
        title: 'Nhiệm vụ được chấm điểm',
        message: `Nhiệm vụ "${task.title}" đã được chấm ${grade.score}/10`
      });
    }

    await ActivityService.logActivity({
      userId: currentUserId,
      type: ActivityType.TASK_GRADED,
      description: `Chấm điểm nhiệm vụ "${task.title}" (${grade.score}/10)`,
      taskId,
      projectId: task.project.id
    });

    return res.status(201).json({
      message: 'Chấm điểm nhiệm vụ thành công',
      grade
    });
  } catch (error) {
    logger.error('createTaskGrade error', error);
    return res.status(500).json({ error: 'Không thể chấm điểm nhiệm vụ' });
  }
};

export const updateTaskGrade = async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { score, feedback } = req.body;
    const currentUserId = req.user!.userId;
    const currentUserRole = req.user!.role;

    const task = await getTaskWithAccess(taskId);

    if (!task) {
      return res.status(404).json({ error: 'Không tìm thấy nhiệm vụ' });
    }

    try {
      ensureCanGrade(task, currentUserId, currentUserRole);
    } catch (error) {
      return res.status(403).json({ error: 'Bạn không có quyền chỉnh sửa điểm nhiệm vụ này' });
    }

    if (!task.grade) {
      return res.status(404).json({ error: 'Nhiệm vụ chưa được chấm điểm' });
    }

    const updatedGrade = await prisma.taskGrade.update({
      where: { id: task.grade.id },
      data: {
        score,
        feedback: feedback?.trim() ? feedback.trim() : null,
        gradedBy: currentUserId,
        gradedAt: new Date()
      },
      include: gradeInclude
    });

    const notificationType = NotificationType.TASK_GRADE_UPDATED;
    const notificationTitle = 'Điểm nhiệm vụ được cập nhật';
    const notificationMessage = `Điểm nhiệm vụ "${task.title}" được cập nhật thành ${updatedGrade.score}/10`;

    if (task.assigneeId) {
      await createNotification({
        userId: task.assigneeId,
        projectId: task.project.id,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage
      });
    }

    await ActivityService.logActivity({
      userId: currentUserId,
      type: ActivityType.TASK_GRADE_UPDATED,
      description: `Cập nhật điểm nhiệm vụ "${task.title}" (${updatedGrade.score}/10)`,
      taskId,
      projectId: task.project.id
    });

    return res.json({
      message: 'Cập nhật điểm nhiệm vụ thành công',
      grade: updatedGrade
    });
  } catch (error) {
    logger.error('updateTaskGrade error', error);
    return res.status(500).json({ error: 'Không thể cập nhật điểm nhiệm vụ' });
  }
};

