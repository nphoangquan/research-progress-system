import api from './axios';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '../types/label';

/**
 * Get labels (optionally filtered by projectId)
 */
export const getLabels = async (projectId?: string): Promise<Label[]> => {
  const params = new URLSearchParams();
  if (projectId) {
    params.append('projectId', projectId);
  }
  
  const response = await api.get(`/labels?${params.toString()}`);
  return response.data;
};

/**
 * Create a new label
 */
export const createLabel = async (data: CreateLabelRequest): Promise<Label> => {
  const response = await api.post('/labels', data);
  return response.data;
};

/**
 * Update a label
 */
export const updateLabel = async (id: string, data: UpdateLabelRequest): Promise<Label> => {
  const response = await api.put(`/labels/${id}`, data);
  return response.data;
};

/**
 * Delete a label
 */
export const deleteLabel = async (id: string): Promise<void> => {
  await api.delete(`/labels/${id}`);
};

/**
 * Get labels for a specific task
 */
export const getTaskLabels = async (taskId: string): Promise<Label[]> => {
  const response = await api.get(`/tasks/${taskId}/labels`);
  return response.data;
};

/**
 * Add a label to a task
 */
export const addLabelToTask = async (taskId: string, labelId: string): Promise<Label> => {
  const response = await api.post(`/tasks/${taskId}/labels`, { labelId });
  return response.data;
};

/**
 * Remove a label from a task
 */
export const removeLabelFromTask = async (taskId: string, labelId: string): Promise<void> => {
  await api.delete(`/tasks/${taskId}/labels/${labelId}`);
};

