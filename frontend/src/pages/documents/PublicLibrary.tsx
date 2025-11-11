import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import Pagination from '../../components/ui/Pagination';
import api from '../../lib/axios';
import { 
  BookOpen, 
  Search, 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  BookMarked,
  File,
  ClipboardList,
  Settings
} from 'lucide-react';

interface PublicDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description?: string;
  category: 'REFERENCE' | 'TEMPLATE' | 'GUIDELINE' | 'SYSTEM';
  accessLevel: 'STUDENT' | 'LECTURER' | 'PUBLIC';
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    fullName: string;
  };
}

export default function PublicLibrary() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Allow all authenticated users to access public library
  // (Students, Lecturers, and Admins can all view public documents)

  const [filters, setFilters] = useState({
    category: '',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch public documents
  const { data: documentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['public-documents', filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      
      // Only fetch public documents (non-PROJECT categories)
      // Use projectId to filter system project documents
      params.append('projectId', 'system-library-project');
      
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      // Add pagination parameters
      params.append('page', currentPage.toString());
      params.append('limit', pageSize.toString());

      const response = await api.get(`/documents?${params.toString()}`);
      return response.data;
    },
  });

  const documents = documentsData?.documents || [];
  const pagination = documentsData?.pagination;

  const getCategoryColor = (category: string) => {
    switch (category) {
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
      case 'REFERENCE':
        return 'Tài liệu Tham khảo';
      case 'TEMPLATE':
        return 'Mẫu';
      case 'GUIDELINE':
        return 'Hướng dẫn';
      case 'SYSTEM':
        return 'Tài liệu Hệ thống';
      default:
        return category;
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconClass = "w-6 h-6 text-gray-900";
    switch (category) {
      case 'REFERENCE':
        return <BookMarked className={iconClass} />;
      case 'TEMPLATE':
        return <File className={iconClass} />;
      case 'GUIDELINE':
        return <ClipboardList className={iconClass} />;
      case 'SYSTEM':
        return <Settings className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = (doc: PublicDocument) => {
    const link = window.document.createElement('a');
    link.href = doc.fileUrl;
    link.download = doc.fileName;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  };

  const handleView = (doc: PublicDocument) => {
    window.open(doc.fileUrl, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải thư viện công khai...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12 space-y-4">
            <BookOpen className="w-16 h-16 text-red-400 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900">Không thể tải thư viện công khai</h3>
            <p className="text-gray-600">Đã xảy ra lỗi khi truy vấn dữ liệu thư viện. Vui lòng thử lại.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary"
            >
              Thử lại
            </button>
          </div>
        </div>
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
              <BookOpen className="w-6 h-6 text-gray-900" />
              <div>
                <h1 className="page-title">Thư viện Công khai</h1>
                <p className="page-subtitle">
                  Truy cập tài liệu tham khảo, mẫu và hướng dẫn
                </p>
              </div>
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
                      placeholder="Tìm kiếm tài liệu trong thư viện..."
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
                  onClick={() => {
                    setFilters({ category: '', search: '' });
                    setCurrentPage(1);
                  }}
                  className="btn-ghost whitespace-nowrap h-10 px-4"
                >
                  Xóa bộ lọc
                </button>
              </div>

              {/* Category Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SelectDropdown
                  label=""
                  options={[
                    { id: '', fullName: 'Tất cả Danh mục' },
                    { id: 'REFERENCE', fullName: 'Tài liệu Tham khảo' },
                    { id: 'TEMPLATE', fullName: 'Mẫu' },
                    { id: 'GUIDELINE', fullName: 'Hướng dẫn' },
                    { id: 'SYSTEM', fullName: 'Tài liệu Hệ thống' }
                  ]}
                  value={filters.category}
                  onChange={(category) => setFilters(prev => ({ ...prev, category }))}
                  placeholder="Tất cả Danh mục"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="card">
          <div className="card-body">
            {documents && documents.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {documents.map((document: PublicDocument) => (
                  <div
                    key={document.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0 text-2xl">
                            {getCategoryIcon(document.category)}
                          </div>
                          <h3 className="font-medium text-gray-900 flex-1">{document.fileName}</h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(document.category)}`}>
                            {getCategoryLabel(document.category)}
                          </span>
                        </div>
                        
                        {document.description && (
                          <div className="text-gray-600 text-sm mb-3 line-clamp-2">
                            {document.description}
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
                          <div className="text-gray-400 truncate">
                            bởi {document.uploader?.fullName || 'Người dùng Không xác định'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1 flex-shrink-0 ml-3">
                        <button
                          onClick={() => handleView(document)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="Xem Tài liệu"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDownload(document)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded"
                          title="Tải xuống Tài liệu"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tài liệu</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.category
                    ? 'Thử điều chỉnh bộ lọc để xem thêm tài liệu.'
                    : 'Chưa có tài liệu công khai nào.'}
                </p>
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
