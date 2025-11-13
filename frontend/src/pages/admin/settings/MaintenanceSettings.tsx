import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorUtils';

interface MaintenanceSettingsData {
  enabled: boolean;
  message: string;
  allowedIPs: string[];
  scheduledStart: string | null;
  scheduledEnd: string | null;
}

export default function MaintenanceSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<MaintenanceSettingsData>({
    enabled: false,
    message: 'Hệ thống đang bảo trì. Vui lòng quay lại sau.',
    allowedIPs: [],
    scheduledStart: null,
    scheduledEnd: null,
  });
  const [newIP, setNewIP] = useState('');

  // Fetch settings
  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-maintenance'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/maintenance');
      return response.data.settings as MaintenanceSettingsData;
    },
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<MaintenanceSettingsData>) => {
      const response = await api.put('/admin/settings/maintenance', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cài đặt bảo trì đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-maintenance'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt bảo trì'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleAddIP = () => {
    if (newIP && !formData.allowedIPs.includes(newIP)) {
      setFormData((prev) => ({
        ...prev,
        allowedIPs: [...prev.allowedIPs, newIP],
      }));
      setNewIP('');
    }
  };

  const handleRemoveIP = (ip: string) => {
    setFormData((prev) => ({
      ...prev,
      allowedIPs: prev.allowedIPs.filter((i) => i !== ip),
    }));
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
          {error instanceof Error ? error.message : 'Không thể tải cài đặt bảo trì'}
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Enable Maintenance Mode */}
      <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div>
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData((prev) => ({ ...prev, enabled: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm font-medium text-gray-900">
              Bật chế độ bảo trì
            </span>
          </label>
          <p className="mt-1 text-xs text-gray-600">
            Khi bật, chỉ admin và IP trong whitelist mới có thể truy cập hệ thống
          </p>
        </div>
      </div>

      {/* Maintenance Message */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Thông báo bảo trì
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
          rows={4}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Hệ thống đang bảo trì. Vui lòng quay lại sau."
        />
      </div>

      {/* Allowed IPs */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          IP được phép truy cập
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newIP}
            onChange={(e) => setNewIP(e.target.value)}
            placeholder="Nhập địa chỉ IP (ví dụ: 192.168.1.1)"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={handleAddIP}
            className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            Thêm
          </button>
        </div>
        {formData.allowedIPs.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.allowedIPs.map((ip) => (
              <span
                key={ip}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-lg text-sm"
              >
                {ip}
                <button
                  type="button"
                  onClick={() => handleRemoveIP(ip)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Scheduled Maintenance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian bắt đầu bảo trì (tùy chọn)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledStart || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, scheduledStart: e.target.value || null }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thời gian kết thúc bảo trì (tùy chọn)
          </label>
          <input
            type="datetime-local"
            value={formData.scheduledEnd || ''}
            onChange={(e) => setFormData((prev) => ({ ...prev, scheduledEnd: e.target.value || null }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {updateMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Đang lưu...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </form>
  );
}

