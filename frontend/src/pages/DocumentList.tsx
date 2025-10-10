import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import SelectDropdown from '../components/SelectDropdown';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Filter
} from 'lucide-react';

interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description?: string;
  indexStatus: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  indexedAt?: string;
  chunkCount?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  project: {
    id: string;
    title: string;
  };
}

export default function DocumentList() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const [filters, setFilters] = useState({
    status: '',
    search: ''
  });

  // Fetch documents
  const { data: documents, isLoading } = useQuery({
    queryKey: ['documents', projectId, filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/documents?${params.toString()}`);
      return response.data.documents;
    },
  });

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'PROCESSING':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'INDEXED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'INDEXED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = (documentId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"?`)) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const handleDownload = (document: Document) => {
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (document: Document) => {
    window.open(document.fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading documents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Documents</h1>
              <p className="page-subtitle">
                {project ? `${project.title} - Documents` : 'All documents'} - Manage project files
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}` : '/projects')}
                className="btn-secondary"
              >
                Back to Project
              </button>
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/documents/upload` : '/documents/upload')}
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body p-4">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="input pl-10 w-full h-10"
                      value={filters.search}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          search: e.target.value,
                        }))
                      }
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={() => setFilters({ status: '', search: '' })}
                  className="btn-ghost whitespace-nowrap h-10 px-4"
                >
                  Clear Filters
                </button>
              </div>

              {/* Status Filter Row */}
              <div className="flex justify-start">
                <div className="w-full sm:w-64">
                  <SelectDropdown
                    label=""
                    options={[
                      { id: '', fullName: 'All Status' },
                      { id: 'PENDING', fullName: 'Pending' },
                      { id: 'PROCESSING', fullName: 'Processing' },
                      { id: 'INDEXED', fullName: 'Indexed' },
                      { id: 'FAILED', fullName: 'Failed' }
                    ]}
                    value={filters.status}
                    onChange={(status) =>
                      setFilters((prev) => ({ ...prev, status }))
                    }
                    placeholder="All Status"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="card-body">
            {documents && documents.length > 0 ? (
              <div className="space-y-4">
                {documents.map((document: Document) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            <FileText className="w-5 h-5 text-gray-500" />
                          </div>
                          <h3 className="font-medium text-gray-900 flex-1">{document.fileName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex-shrink-0 ${getStatusColor(document.indexStatus)}`}>
                            {document.indexStatus}
                          </span>
                        </div>
                        
                        {document.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                            <span>{formatDate(document.createdAt)}</span>
                          </div>
                          <div className="flex items-center">
                            <span>{formatFileSize(document.fileSize)}</span>
                          </div>
                          {!projectId && (
                            <div className="text-gray-400 truncate">
                              {document.project.title}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                        <button
                          onClick={() => handleView(document)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="View Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(document)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                          <>
                            <button
                              onClick={() => navigate(`/documents/${document.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded"
                              title="Edit Document"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(document.id, document.fileName)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status
                    ? 'Try adjusting your filters to see more documents.'
                    : 'Get started by uploading your first document.'}
                </p>
                <button
                  onClick={() => navigate(projectId ? `/projects/${projectId}/documents/upload` : '/documents/upload')}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Document
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
