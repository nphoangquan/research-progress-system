import { useMemo, useState, useEffect } from 'react';

// Debounce hook for search inputs
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Memoized category filter options
export const useCategoryOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'All Categories' },
    { id: 'PROJECT', fullName: 'Project Documents' },
    { id: 'REFERENCE', fullName: 'Reference Materials' },
    { id: 'TEMPLATE', fullName: 'Templates' },
    { id: 'GUIDELINE', fullName: 'Guidelines' },
    { id: 'SYSTEM', fullName: 'System Documents' }
  ], []);
};

// Memoized status filter options
export const useStatusOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'All Status' },
    { id: 'PENDING', fullName: 'Pending' },
    { id: 'APPROVED', fullName: 'Approved' },
    { id: 'REJECTED', fullName: 'Rejected' }
  ], []);
};

// Memoized file type options
export const useFileTypeOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'All File Types' },
    { id: 'pdf', fullName: 'PDF' },
    { id: 'doc', fullName: 'DOC' },
    { id: 'docx', fullName: 'DOCX' },
    { id: 'txt', fullName: 'TXT' }
  ], []);
};

// Memoized upload date options
export const useUploadDateOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'All Dates' },
    { id: 'today', fullName: 'Today' },
    { id: 'week', fullName: 'This Week' },
    { id: 'month', fullName: 'This Month' },
    { id: 'year', fullName: 'This Year' }
  ], []);
};

// Memoized pagination info
export const usePaginationInfo = (pagination: any) => {
  return useMemo(() => {
    if (!pagination) return null;
    
    const { currentPage, totalPages, totalCount, limit } = pagination;
    const startItem = (currentPage - 1) * limit + 1;
    const endItem = Math.min(currentPage * limit, totalCount);
    
    return {
      startItem,
      endItem,
      totalCount,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1
    };
  }, [pagination]);
};

// Memoized document statistics
export const useDocumentStats = (statsData: any) => {
  return useMemo(() => {
    if (!statsData) return null;
    
    const { totalCount, categoryStats } = statsData;
    const totalByCategory = categoryStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    
    return {
      totalCount,
      categoryStats,
      totalByCategory,
      isEmpty: totalCount === 0
    };
  }, [statsData]);
};
