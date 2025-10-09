import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import api from '../lib/axios';
import type { Project } from '../types/project';
import { 
  Plus, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  TrendingUp,
  User,
  Calendar,
  Search,
  Filter
} from 'lucide-react';

export default function ProjectList() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const { data: projects, isLoading, error } = useQuery({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">Projects</h1>
              <p className="page-subtitle">
                Manage your research projects and track progress.
              </p>
            </div>
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
        </div>

        {/* Search and Filter Bar */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="input pl-10"
                />
              </div>
              <button className="btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </button>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading projects...</p>
          </div>
        ) : error ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-error-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading projects</h3>
              <p className="text-gray-600 mb-6">Please try again later.</p>
              <button className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        ) : projects?.length === 0 ? (
          <div className="card">
            <div className="card-body text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-6">
                {user.role === 'STUDENT' 
                  ? "You don't have any projects assigned yet."
                  : "Get started by creating your first project."
                }
              </p>
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
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-medium transition-shadow duration-200">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/projects/${project.id}`}
                        className="block"
                      >
                        <h3 className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors">
                          {project.title}
                        </h3>
                      </Link>
                    </div>
                    <span className={`badge ${
                      project.status === 'COMPLETED' ? 'badge-success' :
                      project.status === 'IN_PROGRESS' ? 'badge-primary' :
                      project.status === 'UNDER_REVIEW' ? 'badge-warning' :
                      'badge-gray'
                    }`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                  
                  {/* Progress Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${project.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <CheckSquare className="w-4 h-4 mr-1" />
                        {project._count.tasks} tasks
                      </div>
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-1" />
                        {project._count.documents} docs
                      </div>
                    </div>
                  </div>
                  
                  {/* Lecturer/Student Info */}
                  <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-500">
                        <User className="w-4 h-4 mr-1" />
                        {user.role === 'STUDENT' ? 'Lecturer' : 'Student'}
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.role === 'STUDENT' 
                          ? project.lecturer.fullName 
                          : project.student.fullName
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}