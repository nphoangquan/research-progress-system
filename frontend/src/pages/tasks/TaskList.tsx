import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents';
import SelectDropdown from '../../components/ui/SelectDropdown';
import AdvancedFilter from '../../components/ui/AdvancedFilter';
import UserFilterSelector from '../../components/ui/UserFilterSelector';
import DueDateFilter from '../../components/ui/DueDateFilter';
import LabelFilter from '../../components/ui/LabelFilter';
import LabelChip from '../../components/ui/LabelChip';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import {
  Plus,
  Search,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Edit,
  Trash2,
  ArrowLeft
} from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate: string | null;
  completedAt: string | null;
  assignee: {
    id: string;
    fullName: string;
    email: string;
  };
  project: {
    id: string;
    title: string;
  };
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
}

export default function TaskList() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  // WebSocket integration
  useWebSocketEvents({
    projectId: projectId,
    enableTaskEvents: true,
    enableCommentEvents: false
  });

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignees: [] as string[], // Changed to array for multi-select
    dueDate: '',
    search: '',
    labelIds: [] as string[]
  });

  // State for advanced filters
  const [advancedFilters, setAdvancedFilters] = useState<any>({});
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch tasks
  const { data: tasksData, isLoading, isError, refetch } = useQuery({
    queryKey: ['tasks', projectId, filters, advancedFilters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      // Basic filters
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      // Add assignee IDs as multiple parameters
      filters.assignees.forEach(assigneeId => {
        params.append('assignee', assigneeId);
      });
      if (filters.dueDate) params.append('dueDate', filters.dueDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.labelIds.length > 0) {
        filters.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }
      
      // Advanced filters
      Object.keys(advancedFilters).forEach(key => {
        if (advancedFilters[key] !== undefined && advancedFilters[key] !== '') {
          params.append(key, advancedFilters[key]);
        }
      });

      // Pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data;
    },
  });

  const tasks = tasksData?.tasks || [];
  const pagination = tasksData?.pagination;

  // Reset to page 1 when filters change (exclude search to keep input focus)
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.priority, filters.assignees.length, filters.dueDate, filters.labelIds.length, advancedFilters]);


  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xóa nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Xóa nhiệm vụ thất bại'));
    },
  });

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${taskTitle}"? Hành động này không thể hoàn tác.`)) {
      deleteTaskMutation.mutate(taskId);
    }
  };

  const statusLabels = useMemo<Record<Task['status'], string>>(() => ({
    TODO: 'Cần làm',
    IN_PROGRESS: 'Đang thực hiện',
    REVIEW: 'Đang xem xét',
    COMPLETED: 'Hoàn thành'
  }), []);

  const priorityLabels = useMemo<Record<Task['priority'], string>>(() => ({
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  }), []);

  const statusColors = useMemo<Record<Task['status'], string>>(() => ({
    TODO: 'bg-gray-100 text-gray-800',
    IN_PROGRESS: 'bg-blue-100 text-blue-800',
    REVIEW: 'bg-yellow-100 text-yellow-800',
    COMPLETED: 'bg-green-100 text-green-800'
  }), []);

  const translateStatus = (status: string) => statusLabels[status as Task['status']] || status.replace('_', ' ');
  const translatePriority = (priority: string) => priorityLabels[priority as Task['priority']] || priority;
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'TODO':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      case 'IN_PROGRESS':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'REVIEW':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => statusColors[status as Task['status']] || 'bg-gray-100 text-gray-800';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'LOW':
        return 'text-gray-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'URGENT':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có hạn chót';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {projectId && (
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                  title="Quay lại Dự án"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="page-title">Nhiệm vụ</h1>
                <p className="page-subtitle">
                  {projectId ? 'Nhiệm vụ dự án' : 'Tất cả nhiệm vụ'} - Quản lý và theo dõi công việc của bạn
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/kanban` : '/tasks/kanban')}
                className="btn-secondary"
              >
                Xem Kanban
              </button>
              {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                <button
                  onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/new` : '/tasks/new')}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo nhiệm vụ
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilter
          entityType="task"
          filters={advancedFilters}
          onFiltersChange={setAdvancedFilters}
          className="mb-6"
        />

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhiệm vụ..."
                      className="input pl-10 w-full text-sm min-h-[42px]"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: '', priority: '', assignees: [], dueDate: '', search: '', labelIds: [] });
                    setCurrentPage(1);
                  }}
                  className="btn-ghost whitespace-nowrap"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Filter Row 1: Status and Priority */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Status Filter */}
                <SelectDropdown
                  label="Trạng thái"
                  options={[
                    { id: '', fullName: 'Tất cả trạng thái' },
                    { id: 'TODO', fullName: 'Cần làm' },
                    { id: 'IN_PROGRESS', fullName: 'Đang thực hiện' },
                    { id: 'REVIEW', fullName: 'Đang xem xét' },
                    { id: 'COMPLETED', fullName: 'Hoàn thành' }
                  ]}
                  value={filters.status}
                  onChange={(status) => setFilters(prev => ({ ...prev, status }))}
                  placeholder="Tất cả trạng thái"
                />

                {/* Priority Filter */}
                <SelectDropdown
                  label="Mức độ ưu tiên"
                  options={[
                    { id: '', fullName: 'Tất cả mức độ ưu tiên' },
                    { id: 'LOW', fullName: 'Thấp' },
                    { id: 'MEDIUM', fullName: 'Trung bình' },
                    { id: 'HIGH', fullName: 'Cao' },
                    { id: 'URGENT', fullName: 'Khẩn cấp' }
                  ]}
                  value={filters.priority}
                  onChange={(priority) => setFilters(prev => ({ ...prev, priority }))}
                  placeholder="Tất cả mức độ ưu tiên"
                />
              </div>

              {/* Filter Row 2: Assignee and Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Assignee Filter - Multi-select with search */}
                {(user.role === 'ADMIN' || user.role === 'LECTURER' || projectId) && (
                  <UserFilterSelector
                    projectId={projectId}
                    selectedUsers={filters.assignees}
                    onSelectionChange={(userIds) => setFilters(prev => ({ ...prev, assignees: userIds }))}
                    multiple={true}
                    placeholder="Tất cả người được gán"
                    label="Người được gán"
                  />
                )}

                {/* Due Date Filter - Enhanced with preset options and custom date range */}
                <DueDateFilter
                  value={filters.dueDate}
                  onChange={(dueDate) => setFilters(prev => ({ ...prev, dueDate }))}
                  placeholder="Tất cả hạn chót"
                  label="Hạn chót"
                />
              </div>

              {/* Label Filter Row */}
              <div className="grid grid-cols-1 gap-4">
                <LabelFilter
                  projectId={projectId}
                  selectedLabelIds={filters.labelIds}
                  onSelectionChange={(labelIds) => setFilters(prev => ({ ...prev, labelIds }))}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Không thể tải danh sách nhiệm vụ</h3>
                <p className="text-gray-600">Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn-primary"
                >
                  Thử lại
                </button>
              </div>
            ) : tasks && tasks.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {tasks.map((task: Task) => (
                  <div
                    key={task.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            {getStatusIcon(task.status)}
                          </div>
                          <h3 className="font-medium text-gray-900 flex-1">{task.title}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(task.status)}`}>
                            {translateStatus(task.status)}
                          </span>
                          <span className={`text-sm font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                            {translatePriority(task.priority)}
                          </span>
                        </div>
                        
                        {task.description && (
                          <div className="text-gray-600 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: task.description }} />
                          </div>
                        )}
                        
                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {task.labels.map(label => (
                              <LabelChip key={label.id} label={label} size="sm" />
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span className="truncate">{task.assignee.fullName}</span>
                          </div>
                          <div className="flex items-center flex-shrink-0">
                            <Calendar className="w-4 h-4 mr-1" />
                            <span className={isOverdue(task.dueDate, task.status) ? 'text-red-600' : ''}>
                              {formatDate(task.dueDate)}
                            </span>
                          </div>
                          {!projectId && (
                            <div className="text-gray-400 truncate">
                              {task.project.title}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                        {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/tasks/${task.id}/edit`);
                              }}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTask(task.id, task.title);
                              }}
                              className="p-2 text-gray-400 hover:text-red-600 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhiệm vụ</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status || filters.priority || filters.assignees.length > 0 || filters.dueDate || filters.labelIds.length > 0
                    ? 'Thử điều chỉnh bộ lọc để xem thêm nhiệm vụ.'
                    : 'Bắt đầu bằng cách tạo nhiệm vụ đầu tiên.'}
                </p>
                {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                  <button
                    onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/new` : '/tasks/new')}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo nhiệm vụ đầu tiên
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              limit={pagination.limit}
              onPageChange={(page: number) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}
      </div>

  );
}
