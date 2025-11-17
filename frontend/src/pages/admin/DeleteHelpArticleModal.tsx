import { useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import { X, AlertTriangle, FileText } from 'lucide-react';

interface HelpArticle {
  id: string;
  title: string;
}

interface DeleteHelpArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  article: HelpArticle;
}

export default function DeleteHelpArticleModal({
  isOpen,
  onClose,
  article,
}: DeleteHelpArticleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

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

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/help/${article.id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bài viết đã được xóa');
      onClose();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể xóa bài viết'));
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Xóa bài viết</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-900 mb-1">
                  Cảnh báo: Hành động này không thể hoàn tác
                </h4>
                <p className="text-sm text-red-700">
                  Bạn có chắc chắn muốn xóa bài viết <strong>"{article.title}"</strong>?
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center mb-3">
              <FileText className="w-5 h-5 text-gray-600 mr-2" />
              <h4 className="text-sm font-medium text-gray-900">Thông tin bài viết</h4>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Tiêu đề:</span>
              <span className="ml-2 text-gray-900">{article.title}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={deleteMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="btn-danger"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Đang xóa...' : 'Xóa bài viết'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

