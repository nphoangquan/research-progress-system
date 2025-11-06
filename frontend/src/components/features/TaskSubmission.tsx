import React from 'react';
import { useState } from 'react';
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

export default function TaskSubmission({ taskId, onSubmissionSuccess, currentSubmission, taskDueDate }: TaskSubmissionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      toast.success('Task submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['task', taskId] });
      setSubmissionContent('');
      setSubmissionFiles([]);
      onSubmissionSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to submit task');
    },
  });

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    setSubmissionFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const removeFile = (index: number) => {
    setSubmissionFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!submissionContent.trim() && submissionFiles.length === 0) {
      toast.error('Please provide submission content or upload files');
      return;
    }

    // Check due date validation
    if (taskDueDate) {
      const dueDate = new Date(taskDueDate);
      const now = new Date();
      if (now > dueDate) {
        toast.error('Submission deadline has passed. You cannot submit this task anymore.');
        return;
      }
    }

    setIsSubmitting(true);
    submitTaskMutation.mutate({
      content: submissionContent,
      files: submissionFiles,
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
                <h4 className="text-sm font-medium text-red-900">Submission Deadline Passed</h4>
              </div>
              <div className="text-sm text-red-800">
                The submission deadline was: {dueDate.toLocaleString()}
              </div>
              <div className="text-sm text-red-800 mt-1">
                You can no longer submit this task.
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
                <h4 className="text-sm font-medium text-yellow-900">Deadline Approaching</h4>
              </div>
              <div className="text-sm text-yellow-800">
                Submission deadline: {dueDate.toLocaleString()} ({daysLeft} day{daysLeft !== 1 ? 's' : ''} left)
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
            <h4 className="text-sm font-medium text-blue-900">Previous Submission</h4>
          </div>
          <div className="text-sm text-blue-800 mb-2">
            Submitted on: {currentSubmission.submittedAt ? new Date(currentSubmission.submittedAt).toLocaleString() : 'Unknown'}
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
            Task Submission
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Describe your work, findings, and any additional information about this task.
          </p>
        </div>
        <div className="card-body">
          <RichTextEditor
            content={submissionContent}
            onChange={setSubmissionContent}
            placeholder="Describe your work, findings, methodology, results, and any other relevant information..."
            className="min-h-[300px]"
          />
        </div>
      </div>

      {/* File Upload */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Upload className="w-5 h-5 mr-2" />
            Supporting Files
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Upload documents, images, code files, or any other supporting materials.
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
              Drop files here or click to upload
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports documents, images, code files, and more
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
              Choose Files
            </label>
          </div>

          {/* File List */}
          {submissionFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">
                Selected Files ({submissionFiles.length})
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
              disabled={submitTaskMutation.isPending || isSubmitting || isOverdue}
              className={`flex items-center space-x-2 ${
                isOverdue 
                  ? 'text-gray-500 cursor-not-allowed' 
                  : 'btn-primary'
              }`}
            >
              {submitTaskMutation.isPending || isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{isOverdue ? 'Submission Closed' : 'Submit Task'}</span>
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
              Submission Guidelines
            </h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Provide a detailed description of your work and findings</li>
              <li>• Include all relevant files and supporting materials</li>
              <li>• Once submitted, the task status will change to "Completed"</li>
              <li>• You can still edit your submission until it's reviewed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
