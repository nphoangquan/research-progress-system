import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import api from "../lib/axios";
import {
  Activity,
  CheckSquare,
  FileText,
  MessageSquare,
  TrendingUp,
  Calendar,
} from "lucide-react";

interface ActivityItem {
  id: string;
  type:
    | "task_created"
    | "task_completed"
    | "document_uploaded"
    | "comment_added"
    | "project_created"
    | "project_updated";
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

  // Must call hooks before any conditional returns
  const [timeRange, setTimeRange] = useState<
    "week" | "month" | "quarter" | "year"
  >("month");

  // Fetch user activity data
  const {
    data: activityData,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["user-activity", timeRange],
    queryFn: async () => {
      const response = await api.get(
        `/analytics/user-activity?timeRange=${timeRange}`
      );
      return response.data as UserActivityData;
    },
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_created":
        return <CheckSquare className="w-4 h-4 text-gray-900" />;
      case "task_completed":
        return <CheckSquare className="w-4 h-4 text-gray-900" />;
      case "document_uploaded":
        return <FileText className="w-4 h-4 text-gray-900" />;
      case "comment_added":
        return <MessageSquare className="w-4 h-4 text-gray-900" />;
      case "project_created":
        return <TrendingUp className="w-4 h-4 text-gray-900" />;
      case "project_updated":
        return <TrendingUp className="w-4 h-4 text-gray-900" />;
      default:
        return <Activity className="w-4 h-4 text-gray-900" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "task_created":
        return "bg-blue-50 border-blue-200";
      case "task_completed":
        return "bg-green-50 border-green-200";
      case "document_uploaded":
        return "bg-purple-50 border-purple-200";
      case "comment_added":
        return "bg-orange-50 border-orange-200";
      case "project_created":
        return "bg-indigo-50 border-indigo-200";
      case "project_updated":
        return "bg-yellow-50 border-yellow-200";
      default:
        return "bg-gray-50 border-gray-200";
    }
  };

  const formatDuration = (value: number, unit: string) =>
    `${value} ${unit}${value > 1 ? "" : ""}`;

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600)
      return `${formatDuration(Math.floor(diffInSeconds / 60), "phút")} trước`;
    if (diffInSeconds < 86400)
      return `${formatDuration(Math.floor(diffInSeconds / 3600), "giờ")} trước`;
    if (diffInSeconds < 2592000)
      return `${formatDuration(
        Math.floor(diffInSeconds / 86400),
        "ngày"
      )} trước`;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const periodLabels = useMemo(
    () => ({
      week: "Tuần trước",
      month: "Tháng trước",
      quarter: "Quý trước",
      year: "Năm trước",
    }),
    []
  );

  if (isLoading) {
    return (
      <div className="w-full px-6 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải hoạt động người dùng...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full px-6 py-8">
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Không thể tải hoạt động người dùng
          </h3>
          <p className="text-gray-600">
            Đã xảy ra lỗi khi truy vấn dữ liệu. Vui lòng thử lại.
          </p>
          <button
            type="button"
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (!activityData) {
    return (
      <div className="w-full px-6 py-8">
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">
            Chưa có dữ liệu hoạt động
          </h3>
          <p className="text-gray-600">
            Chúng tôi chưa ghi nhận hoạt động nào.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-6 py-8">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="page-title">Hoạt động Người dùng</h1>
            <p className="page-subtitle">
              Theo dõi mức độ tương tác và hoạt động của người dùng trên hệ
              thống.
            </p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <select
                value={timeRange}
                onChange={(e) =>
                  setTimeRange(
                    e.target.value as "week" | "month" | "quarter" | "year"
                  )
                }
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors cursor-pointer"
              >
                <option value="week">{periodLabels.week}</option>
                <option value="month">{periodLabels.month}</option>
                <option value="quarter">{periodLabels.quarter}</option>
                <option value="year">{periodLabels.year}</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
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
                <p className="text-sm font-medium text-gray-600">
                  Tổng số Nhiệm vụ
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activityData.userStats.totalTasks}
                </p>
              </div>
              <CheckSquare className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Nhiệm vụ Hoàn thành
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activityData.userStats.completedTasks}
                </p>
              </div>
              <CheckSquare className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tài liệu Đã tải lên
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activityData.userStats.uploadedDocuments}
                </p>
              </div>
              <FileText className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Bình luận Đã thêm
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activityData.userStats.commentsAdded}
                </p>
              </div>
              <MessageSquare className="w-6 h-6 text-gray-900" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Dự án Tham gia
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {activityData.userStats.projectsInvolved}
                </p>
              </div>
              <TrendingUp className="w-6 h-6 text-gray-900" />
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
              <h3 className="card-title">Hoạt động Gần đây</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {activityData.recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className={`p-4 rounded-lg border ${getActivityColor(
                      activity.type
                    )}`}
                  >
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
                            trong {activity.projectName}
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
            <h3 className="card-title">Người dùng Tích cực nhất</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {activityData.topActiveUsers.map((user, index) => (
                <div
                  key={user.userId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {user.activityCount} hoạt động
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-gray-900" />
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
          <h3 className="card-title">Mức độ hoạt động theo thời gian</h3>
        </div>
        <div className="card-body">
          {activityData.activityByDay &&
          activityData.activityByDay.length > 0 ? (
            <div className="space-y-4">
              {activityData.activityByDay.slice(0, 7).map((day, index) => (
                <div
                  key={day.date}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDateLabel(day.date)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {day.count} hoạt động
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (day.count /
                              Math.max(
                                ...activityData.activityByDay.map(
                                  (d) => d.count
                                )
                              )) *
                              100,
                            100
                          )}%`,
                        }}
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
                <p className="text-gray-600">Chưa có dữ liệu hoạt động</p>
                <p className="text-sm text-gray-500">
                  Hoạt động sẽ xuất hiện khi người dùng tương tác với hệ thống
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
