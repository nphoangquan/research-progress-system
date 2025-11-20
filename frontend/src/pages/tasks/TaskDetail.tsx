import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import { useWebSocketEvents } from "../../hooks/useWebSocketEvents";
import TaskComments from "../../components/features/TaskComments";
import TaskAttachments from "../../components/features/TaskAttachments";
import TaskInfoSidebar from "../../components/features/TaskInfoSidebar";
import TaskAttachmentUploadModal from "../../components/features/TaskAttachmentUploadModal";
import TaskGradeSummary from "../../components/features/TaskGradeSummary";
import TaskGradeModal from "../../components/features/TaskGradeModal";
import {
  getStatusColor,
  getPriorityColor,
  formatDate,
  formatDateTime,
  isOverdue,
} from "../../utils/taskUtils";
import { sanitizeHTML } from "../../utils/sanitize";
import api from "../../lib/axios";
import type { Label } from "../../types/label";
import type { TaskGrade } from "../../types/task";
import toast from "react-hot-toast";
import { getErrorMessage } from '../../utils/errorUtils';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: "TODO" | "IN_PROGRESS" | "REVIEW" | "COMPLETED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  dueDate: string | null;
  completedAt: string | null;
  submissionContent: string | null;
  submittedAt: string | null;
  submittedBy: string | null;
  assignee: {
    id: string;
    fullName: string;
    email: string;
  };
  submittedByUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  project: {
    id: string;
    title: string;
    lecturerId?: string;
  };
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
  grade?: TaskGrade | null;
}

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  uploadedBy: string;
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  // WebSocket integration
  useWebSocketEvents({
    taskId: id,
    enableTaskEvents: true,
    enableCommentEvents: true,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    status: "",
    priority: "",
    assigneeId: "",
    dueDate: "",
  });

  // Fetch task data
  const {
    data: task,
    isLoading,
    isError,
    refetch,
  } = useQuery<TaskData>({
    queryKey: ["task", id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data.task;
    },
    enabled: !!id,
  });

  // Fetch comments
  const { data: comments } = useQuery<Comment[]>({
    queryKey: ["task-comments", id],
    queryFn: async () => {
      const response = await api.get(`/comments/task/${id}`);
      return response.data.comments;
    },
    enabled: !!id,
  });

  // Fetch attachments
  const { data: attachments } = useQuery<Attachment[]>({
    queryKey: ["task-attachments", id],
    queryFn: async () => {
      const response = await api.get(`/task-attachments/${id}`);
      return response.data.attachments;
    },
    enabled: !!id,
  });

  // Fetch users for assignee dropdown (only for admin/lecturer)
  const { data: users } = useQuery<any[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data.users;
    },
    enabled: user?.role === "ADMIN" || user?.role === "LECTURER",
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task", id] });
      setIsEditing(false);
      toast.success("Cập nhật nhiệm vụ thành công!");
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Cập nhật nhiệm vụ thất bại'));
    },
  });

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Xóa nhiệm vụ thành công!");
      navigate(
        task?.project?.id ? `/projects/${task.project.id}/tasks` : "/tasks"
      );
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Xóa nhiệm vụ thất bại'));
    },
  });

  // Populate editData when task is loaded
  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title || "",
        description: task.description || "",
        status: task.status || "",
        priority: task.priority || "",
        assigneeId: task.assignee?.id || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
      });
    }
  }, [task]);

  const sanitizedSubmissionContent = useMemo(() => {
    if (!task?.submissionContent) {
      return "";
    }
    return sanitizeHTML(task.submissionContent);
  }, [task?.submissionContent]);

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/task-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-attachments", id] });
      toast.success("Xóa tệp đính kèm thành công!");
    },
    onError: (err: any) => {
      toast.error(getErrorMessage(err, "Xóa tệp đính kèm thất bại"));
    },
  });

  const handleEdit = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || "",
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id || "",
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTaskMutation.mutate(editData);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tệp đính kèm này?")) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      toast.error("Tải xuống tệp thất bại");
    }
  };

  if (isLoading) {
    return (
      <div className="w-full">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full">
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">
              Không thể tải nhiệm vụ
            </h3>
            <p className="text-gray-600">
              Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
            </p>
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

  if (!task) {
  return (
      <div className="w-full">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Không tìm thấy nhiệm vụ
            </h3>
            <p className="text-gray-600 mb-6">
              Nhiệm vụ bạn đang tìm không tồn tại hoặc bạn không có quyền truy
              cập.
            </p>
            <button onClick={() => navigate("/tasks")} className="btn-primary">
              Quay lại Danh sách Nhiệm vụ
            </button>
          </div>
      </div>
    );
  }

  const canManageGrade =
    user?.role === "ADMIN" ||
    (user?.role === "LECTURER" && task.project?.lecturerId === user.id);

  return (
    <div className="w-full">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // Always navigate back to global tasks for admin TaskDetail
                  navigate("/tasks");
                }}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="page-title">
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.title}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          title: e.target.value,
                        }))
                      }
                      className="bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    task.title
                  )}
                </h1>
                <p className="page-subtitle">
                  {task.project?.title} • Tạo {formatDateTime(task.createdAt)}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {(user?.role === "ADMIN" || user?.role === "LECTURER") && (
                <>
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-secondary"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateTaskMutation.isPending}
                        className="btn-primary"
                      >
                        Lưu
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={handleEdit} className="btn-secondary">
                        <Edit className="w-4 h-4 mr-2" />
                        Chỉnh sửa
                      </button>
                      <button
                        onClick={() => deleteTaskMutation.mutate()}
                        disabled={deleteTaskMutation.isPending}
                        className="btn-danger"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Xóa
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <TaskGradeSummary
              grade={task.grade}
              canManage={Boolean(canManageGrade)}
              onManage={() => setShowGradeModal(true)}
              formatDateTime={formatDateTime}
            />

            {/* Task Details */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">
                  Chi tiết nhiệm vụ
                </h2>
              </div>
              <div className="card-body">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Mô tả
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) =>
                        setEditData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      className="input"
                      rows={4}
                      placeholder="Thêm mô tả..."
                    />
                  ) : (
                    <div className="text-gray-600">
                      {task.description ? (
                        <p>{task.description}</p>
                      ) : (
                        <p>Chưa có mô tả.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <TaskComments
                  taskId={id!}
                  comments={comments}
                  currentUserId={user?.id}
                />
              </div>
            </div>

            {/* Task Submission Display (for Admin/Lecturer) */}
            {task.submissionContent && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Nộp bài của sinh viên
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Nộp bởi:{" "}
                    {task.submittedByUser?.fullName || "Không xác định"} vào{" "}
                    {task.submittedAt
                      ? new Date(task.submittedAt).toLocaleString("vi-VN")
                      : "Không xác định"}
                  </div>
                </div>
                <div className="card-body">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: sanitizedSubmissionContent,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <TaskAttachments
              taskId={id!}
              attachments={attachments}
              currentUserId={user?.id}
              userRole={user?.role}
              onUploadClick={() => setShowUploadModal(true)}
              onDownload={handleDownloadFile}
              onDelete={handleDeleteAttachment}
            />
          </div>

          {/* Sidebar */}
          <TaskInfoSidebar
            task={task}
            isEditing={isEditing}
            editData={editData}
            onEditDataChange={(data) =>
              setEditData((prev) => ({ ...prev, ...data }))
            }
            users={users}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            isOverdue={isOverdue}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        </div>

        {/* Upload Attachment Modal */}
        <TaskAttachmentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          taskId={id!}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["task-attachments", id],
            });
          }}
        />

        <TaskGradeModal
          open={showGradeModal}
          onClose={() => setShowGradeModal(false)}
          taskId={id!}
          grade={task.grade}
          onSuccess={() => {
            refetch();
            queryClient.invalidateQueries({ queryKey: ["task", id] });
          }}
        />
    </div>
  );
}
