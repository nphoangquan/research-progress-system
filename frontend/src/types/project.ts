import { User } from './auth';

export interface Project {
  id: string;
  title: string;
  description: string;
  studentId: string;
  lecturerId: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'COMPLETED' | 'CANCELLED';
  startDate: string;
  endDate?: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  student: Pick<User, 'id' | 'fullName' | 'email' | 'studentId'>;
  lecturer: Pick<User, 'id' | 'fullName' | 'email'>;
  _count: {
    tasks: number;
    documents: number;
  };
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  studentId: string;
  lecturerId: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  status?: Project['status'];
  progress?: number;
  endDate?: string;
}
