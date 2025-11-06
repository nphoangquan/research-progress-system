import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Tag, X, ChevronDown, Plus, Loader2 } from 'lucide-react';
import { getLabels } from '../../lib/labelApi';
import LabelChip from './LabelChip';
import type { Label } from '../../types/label';
import toast from 'react-hot-toast';

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
  placeholder = "Select labels...",
  className = "",
  allowCreate = false,
  onCreateLabel
}: LabelSelectorProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [isCreating, setIsCreating] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch labels
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => getLabels(projectId),
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreateForm(false);
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

  const handleCreateLabel = async () => {
    if (!newLabelName.trim() || !onCreateLabel) return;

    setIsCreating(true);
    try {
      const newLabel = await onCreateLabel(newLabelName.trim(), newLabelColor);
      // Invalidate labels query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      onSelectionChange([...selectedLabelIds, newLabel.id]);
      setNewLabelName('');
      setNewLabelColor('#3B82F6');
      setShowCreateForm(false);
      setSearchQuery('');
    } catch (error: any) {
      console.error('Failed to create label:', error);
      toast.error(error.response?.data?.error || 'Failed to create label');
    } finally {
      setIsCreating(false);
    }
  };

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Labels
      </label>

      {/* Selected labels display */}
      <div
        className={`border border-gray-300 rounded-lg p-2 min-h-[42px] cursor-pointer transition-colors ${
          error ? 'border-error-300' : 'hover:border-gray-400'
        } ${isOpen ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex flex-wrap gap-2 items-center">
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
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
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
                placeholder="Search labels..."
                className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Labels list */}
          <div className="overflow-y-auto max-h-48">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                <p className="text-sm">Loading labels...</p>
              </div>
            ) : filteredLabels.length === 0 && !showCreateForm ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">
                  {searchQuery ? 'No labels found' : 'No labels available'}
                </p>
                {allowCreate && onCreateLabel && (
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(true)}
                    className="mt-2 text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create new label
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
                    <div
                      className="w-4 h-4 rounded-full border-2 border-gray-300"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="text-sm text-gray-900 flex-1">{label.name}</span>
                    {label.projectId === null && (
                      <span className="text-xs text-gray-400">Global</span>
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
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Label name"
                        maxLength={50}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                        autoFocus
                      />
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Color:</span>
                        <div className="flex gap-1 flex-1">
                          {predefinedColors.map((color) => (
                            <button
                              key={color}
                              type="button"
                              onClick={() => setNewLabelColor(color)}
                              className={`w-6 h-6 rounded-full border-2 ${
                                newLabelColor === color
                                  ? 'border-gray-900 scale-110'
                                  : 'border-gray-300'
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={handleCreateLabel}
                          disabled={!newLabelName.trim() || isCreating}
                          className="flex-1 px-3 py-1.5 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isCreating ? 'Creating...' : 'Create'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewLabelName('');
                            setNewLabelColor('#3B82F6');
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                        >
                          Cancel
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
                      Create new label
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

