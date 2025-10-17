import React from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  User,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Share,
  Copy
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
  const { data: document, isLoading } = useQuery({
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
      toast.success('Document deleted successfully!');
      navigate(document?.projectId ? `/projects/${document.projectId}/documents` : '/documents');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete document');
    },
  });

  const getStatusIcon = (status: string) => {
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (!document) return;
    
    const link = document.createElement('a');
    link.href = document.fileUrl;
    link.download = document.fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = () => {
    if (!document) return;
    window.open(document.fileUrl, '_blank');
  };

  const handleCopyLink = () => {
    if (!document) return;
    
    navigator.clipboard.writeText(document.fileUrl);
    toast.success('Link copied to clipboard!');
  };

  const handleDelete = () => {
    if (!document) return;
    deleteDocumentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading document...</p>
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">Document not found</h3>
            <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/documents')}
              className="btn-primary"
            >
              Back to Documents
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
                {document.project.title} - Document Details
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(document.projectId ? `/projects/${document.projectId}/documents` : '/documents')}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Documents
              </button>
              <button
                onClick={handleView}
                className="btn-secondary"
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </button>
              <button
                onClick={handleDownload}
                className="btn-primary"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
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
                      <span>Uploaded {formatDate(document.createdAt)}</span>
                    </div>
                    {document.description && (
                      <p className="text-gray-700">{document.description}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Actions */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Actions</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={handleView}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View Document
                  </button>
                  <button
                    onClick={handleDownload}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </button>
                  <button
                    onClick={() => window.open(document.fileUrl, '_blank')}
                    className="btn-secondary flex items-center justify-center"
                  >
                    <Share className="w-4 h-4 mr-2" />
                    Share
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
                <h3 className="text-lg font-medium text-gray-900 mb-4">Status</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(document.indexStatus)}
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.indexStatus)}`}>
                      {document.indexStatus}
                    </span>
                  </div>
                  {document.indexedAt && (
                    <div className="text-sm text-gray-500">
                      Indexed: {formatDate(document.indexedAt)}
                    </div>
                  )}
                  {document.chunkCount && (
                    <div className="text-sm text-gray-500">
                      Chunks: {document.chunkCount}
                    </div>
                  )}
                  {document.errorMessage && (
                    <div className="text-sm text-red-600">
                      Error: {document.errorMessage}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Document Details */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Details</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">File Size:</span>
                    <p className="font-medium text-gray-900">{formatFileSize(document.fileSize)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">File Type:</span>
                    <p className="font-medium text-gray-900">{document.mimeType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Uploaded:</span>
                    <p className="font-medium text-gray-900">{formatDate(document.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Last Updated:</span>
                    <p className="font-medium text-gray-900">{formatDate(document.updatedAt)}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            {(user.role === 'ADMIN' || user.role === 'LECTURER') && (
              <div className="card">
                <div className="card-body">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate(`/documents/${document.id}/edit`)}
                      className="btn-secondary w-full flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Document
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="btn-danger w-full flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Document
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
                  <h3 className="text-lg font-medium text-gray-900">Delete Document</h3>
                  <p className="text-sm text-gray-500">This action cannot be undone.</p>
                </div>
              </div>
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete "{document.fileName}"? This will permanently remove the document from the system.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteDocumentMutation.isPending}
                  className="btn-danger"
                >
                  {deleteDocumentMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
