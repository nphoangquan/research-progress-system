import { useState, useCallback, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Paperclip, X, Edit } from 'lucide-react';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { formatFileSize } from '../../utils/taskUtils';
import type { DragEvent, ChangeEvent } from 'react';

interface TaskAttachmentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  onSuccess?: () => void;
}

// File validation constants - moved outside component
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file
const MAX_FILES = 20; // Maximum number of files
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  // Images
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  // Code files
  'text/plain',
  'text/javascript',
  'text/css',
  'text/html',
  'application/json',
  'application/xml',
  // Archives
  'application/zip',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/x-tar',
  'application/gzip',
] as const;

export default function TaskAttachmentUploadModal({
  isOpen,
  onClose,
  taskId,
  onSuccess,
}: TaskAttachmentUploadModalProps) {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDivElement>(null);
  const [isMultipleUpload, setIsMultipleUpload] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFiles, setUploadFiles] = useState<File[]>([]);
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadDescriptions, setUploadDescriptions] = useState<string[]>([]);
  const [globalDescription, setGlobalDescription] = useState('');
  const [expandedFileDescriptions, setExpandedFileDescriptions] = useState<number[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Upload single attachment mutation
  const uploadAttachmentMutation = useMutation({
    mutationFn: async (data: { file: File; description?: string }) => {
      const formData = new FormData();
      formData.append('file', data.file);
      if (data.description) {
        formData.append('description', data.description);
      }
      
      const response = await api.post(`/task-attachments/${taskId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success('Tải lên tệp đính kèm thành công!');
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Tải lên tệp đính kèm thất bại';
      toast.error(errorMessage);
      setUploadProgress(0);
    },
  });

  // Upload multiple attachments mutation
  const uploadMultipleAttachmentsMutation = useMutation({
    mutationFn: async (data: { files: File[]; descriptions: string[] }) => {
      const formData = new FormData();
      
      // Append all files
      data.files.forEach((file) => {
        formData.append('files', file);
      });
      
      // Append descriptions as JSON array
      if (data.descriptions.length > 0) {
        formData.append('descriptions', JSON.stringify(data.descriptions));
      }
      
      const response = await api.post(`/task-attachments/${taskId}/upload-multiple`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['task-attachments', taskId] });
      toast.success(`Tải lên thành công ${data.attachments.length} tệp!`);
      if (data.failedUploads && data.failedUploads.length > 0) {
        toast.error(`${data.failedUploads.length} tệp tải lên thất bại`);
      }
      handleClose();
      onSuccess?.();
    },
    onError: (err: any) => {
      const errorMessage = err.response?.data?.error || 'Tải lên tệp đính kèm thất bại';
      toast.error(errorMessage);
      setUploadProgress(0);
    },
  });

  const handleClose = useCallback(() => {
    setUploadFile(null);
    setUploadFiles([]);
    setUploadDescriptions([]);
    setUploadDescription('');
    setGlobalDescription('');
    setExpandedFileDescriptions([]);
    setIsDragOver(false);
    setUploadProgress(0);
    setIsMultipleUpload(false);
    onClose();
  }, [onClose]);

  // Close modal on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClose]);

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `Tệp "${file.name}" quá lớn (tối đa ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
    }
    
    // Check file type (allow if type is empty or in allowed list)
    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type as any)) {
      // Allow files without type (some systems don't set MIME type)
      // But warn if it's a known dangerous type
      const extension = file.name.split('.').pop()?.toLowerCase();
      const dangerousExtensions = ['exe', 'bat', 'cmd', 'com', 'pif', 'scr', 'vbs', 'js'];
      if (extension && dangerousExtensions.includes(extension)) {
        return `Loại tệp "${file.name}" không được phép vì lý do bảo mật`;
      }
    }
    
    return null;
  }, []);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      if (isMultipleUpload) {
        // Check total file count
        if (uploadFiles.length + validFiles.length > MAX_FILES) {
          toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp`);
          const allowedCount = MAX_FILES - uploadFiles.length;
          if (allowedCount > 0) {
            setUploadFiles(prev => [...prev, ...validFiles.slice(0, allowedCount)]);
            setUploadDescriptions(prev => [...prev, ...new Array(allowedCount).fill('')]);
          }
        } else {
          setUploadFiles(prev => [...prev, ...validFiles]);
          setUploadDescriptions(prev => [...prev, ...new Array(validFiles.length).fill('')]);
        }
      } else {
        setUploadFile(validFiles[0]);
      }
    }
  }, [isMultipleUpload, uploadFiles.length, validateFile]);

  const handleMultipleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    fileArray.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }

    if (validFiles.length > 0) {
      const totalFiles = uploadFiles.length + validFiles.length;
      if (totalFiles > MAX_FILES) {
        toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp`);
        const allowedCount = MAX_FILES - uploadFiles.length;
        if (allowedCount > 0) {
          setUploadFiles(prev => [...prev, ...validFiles.slice(0, allowedCount)]);
          setUploadDescriptions(prev => [...prev, ...new Array(allowedCount).fill('')]);
        }
      } else {
        setUploadFiles(prev => [...prev, ...validFiles]);
        setUploadDescriptions(prev => [...prev, ...new Array(validFiles.length).fill('')]);
      }
    }
  }, [uploadFiles.length, validateFile]);

  const handleUploadAttachment = useCallback(() => {
    if (!uploadFile) return;
    
    // Final validation
    const error = validateFile(uploadFile);
    if (error) {
      toast.error(error);
      return;
    }
    
    setUploadProgress(0);
    uploadAttachmentMutation.mutate({
      file: uploadFile,
      description: uploadDescription || undefined
    });
  }, [uploadFile, uploadDescription, uploadAttachmentMutation, validateFile]);

  const handleMultipleUploadAttachment = useCallback(() => {
    if (uploadFiles.length === 0) return;
    
    // Final validation
    const invalidFiles = uploadFiles.filter(file => validateFile(file) !== null);
    if (invalidFiles.length > 0) {
      toast.error('Một số tệp không hợp lệ. Vui lòng xóa chúng trước khi tải lên.');
      return;
    }
    
    setUploadProgress(0);
    
    const finalDescriptions = globalDescription 
      ? uploadFiles.map(() => globalDescription)
      : uploadDescriptions;
    
    uploadMultipleAttachmentsMutation.mutate({
      files: uploadFiles,
      descriptions: finalDescriptions
    });
  }, [uploadFiles, globalDescription, uploadDescriptions, uploadMultipleAttachmentsMutation, validateFile]);

  const handleRemoveFile = useCallback((index: number) => {
    setUploadFiles(prev => prev.filter((_, i) => i !== index));
    setUploadDescriptions(prev => prev.filter((_, i) => i !== index));
    setExpandedFileDescriptions(prev => prev.filter(i => i !== index).map(i => i > index ? i - 1 : i));
  }, []);

  const handleDescriptionChange = useCallback((index: number, description: string) => {
    setUploadDescriptions(prev => {
      const newDescriptions = [...prev];
      newDescriptions[index] = description;
      return newDescriptions;
    });
  }, []);

  const toggleFileDescription = useCallback((index: number) => {
    setExpandedFileDescriptions(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      if (isMultipleUpload) {
        handleMultipleFileSelect({ target: { files: droppedFiles } } as any);
      } else {
        handleFileSelect({ target: { files: [droppedFiles[0]] } } as any);
      }
    }
  }, [isMultipleUpload, handleMultipleFileSelect, handleFileSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Tải lên tệp đính kèm</h3>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Đơn</span>
              <button
                onClick={() => {
                  setIsMultipleUpload(!isMultipleUpload);
                  setUploadFile(null);
                  setUploadFiles([]);
                  setUploadDescriptions([]);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isMultipleUpload ? 'bg-primary-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isMultipleUpload ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className="text-sm text-gray-600">Nhiều</span>
            </div>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragOver
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-2">
                <Paperclip className="w-8 h-8 text-gray-400 mx-auto" />
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">Nhấp để tải lên</span> hoặc kéo thả
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PDF, DOC, DOCX, TXT, Hình ảnh, Excel, Tệp nén (tối đa {MAX_FILE_SIZE / (1024 * 1024)}MB mỗi tệp)
                    {isMultipleUpload && ` • Tối đa ${MAX_FILES} tệp`}
                  </p>
                </div>
              </div>
              
              <input
                type="file"
                onChange={isMultipleUpload ? handleMultipleFileSelect : handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.zip,.rar,.7z"
                multiple={isMultipleUpload}
                className="hidden"
                id="file-upload"
              />
              <label
                htmlFor="file-upload"
                className="mt-3 inline-block btn-secondary cursor-pointer"
              >
                Chọn tệp
              </label>
            </div>

            {/* Single File Preview */}
            {!isMultipleUpload && uploadFile && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Paperclip className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{uploadFile.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(uploadFile.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setUploadFile(null)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mô tả (tùy chọn)
                  </label>
                  <textarea
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Thêm mô tả cho tệp này..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {/* Multiple Files Preview */}
            {isMultipleUpload && uploadFiles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-gray-700">Tệp đã chọn ({uploadFiles.length})</h4>
                  {uploadFiles.length > 5 && (
                    <div className="text-xs text-gray-500">
                      Cuộn để xem tất cả tệp
                    </div>
                  )}
                </div>
                
                {/* Compact File List with Scroll */}
                <div className="max-h-80 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-3">
                  {uploadFiles.map((file, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <Paperclip className="w-4 h-4 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate" title={file.name}>
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <button
                            onClick={() => toggleFileDescription(index)}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                            title="Thêm mô tả"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveFile(index)}
                            className="p-1 text-red-400 hover:text-red-600 transition-colors"
                            title="Xóa tệp"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Expandable Description */}
                      {expandedFileDescriptions.includes(index) && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Mô tả (tùy chọn)
                          </label>
                          <textarea
                            value={uploadDescriptions[index] || ''}
                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                            placeholder="Thêm mô tả cho tệp này..."
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Global Description Option */}
                {uploadFiles.length > 3 && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <label className="block text-sm font-medium text-blue-900 mb-2">
                      Mô tả chung (áp dụng cho tất cả tệp)
                    </label>
                    <textarea
                      value={globalDescription}
                      onChange={(e) => setGlobalDescription(e.target.value)}
                      placeholder="Thêm mô tả áp dụng cho tất cả tệp..."
                      className="w-full px-3 py-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          {/* Upload Progress */}
          {(uploadAttachmentMutation.isPending || uploadMultipleAttachmentsMutation.isPending) && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Đang tải lên...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={handleClose}
              className="btn-secondary"
              disabled={uploadAttachmentMutation.isPending || uploadMultipleAttachmentsMutation.isPending}
            >
              Hủy
            </button>
            <button
              onClick={isMultipleUpload ? handleMultipleUploadAttachment : handleUploadAttachment}
              className="btn-primary"
              disabled={
                (isMultipleUpload ? uploadFiles.length === 0 : !uploadFile) ||
                uploadAttachmentMutation.isPending ||
                uploadMultipleAttachmentsMutation.isPending
              }
            >
              {isMultipleUpload ? `Tải lên ${uploadFiles.length} tệp` : 'Tải lên tệp'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

