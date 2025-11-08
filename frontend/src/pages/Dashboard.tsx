import { useQuery, useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import api from '../lib/axios';
import type { Project } from '../types/project';
import toast from 'react-hot-toast';
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
  X,
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

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const totalProjects = projects?.length || 0;
  const activeProjects = projects?.filter((p: Project) => p.status === 'IN_PROGRESS').length || 0;
  const completedProjects = projects?.filter((p: Project) => p.status === 'COMPLETED').length || 0;

  // Resend verification email mutation
  const resendVerificationMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/auth/resend-verification');
      return response.data;
    },
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to send verification email');
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="w-full px-6 py-8">
        {/* Email Verification Banner */}
        {!user.emailVerified && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-3 mt-0.5" />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Please verify your email address
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  We've sent a verification email to {user.email}. Please check your inbox and click the verification link.
                </p>
                <div className="mt-3">
                  <button
                    onClick={() => resendVerificationMutation.mutate()}
                    disabled={resendVerificationMutation.isPending}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    {resendVerificationMutation.isPending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="text-gray-600">
            Here's an overview of your research projects and progress.
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{totalProjects}</p>
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">{activeProjects}</p>
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
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{completedProjects}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
                  <p className="text-gray-600 mb-4 text-sm">Manage your research projects</p>
                  <Link to="/projects" className="btn-primary inline-flex items-center">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Projects
                  </Link>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <FolderOpen className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </div>
          </div>

          {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
            <div className="card hover:shadow-lg transition-shadow duration-200">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks</h3>
                    <p className="text-gray-600 mb-4 text-sm">Track and manage your work</p>
                    <Link to="/tasks" className="btn-primary inline-flex items-center">
                      <CheckSquare className="w-4 h-4 mr-2" />
                      View Tasks
                    </Link>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <CheckSquare className="w-8 h-8 text-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Documents</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    {user.role === 'STUDENT' ? 'View documents from your projects' : 'View and manage documents'}
                  </p>
                  <Link to="/documents" className="btn-primary inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    View Documents
                  </Link>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <FileText className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </div>
          </div>

          <div className="card hover:shadow-lg transition-shadow duration-200">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Library</h3>
                  <p className="text-gray-600 mb-4 text-sm">Access public resources</p>
                  <Link to="/library" className="btn-primary inline-flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    View Library
                  </Link>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <FileText className="w-8 h-8 text-gray-900" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="card">
          <div className="card-header">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Recent Projects</h2>
              <Link
                to="/projects"
                className="btn-ghost text-sm"
              >
                View all
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </div>
          </div>
          
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading projects...</p>
              </div>
            ) : projects?.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h3>
                <p className="text-gray-600 mb-6">Get started by creating your first research project.</p>
                {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                  <Link
                    to="/projects/new"
                    className="btn-primary"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {projects?.slice(0, 6).map((project: Project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-6 rounded-lg border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-200 bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {project.title}
                          </h3>
                          <span className={`badge flex-shrink-0 ${
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
                    
                    <p className="text-gray-600 mb-4 line-clamp-2 text-sm">
                      {project.description}
                    </p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-4 h-4 mr-1 text-gray-500" />
                        {project._count?.tasks || 0} tasks
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1 text-gray-500" />
                        {project._count?.documents || 0} documents
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1 text-gray-500" />
                        {project.progress}% complete
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}