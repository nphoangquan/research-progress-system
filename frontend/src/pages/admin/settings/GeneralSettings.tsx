import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorUtils';

interface GeneralSettingsData {
  systemName: string;
  systemDescription: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  timezone: string;
  defaultLanguage: string;
  dateFormat: string;
}

export default function GeneralSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<GeneralSettingsData>({
    systemName: '',
    systemDescription: '',
    logoUrl: null,
    faviconUrl: null,
    timezone: 'Asia/Ho_Chi_Minh',
    defaultLanguage: 'vi',
    dateFormat: 'DD/MM/YYYY',
  });

  // Fetch settings
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-general'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/general');
      return response.data.settings as GeneralSettingsData;
    },
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<GeneralSettingsData>) => {
      const response = await api.put('/admin/settings/general', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cài đặt chung đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-general'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt chung'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof GeneralSettingsData, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
          {error instanceof Error ? error.message : 'Không thể tải cài đặt chung'}
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
      <div className="grid grid-cols-1 gap-6">
        {/* System Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tên hệ thống
          </label>
          <input
            type="text"
            value={formData.systemName}
            onChange={(e) => handleChange('systemName', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Research Progress Management System"
          />
        </div>

        {/* System Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mô tả hệ thống
          </label>
          <textarea
            value={formData.systemDescription}
            onChange={(e) => handleChange('systemDescription', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Hệ thống quản lý tiến độ nghiên cứu"
          />
        </div>

        {/* Logo URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Logo
          </label>
          <input
            type="url"
            value={formData.logoUrl || ''}
            onChange={(e) => handleChange('logoUrl', e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://example.com/logo.png"
          />
        </div>

        {/* Favicon URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            URL Favicon
          </label>
          <input
            type="url"
            value={formData.faviconUrl || ''}
            onChange={(e) => handleChange('faviconUrl', e.target.value || null)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="https://example.com/favicon.ico"
          />
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Múi giờ
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => handleChange('timezone', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
            <option value="UTC">UTC (GMT+0)</option>
            <option value="America/New_York">America/New_York (GMT-5)</option>
            <option value="Europe/London">Europe/London (GMT+0)</option>
            <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
          </select>
        </div>

        {/* Default Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ngôn ngữ mặc định
          </label>
          <select
            value={formData.defaultLanguage}
            onChange={(e) => handleChange('defaultLanguage', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </div>

        {/* Date Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Định dạng ngày
          </label>
          <select
            value={formData.dateFormat}
            onChange={(e) => handleChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            <option value="DD-MM-YYYY">DD-MM-YYYY</option>
          </select>
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

