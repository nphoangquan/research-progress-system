import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import MultiSelectDropdown from '../../components/ui/MultiSelectDropdown';
import SelectDropdown from '../../components/ui/SelectDropdown';
import DatePicker from '../../components/ui/DatePicker';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  User, 
  FileText,
  AlertCircle,
  Trash2
} from 'lucide-react';

interface EditProjectForm {
  title: string;
  description: string;
  studentIds: string[];
  lecturerId: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
}

export default function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [formData, setFormData] = useState<EditProjectForm>({
    title: '',
    description: '',
    studentIds: [],
    lecturerId: '',
    status: 'NOT_STARTED',
    progress: 0,
    startDate: '',
    endDate: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EditProjectForm, string>>>({});

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.project;
    },
    enabled: !!id,
  });

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users;
    },
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || '',
        description: project.description || '',
        studentIds: project.students?.map((ps: any) => ps.studentId) || [],
        lecturerId: project.lecturerId || '',
        status: project.status || 'NOT_STARTED',
        progress: project.progress || 0,
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
      });
    }
  }, [project]);

  const students = users?.filter((u: any) => u.role === 'STUDENT') || [];
  const lecturers = users?.filter((u: any) => u.role === 'LECTURER') || [];

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<EditProjectForm>) => {
      const response = await api.put(`/projects/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Project updated successfully!');
      navigate(`/projects/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update project');
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Project deleted successfully!');
      navigate('/projects');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'progress' ? parseInt(value) || 0 : value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof EditProjectForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EditProjectForm, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (!formData.studentIds.length) {
      newErrors.studentIds = 'Please select at least one student';
    }

    if (!formData.lecturerId) {
      newErrors.lecturerId = 'Please select a lecturer';
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = 'Progress must be between 0 and 100';
    }

    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    updateProjectMutation.mutate(formData);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      deleteProjectMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/projects')}
              className="btn-primary"
            >
              Back to Projects
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
                onClick={() => navigate(`/projects/${id}`)}
                className="btn-ghost p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="page-title">Edit Project</h1>
                <p className="page-subtitle">
                  Update project details and settings.
                </p>
              </div>
            </div>
            
            {/* Delete Button */}
            {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
              <button
                onClick={handleDelete}
                disabled={deleteProjectMutation.isPending}
                className="btn-danger"
              >
                {deleteProjectMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                {deleteProjectMutation.isPending ? 'Deleting...' : 'Delete Project'}
              </button>
            )}
          </div>
        </div>

        {/* Form */}
        <div className="max-w-2xl">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Title */}
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Title *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      className={`input pl-10 ${errors.title ? 'input-error' : ''}`}
                      placeholder="Enter project title"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Project Description *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    className={`input ${errors.description ? 'input-error' : ''}`}
                    placeholder="Describe the project objectives, methodology, and expected outcomes"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Student Selection */}
                <MultiSelectDropdown
                  label="Students"
                  options={students}
                  selectedIds={formData.studentIds}
                  onChange={(studentIds) => setFormData(prev => ({ ...prev, studentIds }))}
                  error={errors.studentIds}
                  placeholder="Select students..."
                  required
                />

                {/* Lecturer Selection */}
                <SelectDropdown
                  label="Lecturer"
                  options={lecturers}
                  value={formData.lecturerId}
                  onChange={(lecturerId) => setFormData(prev => ({ ...prev, lecturerId }))}
                  error={errors.lecturerId}
                  placeholder="Select a lecturer..."
                  required
                  icon={<User className="w-5 h-5" />}
                />

                {/* Status and Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SelectDropdown
                      label="Status"
                      options={[
                        { id: 'NOT_STARTED', fullName: 'Not Started' },
                        { id: 'IN_PROGRESS', fullName: 'In Progress' },
                        { id: 'UNDER_REVIEW', fullName: 'Under Review' },
                        { id: 'COMPLETED', fullName: 'Completed' },
                        { id: 'CANCELLED', fullName: 'Cancelled' }
                      ]}
                      value={formData.status}
                      onChange={(status) => setFormData(prev => ({ ...prev, status }))}
                      placeholder="Select status..."
                    />
                  </div>

                  <div>
                    <label htmlFor="progress" className="block text-sm font-medium text-gray-700 mb-2">
                      Progress (%)
                    </label>
                    <input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      className={`input ${errors.progress ? 'input-error' : ''}`}
                      value={formData.progress}
                      onChange={handleChange}
                    />
                    {errors.progress && (
                      <p className="mt-1 text-sm text-error-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.progress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        className="input pl-10"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <DatePicker
                      value={formData.endDate || null}
                      onChange={(value) => setFormData(prev => ({ ...prev, endDate: value || '' }))}
                      placeholder="Select end date (optional)"
                      className={errors.endDate ? 'border-red-500' : ''}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-error-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => navigate(`/projects/${id}`)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="btn-primary"
                  >
                    {updateProjectMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {updateProjectMutation.isPending ? 'Updating...' : 'Update Project'}
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
