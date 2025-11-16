import React from "react";
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import SelectDropdown from "../../components/ui/SelectDropdown";
import ProjectUserFilterSelector from "../../components/ProjectUserFilterSelector";
import Pagination from "../../components/ui/Pagination";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { getErrorMessage } from '../../utils/errorUtils';
import {
  Plus,
  Search,
  FileText,
  Download,
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  Filter,
  ArrowLeft,
} from "lucide-react";
import {
  useCategoryOptions,
  useStatusOptions,
  useFileTypeOptions,
  useUploadDateOptions,
} from "../../hooks/useDocumentFilters";

interface Document {
  id: string;
  projectId: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  description: string | null;
  category: "PROJECT" | "REFERENCE" | "TEMPLATE" | "GUIDELINE" | "SYSTEM";
  accessLevel: "RESTRICTED" | "STUDENT" | "LECTURER" | "PUBLIC";
  isPublic: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED";
  indexStatus: "PENDING" | "PROCESSING" | "INDEXED" | "FAILED";
  indexedAt: string | null;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  uploader?: {
    id: string;
    fullName: string;
    email: string;
  };
}

interface Project {
  id: string;
  title: string;
  description: string;
  lecturerId: string;
  status: string;
  startDate: string;
  endDate: string | null;
  progress: number;
  createdAt: string;
  updatedAt: string;
  lecturer: {
    id: string;
    fullName: string;
    email: string;
  };
  students: Array<{
    studentId: string;
    student: {
      id: string;
      fullName: string;
      email: string;
    };
  }>;
}

export default function ProjectDocumentList() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  const [filters, setFilters] = useState({
    status: "",
    uploader: [] as string[],
    fileType: "",
    uploadDate: "",
    search: "",
    category: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch project details
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });

  // Fetch documents for this specific project
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ["documents", projectId, filters, currentPage, pageSize],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);
      if (filters.status) params.append("status", filters.status);
      if (filters.uploader.length > 0) {
        filters.uploader.forEach((uploaderId) =>
          params.append("uploader", uploaderId)
        );
      }
      if (filters.fileType) params.append("fileType", filters.fileType);
      if (filters.uploadDate) params.append("uploadDate", filters.uploadDate);
      if (filters.search) params.append("search", filters.search);
      if (filters.category) params.append("category", filters.category);

      // Add pagination parameters
      params.append("page", currentPage.toString());
      params.append("limit", pageSize.toString());

      const response = await api.get(`/documents?${params.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
  });

  const documents = documentsData?.documents || [];
  const pagination = documentsData?.pagination;

  // Fetch document statistics
  const {
    data: statsData,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery({
    queryKey: ["document-stats", projectId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);

      const response = await api.get(`/documents/stats?${params.toString()}`);
      return response.data;
    },
    enabled: !!projectId,
    retry: 2,
  });

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.delete(`/documents/${documentId}`);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Xóa tài liệu thành công!");
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Xóa tài liệu thất bại'));
    },
  });

  const handleDeleteDocument = (documentId: string, fileName: string) => {
    if (
      window.confirm(
        `Bạn có chắc chắn muốn xóa "${fileName}"? Hành động này không thể hoàn tác.`
      )
    ) {
      deleteDocumentMutation.mutate(documentId);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "APPROVED":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "REJECTED":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "APPROVED":
        return "bg-green-100 text-green-800";
      case "REJECTED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "PROJECT":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "REFERENCE":
        return "bg-blue-50 text-blue-700 border border-blue-200";
      case "TEMPLATE":
        return "bg-gray-50 text-gray-700 border border-gray-200";
      case "GUIDELINE":
        return "bg-slate-50 text-slate-700 border border-slate-200";
      case "SYSTEM":
        return "bg-indigo-50 text-indigo-700 border border-indigo-200";
      default:
        return "bg-gray-50 text-gray-700 border border-gray-200";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "PROJECT":
        return "Project";
      case "REFERENCE":
        return "Reference";
      case "TEMPLATE":
        return "Template";
      case "GUIDELINE":
        return "Guideline";
      case "SYSTEM":
        return "System";
      default:
        return category;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(doc.fileUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Không thể tải xuống tệp");
    }
  };

  const handleView = (doc: Document) => {
    navigate(`/documents/${doc.id}`);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              className="btn-ghost p-2 hover:bg-gray-100 rounded-lg"
              title="Quay lại Dự án"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="page-title">Tài liệu dự án</h1>
              <p className="page-subtitle">
                {project ? `${project.title} - Tài liệu` : "Tài liệu dự án"} -
                Quản lý tệp dự án
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() =>
                navigate(`/projects/${projectId}/documents/upload`)
              }
              className="btn-primary"
            >
              <Upload className="w-4 h-4 mr-2" />
              Tải lên tài liệu
            </button>
          </div>
        </div>
      </div>

      {/* Statistics - Compact Horizontal Design */}
      {statsLoading && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600 mr-2"></div>
            <span className="text-sm text-gray-500">Đang tải thống kê...</span>
          </div>
        </div>
      )}

      {statsError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="text-red-600 mr-2">WARNING</div>
            <span className="text-sm text-red-700">
              Tải thống kê thất bại. Vui lòng thử lại.
            </span>
          </div>
        </div>
      )}

      {statsData && !statsError && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-4 sm:gap-8">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-500">Total:</span>
                <span className="text-lg font-semibold text-gray-900">
                  {(statsData as any).totalCount}
                </span>
              </div>

              {(statsData as any).categoryStats.map((stat: any) => (
                <div
                  key={stat.category}
                  className="flex items-center space-x-2"
                >
                  <FileText className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-500">
                    {getCategoryLabel(stat.category)}:
                  </span>
                  <span className="text-lg font-semibold text-gray-900">
                    {stat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card mb-6">
        <div className="card-body">
          <div className="space-y-4">
            {/* Search Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài liệu..."
                    className="input pl-10 w-full text-sm min-h-[42px]"
                    value={filters.search}
                    onChange={(e) =>
                      setFilters((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <button
                onClick={() => {
                  setFilters({
                    status: "",
                    uploader: [],
                    fileType: "",
                    uploadDate: "",
                    search: "",
                    category: "",
                  });
                  setCurrentPage(1);
                }}
                className="btn-ghost whitespace-nowrap"
              >
                Xóa bộ lọc
              </button>
            </div>

            {/* First Filter Row - Status, Dates, File Types, Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Status Filter */}
              <SelectDropdown
                label="Trạng thái"
                options={[
                  { id: "", fullName: "Tất cả trạng thái" },
                  { id: "PENDING", fullName: "Chờ duyệt" },
                  { id: "APPROVED", fullName: "Đã duyệt" },
                  { id: "REJECTED", fullName: "Đã từ chối" },
                ]}
                value={filters.status}
                onChange={(status) =>
                  setFilters((prev) => ({ ...prev, status }))
                }
                placeholder="Tất cả trạng thái"
              />

              {/* Upload Date Filter */}
              <SelectDropdown
                label="Thời gian"
                options={[
                  { id: "", fullName: "Tất cả ngày" },
                  { id: "today", fullName: "Today" },
                  { id: "this_week", fullName: "This Week" },
                  { id: "this_month", fullName: "This Month" },
                  { id: "last_month", fullName: "Last Month" },
                ]}
                value={filters.uploadDate}
                onChange={(uploadDate) =>
                  setFilters((prev) => ({ ...prev, uploadDate }))
                }
                placeholder="Tất cả ngày"
              />

              {/* File Type Filter */}
              <SelectDropdown
                label="Loại tệp"
                options={[
                  { id: "", fullName: "Tất cả loại tệp" },
                  { id: "pdf", fullName: "PDF" },
                  { id: "doc", fullName: "Word Documents" },
                  { id: "xls", fullName: "Excel Files" },
                  { id: "ppt", fullName: "PowerPoint" },
                  { id: "image", fullName: "Images" },
                  { id: "archive", fullName: "Archives" },
                ]}
                value={filters.fileType}
                onChange={(fileType) =>
                  setFilters((prev) => ({ ...prev, fileType }))
                }
                placeholder="Tất cả loại tệp"
              />

              {/* Category Filter */}
              <SelectDropdown
                label="Danh mục"
                options={[
                  { id: "", fullName: "Tất cả danh mục" },
                  { id: "PROJECT", fullName: "Tài liệu dự án" },
                  { id: "REFERENCE", fullName: "Reference Materials" },
                  { id: "TEMPLATE", fullName: "Templates" },
                  { id: "GUIDELINE", fullName: "Guidelines" },
                ]}
                value={filters.category}
                onChange={(category) =>
                  setFilters((prev) => ({ ...prev, category }))
                }
                placeholder="Tất cả danh mục"
              />
            </div>

            {/* Second Filter Row - Uploaders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Uploader Filter */}
              <ProjectUserFilterSelector
                projectId={projectId!}
                selectedUsers={filters.uploader}
                onSelectionChange={(userIds) =>
                  setFilters((prev) => ({ ...prev, uploader: userIds }))
                }
                multiple={true}
                placeholder="Tất cả người tải lên"
                label="Người tải lên"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Documents List */}
      <div className="card">
        <div className="card-body">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Đang tải tài liệu...</p>
            </div>
          ) : documents && documents.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {documents.map((document: Document) => (
                <div
                  key={document.id}
                  className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-sm transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 min-w-0" title={document.fileName}>
                          {document.fileName}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getCategoryColor(
                              document.category
                            )}`}
                          >
                            {getCategoryLabel(document.category)}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${getStatusColor(
                              document.status
                            )}`}
                          >
                            {document.status}
                          </span>
                        </div>
                      </div>

                      {document.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2" title={document.description || ''}>
                          {document.description}
                        </p>
                      )}

                      <div className="flex items-center flex-wrap gap-3 text-sm text-gray-500">
                        <div className="flex items-center whitespace-nowrap">
                          <User className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span className="truncate max-w-xs" title={document.uploader?.fullName || "Người dùng không xác định"}>
                            {document.uploader?.fullName ||
                              "Người dùng không xác định"}
                          </span>
                        </div>

                        <div className="flex items-center whitespace-nowrap">
                          <Calendar className="w-4 h-4 mr-1 flex-shrink-0" />
                          <span>{formatDate(document.createdAt)}</span>
                        </div>

                        <span className="whitespace-nowrap">{formatFileSize(document.fileSize)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleView(document)}
                        className="p-2 text-gray-400 hover:text-blue-600 rounded"
                        title="Xem tài liệu"
                      >
                        <Eye className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDownload(document)}
                        className="p-2 text-gray-400 hover:text-green-600 rounded"
                        title="Tải xuống tài liệu"
                      >
                        <Download className="w-4 h-4" />
                      </button>

                      {(user?.role === "ADMIN" ||
                        user?.role === "LECTURER") && (
                        <>
                          <button
                            onClick={() =>
                              navigate(`/documents/${document.id}/edit`)
                            }
                            className="p-2 text-gray-400 hover:text-gray-600 rounded"
                            title="Chỉnh sửa tài liệu"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteDocument(
                                document.id,
                                document.fileName
                              )
                            }
                            className="p-2 text-gray-400 hover:text-red-600 rounded"
                            title="Xóa tài liệu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy tài liệu
              </h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status
                  ? "Thử điều chỉnh bộ lọc để xem thêm tài liệu."
                  : "Bắt đầu bằng cách tải lên tài liệu đầu tiên."}
              </p>
              <button
                onClick={() =>
                  navigate(`/projects/${projectId}/documents/upload`)
                }
                className="btn-primary"
              >
                <Upload className="w-4 h-4 mr-2" />
                Tải lên tài liệu đầu tiên
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          limit={pagination.limit}
          onPageChange={(page: number) => {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="mt-8"
        />
      )}
    </div>
  );
}
