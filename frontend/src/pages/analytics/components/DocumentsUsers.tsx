import { formatFileSize, translateDocumentType, translateRole } from '../utils';
import type { AnalyticsData } from '../types';

interface DocumentsUsersProps {
  analytics: AnalyticsData;
}

export default function DocumentsUsers({ analytics }: DocumentsUsersProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Documents by Type */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Tài liệu theo Loại</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {analytics.documents.byType.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <span className="text-sm font-medium">{translateDocumentType(item.type)}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Tổng Kích thước</span>
                <span className="font-semibold">{formatFileSize(analytics.documents.totalSize)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users by Role */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Người dùng theo Vai trò</h3>
        </div>
        <div className="card-body">
          <div className="space-y-3">
            {analytics.users.byRole.map((item) => (
              <div key={item.role} className="flex items-center justify-between">
                <span className="text-sm font-medium">{translateRole(item.role)}</span>
                <span className="font-semibold">{item.count}</span>
              </div>
            ))}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Người dùng Hoạt động</span>
                <span className="font-semibold">{analytics.users.active}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

