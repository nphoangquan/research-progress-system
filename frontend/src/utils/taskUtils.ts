/**
 * Utility functions for task-related operations
 */

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'TODO':
      return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS':
      return 'bg-blue-100 text-blue-800';
    case 'REVIEW':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case 'LOW':
      return 'text-gray-600';
    case 'MEDIUM':
      return 'text-yellow-600';
    case 'HIGH':
      return 'text-orange-600';
    case 'URGENT':
      return 'text-red-600';
    default:
      return 'text-gray-600';
  }
};

export const formatDate = (dateString: string | null): string | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatDateTime = (dateString: string): string => {
  return new Date(dateString).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const isOverdue = (dueDate: string | null, status: string): boolean => {
  if (!dueDate || status === 'COMPLETED') return false;
  return new Date(dueDate) < new Date();
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

