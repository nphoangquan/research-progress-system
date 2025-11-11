import { useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  showInfo?: boolean;
  showJumpToPage?: boolean;
  className?: string;
}

const Pagination = ({
  currentPage,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  showInfo = true,
  showJumpToPage = false,
  className = ''
}) => {
  const [jumpToPage, setJumpToPage] = useState('');
  const [showJumpInput, setShowJumpInput] = useState(false);
  const jumpInputRef = useRef<HTMLInputElement>(null);

  // Calculate display range with useMemo
  const pageNumbers = useMemo(() => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];
    const rangeWithDots = [];

    // Calculate start and end of range
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    // Generate page numbers
    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    // Add dots if needed
    if (start > 1) {
      if (start > 2) {
        rangeWithDots.push(1, '...');
      } else {
        rangeWithDots.push(1);
      }
    }

    rangeWithDots.push(...range);

    if (end < totalPages) {
      if (end < totalPages - 1) {
        rangeWithDots.push('...', totalPages);
      } else {
        rangeWithDots.push(totalPages);
      }
    }

    return rangeWithDots;
  }, [currentPage, totalPages]);

  const hasPrev = useMemo(() => currentPage > 1, [currentPage]);
  const hasNext = useMemo(() => currentPage < totalPages, [currentPage, totalPages]);

  // Calculate display info with useMemo
  const startItem = useMemo(() => (currentPage - 1) * limit + 1, [currentPage, limit]);
  const endItem = useMemo(() => Math.min(currentPage * limit, totalCount), [currentPage, limit, totalCount]);

  // Handlers
  const handlePrev = useCallback(() => {
    if (hasPrev) {
      onPageChange(currentPage - 1);
    }
  }, [hasPrev, currentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (hasNext) {
      onPageChange(currentPage + 1);
    }
  }, [hasNext, currentPage, onPageChange]);

  const handlePageClick = useCallback((page: number) => {
    onPageChange(page);
  }, [onPageChange]);

  const handleJumpToPage = useCallback(() => {
    const page = parseInt(jumpToPage, 10);
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
      setJumpToPage('');
      setShowJumpInput(false);
    }
  }, [jumpToPage, totalPages, currentPage, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if no input is focused
      if (document.activeElement?.tagName === 'INPUT') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNext();
          break;
        case 'Home':
          e.preventDefault();
          if (currentPage !== 1) {
            onPageChange(1);
          }
          break;
        case 'End':
          e.preventDefault();
          if (currentPage !== totalPages) {
            onPageChange(totalPages);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, totalPages, onPageChange, handlePrev, handleNext]);

  // Focus jump input when shown
  useEffect(() => {
    if (showJumpInput && jumpInputRef.current) {
      jumpInputRef.current.focus();
    }
  }, [showJumpInput]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Info */}
      {showInfo && (
        <div className="text-sm text-gray-700">
          Hiển thị {startItem} đến {endItem} trong tổng số {totalCount} kết quả
        </div>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center space-x-1">
        {/* Previous Button */}
        <button
          onClick={handlePrev}
          disabled={!hasPrev}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            hasPrev
              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }`}
          aria-label="Trang trước"
          title="Trang trước (←)"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <span
                  key={`dots-${index}`}
                  className="px-3 py-2 text-sm text-gray-500"
                >
                  ...
                </span>
              );
            }

            const pageNum = page as number;
            const isActive = pageNum === currentPage;

            return (
              <button
                key={pageNum}
                onClick={() => handlePageClick(pageNum)}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-600 text-white border border-primary-600'
                    : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
                }`}
                aria-label={`Đi đến trang ${pageNum}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {pageNum}
              </button>
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!hasNext}
          className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
            hasNext
              ? 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
              : 'text-gray-400 bg-gray-100 border border-gray-200 cursor-not-allowed'
          }`}
          aria-label="Trang sau"
          title="Trang sau (→)"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Jump to Page */}
        {showJumpToPage && totalPages > 5 && (
          <div className="flex items-center space-x-1 ml-2">
            {!showJumpInput ? (
              <button
                onClick={() => setShowJumpInput(true)}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                title="Nhảy đến trang"
              >
                ...
              </button>
            ) : (
              <div className="flex items-center space-x-1">
                <input
                  ref={jumpInputRef}
                  type="number"
                  min={1}
                  max={totalPages}
                  value={jumpToPage}
                  onChange={(e) => setJumpToPage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJumpToPage();
                    } else if (e.key === 'Escape') {
                      setShowJumpInput(false);
                      setJumpToPage('');
                    }
                  }}
                  placeholder={`1-${totalPages}`}
                  className="w-16 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
                <button
                  onClick={handleJumpToPage}
                  className="px-2 py-1 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                  title="Đi đến"
                >
                  Đi
                </button>
                <button
                  onClick={() => {
                    setShowJumpInput(false);
                    setJumpToPage('');
                  }}
                  className="px-2 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  title="Hủy"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Pagination;
