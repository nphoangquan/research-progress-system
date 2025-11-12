import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { X, AlertTriangle, User } from 'lucide-react';
import SelectDropdown from '../../components/ui/SelectDropdown';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}

interface DeleteUserModalProps {
  isOpen: boolean;
  user: User;
  onClose: () => void;
}

export default function DeleteUserModal({ isOpen, user, onClose }: DeleteUserModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [transferProjectsTo, setTransferProjectsTo] = useState('');
  const [transferTasksTo, setTransferTasksTo] = useState('');
  const [requiresTransfer, setRequiresTransfer] = useState<{
    projects?: boolean;
    tasks?: boolean;
  }>({});

  // Fetch users for transfer dropdowns
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users;
    },
    enabled: isOpen,
  });

  const users = usersData || [];
  const lecturersAndAdmins = users.filter(
    (u: any) => u.role === 'LECTURER' || u.role === 'ADMIN'
  );

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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTransferProjectsTo('');
      setTransferTasksTo('');
      setRequiresTransfer({});
    }
  }, [isOpen]);

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (transferProjectsTo) params.append('transferProjectsTo', transferProjectsTo);
      if (transferTasksTo) params.append('transferTasksTo', transferTasksTo);
      
      const response = await api.delete(
        `/admin/users/${user.id}${params.toString() ? '?' + params.toString() : ''}`
      );
      return response.data;
    },
    onSuccess: () => {
      toast.success('Người dùng đã được xóa thành công');
      onClose();
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      const errorMessage = errorData?.error || 'Không thể xóa người dùng';
      
      // Check if transfer is required
      if (errorData?.requiresTransfer) {
        setRequiresTransfer({
          [errorData.transferType === 'projects' ? 'projects' : 'tasks']: true,
        });
        toast.error(errorMessage);
      } else {
        toast.error(errorMessage);
      }
    },
  });

  const handleDelete = useCallback(() => {
    deleteUserMutation.mutate();
  }, [deleteUserMutation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Xóa người dùng</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Warning */}
          <div className="bg-error-50 border border-error-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-error-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-error-900 mb-1">
                  Cảnh báo: Hành động này không thể hoàn tác
                </h4>
                <p className="text-sm text-error-700">
                  Bạn có chắc chắn muốn xóa người dùng <strong>{user.fullName}</strong> ({user.email})?
                </p>
              </div>
            </div>
          </div>

          {/* Transfer Projects */}
          {requiresTransfer.projects && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chuyển quyền sở hữu dự án cho <span className="text-error-500">*</span>
              </label>
              <SelectDropdown
                label=""
                options={lecturersAndAdmins
                  .filter((u: any) => u.id !== user.id)
                  .map((u: any) => ({
                    id: u.id,
                    fullName: `${u.fullName} (${u.email})`,
                  }))}
                value={transferProjectsTo}
                onChange={setTransferProjectsTo}
                placeholder="Chọn giảng viên hoặc admin"
              />
              <p className="mt-1 text-sm text-gray-500">
                Người dùng này đang là giảng viên của các dự án. Vui lòng chọn người dùng để chuyển quyền sở hữu.
              </p>
            </div>
          )}

          {/* Transfer Tasks */}
          {requiresTransfer.tasks && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Chuyển quyền sở hữu nhiệm vụ cho <span className="text-error-500">*</span>
              </label>
              <SelectDropdown
                label=""
                options={users
                  .filter((u: any) => u.id !== user.id)
                  .map((u: any) => ({
                    id: u.id,
                    fullName: `${u.fullName} (${u.email})`,
                  }))}
                value={transferTasksTo}
                onChange={setTransferTasksTo}
                placeholder="Chọn người dùng"
              />
              <p className="mt-1 text-sm text-gray-500">
                Người dùng này có các nhiệm vụ được giao. Vui lòng chọn người dùng để chuyển quyền sở hữu.
              </p>
            </div>
          )}

          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <User className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Thông tin người dùng</h4>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">Tên:</span>
                <span className="ml-2 text-gray-900">{user.fullName}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 text-gray-900">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Vai trò:</span>
                <span className="ml-2 text-gray-900">
                  {user.role === 'ADMIN' ? 'Quản trị viên' :
                   user.role === 'LECTURER' ? 'Giảng viên' : 'Sinh viên'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={deleteUserMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              disabled={
                deleteUserMutation.isPending ||
                (requiresTransfer.projects && !transferProjectsTo) ||
                (requiresTransfer.tasks && !transferTasksTo)
              }
            >
              {deleteUserMutation.isPending ? 'Đang xóa...' : 'Xóa người dùng'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

