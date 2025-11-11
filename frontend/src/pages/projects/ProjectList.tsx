import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import UserFilterSelector from '../../components/ui/UserFilterSelector';
import DateRangePicker from '../../components/ui/DateRangePicker';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
import type { Project } from '../../types/project';
import { 
  Plus, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  User,
  Search,
  Filter,
  Edit,
  Archive
} from 'lucide-react';

export default function ProjectList() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [filters, setFilters] = useState({
    status: '',
    lecturers: [] as string[],
    progress: '',
    dateRange: null as { startDate: string | null; endDate: string | null } | null,
    search: '',
    showArchived: false
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: projectsData, isLoading, error } = useQuery({
    queryKey: ['projects', filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      // Add lecturer IDs as multiple parameters
      filters.lecturers.forEach(lecturerId => {
        params.append('lecturer', lecturerId);
      });
      if (filters.progress) params.append('progress', filters.progress);
      // Add date range parameters
      if (filters.dateRange?.startDate) {
        params.append('startDate', filters.dateRange.startDate);
      }
      if (filters.dateRange?.endDate) {
        params.append('endDate', filters.dateRange.endDate);
      }
      if (filters.search) params.append('search', filters.search);
      if (filters.showArchived) params.append('includeArchived', 'true');

      // Pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await api.get(`/projects?${params.toString()}`);
      return response.data;
    },
  });

  const projects = projectsData?.projects || [];
  const pagination = projectsData?.pagination;

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.lecturers.length, filters.progress, filters.dateRange?.startDate, filters.dateRange?.endDate, filters.search, filters.showArchived]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="w-full px-6 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">Dự án</h1>
              <p className="page-subtitle">
                Quản lý các dự án nghiên cứu và theo dõi tiến độ.
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                <Link
                  to="/projects/new"
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo dự án
                </Link>
              )}
              <Link
                to="/projects/archived"
                className="btn-secondary"
              >
                <Archive className="w-4 h-4 mr-2" />
                Dự án đã lưu trữ
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm dự án..."
                    className="input pl-10"
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: '', lecturers: [], progress: '', dateRange: null, search: '', showArchived: false });
                    setCurrentPage(1);
                  }}
                  className="btn-ghost whitespace-nowrap"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Filter Row 1: Lecturer Filter and Date Range Picker */}
              {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Lecturer Filter - Only for Admin/Lecturer */}
                  <UserFilterSelector
                    selectedUsers={filters.lecturers}
                    onSelectionChange={(lecturerIds) => setFilters(prev => ({ ...prev, lecturers: lecturerIds }))}
                    multiple={true}
                    placeholder="Tất cả giảng viên"
                    className="w-full"
                    roleFilter="LECTURER"
                  />

                  {/* Date Range Filter */}
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                    placeholder="Chọn khoảng ngày"
                    className="w-full"
                  />
                </div>
              )}

              {/* Filter Row 2: Status and Progress */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'Tất cả trạng thái' },
                    { id: 'NOT_STARTED', fullName: 'Chưa bắt đầu' },
                    { id: 'IN_PROGRESS', fullName: 'Đang thực hiện' },
                    { id: 'UNDER_REVIEW', fullName: 'Đang xem xét' },
                    { id: 'COMPLETED', fullName: 'Hoàn thành' },
                    { id: 'CANCELLED', fullName: 'Đã hủy' },
                    { id: 'ARCHIVED', fullName: 'Đã lưu trữ' }
                  ]}
                  value={filters.status}
                  onChange={(status) => setFilters(prev => ({ ...prev, status }))}
                  placeholder="Tất cả trạng thái"
                />

                {/* Progress Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'Tất cả tiến độ' },
                    { id: '0-25', fullName: '0-25%' },
                    { id: '25-50', fullName: '25-50%' },
                    { id: '50-75', fullName: '50-75%' },
                    { id: '75-100', fullName: '75-100%' }
                  ]}
                  value={filters.progress}
                  onChange={(progress) => setFilters(prev => ({ ...prev, progress }))}
                  placeholder="Tất cả tiến độ"
                />
              </div>

              {/* Date Range Filter for Student (only show if student) */}
              {user.role === 'STUDENT' && (
                <div className="grid grid-cols-1 gap-4">
                  <DateRangePicker
                    value={filters.dateRange}
                    onChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
                    placeholder="Chọn khoảng ngày"
                    className="w-full"
                  />
                </div>
              )}

              {/* Archive Toggle */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showArchived"
                    checked={filters.showArchived}
                    onChange={(e) => setFilters(prev => ({ ...prev, showArchived: e.target.checked }))}
                    className="w-4 h-4 text-primary-600 bg-gray-100 border-gray-300 rounded focus:ring-primary-500 focus:ring-2"
                  />
                  <label htmlFor="showArchived" className="text-sm font-medium text-gray-700">
                    Hiển thị dự án đã lưu trữ
                  </label>
                </div>
                {filters.showArchived && (
                  <div className="text-sm text-gray-500">
                    Đang hiển thị dự án đã lưu trữ
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dự án...</p>
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-error-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Lỗi khi tải dự án</h3>
              <p className="text-gray-600 mb-6">Vui lòng thử lại sau.</p>
              <button className="btn-primary">
                Thử lại
              </button>
            </div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy dự án</h3>
              <p className="text-gray-600 mb-6">
                {user.role === 'STUDENT' 
                  ? "Bạn chưa được gán dự án nào."
                  : "Bắt đầu bằng cách tạo dự án đầu tiên của bạn."
                }
              </p>
              {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                <Link
                  to="/projects/new"
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo dự án
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-medium transition-shadow duration-200">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="block"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors">
                          {project.title}
                        </h3>
                      </Link>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`badge whitespace-nowrap ${
                        project.status === 'COMPLETED' ? 'badge-success' :
                        project.status === 'IN_PROGRESS' ? 'badge-primary' :
                        project.status === 'UNDER_REVIEW' ? 'badge-warning' :
                        'badge-gray'
                      }`}>
                        {project.status.replace('_', ' ')}
                      </span>
                      {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                        <Link
                          to={`/projects/${project.id}/edit`}
                          className="btn-ghost p-1"
                          title="Chỉnh sửa dự án"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  {/* Progress Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Tiến độ</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        {project._count.tasks} nhiệm vụ
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {project._count.documents} tài liệu
                      </div>
                    </div>
                  </div>
                  
                  {/* Lecturer/Student Info */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        {user.role === 'STUDENT' ? 'Giảng viên' : 'Sinh viên'}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.role === 'STUDENT' 
                          ? project.lecturer.fullName 
                          : project.students?.length > 0 
                            ? `${project.students.length} sinh viên`
                            : 'Chưa có sinh viên'
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalCount={pagination.total}
              limit={pagination.limit}
              onPageChange={(page: number) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}