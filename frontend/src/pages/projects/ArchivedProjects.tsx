import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/axios';
import type { Project } from '../../types/project';
import { 
  Archive, 
  FolderOpen, 
  CheckSquare, 
  FileText, 
  User,
  Search,
  RotateCcw,
  Calendar
} from 'lucide-react';

export default function ArchivedProjects() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [searchTerm, setSearchTerm] = useState('');

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['archived-projects', searchTerm],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);

      const response = await api.get(`/projects/archived?${params.toString()}`);
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <Archive className="w-8 h-8 text-gray-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Archived Projects</h1>
              <p className="text-gray-600">View and manage archived projects</p>
            </div>
          </div>
          <Link
            to="/projects"
            className="btn-primary"
          >
            Back to Projects
          </Link>
        </div>

        {/* Search Bar */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search archived projects..."
                className="input pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading archived projects...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">
              <Archive className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">Error loading archived projects</p>
              <p className="text-sm text-gray-600">Please try again later</p>
            </div>
          </div>
        ) : !projects || projects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Archive className="w-12 h-12 mx-auto mb-2" />
              <p className="text-lg font-medium">No archived projects found</p>
              <p className="text-sm text-gray-600">
                {searchTerm ? 'Try adjusting your search terms' : 'Projects will appear here when archived'}
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project: Project) => (
              <div key={project.id} className="card hover:shadow-lg transition-shadow">
                <div className="card-body">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <FolderOpen className="w-5 h-5 text-gray-500" />
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        ARCHIVED
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-500">
                        {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : 'Unknown Date'}
                      </div>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {project.title || 'Untitled Project'}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {project.description || 'No description available'}
                  </p>

                  <div className="space-y-3">
                    {/* Lecturer */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{project.lecturer?.fullName || 'Unknown Lecturer'}</span>
                    </div>

                    {/* Students */}
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <User className="w-4 h-4" />
                      <span>{project.students?.length || 0} student{(project.students?.length || 0) !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <CheckSquare className="w-4 h-4" />
                        <span>{project._count?.tasks || 0} tasks</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <FileText className="w-4 h-4" />
                        <span>{project._count?.documents || 0} docs</span>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Link
                        to={`/projects/${project.id}`}
                        className="flex-1 btn-secondary text-sm text-center"
                      >
                        View Details
                      </Link>
                      <Link
                        to={`/projects/${project.id}/settings`}
                        className="flex-1 btn-primary text-sm text-center"
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Restore
                      </Link>
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
