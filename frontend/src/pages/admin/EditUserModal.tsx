import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import { X } from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  studentId?: string;
}

interface EditUserModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export default function EditUserModal({ isOpen, user, onClose }: EditUserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    studentId: user.studentId || '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Close modal on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Update form data when user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        studentId: user.studentId || '',
      });
      setErrors({});
    }
  }, [isOpen, user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.put(`/admin/users/${user.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Người dùng đã được cập nhật thành công');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error, 'Không thể cập nhật người dùng');
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: { [key: string]: string } = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Họ tên là bắt buộc';
    }
    if (!formData.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.role) {
      newErrors.role = 'Vai trò là bắt buộc';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    updateUserMutation.mutate(formData);
  }, [formData, updateUserMutation, user.id]);

  const handleChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Chỉnh sửa người dùng</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Họ tên <span className="text-error-500">*</span>
            </label>
            <input
              type="text"
              className={`input ${errors.fullName ? 'input-error' : ''}`}
              value={formData.fullName}
              onChange={(e) => handleChange('fullName', e.target.value)}
              placeholder="Nhập họ tên"
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-error-600">{errors.fullName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-error-500">*</span>
            </label>
            <input
              type="email"
              className={`input ${errors.email ? 'input-error' : ''}`}
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-error-600">{errors.email}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vai trò <span className="text-error-500">*</span>
            </label>
            <select
              className={`input ${errors.role ? 'input-error' : ''}`}
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
            >
              <option value="STUDENT">Sinh viên</option>
              <option value="LECTURER">Giảng viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>
            {errors.role && (
              <p className="mt-1 text-sm text-error-600">{errors.role}</p>
            )}
            {formData.role !== user.role && (
              <p className="mt-1 text-sm text-warning-600">
                WARNING: Thay đổi vai trò có thể ảnh hưởng đến quyền truy cập của người dùng
              </p>
            )}
          </div>

          {/* Student ID */}
          {formData.role === 'STUDENT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mã sinh viên
              </label>
              <input
                type="text"
                className="input"
                value={formData.studentId}
                onChange={(e) => handleChange('studentId', e.target.value)}
                placeholder="Nhập mã sinh viên (tùy chọn)"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={updateUserMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={updateUserMutation.isPending}
            >
              {updateUserMutation.isPending ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

