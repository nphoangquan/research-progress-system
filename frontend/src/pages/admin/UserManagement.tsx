import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  UserCheck, 
  UserX, 
  MoreVertical,
  RefreshCw
} from 'lucide-react';
import Pagination from '../../components/ui/Pagination';
import SelectDropdown from '../../components/ui/SelectDropdown';
import CreateUserModal from './CreateUserModal';
import EditUserModal from './EditUserModal';
import DeleteUserModal from './DeleteUserModal';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  studentId?: string;
  avatarUrl?: string;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserFilters {
  search: string;
  role: string;
  isActive: string;
  emailVerified: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export default function UserManagement() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    role: '',
    isActive: '',
    emailVerified: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  // Fetch users
  const { data: usersData, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-users', filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive) params.append('isActive', filters.isActive);
      if (filters.emailVerified) params.append('emailVerified', filters.emailVerified);
      params.append('sortBy', filters.sortBy);
      params.append('sortOrder', filters.sortOrder);
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await api.get(`/admin/users?${params.toString()}`);
      return response.data;
    },
  });

  const users = usersData?.users || [];
  const pagination = usersData?.pagination;

  // Activate/Deactivate mutation
  const activateMutation = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const response = await api.patch(`/admin/users/${userId}/activate`, { isActive });
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(
        variables.isActive 
          ? 'Người dùng đã được kích hoạt' 
          : 'Người dùng đã được vô hiệu hóa'
      );
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Không thể cập nhật trạng thái người dùng');
    },
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.role, filters.isActive, filters.emailVerified, filters.sortBy, filters.sortOrder]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActionMenuOpen(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleEdit = useCallback((user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
    setActionMenuOpen(null);
  }, []);

  const handleDelete = useCallback((user: User) => {
    setSelectedUser(user);
    setDeleteModalOpen(true);
    setActionMenuOpen(null);
  }, []);

  const handleActivate = useCallback((user: User) => {
    activateMutation.mutate({ userId: user.id, isActive: !user.isActive });
    setActionMenuOpen(null);
  }, [activateMutation]);

  const handleFilterChange = useCallback((key: keyof UserFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSort = useCallback((sortBy: string) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const translateRole = useCallback((role: string) => {
    const roles: { [key: string]: string } = {
      ADMIN: 'Quản trị viên',
      LECTURER: 'Giảng viên',
      STUDENT: 'Sinh viên',
    };
    return roles[role] || role;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Quản lý Người dùng</h1>
            <p className="page-subtitle">
              Quản lý tất cả người dùng trong hệ thống, tạo, chỉnh sửa và xóa tài khoản.
            </p>
          </div>
          <button onClick={handleCreate} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Tạo người dùng
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên, email, mã SV..."
                  className="input pl-10 text-sm min-h-[42px]"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Role Filter */}
            <SelectDropdown
              label="Vai trò"
              options={[
                { id: '', fullName: 'Tất cả' },
                { id: 'ADMIN', fullName: 'Quản trị viên' },
                { id: 'LECTURER', fullName: 'Giảng viên' },
                { id: 'STUDENT', fullName: 'Sinh viên' },
              ]}
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
              placeholder="Tất cả vai trò"
            />

            {/* Active Filter */}
            <SelectDropdown
              label="Trạng thái"
              options={[
                { id: '', fullName: 'Tất cả' },
                { id: 'true', fullName: 'Đang hoạt động' },
                { id: 'false', fullName: 'Đã vô hiệu hóa' },
              ]}
              value={filters.isActive}
              onChange={(value) => handleFilterChange('isActive', value)}
              placeholder="Tất cả trạng thái"
            />

            {/* Email Verified Filter */}
            <SelectDropdown
              label="Email xác thực"
              options={[
                { id: '', fullName: 'Tất cả' },
                { id: 'true', fullName: 'Đã xác thực' },
                { id: 'false', fullName: 'Chưa xác thực' },
              ]}
              value={filters.emailVerified}
              onChange={(value) => handleFilterChange('emailVerified', value)}
              placeholder="Tất cả"
            />
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-gray-400 animate-spin" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-4">Không thể tải danh sách người dùng</p>
              <button onClick={() => refetch()} className="btn-secondary">
                <RefreshCw className="w-4 h-4 mr-2" />
                Thử lại
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-600 mb-4">Không tìm thấy người dùng nào</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('fullName')}
                          className="flex items-center hover:text-gray-700"
                        >
                          Tên
                          {filters.sortBy === 'fullName' && (
                            <span className="ml-1 text-primary-600">
                              {filters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('email')}
                          className="flex items-center hover:text-gray-700"
                        >
                          Email
                          {filters.sortBy === 'email' && (
                            <span className="ml-1 text-primary-600">
                              {filters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Vai trò
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Mã SV
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Trạng thái
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center hover:text-gray-700"
                        >
                          Ngày tạo
                          {filters.sortBy === 'createdAt' && (
                            <span className="ml-1 text-primary-600">
                              {filters.sortOrder === 'asc' ? '↑' : '↓'}
                            </span>
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Thao tác
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((userItem: User) => (
                      <tr key={userItem.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {userItem.avatarUrl ? (
                              <img
                                src={userItem.avatarUrl}
                                alt={userItem.fullName}
                                className="w-10 h-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <span className="text-gray-600 text-sm font-medium">
                                  {userItem.fullName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {userItem.fullName}
                              </div>
                              {!userItem.emailVerified && (
                                <span className="text-xs text-warning-600">Chưa xác thực email</span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{userItem.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${
                            userItem.role === 'ADMIN' ? 'badge-primary' :
                            userItem.role === 'LECTURER' ? 'badge-success' :
                            'badge-gray'
                          }`}>
                            {translateRole(userItem.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {userItem.studentId || '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`badge ${
                            userItem.isActive ? 'badge-success' : 'badge-gray'
                          }`}>
                            {userItem.isActive ? 'Đang hoạt động' : 'Đã vô hiệu hóa'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDate(userItem.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setActionMenuOpen(actionMenuOpen === userItem.id ? null : userItem.id);
                              }}
                              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {actionMenuOpen === userItem.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                                <button
                                  onClick={() => handleEdit(userItem)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Chỉnh sửa
                                </button>
                                <button
                                  onClick={() => handleActivate(userItem)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  {userItem.isActive ? (
                                    <>
                                      <UserX className="w-4 h-4 mr-2" />
                                      Vô hiệu hóa
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck className="w-4 h-4 mr-2" />
                                      Kích hoạt
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => handleDelete(userItem)}
                                  className="w-full text-left px-4 py-2 text-sm text-error-600 hover:bg-error-50 flex items-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Xóa
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <Pagination
                    currentPage={currentPage}
                    totalPages={pagination.totalPages}
                    totalCount={pagination.total}
                    limit={pageSize}
                    onPageChange={setCurrentPage}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      {createModalOpen && (
        <CreateUserModal
          isOpen={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
        />
      )}

      {editModalOpen && selectedUser && (
        <EditUserModal
          isOpen={editModalOpen}
          user={selectedUser}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
        />
      )}

      {deleteModalOpen && selectedUser && (
        <DeleteUserModal
          isOpen={deleteModalOpen}
          user={selectedUser}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedUser(null);
            queryClient.invalidateQueries({ queryKey: ['admin-users'] });
          }}
        />
      )}
    </div>
  );
}

