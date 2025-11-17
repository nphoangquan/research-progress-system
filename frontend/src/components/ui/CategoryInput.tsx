import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  categories: string[];
  error?: string;
  placeholder?: string;
}

export default function CategoryInput({
  value,
  onChange,
  categories,
  error,
  placeholder = 'Nhập hoặc chọn danh mục',
}: CategoryInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchInputRef.current && categories.length > 5) {
      searchInputRef.current.focus();
    }
  }, [isOpen, categories.length]);

  const filteredCategories = searchQuery
    ? categories.filter((cat) => cat.toLowerCase().includes(searchQuery.toLowerCase()))
    : categories;

  const handleSelectCategory = (category: string) => {
    onChange(category);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className={`input w-full pr-10 ${error ? 'border-red-500' : ''}`}
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {categories.length > 5 && (
            <div className="p-2 border-b border-gray-200">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm danh mục..."
                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-48">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery ? 'Không tìm thấy danh mục nào' : 'Không có danh mục nào'}
              </div>
            ) : (
              filteredCategories.map((category) => (
                <div
                  key={category}
                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => handleSelectCategory(category)}
                >
                  {category}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      <p className="mt-1 text-xs text-gray-500">
        Nhập danh mục mới hoặc chọn từ danh sách
      </p>
    </div>
  );
}

