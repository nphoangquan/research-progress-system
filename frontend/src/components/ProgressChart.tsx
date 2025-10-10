import { useMemo } from 'react';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface ProgressData {
  date: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
}

interface ProgressChartProps {
  data: ProgressData[];
  height?: number;
  showTasks?: boolean;
}

export default function ProgressChart({ data, height = 200, showTasks = true }: ProgressChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxProgress = Math.max(...data.map(d => d.progress));
    const maxTasks = Math.max(...data.map(d => d.tasksTotal));
    
    return {
      maxProgress,
      maxTasks,
      points: data.map((item, index) => ({
        x: (index / (data.length - 1)) * 100,
        progress: (item.progress / maxProgress) * 100,
        tasks: (item.tasksCompleted / maxTasks) * 100,
        date: item.date,
        progressValue: item.progress,
        tasksValue: item.tasksCompleted,
        tasksTotal: item.tasksTotal
      }))
    };
  }, [data]);

  if (!chartData) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2" />
          <p>No progress data available</p>
        </div>
      </div>
    );
  }

  const createPath = (points: any[], key: 'progress' | 'tasks') => {
    if (points.length === 0) return '';
    
    let path = `M ${points[0].x} ${100 - points[0][key]}`;
    
    for (let i = 1; i < points.length; i++) {
      const point = points[i];
      path += ` L ${point.x} ${100 - point[key]}`;
    }
    
    return path;
  };

  const progressPath = createPath(chartData.points, 'progress');
  const tasksPath = createPath(chartData.points, 'tasks');

  return (
    <div className="bg-white rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Progress Tracking</h3>
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-primary-600 rounded-full mr-2"></div>
            <span className="text-gray-600">Progress</span>
          </div>
          {showTasks && (
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-gray-600">Tasks Completed</span>
            </div>
          )}
        </div>
      </div>

      <div className="relative" style={{ height: `${height}px` }}>
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          className="absolute inset-0"
          preserveAspectRatio="none"
        >
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          
          {/* Y-axis labels */}
          <text x="2" y="5" fontSize="2" fill="#6b7280" textAnchor="start">
            {chartData.maxProgress}%
          </text>
          <text x="2" y="50" fontSize="2" fill="#6b7280" textAnchor="start">
            {Math.round(chartData.maxProgress / 2)}%
          </text>
          <text x="2" y="95" fontSize="2" fill="#6b7280" textAnchor="start">
            0%
          </text>
          
          {/* Progress line */}
          <path
            d={progressPath}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="0.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Tasks line */}
          {showTasks && (
            <path
              d={tasksPath}
              fill="none"
              stroke="#10b981"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1,1"
            />
          )}
          
          {/* Data points */}
          {chartData.points.map((point, index) => (
            <g key={index}>
              <circle
                cx={point.x}
                cy={100 - point.progress}
                r="1"
                fill="#3b82f6"
                stroke="#fff"
                strokeWidth="0.5"
              />
              {showTasks && (
                <circle
                  cx={point.x}
                  cy={100 - point.tasks}
                  r="1"
                  fill="#10b981"
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              )}
            </g>
          ))}
        </svg>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{new Date(data[0]?.date).toLocaleDateString()}</span>
        <span>{new Date(data[Math.floor(data.length / 2)]?.date).toLocaleDateString()}</span>
        <span>{new Date(data[data.length - 1]?.date).toLocaleDateString()}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-200">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary-600">
            {data[data.length - 1]?.progress || 0}%
          </div>
          <div className="text-sm text-gray-500">Current Progress</div>
        </div>
        {showTasks && (
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {data[data.length - 1]?.tasksCompleted || 0}
            </div>
            <div className="text-sm text-gray-500">Tasks Completed</div>
          </div>
        )}
      </div>
    </div>
  );
}
