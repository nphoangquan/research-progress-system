import { FolderOpen, CheckSquare, FileText, Users } from 'lucide-react';
import type { AnalyticsData } from '../types';

interface OverviewCardsProps {
  analytics: AnalyticsData;
}

export default function OverviewCards({ analytics }: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Projects Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Dự án</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.projects.total}</p>
            </div>
            <FolderOpen className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Tasks Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Nhiệm vụ</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.tasks.total}</p>
            </div>
            <CheckSquare className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Documents Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Tài liệu</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.documents.total}</p>
            </div>
            <FileText className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      {/* Users Card */}
      <div className="card">
        <div className="card-body">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Tổng Người dùng</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.users.total}</p>
            </div>
            <Users className="w-6 h-6 text-gray-900" />
          </div>
        </div>
      </div>

      </div>
    );
}

