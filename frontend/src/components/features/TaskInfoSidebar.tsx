import { useMemo } from 'react';
import { Calendar, User, Clock, CheckCircle } from 'lucide-react';
import SelectDropdown from '../ui/SelectDropdown';
import DatePicker from '../ui/DatePicker';
import LabelChip from '../ui/LabelChip';
import type { Label } from '../../types/label';

interface TaskInfoSidebarProps {
  task: {
    status: string;
    priority: string;
    assignee: {
      id: string;
      fullName: string;
    };
    dueDate: string | null;
    labels?: Label[];
    createdAt: string;
    completedAt: string | null;
  };
  isEditing: boolean;
  editData: {
    status: string;
    priority: string;
    assigneeId: string;
    dueDate: string;
  };
  onEditDataChange: (data: Partial<TaskInfoSidebarProps['editData']>) => void;
  projectMembers?: Array<{
    id: string;
    fullName: string;
    role?: string;
  }>;
  users?: Array<{
    id: string;
    fullName: string;
    role?: string;
  }>;
  getStatusColor: (status: string) => string;
  getPriorityColor: (priority: string) => string;
  isOverdue: (dueDate: string | null, status: string) => boolean;
  formatDate: (dateString: string | null) => string | null;
  formatDateTime: (dateString: string) => string;
}

export default function TaskInfoSidebar({
  task,
  isEditing,
  editData,
  onEditDataChange,
  projectMembers,
  users,
  getStatusColor,
  getPriorityColor,
  isOverdue,
  formatDate,
  formatDateTime,
}: TaskInfoSidebarProps) {
  // Use users if provided, otherwise use projectMembers
  const assigneeOptions = useMemo(() => {
    const options = users || projectMembers || [];
    return options.map((member) => ({
      id: member.id,
      fullName: member.role ? `${member.fullName} (${member.role})` : member.fullName
    }));
  }, [users, projectMembers]);

  const statusOptions = useMemo(() => [
    { id: 'TODO', fullName: 'Cần làm' },
    { id: 'IN_PROGRESS', fullName: 'Đang thực hiện' },
    { id: 'REVIEW', fullName: 'Đang xem xét' },
    { id: 'COMPLETED', fullName: 'Hoàn thành' }
  ], []);

  const statusLabels = useMemo<Record<string, string>>(() => ({
    TODO: 'Cần làm',
    IN_PROGRESS: 'Đang thực hiện',
    REVIEW: 'Đang xem xét',
    COMPLETED: 'Hoàn thành'
  }), []);

  const priorityOptions = useMemo(() => [
    { id: 'LOW', fullName: 'Thấp' },
    { id: 'MEDIUM', fullName: 'Trung bình' },
    { id: 'HIGH', fullName: 'Cao' },
    { id: 'URGENT', fullName: 'Khẩn cấp' }
  ], []);

  const priorityLabels = useMemo<Record<string, string>>(() => ({
    LOW: 'Thấp',
    MEDIUM: 'Trung bình',
    HIGH: 'Cao',
    URGENT: 'Khẩn cấp'
  }), []);

  return (
    <div className="space-y-6">
      {/* Task Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Thông tin nhiệm vụ</h3>
        </div>
        <div className="card-body space-y-4">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Trạng thái</label>
            {isEditing ? (
              <SelectDropdown
                label=""
                options={statusOptions}
                value={editData.status}
                onChange={(status: string) => onEditDataChange({ status })}
                placeholder="Chọn trạng thái..."
              />
            ) : (
              <span className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${getStatusColor(task.status)}`}>
                {statusLabels[task.status] ?? task.status.replace('_', ' ')}
              </span>
            )}
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mức độ ưu tiên</label>
            {isEditing ? (
              <SelectDropdown
                label=""
                options={priorityOptions}
                value={editData.priority}
                onChange={(priority: string) => onEditDataChange({ priority })}
                placeholder="Chọn mức độ ưu tiên..."
              />
            ) : (
              <span className={`text-sm font-medium ${getPriorityColor(task.priority)}`}>
                {priorityLabels[task.priority] ?? task.priority}
              </span>
            )}
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Người được gán</label>
            {isEditing ? (
              <SelectDropdown
                label=""
                options={assigneeOptions}
                value={editData.assigneeId}
                onChange={(assigneeId: string) => onEditDataChange({ assigneeId })}
                placeholder="Chọn người được gán..."
              />
            ) : (
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span className="text-sm text-gray-900">{task.assignee?.fullName || 'Chưa được gán'}</span>
              </div>
            )}
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Hạn chót</label>
            {isEditing ? (
              <DatePicker
                value={editData.dueDate || null}
                onChange={(value) => onEditDataChange({ dueDate: value || '' })}
                placeholder="Chọn hạn chót (tùy chọn)"
              />
            ) : (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span className={`text-sm ${isOverdue(task.dueDate, task.status) ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatDate(task.dueDate) || 'Chưa có hạn chót'}
                </span>
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nhãn</label>
            {task.labels && task.labels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {task.labels.map(label => (
                  <LabelChip key={label.id} label={label} size="sm" />
                ))}
              </div>
            ) : (
              <span className="text-sm text-gray-500">Chưa có nhãn</span>
            )}
          </div>

          {/* Created Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ngày tạo</label>
            <div className="flex items-center">
              <Clock className="w-4 h-4 text-gray-400 mr-2" />
              <span className="text-sm text-gray-900">
                {formatDateTime(task.createdAt)}
              </span>
            </div>
          </div>

          {/* Completed Date */}
          {task.completedAt && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Ngày hoàn thành</label>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                <span className="text-sm text-gray-900">
                  {formatDateTime(task.completedAt)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

