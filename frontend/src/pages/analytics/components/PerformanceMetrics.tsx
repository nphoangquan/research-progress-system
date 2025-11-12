import { CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { getPerformanceColor, getPerformanceIcon, periodLabels } from '../utils';
import type { AnalyticsData } from '../types';

interface PerformanceMetricsProps {
  analytics: AnalyticsData;
}

export default function PerformanceMetrics({ analytics }: PerformanceMetricsProps) {
  if (!analytics?.performance) return null;

  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="card-title">Chỉ số Hiệu suất</h3>
        <div className="text-sm text-gray-500">
          Tổng quan {periodLabels[analytics.timeRange.period as keyof typeof periodLabels] || analytics.timeRange.period}
        </div>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Completion Rate */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Tỷ lệ Hoàn thành Nhiệm vụ</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.performance.completionRate, 'rate')}`}>
                  {analytics.performance.completionRate}%
                </p>
              </div>
              {getPerformanceIcon(analytics.performance.completionRate, 'rate')}
            </div>
          </div>

          {/* Average Project Progress */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Tiến độ Dự án Trung bình</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.performance.averageProjectProgress, 'rate')}`}>
                  {analytics.performance.averageProjectProgress}%
                </p>
              </div>
              {getPerformanceIcon(analytics.performance.averageProjectProgress, 'rate')}
            </div>
          </div>

          {/* Tasks Completed This Period */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Nhiệm vụ Đã Hoàn thành</p>
                <p className="text-2xl font-bold text-purple-600">
                  {analytics.performance.tasksCompletedThisPeriod}
                </p>
              </div>
              <CheckCircle className="w-5 h-5 text-gray-900" />
            </div>
          </div>

          {/* Documents Uploaded */}
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Tài liệu Đã Tải lên</p>
                <p className="text-2xl font-bold text-orange-600">
                  {analytics.performance.documentsUploadedThisPeriod}
                </p>
              </div>
              <FileText className="w-5 h-5 text-gray-900" />
            </div>
          </div>

          {/* Overdue Task Rate */}
          <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Tỷ lệ Nhiệm vụ Quá hạn</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(100 - analytics.performance.overdueTaskRate, 'rate')}`}>
                  {analytics.performance.overdueTaskRate}%
                </p>
              </div>
              {analytics.performance.overdueTaskRate > 20 ? 
                <AlertCircle className="w-5 h-5 text-gray-900" /> : 
                <CheckCircle className="w-5 h-5 text-gray-900" />
              }
            </div>
          </div>

          {/* Active Project Rate */}
          <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600">Tỷ lệ Dự án Hoạt động</p>
                <p className={`text-2xl font-bold ${getPerformanceColor(analytics.performance.activeProjectRate, 'rate')}`}>
                  {analytics.performance.activeProjectRate}%
                </p>
              </div>
              {getPerformanceIcon(analytics.performance.activeProjectRate, 'rate')}
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

