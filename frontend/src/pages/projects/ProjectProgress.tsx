import React from 'react';
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../hooks/useAuth';
import Navbar from '../../components/layout/Navbar';
import api from '../../lib/axios';
import { 
  ArrowLeft, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Users,
  FileText,
  CheckSquare
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  lecturer: {
    id: string;
    fullName: string;
    email: string;
  };
  students: Array<{
    student: {
      id: string;
      fullName: string;
      email: string;
    };
    role: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    dueDate: string;
    assignee: {
      id: string;
      fullName: string;
    };
  }>;
  documents: Array<{
    id: string;
    fileName: string;
    fileSize: number;
    createdAt: string;
  }>;
}

interface ProgressData {
  date: string;
  progress: number;
  tasksCompleted: number;
  tasksTotal: number;
}

export default function ProjectProgress() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('month');

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Fetch project data
  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.project;
    },
    enabled: !!id,
  });

  // Mock progress data (in real app, this would come from backend)
  const generateProgressData = (project: Project): ProgressData[] => {
    const data: ProgressData[] = [];
    const startDate = new Date(project.startDate);
    const endDate = project.endDate ? new Date(project.endDate) : new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    for (let i = 0; i <= totalDays; i += Math.max(1, Math.floor(totalDays / 20))) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate progress growth
      const progressRatio = Math.min(1, i / totalDays);
      const progress = Math.floor(progressRatio * project.progress);
      const tasksTotal = project.tasks.length;
      const tasksCompleted = Math.floor(progressRatio * tasksTotal * 0.8); // 80% of tasks completed at 100% progress
      
      data.push({
        date: date.toISOString().split('T')[0],
        progress,
        tasksCompleted,
        tasksTotal
      });
    }
    
    return data;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'IN_PROGRESS':
        return 'text-blue-600 bg-blue-100';
      case 'UNDER_REVIEW':
        return 'text-yellow-600 bg-yellow-100';
      case 'NOT_STARTED':
        return 'text-gray-600 bg-gray-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'text-red-600';
      case 'HIGH':
        return 'text-orange-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      case 'LOW':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDaysRemaining = (endDate: string) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getTaskStatusStats = (tasks: any[]) => {
    const stats = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      review: 0,
      completed: 0,
      overdue: 0
    };
    
    tasks.forEach(task => {
      switch (task.status) {
        case 'TODO':
          stats.todo++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'REVIEW':
          stats.review++;
          break;
        case 'COMPLETED':
          stats.completed++;
          break;
      }

      // Check if overdue
      if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED') {
        stats.overdue++;
      }
    });
    
    return stats;
  };

  const getDocumentStats = (documents: any[]) => {
    const stats = {
      total: documents.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalSize: 0
    };

    documents.forEach(doc => {
      switch (doc.status) {
        case 'PENDING':
          stats.pending++;
          break;
        case 'APPROVED':
          stats.approved++;
          break;
        case 'REJECTED':
          stats.rejected++;
          break;
      }
      stats.totalSize += doc.fileSize;
    });

    return stats;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project progress...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} />
        <div className="container py-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Project not found</h3>
            <p className="text-gray-600 mb-6">The project you're looking for doesn't exist or you don't have access to it.</p>
            <button
              onClick={() => navigate('/projects')}
              className="btn-primary"
            >
              Back to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progressData = generateProgressData(project);
  const taskStats = getTaskStatusStats(project.tasks);
  const documentStats = getDocumentStats(project.documents);
  const daysRemaining = project.endDate ? calculateDaysRemaining(project.endDate) : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} />
      
      <div className="w-full px-6 py-8">
        {/* Header */}
        <div className="page-header">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="page-title">Project Progress</h1>
              <p className="page-subtitle">
                {project.title} - Track progress and performance
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate(`/projects/${id}`)}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Project
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="xl:col-span-3 space-y-6">
            {/* Progress Overview */}
            <div className="card">
              <div className="card-body">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Progress Overview</h2>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setTimeRange('week')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timeRange === 'week' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setTimeRange('month')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timeRange === 'month' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setTimeRange('quarter')}
                      className={`px-3 py-1 text-sm rounded-md ${
                        timeRange === 'quarter' ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Quarter
                    </button>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span className="font-medium">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-primary-600 h-4 rounded-full transition-all duration-500"
                      style={{ width: `${project.progress}%` }}
                    ></div>
                  </div>
                </div>

                {/* Progress Chart */}
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={progressData}>
                      <defs>
                        <linearGradient id="colorProgress" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'white', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="progress"
                        stroke="#3b82f6"
                        fillOpacity={1}
                        fill="url(#colorProgress)"
                        strokeWidth={3}
                        name="Progress %"
                      />
                      <Area
                        type="monotone"
                        dataKey="tasksCompleted"
                        stroke="#10b981"
                        fillOpacity={1}
                        fill="url(#colorTasks)"
                        strokeWidth={3}
                        name="Tasks Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Task Progress */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Task Progress</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Task Statistics */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Task Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={[
                              { name: 'Completed', value: taskStats.completed, color: '#10b981' },
                              { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' },
                              { name: 'Review', value: taskStats.review, color: '#f59e0b' },
                              { name: 'To Do', value: taskStats.todo, color: '#6b7280' },
                              { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => {
                              // Only show label if percentage is > 5% to avoid overlap
                              if ((percent as number) < 0.05) return '';
                              return `${name} ${((percent as number) * 100).toFixed(0)}%`;
                            }}
                            outerRadius={80}
                            innerRadius={20}
                            dataKey="value"
                          >
                            {[
                              { name: 'Completed', value: taskStats.completed, color: '#10b981' },
                              { name: 'In Progress', value: taskStats.inProgress, color: '#3b82f6' },
                              { name: 'Review', value: taskStats.review, color: '#f59e0b' },
                              { name: 'To Do', value: taskStats.todo, color: '#6b7280' },
                              { name: 'Overdue', value: taskStats.overdue, color: '#ef4444' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: any) => [`${value} tasks`, name]}
                            labelStyle={{ color: '#374151' }}
                            contentStyle={{ 
                              backgroundColor: '#f9fafb', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px'
                            }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            formatter={(value: any) => {
                              const data = [
                                { name: 'Completed', value: taskStats.completed },
                                { name: 'In Progress', value: taskStats.inProgress },
                                { name: 'Review', value: taskStats.review },
                                { name: 'To Do', value: taskStats.todo },
                                { name: 'Overdue', value: taskStats.overdue }
                              ].find(item => item.name === value);
                              const total = taskStats.total;
                              const percentage = total > 0 ? ((data?.value || 0) / total * 100).toFixed(0) : '0';
                              return `${value} (${percentage}%)`;
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Task Statistics Cards */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Quick Stats</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{taskStats.total}</div>
                        <div className="text-sm text-gray-500">Total Tasks</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
                        <div className="text-sm text-green-500">Completed</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</div>
                        <div className="text-sm text-blue-500">In Progress</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
                        <div className="text-sm text-red-500">Overdue</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Tasks */}
                <div className="space-y-3">
                  <h3 className="text-md font-medium text-gray-900">Recent Tasks</h3>
                  {project.tasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <span>Assigned to {task.assignee.fullName}</span>
                          <span>•</span>
                          <span className={getPriorityColor(task.priority)}>{task.priority}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
                          {task.status.replace('_', ' ')}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-gray-500">
                            Due {formatDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Document Analytics */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Document Analytics</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Document Status Chart */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Document Status</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: 'Pending', value: documentStats.pending, color: '#f59e0b' },
                          { name: 'Approved', value: documentStats.approved, color: '#10b981' },
                          { name: 'Rejected', value: documentStats.rejected, color: '#ef4444' }
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Document Statistics */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Quick Stats</h3>
                    <div className="space-y-4">
                      <div className="text-center p-4 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-gray-600">{documentStats.total}</div>
                        <div className="text-sm text-gray-500">Total Documents</div>
                      </div>
                      <div className="text-center p-4 bg-yellow-50 rounded-lg">
                        <div className="text-2xl font-bold text-yellow-600">{documentStats.pending}</div>
                        <div className="text-sm text-yellow-500">Pending</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">{documentStats.approved}</div>
                        <div className="text-sm text-green-500">Approved</div>
                      </div>
                      <div className="text-center p-4 bg-red-50 rounded-lg">
                        <div className="text-2xl font-bold text-red-600">{documentStats.rejected}</div>
                        <div className="text-sm text-red-500">Rejected</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">{formatFileSize(documentStats.totalSize)}</div>
                        <div className="text-sm text-blue-500">Total Storage Used</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Documents */}
                <div className="space-y-3">
                  <h3 className="text-md font-medium text-gray-900">Recent Documents</h3>
                  {project.documents.slice(0, 5).map((doc: any) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{doc.fileName}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(doc.status)}`}>
                        {doc.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Team Performance */}
            <div className="card">
              <div className="card-body">
                <h2 className="text-lg font-medium text-gray-900 mb-6">Team Performance</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Team Activity Chart */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Activity Overview</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis 
                            dataKey="date" 
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'white', 
                              border: '1px solid #e5e7eb',
                              borderRadius: '8px',
                              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="progress"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                            name="Progress %"
                          />
                          <Line
                            type="monotone"
                            dataKey="tasksCompleted"
                            stroke="#10b981"
                            strokeWidth={3}
                            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                            name="Tasks Completed"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Team Stats */}
                  <div>
                    <h3 className="text-md font-medium text-gray-900 mb-4">Team Statistics</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <Users className="w-5 h-5 text-gray-400 mr-3" />
                          <span className="text-sm text-gray-600">Team Size</span>
                        </div>
                        <span className="font-medium text-gray-900">{project.students.length + 1}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center">
                          <Target className="w-5 h-5 text-blue-400 mr-3" />
                          <span className="text-sm text-gray-600">Completion Rate</span>
                        </div>
                        <span className="font-medium text-blue-900">{project.progress}%</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center">
                          <CheckSquare className="w-5 h-5 text-green-400 mr-3" />
                          <span className="text-sm text-gray-600">Tasks Completed</span>
                        </div>
                        <span className="font-medium text-green-900">{taskStats.completed}/{taskStats.total}</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-5 h-5 text-purple-400 mr-3" />
                          <span className="text-sm text-gray-600">Documents Uploaded</span>
                        </div>
                        <span className="font-medium text-purple-900">{documentStats.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Project Info */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Project Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Start Date:</span>
                    <p className="font-medium text-gray-900">{formatDate(project.startDate)}</p>
                  </div>
                  {project.endDate && (
                    <div>
                      <span className="text-gray-500">End Date:</span>
                      <p className="font-medium text-gray-900">{formatDate(project.endDate)}</p>
                      {daysRemaining !== null && (
                        <p className={`text-xs ${daysRemaining < 0 ? 'text-red-600' : daysRemaining < 7 ? 'text-yellow-600' : 'text-gray-500'}`}>
                          {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
                        </p>
                      )}
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500">Team Members:</span>
                    <p className="font-medium text-gray-900">{project.students.length + 1} people</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Progress Overview */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Progress Overview</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" data={[{ name: 'Progress', value: project.progress, fill: '#3b82f6' }]}>
                      <RadialBar dataKey="value" cornerRadius={10} fill="#3b82f6" />
                      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="text-2xl font-bold fill-gray-900">
                        {project.progress}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">Overall Progress</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckSquare className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Total Tasks</span>
                    </div>
                    <span className="font-medium text-gray-900">{project.tasks.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FileText className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Documents</span>
                    </div>
                    <span className="font-medium text-gray-900">{project.documents.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Users className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Team Size</span>
                    </div>
                    <span className="font-medium text-gray-900">{project.students.length + 1}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Target className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm text-gray-600">Completion</span>
                    </div>
                    <span className="font-medium text-gray-900">{project.progress}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="card">
              <div className="card-body">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Team Members</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{project.lecturer.fullName}</p>
                      <p className="text-xs text-gray-500">Lecturer</p>
                    </div>
                  </div>
                  {project.students.map((ps: any) => (
                    <div key={ps.student.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ps.student.fullName}</p>
                        <p className="text-xs text-gray-500">
                          Student {ps.role === 'LEAD' && '(Lead)'}
                        </p>
                      </div>
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
