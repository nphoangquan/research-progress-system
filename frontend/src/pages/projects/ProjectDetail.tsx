import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/axios";
import { Edit, Settings, TrendingUp } from "lucide-react";
import { sanitizeHTML } from "../../utils/sanitize";
// import { Project } from '../types/project';

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.project;
    },
    enabled: !!id,
  });

  // Must call hooks before any conditional returns
  const sanitizedDescription = useMemo(() => {
    if (!project?.description) return null;
    return sanitizeHTML(project.description);
  }, [project?.description]);

  if (!user) {
    return <div>Đang tải...</div>;
  }

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Đang tải dự án...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <p className="text-red-600">
            Không tìm thấy dự án hoặc không có quyền truy cập.
          </p>
          <Link
            to="/projects"
            className="mt-2 inline-block text-indigo-600 hover:text-indigo-500"
          >
            ← Quay lại Dự án
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <Link
              to="/projects"
              className="text-indigo-600 hover:text-indigo-500 text-sm font-medium mb-2 inline-block"
            >
              ← Quay lại Dự án
            </Link>
            <h1 className="page-title">{project.title}</h1>
            <div className="mt-2 text-gray-600 prose prose-sm max-w-none">
              {sanitizedDescription ? (
                <div
                  dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                />
              ) : (
                <p>Chưa có mô tả.</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                project.status === "COMPLETED"
                  ? "bg-green-100 text-green-800"
                  : project.status === "IN_PROGRESS"
                  ? "bg-blue-100 text-blue-800"
                  : project.status === "UNDER_REVIEW"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {project.status === "COMPLETED"
                ? "Hoàn thành"
                : project.status === "IN_PROGRESS"
                ? "Đang thực hiện"
                : project.status === "UNDER_REVIEW"
                ? "Đang xem xét"
                : project.status === "NOT_STARTED"
                ? "Chưa bắt đầu"
                : project.status === "CANCELLED"
                ? "Đã hủy"
                : project.status === "ARCHIVED"
                ? "Đã lưu trữ"
                : project.status.replace("_", " ")}
            </span>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <Link
                to={`/projects/${id}/progress`}
                className="btn-secondary flex items-center"
              >
                <TrendingUp className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Tiến độ</span>
              </Link>
              {(user.role === "ADMIN" || user.role === "LECTURER") && (
                <>
                  <Link
                    to={`/projects/${id}/edit`}
                    className="btn-secondary flex items-center"
                  >
                    <Edit className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span className="whitespace-nowrap">Chỉnh sửa</span>
                  </Link>
                  <Link
                    to={`/projects/${id}/settings`}
                    className="btn-ghost flex items-center justify-center"
                  >
                    <Settings className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Tiến độ</h2>
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Tiến độ tổng thể</span>
                <span>{project.progress}%</span>
              </div>
              <div className="flex-1 bg-gray-200 rounded-full h-3">
                <div
                  className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Ngày bắt đầu:</span>
                <span className="ml-2 font-medium">
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
              {project.endDate && (
                <div>
                  <span className="text-gray-500">Ngày kết thúc:</span>
                  <span className="ml-2 font-medium">
                    {new Date(project.endDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Tasks */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Nhiệm vụ</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {project.tasks?.length || 0} nhiệm vụ
                </span>
                <Link
                  to={`/projects/${id}/tasks`}
                  className="btn-secondary text-sm"
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
            {project.tasks?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có nhiệm vụ nào.
              </p>
            ) : (
              <div className="space-y-3">
                {project.tasks?.slice(0, 5).map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate" title={task.title}>
                        {task.title}
                      </h3>
                      <p className="text-xs text-gray-500 truncate" title={task.assignee?.fullName || ''}>
                        Được gán cho {task.assignee?.fullName || 'N/A'}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        task.status === "DONE" || task.status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : task.status === "IN_PROGRESS"
                          ? "bg-blue-100 text-blue-800"
                          : task.status === "REVIEW"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status === "DONE" || task.status === "COMPLETED"
                        ? "Hoàn thành"
                        : task.status === "IN_PROGRESS"
                        ? "Đang thực hiện"
                        : task.status === "REVIEW"
                        ? "Đang xem xét"
                        : task.status === "TODO"
                        ? "Cần làm"
                        : task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Documents */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Tài liệu</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500">
                  {project.documents?.length || 0} tài liệu
                </span>
                <Link
                  to={`/projects/${id}/documents`}
                  className="btn-secondary text-sm"
                >
                  Xem tất cả
                </Link>
              </div>
            </div>
            {project.documents?.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Chưa có tài liệu nào được tải lên.
              </p>
            ) : (
              <div className="space-y-3">
                {project.documents?.slice(0, 5).map((doc: any) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate" title={doc.fileName}>
                        {doc.fileName}
                      </h3>
                      <p className="text-xs text-gray-500 whitespace-nowrap">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB •
                        {new Date(doc.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${
                        doc.indexStatus === "INDEXED"
                          ? "bg-green-100 text-green-800"
                          : doc.indexStatus === "PROCESSING"
                          ? "bg-blue-100 text-blue-800"
                          : doc.indexStatus === "FAILED"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {doc.indexStatus === "INDEXED"
                        ? "Đã lập chỉ mục"
                        : doc.indexStatus === "PROCESSING"
                        ? "Đang xử lý"
                        : doc.indexStatus === "FAILED"
                        ? "Thất bại"
                        : doc.indexStatus}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thông tin dự án
            </h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Sinh viên:</span>
                <div className="space-y-2">
                  {project.students?.map((ps: any) => (
                    <div key={ps.student.id}>
                      <p className="text-sm font-medium text-gray-900">
                        {ps.student.fullName}
                        {ps.role === "LEAD" && (
                          <span className="ml-2 text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                            Trưởng nhóm
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500">
                        {ps.student.email}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-500">Giảng viên:</span>
                <p className="text-sm font-medium text-gray-900">
                  {project.lecturer.fullName}
                </p>
                <p className="text-xs text-gray-500">
                  {project.lecturer.email}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Ngày tạo:</span>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Thống kê nhanh
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tổng nhiệm vụ:</span>
                <span className="text-sm font-medium">
                  {project._count.tasks}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tài liệu:</span>
                <span className="text-sm font-medium">
                  {project._count.documents}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Tiến độ:</span>
                <span className="text-sm font-medium">{project.progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
