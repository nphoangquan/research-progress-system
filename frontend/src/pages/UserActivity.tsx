import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import api from '../lib/axios';
import { 
  Activity, 
  CheckSquare, 
  FileText, 
  MessageSquare,
  TrendingUp,
  Calendar
} from 'lucide-react';

interface ActivityItem {
  id: string;
  type: 'task_created' | 'task_completed' | 'document_uploaded' | 'comment_added' | 'project_created' | 'project_updated';
  description: string;
  userId: string;
  userName: string;
  projectId?: string;
  projectName?: string;
  createdAt: string;
  metadata?: any;
}

interface UserActivityData {
  recentActivities: ActivityItem[];
  userStats: {
    totalTasks: number;
    completedTasks: number;
    uploadedDocuments: number;
    commentsAdded: number;
    projectsInvolved: number;
  };
  activityByDay: { date: string; count: number }[];
  topActiveUsers: { userId: string; userName: string; activityCount: number }[];
}

export default function UserActivity() {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Fetch user activity data
  const { data: activityData, isLoading } = useQuery({
    queryKey: ['user-activity', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics/user-activity?timeRange=${timeRange}`);
      return response.data as UserActivityData;
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_created':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'task_completed':
        return <CheckSquare className="w-4 h-4 text-green-600" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-purple-600" />;
      case 'comment_added':
        return <MessageSquare className="w-4 h-4 text-orange-600" />;
      case 'project_created':
        return <TrendingUp className="w-4 h-4 text-indigo-600" />;
      case 'project_updated':
        return <TrendingUp className="w-4 h-4 text-yellow-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'task_created':
        return 'bg-blue-50 border-blue-200';
      case 'task_completed':
        return 'bg-green-50 border-green-200';
      case 'document_uploaded':
        return 'bg-purple-50 border-purple-200';
      case 'comment_added':
        return 'bg-orange-50 border-orange-200';
      case 'project_created':
        return 'bg-indigo-50 border-indigo-200';
      case 'project_updated':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading user activity...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No activity data</h3>
            <p className="text-gray-600">User activity data is not available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="container py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">User Activity</h1>
              <p className="page-subtitle">
                Track user engagement and activity across the platform.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value as any)}
                  className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors cursor-pointer"
                >
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="quarter">Last Quarter</option>
                  <option value="year">Last Year</option>
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

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{activityData.userStats.totalTasks}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <CheckSquare className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">{activityData.userStats.completedTasks}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckSquare className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Documents Uploaded</p>
                  <p className="text-2xl font-bold text-gray-900">{activityData.userStats.uploadedDocuments}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Comments Added</p>
                  <p className="text-2xl font-bold text-gray-900">{activityData.userStats.commentsAdded}</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Projects Involved</p>
                  <p className="text-2xl font-bold text-gray-900">{activityData.userStats.projectsInvolved}</p>
                </div>
                <div className="p-3 bg-indigo-100 rounded-full">
                  <TrendingUp className="w-6 h-6 text-indigo-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Feed and Top Users */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Activity Feed */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity Feed</h3>
              </div>
              <div className="card-body">
                <div className="space-y-4">
                  {activityData.recentActivities.map((activity) => (
                    <div key={activity.id} className={`p-4 rounded-lg border ${getActivityColor(activity.type)}`}>
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.userName}
                          </p>
                          <p className="text-sm text-gray-600">
                            {activity.description}
                          </p>
                          {activity.projectName && (
                            <p className="text-xs text-gray-500 mt-1">
                              in {activity.projectName}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <p className="text-xs text-gray-500">
                            {formatTimeAgo(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Top Active Users */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Most Active Users</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {activityData.topActiveUsers.map((user, index) => (
                  <div key={user.userId} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {index + 1}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.userName}</p>
                        <p className="text-xs text-gray-500">{user.activityCount} activities</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Activity Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Activity Over Time</h3>
          </div>
          <div className="card-body">
            {activityData.activityByDay && activityData.activityByDay.length > 0 ? (
              <div className="space-y-4">
                {activityData.activityByDay.slice(0, 7).map((day, index) => (
                  <div key={day.date} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {new Date(day.date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">{day.count} activities</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((day.count / Math.max(...activityData.activityByDay.map(d => d.count))) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{day.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No activity data available</p>
                  <p className="text-sm text-gray-500">Activity will appear here as you use the system</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
