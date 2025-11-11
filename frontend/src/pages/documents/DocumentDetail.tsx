import { useState, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import { sanitizeHTML } from '../../utils/sanitize';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Share,
  Copy
} from 'lucide-react';

interface DocumentData {
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

export default function DocumentDetail() {
  const { id } = useParams<{ id: string }>();
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

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Fetch document
  const { data: document, isLoading, isError, refetch } = useQuery<DocumentData>({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data.document;
    },
    enabled: !!id,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/documents/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Xóa tài liệu thành công!');
      navigate(document?.projectId ? `/projects/${document.projectId}/documents` : '/documents');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Xóa tài liệu thất bại');
    },
  });

  // Status labels in Vietnamese
  const statusLabels: Record<string, string> = useMemo(() => ({
    'PENDING': 'Đang chờ',
    'PROCESSING': 'Đang xử lý',
    'INDEXED': 'Đã lập chỉ mục',
    'FAILED': 'Thất bại'
  }), []);

  const translateStatus = useCallback((status: string) => {
    return statusLabels[status] || status;
  }, [statusLabels]);

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'PROCESSING':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'INDEXED':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: string) => {
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
  }, []);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  const handleDownload = useCallback(() => {
    if (!document) return;
    
    const link = window.document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
  }, [document]);

  const handleView = useCallback(() => {
    if (!document) return;
    window.open(document.fileUrl, '_blank');
  }, [document]);

  const handleCopyLink = useCallback(async () => {
    if (!document) return;
    
    try {
      await navigator.clipboard.writeText(document.fileUrl);
      toast.success('Đã sao chép liên kết vào clipboard!');
    } catch (error) {
      toast.error('Không thể sao chép liên kết');
    }
  }, [document]);

  const handleDelete = useCallback(() => {
    if (!document) return;
    deleteDocumentMutation.mutate();
  }, [document, deleteDocumentMutation]);

  const handleNavigateBack = useCallback(() => {
    navigate(document?.projectId ? `/projects/${document.projectId}/documents` : '/documents');
  }, [navigate, document?.projectId]);

  const handleNavigateEdit = useCallback(() => {
    if (!document) return;
    navigate(`/documents/${document.id}/edit`);
  }, [navigate, document]);

  // Sanitize description
  const sanitizedDescription = useMemo(() => {
    if (!document?.description) return null;
    return sanitizeHTML(document.description);
  }, [document?.description]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12 space-y-4">
            <FileText className="w-16 h-16 text-red-400 mx-auto" />
            <h3 className="text-lg font-medium text-gray-900">Không thể tải tài liệu</h3>
            <p className="text-gray-600">Đã xảy ra lỗi khi truy vấn dữ liệu tài liệu. Vui lòng thử lại.</p>
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

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy tài liệu</h3>
            <p className="text-gray-600 mb-6">Tài liệu bạn đang tìm không tồn tại hoặc bạn không có quyền truy cập.</p>
            <button
              onClick={() => navigate('/documents')}
              className="btn-primary"
            >
              Quay lại Tài liệu
            </button>
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
              <h1 className="page-title">{document.fileName}</h1>
              <p className="page-subtitle">
                {document.project.title} - Chi tiết Tài liệu
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={handleNavigateBack}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Quay lại Tài liệu
              </button>
              <button
                onClick={handleView}
                className="btn-secondary"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Tải xuống
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Document Info */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-primary-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">
                      {document.fileName}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{document.mimeType}</span>
                      <span>•</span>
                      <span>Tải lên {formatDate(document.createdAt)}</span>
                    </div>
                    {sanitizedDescription && (
                      <div 
                        className="text-gray-700 prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Actions */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Thao tác</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleView}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Xem Tài liệu
                  </button>
                  <button
                    onClick={handleDownload}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Tải xuống
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Sao chép Liên kết
                  </button>
                  <button
                    onClick={handleView}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Chia sẻ
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Document Status */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Trạng thái</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(document.indexStatus)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.indexStatus)}`}>
                      {translateStatus(document.indexStatus)}
                    </span>
                  </div>
                  {document.indexedAt && (
                    <div className="text-sm text-gray-500">
                      Đã lập chỉ mục: {formatDate(document.indexedAt)}
                    </div>
                  )}
                  {document.chunkCount && (
                    <div className="text-sm text-gray-500">
                      Số đoạn: {document.chunkCount}
                    </div>
                  )}
                  {document.errorMessage && (
                    <div className="text-sm text-red-600">
                      Lỗi: {document.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Chi tiết</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Kích thước:</span>
                    <p className="font-medium text-gray-900">{formatFileSize(document.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Loại tệp:</span>
                    <p className="font-medium text-gray-900">{document.mimeType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Tải lên:</span>
                    <p className="font-medium text-gray-900">{formatDate(document.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Cập nhật lần cuối:</span>
                    <p className="font-medium text-gray-900">{formatDate(document.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Thao tác Quản trị</h3>
                  <div className="space-y-3">
                    <button
                      onClick={handleNavigateEdit}
                      className="btn-secondary w-full flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Chỉnh sửa Tài liệu
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-danger w-full flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Xóa Tài liệu
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Xóa Tài liệu</h3>
                  <p className="text-sm text-gray-500">Hành động này không thể hoàn tác.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Bạn có chắc chắn muốn xóa "{document.fileName}"? Điều này sẽ xóa vĩnh viễn tài liệu khỏi hệ thống.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteDocumentMutation.isPending}
                  className="btn-danger"
                >
                  {deleteDocumentMutation.isPending ? 'Đang xóa...' : 'Xóa'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
