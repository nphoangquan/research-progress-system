import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import AvatarUpload from '../components/AvatarUpload';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  User, 
  Mail, 
  Save, 
  AlertCircle,
  Camera,
  Shield,
  Settings,
  Globe,
  Palette,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface UserProfileForm {
  fullName: string;
  email: string;
  studentId: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  timezone: string;
  language: string;
  theme: string;
}

interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  studentId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UserProfile() {
  const { getCurrentUser, logout } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<UserProfileForm>({
    fullName: '',
    email: '',
    studentId: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    timezone: 'Asia/Ho_Chi_Minh',
    language: 'vi',
    theme: 'light'
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserProfileForm, string>>>({});

  // Fetch user profile data
  const { data: userProfile, isLoading } = useQuery<UserProfileData>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const response = await api.get(`/users/${user?.id}`);
      return response.data.user;
    },
    enabled: !!user?.id,
  });

  // Populate form when user data is loaded
  useEffect(() => {
    if (userProfile) {
      setFormData(prev => ({
        ...prev,
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        studentId: userProfile.studentId || '',
      }));
    }
  }, [userProfile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { fullName: string; email: string; studentId: string }) => {
      const response = await api.put(`/users/${user?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Profile updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setErrors({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update profile');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put(`/users/${user?.id}/password`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Password changed successfully!');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      setErrors({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to change password');
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await api.post(`/users/${user?.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Avatar uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setSelectedAvatarFile(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to upload avatar');
    },
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name as keyof UserProfileForm]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateProfileForm = () => {
    const newErrors: Partial<Record<keyof UserProfileForm, string>> = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (user?.role === 'STUDENT' && !formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Partial<Record<keyof UserProfileForm, string>> = {};

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters';
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateProfileForm()) {
      updateProfileMutation.mutate({
        fullName: formData.fullName.trim(),
        email: formData.email.trim(),
        studentId: formData.studentId.trim()
      });
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validatePasswordForm()) {
      changePasswordMutation.mutate({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
    }
  };

  const handlePreferencesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement preferences update
    toast.success('Preferences updated successfully!');
  };

  const handleAvatarChange = (file: File) => {
    setSelectedAvatarFile(file);
    // Auto-upload when file is selected
    uploadAvatarMutation.mutate(file);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        <div className="page-header">
          <h1 className="page-title">User Profile & Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <div className="card">
              <div className="card-body p-0">
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <User className="w-4 h-4 mr-3" />
                    Profile Information
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'security'
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    Security & Password
                  </button>
                  <button
                    onClick={() => setActiveTab('preferences')}
                    className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                      activeTab === 'preferences'
                        ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Preferences
                  </button>
                </nav>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Information Tab */}
            {activeTab === 'profile' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  <p className="text-sm text-gray-600">Update your personal information</p>
                </div>
                <div className="card-body">
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center space-x-6 mb-8">
                      <div className="flex-shrink-0">
                        <AvatarUpload
                          currentAvatarUrl={userProfile?.avatarUrl}
                          onAvatarChange={handleAvatarChange}
                          isUploading={uploadAvatarMutation.isPending}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{userProfile?.fullName}</h3>
                        <p className="text-sm text-gray-600">{userProfile?.email}</p>
                        <p className="text-xs text-gray-500 capitalize">{userProfile?.role?.toLowerCase()}</p>
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Full Name */}
                      <div>
                        <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            id="fullName"
                            name="fullName"
                            type="text"
                            required
                            className={`input pl-10 ${errors.fullName ? 'input-error' : ''}`}
                            placeholder="Enter your full name"
                            value={formData.fullName}
                            onChange={handleInputChange}
                          />
                        </div>
                        {errors.fullName && (
                          <p className="mt-1 text-sm text-error-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>

                      {/* Email */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                          <input
                            id="email"
                            name="email"
                            type="email"
                            required
                            className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                            placeholder="Enter your email"
                            value={formData.email}
                            onChange={handleInputChange}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-error-600 flex items-center">
                            <AlertCircle className="w-4 h-4 mr-1" />
                            {errors.email}
                          </p>
                        )}
                      </div>

                      {/* Student ID (only for students) */}
                      {user.role === 'STUDENT' && (
                        <div className="md:col-span-2">
                          <label htmlFor="studentId" className="block text-sm font-medium text-gray-700 mb-2">
                            Student ID *
                          </label>
                          <input
                            id="studentId"
                            name="studentId"
                            type="text"
                            required
                            className={`input ${errors.studentId ? 'input-error' : ''}`}
                            placeholder="Enter your student ID"
                            value={formData.studentId}
                            onChange={handleInputChange}
                          />
                          {errors.studentId && (
                            <p className="mt-1 text-sm text-error-600 flex items-center">
                              <AlertCircle className="w-4 h-4 mr-1" />
                              {errors.studentId}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn-primary flex items-center"
                        disabled={updateProfileMutation.isPending}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Security & Password Tab */}
            {activeTab === 'security' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Security & Password</h2>
                  <p className="text-sm text-gray-600">Change your password to keep your account secure</p>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    {/* Current Password */}
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password *
                      </label>
                      <div className="relative">
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type={showPassword ? 'text' : 'password'}
                          required
                          className={`input pr-10 ${errors.currentPassword ? 'input-error' : ''}`}
                          placeholder="Enter your current password"
                          value={formData.currentPassword}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.currentPassword && (
                        <p className="mt-1 text-sm text-error-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.currentPassword}
                        </p>
                      )}
                    </div>

                    {/* New Password */}
                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="newPassword"
                          name="newPassword"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
                          placeholder="Enter your new password"
                          value={formData.newPassword}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.newPassword && (
                        <p className="mt-1 text-sm text-error-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.newPassword}
                        </p>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password *
                      </label>
                      <div className="relative">
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                          placeholder="Confirm your new password"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {errors.confirmPassword && (
                        <p className="mt-1 text-sm text-error-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          {errors.confirmPassword}
                        </p>
                      )}
                    </div>

                    {/* Password Requirements */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements:</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li className="flex items-center">
                          {formData.newPassword.length >= 6 ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                          )}
                          At least 6 characters
                        </li>
                        <li className="flex items-center">
                          {formData.newPassword === formData.confirmPassword && formData.newPassword ? (
                            <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-400 mr-2" />
                          )}
                          Passwords match
                        </li>
                      </ul>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn-primary flex items-center"
                        disabled={changePasswordMutation.isPending}
                      >
                        <Shield className="w-4 h-4 mr-2" />
                        {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Preferences Tab */}
            {activeTab === 'preferences' && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">Preferences</h2>
                  <p className="text-sm text-gray-600">Customize your experience</p>
                </div>
                <div className="card-body">
                  <form onSubmit={handlePreferencesSubmit} className="space-y-6">
                    {/* Theme */}
                    <div>
                      <label htmlFor="theme" className="block text-sm font-medium text-gray-700 mb-2">
                        Theme
                      </label>
                      <div className="relative">
                        <Palette className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          id="theme"
                          name="theme"
                          className="input pl-10"
                          value={formData.theme}
                          onChange={handleInputChange}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="auto">Auto (System)</option>
                        </select>
                      </div>
                    </div>

                    {/* Language */}
                    <div>
                      <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-2">
                        Language
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          id="language"
                          name="language"
                          className="input pl-10"
                          value={formData.language}
                          onChange={handleInputChange}
                        >
                          <option value="vi">Tiếng Việt</option>
                          <option value="en">English</option>
                        </select>
                      </div>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                        Timezone
                      </label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <select
                          id="timezone"
                          name="timezone"
                          className="input pl-10"
                          value={formData.timezone}
                          onChange={handleInputChange}
                        >
                          <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                          <option value="UTC">UTC (GMT+0)</option>
                          <option value="America/New_York">America/New_York (GMT-5)</option>
                          <option value="Europe/London">Europe/London (GMT+0)</option>
                        </select>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="btn-primary flex items-center"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Preferences
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
