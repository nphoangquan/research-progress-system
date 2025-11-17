import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import { HelpCircle, Plus, Edit2, Trash2, Search, Eye, EyeOff } from 'lucide-react';
import SelectDropdown from '../../components/ui/SelectDropdown';
import CreateHelpArticleModal from './CreateHelpArticleModal';
import EditHelpArticleModal from './EditHelpArticleModal';
import DeleteHelpArticleModal from './DeleteHelpArticleModal';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    fullName: string;
  };
  updater?: {
    id: string;
    fullName: string;
  };
}

export default function HelpManagement() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    category: '',
    search: '',
    isPublished: '',
  });

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['help-categories'],
    queryFn: async () => {
      const response = await api.get('/help/categories');
      return response.data;
    },
  });

  const categories = categoriesData?.categories || [];

  // Fetch all articles (including unpublished for admin)
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['admin-help-articles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/help?${params.toString()}`);
      return response.data;
    },
  });

  const allArticles: HelpArticle[] = articlesData?.articles || [];

  // Filter articles by published status
  const articles = allArticles.filter((article) => {
    if (filters.isPublished === 'true') return article.isPublished;
    if (filters.isPublished === 'false') return !article.isPublished;
    return true;
  });

  // Group articles by category
  const articlesByCategory = articles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  // Toggle publish status mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const response = await api.patch(`/help/${id}`, { isPublished });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-articles'] });
      queryClient.invalidateQueries({ queryKey: ['help-categories'] });
      toast.success('Đã cập nhật trạng thái');
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const categoryOptions = [
    { id: '', fullName: 'Tất cả danh mục' },
    ...categories.map((cat: string) => ({ id: cat, fullName: cat })),
  ];

  const handleCreate = () => {
    setCreateModalOpen(true);
  };

  const handleEdit = (article: HelpArticle) => {
    setSelectedArticle(article);
    setEditModalOpen(true);
  };

  const handleDelete = (article: HelpArticle) => {
    setSelectedArticle(article);
    setDeleteModalOpen(true);
  };

  const handleTogglePublish = (article: HelpArticle) => {
    togglePublishMutation.mutate({
      id: article.id,
      isPublished: !article.isPublished,
    });
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="w-full">
        <div className="card">
          <div className="card-body">
            <p className="text-gray-600">Bạn không có quyền truy cập trang này</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="page-title flex items-center gap-2">
              <HelpCircle className="w-6 h-6" />
              Quản lý Trợ giúp
            </h1>
            <p className="page-subtitle">
              Tạo và quản lý các bài viết trợ giúp
            </p>
          </div>
          <button
            onClick={handleCreate}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Tạo bài viết
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm bài viết..."
                className="input pl-10 w-full text-sm min-h-[42px]"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <SelectDropdown
              label="Danh mục"
              value={filters.category}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, category: value }));
              }}
              options={categoryOptions}
              placeholder="Tất cả danh mục"
            />
          </div>
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <SelectDropdown
              label="Trạng thái"
              value={filters.isPublished}
              onChange={(value) => {
                setFilters((prev) => ({ ...prev, isPublished: value }));
              }}
              options={[
                { id: '', fullName: 'Tất cả' },
                { id: 'true', fullName: 'Đã xuất bản' },
                { id: 'false', fullName: 'Chưa xuất bản' },
              ]}
              placeholder="Tất cả trạng thái"
            />
          </div>
        </div>
      </div>

      {/* Articles List */}
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không có bài viết nào</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
            <div key={category} className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="space-y-3">
                  {categoryArticles.map((article) => (
                    <div
                      key={article.id}
                      className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900">
                              {article.title}
                            </h3>
                            {article.isPublished ? (
                              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded">
                                <Eye className="w-3 h-3" />
                                Đã xuất bản
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                                <EyeOff className="w-3 h-3" />
                                Chưa xuất bản
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {article.content}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Thứ tự: {article.order}</span>
                            <span>•</span>
                            <span>
                              Tạo bởi: {article.creator.fullName}
                            </span>
                            {article.updater && (
                              <>
                                <span>•</span>
                                <span>
                                  Cập nhật bởi: {article.updater.fullName}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleTogglePublish(article)}
                            disabled={togglePublishMutation.isPending}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                            title={article.isPublished ? 'Ẩn bài viết' : 'Xuất bản bài viết'}
                          >
                            {article.isPublished ? (
                              <EyeOff className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(article)}
                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(article)}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateHelpArticleModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
          queryClient.invalidateQueries({ queryKey: ['help-articles'] });
          queryClient.invalidateQueries({ queryKey: ['help-categories'] });
        }}
        categories={categories}
      />

      {selectedArticle && (
        <>
          <EditHelpArticleModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedArticle(null);
              queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
              queryClient.invalidateQueries({ queryKey: ['help-articles'] });
              queryClient.invalidateQueries({ queryKey: ['help-categories'] });
            }}
            article={selectedArticle}
            categories={categories}
          />

          <DeleteHelpArticleModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedArticle(null);
              queryClient.invalidateQueries({ queryKey: ['admin-help-articles'] });
              queryClient.invalidateQueries({ queryKey: ['help-articles'] });
              queryClient.invalidateQueries({ queryKey: ['help-categories'] });
            }}
            article={selectedArticle}
          />
        </>
      )}
    </div>
  );
}

