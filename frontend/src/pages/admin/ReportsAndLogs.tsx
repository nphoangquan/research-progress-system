import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import { FileText, Activity, Shield, LogIn, Monitor, Download, Loader2, Filter } from 'lucide-react';
import { getErrorMessage } from '../../utils/errorUtils';
import toast from 'react-hot-toast';

type LogType = 'activities' | 'audit' | 'login-attempts' | 'sessions' | 'system';

interface Tab {
  id: LogType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'activities', label: 'Hoạt động', icon: Activity },
  { id: 'audit', label: 'Kiểm tra', icon: Shield },
  { id: 'login-attempts', label: 'Đăng nhập', icon: LogIn },
  { id: 'sessions', label: 'Phiên', icon: Monitor },
  { id: 'system', label: 'Hệ thống', icon: FileText },
];

interface Filters {
  page: number;
  limit: number;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  // Activity specific
  type?: string;
  projectId?: string;
  // Audit specific
  action?: string;
  entityType?: string;
  entityId?: string;
  // Login attempts specific
  email?: string;
  success?: string;
  ipAddress?: string;
  // Sessions specific
  activeOnly?: string;
  // System specific
  level?: string;
}

export default function ReportsAndLogs() {
  const [activeTab, setActiveTab] = useState<LogType>('activities');
  const [filters, setFilters] = useState<Filters>({
    page: 1,
    limit: 50,
  });
  const [showFilters, setShowFilters] = useState(false);

  // Build query params based on active tab and filters
  const buildQueryParams = () => {
    const params: any = {
      page: filters.page,
      limit: filters.limit,
    };

    if (filters.startDate) params.startDate = filters.startDate;
    if (filters.endDate) params.endDate = filters.endDate;
    if (filters.userId) params.userId = filters.userId;
    if (filters.search) params.search = filters.search;

    switch (activeTab) {
      case 'activities':
        if (filters.type) params.type = filters.type;
        if (filters.projectId) params.projectId = filters.projectId;
        break;
      case 'audit':
        if (filters.action) params.action = filters.action;
        if (filters.entityType) params.entityType = filters.entityType;
        if (filters.entityId) params.entityId = filters.entityId;
        break;
      case 'login-attempts':
        if (filters.email) params.email = filters.email;
        if (filters.success) params.success = filters.success;
        if (filters.ipAddress) params.ipAddress = filters.ipAddress;
        break;
      case 'sessions':
        if (filters.ipAddress) params.ipAddress = filters.ipAddress;
        if (filters.activeOnly) params.activeOnly = filters.activeOnly;
        break;
      case 'system':
        if (filters.level) params.level = filters.level;
        break;
    }

    return params;
  };

  // Fetch logs based on active tab
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-logs', activeTab, filters],
    queryFn: async () => {
      const params = buildQueryParams();
      const response = await api.get(`/admin/logs/${activeTab}`, { params });
      return response.data;
    },
  });

  // Handle export
  const handleExport = async () => {
    try {
      if (activeTab === 'system') {
        toast.error('Không thể xuất nhật ký hệ thống. Vui lòng truy cập trực tiếp file log.');
        return;
      }

      const params = buildQueryParams();
      params.type = activeTab;
      
      const response = await api.get('/admin/logs/export', {
        params,
        responseType: 'blob',
      });

      // Check if response is error (check content type)
      const contentType = response.headers['content-type'] || '';
      if (contentType.includes('application/json')) {
        // It's an error response
        const text = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsText(response.data);
        });
        const errorData = JSON.parse(text);
        toast.error(errorData.error || 'Không thể xuất nhật ký');
        return;
      }

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-logs-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Xuất nhật ký thành công');
    } catch (error) {
      toast.error(getErrorMessage(error, 'Không thể xuất nhật ký'));
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
    });
  };

  // Render log table based on type
  const renderLogTable = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      );
    }

    if (isError) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : 'Không thể tải nhật ký'}
          </p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            Thử lại
          </button>
        </div>
      );
    }

    if (!data || !data.logs || data.logs.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          Không có dữ liệu nhật ký
        </div>
      );
    }

    switch (activeTab) {
      case 'activities':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mô tả</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dự án</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.type}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate" title={log.description}>
                        {log.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={log.user?.fullName || log.user?.email || 'N/A'}>
                        {log.user?.fullName || log.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={log.project?.title || 'N/A'}>
                        {log.project?.title || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'audit':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hành động</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại thực thể</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thay đổi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.action}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.entityType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={log.user?.fullName || log.user?.email || 'N/A'}>
                        {log.user?.fullName || log.user?.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ipAddress || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-md">
                      <div className="truncate font-mono text-xs" title={log.changes ? JSON.stringify(log.changes, null, 2) : 'N/A'}>
                        {log.changes ? JSON.stringify(log.changes, null, 2) : 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'login-attempts':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thành công</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User Agent</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(log.failedAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                      <div className="truncate" title={log.email}>
                        {log.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.success
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {log.success ? 'Thành công' : 'Thất bại'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ipAddress || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 truncate max-w-xs">{log.userAgent || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case 'sessions':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tạo lúc</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hết hạn</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hoạt động cuối</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log: any) => {
                  const isActive = new Date(log.expiresAt) > new Date();
                  return (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs">
                        <div className="truncate" title={log.user?.fullName || log.user?.email || 'N/A'}>
                          {log.user?.fullName || log.user?.email || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{log.ipAddress || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.expiresAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(log.lastActivityAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {isActive ? 'Hoạt động' : 'Hết hạn'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );

      case 'system':
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thời gian</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mức độ</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thông báo</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.logs.map((log: any, index: number) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          log.level === 'error'
                            ? 'bg-red-100 text-red-800'
                            : log.level === 'warn'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.level?.toUpperCase() || 'INFO'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-900 font-mono max-w-2xl">
                      <div className="truncate" title={log.message || 'N/A'}>
                        {log.message || 'N/A'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-gray-600" />
            <h1 className="page-title">Báo cáo & Nhật ký</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Bộ lọc</span>
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Xuất CSV</span>
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Xem và quản lý nhật ký hoạt động, kiểm tra và hệ thống
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4 overflow-x-auto" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setFilters({ ...filters, page: 1 }); // Reset to page 1 when switching tabs
                  }}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
                <input
                  type="date"
                  value={filters.startDate || ''}
                  onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
                <input
                  type="date"
                  value={filters.endDate || ''}
                  onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                />
              </div>
              {activeTab === 'activities' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại hoạt động</label>
                    <select
                      value={filters.type || ''}
                      onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      <option value="TASK_CREATED">Tạo nhiệm vụ</option>
                      <option value="TASK_UPDATED">Cập nhật nhiệm vụ</option>
                      <option value="TASK_COMPLETED">Hoàn thành nhiệm vụ</option>
                      <option value="TASK_SUBMITTED">Nộp nhiệm vụ</option>
                      <option value="TASK_ASSIGNED">Giao nhiệm vụ</option>
                      <option value="DOCUMENT_UPLOADED">Tải lên tài liệu</option>
                      <option value="DOCUMENT_UPDATED">Cập nhật tài liệu</option>
                      <option value="COMMENT_ADDED">Thêm bình luận</option>
                      <option value="PROJECT_CREATED">Tạo dự án</option>
                      <option value="PROJECT_UPDATED">Cập nhật dự án</option>
                      <option value="PROJECT_JOINED">Tham gia dự án</option>
                      <option value="USER_LOGIN">Đăng nhập</option>
                      <option value="USER_LOGOUT">Đăng xuất</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
                    <input
                      type="text"
                      value={filters.search || ''}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                      placeholder="Tìm trong mô tả..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                </>
              )}
              {activeTab === 'audit' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Hành động</label>
                    <select
                      value={filters.action || ''}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      <option value="CREATE">Tạo</option>
                      <option value="UPDATE">Cập nhật</option>
                      <option value="DELETE">Xóa</option>
                      <option value="ACTIVATE">Kích hoạt</option>
                      <option value="DEACTIVATE">Vô hiệu hóa</option>
                      <option value="RESET_PASSWORD">Đặt lại mật khẩu</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Loại thực thể</label>
                    <select
                      value={filters.entityType || ''}
                      onChange={(e) => setFilters({ ...filters, entityType: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      <option value="User">Người dùng</option>
                      <option value="Project">Dự án</option>
                      <option value="Task">Nhiệm vụ</option>
                      <option value="Document">Tài liệu</option>
                      <option value="SystemSetting">Cài đặt hệ thống</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'sessions' && (
                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.activeOnly === 'true'}
                      onChange={(e) => setFilters({ ...filters, activeOnly: e.target.checked ? 'true' : '', page: 1 })}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  <span className="ml-2 text-sm text-gray-700">Chỉ hiển thị phiên hoạt động</span>
                </label>
                </div>
              )}
              {activeTab === 'login-attempts' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    <input
                      type="text"
                      value={filters.email || ''}
                      onChange={(e) => setFilters({ ...filters, email: e.target.value, page: 1 })}
                      placeholder="Tìm email..."
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Thành công</label>
                    <select
                      value={filters.success || ''}
                      onChange={(e) => setFilters({ ...filters, success: e.target.value, page: 1 })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                    >
                      <option value="">Tất cả</option>
                      <option value="true">Thành công</option>
                      <option value="false">Thất bại</option>
                    </select>
                  </div>
                </>
              )}
              {activeTab === 'system' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ</label>
                  <select
                    value={filters.level || ''}
                    onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  >
                    <option value="">Tất cả</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đặt lại
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          {renderLogTable()}

          {/* Pagination */}
          {activeTab === 'system' ? (
            data?.total !== undefined && (
              <div className="mt-6 text-sm text-gray-700">
                Hiển thị {data.total} bản ghi (nhật ký hệ thống không hỗ trợ phân trang)
              </div>
            )
          ) : (
            data?.pagination && (
              <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="text-sm text-gray-700">
                  <span className="hidden sm:inline">
                    Hiển thị {((data.pagination.page - 1) * data.pagination.limit) + 1} -{' '}
                    {Math.min(data.pagination.page * data.pagination.limit, data.pagination.total)} trong tổng số{' '}
                    {data.pagination.total} bản ghi
                  </span>
                  <span className="sm:hidden">
                    Trang {data.pagination.page}/{data.pagination.totalPages} ({data.pagination.total} bản ghi)
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Trước
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page >= (data.pagination.totalPages || 1)}
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Sau
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}

