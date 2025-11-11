import type { PasswordFormState, PasswordErrors } from '../hooks/useAccountSettings';
import { Shield, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { useMemo } from 'react';

interface SecuritySettingsProps {
  form: PasswordFormState;
  errors: PasswordErrors;
  onChange: (field: keyof PasswordFormState, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  showPassword: boolean;
  showNewPassword: boolean;
  showConfirmPassword: boolean;
  togglePasswordVisibility: () => void;
  toggleNewPasswordVisibility: () => void;
  toggleConfirmPasswordVisibility: () => void;
}

const PASSWORD_REQUIREMENTS = [
  {
    key: 'length',
    label: 'Ít nhất 6 ký tự',
    check: (form: PasswordFormState) => form.newPassword.length >= 6
  },
  {
    key: 'match',
    label: 'Mật khẩu khớp nhau',
    check: (form: PasswordFormState) =>
      Boolean(form.newPassword) && form.newPassword === form.confirmPassword
  }
] as const;

export function SecuritySettings({
  form,
  errors,
  onChange,
  onSubmit,
  isSubmitting,
  showPassword,
  showNewPassword,
  showConfirmPassword,
  togglePasswordVisibility,
  toggleNewPasswordVisibility,
  toggleConfirmPasswordVisibility
}: SecuritySettingsProps) {
  const requirements = useMemo(
    () => PASSWORD_REQUIREMENTS.map(req => ({ ...req, satisfied: req.check(form) })),
    [form]
  );

  return (
    <div className="card">
      <div className="card-header">
        <h2 className="text-xl font-semibold text-gray-900">Bảo mật & Mật khẩu</h2>
        <p className="text-sm text-gray-600">Thay đổi mật khẩu để bảo vệ tài khoản của bạn</p>
      </div>
      <div className="card-body">
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu Hiện tại *
            </label>
            <div className="relative">
              <input
                id="currentPassword"
                name="currentPassword"
                type={showPassword ? 'text' : 'password'}
                required
                className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                placeholder="Nhập mật khẩu hiện tại của bạn"
                value={form.currentPassword}
                onChange={(event) => onChange('currentPassword', event.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-error-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.currentPassword}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Mật khẩu Mới *
            </label>
            <div className="relative">
              <input
                id="newPassword"
                name="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                required
                className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                placeholder="Nhập mật khẩu mới của bạn"
                value={form.newPassword}
                onChange={(event) => onChange('newPassword', event.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={toggleNewPasswordVisibility}
              >
                {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="mt-1 text-sm text-error-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.newPassword}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Xác nhận Mật khẩu Mới *
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                required
                className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Xác nhận mật khẩu mới của bạn"
                value={form.confirmPassword}
                onChange={(event) => onChange('confirmPassword', event.target.value)}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                onClick={toggleConfirmPasswordVisibility}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-error-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Yêu cầu Mật khẩu:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              {requirements.map(requirement => (
                <li key={requirement.key} className="flex items-center">
                  {requirement.satisfied ? (
                    <Shield className="w-4 h-4 text-green-600 mr-2" />
                  ) : (
                    <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  )}
                  {requirement.label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="btn-primary flex items-center"
              disabled={isSubmitting}
            >
              <Shield className="w-4 h-4 mr-2" />
              {isSubmitting ? 'Đang cập nhật...' : 'Cập nhật Mật khẩu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
