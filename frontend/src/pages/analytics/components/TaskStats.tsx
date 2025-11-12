import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { getPriorityColor, translatePriority } from '../utils';
import type { AnalyticsData } from '../types';

interface TaskStatsProps {
  analytics: AnalyticsData;
}

export default function TaskStats({ analytics }: TaskStatsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Tasks by Priority */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Nhiệm vụ theo Mức độ Ưu tiên</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {analytics.tasks.byPriority.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                    {translatePriority(item.priority)}
                  </span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Task Statistics */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Thống kê Nhiệm vụ</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-gray-900" />
                <span className="text-sm font-medium">Nhiệm vụ Hoàn thành</span>
              </div>
              <span className="font-semibold">{analytics.tasks.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-gray-900" />
                <span className="text-sm font-medium">Nhiệm vụ Quá hạn</span>
              </div>
              <span className="font-semibold">{analytics.tasks.overdue}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-900" />
                <span className="text-sm font-medium">Tỷ lệ Hoàn thành</span>
              </div>
              <span className="font-semibold">
                {analytics.tasks.total > 0 ? Math.round((analytics.tasks.completed / analytics.tasks.total) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

