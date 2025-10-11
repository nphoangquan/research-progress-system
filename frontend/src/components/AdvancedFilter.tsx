import { useState, useEffect } from 'react';
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
import FilterPresetManager from './FilterPresetManager';
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

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...pendingFilters, [key]: value };
    setPendingFilters(newFilters);
    // Don't apply immediately - wait for Apply button or Enter
  };

  const applyFilters = () => {
    setLocalFilters(pendingFilters);
    onFiltersChange(pendingFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setPendingFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  };

  const hasActiveFilters = Object.keys(localFilters).some(key => 
    localFilters[key] !== undefined && localFilters[key] !== '' && localFilters[key] !== null
  );

  const getFilterCount = () => {
    return Object.keys(localFilters).filter(key => 
      localFilters[key] !== undefined && localFilters[key] !== '' && localFilters[key] !== null
    ).length;
  };

  const renderProjectFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="NOT_STARTED">Not Started</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="UNDER_REVIEW">Under Review</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* Progress Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Progress Range
        </label>
        <select
          value={pendingFilters.progress || ''}
          onChange={(e) => handleFilterChange('progress', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Progress</option>
          <option value="0-25">0-25%</option>
          <option value="25-50">25-50%</option>
          <option value="50-75">50-75%</option>
          <option value="75-100">75-100%</option>
        </select>
      </div>

      {/* Lecturer Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lecturer
        </label>
        <input
          type="text"
          value={pendingFilters.lecturer || ''}
          onChange={(e) => handleFilterChange('lecturer', e.target.value || undefined)}
          placeholder="Filter by lecturer..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Created Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Created Date
        </label>
        <select
          value={pendingFilters.createdDate || ''}
          onChange={(e) => handleFilterChange('createdDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
        </select>
      </div>
    </div>
  );

  const renderTaskFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="TODO">To Do</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="REVIEW">Review</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {/* Priority Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Priority
        </label>
        <select
          value={pendingFilters.priority || ''}
          onChange={(e) => handleFilterChange('priority', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      {/* Assignee Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assignee
        </label>
        <UserFilterSelector
          selectedUsers={Array.isArray(pendingFilters.assignee) ? pendingFilters.assignee : (pendingFilters.assignee ? [pendingFilters.assignee] : [])}
          onSelectionChange={(userIds) => handleFilterChange('assignee', userIds.length > 0 ? userIds : undefined)}
          multiple={true}
          placeholder="All Assignees"
          className="w-full"
        />
      </div>

      {/* Project Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project
        </label>
        <input
          type="text"
          value={pendingFilters.project || ''}
          onChange={(e) => handleFilterChange('project', e.target.value || undefined)}
          placeholder="Filter by project..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Due Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Due Date
        </label>
        <select
          value={pendingFilters.dueDate || ''}
          onChange={(e) => handleFilterChange('dueDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Due Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="this_week">Due This Week</option>
          <option value="no_due_date">No Due Date</option>
        </select>
      </div>
    </div>
  );

  const renderDocumentFilters = () => (
    <div className="space-y-4">
      {/* Status Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Status
        </label>
        <select
          value={pendingFilters.status || ''}
          onChange={(e) => handleFilterChange('status', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PROCESSING">Processing</option>
          <option value="INDEXED">Indexed</option>
          <option value="FAILED">Failed</option>
        </select>
      </div>

      {/* Project Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Project
        </label>
        <input
          type="text"
          value={pendingFilters.project || ''}
          onChange={(e) => handleFilterChange('project', e.target.value || undefined)}
          placeholder="Filter by project..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Uploader Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Uploader
        </label>
        <input
          type="text"
          value={pendingFilters.uploader || ''}
          onChange={(e) => handleFilterChange('uploader', e.target.value || undefined)}
          placeholder="Filter by uploader..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* File Type Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          File Type
        </label>
        <select
          value={pendingFilters.fileType || ''}
          onChange={(e) => handleFilterChange('fileType', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All File Types</option>
          <option value="pdf">PDF</option>
          <option value="doc">Word Documents</option>
          <option value="xls">Excel Spreadsheets</option>
          <option value="ppt">PowerPoint Presentations</option>
          <option value="image">Images</option>
          <option value="archive">Archives</option>
        </select>
      </div>

      {/* Upload Date Filter */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Date
        </label>
        <select
          value={pendingFilters.uploadDate || ''}
          onChange={(e) => handleFilterChange('uploadDate', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Time</option>
          <option value="today">Today</option>
          <option value="this_week">This Week</option>
          <option value="this_month">This Month</option>
          <option value="this_year">This Year</option>
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
          <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
          {hasActiveFilters && (
            <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-600 rounded-full">
              {getFilterCount()} active
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
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={pendingFilters.search || ''}
                onChange={(e) => handleFilterChange('search', e.target.value || undefined)}
                onKeyPress={handleKeyPress}
                placeholder={`Search ${entityType}s...`}
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
              <span>Clear All Filters</span>
            </button>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                {getFilterCount()} filter{getFilterCount() !== 1 ? 's' : ''} applied
              </div>
              <button
                onClick={applyFilters}
                className="flex items-center space-x-2 px-4 py-2 text-white bg-primary-600 border border-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <Filter className="w-4 h-4" />
                <span>Apply Filters</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
