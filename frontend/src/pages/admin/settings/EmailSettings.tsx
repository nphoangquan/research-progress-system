import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import toast from 'react-hot-toast';
import { Save, Loader2, Mail, Send } from 'lucide-react';
import { getErrorMessage } from '../../../utils/errorUtils';

interface EmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUsername: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  welcomeEmailTemplate: string | null;
  passwordResetEmailTemplate: string | null;
  verificationEmailTemplate: string | null;
}

export default function EmailSettings() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<EmailSettingsData>({
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUsername: '',
    smtpPassword: '',
    fromEmail: '',
    fromName: 'Research Progress Management System',
    welcomeEmailTemplate: null,
    passwordResetEmailTemplate: null,
    verificationEmailTemplate: null,
  });
  const [testEmail, setTestEmail] = useState('');

  // Fetch settings
  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-settings-email'],
    queryFn: async () => {
      const response = await api.get('/admin/settings/email');
      return response.data.settings as EmailSettingsData;
    },
    onSuccess: (data) => {
      setFormData(data);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: Partial<EmailSettingsData>) => {
      const response = await api.put('/admin/settings/email', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cài đặt email đã được cập nhật thành công');
      queryClient.invalidateQueries({ queryKey: ['admin-settings-email'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật cài đặt email'));
    },
  });

  // Test email mutation
  const testEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await api.post('/admin/settings/email/test', { testEmail: email });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Email test đã được gửi thành công');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể gửi email test'));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleChange = (field: keyof EmailSettingsData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTestEmail = () => {
    if (!testEmail) {
      toast.error('Vui lòng nhập địa chỉ email test');
      return;
    }
    testEmailMutation.mutate(testEmail);
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
          {error instanceof Error ? error.message : 'Không thể tải cài đặt email'}
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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SMTP Host */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={formData.smtpHost}
              onChange={(e) => handleChange('smtpHost', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="smtp.gmail.com"
            />
          </div>

          {/* SMTP Port */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={formData.smtpPort}
              onChange={(e) => handleChange('smtpPort', parseInt(e.target.value) || 587)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="587"
            />
          </div>

          {/* SMTP Secure */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={formData.smtpSecure}
              onChange={(e) => handleChange('smtpSecure', e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <label htmlFor="smtpSecure" className="ml-2 text-sm font-medium text-gray-700">
              Sử dụng TLS/SSL
            </label>
          </div>

          {/* SMTP Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Username
            </label>
            <input
              type="text"
              value={formData.smtpUsername}
              onChange={(e) => handleChange('smtpUsername', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="your-email@gmail.com"
            />
          </div>

          {/* SMTP Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              SMTP Password
            </label>
            <input
              type="password"
              value={formData.smtpPassword === '***' ? '' : formData.smtpPassword}
              onChange={(e) => handleChange('smtpPassword', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder={formData.smtpPassword === '***' ? '••••••••' : 'Nhập mật khẩu mới'}
            />
            {formData.smtpPassword === '***' && (
              <p className="mt-1 text-xs text-gray-500">
                Mật khẩu hiện tại đã được mã hóa. Nhập mật khẩu mới để thay đổi.
              </p>
            )}
          </div>

          {/* From Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email người gửi
            </label>
            <input
              type="email"
              value={formData.fromEmail}
              onChange={(e) => handleChange('fromEmail', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="noreply@example.com"
            />
          </div>

          {/* From Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tên người gửi
            </label>
            <input
              type="text"
              value={formData.fromName}
              onChange={(e) => handleChange('fromName', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Research Progress Management System"
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

      {/* Test Email Section */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-medium text-gray-900">Test Email</h3>
        </div>
        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="Nhập địa chỉ email để test"
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testEmailMutation.isPending || !testEmail}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testEmailMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang gửi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Gửi test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

