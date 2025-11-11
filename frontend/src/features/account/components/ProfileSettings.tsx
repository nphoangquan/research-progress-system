import type { ProfileFormState, ProfileErrors, UserProfileData } from '../hooks/useAccountSettings';
import AvatarUpload from '../../../components/AvatarUpload';
import { User, Mail, AlertCircle, Save } from 'lucide-react';

interface ProfileSettingsProps {
  form: ProfileFormState;
  errors: ProfileErrors;
  onChange: (field: keyof ProfileFormState, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  userProfile?: UserProfileData;
  onAvatarChange: (file: File) => void;
  isUploadingAvatar: boolean;
  isStudent: boolean;
}

export function ProfileSettings({
  form,
  errors,
  onChange,
  onSubmit,
  isSubmitting,
  userProfile,
  onAvatarChange,
  isUploadingAvatar,
  isStudent
}: ProfileSettingsProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900">Thông tin Hồ sơ</h2>
        <p className="text-sm text-gray-600">Cập nhật thông tin cá nhân của bạn</p>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="flex items-center space-x-6 mb-8">
            <div className="flex-shrink-0">
              <AvatarUpload
                currentAvatarUrl={userProfile?.avatarUrl}
                onAvatarChange={onAvatarChange}
                isUploading={isUploadingAvatar}
              />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{userProfile?.fullName}</h3>
              <p className="text-sm text-gray-600">{userProfile?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{userProfile?.role?.toLowerCase()}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Họ và Tên *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className={`input pl-10 ${errors.fullName ? 'input-error' : ''}`}
                  placeholder="Nhập họ và tên của bạn"
                  value={form.fullName}
                  onChange={(event) => onChange('fullName', event.target.value)}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ Email *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="Nhập email của bạn"
                  value={form.email}
                  onChange={(event) => onChange('email', event.target.value)}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {isStudent && (
              <div className="md:col-span-2">
                <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                  Mã Sinh viên *
                </label>
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  required
                  className={`input ${errors.studentId ? 'input-error' : ''}`}
                  placeholder="Nhập mã sinh viên của bạn"
                  value={form.studentId}
                  onChange={(event) => onChange('studentId', event.target.value)}
                />
                {errors.studentId && (
                  <p className="mt-1 text-sm text-error-600 flex items-center">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {errors.studentId}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSubmitting}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang lưu...' : 'Lưu Thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
