import { User } from './auth';

export interface Label {
  id: string;
  name: string;
  color: string; // Hex color code
  projectId: string | null; // null = global label
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator: Pick<User, 'id' | 'fullName'>;
  project?: {
    id: string;
    title: string;
  } | null;
}

export interface CreateLabelRequest {
  name: string;
  color?: string;
  projectId?: string | null; // null for global label
}

export interface UpdateLabelRequest {
  name?: string;
  color?: string;
}

