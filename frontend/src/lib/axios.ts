import axios from 'axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Check if account is deactivated
    const errorCode = error?.response?.data?.error?.code;
    const isLoginPage = window.location.pathname === '/login';
    
    if (errorCode === 'ACCOUNT_DEACTIVATED') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // If already on login page, let login hook handle the error message
      if (!isLoginPage) {
        toast.error('Tài khoản của bạn đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên để được hỗ trợ.', { duration: 6000 });
        window.location.href = '/login';
      }
      // If on login page, reject error so login hook can handle it
      return Promise.reject(error);
    }

    // Don't show toast if error message is already handled by the component
    // Only show toast for unhandled errors
    if (error.response?.status === 401) {
      // Don't redirect if already on login page
      if (!isLoginPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
    } else if (error.response?.status === 403) {
      // Don't show toast here - let components handle it with more context
      // toast.error('Truy cập bị từ chối');
    } else if (error.response?.status === 500) {
      // Only show if no specific error message from backend
      if (!error.response?.data?.error) {
        toast.error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Yêu cầu quá thời gian. Vui lòng thử lại.');
    } else if (!error.response) {
      // Network error
      toast.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    return Promise.reject(error);
  }
);

export default api;
