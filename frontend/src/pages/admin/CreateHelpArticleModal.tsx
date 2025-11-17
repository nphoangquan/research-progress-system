import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import { X } from 'lucide-react';
import CategoryInput from '../../components/ui/CategoryInput';

interface CreateHelpArticleModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
}

export default function CreateHelpArticleModal({
  isOpen,
  onClose,
  categories,
}: CreateHelpArticleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    order: 0,
    isPublished: true,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

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

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        content: '',
        category: '',
        order: 0,
        isPublished: true,
      });
      setErrors({});
    }
  }, [isOpen, categories]);

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await api.post('/help', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Bài viết đã được tạo thành công');
      onClose();
    },
    onError: (error: any) => {
      const errorMessage = getErrorMessage(error, 'Không thể tạo bài viết');
      toast.error(errorMessage);

      if (error.response?.data?.error) {
        setErrors({ general: error.response.data.error });
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!formData.title.trim()) {
      setErrors({ title: 'Tiêu đề là bắt buộc' });
      return;
    }

    if (!formData.content.trim()) {
      setErrors({ content: 'Nội dung là bắt buộc' });
      return;
    }

    if (!formData.category) {
      setErrors({ category: 'Danh mục là bắt buộc' });
      return;
    }

    if (formData.title.length > 200) {
      setErrors({ title: 'Tiêu đề không được vượt quá 200 ký tự' });
      return;
    }

    createMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Tạo bài viết trợ giúp</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`input w-full ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Nhập tiêu đề bài viết"
                maxLength={200}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/200 ký tự
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className={`input w-full min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
                placeholder="Nhập nội dung bài viết (có thể xuống dòng)"
              />
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục <span className="text-red-500">*</span>
                </label>
                <CategoryInput
                  value={formData.category}
                  onChange={(value) => setFormData({ ...formData, category: value })}
                  categories={categories}
                  error={errors.category}
                  placeholder="Nhập hoặc chọn danh mục"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Thứ tự hiển thị
                </label>
                <input
                  type="number"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({ ...formData, order: parseInt(e.target.value, 10) || 0 })
                  }
                  className="input w-full"
                  min="0"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData({ ...formData, isPublished: e.target.checked })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700">Xuất bản ngay</span>
              </label>
            </div>

            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errors.general}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={createMutation.isPending}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? 'Đang tạo...' : 'Tạo bài viết'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

