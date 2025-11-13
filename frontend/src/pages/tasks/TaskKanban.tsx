import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '../../hooks/useAuth';
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents';
import UserFilterSelector from '../../components/ui/UserFilterSelector';
import LabelFilter from '../../components/ui/LabelFilter';
import LabelChip from '../../components/ui/LabelChip';
import api from '../../lib/axios';
import type { Label } from '../../types/label';
import toast from "react-hot-toast";
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
  ArrowLeft,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
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

interface KanbanColumn {
  id: string;
  title: string;
  status: string;
  color: string;
  icon: React.ReactNode;
}

const columns: KanbanColumn[] = [
  {
    id: "todo",
    title: "Cần làm",
    status: "TODO",
    color: "bg-gray-100 text-gray-800",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "in-progress",
    title: "Đang thực hiện",
    status: "IN_PROGRESS",
    color: "bg-blue-100 text-blue-800",
    icon: <Clock className="w-4 h-4" />,
  },
  {
    id: "review",
    title: "Đang xem xét",
    status: "REVIEW",
    color: "bg-yellow-100 text-yellow-800",
    icon: <AlertCircle className="w-4 h-4" />,
  },
  {
    id: "completed",
    title: "Hoàn thành",
    status: "COMPLETED",
    color: "bg-green-100 text-green-800",
    icon: <CheckCircle className="w-4 h-4" />,
  },
];

export default function TaskKanban() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  // Must call hooks before any conditional returns
  // WebSocket integration
  useWebSocketEvents({
    projectId: projectId,
    enableTaskEvents: true,
    enableCommentEvents: false
  });

  const [filters, setFilters] = useState({
    assignees: [] as string[],
    search: "",
    labelIds: [] as string[]
  });

  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    task: Task;
    newStatus: string;
  } | null>(null);

  // Fetch tasks
  const { data: tasks, isLoading, isError, refetch } = useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      filters.assignees.forEach(assignee => params.append("assignee", assignee));
      if (filters.search) params.append("search", filters.search);
      if (filters.labelIds.length > 0) {
        filters.labelIds.forEach(labelId => params.append('labelIds', labelId));
      }

      const response = await api.get(`/tasks?${params.toString()}`);
      return response.data.tasks;
    },
  });

  // Update task status mutation
  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({
      taskId,
      status,
    }: {
      taskId: string;
      status: string;
    }) => {
      const response = await api.put(`/tasks/${taskId}`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Cập nhật trạng thái nhiệm vụ thành công!");
    },
    onError: (error: any) => {
      toast.error(
        getErrorMessage(error, 'Cập nhật trạng thái nhiệm vụ thất bại')
      );
    },
  });

  const priorityLabels = useMemo<Record<Task['priority'], string>>(() => ({
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  }), []);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "LOW":
        return "text-gray-600";
      case "MEDIUM":
        return "text-yellow-600";
      case "HIGH":
        return "text-orange-600";
      case "URGENT":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit'
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === "COMPLETED") return false;
    return new Date(dueDate) < new Date();
  };

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.status !== newStatus) {
      // Show confirmation modal instead of directly updating
      setPendingStatusChange({
        task: draggedTask,
        newStatus: newStatus,
      });
      setShowConfirmModal(true);
    }
    setDraggedTask(null);
  };

  const handleConfirmStatusChange = () => {
    if (pendingStatusChange) {
      updateTaskStatusMutation.mutate({
        taskId: pendingStatusChange.task.id,
        status: pendingStatusChange.newStatus,
      });
    }
    setShowConfirmModal(false);
    setPendingStatusChange(null);
  };

  const handleCancelStatusChange = () => {
    setShowConfirmModal(false);
    setPendingStatusChange(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks?.filter((task: Task) => task.status === status) || [];
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải bảng Kanban...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full">
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Không thể tải bảng Kanban</h3>
          <p className="text-gray-600">Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  const translateStatus = (status: Task['status']) => columns.find(col => col.status === status)?.title || status;

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
                <h1 className="page-title">Bảng Kanban</h1>
                <p className="page-subtitle">
                  {projectId ? "Nhiệm vụ dự án" : "Tất cả nhiệm vụ"} - Kéo và thả để
                  quản lý quy trình làm việc
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() =>
                  navigate(
                    projectId ? `/projects/${projectId}/tasks` : "/tasks"
                  )
                }
                className="btn-secondary"
              >
                Xem Danh sách
              </button>
              <button
                onClick={() =>
                  navigate(
                    projectId
                      ? `/projects/${projectId}/tasks/new`
                      : "/tasks/new"
                  )
                }
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo nhiệm vụ
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body p-4">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm nhiệm vụ..."
                      className="input pl-10 w-full text-sm min-h-[42px]"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ assignees: [], search: "", labelIds: [] })}
                  className="btn-ghost whitespace-nowrap h-10 px-4"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Assignee Filter Row - Only show for Admin/Lecturer or when projectId is provided */}
              {(user.role === 'ADMIN' || user.role === 'LECTURER' || projectId) && (
                <div className="flex justify-start">
                  <div className="w-full sm:w-64">
                    <UserFilterSelector
                      projectId={projectId}
                      selectedUsers={filters.assignees}
                      onSelectionChange={(userIds: string[]) => setFilters(prev => ({ ...prev, assignees: userIds }))}
                      multiple={true}
                      placeholder="Tất cả người được gán"
                      className="w-full"
                      label="Người được gán"
                    />
                  </div>
                </div>
              )}

              {/* Label Filter Row */}
              <div className="flex justify-start">
                <div className="w-full">
                  <LabelFilter
                    projectId={projectId}
                    selectedLabelIds={filters.labelIds}
                    onSelectionChange={(labelIds) => setFilters(prev => ({ ...prev, labelIds }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {columns.map((column) => {
            const columnTasks = getTasksByStatus(column.status);

            return (
              <div
                key={column.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                {/* Column Header */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center space-x-2">
                    {column.icon}
                    <h3 className="font-medium text-gray-900">
                      {column.title}
                    </h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Column Tasks */}
                <div className="p-4 space-y-3 min-h-[400px]">
                  {columnTasks.map((task: Task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task)}
                      onClick={() => navigate(
                        projectId 
                          ? `/projects/${projectId}/tasks/${task.id}` 
                          : `/tasks/${task.id}`
                      )}
                      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
                          {task.title}
                        </h4>
                        <div className="flex items-center space-x-1">
                          <span
                            className={`text-xs font-medium ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {priorityLabels[task.priority]}
                          </span>
                          {(user.role === "ADMIN" ||
                            user.role === "LECTURER") && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(
                                  projectId 
                                    ? `/projects/${projectId}/tasks/${task.id}/edit` 
                                    : `/tasks/${task.id}/edit`
                                );
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {task.description && (
                        <div className="text-gray-600 text-xs mb-2 line-clamp-2 prose prose-sm max-w-none">
                          <div dangerouslySetInnerHTML={{ __html: task.description }} />
                        </div>
                      )}

                      {/* Labels */}
                      {task.labels && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {task.labels.map(label => (
                            <LabelChip key={label.id} label={label} size="sm" />
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center">
                          <User className="w-3 h-3 mr-1" />
                          {task.assignee.fullName}
                        </div>
                        {task.dueDate && (
                          <div
                            className={`flex items-center ${
                              isOverdue(task.dueDate, task.status)
                                ? "text-red-600"
                                : ""
                            }`}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(task.dueDate)}
                          </div>
                        )}
                      </div>

                      {!projectId && (
                        <div className="mt-2 text-xs text-gray-400">
                          {task.project.title}
                        </div>
                      )}
                    </div>
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        {column.icon}
                      </div>
                      <p className="text-sm">Không có nhiệm vụ</p>
                    </div>
                  )}
                </div>

                </div>
    );
})}
        </div>

        {/* Empty State */}
        {tasks && tasks.length === 0 && (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy nhiệm vụ
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.assignees.length > 0 || filters.labelIds.length > 0
                  ? "Thử điều chỉnh bộ lọc để xem thêm nhiệm vụ."
                  : "Bắt đầu bằng cách tạo nhiệm vụ đầu tiên."}
              </p>
              <button
                onClick={() =>
                  navigate(
                    projectId
                      ? `/projects/${projectId}/tasks/new`
                      : "/tasks/new"
                  )
                }
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tạo nhiệm vụ
              </button>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && pendingStatusChange && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-blue-500 mr-3" />
                <h3 className="text-lg font-medium text-gray-900">
                  Xác nhận Thay đổi Trạng thái
                </h3>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-3">
                  Bạn có chắc chắn muốn di chuyển nhiệm vụ này?
                </p>
                
                <div className="bg-gray-50 p-3 rounded-lg mb-3">
                  <h4 className="font-medium text-gray-900 mb-1">
                    {pendingStatusChange.task.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {pendingStatusChange.task.description}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Từ:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pendingStatusChange.task.status === 'TODO' ? 'bg-gray-100 text-gray-800' :
                      pendingStatusChange.task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      pendingStatusChange.task.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {translateStatus(pendingStatusChange.task.status)}
                    </span>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-2">Đến:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      pendingStatusChange.newStatus === 'TODO' ? 'bg-gray-100 text-gray-800' :
                      pendingStatusChange.newStatus === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      pendingStatusChange.newStatus === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {translateStatus(pendingStatusChange.newStatus as Task['status'])}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelStatusChange}
                  className="btn-secondary"
                  disabled={updateTaskStatusMutation.isPending}
                >
                  Hủy
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="btn-primary"
                  disabled={updateTaskStatusMutation.isPending}
                >
                  {updateTaskStatusMutation.isPending ? 'Đang cập nhật...' : 'Xác nhận'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
