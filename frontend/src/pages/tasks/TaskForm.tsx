import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import SelectDropdown from '../../components/ui/SelectDropdown';
import ProjectSelector from '../../components/ui/ProjectSelector';
import DatePicker from '../../components/ui/DatePicker';
import LabelSelector from '../../components/ui/LabelSelector';
import { addLabelToTask, removeLabelFromTask, createLabel } from '../../lib/labelApi';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
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
  labelIds: string[];
}

export default function TaskForm() {
  const { id, projectId } = useParams<{ id?: string; projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
    assigneeId: '',
    projectIds: projectId ? [projectId] : [],
    dueDate: '',
    labelIds: []
  });

  const [errors, setErrors] = useState<Partial<Record<keyof TaskFormData, string>>>({});

  // Fetch task data for editing
  const { data: task, isLoading: taskLoading, isError: taskError, refetch: refetchTask } = useQuery({
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
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        labelIds: task.labels?.map((l: { id: string }) => l.id) || []
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
        const createdTasks = responses.map(r => r.data.task);
        
        // Add labels to all created tasks
        if (data.labelIds.length > 0) {
          const labelErrors: string[] = [];
          await Promise.allSettled(
            createdTasks.map(async (task) => {
              await Promise.allSettled(
                data.labelIds.map(async (labelId) => {
                  try {
                    await addLabelToTask(task.id, labelId);
                  } catch (error: any) {
                    labelErrors.push(`Không thể thêm label cho nhiệm vụ "${task.title}": ${error.response?.data?.error || 'Lỗi không xác định'}`);
                  }
                })
              );
            })
          );
          
          if (labelErrors.length > 0) {
            console.warn('Some labels could not be added:', labelErrors);
            // Still show success but warn about partial failure
            toast.error(`Nhiệm vụ đã được tạo nhưng một số label không thể thêm. Kiểm tra console để biết chi tiết.`);
          }
        }
        
        return createdTasks;
      } else {
        // Single task creation
        const response = await api.post('/tasks', {
          ...data,
          projectId: data.projectIds[0],
          assigneeId: data.assigneeId || null
        });
        const createdTask = response.data.task;
        
        // Add labels to task
        if (data.labelIds.length > 0) {
          const labelErrors: string[] = [];
          await Promise.allSettled(
            data.labelIds.map(async (labelId) => {
              try {
                await addLabelToTask(createdTask.id, labelId);
              } catch (error: any) {
                labelErrors.push(error.response?.data?.error || 'Lỗi không xác định');
              }
            })
          );
          
          if (labelErrors.length > 0) {
            console.warn('Some labels could not be added:', labelErrors);
            toast.error(`Nhiệm vụ đã được tạo nhưng một số label không thể thêm. Kiểm tra console để biết chi tiết.`);
          }
        }
        
        return createdTask;
      }
    },
    onSuccess: (data) => {
      const taskCount = Array.isArray(data) ? data.length : 1;
      // Invalidate queries to refresh task lists
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success(`Nhiệm vụ${taskCount > 1 ? '' : ''} đã được tạo thành công!`);
      navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Tạo nhiệm vụ thất bại');
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: Partial<TaskFormData>) => {
      const { labelIds, ...taskData } = data;
      const response = await api.put(`/tasks/${id}`, taskData);
      
      // Update labels if changed
      if (labelIds !== undefined && id) {
        const currentLabelIds = task?.labels?.map((l: { id: string }) => l.id) || [];
        const labelsToAdd = labelIds.filter((labelId: string) => !currentLabelIds.includes(labelId));
        const labelsToRemove = currentLabelIds.filter((labelId: string) => !labelIds.includes(labelId));
        
        await Promise.all([
          ...labelsToAdd.map((labelId: string) => addLabelToTask(id, labelId)),
          ...labelsToRemove.map((labelId: string) => removeLabelFromTask(id, labelId))
        ]);
      }
      
      return response.data;
    },
    onSuccess: () => {
      // Invalidate queries to refresh task data
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      toast.success('Cập nhật nhiệm vụ thành công!');
      navigate(projectId ? `/projects/${projectId}/tasks` : '/tasks');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Cập nhật nhiệm vụ thất bại');
    },
  });

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
  }, [errors]);

  const validateForm = useCallback((): boolean => {
    const newErrors: Partial<Record<keyof TaskFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Tiêu đề nhiệm vụ là bắt buộc';
    }

    if (formData.dueDate) {
      const dueDate = new Date(formData.dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (dueDate < today) {
        newErrors.dueDate = 'Hạn chót không thể ở quá khứ';
      }
    }

    if (formData.projectIds.length === 0) {
      newErrors.projectIds = 'Vui lòng chọn ít nhất một dự án';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (isEditing) {
      updateTaskMutation.mutate(formData);
    } else {
      createTaskMutation.mutate(formData);
    }
  }, [isEditing, formData, validateForm, createTaskMutation, updateTaskMutation]);

  const assigneeOptions = useMemo(() => [
    { id: '', fullName: 'Không gán cụ thể (Chỉ dự án)' },
    ...((projectId ? projectMembers : users)?.map((user: any) => ({
      id: user.id,
      fullName: projectId ? `${user.fullName} (${user.role})` : user.fullName,
      email: user.email
    })) || [])
  ], [projectId, projectMembers, users]);

  if (taskLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải nhiệm vụ...</p>
        </div>
      </div>
    );
  }

  if (taskError && isEditing) {
    return (
      <div className="w-full">
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Không thể tải nhiệm vụ</h3>
          <p className="text-gray-600">Đã xảy ra lỗi khi tải dữ liệu nhiệm vụ. Vui lòng thử lại.</p>
          <button
            type="button"
            onClick={() => refetchTask()}
            className="btn-primary"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
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
                  {isEditing ? 'Chỉnh sửa Nhiệm vụ' : 'Tạo Nhiệm vụ Mới'}
                </h1>
                <p className="page-subtitle">
                  {isEditing ? 'Cập nhật chi tiết và cài đặt nhiệm vụ.' : 'Thêm nhiệm vụ mới để theo dõi công việc và tiến độ.'}
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
                    Tiêu đề Nhiệm vụ *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      className={`input pl-10 h-12 text-base ${errors.title ? 'input-error' : ''}`}
                      placeholder="Nhập tiêu đề nhiệm vụ"
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
                    Mô tả
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    placeholder="Mô tả yêu cầu và mục tiêu của nhiệm vụ"
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
                      Dự án *
                    </label>
                    <ProjectSelector
                      selectedProjects={formData.projectIds}
                      onSelectionChange={(projectIds) => setFormData(prev => ({ ...prev, projectIds }))}
                      multiple={true}
                      placeholder="Chọn dự án..."
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
                    label="Người được gán (Tùy chọn)"
                    options={assigneeOptions}
                    value={formData.assigneeId}
                    onChange={(assigneeId) => setFormData(prev => ({ ...prev, assigneeId }))}
                    error={errors.assigneeId}
                    placeholder="Chọn người được gán (tùy chọn)..."
                    icon={<User className="w-5 h-5" />}
                  />
                  <p className="text-sm text-gray-500">
                    Để trống để gán nhiệm vụ cho dự án (không gán cho người cụ thể)
                  </p>
                </div>

                {/* Status and Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <SelectDropdown
                      label="Trạng thái"
                      options={[
                        { id: 'TODO', fullName: 'Cần làm' },
                        { id: 'IN_PROGRESS', fullName: 'Đang thực hiện' },
                        { id: 'REVIEW', fullName: 'Đang xem xét' },
                        { id: 'COMPLETED', fullName: 'Hoàn thành' }
                      ]}
                      value={formData.status}
                      onChange={(status) => setFormData(prev => ({ ...prev, status }))}
                      placeholder="Chọn trạng thái..."
                      icon={<CheckSquare className="w-5 h-5" />}
                    />
                  </div>

                  <div className="space-y-2">
                    <SelectDropdown
                      label="Mức độ ưu tiên"
                      options={[
                        { id: 'LOW', fullName: 'Thấp' },
                        { id: 'MEDIUM', fullName: 'Trung bình' },
                        { id: 'HIGH', fullName: 'Cao' },
                        { id: 'URGENT', fullName: 'Khẩn cấp' }
                      ]}
                      value={formData.priority}
                      onChange={(priority) => setFormData(prev => ({ ...prev, priority }))}
                      placeholder="Chọn mức độ ưu tiên..."
                      icon={<AlertTriangle className="w-5 h-5" />}
                    />
                  </div>
                </div>

                {/* Due Date */}
                <div className="space-y-2">
                  <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700">
                    Hạn chót
                  </label>
                  <DatePicker
                    value={formData.dueDate || null}
                    onChange={(value) => setFormData(prev => ({ ...prev, dueDate: value || '' }))}
                    placeholder="Chọn hạn chót (tùy chọn)"
                    className={errors.dueDate ? 'border-red-500' : ''}
                  />
                  {errors.dueDate && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.dueDate}
                    </p>
                  )}
                </div>

                {/* Labels */}
                <div className="space-y-2">
                  <LabelSelector
                    projectId={projectId || formData.projectIds[0]}
                    selectedLabelIds={formData.labelIds}
                    onSelectionChange={(labelIds) => setFormData(prev => ({ ...prev, labelIds }))}
                    allowCreate={user?.role === 'ADMIN' || user?.role === 'LECTURER'}
                    onCreateLabel={async (name, color) => {
                      const newLabel = await createLabel({
                        name,
                        color,
                        projectId: projectId || formData.projectIds[0] || null
                      });
                      return newLabel;
                    }}
                    className={errors.labelIds ? 'border-red-500' : ''}
                  />
                  {errors.labelIds && (
                    <p className="text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.labelIds}
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
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
                    className="btn-primary px-6 py-3"
                  >
                    {createTaskMutation.isPending || updateTaskMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {isEditing ? 'Đang cập nhật...' : 'Đang tạo...'}
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        {isEditing ? 'Cập nhật Nhiệm vụ' : 'Tạo Nhiệm vụ'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
}
