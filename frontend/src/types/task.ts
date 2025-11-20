import { User } from './auth';
import { Label } from './label';

export interface TaskGrade {
  id: string;
  score: number | string;
  feedback: string | null;
  gradedAt: string;
  gradedBy: string;
  updatedAt: string;
  grader?: Pick<User, 'id' | 'fullName' | 'email'>;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, 'id' | 'fullName' | 'email'>;
  project: {
    id: string;
    title: string;
    lecturerId?: string;
  };
  labels?: Label[];
  grade?: TaskGrade | null;
}

export interface CreateTaskRequest {
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: Task['status'];
  priority?: Task['priority'];
  dueDate?: string;
  assigneeId?: string;
}
