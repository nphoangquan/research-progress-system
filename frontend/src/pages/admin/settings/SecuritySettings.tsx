import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2 } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorUtils';

interface SecuritySettingsData {
  passwordMinLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecialChars: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  requireEmailVerification: boolean;
}

export default function SecuritySettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<SecuritySettingsData>({
    passwordMinLength: 8,
    passwordRequireUppercase: false,
    passwordRequireLowercase: false,
    passwordRequireNumbers: false,
    passwordRequireSpecialChars: false,
    sessionTimeout: 60 * 24,
    maxConcurrentSessions: 3,
    maxLoginAttempts: 5,
    lockoutDuration: 30,
    requireEmailVerification: false,
  });

  // Fetch settings
  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-security'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/security');
      return response.data.settings as SecuritySettingsData;
    },
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<SecuritySettingsData>) => {
      const response = await api.put('/admin/settings/security', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cài đặt bảo mật đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-security'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt bảo mật'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
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
          {error instanceof Error ? error.message : 'Không thể tải cài đặt bảo mật'}
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
      {/* Password Policy */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Chính sách Mật khẩu</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Độ dài mật khẩu tối thiểu
            </label>
            <input
              type="number"
              value={formData.passwordMinLength}
              onChange={(e) => setFormData((prev) => ({ ...prev, passwordMinLength: parseInt(e.target.value) || 6 }))}
              min={6}
              max={128}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.passwordRequireUppercase}
                onChange={(e) => setFormData((prev) => ({ ...prev, passwordRequireUppercase: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu chữ hoa</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.passwordRequireLowercase}
                onChange={(e) => setFormData((prev) => ({ ...prev, passwordRequireLowercase: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu chữ thường</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.passwordRequireNumbers}
                onChange={(e) => setFormData((prev) => ({ ...prev, passwordRequireNumbers: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu số</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.passwordRequireSpecialChars}
                onChange={(e) => setFormData((prev) => ({ ...prev, passwordRequireSpecialChars: e.target.checked }))}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">Yêu cầu ký tự đặc biệt</span>
            </label>
          </div>
        </div>
      </div>

      {/* Session Settings */}
      <div className="border-b border-gray-200 pb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cài đặt Phiên</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian hết hạn phiên (phút)
            </label>
            <input
              type="number"
              value={formData.sessionTimeout}
              onChange={(e) => setFormData((prev) => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 60 }))}
              min={1}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số phiên đồng thời tối đa
            </label>
            <input
              type="number"
              value={formData.maxConcurrentSessions}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxConcurrentSessions: parseInt(e.target.value) || 1 }))}
              min={1}
              max={10}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        </div>
      </div>

      {/* Login Security */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bảo mật Đăng nhập</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Số lần đăng nhập sai tối đa
            </label>
            <input
              type="number"
              value={formData.maxLoginAttempts}
              onChange={(e) => setFormData((prev) => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) || 5 }))}
              min={1}
              max={20}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thời gian khóa tài khoản (phút)
            </label>
            <input
              type="number"
              value={formData.lockoutDuration}
              onChange={(e) => setFormData((prev) => ({ ...prev, lockoutDuration: parseInt(e.target.value) || 30 }))}
              min={1}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireEmailVerification"
              checked={formData.requireEmailVerification}
              onChange={(e) => setFormData((prev) => ({ ...prev, requireEmailVerification: e.target.checked }))}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="requireEmailVerification" className="ml-2 text-sm font-medium text-gray-700">
              Yêu cầu xác thực email để đăng nhập
            </label>
          </div>
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

