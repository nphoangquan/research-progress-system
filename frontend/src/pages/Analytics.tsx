import React from 'react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/layout/Navbar';
import api from '../lib/axios';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText, 
  CheckSquare,
  Clock,
  AlertCircle,
  CheckCircle,
  FolderOpen
} from 'lucide-react';

interface AnalyticsData {
  projects: {
    total: number;
    byStatus: { status: string; count: number }[];
    byProgress: { range: string; count: number }[];
    byLecturer: { lecturer: string; count: number }[];
  };
  tasks: {
    total: number;
    byStatus: { status: string; count: number }[];
    byPriority: { priority: string; count: number }[];
    overdue: number;
    completed: number;
  };
  documents: {
    total: number;
    byStatus: { status: string; count: number }[];
    byType: { type: string; count: number }[];
    totalSize: number;
  };
  users: {
    total: number;
    byRole: { role: string; count: number }[];
    active: number;
  };
  activity: {
    recentProjects: any[];
    recentTasks: any[];
    recentDocuments: any[];
  };
  // Enhanced Analytics
  performance: {
    completionRate: number;
    averageProjectProgress: number;
    tasksCompletedThisPeriod: number;
    documentsUploadedThisPeriod: number;
    overdueTaskRate: number;
    activeProjectRate: number;
  };
  trends: {
    projectsCreated: { date: string; count: number }[];
    tasksCompleted: { date: string; count: number }[];
    documentsUploaded: { date: string; count: number }[];
  };
  timeRange: {
    start: string;
    end: string;
    period: string;
  };
}

export default function Analytics() {
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

  // Fetch analytics data
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics', timeRange],
    queryFn: async () => {
      const response = await api.get(`/analytics?timeRange=${timeRange}`);
      return response.data as AnalyticsData;
    },
  });

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'NOT_STARTED': 'bg-gray-100 text-gray-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'UNDER_REVIEW': 'bg-yellow-100 text-yellow-800',
      'COMPLETED': 'bg-green-100 text-green-800',
      'CANCELLED': 'bg-red-100 text-red-800',
      'TODO': 'bg-gray-100 text-gray-800',
      'REVIEW': 'bg-yellow-100 text-yellow-800',
      'PENDING': 'bg-gray-100 text-gray-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800',
      'PROCESSING': 'bg-blue-100 text-blue-800',
      'INDEXED': 'bg-green-100 text-green-800',
      'FAILED': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: { [key: string]: string } = {
      'LOW': 'bg-green-100 text-green-800',
      'MEDIUM': 'bg-yellow-100 text-yellow-800',
      'HIGH': 'bg-orange-100 text-orange-800',
      'URGENT': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPerformanceColor = (value: number, type: 'rate' | 'count') => {
    if (type === 'rate') {
      if (value >= 80) return 'text-green-600';
      if (value >= 60) return 'text-yellow-600';
      return 'text-red-600';
    }
    return 'text-blue-600';
  };

  const getPerformanceIcon = (value: number, type: 'rate' | 'count') => {
    if (type === 'rate') {
      if (value >= 80) return <CheckCircle className="w-5 h-5 text-gray-900" />;
      if (value >= 60) return <AlertCircle className="w-5 h-5 text-gray-900" />;
      return <AlertCircle className="w-5 h-5 text-gray-900" />;
    }
    return <TrendingUp className="w-5 h-5 text-gray-900" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="w-full px-6 py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data</h3>
            <p className="text-gray-600">Analytics data is not available at the moment.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="w-full px-6 py-8">
        {/* Page Header */}
        <div className="page-header">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="page-title">Analytics Dashboard</h1>
              <p className="page-subtitle">
                Comprehensive insights into your research progress system.
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

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Projects Card */}
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Projects</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Documents</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.users.total}</p>
                </div>
                <Users className="w-6 h-6 text-gray-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Projects by Status */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Projects by Status</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analytics.projects.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
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
              <h3 className="card-title">Tasks by Status</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analytics.tasks.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Priority & Overdue */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Tasks by Priority */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Tasks by Priority</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analytics.tasks.byPriority.map((item) => (
                  <div key={item.priority} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                        {item.priority}
                      </span>
                    </div>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Task Statistics */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Task Statistics</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gray-900" />
                    <span className="text-sm font-medium">Completed Tasks</span>
                  </div>
                  <span className="font-semibold">{analytics.tasks.completed}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-gray-900" />
                    <span className="text-sm font-medium">Overdue Tasks</span>
                  </div>
                  <span className="font-semibold">{analytics.tasks.overdue}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-gray-900" />
                    <span className="text-sm font-medium">Completion Rate</span>
                  </div>
                  <span className="font-semibold">
                    {analytics.tasks.total > 0 ? Math.round((analytics.tasks.completed / analytics.tasks.total) * 100) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents & Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Documents by Type */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Documents by Type</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analytics.documents.byType.map((item) => (
                  <div key={item.type} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.type.toUpperCase()}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Total Size</span>
                    <span className="font-semibold">{formatFileSize(analytics.documents.totalSize)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Users by Role */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Users by Role</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                {analytics.users.byRole.map((item) => (
                  <div key={item.role} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.role}</span>
                    <span className="font-semibold">{item.count}</span>
                  </div>
                ))}
                <div className="pt-3 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-600">Active Users</span>
                    <span className="font-semibold">{analytics.users.active}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        {analytics?.performance && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Performance Metrics</h3>
              <div className="text-sm text-gray-500">
                {analytics.timeRange.period.charAt(0).toUpperCase() + analytics.timeRange.period.slice(1)} Overview
              </div>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Completion Rate */}
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">Task Completion Rate</p>
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
                      <p className="text-sm font-medium text-blue-600">Avg Project Progress</p>
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
                      <p className="text-sm font-medium text-purple-600">Tasks Completed</p>
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
                      <p className="text-sm font-medium text-orange-600">Documents Uploaded</p>
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
                      <p className="text-sm font-medium text-red-600">Overdue Task Rate</p>
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
                      <p className="text-sm font-medium text-indigo-600">Active Project Rate</p>
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
        )}

        {/* Trends Charts */}
        {analytics?.trends && (
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Activity Trends</h3>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Projects Created Trend */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Projects Created</h4>
                  <div className="space-y-2">
                    {analytics.trends.projectsCreated.slice(-5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(trend.count / Math.max(...analytics.trends.projectsCreated.map(t => t.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tasks Completed Trend */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tasks Completed</h4>
                  <div className="space-y-2">
                    {analytics.trends.tasksCompleted.slice(-5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${(trend.count / Math.max(...analytics.trends.tasksCompleted.map(t => t.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Documents Uploaded Trend */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Documents Uploaded</h4>
                  <div className="space-y-2">
                    {analytics.trends.documentsUploaded.slice(-5).map((trend, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{trend.date}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-500 h-2 rounded-full" 
                              style={{ width: `${(trend.count / Math.max(...analytics.trends.documentsUploaded.map(t => t.count))) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{trend.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Activity</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Recent Projects */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Projects</h4>
                <div className="space-y-2">
                  {analytics.activity.recentProjects.slice(0, 3).map((project) => (
                    <div key={project.id} className="text-sm">
                      <p className="font-medium">{project.title}</p>
                      <p className="text-gray-600">{project.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tasks */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Tasks</h4>
                <div className="space-y-2">
                  {analytics.activity.recentTasks.slice(0, 3).map((task) => (
                    <div key={task.id} className="text-sm">
                      <p className="font-medium">{task.title}</p>
                      <p className="text-gray-600">{task.status}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Documents */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recent Documents</h4>
                <div className="space-y-2">
                  {analytics.activity.recentDocuments.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="text-sm">
                      <p className="font-medium">{doc.fileName}</p>
                      <p className="text-gray-600">{doc.status}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
