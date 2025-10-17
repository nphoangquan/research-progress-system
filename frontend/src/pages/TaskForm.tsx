import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import SelectDropdown from '../components/SelectDropdown';
import ProjectSelector from '../components/ProjectSelector';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  User, 
  FileText,
  AlertCircle,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';

interface TaskFormData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assigneeId: string;
  projectIds: string[];
  dueDate: string;
}

export default function TaskForm() {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    projectIds: projectId ? [projectId] : [],
    dueDate: ''
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  // Fetch task data for editing
  const { data: task, isLoading: taskLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: async () => {
      const response = await api.get(`/tasks/${id}`);
      return response.data.task;
    },
    enabled: isEditing,
  });

  // Fetch users for assignee dropdown (only for admin/lecturer)
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users;
    },
    enabled: (user?.role === 'ADMIN' || user?.role === 'LECTURER') && !projectId,
  });

  // Fetch project members for assignee dropdown when creating task for specific project
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

  // Fetch projects for project dropdown
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.projects;
    },
    enabled: !isEditing,
  });

  // Suppress unused variable warning - projects is used in ProjectSelector
  void projects;

  // Populate form when task data is loaded
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        status: task.status || 'TODO',
        priority: task.priority || 'MEDIUM',
        assigneeId: task.assignee?.id || '',
        projectIds: task.project?.id ? [task.project.id] : [],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''
      });
    }
  }, [task]);

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormData) => {
      if (data.projectIds.length > 1) {
        // Create multiple tasks for bulk assignment
        const tasks = data.projectIds.map(projectId => ({
          ...data,
          projectId,
          assigneeId: data.assigneeId || null
        }));
        
        const responses = await Promise.all(
          tasks.map(task => api.post('/tasks', task))
        );
        return responses.map(r => r.data);
      } else {
        // Single task creation
        const response = await api.post('/tasks', {
          ...data,
          projectId: data.projectIds[0],
          assigneeId: data.assigneeId || null
        });
        return response.data;
      }
    },
    onSuccess: (data) => {
      const taskCount = Array.isArray(data) ? data.length : 1;
      toast.success(`Task${taskCount > 1 ? 's' : ''} created successfully!`);
      navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create task');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskFormData>) => {
      const response = await api.put(`/tasks/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Task updated successfully!');
      navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update task');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof TaskFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Task title is required';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    if (formData.projectIds.length === 0) {
      newErrors.projectIds = 'Please select at least one project';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing) {
      updateTaskMutation.mutate(formData);
    } else {
      createTaskMutation.mutate(formData);
    }
  };

  if (taskLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user as any} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading task...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <Navbar user={user as any} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks')}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="page-title">
                  {isEditing ? 'Edit Task' : 'Create New Task'}
                </h1>
                <p className="page-subtitle">
                  {isEditing ? 'Update task details and settings.' : 'Add a new task to track work and progress.'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <div className="card shadow-lg">
            <div className="card-body p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Task Title */}
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-semibold text-gray-700">
                    Task Title *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      className={`input pl-10 h-12 text-base ${errors.title ? 'input-error' : ''}`}
                      placeholder="Enter task title"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.title && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Task Description */}
                <div className="space-y-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    placeholder="Describe the task requirements and objectives"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {errors.description && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Project Selection */}
                {!isEditing && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Projects *
                    </label>
                    <ProjectSelector
                      selectedProjects={formData.projectIds}
                      onSelectionChange={(projectIds) => setFormData(prev => ({ ...prev, projectIds }))}
                      multiple={true}
                      placeholder="Select projects..."
                      className="w-full"
                    />
                    {errors.projectIds && (
                      <p className="text-sm text-error-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.projectIds}
                      </p>
                    )}
                  </div>
                )}

                {/* Assignee Selection */}
                <div className="space-y-2">
                  <SelectDropdown
                    label="Assignee (Optional)"
                    options={[
                      { id: '', fullName: 'No specific assignee (Project only)' },
                      ...((projectId ? projectMembers : users)?.map((user: any) => ({
                        id: user.id,
                        fullName: projectId ? `${user.fullName} (${user.role})` : user.fullName,
                        email: user.email
                      })) || [])
                    ]}
                    value={formData.assigneeId}
                    onChange={(assigneeId) => setFormData(prev => ({ ...prev, assigneeId }))}
                    error={errors.assigneeId}
                    placeholder="Select an assignee (optional)..."
                    icon={<User className="w-5 h-5" />}
                  />
                  <p className="text-sm text-gray-500">
                    Leave empty to assign task to project only (no specific person)
                  </p>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SelectDropdown
                      label="Status"
                      options={[
                        { id: 'TODO', fullName: 'To Do' },
                        { id: 'IN_PROGRESS', fullName: 'In Progress' },
                        { id: 'REVIEW', fullName: 'Review' },
                        { id: 'COMPLETED', fullName: 'Completed' }
                      ]}
                      value={formData.status}
                      onChange={(status) => setFormData(prev => ({ ...prev, status }))}
                      placeholder="Select status..."
                      icon={<CheckSquare className="w-5 h-5" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <SelectDropdown
                      label="Priority"
                      options={[
                        { id: 'LOW', fullName: 'Low' },
                        { id: 'MEDIUM', fullName: 'Medium' },
                        { id: 'HIGH', fullName: 'High' },
                        { id: 'URGENT', fullName: 'Urgent' }
                      ]}
                      value={formData.priority}
                      onChange={(priority) => setFormData(prev => ({ ...prev, priority }))}
                      placeholder="Select priority..."
                      icon={<AlertTriangle className="w-5 h-5" />}
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700">
                    Due Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="dueDate"
                      name="dueDate"
                      type="date"
                      className={`input pl-10 h-12 text-base ${errors.dueDate ? 'input-error' : ''}`}
                      value={formData.dueDate}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.dueDate && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks')}
                    className="btn-secondary px-6 py-3"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                    className="btn-primary px-6 py-3"
                  >
                    {createTaskMutation.isPending || updateTaskMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? 'Update Task' : 'Create Task'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
