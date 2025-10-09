import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import MultiSelectDropdown from '../components/MultiSelectDropdown';
import SelectDropdown from '../components/SelectDropdown';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  Calendar, 
  User, 
  FileText,
  AlertCircle
} from 'lucide-react';

interface CreateProjectForm {
  title: string;
  description: string;
  studentIds: string[];
  lecturerId: string;
  startDate: string;
  endDate: string;
}

export default function CreateProject() {
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [formData, setFormData] = useState<CreateProjectForm>({
    title: '',
    description: '',
    studentIds: [],
    lecturerId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateProjectForm, string>>>({});

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users;
    },
  });

  const students = users?.filter((u: any) => u.role === 'STUDENT') || [];
  const lecturers = users?.filter((u: any) => u.role === 'LECTURER') || [];

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: CreateProjectForm) => {
      const response = await api.post('/projects', data);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Project created successfully!');
      navigate(`/projects/${data.project.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create project');
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name as keyof CreateProjectForm]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CreateProjectForm> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required';
    }

    if (formData.studentIds.length === 0) {
      newErrors.studentIds = 'Please select at least one student';
    }

    if (!formData.lecturerId) {
      newErrors.lecturerId = 'Please select a lecturer';
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

    createProjectMutation.mutate(formData);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/projects')}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="page-title">Create New Project</h1>
              <p className="page-subtitle">
                Set up a new research project and assign team members.
              </p>
            </div>
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
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="endDate"
                        name="endDate"
                        type="date"
                        className={`input pl-10 ${errors.endDate ? 'input-error' : ''}`}
                        value={formData.endDate}
                        onChange={handleChange}
                      />
                    </div>
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
                    onClick={() => navigate('/projects')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createProjectMutation.isPending}
                    className="btn-primary"
                  >
                    {createProjectMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
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
