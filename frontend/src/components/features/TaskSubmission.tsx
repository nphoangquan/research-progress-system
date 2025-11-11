import { useState, useCallback } from 'react';
import type { DragEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import RichTextEditor from '../features/RichTextEditor';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { 
  Upload, 
  FileText, 
  Send, 
  X,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface TaskSubmissionProps {
  taskId: string;
  onSubmissionSuccess?: () => void;
  currentSubmission?: {
    content: string | null;
    submittedAt: string | null;
    submittedBy: string | null;
  };
  taskDueDate?: string | null;
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

export default function TaskSubmission({ taskId, onSubmissionSuccess, currentSubmission, taskDueDate }: TaskSubmissionProps) {
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFiles, setSubmissionFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const queryClient = useQueryClient();

  // Submit task mutation
  const submitTaskMutation = useMutation({
    mutationFn: async (data: { content: string; files: File[] }) => {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('taskId', taskId);
      
      // Add files
      data.files.forEach((file) => {
        formData.append(`files`, file);
      });

      const response = await api.post('/tasks/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Đã nộp nhiệm vụ thành công!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setSubmissionContent('');
      setSubmissionFiles([]);
      onSubmissionSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Không thể nộp nhiệm vụ');
    },
  });

  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `Tệp "${file.name}" quá lớn (tối đa ${MAX_FILE_SIZE / (1024 * 1024)}MB)`;
    }
    
    // Check file type (allow if type is empty or in allowed list)
    if (file.type && !ALLOWED_FILE_TYPES.includes(file.type)) {
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

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Check total file count
    if (submissionFiles.length + newFiles.length > MAX_FILES) {
      toast.error(`Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp`);
      return;
    }
    
    // Validate each file
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    newFiles.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errors.push(error);
      } else {
        validFiles.push(file);
      }
    });
    
    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(error => toast.error(error));
    }
    
    // Add valid files
    if (validFiles.length > 0) {
      setSubmissionFiles(prev => [...prev, ...validFiles]);
      if (validFiles.length < newFiles.length) {
        toast.error(`${newFiles.length - validFiles.length} tệp đã bị bỏ qua do không hợp lệ`);
      }
    }
  }, [submissionFiles.length, validateFile]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  const removeFile = useCallback((index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleSubmit = useCallback(() => {
    if (!submissionContent.trim() && submissionFiles.length === 0) {
      toast.error('Vui lòng cung cấp nội dung nộp bài hoặc tải lên tệp');
      return;
    }

    // Check due date validation
    if (taskDueDate) {
      const dueDate = new Date(taskDueDate);
      const now = new Date();
      if (now > dueDate) {
        toast.error('Hạn nộp bài đã qua. Bạn không thể nộp nhiệm vụ này nữa.');
        return;
      }
    }

    // Final validation of files before submit
    const invalidFiles = submissionFiles.filter(file => validateFile(file) !== null);
    if (invalidFiles.length > 0) {
      toast.error('Một số tệp không hợp lệ. Vui lòng xóa chúng trước khi nộp.');
      return;
    }

    submitTaskMutation.mutate({
      content: submissionContent,
      files: submissionFiles,
    });
  }, [submissionContent, submissionFiles, taskDueDate, submitTaskMutation, validateFile]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  return (
    <div className="space-y-6">
      {/* Due Date Warning */}
      {taskDueDate && (() => {
        const dueDate = new Date(taskDueDate);
        const now = new Date();
        const isOverdue = now > dueDate;
        
        if (isOverdue) {
          return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="text-sm font-medium text-red-900">Hạn nộp bài đã qua</h4>
              </div>
              <div className="text-sm text-red-800">
                Hạn nộp bài là: {dueDate.toLocaleString('vi-VN')}
              </div>
              <div className="text-sm text-red-800 mt-1">
                Bạn không thể nộp nhiệm vụ này nữa.
              </div>
            </div>
          );
        }
        
        const timeLeft = dueDate.getTime() - now.getTime();
        const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
        
        if (daysLeft <= 3) {
          return (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <h4 className="text-sm font-medium text-yellow-900">Sắp đến hạn</h4>
              </div>
              <div className="text-sm text-yellow-800">
                Hạn nộp bài: {dueDate.toLocaleString('vi-VN')} (còn {daysLeft} ngày)
              </div>
            </div>
          );
        }
        
        return null;
      })()}

      {/* Current Submission Info */}
      {currentSubmission?.content && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="w-5 h-5 text-blue-600" />
            <h4 className="text-sm font-medium text-blue-900">Bài nộp trước đó</h4>
          </div>
          <div className="text-sm text-blue-800 mb-2">
            Đã nộp vào: {currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString('vi-VN') : 'Không xác định'}
          </div>
          <div className="bg-white border border-blue-200 rounded p-3 max-h-32 overflow-hidden">
            <div 
              className="text-sm text-gray-700 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: currentSubmission.content.substring(0, 200) + (currentSubmission.content.length > 200 ? '...' : '')
              }}
            />
          </div>
        </div>
      )}

      {/* Submission Content */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <FileText className="w-5 h-5 mr-2" />
            Nộp Nhiệm vụ
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Mô tả công việc, kết quả và bất kỳ thông tin bổ sung nào về nhiệm vụ này.
          </p>
        </div>
        <div className="card-body">
          <RichTextEditor
            content={submissionContent}
            onChange={setSubmissionContent}
            placeholder="Mô tả công việc, kết quả, phương pháp, kết quả và bất kỳ thông tin liên quan nào khác..."
            className="min-h-[300px]"
          />
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Tệp Đính kèm
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Tải lên tài liệu, hình ảnh, tệp mã nguồn hoặc bất kỳ tài liệu hỗ trợ nào khác.
          </p>
        </div>
        <div className="card-body">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Kéo thả tệp vào đây hoặc nhấp để tải lên
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Hỗ trợ tài liệu, hình ảnh, tệp mã nguồn và nhiều hơn nữa
            </p>
            <input
              type="file"
              multiple
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="btn-primary cursor-pointer"
            >
              Chọn Tệp
            </label>
          </div>

          {/* File List */}
          {submissionFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Tệp đã chọn ({submissionFiles.length})
              </h4>
              <div className="space-y-2">
                {submissionFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <FileText className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        {(() => {
          const isOverdue = Boolean(taskDueDate && new Date(taskDueDate) < new Date());
          
          return (
            <button
              onClick={handleSubmit}
              disabled={submitTaskMutation.isPending || isOverdue}
              className={`flex items-center space-x-2 ${
                isOverdue 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {submitTaskMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Đang nộp...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isOverdue ? 'Đã đóng nộp bài' : 'Nộp Nhiệm vụ'}</span>
                </>
              )}
            </button>
          );
        })()}
      </div>

      {/* Submission Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Hướng dẫn Nộp bài
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Cung cấp mô tả chi tiết về công việc và kết quả của bạn</li>
              <li>• Bao gồm tất cả các tệp và tài liệu hỗ trợ liên quan</li>
              <li>• Sau khi nộp, trạng thái nhiệm vụ sẽ thay đổi thành "Hoàn thành"</li>
              <li>• Bạn vẫn có thể chỉnh sửa bài nộp cho đến khi được xem xét</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
