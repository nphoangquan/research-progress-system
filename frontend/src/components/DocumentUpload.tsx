import { useState, useCallback } from 'react';
import type { DragEvent, FormEvent, ChangeEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import type { UploadDocumentRequest } from '../types/document';
import toast from 'react-hot-toast';
import RichTextEditor from './features/RichTextEditor';
import { getErrorMessage } from '../utils/errorUtils';
import { useStorageSettings } from '../hooks/useStorageSettings';

interface DocumentUploadProps {
  projectId: string;
  onSuccess?: () => void;
}

export default function DocumentUpload({ projectId, onSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const queryClient = useQueryClient();
  const { data: storageSettings, isLoading: isLoadingSettings } = useStorageSettings();

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
      toast.success('Đã tải lên tài liệu thành công!');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setFile(null);
      setDescription('');
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Tải lên thất bại'));
    },
  });

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const handleFileSelect = useCallback((selectedFile: File) => {
    if (!storageSettings) {
      toast.error('Đang tải cài đặt, vui lòng thử lại sau');
      return;
    }

    // Check file type
    if (!storageSettings.allowedFileTypes.includes(selectedFile.type)) {
      const allowedTypesList = storageSettings.allowedFileTypes
        .map(type => {
          if (type.startsWith('image/')) return 'ảnh';
          if (type.includes('pdf')) return 'PDF';
          if (type.includes('word') || type.includes('msword')) return 'DOC/DOCX';
          if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
          if (type.includes('powerpoint') || type.includes('presentation')) return 'PPT/PPTX';
          if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'tệp nén';
          if (type.includes('text/plain')) return 'TXT';
          return null;
        })
        .filter(Boolean)
        .join(', ');
      
      toast.error(`Loại tệp không được phép. Chỉ cho phép: ${allowedTypesList || 'các loại tệp đã cấu hình'}`);
      return;
    }

    // Check file size
    const maxSizeMB = Math.round(storageSettings.maxFileSize / (1024 * 1024));
    if (selectedFile.size > storageSettings.maxFileSize) {
      toast.error(`Kích thước tệp phải nhỏ hơn ${maxSizeMB}MB`);
      return;
    }

    setFile(selectedFile);
  }, [storageSettings]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error('Vui lòng chọn một tệp');
      return;
    }

    uploadMutation.mutate({
      projectId,
      file,
      description: description.trim() || undefined,
    });
  }, [file, projectId, description, uploadMutation]);

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Tải lên Tài liệu</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {file ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-900">{file.name}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="text-sm text-red-600 hover:text-red-500"
              >
                Xóa
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="text-sm text-gray-600">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="font-medium text-indigo-600 hover:text-indigo-500">
                    Nhấn để tải lên
                  </span>
                  <span> hoặc kéo thả</span>
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept={storageSettings?.allowedFileTypes.join(',') || '*/*'}
                  disabled={isLoadingSettings || !storageSettings}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const files = e.target.files;
                    if (files && files.length > 0) {
                      handleFileSelect(files[0]);
                    }
                  }}
                />
              </div>
              <p className="text-xs text-gray-500">
                {isLoadingSettings ? (
                  'Đang tải thông tin...'
                ) : storageSettings ? (
                  <>
                    {storageSettings.allowedFileTypes
                      .map(type => {
                        if (type.startsWith('image/')) return 'ảnh';
                        if (type.includes('pdf')) return 'PDF';
                        if (type.includes('word') || type.includes('msword')) return 'DOC/DOCX';
                        if (type.includes('excel') || type.includes('spreadsheet')) return 'Excel';
                        if (type.includes('powerpoint') || type.includes('presentation')) return 'PPT/PPTX';
                        if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return 'tệp nén';
                        if (type.includes('text/plain')) return 'TXT';
                        return null;
                      })
                      .filter(Boolean)
                      .join(', ')} tối đa {Math.round(storageSettings.maxFileSize / (1024 * 1024))}MB
                  </>
                ) : (
                  'Vui lòng thử lại sau'
                )}
              </p>
            </div>
          )}
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Mô tả (tùy chọn)
          </label>
          <RichTextEditor
            content={description}
            onChange={setDescription}
            placeholder="Mô tả ngắn gọn về tài liệu..."
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || uploadMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploadMutation.isPending ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải lên...
              </>
            ) : (
              'Tải lên Tài liệu'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
