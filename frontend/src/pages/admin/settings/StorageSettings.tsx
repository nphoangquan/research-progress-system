import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorUtils';

interface StorageSettingsData {
  maxFileSize: number;
  allowedFileTypes: string[];
  maxDocumentsPerProject: number;
  autoIndexing: boolean;
  maxAvatarSize: number;
  allowedAvatarTypes: string[];
}

const commonFileTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/x-rar-compressed',
];

const commonAvatarTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export default function StorageSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<StorageSettingsData>({
    maxFileSize: 25 * 1024 * 1024,
    allowedFileTypes: commonFileTypes,
    maxDocumentsPerProject: 100,
    autoIndexing: true,
    maxAvatarSize: 5 * 1024 * 1024,
    allowedAvatarTypes: commonAvatarTypes,
  });

  // Fetch settings
  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-storage'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/storage');
      return response.data.settings as StorageSettingsData;
    },
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<StorageSettingsData>) => {
      const response = await api.put('/admin/settings/storage', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cài đặt lưu trữ đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-storage'] });
      // Invalidate public storage settings cache so all users get updated settings
      queryClient.invalidateQueries({ queryKey: ['storage-settings'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt lưu trữ'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
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
          {error instanceof Error ? error.message : 'Không thể tải cài đặt lưu trữ'}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Max File Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kích thước file tối đa (bytes)
          </label>
          <input
            type="number"
            value={formData.maxFileSize}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxFileSize: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hiện tại: {formatBytes(formData.maxFileSize)}
          </p>
        </div>

        {/* Max Documents Per Project */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Số lượng tài liệu tối đa mỗi dự án
          </label>
          <input
            type="number"
            value={formData.maxDocumentsPerProject}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxDocumentsPerProject: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>

        {/* Max Avatar Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Kích thước avatar tối đa (bytes)
          </label>
          <input
            type="number"
            value={formData.maxAvatarSize}
            onChange={(e) => setFormData((prev) => ({ ...prev, maxAvatarSize: parseInt(e.target.value) || 0 }))}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Hiện tại: {formatBytes(formData.maxAvatarSize)}
          </p>
        </div>

        {/* Auto Indexing */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="autoIndexing"
            checked={formData.autoIndexing}
            onChange={(e) => setFormData((prev) => ({ ...prev, autoIndexing: e.target.checked }))}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="autoIndexing" className="ml-2 text-sm font-medium text-gray-700">
            Tự động index tài liệu
          </label>
        </div>
      </div>

      {/* Allowed File Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại file được phép
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonFileTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowedFileTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData((prev) => ({
                      ...prev,
                      allowedFileTypes: [...prev.allowedFileTypes, type],
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      allowedFileTypes: prev.allowedFileTypes.filter((t) => t !== type),
                    }));
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Allowed Avatar Types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại avatar được phép
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {commonAvatarTypes.map((type) => (
            <label key={type} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowedAvatarTypes.includes(type)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData((prev) => ({
                      ...prev,
                      allowedAvatarTypes: [...prev.allowedAvatarTypes, type],
                    }));
                  } else {
                    setFormData((prev) => ({
                      ...prev,
                      allowedAvatarTypes: prev.allowedAvatarTypes.filter((t) => t !== type),
                    }));
                  }
                }}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{type}</span>
            </label>
          ))}
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

