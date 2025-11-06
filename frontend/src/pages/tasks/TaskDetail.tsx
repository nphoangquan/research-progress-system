import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import DatePicker from '../../components/ui/DatePicker';
import LabelChip from '../../components/ui/LabelChip';
import api from '../../lib/axios';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  MessageSquare,
  Paperclip,
  Send,
  Download,
  Plus,
  X
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
    enableCommentEvents: true
  });

  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescriptions, setUploadDescriptions] = useState<string[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [, setUploadError] = useState<string | null>(null);
  const [isMultipleUpload, setIsMultipleUpload] = useState(false);
  const [globalDescription, setGlobalDescription] = useState('');
  const [expandedFileDescriptions, setExpandedFileDescriptions] = useState<number[]>([]);
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

  // Fetch users for assignee dropdown (only for admin/lecturer)
  const { data: users } = useQuery<any[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users;
    },
    enabled: user?.role === 'ADMIN' || user?.role === 'LECTURER',
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
      toast.success('Task updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update task');
    },
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await api.post(`/comments/task/${id}`, { content });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
      setNewComment('');
      toast.success('Comment added!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to add comment');
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const response = await api.delete(`/comments/${commentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', id] });
      toast.success('Comment deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete comment');
    },
  });

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm('Are you sure you want to delete this comment?')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task deleted successfully!');
      navigate(task?.project?.id ? `/projects/${task.project.id}/tasks` : '/tasks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete task');
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

  // Upload attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (data: { file: File; description?: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      const response = await api.post(`/task-attachments/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      toast.success('Attachment uploaded successfully!');
      setUploadProgress(0);
      setUploadError(null);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Failed to upload attachment';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
    },
  });

  // Upload multiple attachments mutation
  const uploadMultipleAttachmentsMutation = useMutation({
    mutationFn: async (data: { files: File[]; descriptions: string[] }) => {
      const formData = new FormData();
      
      // Append all files
      data.files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Append descriptions as JSON array
      if (data.descriptions.length > 0) {
        formData.append('descriptions', JSON.stringify(data.descriptions));
      }
      
      const response = await api.post(`/task-attachments/${id}/upload-multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      toast.success(`Successfully uploaded ${data.attachments.length} files!`);
      if (data.failedUploads && data.failedUploads.length > 0) {
        toast.error(`${data.failedUploads.length} files failed to upload`);
      }
      setUploadProgress(0);
      setUploadError(null);
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Failed to upload attachments';
      setUploadError(errorMessage);
      toast.error(errorMessage);
      setUploadProgress(0);
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async (attachmentId: string) => {
      await api.delete(`/task-attachments/${attachmentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', id] });
      toast.success('Attachment deleted successfully!');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Failed to delete attachment');
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'TODO':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

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
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  const handleEdit = () => {
    if (task) {
      setEditData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        assigneeId: task.assignee.id,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    updateTaskMutation.mutate(editData);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Validate each file
      const allowedTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        // Images
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ];

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      fileArray.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(file.name);
        } else if (file.size > 25 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast.error(`Invalid files: ${invalidFiles.join(', ')}`);
      }

      if (validFiles.length > 0) {
        if (isMultipleUpload) {
          setUploadFiles(prev => [...prev, ...validFiles]);
          setUploadDescriptions(prev => [...prev, ...new Array(validFiles.length).fill('')]);
        } else {
          setUploadFile(validFiles[0]);
        }
      }
    }
  };

  const handleMultipleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      
      // Validate each file
      const allowedTypes = [
        // Documents
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        // Images
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'image/gif',
        'image/webp',
        // Excel
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        // Archives
        'application/zip',
        'application/x-rar-compressed',
        'application/x-7z-compressed'
      ];

      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      fileArray.forEach(file => {
        if (!allowedTypes.includes(file.type)) {
          invalidFiles.push(file.name);
        } else if (file.size > 25 * 1024 * 1024) {
          invalidFiles.push(`${file.name} (too large)`);
        } else {
          validFiles.push(file);
        }
      });

      if (invalidFiles.length > 0) {
        toast.error(`Invalid files: ${invalidFiles.join(', ')}`);
      }

      if (validFiles.length > 0) {
        setUploadFiles(prev => [...prev, ...validFiles]);
        setUploadDescriptions(prev => [...prev, ...new Array(validFiles.length).fill('')]);
      }
    }
  };

  const handleUploadAttachment = () => {
    if (uploadFile && id) {
      setUploadProgress(0);
      uploadAttachmentMutation.mutate({
        file: uploadFile,
        description: uploadDescription || undefined
      });
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadDescription('');
      setIsDragOver(false);
    }
  };

  const handleMultipleUploadAttachment = () => {
    if (uploadFiles.length > 0 && id) {
      setUploadProgress(0);
      
      // Use global description if provided, otherwise use individual descriptions
      const finalDescriptions = globalDescription 
        ? uploadFiles.map(() => globalDescription)
        : uploadDescriptions;
      
      uploadMultipleAttachmentsMutation.mutate({
        files: uploadFiles,
        descriptions: finalDescriptions
      });
      setShowUploadModal(false);
      setUploadFiles([]);
      setUploadDescriptions([]);
      setGlobalDescription('');
      setExpandedFileDescriptions([]);
      setIsDragOver(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = uploadFiles.filter((_, i) => i !== index);
    const newDescriptions = uploadDescriptions.filter((_, i) => i !== index);
    setUploadFiles(newFiles);
    setUploadDescriptions(newDescriptions);
  };

  const handleDescriptionChange = (index: number, description: string) => {
    const newDescriptions = [...uploadDescriptions];
    newDescriptions[index] = description;
    setUploadDescriptions(newDescriptions);
  };

  const toggleFileDescription = (index: number) => {
    setExpandedFileDescriptions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (confirm('Are you sure you want to delete this attachment?')) {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      if (isMultipleUpload) {
        handleMultipleFileSelect({ target: { files: droppedFiles } } as any);
      } else {
        handleFileSelect({ target: { files: [droppedFiles[0]] } } as any);
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="container py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Task not found</h3>
            <p className="text-gray-600 mb-6">The task you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/tasks')}
              className="btn-primary"
            >
              Back to Tasks
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user!} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  // Always navigate back to global tasks for admin TaskDetail
                  navigate('/tasks');
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
                      onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                      className="bg-transparent border-b border-gray-300 focus:border-primary-500 outline-none"
                    />
                  ) : (
                    task.title
                  )}
                </h1>
                <p className="page-subtitle">
                  {task.project?.title} • Created {formatDateTime(task.createdAt)}
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
                        Cancel
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={updateTaskMutation.isPending}
                        className="btn-primary"
                      >
                        Save
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handleEdit}
                        className="btn-secondary"
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTaskMutation.mutate()}
                        disabled={deleteTaskMutation.isPending}
                        className="btn-danger"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Task Details */}
            <div className="card">
              <div className="card-header">
                <h2 className="text-xl font-semibold text-gray-900">Task Details</h2>
              </div>
              <div className="card-body">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
                  {isEditing ? (
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                      className="input"
                      rows={4}
                      placeholder="Add a description..."
                    />
                  ) : (
                    <div className="text-gray-600">
                      {task.description ? (
                        <p>{task.description}</p>
                      ) : (
                        <p>No description provided.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Comments */}
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Comments ({comments?.length || 0})
                  </h3>
                  
                  {/* Add Comment */}
                  <div className="mb-6">
                    <div className="flex space-x-3">
                      <div className="flex-1">
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Add a comment..."
                          rows={3}
                          className="input"
                        />
                      </div>
                      <button
                        onClick={handleAddComment}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="btn-primary self-start"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments?.map((comment: Comment) => (
                      <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {comment.author.fullName}
                              </span>
                              <span className="text-sm text-gray-500">
                                {formatDateTime(comment.createdAt)}
                              </span>
                            </div>
                            <p className="text-gray-700">{comment.content}</p>
                          </div>
                          {/* Show delete button only for own comments */}
                          {comment.author.id === user?.id && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={deleteCommentMutation.isPending}
                              className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                              title="Delete comment"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {(!comments || comments.length === 0) && (
                      <p className="text-gray-500 text-center py-4">
                        No comments yet. Be the first to comment!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Task Submission Display (for Admin/Lecturer) */}
            {task.submissionContent && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                    Student Submission
                  </h3>
                  <div className="text-sm text-gray-600 mt-1">
                    Submitted by: {task.submittedByUser?.fullName || 'Unknown'} on{' '}
                    {task.submittedAt ? new Date(task.submittedAt).toLocaleString() : 'Unknown date'}
                  </div>
                </div>
                <div className="card-body">
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="prose prose-sm max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: task.submissionContent }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Attachments */}
            <div className="card">
              <div className="card-header">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    Attachments ({attachments?.length || 0})
                  </h2>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload File
                  </button>
                </div>
              </div>
              <div className="card-body">
                {attachments && attachments.length > 0 ? (
                  <div className="space-y-3">
                    {attachments.map((attachment: Attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploader.fullName}
                            </p>
                            {attachment.description && (
                              <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadFile(attachment.fileUrl, attachment.fileName)}
                            className="btn-ghost p-2 text-green-600 hover:text-green-800"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          {(user?.role === 'ADMIN' || user?.role === 'LECTURER' || attachment.uploadedBy === user?.id) && (
                            <button
                              onClick={() => handleDeleteAttachment(attachment.id)}
                              className="btn-ghost p-2 text-red-600 hover:text-red-800"
                              title="Delete File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Paperclip className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No attachments yet</p>
                    <p className="text-sm">Upload files to share with your team</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Task Info */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Task Info</h3>
              </div>
              <div className="card-body space-y-4">
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  {isEditing ? (
                    <SelectDropdown
                      label=""
                      options={[
                        { id: 'TODO', fullName: 'To Do' },
                        { id: 'IN_PROGRESS', fullName: 'In Progress' },
                        { id: 'REVIEW', fullName: 'Review' },
                        { id: 'COMPLETED', fullName: 'Completed' }
                      ]}
                      value={editData.status}
                      onChange={(status) => setEditData(prev => ({ ...prev, status }))}
                      placeholder="Select status..."
                    />
                  ) : (
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                  {isEditing ? (
                    <SelectDropdown
                      label=""
                      options={[
                        { id: 'LOW', fullName: 'Low' },
                        { id: 'MEDIUM', fullName: 'Medium' },
                        { id: 'HIGH', fullName: 'High' },
                        { id: 'URGENT', fullName: 'Urgent' }
                      ]}
                      value={editData.priority}
                      onChange={(priority) => setEditData(prev => ({ ...prev, priority }))}
                      placeholder="Select priority..."
                    />
                  ) : (
                    <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority}
                    </span>
                  )}
                </div>

                {/* Assignee */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assignee</label>
                  {isEditing ? (
                    <SelectDropdown
                      label=""
                      options={users?.map((user: any) => ({
                        id: user.id,
                        fullName: user.fullName
                      })) || []}
                      value={editData.assigneeId}
                      onChange={(assigneeId) => setEditData(prev => ({ ...prev, assigneeId }))}
                      placeholder="Select assignee..."
                    />
                  ) : (
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-900">{task.assignee.fullName}</span>
                    </div>
                  )}
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                  {isEditing ? (
                    <DatePicker
                      value={editData.dueDate || null}
                      onChange={(value) => setEditData(prev => ({ ...prev, dueDate: value || '' }))}
                      placeholder="Select due date (optional)"
                    />
                  ) : (
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                      <span className={`text-sm ${isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Labels */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Labels</label>
                  {task.labels && task.labels.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {task.labels.map(label => (
                        <LabelChip key={label.id} label={label} size="sm" />
                      ))}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No labels</span>
                  )}
                </div>

                {/* Created Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Created</label>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 text-gray-400 mr-2" />
                    <span className="text-sm text-gray-900">
                      {formatDateTime(task.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Completed Date */}
                {task.completedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Completed</label>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm text-gray-900">
                        {formatDateTime(task.completedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Upload Attachment Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
              {/* Fixed Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-gray-900">Upload Attachment</h3>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Single</span>
                    <button
                      onClick={() => {
                        setIsMultipleUpload(!isMultipleUpload);
                        setUploadFile(null);
                        setUploadFiles([]);
                        setUploadDescriptions([]);
                      }}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isMultipleUpload ? 'bg-primary-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isMultipleUpload ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                    <span className="text-sm text-gray-600">Multiple</span>
                  </div>
                </div>
              </div>
              
              {/* Scrollable Content */}
              <div className="p-6 flex-1 overflow-y-auto">
                <div className="space-y-4">
                  {/* Drag & Drop Area */}
                  <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                      isDragOver
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <div className="space-y-2">
                      <Paperclip className="w-8 h-8 text-gray-400 mx-auto" />
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-primary-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX, TXT, Images, Excel, Archives (max 25MB each)
                          {isMultipleUpload && ' • Up to 10 files'}
                        </p>
                      </div>
                    </div>
                    
                    <input
                      type="file"
                      onChange={isMultipleUpload ? handleMultipleFileSelect : handleFileSelect}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.zip,.rar,.7z"
                      multiple={isMultipleUpload}
                      className="hidden"
                      id="file-upload"
                    />
                    <label
                      htmlFor="file-upload"
                      className="mt-3 inline-block btn-secondary cursor-pointer"
                    >
                      Choose {isMultipleUpload ? 'Files' : 'File'}
                    </label>
                  </div>

                  {/* Single File Preview */}
                  {!isMultipleUpload && uploadFile && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{uploadFile.name}</p>
                            <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setUploadFile(null)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="mt-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          value={uploadDescription}
                          onChange={(e) => setUploadDescription(e.target.value)}
                          placeholder="Add a description for this file..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          rows={2}
                        />
                      </div>
                    </div>
                  )}

                  {/* Multiple Files Preview */}
                  {isMultipleUpload && uploadFiles.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-700">Selected Files ({uploadFiles.length})</h4>
                        {uploadFiles.length > 5 && (
                          <div className="text-xs text-gray-500">
                            Scroll to see all files
                          </div>
                        )}
                      </div>
                      
                      {/* Compact File List with Scroll */}
                      <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                        {uploadFiles.map((file, index) => (
                          <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 flex-1 min-w-0">
                                <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium text-gray-900 truncate" title={file.name}>
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2 flex-shrink-0">
                                <button
                                  onClick={() => toggleFileDescription(index)}
                                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                                  title="Add description"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleRemoveFile(index)}
                                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                                  title="Remove file"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Expandable Description */}
                            {expandedFileDescriptions.includes(index) && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                  Description (optional)
                                </label>
                                <textarea
                                  value={uploadDescriptions[index] || ''}
                                  onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                  placeholder="Add a description for this file..."
                                  className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                                  rows={2}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      
                      {/* Global Description Option */}
                      {uploadFiles.length > 3 && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <label className="block text-sm font-medium text-blue-900 mb-2">
                            Global Description (applies to all files)
                          </label>
                          <textarea
                            value={globalDescription}
                            onChange={(e) => setGlobalDescription(e.target.value)}
                            placeholder="Add a description that applies to all files..."
                            className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                {/* Upload Progress */}
                {(uploadAttachmentMutation.isPending || uploadMultipleAttachmentsMutation.isPending) && (
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadFile(null);
                      setUploadFiles([]);
                      setUploadDescriptions([]);
                      setUploadDescription('');
                      setGlobalDescription('');
                      setExpandedFileDescriptions([]);
                      setIsDragOver(false);
                      setUploadProgress(0);
                      setUploadError(null);
                    }}
                    className="btn-secondary"
                    disabled={uploadAttachmentMutation.isPending || uploadMultipleAttachmentsMutation.isPending}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isMultipleUpload ? handleMultipleUploadAttachment : handleUploadAttachment}
                    className="btn-primary"
                    disabled={
                      (isMultipleUpload ? uploadFiles.length === 0 : !uploadFile) ||
                      uploadAttachmentMutation.isPending ||
                      uploadMultipleAttachmentsMutation.isPending
                    }
                  >
                    {isMultipleUpload ? `Upload ${uploadFiles.length} Files` : 'Upload File'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}