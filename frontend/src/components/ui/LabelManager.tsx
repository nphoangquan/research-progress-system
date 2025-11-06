import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tag, Plus, Edit2, Trash2, X, Loader2 } from 'lucide-react';
import { getLabels, createLabel, updateLabel, deleteLabel } from '../../lib/labelApi';
import LabelChip from './LabelChip';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '../../types/label';
import toast from 'react-hot-toast';

interface LabelManagerProps {
  projectId?: string; // undefined = global labels (admin only)
  className?: string;
}

export default function LabelManager({ projectId, className = '' }: LabelManagerProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('#3B82F6');
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('#3B82F6');

  // Fetch labels
  const { data: labels = [], isLoading } = useQuery({
    queryKey: ['labels', projectId],
    queryFn: () => getLabels(projectId),
  });

  // Create label mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateLabelRequest) => createLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setIsCreating(false);
      setNewLabelName('');
      setNewLabelColor('#3B82F6');
      toast.success('Label created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create label');
    },
  });

  // Update label mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabelRequest }) =>
      updateLabel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] }); // Tasks may display labels
      setEditingId(null);
      setEditLabelName('');
      setEditLabelColor('#3B82F6');
      toast.success('Label updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update label');
    },
  });

  // Delete label mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLabel(id),
    onSuccess: () => {
      // Invalidate labels and tasks queries since deleting a label affects tasks
      queryClient.invalidateQueries({ queryKey: ['labels', projectId] });
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      toast.success('Label deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete label');
    },
  });

  const handleCreate = () => {
    if (!newLabelName.trim()) {
      toast.error('Label name is required');
      return;
    }

    createMutation.mutate({
      name: newLabelName.trim(),
      color: newLabelColor,
      projectId: projectId || null,
    });
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditLabelName(label.name);
    setEditLabelColor(label.color);
  };

  const handleUpdate = (id: string) => {
    if (!editLabelName.trim()) {
      toast.error('Label name is required');
      return;
    }

    updateMutation.mutate({
      id,
      data: {
        name: editLabelName.trim(),
        color: editLabelColor,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this label? This will remove it from all tasks.')) {
      deleteMutation.mutate(id);
    }
  };

  const predefinedColors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1'
  ];

  const projectLabels = labels.filter(label => label.projectId === projectId);
  const globalLabels = labels.filter(label => label.projectId === null);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Tag className="w-5 h-5" />
          {projectId ? 'Project Labels' : 'Global Labels'}
        </h3>
        {!isCreating && (
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Label
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Loading labels...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Create form */}
          {isCreating && (
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Label Name
                  </label>
                  <input
                    type="text"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    autoFocus
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color
                  </label>
                  <div className="flex gap-2 flex-wrap">
                    {predefinedColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabelColor(color)}
                        className={`w-8 h-8 rounded-full border-2 transition-transform ${
                          newLabelColor === color
                            ? 'border-gray-900 scale-110'
                            : 'border-gray-300 hover:scale-105'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={!newLabelName.trim() || createMutation.isPending}
                    className="btn-primary flex-1"
                  >
                    {createMutation.isPending ? 'Creating...' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setNewLabelName('');
                      setNewLabelColor('#3B82F6');
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Labels list */}
          {projectId ? (
            // Project labels
            projectLabels.length === 0 && !isCreating ? (
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No project labels yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {projectLabels.map((label) => (
                  <LabelItem
                    key={label.id}
                    label={label}
                    editingId={editingId}
                    editLabelName={editLabelName}
                    editLabelColor={editLabelColor}
                    onEditNameChange={setEditLabelName}
                    onEditColorChange={setEditLabelColor}
                    onStartEdit={handleStartEdit}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditLabelName('');
                      setEditLabelColor('#3B82F6');
                    }}
                    predefinedColors={predefinedColors}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )
          ) : (
            // Global labels
            globalLabels.length === 0 && !isCreating ? (
              <div className="text-center py-8 text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No global labels yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {globalLabels.map((label) => (
                  <LabelItem
                    key={label.id}
                    label={label}
                    editingId={editingId}
                    editLabelName={editLabelName}
                    editLabelColor={editLabelColor}
                    onEditNameChange={setEditLabelName}
                    onEditColorChange={setEditLabelColor}
                    onStartEdit={handleStartEdit}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                    onCancelEdit={() => {
                      setEditingId(null);
                      setEditLabelName('');
                      setEditLabelColor('#3B82F6');
                    }}
                    predefinedColors={predefinedColors}
                    isUpdating={updateMutation.isPending}
                    isDeleting={deleteMutation.isPending}
                  />
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

interface LabelItemProps {
  label: Label;
  editingId: string | null;
  editLabelName: string;
  editLabelColor: string;
  onEditNameChange: (name: string) => void;
  onEditColorChange: (color: string) => void;
  onStartEdit: (label: Label) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  predefinedColors: string[];
  isUpdating: boolean;
  isDeleting: boolean;
}

function LabelItem({
  label,
  editingId,
  editLabelName,
  editLabelColor,
  onEditNameChange,
  onEditColorChange,
  onStartEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  predefinedColors,
  isUpdating,
  isDeleting,
}: LabelItemProps) {
  const isEditing = editingId === label.id;

  if (isEditing) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={editLabelName}
              onChange={(e) => onEditNameChange(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
              autoFocus
              maxLength={50}
            />
          </div>
          <div>
            <div className="flex gap-2 flex-wrap">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => onEditColorChange(color)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    editLabelColor === color
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
              onClick={() => onUpdate(label.id)}
              disabled={!editLabelName.trim() || isUpdating}
              className="btn-primary text-sm flex-1"
            >
              {isUpdating ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              className="btn-secondary text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <LabelChip label={label} size="md" />
        {label.projectId === null && (
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Global
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onStartEdit(label)}
          className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Edit label"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(label.id)}
          disabled={isDeleting}
          className="p-1.5 text-gray-600 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
          title="Delete label"
        >
          {isDeleting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}

