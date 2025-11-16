import { useState, useRef, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/axios';
import toast from 'react-hot-toast';
import { getErrorMessage } from '../../utils/errorUtils';
import { X, Upload, FileText, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface BulkImportUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ImportResult {
  success: Array<{ row: number; email: string; fullName: string }>;
  failed: Array<{ row: number; email: string; error: string }>;
  summary: {
    total: number;
    success: number;
    failed: number;
  };
}

export default function BulkImportUsersModal({ isOpen, onClose }: BulkImportUsersModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [requireEmailVerification, setRequireEmailVerification] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Close modal on Escape key or click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleClose = () => {
    setSelectedFile(null);
    setRequireEmailVerification(false);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Vui lòng chọn file CSV');
        return;
      }
      setSelectedFile(file);
      setImportResult(null);
    }
  };

  const importMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await api.post('/admin/users/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      setImportResult(data);
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      if (data.summary.failed === 0) {
        toast.success(data.message);
      } else {
        toast.success(data.message, { duration: 5000 });
      }
    },
    onError: (error: any) => {
      toast.error(getErrorMessage(error, 'Không thể nhập danh sách người dùng'));
    },
  });

  const handleSubmit = () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file CSV');
      return;
    }

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('requireEmailVerification', requireEmailVerification.toString());

    importMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Nhập danh sách người dùng từ CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!importResult ? (
            <>
              {/* Instructions */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">Hướng dẫn:</h3>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>File CSV phải có header với các cột: <strong>Họ tên</strong>, <strong>Email</strong>, <strong>Vai trò</strong></li>
                  <li>Các cột tùy chọn: <strong>Mã sinh viên</strong>, <strong>Mật khẩu</strong></li>
                  <li>Vai trò phải là: <strong>ADMIN</strong>, <strong>LECTURER</strong> hoặc <strong>STUDENT</strong></li>
                  <li>Nếu không cung cấp mật khẩu, hệ thống sẽ tự động tạo mật khẩu ngẫu nhiên</li>
                  <li>Email và Mã sinh viên phải là duy nhất trong hệ thống</li>
                </ul>
              </div>

              {/* File Upload */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn file CSV
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-500 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="csv-file-input"
                  />
                  <label
                    htmlFor="csv-file-input"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <Upload className="w-12 h-12 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 mb-1">
                      {selectedFile ? selectedFile.name : 'Nhấp để chọn file CSV'}
                    </span>
                    <span className="text-xs text-gray-500">Chỉ chấp nhận file .csv</span>
                  </label>
                </div>
                {selectedFile && (
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="w-4 h-4" />
                    <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)</span>
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={requireEmailVerification}
                    onChange={(e) => setRequireEmailVerification(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700">
                    Yêu cầu xác thực email (sẽ gửi email xác thực cho người dùng mới)
                  </span>
                </label>
              </div>
            </>
          ) : (
            <>
              {/* Import Results */}
              <div className="mb-6">
                <div className={`p-4 rounded-lg mb-4 ${
                  importResult.summary.failed === 0
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {importResult.summary.failed === 0 ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-yellow-600" />
                    )}
                    <h3 className="font-medium text-gray-900">
                      {importResult.summary.failed === 0
                        ? 'Nhập thành công!'
                        : 'Nhập hoàn tất với một số lỗi'}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-700">
                    Tổng: {importResult.summary.total} | Thành công: {importResult.summary.success} | Thất bại: {importResult.summary.failed}
                  </p>
                </div>

                {/* Failed rows */}
                {importResult.failed.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Các dòng thất bại ({importResult.failed.length}):
                    </h4>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dòng</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Lỗi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResult.failed.map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{item.row}</td>
                              <td className="px-3 py-2 text-gray-600">{item.email}</td>
                              <td className="px-3 py-2 text-error-600">{item.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Success rows (show first 10) */}
                {importResult.success.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Các dòng thành công ({importResult.success.length}):
                    </h4>
                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Dòng</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                            <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Họ tên</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importResult.success.slice(0, 10).map((item, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-900">{item.row}</td>
                              <td className="px-3 py-2 text-gray-600">{item.email}</td>
                              <td className="px-3 py-2 text-gray-600">{item.fullName}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {importResult.success.length > 10 && (
                      <p className="text-xs text-gray-500 mt-2">
                        Và {importResult.success.length - 10} dòng thành công khác...
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          {!importResult ? (
            <>
              <button
                onClick={handleClose}
                className="btn-secondary"
                disabled={importMutation.isPending}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedFile || importMutation.isPending}
                className="btn-primary"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Nhập danh sách
                  </>
                )}
              </button>
            </>
          ) : (
            <button onClick={handleClose} className="btn-primary">
              Đóng
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

