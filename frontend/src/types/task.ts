import React from 'react';
import { User } from './auth';

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  assigneeId: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  assignee: Pick<User, 'id' | 'fullName' | 'email'>;
  project: {
    id: string;
    title: string;
  };
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
