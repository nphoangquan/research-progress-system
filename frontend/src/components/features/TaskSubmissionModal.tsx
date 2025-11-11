import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { X, User, Clock, CheckCircle, Paperclip, Download, Copy, Check } from 'lucide-react';
import { formatDateTime, formatFileSize } from '../../utils/taskUtils';
import { sanitizeHTML } from '../../utils/sanitize';
import toast from 'react-hot-toast';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploader: {
    fullName: string;
  };
  description: string | null;
}

interface TaskSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  submissionContent: string;
  submittedByUser?: {
    fullName: string;
  } | null;
  submittedAt: string | null;
  attachments?: Attachment[];
  onDownload?: (fileUrl: string, fileName: string) => void;
}

export default function TaskSubmissionModal({
  isOpen,
  onClose,
  submissionContent,
  submittedByUser,
  submittedAt,
  attachments,
  onDownload,
}: TaskSubmissionModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  // Close modal on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Sanitize HTML content
  const sanitizedContent = useMemo(() => {
    if (!submissionContent) return '';
    return sanitizeHTML(submissionContent);
  }, [submissionContent]);

  const handleDownload = useCallback((fileUrl: string, fileName: string) => {
    onDownload?.(fileUrl, fileName);
  }, [onDownload]);

  const handleCopyContent = useCallback(async () => {
    try {
      // Create a temporary element to extract text from HTML
      const temp = document.createElement('div');
      temp.innerHTML = submissionContent;
      const textContent = temp.textContent || temp.innerText || '';
      
      await navigator.clipboard.writeText(textContent);
      setCopied(true);
      toast.success('Đã sao chép nội dung vào clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Không thể sao chép nội dung');
    }
  }, [submissionContent]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div ref={modalRef} className="bg-white p-6 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Chi tiết nộp bài</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Submission Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <strong>Nộp bởi:</strong> {submittedByUser?.fullName || 'Không xác định'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <strong>Nộp vào:</strong> {submittedAt ? formatDateTime(submittedAt) : 'Không xác định'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-700">
                  <strong>Trạng thái:</strong> Hoàn thành
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Paperclip className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-700">
                  <strong>Tệp đính kèm:</strong> {attachments?.length || 0} tệp
                </span>
              </div>
            </div>
          </div>

          {/* Submission Content */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Nội dung nộp bài</h4>
              <button
                onClick={handleCopyContent}
                className="flex items-center space-x-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                title="Sao chép nội dung"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Đã sao chép</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Sao chép</span>
                  </>
                )}
              </button>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 bg-white">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: sanitizedContent }}
              />
            </div>
          </div>

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Tệp đã nộp</h4>
              <div className="space-y-3">
                {attachments.map((attachment) => (
                  <div key={attachment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Paperclip className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium text-gray-900">{attachment.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {formatFileSize(attachment.fileSize)} • Tải lên bởi {attachment.uploader.fullName}
                        </p>
                        {attachment.description && (
                          <p className="text-sm text-gray-600 mt-1">{attachment.description}</p>
                        )}
                      </div>
                    </div>
                    {onDownload && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDownload(attachment.fileUrl, attachment.fileName)}
                          className="btn-ghost p-2 text-green-600 hover:text-green-800"
                          title="Tải xuống tệp"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="btn-secondary"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

