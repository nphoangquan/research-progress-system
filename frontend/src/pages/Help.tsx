import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../lib/axios';
import { HelpCircle, Search, BookOpen } from 'lucide-react';
import SelectDropdown from '../components/ui/SelectDropdown';

interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  order: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    fullName: string;
  };
}

export default function Help() {
  const navigate = useNavigate();
  const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: '',
    search: '',
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['help-categories'],
    queryFn: async () => {
      const response = await api.get('/help/categories');
      return response.data;
    },
  });

  const categories = categoriesData?.categories || [];

  // Fetch articles
  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['help-articles', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('search', filters.search);

      const response = await api.get(`/help?${params.toString()}`);
      return response.data;
    },
  });

  const articles: HelpArticle[] = articlesData?.articles || [];

  // Fetch selected article detail
  const { data: articleDetail } = useQuery({
    queryKey: ['help-article', selectedArticle],
    queryFn: async () => {
      if (!selectedArticle) return null;
      const response = await api.get(`/help/${selectedArticle}`);
      return response.data;
    },
    enabled: !!selectedArticle,
  });

  const article = articleDetail?.article;

  // Group articles by category
  const articlesByCategory = articles.reduce((acc, article) => {
    if (!acc[article.category]) {
      acc[article.category] = [];
    }
    acc[article.category].push(article);
    return acc;
  }, {} as Record<string, HelpArticle[]>);

  const categoryOptions = [
    { id: '', fullName: 'Tất cả danh mục' },
    ...categories.map((cat: string) => ({ id: cat, fullName: cat })),
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <HelpCircle className="w-6 h-6" />
            Trợ giúp
          </h1>
          <p className="page-subtitle">
            Tìm kiếm câu trả lời và hướng dẫn sử dụng hệ thống
          </p>
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
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="ml-4 text-gray-600">Đang tải...</p>
            </div>
          </div>
        </div>
      ) : selectedArticle && article ? (
        // Article Detail View
        <div className="card">
          <div className="card-body">
            <button
              onClick={() => setSelectedArticle(null)}
              className="text-sm text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
            >
              ← Quay lại danh sách
            </button>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{article.title}</h2>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-6">
              <span>{article.category}</span>
              <span>•</span>
              <span>
                Cập nhật: {new Date(article.updatedAt).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {article.content}
              </div>
            </div>
          </div>
        </div>
      ) : articles.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Không tìm thấy bài viết nào</p>
            </div>
          </div>
        </div>
      ) : (
        // Articles List
        <div className="space-y-6">
          {Object.entries(articlesByCategory).map(([category, categoryArticles]) => (
            <div key={category} className="card">
              <div className="card-body">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">{category}</h2>
                <div className="space-y-4">
                  {categoryArticles.map((article) => (
                    <div
                      key={article.id}
                      className="border-b border-gray-200 last:border-0 pb-4 last:pb-0 cursor-pointer hover:bg-gray-50 -mx-4 px-4 py-2 rounded-lg transition-colors"
                      onClick={() => setSelectedArticle(article.id)}
                    >
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {article.content}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

