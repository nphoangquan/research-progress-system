import { useQuery } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { RefreshCw, CheckCircle2, XCircle, AlertCircle, Loader2 } from 'lucide-react';

interface SystemHealthData {
  database: { status: string; latency?: number; error?: string };
  storage: { status: string };
  email: { status: string };
  uptime: number;
  memory: { used: number; total: number };
  activeUsers: number;
  recentErrors: number;
}

export default function SystemHealth() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-health'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/health');
      return response.data as SystemHealthData;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'not_configured':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'not_configured':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

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
          {error instanceof Error ? error.message : 'Không thể tải trạng thái hệ thống'}
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          Thử lại
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Không thể tải trạng thái hệ thống</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh Button */}
      <div className="flex justify-end">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Làm mới
        </button>
      </div>

      {/* Service Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Database</h3>
            {getStatusIcon(data.database.status)}
          </div>
          <p className={`text-xs px-2 py-1 rounded ${getStatusColor(data.database.status)} inline-block`}>
            {data.database.status === 'ok' ? 'Hoạt động bình thường' : data.database.error || 'Lỗi'}
          </p>
          {data.database.latency !== undefined && (
            <p className="text-xs text-gray-500 mt-1">Latency: {data.database.latency}ms</p>
          )}
        </div>

        {/* Storage */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Storage</h3>
            {getStatusIcon(data.storage.status)}
          </div>
          <p className={`text-xs px-2 py-1 rounded ${getStatusColor(data.storage.status)} inline-block`}>
            {data.storage.status === 'ok' ? 'Hoạt động bình thường' : 'Lỗi'}
          </p>
        </div>

        {/* Email */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-900">Email Service</h3>
            {getStatusIcon(data.email.status)}
          </div>
          <p className={`text-xs px-2 py-1 rounded ${getStatusColor(data.email.status)} inline-block`}>
            {data.email.status === 'ok'
              ? 'Hoạt động bình thường'
              : data.email.status === 'not_configured'
              ? 'Chưa cấu hình'
              : 'Lỗi'}
          </p>
        </div>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uptime */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Uptime</h3>
          <p className="text-2xl font-semibold text-gray-900">{formatUptime(data.uptime)}</p>
        </div>

        {/* Memory Usage */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Memory Usage</h3>
          <p className="text-2xl font-semibold text-gray-900">
            {data.memory.used} / {data.memory.total} MB
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full"
              style={{ width: `${(data.memory.used / data.memory.total) * 100}%` }}
            />
          </div>
        </div>

        {/* Active Users */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Active Users</h3>
          <p className="text-2xl font-semibold text-gray-900">{data.activeUsers}</p>
          <p className="text-xs text-gray-500 mt-1">Trong 30 phút qua</p>
        </div>

        {/* Recent Errors */}
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-1">Recent Errors</h3>
          <p className="text-2xl font-semibold text-gray-900">{data.recentErrors}</p>
          <p className="text-xs text-gray-500 mt-1">Trong 24 giờ qua</p>
        </div>
      </div>
    </div>
  );
}

