import { useState, useRef } from 'react';
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please select a valid image file (JPEG, PNG, GIF, WEBP)');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Call parent handler
    onAvatarChange(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
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

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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
              alt="Profile"
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
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleFileSelect(e.target.files[0]);
          }
        }}
      />

      {/* Drag & Drop Instructions */}
      {isDragOver && (
        <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap z-20">
          Drop image here
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="mt-2 text-xs text-gray-500">
        <p>Click or drag to upload</p>
        <p>Max 5MB • JPEG, PNG, GIF, WEBP</p>
      </div>
    </div>
  );
}
