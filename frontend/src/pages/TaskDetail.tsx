import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import SelectDropdown from '../components/SelectDropdown';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  Paperclip,
  Send,
  MoreVertical,
  Download,
  Eye
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
  uploadedBy: {
    id: string;
    fullName: string;
  };
  uploadedAt: string;
}

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [newComment, setNewComment] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    title: '',
    description: '',
    status: '',
    priority: '',
    assigneeId: '',
    dueDate: ''
  });

  // Fetch task data
  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data.task;
    },
    enabled: !!id,
  });

  // Fetch comments
  const { data: comments } = useQuery({
    queryKey: ['task-comments', id],
    queryFn: async () => {
      const response = await api.get(`/comments/task/${id}`);
      return response.data.comments;
    },
    enabled: !!id,
  });

  // Fetch attachments (TODO: Implement attachments API)
  const { data: attachments } = useQuery({
    queryKey: ['task-attachments', id],
    queryFn: async () => {
      // const response = await api.get(`/tasks/${id}/attachments`);
      // return response.data.attachments;
      return []; // Temporary: return empty array
    },
    enabled: false, // Disabled until API is implemented
  });

  // Fetch users for assignee dropdown (only for admin/lecturer)
  const { data: users } = useQuery({
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
        <Navbar user={user} />
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
        <Navbar user={user} />
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
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(task.project?.id ? `/projects/${task.project.id}/tasks` : '/tasks')}
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
              {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
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
                      rows={4}
                      className="input"
                      placeholder="Add a description..."
                    />
                  ) : (
                    <p className="text-gray-600">
                      {task.description || 'No description provided.'}
                    </p>
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

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center">
                    <Paperclip className="w-5 h-5 mr-2" />
                    Attachments ({attachments.length})
                  </h2>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    {attachments.map((attachment: Attachment) => (
                      <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Paperclip className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{attachment.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(attachment.fileSize)} • Uploaded by {attachment.uploadedBy.fullName}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => window.open(attachment.fileUrl, '_blank')}
                            className="btn-ghost p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              const link = document.createElement('a');
                              link.href = attachment.fileUrl;
                              link.download = attachment.fileName;
                              link.click();
                            }}
                            className="btn-ghost p-2"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
                    <input
                      type="date"
                      value={editData.dueDate}
                      onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="input"
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
      </div>
    </div>
  );
}
