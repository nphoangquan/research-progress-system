import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';
import { Bell, Check, CheckCheck, Trash2, Clock, FileText, CheckSquare, FolderOpen, AlertCircle } from 'lucide-react';
import Pagination from '../components/ui/Pagination';
import SelectDropdown from '../components/ui/SelectDropdown';
import { useWebSocketEvents } from '../hooks/useWebSocketEvents';
import { useNotificationCount } from '../hooks/useNotificationCount';

interface Notification {
  id: string;
  type: 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'DOCUMENT_UPLOADED' | 'PROJECT_STATUS_CHANGED' | 'DEADLINE_APPROACHING';
  title: string;
  message: string;
  isRead: boolean;
  projectId: string | null;
  project: {
    id: string;
    title: string;
  } | null;
  createdAt: string;
}

const typeLabels: Record<Notification['type'], string> = {
  TASK_ASSIGNED: 'Task được giao',
  TASK_COMPLETED: 'Task hoàn thành',
  DOCUMENT_UPLOADED: 'Tài liệu mới',
  PROJECT_STATUS_CHANGED: 'Trạng thái dự án',
  DEADLINE_APPROACHING: 'Deadline sắp đến',
};

const typeIcons: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  TASK_ASSIGNED: CheckSquare,
  TASK_COMPLETED: CheckSquare,
  DOCUMENT_UPLOADED: FileText,
  PROJECT_STATUS_CHANGED: FolderOpen,
  DEADLINE_APPROACHING: AlertCircle,
};

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    isRead: '',
    type: '',
  });
  const pageSize = 20;

  // WebSocket integration for real-time updates
  useWebSocketEvents({
    onNotification: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
    onNotificationCount: (count: number) => {
      queryClient.setQueryData(['notifications', 'unread-count'], { count });
    },
  });

  // Fetch notifications
  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());
      if (filters.isRead) params.append('isRead', filters.isRead);
      if (filters.type) params.append('type', filters.type);

      const response = await api.get(`/notifications?${params.toString()}`);
      return response.data;
    },
  });

  const notifications: Notification[] = data?.notifications || [];
  const pagination = data?.pagination;
  const { data: unreadCount = 0 } = useNotificationCount();

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/notifications/${id}/read`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Đã đánh dấu đã đọc');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.patch('/notifications/read-all');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Đã đánh dấu tất cả đã đọc');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete notification mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/notifications/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Đã xóa thông báo');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  // Delete all read notifications mutation
  const deleteAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete('/notifications/read');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
      toast.success('Đã xóa tất cả thông báo đã đọc');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleMarkAsRead = (id: string) => {
    markAsReadMutation.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleDeleteAllRead = () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tất cả thông báo đã đọc?')) {
      deleteAllReadMutation.mutate();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      handleMarkAsRead(notification.id);
    }

    if (notification.projectId) {
      navigate(`/projects/${notification.projectId}`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Thông báo
            </h1>
            <p className="page-subtitle">
              Xem và quản lý tất cả thông báo của bạn
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                disabled={markAllAsReadMutation.isPending}
                className="btn-secondary flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                <span className="hidden sm:inline">Đánh dấu tất cả đã đọc</span>
                <span className="sm:hidden">Tất cả</span>
              </button>
            )}
            {notifications.some((n) => n.isRead) && (
              <button
                onClick={handleDeleteAllRead}
                disabled={deleteAllReadMutation.isPending}
                className="btn-danger flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa đã đọc</span>
                <span className="sm:hidden">Xóa</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <SelectDropdown
              label="Trạng thái"
              value={filters.isRead}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, isRead: value }));
                setCurrentPage(1);
              }}
              options={[
                { id: '', fullName: 'Tất cả' },
                { id: 'false', fullName: 'Chưa đọc' },
                { id: 'true', fullName: 'Đã đọc' },
              ]}
              placeholder="Tất cả trạng thái"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <SelectDropdown
              label="Loại"
              value={filters.type}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, type: value }));
                setCurrentPage(1);
              }}
              options={[
                { id: '', fullName: 'Tất cả' },
                ...Object.entries(typeLabels).map(([value, label]) => ({ id: value, fullName: label })),
              ]}
              placeholder="Tất cả loại"
            />
          </div>
        </div>
      </div>

      {/* Notifications List */}
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-4 text-gray-600">Đang tải thông báo...</p>
            </div>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có thông báo nào</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="divide-y divide-gray-200">
            {notifications.map((notification) => {
              const Icon = typeIcons[notification.type];
              return (
                <div
                  key={notification.id}
                  className={`px-6 py-4 hover:bg-gray-50 transition-colors ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      !notification.isRead ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`font-medium ${
                                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
                              } cursor-pointer truncate`}
                              onClick={() => handleNotificationClick(notification)}
                              title={notification.title}
                            >
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full"></span>
                            )}
                          </div>
                          <p
                            className="text-sm text-gray-600 mb-2 line-clamp-2 cursor-pointer"
                            onClick={() => handleNotificationClick(notification)}
                            title={notification.message}
                          >
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatDate(notification.createdAt)}
                            </span>
                            {notification.project && (
                              <span className="flex items-center gap-1 truncate" title={notification.project.title}>
                                <FolderOpen className="w-3 h-3" />
                                <span className="truncate">{notification.project.title}</span>
                              </span>
                            )}
                            <span className="text-gray-400">{typeLabels[notification.type]}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              disabled={markAsReadMutation.isPending}
                              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                              title="Đánh dấu đã đọc"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            disabled={deleteMutation.isPending}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={pagination.totalPages}
                totalCount={pagination.totalCount}
                limit={pageSize}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

