import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import api from '../lib/axios';
import toast from 'react-hot-toast';
import { 
  ArrowLeft, 
  Upload, 
  FileText, 
  X, 
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface UploadDocumentRequest {
  projectId: string;
  file: File;
  description?: string;
}

export default function DocumentUpload() {
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

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadDocumentRequest) => {
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('projectId', data.projectId);
      if (data.description) {
        formData.append('description', data.description);
      }

      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Document uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      navigate(projectId ? `/projects/${projectId}/documents` : '/documents');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Upload failed');
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Only PDF, DOC, DOCX, and TXT files are allowed');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !projectId) {
      toast.error('Please select a file');
      return;
    }

    uploadMutation.mutate({
      projectId,
      file,
      description: description.trim() || undefined
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Upload Document</h1>
              <p className="page-subtitle">
                {project ? `${project.title} - Upload new document` : 'Upload new document'}
              </p>
            </div>
            
            <button
              onClick={() => navigate(projectId ? `/projects/${projectId}/documents` : '/documents')}
              className="btn-secondary"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Documents
            </button>
          </div>
        </div>

        {/* Upload Form */}
        <div className="max-w-2xl mx-auto">
          <div className="card">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* File Upload Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document File <span className="text-error-500">*</span>
                  </label>
                  
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDragOver
                        ? 'border-primary-400 bg-primary-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    {file ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <FileText className="w-12 h-12 text-primary-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFile(null)}
                          className="btn-ghost text-sm"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Remove File
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center">
                          <Upload className="w-12 h-12 text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Drop your file here, or{' '}
                            <label className="text-primary-600 hover:text-primary-500 cursor-pointer">
                              browse
                              <input
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={(e) => {
                                  const selectedFile = e.target.files?.[0];
                                  if (selectedFile) {
                                    handleFileSelect(selectedFile);
                                  }
                                }}
                              />
                            </label>
                          </p>
                          <p className="text-sm text-gray-500">
                            Supports PDF, DOC, DOCX, TXT files up to 10MB
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description for this document..."
                    rows={4}
                    className="input w-full"
                  />
                </div>

                {/* File Requirements */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="text-sm">
                      <h4 className="font-medium text-blue-900 mb-2">File Requirements</h4>
                      <ul className="text-blue-800 space-y-1">
                        <li>• Supported formats: PDF, DOC, DOCX, TXT</li>
                        <li>• Maximum file size: 10MB</li>
                        <li>• Documents will be indexed for AI search</li>
                        <li>• Processing may take a few minutes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => navigate(projectId ? `/projects/${projectId}/documents` : '/documents')}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!file || uploadMutation.isPending}
                    className="btn-primary"
                  >
                    {uploadMutation.isPending ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Document
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
