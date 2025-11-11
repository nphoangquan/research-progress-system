import { useState, useEffect, useCallback, useMemo } from 'react';
import type { KeyboardEvent } from 'react';
import { 
  Filter, 
  X, 
  Calendar, 
  User, 
  FileText, 
  Search,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import FilterPresetManager from '../FilterPresetManager';
import UserFilterSelector from './UserFilterSelector';

interface AdvancedFilterProps {
  entityType: 'project' | 'task' | 'document';
  filters: any;
  onFiltersChange: (filters: any) => void;
  className?: string;
}

export default function AdvancedFilter({ 
  entityType, 
  filters, 
  onFiltersChange,
  className = "" 
}: AdvancedFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);
  const [pendingFilters, setPendingFilters] = useState(filters);

  useEffect(() => {
    setLocalFilters(filters);
    setPendingFilters(filters);
  }, [filters]);

  const handleFilterChange = useCallback((key: string, value: any) => {
    setPendingFilters(prev => ({ ...prev, [key]: value }));
    // Don't apply immediately - wait for Apply button or Enter
  }, []);

  const applyFilters = useCallback(() => {
    setLocalFilters(pendingFilters);
    onFiltersChange(pendingFilters);
  }, [pendingFilters, onFiltersChange]);

  const clearFilters = useCallback(() => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setPendingFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  }, [onFiltersChange]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  }, [applyFilters]);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(localFilters).some(key => 
      localFilters[key] !== undefined && localFilters[key] !== '' && localFilters[key] !== null
    );
  }, [localFilters]);

  const getFilterCount = useMemo(() => {
    return Object.keys(localFilters).filter(key => 
      localFilters[key] !== undefined && localFilters[key] !== '' && localFilters[key] !== null
    ).length;
  }, [localFilters]);

  const renderProjectFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trạng thái
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="NOT_STARTED">Chưa bắt đầu</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="UNDER_REVIEW">Đang xem xét</option>
          <option value="COMPLETED">Hoàn thành</option>
          <option value="CANCELLED">Đã hủy</option>
        </select>
      </div>

      {/* Progress Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Khoảng Tiến độ
        </label>
        <select
          value={pendingFilters.progress || ''}
          onChange={(e) => handleFilterChange('progress', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Tiến độ</option>
          <option value="0-25">0-25%</option>
          <option value="25-50">25-50%</option>
          <option value="50-75">50-75%</option>
          <option value="75-100">75-100%</option>
        </select>
      </div>

      {/* Lecturer Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Giảng viên
        </label>
        <input
          type="text"
          value={pendingFilters.lecturer || ''}
          onChange={(e) => handleFilterChange('lecturer', e.target.value || undefined)}
          placeholder="Lọc theo giảng viên..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Created Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày Tạo
        </label>
        <select
          value={pendingFilters.createdDate || ''}
          onChange={(e) => handleFilterChange('createdDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="this_week">Tuần này</option>
          <option value="this_month">Tháng này</option>
          <option value="this_year">Năm này</option>
        </select>
      </div>
    </div>
  );

  const renderTaskFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trạng thái
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="TODO">Cần làm</option>
          <option value="IN_PROGRESS">Đang thực hiện</option>
          <option value="REVIEW">Xem xét</option>
          <option value="COMPLETED">Hoàn thành</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Độ Ưu tiên
        </label>
        <select
          value={pendingFilters.priority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Độ Ưu tiên</option>
          <option value="LOW">Thấp</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Cao</option>
          <option value="URGENT">Khẩn cấp</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Người được gán
        </label>
        <UserFilterSelector
          selectedUsers={Array.isArray(pendingFilters.assignee) ? pendingFilters.assignee : (pendingFilters.assignee ? [pendingFilters.assignee] : [])}
          onSelectionChange={(userIds) => handleFilterChange('assignee', userIds.length > 0 ? userIds : undefined)}
          multiple={true}
          placeholder="Tất cả Người được gán"
          className="w-full"
        />
      </div>

      {/* Project Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dự án
        </label>
        <input
          type="text"
          value={pendingFilters.project || ''}
          onChange={(e) => handleFilterChange('project', e.target.value || undefined)}
          placeholder="Lọc theo dự án..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Due Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Hạn chót
        </label>
        <select
          value={pendingFilters.dueDate || ''}
          onChange={(e) => handleFilterChange('dueDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Hạn chót</option>
          <option value="overdue">Quá hạn</option>
          <option value="today">Hạn hôm nay</option>
          <option value="this_week">Hạn tuần này</option>
          <option value="no_due_date">Không có hạn chót</option>
        </select>
      </div>
    </div>
  );

  const renderDocumentFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trạng thái
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Trạng thái</option>
          <option value="PENDING">Đang chờ</option>
          <option value="PROCESSING">Đang xử lý</option>
          <option value="INDEXED">Đã lập chỉ mục</option>
          <option value="FAILED">Thất bại</option>
        </select>
      </div>

      {/* Project Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Dự án
        </label>
        <input
          type="text"
          value={pendingFilters.project || ''}
          onChange={(e) => handleFilterChange('project', e.target.value || undefined)}
          placeholder="Lọc theo dự án..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Uploader Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Người tải lên
        </label>
        <input
          type="text"
          value={pendingFilters.uploader || ''}
          onChange={(e) => handleFilterChange('uploader', e.target.value || undefined)}
          placeholder="Lọc theo người tải lên..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* File Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Loại Tệp
        </label>
        <select
          value={pendingFilters.fileType || ''}
          onChange={(e) => handleFilterChange('fileType', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Loại Tệp</option>
          <option value="pdf">PDF</option>
          <option value="doc">Tài liệu Word</option>
          <option value="xls">Bảng tính Excel</option>
          <option value="ppt">Trình bày PowerPoint</option>
          <option value="image">Hình ảnh</option>
          <option value="archive">Tệp nén</option>
        </select>
      </div>

      {/* Upload Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ngày Tải lên
        </label>
        <select
          value={pendingFilters.uploadDate || ''}
          onChange={(e) => handleFilterChange('uploadDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">Tất cả Thời gian</option>
          <option value="today">Hôm nay</option>
          <option value="this_week">Tuần này</option>
          <option value="this_month">Tháng này</option>
          <option value="this_year">Năm này</option>
        </select>
      </div>
    </div>
  );

  const renderFilters = () => {
    switch (entityType) {
      case 'project':
        return renderProjectFilters();
      case 'task':
        return renderTaskFilters();
      case 'document':
        return renderDocumentFilters();
      default:
        return null;
    }
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      {/* Filter Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">Bộ lọc Nâng cao</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
              {getFilterCount} đang hoạt động
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <FilterPresetManager
            entityType={entityType}
            currentFilters={localFilters}
            onApplyPreset={onFiltersChange}
          />
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Filter Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Search Filter */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tìm kiếm
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={pendingFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                onKeyPress={handleKeyPress}
                placeholder={`Tìm kiếm ${entityType === 'project' ? 'dự án' : entityType === 'task' ? 'nhiệm vụ' : 'tài liệu'}...`}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Entity-specific Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderFilters()}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={clearFilters}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              <span>Xóa Tất cả Bộ lọc</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {getFilterCount} bộ lọc đã áp dụng
              </div>
              <button
                onClick={applyFilters}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-primary-600 border border-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>Áp dụng Bộ lọc</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
