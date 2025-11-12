import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar, X, ChevronDown } from 'lucide-react';
import DateRangePicker from './DateRangePicker';

interface DueDateFilterProps {
  value: string; // 'overdue', 'today', 'this_week', 'next_week', 'this_month', 'no_due_date', or custom date range
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  label?: string; // Optional: label for the filter
}

// Preset options - moved outside component to avoid recreation
const PRESET_OPTIONS = [
  { id: '', label: 'Tất cả hạn chót' },
  { id: 'overdue', label: 'Quá hạn' },
  { id: 'today', label: 'Hôm nay' },
  { id: 'this_week', label: 'Tuần này' },
  { id: 'next_week', label: 'Tuần sau' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'no_due_date', label: 'Không có hạn chót' },
  { id: 'custom', label: 'Tùy chỉnh...' }
] as const;

export default function DueDateFilter({
  value,
  onChange,
  placeholder = "Tất cả hạn chót",
  className = "",
  label
}: DueDateFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [filterMode, setFilterMode] = useState<'preset' | 'custom'>('preset');
  const [customDateRange, setCustomDateRange] = useState<{ startDate: string | null; endDate: string | null } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Determine if current value is a preset or custom date range
  useEffect(() => {
    const isPreset = PRESET_OPTIONS.some(opt => opt.id === value && opt.id !== 'custom');
    const isCustom = value.startsWith('custom:') || (customDateRange !== null);
    
    if (isCustom) {
      setFilterMode('custom');
      // Parse custom date range from value if it exists
      if (value.startsWith('custom:')) {
        const [start, end] = value.replace('custom:', '').split('|');
        if (start && end) {
          setCustomDateRange({
            startDate: start !== 'null' ? start : null,
            endDate: end !== 'null' ? end : null
          });
        }
      }
    } else {
      setFilterMode('preset');
    }
  }, [value, customDateRange]);

  const displayValue = useMemo(() => {
    if (filterMode === 'custom' && customDateRange) {
      if (customDateRange.startDate && customDateRange.endDate) {
        const start = new Date(customDateRange.startDate).toLocaleDateString('vi-VN');
        const end = new Date(customDateRange.endDate).toLocaleDateString('vi-VN');
        return `${start} - ${end}`;
      }
      if (customDateRange.startDate) {
        return `Từ ${new Date(customDateRange.startDate).toLocaleDateString('vi-VN')}`;
      }
      if (customDateRange.endDate) {
        return `Đến ${new Date(customDateRange.endDate).toLocaleDateString('vi-VN')}`;
      }
    }
    
    const selectedPreset = PRESET_OPTIONS.find(opt => opt.id === value);
    return selectedPreset ? selectedPreset.label : placeholder;
  }, [filterMode, customDateRange, value, placeholder]);

  const handlePresetSelect = useCallback((presetId: string) => {
    if (presetId === 'custom') {
      setFilterMode('custom');
      setCustomDateRange(null);
    } else {
      setFilterMode('preset');
      onChange(presetId);
      setIsOpen(false);
    }
  }, [onChange]);

  const handleCustomDateRangeChange = useCallback((range: { startDate: string | null; endDate: string | null } | null) => {
    setCustomDateRange(range);
    if (range) {
      const valueStr = `custom:${range.startDate || 'null'}|${range.endDate || 'null'}`;
      onChange(valueStr);
    } else {
      onChange('');
    }
  }, [onChange]);

  const handleClear = useCallback(() => {
    setFilterMode('preset');
    setCustomDateRange(null);
    onChange('');
    setIsOpen(false);
  }, [onChange]);

  const handleBackToPreset = useCallback(() => {
    setFilterMode('preset');
    setCustomDateRange(null);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-sm min-h-[42px] text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors flex items-center justify-between"
      >
        <span className={`text-sm ${!value || value === '' ? 'text-gray-500' : 'text-gray-900'}`}>
          {displayValue}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'transform rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[320px]">
          {filterMode === 'preset' ? (
            <>
              {/* Preset Options */}
              <div className="p-2">
                {PRESET_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => handlePresetSelect(option.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                      value === option.id
                        ? 'bg-primary-50 text-primary-600 font-medium'
                        : 'hover:bg-gray-50 text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Custom Date Range Picker */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900">Chọn khoảng ngày</h3>
                  <button
                    type="button"
                    onClick={handleBackToPreset}
                    className="text-xs text-primary-600 hover:text-primary-700"
                  >
                    ← Quay lại
                  </button>
                </div>
                <DateRangePicker
                  value={customDateRange}
                  onChange={handleCustomDateRangeChange}
                  placeholder="Chọn khoảng ngày"
                />
              </div>
              <div className="p-3 border-t border-gray-200 bg-gray-50 flex justify-end">
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

