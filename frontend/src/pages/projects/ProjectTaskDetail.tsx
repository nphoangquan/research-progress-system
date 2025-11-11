import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents';
import Navbar from '../../components/layout/Navbar';
import TaskComments from '../../components/features/TaskComments';
import TaskAttachments from '../../components/features/TaskAttachments';
import TaskInfoSidebar from '../../components/features/TaskInfoSidebar';
import TaskSubmissionModal from '../../components/features/TaskSubmissionModal';
import TaskAttachmentUploadModal from '../../components/features/TaskAttachmentUploadModal';
import { getStatusColor, getPriorityColor, formatDate, formatDateTime, isOverdue } from '../../utils/taskUtils';
import api from '../../lib/axios';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  CheckCircle,
  User,
  Clock
} from 'lucide-react';

interface TaskData {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
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
  };
  labels?: Label[];
  createdAt: string;
  updatedAt: string;
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

export default function ProjectTaskDetail() {
  const { id, projectId } = useParams<{ id: string; projectId: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  // WebSocket integration
  useWebSocketEvents({
    taskId: id,
    enableTaskEvents: true,
    enableCommentEvents: true
  });

  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigneeId: '',
    dueDate: ''
  });

  // Fetch task data
  const { data: task, isLoading } = useQuery<TaskData>({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data.task;
    },
    enabled: !!id,
  });

  // Fetch comments
  const { data: comments } = useQuery<Comment[]>({
    queryKey: ['task-comments', id],
    queryFn: async () => {
      const response = await api.get(`/comments/task/${id}`);
      return response.data.comments;
    },
    enabled: !!id,
  });

  // Fetch attachments
  const { data: attachments } = useQuery<Attachment[]>({
    queryKey: ['task-attachments', id],
    queryFn: async () => {
      const response = await api.get(`/task-attachments/${id}`);
      return response.data.attachments;
    },
    enabled: !!id,
  });

  // Fetch project members for assignee dropdown (only for admin/lecturer)
  const { data: projectMembers } = useQuery<any[]>({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await api.get(`/projects/${projectId}`);
      const project = response.data.project;
      
      // Get lecturer and students
      const members = [];
      if (project.lecturer) {
        members.push({
          id: project.lecturer.id,
          fullName: project.lecturer.fullName,
          email: project.lecturer.email,
          role: 'LECTURER'
        });
      }
      if (project.students) {
        project.students.forEach((student: any) => {
          members.push({
            id: student.student.id,
            fullName: student.student.fullName,
            email: student.student.email,
            role: 'STUDENT'
          });
        });
      }
      return members;
    },
    enabled: (user?.role === 'ADMIN' || user?.role === 'LECTURER') && !!projectId,
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      setIsEditing(false);
      toast.success('Cập nhật nhiệm vụ thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Cập nhật nhiệm vụ thất bại');
    },
  });


  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Xóa nhiệm vụ thành công!');
      navigate(`/projects/${projectId}/tasks`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Xóa nhiệm vụ thất bại');
    },
  });

  // Populate editData when task is loaded
  useEffect(() => {
    if (task) {
      setEditData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || '',
        priority: task.priority || '',
        assigneeId: task.assignee?.id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [task]);


  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/task-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      toast.success('Xóa tệp đính kèm thành công!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Xóa tệp đính kèm thất bại');
    },
  });



  const handleEdit = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee?.id || '',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTaskMutation.mutate(editData);
  };



  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm('Bạn có chắc chắn muốn xóa tệp đính kèm này?')) {
      deleteAttachmentMutation.mutate(attachmentId);
    }
  };

  const handleDownloadFile = async (fileUrl: string, fileName: string) => {
    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast.error('Failed to download file');
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy nhiệm vụ</h3>
            <p className="text-gray-600 mb-6">Nhiệm vụ bạn đang tìm không tồn tại hoặc bạn không có quyền truy cập.</p>
            <button
              onClick={() => navigate(`/projects/${projectId}/tasks`)}
              className="btn-primary"
            >
              Quay lại Nhiệm vụ dự án
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user!} />
      
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(`/projects/${projectId}/tasks`)}
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
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
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
              {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
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
                      <button
                        onClick={handleEdit}
                        className="btn-secondary"
                      >
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
            {/* Task Details */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Chi tiết nhiệm vụ</h2>
              </div>
              <div className="card-body">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Mô tả</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
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

            {/* Submission History */}
            {task.submissionContent && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-500" />
                    Lịch sử nộp bài
                  </h2>
                </div>
                <div className="card-body">
                  <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="w-4 h-4" />
                          <span>Nộp bởi: <span className="font-medium text-gray-900">{task.submittedByUser?.fullName || 'Không xác định'}</span></span>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>Nộp vào: <span className="font-medium text-gray-900">{task.submittedAt ? formatDateTime(task.submittedAt) : 'Không xác định'}</span></span>
                        </div>
                      </div>
                      <button
                        onClick={() => setShowSubmissionModal(true)}
                        className="btn-secondary text-sm"
                      >
                        Xem chi tiết đầy đủ
                      </button>
                    </div>
                    
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-3">Xem trước nộp bài:</p>
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-hidden">
                        <div 
                          className="text-sm text-gray-700 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ 
                            __html: task.submissionContent.substring(0, 300) + (task.submissionContent.length > 300 ? '...' : '')
                          }}
                        />
                      </div>
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
              taskSubmission={{
                content: task.submissionContent,
                submittedAt: task.submittedAt,
                submittedBy: task.submittedBy
              }}
              taskDueDate={task.dueDate}
              onSubmissionSuccess={() => {
                queryClient.invalidateQueries({ queryKey: ['task', id] });
              }}
            />
          </div>

          {/* Sidebar */}
          <TaskInfoSidebar
            task={task}
            isEditing={isEditing}
            editData={editData}
            onEditDataChange={(data) => setEditData(prev => ({ ...prev, ...data }))}
            projectMembers={projectMembers}
            getStatusColor={getStatusColor}
            getPriorityColor={getPriorityColor}
            isOverdue={isOverdue}
            formatDate={formatDate}
            formatDateTime={formatDateTime}
          />
        </div>

        {/* Submission Details Modal */}
        <TaskSubmissionModal
          isOpen={showSubmissionModal && !!task.submissionContent}
          onClose={() => setShowSubmissionModal(false)}
          submissionContent={task.submissionContent || ''}
          submittedByUser={task.submittedByUser}
          submittedAt={task.submittedAt}
          attachments={attachments}
          onDownload={handleDownloadFile}
        />

        {/* Upload Attachment Modal */}
        <TaskAttachmentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          taskId={id!}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
          }}
        />
      </div>
    </div>
  );
}