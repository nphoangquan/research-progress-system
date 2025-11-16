import { useEffect, useState } from 'react';
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
  defaultLanguage: string;
}

export default function GeneralSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<GeneralSettingsData>({
    systemName: '',
    systemDescription: '',
    logoUrl: null,
    faviconUrl: null,
    defaultLanguage: 'vi',
  });
  const [initialData, setInitialData] = useState<GeneralSettingsData | null>(null);

  // Fetch settings
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-general'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/general');
      return response.data.settings as GeneralSettingsData;
    },
  });

  useEffect(() => {
    if (data) {
      setFormData({
        systemName: data.systemName || '',
        systemDescription: data.systemDescription || '',
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        defaultLanguage: data.defaultLanguage || 'vi',
      });
      setInitialData({
        systemName: data.systemName || '',
        systemDescription: data.systemDescription || '',
        logoUrl: data.logoUrl || null,
        faviconUrl: data.faviconUrl || null,
        defaultLanguage: data.defaultLanguage || 'vi',
      });
    }
  }, [data]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<GeneralSettingsData>) => {
      const response = await api.put('/admin/settings/general', data);
      return response.data;
    },
    onSuccess: (_, variables) => {
      toast.success('Cài đặt chung đã được cập nhật thành công');
      if (variables) {
        setInitialData((prev) => (prev ? { ...prev, ...variables } : prev));
        setFormData((prev) => ({ ...prev, ...variables }));
      }
      queryClient.invalidateQueries({ queryKey: ['admin-settings-general'] });
      // Invalidate public general settings cache so all users get updated settings
      queryClient.invalidateQueries({ queryKey: ['general-settings'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt chung'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialData) {
      updateMutation.mutate(formData);
      return;
    }

    const payload: Partial<GeneralSettingsData> = {};
    
    // Compare each field and only include changed ones
    (Object.keys(formData) as (keyof GeneralSettingsData)[]).forEach((field) => {
      const currentValue = formData[field];
      const initialValue = initialData[field];
      
      // Normalize empty strings to null for URL fields
      const normalizedCurrent = (field === 'logoUrl' || field === 'faviconUrl') 
        ? (currentValue === '' ? null : currentValue)
        : currentValue;
      const normalizedInitial = (field === 'logoUrl' || field === 'faviconUrl')
        ? (initialValue === '' ? null : initialValue)
        : initialValue;
      
      // Only include if value actually changed
      if (normalizedCurrent !== normalizedInitial) {
        // For URL fields, if empty string, send null instead
        if ((field === 'logoUrl' || field === 'faviconUrl') && normalizedCurrent === '') {
          payload[field] = null;
        } else {
          payload[field] = normalizedCurrent as any;
        }
      }
    });

    if (Object.keys(payload).length === 0) {
      toast('Không có thay đổi nào cần lưu');
      return;
    }

    updateMutation.mutate(payload);
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

