import React from "react";
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import MultiSelectDropdown from "../../components/ui/MultiSelectDropdown";
import SelectDropdown from "../../components/ui/SelectDropdown";
import DatePicker from "../../components/ui/DatePicker";
import LabelManager from "../../components/ui/LabelManager";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Save,
  Calendar,
  User,
  FileText,
  AlertCircle,
  Shield,
  Clock,
  Archive,
  Trash2,
  X,
} from "lucide-react";

interface ProjectSettingsForm {
  title: string;
  description: string;
  studentIds: string[];
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  isArchived: boolean;
}

export default function ProjectSettings() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();

  const [formData, setFormData] = useState<ProjectSettingsForm>({
    title: "",
    description: "",
    studentIds: [],
    status: "NOT_STARTED",
    progress: 0,
    startDate: "",
    endDate: "",
    isArchived: false,
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ProjectSettingsForm, string>>
  >({});

  // Fetch project data
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const response = await api.get(`/projects/${id}`);
      return response.data.project;
    },
    enabled: !!id,
  });

  // Fetch users for dropdowns
  const { data: users } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await api.get("/users");
      return response.data.users;
    },
  });

  // Populate form when project data is loaded
  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title || "",
        description: project.description || "",
        studentIds: project.students?.map((ps: any) => ps.studentId) || [],
        status: project.status || "NOT_STARTED",
        progress: project.progress || 0,
        startDate: project.startDate ? project.startDate.split("T")[0] : "",
        endDate: project.endDate ? project.endDate.split("T")[0] : "",
        isArchived: project.status === "ARCHIVED",
      });
    }
  }, [project]);

  const students = users?.filter((u: any) => u.role === "STUDENT") || [];

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async (data: Partial<ProjectSettingsForm>) => {
      const response = await api.put(`/projects/${id}`, data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Cập nhật cài đặt dự án thành công!");
      navigate(`/projects/${id}`);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error || "Cập nhật cài đặt dự án thất bại"
      );
    },
  });

  // Archive project mutation
  const archiveProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/projects/${id}`, { status: "ARCHIVED" });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Lưu trữ dự án thành công!");
      navigate("/projects");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Lưu trữ dự án thất bại");
    },
  });

  // Restore project mutation
  const restoreProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.put(`/projects/${id}`, {
        status: "IN_PROGRESS",
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Khôi phục dự án thành công!");
      navigate(`/projects/${id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Khôi phục dự án thất bại");
    },
  });

  // Delete project mutation
  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const response = await api.delete(`/projects/${id}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Xóa dự án thành công!");
      navigate("/projects");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Xóa dự án thất bại");
    },
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : name === "progress"
          ? parseInt(value) || 0
          : value,
    }));

    // Clear error when user starts typing
    if (errors[name as keyof ProjectSettingsForm]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof ProjectSettingsForm, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Tiêu đề dự án là bắt buộc";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Mô tả dự án là bắt buộc";
    }

    if (formData.progress < 0 || formData.progress > 100) {
      newErrors.progress = "Tiến độ phải từ 0 đến 100";
    }

    if (
      formData.endDate &&
      formData.startDate &&
      formData.endDate < formData.startDate
    ) {
      newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    updateProjectMutation.mutate(formData);
  };

  const handleArchive = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn lưu trữ dự án này? Nó sẽ được chuyển vào danh sách dự án đã lưu trữ."
      )
    ) {
      archiveProjectMutation.mutate();
    }
  };

  const handleRestore = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn khôi phục dự án này? Nó sẽ được chuyển lại vào danh sách dự án đang hoạt động."
      )
    ) {
      restoreProjectMutation.mutate();
    }
  };

  const handleDelete = () => {
    if (
      window.confirm(
        "Bạn có chắc chắn muốn xóa dự án này? Hành động này không thể hoàn tác."
      )
    ) {
      deleteProjectMutation.mutate();
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Check permissions - only ADMIN and LECTURER can access settings
  if (user.role === "STUDENT") {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-error-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Truy cập bị từ chối
          </h3>
          <p className="text-gray-600 mb-6">
            Sinh viên không thể truy cập cài đặt dự án.
          </p>
          <button
            onClick={() => navigate(`/projects/${id}`)}
            className="btn-primary"
          >
            Quay lại Dự án
          </button>
        </div>
      </div>
    );
  }

  if (projectLoading) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải cài đặt dự án...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Không tìm thấy dự án
          </h3>
          <p className="text-gray-600 mb-6">
            Dự án bạn đang tìm không tồn tại hoặc bạn không có quyền truy cập.
          </p>
          <button onClick={() => navigate("/projects")} className="btn-primary">
            Quay lại Dự án
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="btn-ghost p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="page-title">Cài đặt dự án</h1>
              <p className="page-subtitle">
                Quản lý cấu hình và cài đặt nâng cao của dự án.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Settings Form */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-gray-900">
                Cài đặt chung
              </h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Title */}
                <div>
                  <label
                    htmlFor="title"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Tiêu đề dự án *
                  </label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="title"
                      name="title"
                      type="text"
                      required
                      className={`input pl-10 ${
                        errors.title ? "input-error" : ""
                      }`}
                      placeholder="Nhập tiêu đề dự án"
                      value={formData.title}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.title && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.title}
                    </p>
                  )}
                </div>

                {/* Project Description */}
                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Mô tả dự án *
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    required
                    className={`input ${
                      errors.description ? "input-error" : ""
                    }`}
                    placeholder="Mô tả mục tiêu, phương pháp và kết quả mong đợi của dự án"
                    value={formData.description}
                    onChange={handleChange}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-error-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {errors.description}
                    </p>
                  )}
                </div>

                {/* Student Management */}
                <MultiSelectDropdown
                  label="Sinh viên dự án"
                  options={students}
                  selectedIds={formData.studentIds}
                  onChange={(studentIds) =>
                    setFormData((prev) => ({ ...prev, studentIds }))
                  }
                  error={errors.studentIds}
                  placeholder="Thêm sinh viên vào dự án..."
                />

                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Nhóm hiện tại
                  </h4>
                  <div className="space-y-2">
                    {formData.studentIds.map((studentId) => {
                      const student = students.find(
                        (s: any) => s.id === studentId
                      );
                      return (
                        <div
                          key={studentId}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded"
                        >
                          <div className="flex items-center">
                            <User className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm">{student?.fullName}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                studentIds: prev.studentIds.filter(
                                  (id) => id !== studentId
                                ),
                              }));
                            }}
                            className="text-error-600 hover:text-error-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                    {formData.studentIds.length === 0 && (
                      <p className="text-gray-500 text-sm py-2">
                        Chưa có sinh viên nào được gán cho dự án này
                      </p>
                    )}
                  </div>
                </div>

                {/* Labels Management */}
                <div className="border-t border-gray-200 pt-6">
                  <LabelManager projectId={id} />
                </div>

                {/* Status and Progress */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <SelectDropdown
                      label="Trạng thái"
                      options={[
                        { id: "NOT_STARTED", fullName: "Chưa bắt đầu" },
                        { id: "IN_PROGRESS", fullName: "Đang thực hiện" },
                        { id: "UNDER_REVIEW", fullName: "Đang xem xét" },
                        { id: "COMPLETED", fullName: "Hoàn thành" },
                        { id: "CANCELLED", fullName: "Đã hủy" },
                      ]}
                      value={formData.status}
                      onChange={(status) =>
                        setFormData((prev) => ({ ...prev, status }))
                      }
                      placeholder="Chọn trạng thái..."
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="progress"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Tiến độ (%)
                    </label>
                    <input
                      id="progress"
                      name="progress"
                      type="number"
                      min="0"
                      max="100"
                      className={`input ${
                        errors.progress ? "input-error" : ""
                      }`}
                      value={formData.progress}
                      onChange={handleChange}
                    />
                    {errors.progress && (
                      <p className="mt-1 text-sm text-error-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.progress}
                      </p>
                    )}
                  </div>
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="startDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ngày bắt đầu *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        id="startDate"
                        name="startDate"
                        type="date"
                        required
                        className="input pl-10"
                        value={formData.startDate}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="endDate"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Ngày kết thúc
                    </label>
                    <DatePicker
                      value={formData.endDate || null}
                      onChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          endDate: value || "",
                        }))
                      }
                      placeholder="Chọn ngày kết thúc (tùy chọn)"
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-error-600 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="btn-primary"
                  >
                    {updateProjectMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {updateProjectMutation.isPending
                      ? "Đang lưu..."
                      : "Lưu cài đặt"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Project Info */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">
                Thông tin dự án
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Sinh viên
                    </p>
                    <p className="text-sm text-gray-600">
                      {project.student?.fullName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <User className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Giảng viên
                    </p>
                    <p className="text-sm text-gray-600">
                      {project.lecturer?.fullName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Ngày tạo
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-red-600">
                Vùng nguy hiểm
              </h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Lưu trữ dự án
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Lưu trữ dự án này để ẩn khỏi danh sách dự án đang hoạt động.
                  </p>
                  {project.status === "ARCHIVED" ? (
                    <button
                      onClick={handleRestore}
                      disabled={restoreProjectMutation.isPending}
                      className="btn-primary text-sm"
                    >
                      {restoreProjectMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      ) : (
                        <Archive className="w-4 h-4 mr-2" />
                      )}
                      {restoreProjectMutation.isPending
                        ? "Đang khôi phục..."
                        : "Khôi phục dự án"}
                    </button>
                  ) : (
                    <button
                      onClick={handleArchive}
                      disabled={archiveProjectMutation.isPending}
                      className="btn-secondary text-sm"
                    >
                      {archiveProjectMutation.isPending ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                      ) : (
                        <Archive className="w-4 h-4 mr-2" />
                      )}
                      {archiveProjectMutation.isPending
                        ? "Đang lưu trữ..."
                        : "Lưu trữ dự án"}
                    </button>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Xóa dự án
                  </h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Xóa vĩnh viễn dự án này và tất cả dữ liệu của nó. Hành động
                    này không thể hoàn tác.
                  </p>
                  <button
                    onClick={handleDelete}
                    disabled={deleteProjectMutation.isPending}
                    className="btn-danger text-sm"
                  >
                    {deleteProjectMutation.isPending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ) : (
                      <Trash2 className="w-4 h-4 mr-2" />
                    )}
                    {deleteProjectMutation.isPending
                      ? "Đang xóa..."
                      : "Xóa dự án"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
