import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/useAuth";
import ProjectSelector from "../../components/ui/ProjectSelector";
import api from "../../lib/axios";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, FileText, AlertCircle, Trash2 } from "lucide-react";
import { getErrorMessage } from '../../utils/errorUtils';

interface UploadDocumentRequest {
  projectId?: string;
  file: File;
  description?: string;
  category?: string;
  accessLevel?: string;
}

export default function DocumentUpload() {
  const { projectId } = useParams<{ projectId?: string }>();
  const navigate = useNavigate();
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const queryClient = useQueryClient();

  if (!user) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const [file, setFile] = useState<File | null>(null);
  const [description, setDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    projectId ? [projectId] : []
  );
  const [category, setCategory] = useState("PROJECT");
  const [accessLevel, setAccessLevel] = useState("RESTRICTED");

  // Fetch project info
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const response = await api.get(`/projects/${projectId}`);
      return response.data.project;
    },
    enabled: !!projectId,
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: UploadDocumentRequest) => {
      const formData = new FormData();
      formData.append("file", data.file);
      if (data.projectId) {
        formData.append("projectId", data.projectId);
      }
      if (data.description) {
        formData.append("description", data.description);
      }
      if (data.category) {
        formData.append("category", data.category);
      }
      if (data.accessLevel) {
        formData.append("accessLevel", data.accessLevel);
      }

      const response = await api.post("/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success("Tải lên tài liệu thành công!");
      if (selectedProjectIds.length > 0) {
        queryClient.invalidateQueries({
          queryKey: ["project", selectedProjectIds[0]],
        });
      }
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      navigate(
        selectedProjectIds.length > 0
          ? `/projects/${selectedProjectIds[0]}/documents`
          : "/documents"
      );
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Tải lên thất bại'));
    },
  });

  const handleFileSelect = (selectedFile: File) => {
    // Validate file type
    const allowedTypes = [
      // Documents
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      // Images
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
      // Excel
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // PowerPoint
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      // Archives
      "application/zip",
      "application/x-rar-compressed",
      "application/x-7z-compressed",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error(
        "Chỉ cho phép tệp PDF, DOC, DOCX, TXT, ảnh, Excel, PowerPoint và tệp nén"
      );
      return;
    }

    // Validate file size (25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      toast.error("Kích thước tệp phải nhỏ hơn 25MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast.error("Vui lòng chọn một tệp");
      return;
    }

    // Validate based on category
    if (category === "PROJECT") {
      if (!projectId && selectedProjectIds.length === 0) {
        toast.error("Vui lòng chọn ít nhất một dự án");
        return;
      }
    } else {
      // For non-PROJECT categories, only ADMIN can upload
      if (user.role !== "ADMIN") {
        toast.error(
          "Chỉ quản trị viên mới có thể tải lên tài liệu tham khảo, mẫu và hướng dẫn"
        );
        return;
      }
    }

    // If multiple projects selected, upload to each one
    if (selectedProjectIds.length > 1 && category === "PROJECT") {
      let successCount = 0;
      let errorCount = 0;

      for (const projectIdToUpload of selectedProjectIds) {
        try {
          await uploadMutation.mutateAsync({
            projectId: projectIdToUpload,
            file,
            description: description.trim() || undefined,
            category,
            accessLevel,
          });
          successCount++;
        } catch (error) {
          errorCount++;
          console.error(
            `Failed to upload to project ${projectIdToUpload}:`,
            error
          );
        }
      }

      if (successCount > 0) {
        toast.success(
          `Tài liệu đã được tải lên thành công vào ${successCount} dự án!`
        );
        if (errorCount > 0) {
          toast.error(`Không thể tải lên vào ${errorCount} dự án`);
        }
      } else {
        toast.error("Không thể tải lên tài liệu vào bất kỳ dự án nào");
      }
    } else {
      // Single project upload or non-PROJECT category upload
      uploadMutation.mutate({
        projectId:
          category === "PROJECT"
            ? projectId || selectedProjectIds[0] || undefined
            : undefined,
        file,
        description: description.trim() || undefined,
        category,
        accessLevel,
      });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Tải lên Tài liệu</h1>
            <p className="page-subtitle">
              {project
                ? `${project.title} - Tải lên tài liệu mới`
                : "Tải lên tài liệu mới"}
            </p>
          </div>

          <button
            onClick={() =>
              navigate(
                projectId ? `/projects/${projectId}/documents` : "/documents"
              )
            }
            className="btn-secondary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại Tài liệu
          </button>
        </div>
      </div>

      {/* Upload Form */}
      <div className="max-w-2xl mx-auto">
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Project Selection */}
              {!projectId && category === "PROJECT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dự án <span className="text-error-500">*</span>
                  </label>
                  <ProjectSelector
                    selectedProjects={selectedProjectIds}
                    onSelectionChange={setSelectedProjectIds}
                    multiple={true}
                    placeholder="Chọn dự án..."
                  />
                </div>
              )}

              {/* Document Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Danh mục Tài liệu <span className="text-error-500">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value);
                    // Auto-adjust access level based on category
                    if (
                      e.target.value === "REFERENCE" ||
                      e.target.value === "TEMPLATE" ||
                      e.target.value === "GUIDELINE"
                    ) {
                      setAccessLevel("STUDENT");
                    } else if (e.target.value === "SYSTEM") {
                      setAccessLevel("PUBLIC");
                    } else {
                      setAccessLevel("RESTRICTED");
                    }
                  }}
                  className="input"
                >
                  <option value="PROJECT">Tài liệu Dự án</option>
                  {user.role === "ADMIN" && (
                    <>
                      <option value="REFERENCE">Tài liệu Tham khảo</option>
                      <option value="TEMPLATE">Mẫu</option>
                      <option value="GUIDELINE">Hướng dẫn</option>
                      <option value="SYSTEM">Tài liệu Hệ thống</option>
                    </>
                  )}
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  {category === "PROJECT" &&
                    "Tài liệu dành riêng cho một dự án"}
                  {category === "REFERENCE" &&
                    "Tài liệu tham khảo cho tất cả sinh viên"}
                  {category === "TEMPLATE" && "Mẫu hoặc tài liệu mẫu"}
                  {category === "GUIDELINE" &&
                    "Tài liệu hướng dẫn hoặc chỉ dẫn"}
                  {category === "SYSTEM" &&
                    "Tài liệu hệ thống (chỉ quản trị viên)"}
                </p>
              </div>

              {/* Access Level */}
              {category !== "PROJECT" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mức độ Truy cập
                  </label>
                  <select
                    value={accessLevel}
                    onChange={(e) => setAccessLevel(e.target.value)}
                    className="input"
                    disabled={category === "SYSTEM"}
                  >
                    <option value="RESTRICTED">Chỉ Thành viên Dự án</option>
                    <option value="STUDENT">Tất cả Sinh viên</option>
                    <option value="LECTURER">Tất cả Giảng viên</option>
                    <option value="PUBLIC">Mọi người</option>
                  </select>
                  <p className="text-sm text-gray-500 mt-1">
                    {accessLevel === "RESTRICTED" &&
                      "Chỉ thành viên dự án mới có thể truy cập"}
                    {accessLevel === "STUDENT" &&
                      "Tất cả sinh viên có thể truy cập"}
                    {accessLevel === "LECTURER" &&
                      "Tất cả giảng viên có thể truy cập"}
                    {accessLevel === "PUBLIC" &&
                      "Mọi người đều có thể truy cập"}
                  </p>
                </div>
              )}

              {/* File Upload Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tệp Tài liệu <span className="text-error-500">*</span>
                </label>

                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragOver
                      ? "border-primary-500 bg-primary-50"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {file ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <FileText className="w-6 h-6 text-green-600 mr-3" />
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium text-green-800">
                              {file.name}
                            </p>
                            <p className="text-xs text-green-600">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            className="text-green-600 hover:text-green-800 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500">
                        Tệp sẵn sàng để tải lên. Nhấp "Tải lên Tài liệu" bên
                        dưới để tiếp tục.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                        <div>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium text-primary-600">
                              Nhấp để tải lên
                            </span>{" "}
                            hoặc kéo và thả
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, DOC, DOCX, TXT, ảnh, Excel, PowerPoint, Tệp nén
                            (tối đa 25MB)
                          </p>
                        </div>
                      </div>

                      <input
                        type="file"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileSelect(e.target.files[0])
                        }
                        accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif,.webp,.xls,.xlsx,.ppt,.pptx,.zip,.rar,.7z"
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="inline-block btn-secondary cursor-pointer"
                      >
                        Chọn Tệp
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Mô tả (Tùy chọn)
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  className="input"
                  placeholder="Thêm mô tả cho tài liệu này..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* File Requirements */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="text-sm">
                    <h4 className="font-medium text-blue-900 mb-2">
                      Yêu cầu Tệp
                    </h4>
                    <ul className="text-blue-800 space-y-1">
                      <li>
                        • Định dạng hỗ trợ: PDF, DOC, DOCX, TXT, ảnh, Excel,
                        PowerPoint, Tệp nén
                      </li>
                      <li>• Kích thước tệp tối đa: 25MB</li>
                      <li>• Tài liệu sẽ được lập chỉ mục cho tìm kiếm AI</li>
                      <li>• Xử lý có thể mất vài phút</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      projectId
                        ? `/projects/${projectId}/documents`
                        : "/documents"
                    )
                  }
                  className="btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!file || uploadMutation.isPending}
                  className="btn-primary"
                >
                  {uploadMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Đang tải lên...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Tải lên Tài liệu
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
