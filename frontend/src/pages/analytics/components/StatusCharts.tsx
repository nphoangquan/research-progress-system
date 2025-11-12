import { getStatusColor, translateStatus } from '../utils';
import type { AnalyticsData } from '../types';

interface StatusChartsProps {
  analytics: AnalyticsData;
}

export default function StatusCharts({ analytics }: StatusChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Projects by Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Dự án theo Trạng thái</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {analytics.projects.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {translateStatus(item.status)}
                  </span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tasks by Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Nhiệm vụ theo Trạng thái</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {analytics.tasks.byStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {translateStatus(item.status)}
                  </span>
                </div>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      </div>
    );
}

