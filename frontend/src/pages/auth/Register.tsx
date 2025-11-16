import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useGeneralSettings } from '../../hooks/useGeneralSettings';
import { useMaintenanceStatus } from '../../hooks/useMaintenanceStatus';
import { GraduationCap, Mail, Lock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const { register, isLoading } = useAuth();
  const { data: generalSettings } = useGeneralSettings();
  const { data: maintenanceStatus } = useMaintenanceStatus();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    studentId: '',
  });
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    fullName?: string;
    studentId?: string;
  }>({});
  
  const systemName = (generalSettings as any)?.systemName || 'Hệ thống Quản lý Tiến độ Nghiên cứu';
  const logoUrl = (generalSettings as any)?.logoUrl;
  const isMaintenanceMode = (maintenanceStatus as any)?.isActive || false;
  const maintenanceMessage = (maintenanceStatus as any)?.message || 'Hệ thống đang bảo trì. Đăng ký tài khoản tạm thời bị tạm dừng.';
  const scheduledStart = (maintenanceStatus as any)?.scheduledStart;
  const scheduledEnd = (maintenanceStatus as any)?.scheduledEnd;
  const duration = (maintenanceStatus as any)?.duration;

  // Format maintenance time info for display
  const getMaintenanceTimeInfo = () => {
    if (!isMaintenanceMode) return '';
    
    const parts: string[] = [];
    
    if (scheduledStart) {
      const startDate = new Date(scheduledStart);
      parts.push(`từ ${startDate.toLocaleString('vi-VN')}`);
    }
    
    if (duration && duration > 0) {
      parts.push(`trong ${duration} phút`);
    } else if (scheduledEnd) {
      const endDate = new Date(scheduledEnd);
      parts.push(`đến ${endDate.toLocaleString('vi-VN')}`);
    }
    
    return parts.length > 0 ? ` (${parts.join(', ')})` : '';
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: typeof errors = {};
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }
    if (!formData.fullName) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prevent submission if maintenance mode is active
    if (isMaintenanceMode) {
      toast.error(maintenanceMessage);
      return;
    }

    try {
      await register({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        studentId: formData.studentId || undefined,
      });
    } catch (error: any) {
      // Check if maintenance mode error (fallback in case status wasn't updated)
      if (error?.response?.status === 503 && error?.response?.data?.maintenance) {
        toast.error(error.response.data.message || maintenanceMessage);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={systemName}
                className="w-12 h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const icon = e.currentTarget.nextElementSibling as HTMLElement;
                  if (icon) icon.style.display = 'block';
                }}
              />
            ) : null}
            <GraduationCap className={`w-12 h-12 text-gray-900 ${logoUrl ? 'hidden' : ''}`} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Tạo tài khoản của bạn
          </h2>
          <p className="mt-2 text-gray-600">
            Tham gia {systemName}
          </p>
        </div>

        {/* Maintenance Mode Warning */}
        {isMaintenanceMode && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-800">
                  Hệ thống đang bảo trì
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {maintenanceMessage}{getMaintenanceTimeInfo()}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Register Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {isMaintenanceMode && (
            <div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                Tất cả các trường đã bị vô hiệu hóa do hệ thống đang bảo trì
              </p>
            </div>
          )}
          <div className={`space-y-4 ${isMaintenanceMode ? 'opacity-50 pointer-events-none' : ''}`}>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  autoComplete="name"
                  required
                  className={`input pl-10 ${errors.fullName ? 'input-error' : ''}`}
                  placeholder="Nhập họ và tên của bạn"
                  value={formData.fullName}
                  onChange={handleInputChange}
                />
              </div>
              {errors.fullName && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.fullName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Địa chỉ Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="Nhập địa chỉ email của bạn"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Student ID (Optional) */}
            <div>
              <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                Mã số sinh viên (Tùy chọn)
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="studentId"
                  name="studentId"
                  type="text"
                  className={`input pl-10 ${errors.studentId ? 'input-error' : ''}`}
                  placeholder="Nhập mã số sinh viên của bạn"
                  value={formData.studentId}
                  onChange={handleInputChange}
                />
              </div>
              {errors.studentId && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.studentId}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input pl-10 ${errors.password ? 'input-error' : ''}`}
                  placeholder="Nhập mật khẩu của bạn"
                  value={formData.password}
                  onChange={handleInputChange}
                />
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className={`input pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                  placeholder="Xác nhận mật khẩu của bạn"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-error-600 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading || isMaintenanceMode}
              className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Đang tạo tài khoản...' : 'Đăng ký'}
            </button>
            {isMaintenanceMode && (
              <p className="mt-2 text-sm text-center text-gray-600">
                Không thể đăng ký khi hệ thống đang bảo trì
              </p>
            )}
          </div>

          {/* Login Link */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                Đăng nhập
              </Link>
            </p>
          </div>
        </form>
      </div>

      </div>
    );
}
