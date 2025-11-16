import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useMemo } from 'react';
import api from '../lib/axios';
import type { Project } from '../types/project';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../utils/errorUtils';
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight,
  FileText,
  CheckSquare,
  AlertCircle,
  Mail
} from 'lucide-react';

export default function Dashboard() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.projects;
    },
  });

  // Must call hooks before any conditional returns
  const projectStats = useMemo(() => {
    if (!projects) return { total: 0, active: 0, completed: 0 };
    return {
      total: projects.length,
      active: projects.filter((p: Project) => p.status === 'IN_PROGRESS').length,
      completed: projects.filter((p: Project) => p.status === 'COMPLETED').length
    };
  }, [projects]);

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/resend-verification');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đã gửi email xác minh! Vui lòng kiểm tra hộp thư của bạn.');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể gửi email xác minh'));
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Email Verification Banner */}
      {!user.emailVerified && (
        <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Vui lòng xác minh địa chỉ email của bạn
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                Chúng tôi đã gửi email xác minh đến {user.email}. Vui lòng kiểm tra hộp thư và nhấn vào liên kết xác minh.
              </p>
              <div className="mt-3">
                <button
                  onClick={() => resendVerificationMutation.mutate()}
                  disabled={resendVerificationMutation.isPending}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  {resendVerificationMutation.isPending ? 'Đang gửi...' : 'Gửi lại Email Xác minh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng trở lại, {user.fullName.split(' ')[0]}!
        </h1>
        <p className="text-gray-600">
          Đây là tổng quan về các dự án nghiên cứu và tiến độ của bạn.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FolderOpen className="w-6 h-6 text-gray-900" />
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Tổng Dự án</p>
                <p className="text-2xl font-bold text-gray-900">{projectStats.total}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-6 h-6 text-gray-900" />
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Dự án Đang thực hiện</p>
                <p className="text-2xl font-bold text-gray-900">{projectStats.active}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircle className="w-6 h-6 text-gray-900" />
              </div>
              <div className="ml-4 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-600 truncate">Đã Hoàn thành</p>
                <p className="text-2xl font-bold text-gray-900">{projectStats.completed}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card hover:shadow-lg transition-shadow duration-200 h-28">
          <div className="card-body h-full flex flex-col p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Dự án</h3>
                <p className="text-gray-600 text-sm line-clamp-2">Quản lý các dự án nghiên cứu của bạn</p>
              </div>
              <Link 
                to="/projects" 
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Xem Dự án"
              >
                <FolderOpen className="w-8 h-8 text-gray-900" />
              </Link>
            </div>
          </div>
        </div>

        {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
          <div className="card hover:shadow-lg transition-shadow duration-200 h-28">
            <div className="card-body h-full flex flex-col p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Nhiệm vụ</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">Theo dõi và quản lý công việc của bạn</p>
                </div>
                <Link 
                  to="/tasks" 
                  className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                  title="Xem Nhiệm vụ"
                >
                  <CheckSquare className="w-8 h-8 text-gray-900" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <div className="card hover:shadow-lg transition-shadow duration-200 h-28">
          <div className="card-body h-full flex flex-col p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Tài liệu</h3>
                <p className="text-gray-600 text-sm line-clamp-2">
                  {user.role === 'STUDENT' ? 'Xem tài liệu từ các dự án của bạn' : 'Xem và quản lý tài liệu'}
                </p>
              </div>
              <Link 
                to="/documents" 
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Xem Tài liệu"
              >
                <FileText className="w-8 h-8 text-gray-900" />
              </Link>
            </div>
          </div>
        </div>

        <div className="card hover:shadow-lg transition-shadow duration-200 h-28">
          <div className="card-body h-full flex flex-col p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 mb-1.5">Thư viện</h3>
                <p className="text-gray-600 text-sm line-clamp-2">Truy cập tài nguyên công khai</p>
              </div>
              <Link 
                to="/library" 
                className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                title="Xem Thư viện"
              >
                <FileText className="w-8 h-8 text-gray-900" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="card">
        <div className="card-header">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Dự án Gần đây</h2>
            <Link
              to="/projects"
              className="btn-ghost text-sm whitespace-nowrap"
            >
              <span>Xem tất cả</span>
              <ArrowRight className="w-4 h-4 ml-1 flex-shrink-0" />
            </Link>
          </div>
        </div>
        
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải dự án...</p>
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có dự án nào</h3>
              <p className="text-gray-600 mb-6">Bắt đầu bằng cách tạo dự án nghiên cứu đầu tiên của bạn.</p>
              {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                <Link
                  to="/projects/new"
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Dự án
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {projects?.slice(0, 6).map((project: Project) => (
                <Link
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className="p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 bg-white h-full flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0" title={project.title}>
                          {project.title}
                        </h3>
                        <span className={`badge flex-shrink-0 whitespace-nowrap ${
                          project.status === 'COMPLETED' ? 'badge-success' :
                          project.status === 'IN_PROGRESS' ? 'badge-primary' :
                          project.status === 'UNDER_REVIEW' ? 'badge-warning' :
                          'badge-gray'
                        }`}>
                          {project.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm flex-shrink-0" title={project.description || ''}>
                    {project.description}
                  </p>
                  
                  <div className="flex items-center flex-wrap gap-4 text-sm text-gray-500 mb-4 flex-shrink-0">
                    <div className="flex items-center whitespace-nowrap">
                      <CheckSquare className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" />
                      <span>{project._count?.tasks || 0} nhiệm vụ</span>
                    </div>
                    <div className="flex items-center whitespace-nowrap">
                      <FileText className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" />
                      <span>{project._count?.documents || 0} tài liệu</span>
                    </div>
                    <div className="flex items-center whitespace-nowrap">
                      <TrendingUp className="w-4 h-4 mr-1 text-gray-500 flex-shrink-0" />
                      <span>{project.progress}% hoàn thành</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto">
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      </div>
    );
}
