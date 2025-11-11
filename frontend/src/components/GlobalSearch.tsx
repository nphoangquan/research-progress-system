import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from 'use-debounce';
import api from '../lib/axios';
import { 
  Search, 
  X, 
  Clock, 
  TrendingUp, 
  FileText, 
  CheckSquare, 
  FolderOpen,
  Filter,
  ArrowRight,
  Loader2
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'project' | 'task' | 'document';
  title: string;
  description?: string;
  projectTitle?: string;
  status?: string;
  priority?: string;
  createdAt: string;
  updatedAt: string;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'recent' | 'popular' | 'suggestion';
}

export default function GlobalSearch() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [selectedResultIndex, setSelectedResultIndex] = useState(-1);
  const [filters, setFilters] = useState({
    types: ['project', 'task', 'document'],
    status: '',
    priority: '',
    dateRange: ''
  });
  
  // Debounce query để tránh spam API calls
  const [debouncedQuery] = useDebounce(query, 400);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Search results query
  const { data: searchResults, isLoading: isSearching } = useQuery<SearchResult[]>({
    queryKey: ['globalSearch', debouncedQuery, filters],
    queryFn: async () => {
      if (!debouncedQuery.trim()) return [];
      
      try {
        const params = new URLSearchParams();
        params.append('q', debouncedQuery.trim());
        params.append('types', filters.types.join(','));
        if (filters.status) params.append('status', filters.status);
        if (filters.priority) params.append('priority', filters.priority);
        if (filters.dateRange) params.append('dateRange', filters.dateRange);

        const response = await api.get(`/search?${params.toString()}`);
        return response.data.results;
      } catch (error) {
        console.error('Search API error:', error);
        return [];
      }
    },
    enabled: !!debouncedQuery.trim() && isOpen,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Search suggestions query
  const { data: suggestions } = useQuery<SearchSuggestion[]>({
    queryKey: ['searchSuggestions'],
    queryFn: async () => {
      try {
        const response = await api.get('/search/suggestions');
        const serverSuggestions = response.data.suggestions || [];
        const historySuggestions = getSearchHistory();
        return [...historySuggestions, ...serverSuggestions];
      } catch (error) {
        console.error('Search suggestions API error:', error);
        return getSearchHistory();
      }
    },
    enabled: isOpen && !debouncedQuery.trim(),
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to open search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      
      // Escape to close search
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setQuery('');
        setShowSuggestions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);


  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        // Không reset query để user có thể tiếp tục search
        setShowSuggestions(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const saveSearchHistory = useCallback((searchQuery: string) => {
    try {
      const existingHistory = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const newHistory = [searchQuery, ...existingHistory.filter((item: string) => item !== searchQuery)].slice(0, 10);
      localStorage.setItem('recentSearches', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setShowSuggestions(value.length === 0);
    setSelectedSuggestionIndex(-1);
    setSelectedResultIndex(-1);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim()) {
      setShowSuggestions(false);
      // Save to search history
      saveSearchHistory(query.trim());
    }
  }, [query, saveSearchHistory]);

  const navigateToResult = useCallback((result: SearchResult) => {
    switch (result.type) {
      case 'project':
        navigate(`/projects/${result.id}`);
        break;
      case 'task':
        navigate(`/tasks/${result.id}`);
        break;
      case 'document':
        navigate(`/documents/${result.id}`);
        break;
    }
  }, [navigate]);

  const handleItemClick = useCallback((item: SearchResult | SearchSuggestion) => {
    if ('type' in item && item.type) {
      // Search result
      navigateToResult(item as SearchResult);
    } else {
      // Suggestion
      const suggestion = item as SearchSuggestion;
      setQuery(suggestion.text);
      setShowSuggestions(false);
      handleSearch();
    }
    setIsOpen(false);
  }, [navigateToResult, handleSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (showSuggestions && suggestions) {
      // Navigation trong suggestions
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            handleItemClick(suggestions[selectedSuggestionIndex]);
          } else if (query.trim()) {
            handleSearch();
          }
          break;
      }
    } else if (searchResults) {
      // Navigation trong results
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedResultIndex(prev => 
            prev < searchResults.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedResultIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedResultIndex >= 0 && searchResults[selectedResultIndex]) {
            handleItemClick(searchResults[selectedResultIndex]);
          } else if (query.trim()) {
            handleSearch();
          }
          break;
      }
    }
  }, [showSuggestions, suggestions, selectedSuggestionIndex, query, searchResults, selectedResultIndex, handleItemClick, handleSearch]);

  const getSearchHistory = (): SearchSuggestion[] => {
    try {
      const history = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      return history.map((query: string, index: number) => ({
        id: `recent-${index}`,
        text: query,
        type: 'recent' as const
      }));
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  };

  const clearSearch = useCallback(() => {
    setQuery('');
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
    setSelectedResultIndex(-1);
    searchInputRef.current?.focus();
  }, []);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'project':
        return <FolderOpen className="w-4 h-4 text-blue-500" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case 'document':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-500" />;
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recent':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'popular':
        return <TrendingUp className="w-4 h-4 text-orange-500" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
      >
        <Search className="w-4 h-4" />
        <span className="hidden sm:block text-sm">Tìm kiếm...</span>
        <kbd className="hidden sm:block text-xs bg-gray-200 px-1.5 py-0.5 rounded">⌘K</kbd>
      </button>

      {/* Search Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
          <div 
            ref={searchRef}
            className="w-full max-w-2xl bg-white rounded-xl shadow-2xl pointer-events-auto"
          >
            {/* Search Input */}
            <div className="flex items-center px-4 py-3 border-b border-gray-200">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Tìm kiếm dự án, nhiệm vụ, tài liệu..."
                className="flex-1 text-lg outline-none placeholder-gray-400"
                value={query}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {query && (
                <button
                  onClick={clearSearch}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Search Filters */}
            <div className="px-4 py-2 border-b border-gray-100">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">Bộ lọc:</span>
                </div>
                <div className="flex items-center space-x-2">
                  {['project', 'task', 'document'].map((type) => (
                    <label key={type} className="flex items-center space-x-1">
                      <input
                        type="checkbox"
                        checked={filters.types.includes(type)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFilters(prev => ({
                              ...prev,
                              types: [...prev.types, type]
                            }));
                          } else {
                            setFilters(prev => ({
                              ...prev,
                              types: prev.types.filter(t => t !== type)
                            }));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm capitalize">
                        {type === 'project' ? 'Dự án' : type === 'task' ? 'Nhiệm vụ' : 'Tài liệu'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {isSearching && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
                  <span className="ml-2 text-gray-600">Đang tìm kiếm...</span>
                </div>
              )}

              {!isSearching && showSuggestions && suggestions && (
                <div className="py-2">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Gợi ý
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={suggestion.id}
                      onClick={() => handleItemClick(suggestion)}
                      className={`w-full flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 ${
                        selectedSuggestionIndex === index ? 'bg-gray-50' : ''
                      }`}
                    >
                      {getSuggestionIcon(suggestion.type)}
                      <span className="text-sm text-gray-700">{suggestion.text}</span>
                    </button>
                  ))}
                </div>
              )}

              {!isSearching && !showSuggestions && searchResults && (
                <div className="py-2">
                  {searchResults.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>Không tìm thấy kết quả cho "{query}"</p>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Kết quả ({searchResults.length})
                      </div>
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleItemClick(result)}
                          className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 ${
                            selectedResultIndex === index ? 'bg-gray-50' : ''
                          }`}
                        >
                          {getResultIcon(result.type)}
                          <div className="flex-1 text-left">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{result.title}</span>
                              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full capitalize">
                                {result.type === 'project' ? 'Dự án' : result.type === 'task' ? 'Nhiệm vụ' : 'Tài liệu'}
                              </span>
                              {result.status && (
                                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded-full">
                                  {result.status}
                                </span>
                              )}
                              {result.priority && (
                                <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">
                                  {result.priority}
                                </span>
                              )}
                            </div>
                            {result.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {result.description}
                              </p>
                            )}
                            {result.projectTitle && (
                              <p className="text-xs text-gray-500 mt-1">
                                Dự án: {result.projectTitle}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              Cập nhật {formatDate(result.updatedAt)}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                        </button>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>↑↓ Điều hướng</span>
                  <span>↵ Chọn</span>
                  <span>Esc Đóng</span>
                </div>
                <div className="flex items-center space-x-1">
                  <kbd className="bg-white px-1.5 py-0.5 rounded">⌘K</kbd>
                  <span>để tìm kiếm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
