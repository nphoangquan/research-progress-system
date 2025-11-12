import { formatLocaleDate } from '../utils';
import type { AnalyticsData } from '../types';

interface TrendsChartsProps {
  analytics: AnalyticsData;
}

export default function TrendsCharts({ analytics }: TrendsChartsProps) {
  if (!analytics?.trends) return null;

  return (
    <div className="card mb-8">
      <div className="card-header">
        <h3 className="card-title">Xu hướng Hoạt động</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Projects Created Trend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Dự án Đã Tạo</h4>
            <div className="space-y-2">
              {analytics.trends.projectsCreated.slice(-5).map((trend, index) => {
                const maxCount = Math.max(1, ...analytics.trends.projectsCreated.map(t => Math.max(0, t.count)));
                const percentage = Math.min(100, Math.max(0, trend.count) / maxCount * 100);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatLocaleDate(trend.date)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                    </div>

                    </div>
    );
})}
            </div>
          </div>

          {/* Tasks Completed Trend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Nhiệm vụ Đã Hoàn thành</h4>
            <div className="space-y-2">
              {analytics.trends.tasksCompleted.slice(-5).map((trend, index) => {
                const maxCount = Math.max(1, ...analytics.trends.tasksCompleted.map(t => Math.max(0, t.count)));
                const percentage = Math.min(100, Math.max(0, trend.count) / maxCount * 100);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatLocaleDate(trend.date)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                    </div>

                    </div>
    );
})}
            </div>
          </div>

          {/* Documents Uploaded Trend */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Tài liệu Đã Tải lên</h4>
            <div className="space-y-2">
              {analytics.trends.documentsUploaded.slice(-5).map((trend, index) => {
                const maxCount = Math.max(1, ...analytics.trends.documentsUploaded.map(t => Math.max(0, t.count)));
                const percentage = Math.min(100, Math.max(0, trend.count) / maxCount * 100);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{formatLocaleDate(trend.date)}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                    </div>

                    </div>
    );
})}
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

