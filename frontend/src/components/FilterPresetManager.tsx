import React from 'react';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/axios';
import { 
  Filter, 
  Save, 
  Trash2, 
  Edit3, 
  Play, 
  Plus, 
  X,
  Star,
  Users,
  Calendar,
  Search
} from 'lucide-react';
import toast from 'react-hot-toast';

interface FilterPreset {
  id: string;
  name: string;
  description?: string;
  entityType: 'project' | 'task' | 'document';
  filters: any;
  isPublic: boolean;
  isOwner: boolean;
  createdBy: string;
  createdAt: string;
}

interface FilterPresetManagerProps {
  entityType: 'project' | 'task' | 'document';
  currentFilters: any;
  onApplyPreset: (filters: any) => void;
  className?: string;
}

export default function FilterPresetManager({ 
  entityType, 
  currentFilters, 
  onApplyPreset,
  className = "" 
}: FilterPresetManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');
  const queryClient = useQueryClient();

  // Fetch filter presets
  const { data: presets, isLoading } = useQuery<FilterPreset[]>({
    queryKey: ['filterPresets', entityType],
    queryFn: async () => {
      const response = await api.get(`/filters?entityType=${entityType}`);
      return response.data.presets;
    },
  });

  // Save preset mutation
  const savePresetMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; filters: any }) => {
      const response = await api.post('/filters', {
        ...data,
        entityType
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filterPresets', entityType] });
      toast.success('Filter preset saved successfully');
      setIsCreating(false);
      setPresetName('');
      setPresetDescription('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save filter preset');
    }
  });

  // Update preset mutation
  const updatePresetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await api.put(`/filters/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filterPresets', entityType] });
      toast.success('Filter preset updated successfully');
      setEditingPreset(null);
      setPresetName('');
      setPresetDescription('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update filter preset');
    }
  });

  // Delete preset mutation
  const deletePresetMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/filters/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filterPresets', entityType] });
      toast.success('Filter preset deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete filter preset');
    }
  });

  const handleSavePreset = () => {
    if (!presetName.trim()) {
      toast.error('Please enter a preset name');
      return;
    }

    if (editingPreset) {
      updatePresetMutation.mutate({
        id: editingPreset.id,
        data: {
          name: presetName,
          description: presetDescription
        }
      });
    } else {
      savePresetMutation.mutate({
        name: presetName,
        description: presetDescription,
        filters: currentFilters
      });
    }
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
    setIsOpen(false);
    toast.success(`Applied filter preset: ${preset.name}`);
  };

  const handleEditPreset = (preset: FilterPreset) => {
    setEditingPreset(preset);
    setPresetName(preset.name);
    setPresetDescription(preset.description || '');
    setIsCreating(true);
  };

  const handleDeletePreset = (preset: FilterPreset) => {
    if (window.confirm(`Are you sure you want to delete "${preset.name}"?`)) {
      deletePresetMutation.mutate(preset.id);
    }
  };

  const resetForm = () => {
    setIsCreating(false);
    setEditingPreset(null);
    setPresetName('');
    setPresetDescription('');
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors duration-200"
      >
        <Filter className="w-4 h-4" />
        <span>Saved Filters</span>
        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
          {presets?.length || 0}
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Saved Filter Presets
                </h3>
                <p className="text-sm text-gray-500">
                  Manage your saved filters for {entityType}s
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Create/Edit Form */}
            {isCreating && (
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h4 className="text-md font-medium text-gray-900 mb-4">
                  {editingPreset ? 'Edit Filter Preset' : 'Save Current Filters'}
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preset Name
                    </label>
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="Enter preset name..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={presetDescription}
                      onChange={(e) => setPresetDescription(e.target.value)}
                      placeholder="Enter description..."
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSavePreset}
                      disabled={savePresetMutation.isPending || updatePresetMutation.isPending}
                      className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      <Save className="w-4 h-4" />
                      <span>{editingPreset ? 'Update' : 'Save'} Preset</span>
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Presets List */}
            <div className="p-6">
              {!isCreating && (
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium text-gray-900">
                    Your Saved Presets
                  </h4>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Save Current Filters</span>
                  </button>
                </div>
              )}

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : presets && presets.length > 0 ? (
                <div className="space-y-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h5 className="font-medium text-gray-900">{preset.name}</h5>
                          {preset.isPublic && (
                            <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-600 rounded-full">
                              Public
                            </span>
                          )}
                          {!preset.isOwner && (
                            <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                              by {preset.createdBy}
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Created {new Date(preset.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleApplyPreset(preset)}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors duration-200"
                          title="Apply preset"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        {preset.isOwner && (
                          <>
                            <button
                              onClick={() => handleEditPreset(preset)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Edit preset"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePreset(preset)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200"
                              title="Delete preset"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Filter className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No saved filter presets yet</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Save your current filters to create reusable presets
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
