import { X } from 'lucide-react';
import type { Label } from '../../types/label';

interface LabelChipProps {
  label: Label;
  onRemove?: (labelId: string) => void;
  size?: 'sm' | 'md' | 'lg';
  showRemove?: boolean;
  className?: string;
}

export default function LabelChip({
  label,
  onRemove,
  size = 'md',
  showRemove = false,
  className = ''
}: LabelChipProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md font-medium text-gray-700 bg-gray-100 border border-gray-200 ${sizeClasses[size]} ${className}`}
    >
      {label.name}
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label.id);
          }}
          className="text-gray-500 hover:text-gray-700 transition-colors rounded-full p-0.5"
          aria-label={`Xóa nhãn ${label.name}`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

