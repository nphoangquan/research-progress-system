import React from 'react';
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

  const getTextColor = (bgColor: string): string => {
    // Convert hex to RGB
    let hex = bgColor.replace('#', '');
    
    // Handle 3-character hex colors (#RGB -> #RRGGBB)
    if (hex.length === 3) {
      hex = hex.split('').map(char => char + char).join('');
    }
    
    // Validate hex length
    if (hex.length !== 6) {
      return 'text-gray-900'; // Default to dark text if invalid
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white text for dark backgrounds, dark text for light backgrounds
    return luminance > 0.5 ? 'text-gray-900' : 'text-white';
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${sizeClasses[size]} ${getTextColor(label.color)} ${className}`}
      style={{ backgroundColor: label.color }}
    >
      {label.name}
      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(label.id);
          }}
          className={`${getTextColor(label.color)} hover:opacity-70 transition-opacity rounded-full p-0.5`}
          aria-label={`Remove ${label.name} label`}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

