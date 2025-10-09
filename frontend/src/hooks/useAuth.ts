import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';
import toast from 'react-hot-toast';

export const useAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', data);
      const result: AuthResponse = response.data;
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterRequest) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/register', data);
      const result: AuthResponse = response.data;
      
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast.success('Registration successful!');
      navigate('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
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
