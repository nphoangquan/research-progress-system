import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import api from '../lib/axios';
// import { Project } from '../types/project';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.project;
    },
    enabled: !!id,
  });

  if (!user) {
    return <div>Loading...</div>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            <p className="mt-2 text-gray-600">Loading project...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="text-center py-8">
            <p className="text-red-600">Project not found or access denied.</p>
            <Link
              to="/projects"
              className="mt-2 inline-block text-indigo-600 hover:text-indigo-500"
            >
              ← Back to Projects
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  to="/projects"
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
                >
                  ← Back to Projects
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
                <p className="mt-2 text-gray-600">{project.description}</p>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  project.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                  project.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                  project.status === 'UNDER_REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {project.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Progress */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Progress</h2>
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <span className="ml-2 font-medium">
                      {new Date(project.startDate).toLocaleDateString()}
                    </span>
                  </div>
                  {project.endDate && (
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <span className="ml-2 font-medium">
                        {new Date(project.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tasks */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Tasks</h2>
                  <span className="text-sm text-gray-500">
                    {project.tasks?.length || 0} tasks
                  </span>
                </div>
                {project.tasks?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No tasks yet.</p>
                ) : (
                  <div className="space-y-3">
                    {project.tasks?.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{task.title}</h3>
                          <p className="text-xs text-gray-500">Assigned to {task.assignee.fullName}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'DONE' ? 'bg-green-100 text-green-800' :
                          task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-gray-900">Documents</h2>
                  <span className="text-sm text-gray-500">
                    {project.documents?.length || 0} documents
                  </span>
                </div>
                {project.documents?.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No documents uploaded yet.</p>
                ) : (
                  <div className="space-y-3">
                    {project.documents?.slice(0, 5).map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{doc.fileName}</h3>
                          <p className="text-xs text-gray-500">
                            {(doc.fileSize / 1024 / 1024).toFixed(2)} MB • 
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          doc.indexStatus === 'INDEXED' ? 'bg-green-100 text-green-800' :
                          doc.indexStatus === 'PROCESSING' ? 'bg-blue-100 text-blue-800' :
                          doc.indexStatus === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {doc.indexStatus}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Project Info */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Project Info</h2>
                <div className="space-y-3">
                  <div>
                    <span className="text-sm text-gray-500">Student:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {project.student.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{project.student.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Lecturer:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {project.lecturer.fullName}
                    </p>
                    <p className="text-xs text-gray-500">{project.lecturer.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Created:</span>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Tasks:</span>
                    <span className="text-sm font-medium">{project._count.tasks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Documents:</span>
                    <span className="text-sm font-medium">{project._count.documents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Progress:</span>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
