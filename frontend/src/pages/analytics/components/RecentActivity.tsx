import { translateStatus } from '../utils';
import type { AnalyticsData } from '../types';

interface RecentActivityProps {
  analytics: AnalyticsData;
}

export default function RecentActivity({ analytics }: RecentActivityProps) {
  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Hoạt động Gần đây</h3>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Recent Projects */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Dự án Gần đây</h4>
            <div className="space-y-2">
              {analytics.activity.recentProjects.slice(0, 3).map((project) => (
                <div key={project.id} className="text-sm">
                  <p className="font-medium">{project.title}</p>
                  <p className="text-gray-600">{translateStatus(project.status)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Tasks */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Nhiệm vụ Gần đây</h4>
            <div className="space-y-2">
              {analytics.activity.recentTasks.slice(0, 3).map((task) => (
                <div key={task.id} className="text-sm">
                  <p className="font-medium">{task.title}</p>
                  <p className="text-gray-600">{translateStatus(task.status)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Tài liệu Gần đây</h4>
            <div className="space-y-2">
              {analytics.activity.recentDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="text-sm">
                  <p className="font-medium">{doc.fileName}</p>
                  <p className="text-gray-600">{translateStatus(doc.status)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

