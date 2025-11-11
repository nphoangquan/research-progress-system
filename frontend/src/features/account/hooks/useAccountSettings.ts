import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import api from '../../../lib/axios';
import { useAuth } from '../../../hooks/useAuth';

export type AccountSettingsTab = 'profile' | 'security' | 'preferences';

export interface ProfileFormState {
  fullName: string;
  email: string;
  studentId: string;
}

export interface PasswordFormState {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PreferencesFormState {
  timezone: string;
  language: string;
  theme: string;
}

export interface UserProfileData {
  id: string;
  fullName: string;
  email: string;
  role: string;
  studentId: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_PROFILE_FORM: ProfileFormState = {
  fullName: '',
  email: '',
  studentId: ''
};

const DEFAULT_PASSWORD_FORM: PasswordFormState = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
};

export interface UserPreferencesResponse {
  message: string;
  preferences: Partial<PreferencesFormState> | null;
}

const DEFAULT_PREFERENCES_FORM: PreferencesFormState = {
  timezone: 'Asia/Ho_Chi_Minh',
  language: 'vi',
  theme: 'light'
};

export type ProfileErrors = Partial<Record<keyof ProfileFormState, string>>;
export type PasswordErrors = Partial<Record<keyof PasswordFormState, string>>;

export const useAccountSettings = () => {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<AccountSettingsTab>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileForm, setProfileForm] = useState<ProfileFormState>(DEFAULT_PROFILE_FORM);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(DEFAULT_PASSWORD_FORM);
  const [preferencesForm, setPreferencesForm] = useState<PreferencesFormState>(DEFAULT_PREFERENCES_FORM);

  const [profileErrors, setProfileErrors] = useState<ProfileErrors>({});
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  const {
    data: userProfile,
    isLoading: isLoadingProfile
  } = useQuery<UserProfileData>({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      const response = await api.get(`/users/${user?.id}`);
      return response.data.user as UserProfileData;
    },
    enabled: !!user?.id
  });

  const {
    data: userPreferences,
    isLoading: isLoadingPreferences
  } = useQuery<UserPreferencesResponse>({
    queryKey: ['userPreferences', user?.id],
    queryFn: async () => {
      const response = await api.get(`/users/${user?.id}/preferences`);
      return response.data as UserPreferencesResponse;
    },
    enabled: !!user?.id
  });

  useEffect(() => {
    if (userProfile) {
      setProfileForm({
        fullName: userProfile.fullName || '',
        email: userProfile.email || '',
        studentId: userProfile.studentId || ''
      });
    }
  }, [userProfile]);

  useEffect(() => {
    if (userPreferences?.preferences) {
      setPreferencesForm(prev => ({
        ...prev,
        ...DEFAULT_PREFERENCES_FORM,
        ...userPreferences.preferences
      }));
    }
  }, [userPreferences]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormState) => {
      const response = await api.put(`/users/${user?.id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Cập nhật hồ sơ thành công!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      setProfileErrors({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Cập nhật hồ sơ thất bại');
      if (error.response?.data?.errors) {
        setProfileErrors(error.response.data.errors);
      }
    }
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      const response = await api.put(`/users/${user?.id}/password`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      setPasswordForm(DEFAULT_PASSWORD_FORM);
      setPasswordErrors({});
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Đổi mật khẩu thất bại');
      if (error.response?.data?.errors) {
        setPasswordErrors(error.response.data.errors);
      }
    }
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await api.post(`/users/${user?.id}/avatar`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Tải lên ảnh đại diện thành công!');
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Tải lên ảnh đại diện thất bại');
    }
  });

  const handleProfileChange = useCallback(
    (field: keyof ProfileFormState, value: string) => {
      setProfileForm(prev => ({ ...prev, [field]: value }));
      if (profileErrors[field]) {
        setProfileErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [profileErrors]
  );

  const handlePasswordChange = useCallback(
    (field: keyof PasswordFormState, value: string) => {
      setPasswordForm(prev => ({ ...prev, [field]: value }));
      if (passwordErrors[field]) {
        setPasswordErrors(prev => ({ ...prev, [field]: undefined }));
      }
    },
    [passwordErrors]
  );

  const handlePreferencesChange = useCallback(
    (field: keyof PreferencesFormState, value: string) => {
      setPreferencesForm(prev => ({ ...prev, [field]: value }));
    },
    []
  );

  const validateProfileForm = useCallback(() => {
    const newErrors: ProfileErrors = {};

    if (!profileForm.fullName.trim()) {
      newErrors.fullName = 'Họ và tên là bắt buộc';
    }

    if (!profileForm.email.trim()) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(profileForm.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (user?.role === 'STUDENT' && !profileForm.studentId.trim()) {
      newErrors.studentId = 'Mã sinh viên là bắt buộc';
    }

    setProfileErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [profileForm, user?.role]);

  const validatePasswordForm = useCallback(() => {
    const newErrors: PasswordErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = 'Mật khẩu hiện tại là bắt buộc';
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = 'Mật khẩu mới là bắt buộc';
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [passwordForm]);

  const handleProfileSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validateProfileForm()) {
        updateProfileMutation.mutate({
          fullName: profileForm.fullName.trim(),
          email: profileForm.email.trim(),
          studentId: profileForm.studentId.trim()
        });
      }
    },
    [profileForm, updateProfileMutation, validateProfileForm]
  );

  const handlePasswordSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (validatePasswordForm()) {
        changePasswordMutation.mutate({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        });
      }
    },
    [changePasswordMutation, passwordForm, validatePasswordForm]
  );

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: PreferencesFormState) => {
      const response = await api.put(`/users/${user?.id}/preferences`, {
        preferences: data
      });
      return response.data as UserPreferencesResponse;
    },
    onSuccess: () => {
      toast.success('Cập nhật tùy chọn thành công!');
      queryClient.invalidateQueries({ queryKey: ['userPreferences', user?.id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Cập nhật tùy chọn thất bại');
    }
  });

  const handlePreferencesSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      updatePreferencesMutation.mutate(preferencesForm);
    },
    [preferencesForm, updatePreferencesMutation]
  );

  const handleAvatarChange = useCallback(
    (file: File) => {
      uploadAvatarMutation.mutate(file);
    },
    [uploadAvatarMutation]
  );

  const togglePasswordVisibility = useCallback(() => setShowPassword(prev => !prev), []);
  const toggleNewPasswordVisibility = useCallback(() => setShowNewPassword(prev => !prev), []);
  const toggleConfirmPasswordVisibility = useCallback(() => setShowConfirmPassword(prev => !prev), []);

  return {
    user,
    userProfile,
    isLoading: isLoadingProfile || isLoadingPreferences,
    activeTab,
    setActiveTab,
    profileForm,
    passwordForm,
    preferencesForm,
    profileErrors,
    passwordErrors,
    handleProfileChange,
    handlePasswordChange,
    handlePreferencesChange,
    handleProfileSubmit,
    handlePasswordSubmit,
    handlePreferencesSubmit,
    isSavingPreferences: updatePreferencesMutation.isPending,
    uploadAvatarPending: uploadAvatarMutation.isPending,
    handleAvatarChange,
    showPassword,
    showNewPassword,
    showConfirmPassword,
    togglePasswordVisibility,
    toggleNewPasswordVisibility,
    toggleConfirmPasswordVisibility,
    changePasswordPending: changePasswordMutation.isPending,
    updateProfilePending: updateProfileMutation.isPending
  };
};
