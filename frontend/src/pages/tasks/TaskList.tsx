import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocketEvents } from '../../hooks/useWebSocketEvents';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import AdvancedFilter from '../../components/ui/AdvancedFilter';
import UserFilterSelector from '../../components/ui/UserFilterSelector';
import LabelFilter from '../../components/ui/LabelFilter';
import LabelChip from '../../components/ui/LabelChip';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  MoreVertical,
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

  // WebSocket integration
  useWebSocketEvents({
    projectId: projectId,
    enableTaskEvents: true,
    enableCommentEvents: false
  });

  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
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
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks', projectId, filters, advancedFilters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      // Basic filters
      if (filters.status) params.append('status', filters.status);
      if (filters.priority) params.append('priority', filters.priority);
      if (filters.assignee) {
        if (Array.isArray(filters.assignee)) {
          filters.assignee.forEach(assignee => params.append('assignee', assignee));
        } else {
          params.append('assignee', filters.assignee);
        }
      }
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

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.priority, filters.assignee, filters.dueDate, filters.search, filters.labelIds.length, advancedFilters]);

  // Fetch project members for assignee filter (only for admin/lecturer)
  const { data: projectMembers } = useQuery({
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

  // Delete task mutation
  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete task');
    },
  });

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    if (window.confirm(`Are you sure you want to delete "${taskTitle}"? This action cannot be undone.`)) {
      deleteTaskMutation.mutate(taskId);
    }
  };

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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isOverdue = (dueDate: string | null, status: string) => {
    if (!dueDate || status === 'COMPLETED') return false;
    return new Date(dueDate) < new Date();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {projectId && (
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                  title="Back to Project"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="page-title">Tasks</h1>
                <p className="page-subtitle">
                  {projectId ? 'Project tasks' : 'All tasks'} - Manage and track your work
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/kanban` : '/tasks/kanban')}
                className="btn-secondary"
              >
                Kanban View
              </button>
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/new` : '/tasks/new')}
                className="btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
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
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search tasks..."
                      className="input pl-10 w-full"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: '', priority: '', assignee: '', dueDate: '', search: '', labelIds: [] });
                    setCurrentPage(1);
                  }}
                  className="btn-ghost whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>

              {/* Filter Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                {/* Status Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Status' },
                    { id: 'TODO', fullName: 'To Do' },
                    { id: 'IN_PROGRESS', fullName: 'In Progress' },
                    { id: 'REVIEW', fullName: 'Review' },
                    { id: 'COMPLETED', fullName: 'Completed' }
                  ]}
                  value={filters.status}
                  onChange={(status) => setFilters(prev => ({ ...prev, status }))}
                  placeholder="All Status"
                />

                {/* Priority Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Priority' },
                    { id: 'LOW', fullName: 'Low' },
                    { id: 'MEDIUM', fullName: 'Medium' },
                    { id: 'HIGH', fullName: 'High' },
                    { id: 'URGENT', fullName: 'Urgent' }
                  ]}
                  value={filters.priority}
                  onChange={(priority) => setFilters(prev => ({ ...prev, priority }))}
                  placeholder="All Priority"
                />

                {/* Due Date Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Due Dates' },
                    { id: 'overdue', fullName: 'Overdue' },
                    { id: 'today', fullName: 'Due Today' },
                    { id: 'this_week', fullName: 'This Week' },
                    { id: 'next_week', fullName: 'Next Week' },
                    { id: 'this_month', fullName: 'This Month' },
                    { id: 'no_due_date', fullName: 'No Due Date' }
                  ]}
                  value={filters.dueDate}
                  onChange={(dueDate) => setFilters(prev => ({ ...prev, dueDate }))}
                  placeholder="All Due Dates"
                />
              </div>

              {/* Assignee Filter Row */}
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <UserFilterSelector
                    selectedUsers={Array.isArray(filters.assignee) ? filters.assignee : (filters.assignee ? [filters.assignee] : [])}
                    onSelectionChange={(userIds) => setFilters(prev => ({ ...prev, assignee: userIds.length > 0 ? userIds : '' }))}
                    multiple={true}
                    placeholder="All Assignees"
                    className="w-full"
                  />
                </div>
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
            {tasks && tasks.length > 0 ? (
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
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className={`text-sm font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${getPriorityColor(task.priority)}`}>
                            {task.priority}
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status || filters.priority || filters.assignee
                    ? 'Try adjusting your filters to see more tasks.'
                    : 'Get started by creating your first task.'}
                </p>
                <button
                  onClick={() => navigate(projectId ? `/projects/${projectId}/tasks/new` : '/tasks/new')}
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Task
                </button>
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
              onPageChange={(page) => {
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
