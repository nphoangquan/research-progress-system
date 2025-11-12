import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import { GraduationCap, CheckCircle, XCircle, Loader } from 'lucide-react';

export default function VerifyEmail() {
  const { token: pathToken } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const queryToken = searchParams.get('token');
  const token = pathToken || queryToken; // Support both path and query params
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Liên kết xác minh không hợp lệ');
        return;
      }

      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage(response.data.message || 'Email đã được xác minh thành công!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error: any) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Xác minh email thất bại. Liên kết có thể đã hết hạn.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            {status === 'loading' && (
              <Loader className="w-12 h-12 text-primary-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-12 h-12 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            {status === 'loading' && 'Đang xác minh Email...'}
            {status === 'success' && 'Email đã được xác minh!'}
            {status === 'error' && 'Xác minh thất bại'}
          </h2>
          <p className="mt-2 text-gray-600">
            {message || 'Vui lòng đợi trong khi chúng tôi xác minh địa chỉ email của bạn.'}
          </p>
          {status === 'success' && (
            <p className="mt-4 text-sm text-gray-500">
              Đang chuyển hướng đến trang đăng nhập...
            </p>
          )}
          {status === 'error' && (
            <div className="mt-6 space-y-4">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Đi đến Đăng nhập
              </Link>
              <p className="text-sm text-gray-500">
                Cần liên kết xác minh mới? Vui lòng liên hệ hỗ trợ hoặc thử đăng ký lại.
              </p>
            </div>
          )}
        </div>
      </div>

      </div>
    );
}

