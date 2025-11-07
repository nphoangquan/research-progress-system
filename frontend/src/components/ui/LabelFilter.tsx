import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Tag, ChevronDown, X, Search } from 'lucide-react';
import { getLabels } from '../../lib/labelApi';
import LabelChip from './LabelChip';
import type { Label } from '../../types/label';

interface LabelFilterProps {
  projectId?: string;
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  className?: string;
  placeholder?: string;
}

export default function LabelFilter({
  projectId,
  selectedLabelIds,
  onSelectionChange,
  className = '',
  placeholder = 'Filter by labels...'
}: LabelFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllSelected, setShowAllSelected] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch labels
  const { data: availableLabels = [], isLoading } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => getLabels(projectId),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedLabels = availableLabels.filter(label => selectedLabelIds.includes(label.id));
  const filteredLabels = availableLabels.filter(label => {
    const matchesSearch = label.name.toLowerCase().includes(searchQuery.toLowerCase());
    const isNotSelected = !selectedLabelIds.includes(label.id);
    return matchesSearch && isNotSelected;
  });

  const handleToggleLabel = (labelId: string) => {
    if (selectedLabelIds.includes(labelId)) {
      onSelectionChange(selectedLabelIds.filter(id => id !== labelId));
    } else {
      onSelectionChange([...selectedLabelIds, labelId]);
    }
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  // Show first 5 selected labels, rest in "show more"
  const MAX_VISIBLE_SELECTED = 5;
  const visibleSelected = showAllSelected 
    ? selectedLabels 
    : selectedLabels.slice(0, MAX_VISIBLE_SELECTED);
  const hiddenCount = selectedLabels.length - MAX_VISIBLE_SELECTED;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Labels
      </label>

      {/* Selected labels display - Collapsible */}
      <div
        className={`border border-gray-300 rounded-lg p-2 min-h-[42px] cursor-pointer transition-colors relative ${
          isOpen ? 'border-primary-300 ring-1 ring-primary-200' : 'hover:border-gray-400'
        }`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 items-center pr-8">
          {selectedLabels.length === 0 ? (
            <span className="text-sm text-gray-500">{placeholder}</span>
          ) : (
            <>
              {visibleSelected.map(label => (
                <LabelChip
                  key={label.id}
                  label={label}
                  size="sm"
                  showRemove
                  onRemove={(id) => {
                    handleToggleLabel(id);
                  }}
                />
              ))}
              {!showAllSelected && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllSelected(true);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  +{hiddenCount} more
                </button>
              )}
              {showAllSelected && hiddenCount > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAllSelected(false);
                  }}
                  className="text-xs text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md hover:bg-gray-100"
                >
                  Show less
                </button>
              )}
            </>
          )}
        </div>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none flex-shrink-0" />
      </div>

      {/* Dropdown with search */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search labels..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Selected labels summary */}
          {selectedLabels.length > 0 && (
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-600">
                {selectedLabels.length} label{selectedLabels.length !== 1 ? 's' : ''} selected
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearAll();
                }}
                className="text-xs text-gray-600 hover:text-red-600 flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear all
              </button>
            </div>
          )}

          {/* Available labels list - Scrollable */}
          <div className="overflow-y-auto max-h-48">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">Loading labels...</p>
              </div>
            ) : filteredLabels.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">
                  {searchQuery ? 'No labels found' : 'No labels available'}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredLabels.map((label) => (
                  <div
                    key={label.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleLabel(label.id);
                    }}
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-900">{label.name}</span>
                      {label.projectId === null && (
                        <span className="text-xs text-gray-400 ml-2">(Global)</span>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedLabelIds.includes(label.id)}
                        onChange={() => handleToggleLabel(label.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with count */}
          {availableLabels.length > 0 && (
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <p className="text-xs text-gray-500 text-center">
                {availableLabels.length} label{availableLabels.length !== 1 ? 's' : ''} available
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

