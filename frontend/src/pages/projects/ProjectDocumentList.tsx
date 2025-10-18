import React from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import ProjectUserFilterSelector from '../../components/ProjectUserFilterSelector';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
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
  Filter,
  ArrowLeft
} from 'lucide-react';

interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description: string | null;
  category: 'PROJECT' | 'REFERENCE' | 'TEMPLATE' | 'GUIDELINE' | 'SYSTEM';
  accessLevel: 'RESTRICTED' | 'STUDENT' | 'LECTURER' | 'PUBLIC';
  isPublic: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  indexStatus: 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';
  indexedAt: string | null;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  lecturerId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  lecturer: {
    id: string;
    fullName: string;
    email: string;
  };
  students: Array<{
    studentId: string;
    student: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

export default function ProjectDocumentList() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: '',
    uploader: [] as string[],
    fileType: '',
    uploadDate: '',
    search: '',
    category: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });

  // Fetch documents for this specific project
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', projectId, filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.uploader.length > 0) {
        filters.uploader.forEach(uploaderId => params.append('uploader', uploaderId));
      }
      if (filters.fileType) params.append('fileType', filters.fileType);
      if (filters.uploadDate) params.append('uploadDate', filters.uploadDate);
      if (filters.search) params.append('search', filters.search);
      if (filters.category) params.append('category', filters.category);

      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await api.get(`/documents?${params.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  const documents = documentsData?.documents || [];
  const pagination = documentsData?.pagination;

  // Fetch document statistics
  const { data: statsData } = useQuery({
    queryKey: ['document-stats', projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      const response = await api.get(`/documents/stats?${params.toString()}`);
      return response.data;
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
      toast.success('Document deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    },
  });

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}"? This action cannot be undone.`)) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'PROJECT':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'REFERENCE':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'TEMPLATE':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'GUIDELINE':
        return 'bg-slate-50 text-slate-700 border border-slate-200';
      case 'SYSTEM':
        return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'PROJECT':
        return 'Project';
      case 'REFERENCE':
        return 'Reference';
      case 'TEMPLATE':
        return 'Template';
      case 'GUIDELINE':
        return 'Guideline';
      case 'SYSTEM':
        return 'System';
      default:
        return category;
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

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const handleView = (doc: Document) => {
    window.open(doc.fileUrl, '_blank');
  };

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
      
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(`/projects/${projectId}`)}
                className="btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                title="Back to Project"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="page-title">Project Documents</h1>
                <p className="page-subtitle">
                  {project ? `${project.title} - Documents` : 'Project documents'} - Manage project files
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/projects/${projectId}/documents/upload`)}
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </button>
            </div>
          </div>
        </div>

        {/* Statistics - Compact Horizontal Design */}
        {statsData && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-500">Total:</span>
                  <span className="text-lg font-semibold text-gray-900">{statsData.totalCount}</span>
                </div>
                
                {statsData.categoryStats.map((stat: any) => (
                  <div key={stat.category} className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-gray-600" />
                    <span className="text-sm text-gray-500">{getCategoryLabel(stat.category)}:</span>
                    <span className="text-lg font-semibold text-gray-900">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-6">
          <div className="card-body">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search documents..."
                      className="input pl-10 w-full"
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setFilters({ status: '', uploader: [], fileType: '', uploadDate: '', search: '', category: '' });
                    setCurrentPage(1);
                  }}
                  className="btn-ghost whitespace-nowrap"
                >
                  Clear Filters
                </button>
              </div>

              {/* First Filter Row - Status, Dates, File Types, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Status' },
                    { id: 'PENDING', fullName: 'Pending' },
                    { id: 'APPROVED', fullName: 'Approved' },
                    { id: 'REJECTED', fullName: 'Rejected' }
                  ]}
                  value={filters.status}
                  onChange={(status) => setFilters(prev => ({ ...prev, status }))}
                  placeholder="All Status"
                />

                {/* Upload Date Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Dates' },
                    { id: 'today', fullName: 'Today' },
                    { id: 'this_week', fullName: 'This Week' },
                    { id: 'this_month', fullName: 'This Month' },
                    { id: 'last_month', fullName: 'Last Month' }
                  ]}
                  value={filters.uploadDate}
                  onChange={(uploadDate) => setFilters(prev => ({ ...prev, uploadDate }))}
                  placeholder="All Dates"
                />

                {/* File Type Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All File Types' },
                    { id: 'pdf', fullName: 'PDF' },
                    { id: 'doc', fullName: 'Word Documents' },
                    { id: 'xls', fullName: 'Excel Files' },
                    { id: 'ppt', fullName: 'PowerPoint' },
                    { id: 'image', fullName: 'Images' },
                    { id: 'archive', fullName: 'Archives' }
                  ]}
                  value={filters.fileType}
                  onChange={(fileType) => setFilters(prev => ({ ...prev, fileType }))}
                  placeholder="All File Types"
                />

                {/* Category Filter */}
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'All Categories' },
                    { id: 'PROJECT', fullName: 'Project Documents' },
                    { id: 'REFERENCE', fullName: 'Reference Materials' },
                    { id: 'TEMPLATE', fullName: 'Templates' },
                    { id: 'GUIDELINE', fullName: 'Guidelines' }
                  ]}
                  value={filters.category}
                  onChange={(category) => setFilters(prev => ({ ...prev, category }))}
                  placeholder="All Categories"
                />
              </div>

              {/* Second Filter Row - Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Uploader Filter */}
                <ProjectUserFilterSelector
                  projectId={projectId!}
                  selectedUsers={filters.uploader}
                  onSelectionChange={(userIds) => setFilters(prev => ({ ...prev, uploader: userIds }))}
                  multiple={true}
                  placeholder="All Uploaders"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="card-body">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading documents...</p>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {documents.map((document: Document) => (
                  <div
                    key={document.id}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-3 mb-2">
                          <FileText className="w-5 h-5 text-gray-500" />
                          <h3 className="text-lg font-semibold text-gray-900 truncate flex-1">
                            {document.fileName}
                          </h3>
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(document.category)}`}>
                              {getCategoryLabel(document.category)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                              {document.status}
                            </span>
                          </div>
                        </div>
                        
                        {document.description && (
                          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {document.description}
                          </p>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>{document.uploader?.fullName || 'Unknown User'}</span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(document.createdAt)}</span>
                          </div>
                          
                          <span>{formatFileSize(document.fileSize)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleView(document)}
                          className="p-2 text-gray-400 hover:text-blue-600 rounded"
                          title="View document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDownload(document)}
                          className="p-2 text-gray-400 hover:text-green-600 rounded"
                          title="Download document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        
                        {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                          <>
                            <button
                              onClick={() => navigate(`/documents/${document.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded"
                              title="Edit document"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDocument(document.id, document.fileName)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded"
                              title="Delete document"
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
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">
                  {filters.search || filters.status
                    ? 'Try adjusting your filters to see more documents.'
                    : 'Get started by uploading your first document.'}
                </p>
                <button
                  onClick={() => navigate(`/projects/${projectId}/documents/upload`)}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload First Document
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {pagination && (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalCount={pagination.totalCount}
            limit={pagination.limit}
            onPageChange={setCurrentPage}
            className="mt-8"
          />
        )}
      </div>
    </div>
  );
}
