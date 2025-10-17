import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import api from '../lib/axios';
import type { Project } from '../types/project';
import { 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Plus,
  ArrowRight,
  FileText,
  CheckSquare
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Welcome Header */}
        <div className="page-header">
          <h1 className="page-title">
            Welcome back, {user.fullName.split(' ')[0]}!
          </h1>
          <p className="page-subtitle">
            Here's an overview of your research projects and progress.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center">
                    <FolderOpen className="w-6 h-6 text-primary-600" />
                  </div>
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
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-success-600" />
                  </div>
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
                  <div className="w-12 h-12 bg-warning-100 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-warning-600" />
                  </div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Projects</h3>
                  <p className="text-gray-600 mb-4">Manage your research projects</p>
                  <Link to="/projects" className="btn-primary">
                    <FolderOpen className="w-4 h-4 mr-2" />
                    View Projects
                  </Link>
                </div>
                <div className="w-16 h-16 bg-primary-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-8 h-8 text-primary-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Tasks</h3>
                  <p className="text-gray-600 mb-4">Track and manage your work</p>
                  <Link to="/tasks" className="btn-primary">
                    <CheckSquare className="w-4 h-4 mr-2" />
                    View Tasks
                  </Link>
                </div>
                <div className="w-16 h-16 bg-success-100 rounded-xl flex items-center justify-center">
                  <CheckSquare className="w-8 h-8 text-success-600" />
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
                <Link
                  to="/projects"
                  className="btn-primary"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Project
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {projects?.slice(0, 5).map((project: Project) => (
                  <Link
                    key={project.id}
                    to={`/projects/${project.id}`}
                    className="block p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-soft transition-all duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {project.title}
                          </h3>
                          <span className={`badge ${
                            project.status === 'COMPLETED' ? 'badge-success' :
                            project.status === 'IN_PROGRESS' ? 'badge-primary' :
                            project.status === 'UNDER_REVIEW' ? 'badge-warning' :
                            'badge-gray'
                          }`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-4 line-clamp-2">
                          {project.description}
                        </p>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center">
                            <CheckSquare className="w-4 h-4 mr-1" />
                            {project._count.tasks} tasks
                          </div>
                          <div className="flex items-center">
                            <FileText className="w-4 h-4 mr-1" />
                            {project._count.documents} documents
                          </div>
                          <div className="flex items-center">
                            <TrendingUp className="w-4 h-4 mr-1" />
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