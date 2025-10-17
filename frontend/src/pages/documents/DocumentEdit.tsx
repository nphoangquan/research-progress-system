import React from 'react';
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Save, 
  X, 
  FileText, 
  Calendar, 
  User,
  Tag,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import SelectDropdown from '../../components/ui/SelectDropdown';
import api from '../../lib/axios';

interface Document {
  id: string;
  fileName: string;
  description: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedBy: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  uploader: {
    id: string;
    fullName: string;
    email: string;
  };
  project: {
    id: string;
    title: string;
  };
}

export default function DocumentEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [editData, setEditData] = useState({
    description: '',
    status: 'PENDING' as 'PENDING' | 'APPROVED' | 'REJECTED'
  });

  // Fetch document data
  const { data: document, isLoading } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      const response = await api.get(`/documents/${id}`);
      return response.data.document;
    },
    enabled: !!id,
  });

  // Update editData when document is loaded
  useEffect(() => {
    if (document) {
      setEditData({
        description: document.description || '',
        status: document.status
      });
    }
  }, [document]);

  // Update document mutation
  const updateDocumentMutation = useMutation({
    mutationFn: async (data: { description?: string; status?: string }) => {
      const response = await api.put(`/documents/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document', id] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document updated successfully!');
      navigate('/documents');
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Failed to update document';
      toast.error(errorMessage);
    },
  });

  const handleSave = () => {
    updateDocumentMutation.mutate(editData);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateDocumentMutation.mutate(editData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate('/documents');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
              <div className="h-32 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user!} />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
            <p className="text-gray-600 mb-6">The document you're looking for doesn't exist or you don't have permission to view it.</p>
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
      <Navbar user={user!} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="page-header mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Document</h1>
          <p className="text-gray-600 mt-1">{document.project.title}</p>
        </div>

        <div className="card shadow-lg">
          <div className="card-body p-8">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* File Name - Read Only */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  File Name
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    readOnly
                    className="input pl-10 h-12 text-base bg-gray-50 cursor-not-allowed"
                    value={document.fileName}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  File name cannot be changed after upload
                </p>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="input"
                  placeholder="Add a description for this document..."
                  value={editData.description}
                  onChange={handleChange}
                />
              </div>

              {/* Status */}
              <div className="space-y-2">
                <SelectDropdown
                  label="Status"
                  options={[
                    { id: 'PENDING', fullName: 'Pending' },
                    { id: 'APPROVED', fullName: 'Approved' },
                    { id: 'REJECTED', fullName: 'Rejected' },
                    { id: 'ARCHIVED', fullName: 'Archived' },
                  ]}
                  value={editData.status}
                  onChange={(status) => setEditData({ ...editData, status: status as 'PENDING' | 'APPROVED' | 'REJECTED' })}
                  placeholder="Select status..."
                  icon={<CheckSquare className="w-5 h-5" />}
                />
              </div>

              {/* Document Details */}
              <div className="space-y-4 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Document Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Uploaded by</p>
                      <p className="text-sm text-gray-600">{document.uploader.fullName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Upload Date</p>
                      <p className="text-sm text-gray-600">{formatDate(document.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <Tag className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Status</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(document.status)}`}>
                      {document.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4 pt-8 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-secondary px-6 py-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateDocumentMutation.isPending}
                  className="btn-primary px-6 py-3"
                >
                  {updateDocumentMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
