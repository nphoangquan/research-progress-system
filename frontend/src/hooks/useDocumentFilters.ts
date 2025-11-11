import { useMemo } from 'react';

// Memoized category filter options
export const useCategoryOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'Tất cả danh mục', description: 'Bao gồm mọi loại tài liệu' },
    { id: 'PROJECT', fullName: 'Tài liệu dự án', description: 'Hồ sơ, báo cáo, biên bản trong dự án' },
    { id: 'REFERENCE', fullName: 'Tài liệu tham khảo', description: 'Tài liệu hỗ trợ nghiên cứu, bài báo' },
    { id: 'TEMPLATE', fullName: 'Biểu mẫu', description: 'Template, biểu mẫu dùng chung' },
    { id: 'GUIDELINE', fullName: 'Hướng dẫn', description: 'Quy trình, hướng dẫn nội bộ' },
    { id: 'SYSTEM', fullName: 'Tài liệu hệ thống', description: 'Tài liệu về cấu hình, kiến trúc hệ thống' }
  ] as const, []);
};

// Memoized status filter options
export const useStatusOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'Tất cả trạng thái', description: 'Không giới hạn trạng thái duyệt' },
    { id: 'PENDING', fullName: 'Chờ duyệt', description: 'Đang chờ giảng viên/quản trị xem xét' },
    { id: 'APPROVED', fullName: 'Đã duyệt', description: 'Được phê duyệt và hiển thị cho người dùng' },
    { id: 'REJECTED', fullName: 'Bị từ chối', description: 'Không được duyệt do thiếu tiêu chuẩn' }
  ] as const, []);
};

// Memoized file type options
export const useFileTypeOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'Tất cả loại tệp', extension: '*' },
    { id: 'pdf', fullName: 'PDF', extension: '.pdf' },
    { id: 'doc', fullName: 'DOC', extension: '.doc' },
    { id: 'docx', fullName: 'DOCX', extension: '.docx' },
    { id: 'txt', fullName: 'TXT', extension: '.txt' },
    { id: 'xlsx', fullName: 'XLSX', extension: '.xlsx' },
    { id: 'pptx', fullName: 'PPTX', extension: '.pptx' }
  ] as const, []);
};

// Memoized upload date options
export const useUploadDateOptions = () => {
  return useMemo(() => [
    { id: '', fullName: 'Tất cả thời gian' },
    { id: 'today', fullName: 'Hôm nay' },
    { id: 'week', fullName: 'Tuần này' },
    { id: 'month', fullName: 'Tháng này' },
    { id: 'year', fullName: 'Năm nay' }
  ] as const, []);
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

