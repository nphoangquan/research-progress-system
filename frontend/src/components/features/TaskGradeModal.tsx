import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { X, Award } from 'lucide-react';
import api from '../../lib/axios';
import type { TaskGrade } from '../../types/task';
import { getErrorMessage } from '../../utils/errorUtils';

interface TaskGradeModalProps {
  open: boolean;
  onClose: () => void;
  taskId: string;
  grade?: TaskGrade | null;
  onSuccess?: () => void;
}

export default function TaskGradeModal({
  open,
  onClose,
  taskId,
  grade,
  onSuccess
}: TaskGradeModalProps) {
  const [score, setScore] = useState<string>('0');
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (grade && open) {
      setScore(grade.score.toString());
      setFeedback(grade.feedback || '');
    } else if (open) {
      setScore('0');
      setFeedback('');
    }
  }, [grade, open]);

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        score: Number(score),
        feedback: feedback.trim() || undefined
      };

      if (grade) {
        const response = await api.put(`/tasks/${taskId}/grade`, payload);
        return response.data;
      }

      const response = await api.post(`/tasks/${taskId}/grade`, payload);
      return response.data;
    },
    onSuccess: () => {
      toast.success(grade ? 'Cập nhật điểm thành công' : 'Chấm điểm thành công');
      onSuccess?.();
      onClose();
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể lưu điểm nhiệm vụ'));
    }
  });

  if (!open) return null;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    gradeMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl shadow-soft w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-primary-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              {grade ? 'Chỉnh sửa điểm nhiệm vụ' : 'Chấm điểm nhiệm vụ'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-2"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-5 space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Điểm số (0 - 10)
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                max="10"
                value={score}
                onChange={(event) => setScore(event.target.value)}
                className="input"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhận xét (không bắt buộc)
              </label>
              <textarea
                rows={4}
                value={feedback}
                onChange={(event) => setFeedback(event.target.value)}
                className="input"
                placeholder="Nhận xét chi tiết về nhiệm vụ..."
                maxLength={2000}
              />
              <p className="mt-2 text-xs text-gray-500">
                Tối đa 2000 ký tự. Bạn có thể để trống nếu không có nhận xét.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
            <button type="button" onClick={onClose} className="btn-secondary">
              Hủy
            </button>
            <button
              type="submit"
              disabled={gradeMutation.isPending}
              className="btn-primary"
            >
              {gradeMutation.isPending ? 'Đang lưu...' : grade ? 'Cập nhật điểm' : 'Chấm điểm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

