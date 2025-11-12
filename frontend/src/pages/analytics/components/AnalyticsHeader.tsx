import { TimeRange } from '../types';

interface AnalyticsHeaderProps {
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

export default function AnalyticsHeader({ timeRange, onTimeRangeChange }: AnalyticsHeaderProps) {
  return (
    <div className="page-header">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="page-title">Bảng Phân tích</h1>
          <p className="page-subtitle">
            Thông tin chi tiết về hệ thống tiến độ nghiên cứu của bạn.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select
              value={timeRange}
              onChange={(e) => onTimeRangeChange(e.target.value as TimeRange)}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors cursor-pointer"
            >
              <option value="week">Tuần trước</option>
              <option value="month">Tháng trước</option>
              <option value="quarter">Quý trước</option>
              <option value="year">Năm trước</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      </div>
    );
}

