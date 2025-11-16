import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

// Use sessionStorage instead of localStorage for temporary flag
// sessionStorage automatically clears when tab closes, preventing stale flags
const LOGOUT_FLAG_KEY = '__is_logging_out__';

export const useAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginRequest): Promise<{ success: boolean; error?: any }> => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const result: AuthResponse = response.data;
      
      // Clear any stale logout flag when logging in
      sessionStorage.removeItem(LOGOUT_FLAG_KEY);
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success('Đăng nhập thành công!');
      navigate('/dashboard');
      return { success: true };
    } catch (error: any) {
      // Debug logging
      console.error('Login error:', error);
      console.error('Error response:', error?.response?.data);
      
      // Check if account is deactivated
      const errorCode = error?.response?.data?.error?.code;
      const errorMessage = error?.response?.data?.error?.message;
      
      if (errorCode === 'ACCOUNT_DEACTIVATED' || errorMessage?.includes('vô hiệu hóa')) {
        const message = errorMessage || 'Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.';
        toast.error(message, { duration: 6000 });
      } else {
        // Don't show toast for INVALID_EMAIL or INVALID_PASSWORD - let Login component handle it
        if (errorCode !== 'INVALID_EMAIL' && errorCode !== 'INVALID_PASSWORD') {
          toast.error(getErrorMessage(error, 'Đăng nhập thất bại'));
        }
      }
      
      return { success: false, error };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const result: AuthResponse = response.data;
      
      // Clear any stale logout flag when registering
      sessionStorage.removeItem(LOGOUT_FLAG_KEY);
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success('Đăng ký thành công!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(getErrorMessage(error, 'Đăng ký thất bại'));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    // Prevent duplicate logout calls across all instances
    // Use sessionStorage instead of localStorage for temporary flag
    if (sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true') {
      return;
    }
    
    // Set flag to prevent duplicate calls
    sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true');
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Đăng xuất thành công');
    navigate('/login');
    
    // Clear flag after navigation completes
    // Using shorter timeout since sessionStorage auto-clears on tab close anyway
    setTimeout(() => {
      sessionStorage.removeItem(LOGOUT_FLAG_KEY);
    }, 500);
  };

  const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  };

  const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
  };

  return {
    login,
    register,
    logout,
    getCurrentUser,
    isAuthenticated,
    isLoading,
  };
};
