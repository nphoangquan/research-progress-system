import { memo } from 'react';
import { Award, UserCheck, Clock3, MessageSquare } from 'lucide-react';
import type { TaskGrade } from '../../types/task';

interface TaskGradeSummaryProps {
  grade?: TaskGrade | null;
  canManage: boolean;
  onManage: () => void;
  formatDateTime: (value: string) => string;
}

function TaskGradeSummaryComponent({
  grade,
  canManage,
  onManage,
  formatDateTime
}: TaskGradeSummaryProps) {
  const hasGrade = Boolean(grade);
  const gradeValue =
    grade && grade.score !== undefined && grade.score !== null
      ? typeof grade.score === 'number'
        ? grade.score
        : Number(grade.score)
      : null;
  const formattedScore =
    gradeValue !== null && !Number.isNaN(gradeValue)
      ? gradeValue.toFixed(2).replace(/\.00$/, '')
      : null;

  return (
    <div className="card">
      <div className="card-header flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            Đánh giá nhiệm vụ
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {hasGrade
              ? `Cập nhật ${formatDateTime(grade!.gradedAt)}`
              : 'Chưa có điểm cho nhiệm vụ này'}
          </p>
        </div>
        {canManage && (
          <button
            type="button"
            onClick={onManage}
            className="btn-primary w-full sm:w-auto justify-center"
          >
            {hasGrade ? 'Chỉnh sửa điểm' : 'Chấm điểm'}
          </button>
        )}
      </div>
      <div className="card-body">
        {hasGrade ? (
          <div className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">Điểm số</div>
              <div className="text-4xl font-bold text-gray-900 tracking-tight">
                {formattedScore ?? '—'}/10
              </div>
            </div>

            {grade?.feedback && (
              <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                  <MessageSquare className="w-4 h-4 text-gray-500" />
                  Nhận xét
                </div>
                <p className="text-gray-700 whitespace-pre-line">
                  {grade.feedback}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs uppercase text-gray-500">Chấm bởi</p>
                  <p className="font-medium text-gray-900">
                {grade?.grader?.fullName || 'Không xác định'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock3 className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-xs uppercase text-gray-500">Thời gian</p>
                  <p className="font-medium text-gray-900">
                    {formatDateTime(grade!.gradedAt)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
            <p className="text-gray-600">Chưa có điểm nào được ghi nhận cho nhiệm vụ này.</p>
            {canManage && (
              <p className="text-sm text-gray-500 mt-2">
                Nhấn nút &ldquo;Chấm điểm&rdquo; để bắt đầu đánh giá.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const TaskGradeSummary = memo(TaskGradeSummaryComponent);

export default TaskGradeSummary;

