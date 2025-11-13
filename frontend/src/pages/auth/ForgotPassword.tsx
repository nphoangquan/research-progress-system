import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import { GraduationCap, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email là bắt buộc');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setIsSubmitted(true);
      toast.success('Nếu tài khoản với email đó tồn tại, một liên kết đặt lại mật khẩu đã được gửi.');
    } catch (error: any) {
      setError(getErrorMessage(error, 'Gửi email đặt lại mật khẩu thất bại'));
      toast.error(getErrorMessage(error, 'Gửi email đặt lại mật khẩu thất bại'));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">
              Kiểm tra email của bạn
            </h2>
            <p className="mt-2 text-gray-600">
              Nếu tài khoản với email đó tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu đến <strong>{email}</strong>.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Vui lòng kiểm tra hộp thư đến và nhấp vào liên kết để đặt lại mật khẩu. Liên kết sẽ hết hạn sau 1 giờ.
            </p>
            <div className="mt-6">
              <Link
                to="/login"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Quay lại Đăng nhập
              </Link>
            </div>
          </div>
        </div>

        </div>
    );
}

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-12 h-12 text-gray-900" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">
            Quên mật khẩu?
          </h2>
          <p className="mt-2 text-gray-600">
            Nhập địa chỉ email của bạn và chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`input pl-10 ${error ? 'input-error' : ''}`}
                placeholder="Nhập địa chỉ email của bạn"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
              />
            </div>
            {error && (
              <p className="mt-1 text-sm text-error-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {error}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi liên kết đặt lại'}
            </button>
          </div>

          {/* Back to Login */}
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              Quay lại Đăng nhập
            </Link>
          </div>
        </form>
      </div>

      </div>
    );
}

