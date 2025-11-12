import { BarChart3 } from 'lucide-react';

export default function EmptyState() {
  return (
    <div className="w-full">
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Không có dữ liệu phân tích</h3>
        <p className="text-gray-600">Dữ liệu phân tích hiện không khả dụng.</p>
      </div>

      </div>
    );
}

