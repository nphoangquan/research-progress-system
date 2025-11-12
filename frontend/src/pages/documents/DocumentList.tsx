import { useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import SelectDropdown from '../../components/ui/SelectDropdown';
import ProjectFilterSelector from '../../components/ui/ProjectFilterSelector';
import UserFilterSelector from '../../components/ui/UserFilterSelector';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { sanitizeHTML } from '../../utils/sanitize';
import { 
  Search, 
  FileText,
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Upload,
  ArrowLeft
} from 'lucide-react';
import { 
  useCategoryOptions, 
  useStatusOptions, 
  useFileTypeOptions, 
  useUploadDateOptions
} from '../../hooks/useDocumentFilters';

interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description?: string;
  category: 'PROJECT' | 'REFERENCE' | 'TEMPLATE' | 'GUIDELINE' | 'SYSTEM';
  accessLevel: 'RESTRICTED' | 'STUDENT' | 'LECTURER' | 'PUBLIC';
  isPublic: boolean;
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

const INITIAL_FILTERS = {
  status: '',
  projectFilter: [] as string[],
  uploader: [] as string[],
  fileType: '',
  uploadDate: '',
  search: '',
  category: ''
};

export default function DocumentList() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  // Must call hooks before any conditional returns
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Memoized options for better performance
  const categoryOptions = useCategoryOptions();
  const statusOptions = useStatusOptions();
  const fileTypeOptions = useFileTypeOptions();
  const uploadDateOptions = useUploadDateOptions();

  // Fetch documents and statistics in parallel
  const { data: documentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['documents', projectId, filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      if (filters.status) params.append('status', filters.status);
      if (filters.projectFilter.length > 0) {
        filters.projectFilter.forEach(projectId => params.append('projectFilter', projectId));
      }
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
  });

  // Fetch document statistics
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['document-stats', projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append('projectId', projectId);
      
      const response = await api.get(`/documents/stats?${params.toString()}`);
      return response.data;
    },
    retry: 2,
  });

  const documents = documentsData?.documents || [];
  const pagination = documentsData?.pagination;

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
      toast.success('Xóa tài liệu thành công!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Xóa tài liệu thất bại');
    },
  });

  // const getStatusIcon = (status: string) => {
  //   switch (status) {
  //     case 'PENDING':
  //       return <Clock className="w-4 h-4 text-yellow-500" />;
  //     case 'PROCESSING':
  //       return <Clock className="w-4 h-4 text-blue-500" />;
  //     case 'INDEXED':
  //       return <CheckCircle className="w-4 h-4 text-green-500" />;
  //     case 'FAILED':
  //       return <XCircle className="w-4 h-4 text-red-500" />;
  //     default:
  //       return <AlertCircle className="w-4 h-4 text-gray-500" />;
  //   }
  // };

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
        return 'Dự án';
      case 'REFERENCE':
        return 'Tham khảo';
      case 'TEMPLATE':
        return 'Mẫu';
      case 'GUIDELINE':
        return 'Hướng dẫn';
      case 'SYSTEM':
        return 'Hệ thống';
      default:
        return category;
    }
  };

  const statusLabels = useMemo<Record<Document['indexStatus'], string>>(() => ({
    PENDING: 'Chờ xử lý',
    PROCESSING: 'Đang xử lý',
    INDEXED: 'Đã lập chỉ mục',
    FAILED: 'Thất bại'
  }), []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Byte';
    const k = 1024;
    const sizes = ['Byte', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleDelete = useCallback((documentId: string, fileName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa "${fileName}"?`)) {
      deleteDocumentMutation.mutate(documentId);
    }
  }, [deleteDocumentMutation]);

  const handleDownload = useCallback((doc: Document) => {
    const link = document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleView = useCallback((doc: Document) => {
    window.open(doc.fileUrl, '_blank');
  }, []);

  const handleFilterChange = useCallback(<K extends keyof typeof INITIAL_FILTERS>(key: K, value: (typeof INITIAL_FILTERS)[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setFilters(prev => ({
      ...prev,
      search: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setCurrentPage(1);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      filters.status ||
      filters.fileType ||
      filters.uploadDate ||
      filters.category ||
      filters.search.trim() ||
      filters.projectFilter.length > 0 ||
      filters.uploader.length > 0
    );
  }, [filters]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {projectId && (
                <button
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="btn-ghost p-2 hover:bg-gray-100 rounded-lg"
                  title="Quay lại Dự án"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
              )}
              <div>
                <h1 className="page-title">Tài liệu</h1>
                <p className="page-subtitle">
                  {project ? `${project.title} - Tài liệu` : 'Tất cả tài liệu'} - Quản lý tệp dự án
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(projectId ? `/projects/${projectId}/documents/upload` : '/documents/upload')}
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Tải lên Tài liệu
              </button>
            </div>
          </div>
        </div>

        {/* Statistics - Compact Horizontal Design */}
        {statsLoading && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
              <span className="text-sm text-gray-500">Đang tải thống kê...</span>
            </div>
          </div>
        )}

        {statsError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-2">⚠️</div>
              <span className="text-sm text-red-700">Không thể tải thống kê. Vui lòng thử lại.</span>
            </div>
          </div>
        )}

        {statsData && !statsError && (
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-500">Tổng:</span>
                  <span className="text-lg font-semibold text-gray-900">{(statsData as any).totalCount}</span>
                </div>
                
                {statsData && (statsData as any).categoryStats.map((stat: any) => (
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
          <div className="card-body p-4">
            <div className="space-y-4">
              {/* Search Row */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                {/* Search */}
                <div className="flex-1 min-w-0">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tìm kiếm
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm tài liệu..."
                      className="input pl-10 w-full text-sm min-h-[42px]"
                      value={filters.search}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <button
                  onClick={clearFilters}
                  className="btn-ghost whitespace-nowrap h-10 px-4"
                  disabled={!hasActiveFilters}
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* First Filter Row - Status, Dates, File Types, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Status Filter */}
                <SelectDropdown
                  label="Trạng thái"
                  options={[...statusOptions]}
                  value={filters.status}
                  onChange={(status) => handleFilterChange('status', status)}
                  placeholder="Tất cả trạng thái"
                />

                {/* Upload Date Filter */}
                <SelectDropdown
                  label="Thời gian"
                  options={[...uploadDateOptions]}
                  value={filters.uploadDate}
                  onChange={(uploadDate) => handleFilterChange('uploadDate', uploadDate)}
                  placeholder="Tất cả thời gian"
                />

                {/* File Type Filter */}
                <SelectDropdown
                  label="Loại tệp"
                  options={[...fileTypeOptions]}
                  value={filters.fileType}
                  onChange={(fileType) => handleFilterChange('fileType', fileType)}
                  placeholder="Tất cả loại tệp"
                />

                {/* Category Filter */}
                <SelectDropdown
                  label="Danh mục"
                  options={[...categoryOptions]}
                  value={filters.category}
                  onChange={(category) => handleFilterChange('category', category)}
                  placeholder="Tất cả danh mục"
                />
              </div>

              {/* Second Filter Row - Projects, Uploaders */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Project Filter */}
                <ProjectFilterSelector
                  selectedProjects={filters.projectFilter}
                  onSelectionChange={(projectIds) => handleFilterChange('projectFilter', projectIds)}
                  multiple={true}
                  placeholder="Tất cả dự án"
                  label="Dự án"
                />

                {/* Uploader Filter - Only for ADMIN and LECTURER */}
                {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                  <UserFilterSelector
                    selectedUsers={filters.uploader}
                    onSelectionChange={(userIds) => handleFilterChange('uploader', userIds)}
                    multiple={true}
                    placeholder="Tất cả người tải lên"
                    label="Người tải lên"
                  />
                )}
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
                <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
              </div>
            ) : isError ? (
              <div className="text-center py-12 space-y-4">
                <FileText className="w-16 h-16 text-red-400 mx-auto" />
                <h3 className="text-lg font-medium text-gray-900">Không thể tải danh sách tài liệu</h3>
                <p className="text-gray-600">Đã xảy ra lỗi khi truy vấn dữ liệu tài liệu. Vui lòng thử lại.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="btn-primary"
                >
                  Thử lại
                </button>
              </div>
            ) : documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(document.category)}`}>
                              {getCategoryLabel(document.category)}
                            </span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.indexStatus)}`}>
                              {statusLabels[document.indexStatus] || document.indexStatus}
                            </span>
                          </div>
                        </div>
                        
                        {document.description && (
                          <div className="text-gray-600 text-sm mb-3 line-clamp-2 prose prose-sm max-w-none">
                            <div dangerouslySetInnerHTML={{ __html: sanitizeHTML(document.description) }} />
                          </div>
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
                          title="Xem tài liệu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(document)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="Tải xuống tài liệu"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
                          <>
                            <button
                              onClick={() => navigate(`/documents/${document.id}/edit`)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded"
                              title="Chỉnh sửa tài liệu"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(document.id, document.fileName)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded"
                              title="Xóa tài liệu"
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tài liệu</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.status
                    ? 'Thử điều chỉnh bộ lọc để xem thêm tài liệu.'
                    : 'Bắt đầu bằng cách tải lên tài liệu đầu tiên.'}
                </p>
                <button
                  onClick={() => navigate(projectId ? `/projects/${projectId}/documents/upload` : '/documents/upload')}
                  className="btn-primary"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Tải lên Tài liệu
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

  );
}
