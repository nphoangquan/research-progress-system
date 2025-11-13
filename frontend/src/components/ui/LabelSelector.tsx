import { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { getLabels } from '../../lib/labelApi';
import LabelChip from './LabelChip';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';

interface LabelSelectorProps {
  projectId?: string;
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  error?: string;
  placeholder?: string;
  className?: string;
  allowCreate?: boolean;
  onCreateLabel?: (name: string, color: string) => Promise<Label>;
}

export default function LabelSelector({
  projectId,
  selectedLabelIds,
  onSelectionChange,
  error,
  placeholder = "Chọn nhãn...",
  className = "",
  allowCreate = false,
  onCreateLabel
}: LabelSelectorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#9CA3AF'); // Default gray color (not displayed)
  const [isCreating, setIsCreating] = useState(false);
  const [labelNameError, setLabelNameError] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch labels
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => getLabels(projectId),
  });

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setShowCreateForm(false);
        setSearchQuery('');
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
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

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const selectedLabels = labels.filter(label => selectedLabelIds.includes(label.id));
  const filteredLabels = labels.filter(label => {
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

  const validateLabelName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Tên nhãn không được để trống';
    }
    if (trimmed.length < 2) {
      return 'Tên nhãn phải có ít nhất 2 ký tự';
    }
    if (trimmed.length > 50) {
      return 'Tên nhãn không được vượt quá 50 ký tự';
    }
    // Check for only whitespace or special characters
    if (!/^[\p{L}\p{N}\s\-_]+$/u.test(trimmed)) {
      return 'Tên nhãn chỉ được chứa chữ cái, số, khoảng trắng, dấu gạch ngang và gạch dưới';
    }
    return '';
  };

  const handleLabelNameChange = (value: string) => {
    setNewLabelName(value);
    if (labelNameError) {
      setLabelNameError(validateLabelName(value));
    }
  };

  const handleCreateLabel = async () => {
    const trimmedName = newLabelName.trim();
    const error = validateLabelName(trimmedName);
    
    if (error) {
      setLabelNameError(error);
      return;
    }
    
    if (!onCreateLabel) return;

    setIsCreating(true);
    setLabelNameError('');
    try {
      const newLabel = await onCreateLabel(trimmedName, newLabelColor);
      // Invalidate labels query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      onSelectionChange([...selectedLabelIds, newLabel.id]);
      setNewLabelName('');
      setNewLabelColor('#9CA3AF'); // Default gray color (not displayed)
      setShowCreateForm(false);
      setSearchQuery('');
      setLabelNameError('');
    } catch (error: any) {
      console.error('Failed to create label:', error);
      toast.error(getErrorMessage(error, 'Không thể tạo nhãn'));
    } finally {
      setIsCreating(false);
    }
  };

  // Color is stored but not displayed in minimalist design

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Nhãn
      </label>

      {/* Selected labels display */}
      <div
        className={`border border-gray-300 rounded-lg p-2 min-h-[42px] cursor-pointer transition-colors relative ${
          error ? 'border-error-300' : 'hover:border-gray-400'
        } ${isOpen ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 items-center pr-8">
          {selectedLabels.length > 0 ? (
            selectedLabels.map(label => (
              <LabelChip
                key={label.id}
                label={label}
                size="sm"
                showRemove
                onRemove={(labelId) => {
                  handleToggleLabel(labelId);
                }}
              />
            ))
          ) : (
            <span className="text-sm text-gray-500">{placeholder}</span>
          )}
        </div>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none flex-shrink-0" />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Tag className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm nhãn..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Labels list */}
          <div className="overflow-y-auto max-h-48">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Đang tải nhãn...</p>
              </div>
            ) : filteredLabels.length === 0 && !showCreateForm ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">
                  {searchQuery ? 'Không tìm thấy nhãn nào' : 'Không có nhãn nào'}
                </p>
                {allowCreate && onCreateLabel && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo nhãn mới
                  </button>
                )}
              </div>
            ) : (
              <>
                {filteredLabels.map((label) => (
                  <div
                    key={label.id}
                    className="px-3 py-2 hover:bg-gray-50 cursor-pointer flex items-center gap-2"
                    onClick={() => handleToggleLabel(label.id)}
                  >
                    <span className="text-sm text-gray-900 flex-1">{label.name}</span>
                    {label.projectId === null && (
                      <span className="text-xs text-gray-400">Toàn cục</span>
                    )}
                  </div>
                ))}

                {/* Create new label form */}
                {showCreateForm && allowCreate && onCreateLabel && (
                  <div className="p-3 border-t border-gray-200 bg-gray-50">
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={newLabelName}
                        onChange={(e) => handleLabelNameChange(e.target.value)}
                        onBlur={() => {
                          const error = validateLabelName(newLabelName);
                          setLabelNameError(error);
                        }}
                        placeholder="Tên nhãn"
                        maxLength={50}
                        className={`w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-1 ${
                          labelNameError
                            ? 'border-error-300 focus:ring-error-500'
                            : 'border-gray-300 focus:ring-primary-500'
                        }`}
                        autoFocus
                      />
                      {labelNameError && (
                        <p className="text-xs text-error-600 mt-1">{labelNameError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim() || !!labelNameError || isCreating}
                          className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreating ? 'Đang tạo...' : 'Tạo'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewLabelName('');
                            setNewLabelColor('#9CA3AF'); // Default gray color
                            setLabelNameError('');
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Hủy
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Show create button if not in create form */}
                {!showCreateForm && allowCreate && onCreateLabel && (
                  <div className="p-2 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(true)}
                      className="w-full px-3 py-2 text-sm text-primary-600 hover:bg-primary-50 rounded-md flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Tạo nhãn mới
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}
    </div>
  );
}

