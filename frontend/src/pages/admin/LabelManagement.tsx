import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import { getLabels, createLabel, updateLabel, deleteLabel } from '../../lib/labelApi';
import api from '../../lib/axios';
import LabelChip from '../../components/ui/LabelChip';
import { Tag, Plus, Edit2, Trash2, Search, Loader2, FolderOpen, Globe } from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import type { Label, CreateLabelRequest, UpdateLabelRequest } from '../../types/label';
import type { Project } from '../../types/project';
import ProjectFilterSelector from '../../components/ui/ProjectFilterSelector';
import SelectDropdown from '../../components/ui/SelectDropdown';

export default function LabelManagement() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelProjectId, setNewLabelProjectId] = useState<string | null>(null);
  const [newLabelNameError, setNewLabelNameError] = useState('');
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelNameError, setEditLabelNameError] = useState('');

  // Fetch all labels (no projectId = all labels)
  const { data: labels = [], isLoading: labelsLoading } = useQuery({
    queryKey: ['labels', 'all'],
    queryFn: () => getLabels(),
  });

  // Fetch projects for filter
  const { data: projectsData } = useQuery({
    queryKey: ['projects', 'all'],
    queryFn: async () => {
      const response = await api.get('/projects?limit=1000');
      return response.data.projects || [];
    },
  });
  const projects = projectsData || [];

  // Filter labels
  const filteredLabels = labels.filter((label) => {
    const matchesSearch = search === '' || 
      label.name.toLowerCase().includes(search.toLowerCase()) ||
      label.creator.fullName.toLowerCase().includes(search.toLowerCase()) ||
      (label.project && label.project.title.toLowerCase().includes(search.toLowerCase()));
    
    // Filter by projects: empty = all (including global), otherwise only show selected projects
    const matchesProject = selectedProjects.length === 0 || 
      (label.projectId !== null && selectedProjects.includes(label.projectId));

    return matchesSearch && matchesProject;
  });

  // Group labels
  const globalLabels = filteredLabels.filter((l) => l.projectId === null);
  const projectLabels = filteredLabels.filter((l) => l.projectId !== null);

  // Group project labels by project
  const labelsByProject = projectLabels.reduce((acc, label) => {
    const projectId = label.projectId || 'unknown';
    if (!acc[projectId]) {
      acc[projectId] = {
        project: label.project!,
        labels: [],
      };
    }
    acc[projectId].labels.push(label);
    return acc;
  }, {} as Record<string, { project: { id: string; title: string }; labels: Label[] }>);

  // Calculate user's label count for selected project
  // Admin also has limit of 5 labels per project, but unlimited global labels
  const MAX_LABELS_PER_PROJECT = 5;
  const userLabelCount = newLabelProjectId
    ? labels.filter(
        (l) =>
          l.projectId === newLabelProjectId &&
          l.createdBy === user?.id
      ).length
    : 0;
  // For project labels: all users (including Admin) have 5 label limit
  // For global labels: only Admin can create, unlimited
  const canCreateMoreLabels = newLabelProjectId === null
    ? user?.role === 'ADMIN' // Only Admin can create global labels
    : userLabelCount < MAX_LABELS_PER_PROJECT; // All users have 5 label limit per project

  // Create label mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateLabelRequest) => createLabel(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      setIsCreating(false);
      setNewLabelName('');
      setNewLabelProjectId(null);
      setNewLabelNameError('');
      toast.success('Đã tạo nhãn thành công');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể tạo nhãn'));
    },
  });

  // Update label mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabelRequest }) =>
      updateLabel(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setEditingId(null);
      setEditLabelName('');
      setEditLabelNameError('');
      toast.success('Đã cập nhật nhãn thành công');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể cập nhật nhãn'));
    },
  });

  // Delete label mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteLabel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labels'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Đã xóa nhãn thành công');
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể xóa nhãn'));
    },
  });

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
    return '';
  };

  const handleCreate = () => {
    const trimmedName = newLabelName.trim();
    const error = validateLabelName(trimmedName);
    
    if (error) {
      setNewLabelNameError(error);
      return;
    }

    setNewLabelNameError('');
    createMutation.mutate({
      name: trimmedName,
      projectId: newLabelProjectId || null,
    });
  };

  const handleStartEdit = (label: Label) => {
    setEditingId(label.id);
    setEditLabelName(label.name);
    setEditLabelNameError('');
  };

  const handleUpdate = (id: string) => {
    const trimmedName = editLabelName.trim();
    const error = validateLabelName(trimmedName);
    
    if (error) {
      setEditLabelNameError(error);
      return;
    }

    setEditLabelNameError('');
    updateMutation.mutate({
      id,
      data: {
        name: trimmedName,
      },
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa nhãn này? Điều này sẽ xóa nhãn khỏi tất cả nhiệm vụ.')) {
      deleteMutation.mutate(id);
    }
  };

  if (!user || user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Không có quyền truy cập</h2>
          <p className="text-gray-600">Chỉ quản trị viên mới có thể truy cập trang này.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Quản lý Nhãn</h1>
            <p className="page-subtitle">
              Quản lý tất cả nhãn trong hệ thống (toàn cục và theo dự án).
            </p>
          </div>
          {!isCreating && (
            <button
              onClick={() => setIsCreating(true)}
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Tạo Nhãn
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên nhãn, người tạo, dự án..."
                  className="input pl-10 text-sm min-h-[42px]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Project Filter */}
            <ProjectFilterSelector
              label="Lọc theo dự án"
              selectedProjects={selectedProjects}
              onSelectionChange={setSelectedProjects}
              multiple={true}
              placeholder="Tất cả dự án"
            />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Tổng số nhãn</p>
                <p className="text-2xl font-bold text-gray-900">{filteredLabels.length}</p>
              </div>
              <Tag className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nhãn Toàn cục</p>
                <p className="text-2xl font-bold text-gray-900">{globalLabels.length}</p>
              </div>
              <Globe className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Nhãn Dự án</p>
                <p className="text-2xl font-bold text-gray-900">{projectLabels.length}</p>
              </div>
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="card mb-6">
          <div className="card-body">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tạo Nhãn Mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên Nhãn <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  value={newLabelName}
                  onChange={(e) => {
                    setNewLabelName(e.target.value);
                    if (newLabelNameError) {
                      setNewLabelNameError(validateLabelName(e.target.value));
                    }
                  }}
                  onBlur={() => {
                    const error = validateLabelName(newLabelName);
                    setNewLabelNameError(error);
                  }}
                  placeholder="Nhập tên nhãn"
                  className={`input ${newLabelNameError ? 'border-error-300' : ''}`}
                  maxLength={50}
                  autoFocus
                />
                {newLabelNameError && (
                  <p className="text-xs text-error-600 mt-1">{newLabelNameError}</p>
                )}
              </div>

              <div>
                <SelectDropdown
                  label="Thuộc Dự án"
                  options={[
                    { id: 'null', fullName: 'Nhãn Toàn cục' },
                    ...projects.map((p: Project) => ({ id: p.id, fullName: p.title })),
                  ]}
                  value={newLabelProjectId || 'null'}
                  onChange={(value: string) => setNewLabelProjectId(value === 'null' ? null : value)}
                  placeholder="Chọn dự án (hoặc để trống cho nhãn toàn cục)"
                />
                {newLabelProjectId && (
                  <p className="text-xs text-gray-600 mt-1">
                    Bạn đã tạo {userLabelCount}/{MAX_LABELS_PER_PROJECT} nhãn cho dự án này
                    {!canCreateMoreLabels && (
                      <span className="text-error-600 ml-1">
                        (Đã đạt giới hạn)
                      </span>
                    )}
                  </p>
                )}
                {newLabelProjectId === null && user?.role !== 'ADMIN' && (
                  <p className="text-xs text-error-600 mt-1">
                    Chỉ quản trị viên mới có thể tạo nhãn toàn cục
                  </p>
                )}
                {newLabelProjectId === null && user?.role === 'ADMIN' && (
                  <p className="text-xs text-gray-600 mt-1">
                    Nhãn toàn cục không giới hạn số lượng
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  disabled={
                    !newLabelName.trim() ||
                    !!newLabelNameError ||
                    createMutation.isPending ||
                    (newLabelProjectId === null && user?.role !== 'ADMIN') ||
                    (newLabelProjectId !== null && !canCreateMoreLabels)
                  }
                  className="btn-primary flex-1"
                >
                  {createMutation.isPending ? 'Đang tạo...' : 'Tạo Nhãn'}
                </button>
                <button
                  onClick={() => {
                    setIsCreating(false);
                    setNewLabelName('');
                    setNewLabelProjectId(null);
                    setNewLabelNameError('');
                  }}
                  className="btn-secondary"
                >
                  Hủy
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Labels List */}
      <div className="space-y-6">
        {labelsLoading ? (
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Global Labels */}
            {globalLabels.length > 0 && (
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center gap-2 mb-4">
                    <Globe className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Nhãn Toàn cục ({globalLabels.length})
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {globalLabels.map((label) => (
                      <LabelItem
                        key={label.id}
                        label={label}
                        editingId={editingId}
                        editLabelName={editLabelName}
                        editLabelNameError={editLabelNameError}
                        onEditNameChange={setEditLabelName}
                        onEditNameErrorChange={setEditLabelNameError}
                        validateLabelName={validateLabelName}
                        onStartEdit={handleStartEdit}
                        onUpdate={handleUpdate}
                        onDelete={handleDelete}
                        onCancelEdit={() => {
                          setEditingId(null);
                          setEditLabelName('');
                          setEditLabelNameError('');
                        }}
                        isUpdating={updateMutation.isPending}
                        isDeleting={deleteMutation.isPending}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Project Labels */}
            {Object.keys(labelsByProject).length > 0 && (
              <div className="space-y-4">
                {Object.values(labelsByProject).map(({ project, labels: projectLabelsList }) => (
                  <div key={project.id} className="card">
                    <div className="card-body">
                      <div className="flex items-center gap-2 mb-4">
                        <FolderOpen className="w-5 h-5 text-gray-400" />
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.title} ({projectLabelsList.length})
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {projectLabelsList.map((label) => (
                          <LabelItem
                            key={label.id}
                            label={label}
                            editingId={editingId}
                            editLabelName={editLabelName}
                            editLabelNameError={editLabelNameError}
                            onEditNameChange={setEditLabelName}
                            onEditNameErrorChange={setEditLabelNameError}
                            validateLabelName={validateLabelName}
                            onStartEdit={handleStartEdit}
                            onUpdate={handleUpdate}
                            onDelete={handleDelete}
                            onCancelEdit={() => {
                              setEditingId(null);
                              setEditLabelName('');
                              setEditLabelNameError('');
                            }}
                            isUpdating={updateMutation.isPending}
                            isDeleting={deleteMutation.isPending}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empty State */}
            {filteredLabels.length === 0 && !labelsLoading && (
              <div className="card">
                <div className="card-body">
                  <div className="text-center py-12">
                    <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-600">
                      {search || selectedProjects.length > 0
                        ? 'Không tìm thấy nhãn nào phù hợp với bộ lọc.'
                        : 'Chưa có nhãn nào. Tạo nhãn đầu tiên để bắt đầu.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface LabelItemProps {
  label: Label;
  editingId: string | null;
  editLabelName: string;
  editLabelNameError: string;
  onEditNameChange: (name: string) => void;
  onEditNameErrorChange: (error: string) => void;
  validateLabelName: (name: string) => string;
  onStartEdit: (label: Label) => void;
  onUpdate: (id: string) => void;
  onDelete: (id: string) => void;
  onCancelEdit: () => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function LabelItem({
  label,
  editingId,
  editLabelName,
  editLabelNameError,
  onEditNameChange,
  onEditNameErrorChange,
  validateLabelName,
  onStartEdit,
  onUpdate,
  onDelete,
  onCancelEdit,
  isUpdating,
  isDeleting,
}: LabelItemProps) {
  const isEditing = editingId === label.id;

  if (isEditing) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="space-y-3">
          <div>
            <input
              type="text"
              value={editLabelName}
              onChange={(e) => {
                onEditNameChange(e.target.value);
                if (editLabelNameError) {
                  onEditNameErrorChange(validateLabelName(e.target.value));
                }
              }}
              onBlur={() => {
                const error = validateLabelName(editLabelName);
                onEditNameErrorChange(error);
              }}
              className={`input ${editLabelNameError ? 'border-error-300' : ''}`}
              autoFocus
              maxLength={50}
            />
            {editLabelNameError && (
              <p className="text-xs text-error-600 mt-1">{editLabelNameError}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdate(label.id)}
              disabled={!editLabelName.trim() || !!editLabelNameError || isUpdating}
              className="btn-primary text-sm flex-1"
            >
              {isUpdating ? 'Đang lưu...' : 'Lưu'}
            </button>
            <button onClick={onCancelEdit} className="btn-secondary text-sm">
              Hủy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <LabelChip label={label} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-600 truncate">
            Tạo bởi: {label.creator.fullName}
          </p>
          <p className="text-xs text-gray-500">
            {new Date(label.createdAt).toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={() => onStartEdit(label)}
          className="p-1.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors"
          title="Chỉnh sửa nhãn"
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(label.id)}
          disabled={isDeleting}
          className="p-1.5 text-gray-600 hover:text-error-600 hover:bg-error-50 rounded transition-colors disabled:opacity-50"
          title="Xóa nhãn"
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

