import React, { type ReactNode } from 'react';
import { CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

// Analytics utility functions

// Status translations
export const statusColors = {
  'NOT_STARTED': 'bg-gray-100 text-gray-800',
  'IN_PROGRESS': 'bg-blue-100 text-blue-800',
  'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
  'COMPLETED': 'bg-green-100 text-green-800',
  'CANCELLED': 'bg-red-100 text-red-800',
  'TODO': 'bg-gray-100 text-gray-800',
  'REVIEW': 'bg-yellow-100 text-yellow-800',
  'PENDING': 'bg-gray-100 text-gray-800',
  'APPROVED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800',
  'PROCESSING': 'bg-blue-100 text-blue-800',
  'INDEXED': 'bg-green-100 text-green-800',
  'FAILED': 'bg-red-100 text-red-800'
};

export const statusLabels = {
  'NOT_STARTED': 'Chưa bắt đầu',
  'IN_PROGRESS': 'Đang thực hiện',
  'UNDER_REVIEW': 'Đang duyệt',
  'COMPLETED': 'Hoàn thành',
  'CANCELLED': 'Đã hủy',
  'TODO': 'Cần làm',
  'REVIEW': 'Đang xem xét',
  'PENDING': 'Chờ xử lý',
  'APPROVED': 'Đã duyệt',
  'REJECTED': 'Bị từ chối',
  'PROCESSING': 'Đang xử lý',
  'INDEXED': 'Đã lập chỉ mục',
  'FAILED': 'Thất bại'
};

export const getStatusColor = (status: string) => statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
export const translateStatus = (status: string) => statusLabels[status as keyof typeof statusLabels] || status.replace('_', ' ');

// Priority translations
export const priorityColors = {
  'LOW': 'bg-green-100 text-green-800',
  'MEDIUM': 'bg-yellow-100 text-yellow-800',
  'HIGH': 'bg-orange-100 text-orange-800',
  'URGENT': 'bg-red-100 text-red-800'
};

export const priorityLabels = {
  'LOW': 'Thấp',
  'MEDIUM': 'Trung bình',
  'HIGH': 'Cao',
  'URGENT': 'Khẩn cấp'
};

export const getPriorityColor = (priority: string) => priorityColors[priority as keyof typeof priorityColors] || 'bg-gray-100 text-gray-800';
export const translatePriority = (priority: string) => priorityLabels[priority as keyof typeof priorityLabels] || priority;

// Role translations
export const roleLabels = {
  'ADMIN': 'Quản trị viên',
  'LECTURER': 'Giảng viên',
  'STUDENT': 'Sinh viên'
};

export const translateRole = (role: string) => roleLabels[role as keyof typeof roleLabels] || role;

// Document type translations
export const documentTypeLabels = {
  'PDF': 'PDF',
  'DOC': 'DOC',
  'DOCX': 'DOCX',
  'TXT': 'TXT',
  'XLS': 'XLS',
  'XLSX': 'XLSX',
  'PPT': 'PPT',
  'PPTX': 'PPTX'
};

export const translateDocumentType = (type: string) => {
  const upperType = type?.toUpperCase();
  return documentTypeLabels[upperType as keyof typeof documentTypeLabels] || upperType || 'KHÁC';
};

// Period labels
export const periodLabels = {
  week: 'Tuần',
  month: 'Tháng',
  quarter: 'Quý',
  year: 'Năm'
};

// Format functions
export const formatLocaleDate = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

export const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Performance helpers
export const getPerformanceColor = (value: number, type: 'rate' | 'count') => {
  if (type === 'rate') {
    if (value >= 80) return 'text-green-600';
    if (value >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }
  return 'text-blue-600';
};

export const getPerformanceIcon = (value: number, type: 'rate' | 'count'): ReactNode => {
  if (type === 'rate') {
    if (value >= 80) return <CheckCircle className="w-5 h-5 text-gray-900" />;
    if (value >= 60) return <AlertCircle className="w-5 h-5 text-gray-900" />;
    return <AlertCircle className="w-5 h-5 text-gray-900" />;
  }
  return <TrendingUp className="w-5 h-5 text-gray-900" />;
};

