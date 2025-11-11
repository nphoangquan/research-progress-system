import { useState, useRef, useCallback, useEffect } from 'react';
import type { DragEvent, MouseEvent, ChangeEvent } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  onAvatarChange: (file: File) => void;
  isUploading?: boolean;
  className?: string;
}

export default function AvatarUpload({
  currentAvatarUrl,
  onAvatarChange,
  isUploading = false,
  className = ""
}: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!ALLOWED_TYPES.includes(file.type as typeof ALLOWED_TYPES[number])) {
      toast.error('Vui lòng chọn tệp hình ảnh hợp lệ (JPEG, PNG, GIF, WEBP)');
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error('Kích thước ảnh phải nhỏ hơn 5MB');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onAvatarChange(file);
  }, [onAvatarChange]);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleRemove = useCallback((e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className={`relative ${className}`}>
      {/* Avatar Display */}
      <div
        className={`
          relative w-32 h-32 rounded-full cursor-pointer transition-all duration-200
          ${isDragOver ? 'ring-4 ring-primary-300 ring-opacity-50' : ''}
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Avatar Image or Placeholder */}
        <div className="w-full h-full rounded-full overflow-hidden bg-primary-100 flex items-center justify-center">
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Ảnh hồ sơ"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className="w-12 h-12 text-primary-600" />
          )}
        </div>

        {/* Upload Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 rounded-full transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            <Upload className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Remove Button (only when there's a preview) */}
        {previewUrl && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-1 -right-1 w-8 h-8 bg-error-500 text-white rounded-full flex items-center justify-center hover:bg-error-600 transition-colors z-10"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Camera Icon Button */}
        <button
          type="button"
          className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center hover:bg-primary-700 transition-colors z-10"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          <Camera className="w-4 h-4" />
        </button>

        {/* Upload Progress Indicator */}
        {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Drag & Drop Instructions */}
      {isDragOver && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-20">
          Thả ảnh vào đây
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Nhấn hoặc kéo thả để tải lên</p>
        <p>Tối đa 5MB • JPEG, PNG, GIF, WEBP</p>
      </div>
    </div>
  );
}
