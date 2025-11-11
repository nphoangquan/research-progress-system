import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  value: { startDate: string | null; endDate: string | null } | null;
  onChange: (range: { startDate: string | null; endDate: string | null } | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function DateRangePicker({ 
  value, 
  onChange, 
  placeholder = "Chọn khoảng ngày", 
  className = "",
  disabled = false 
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(
    value?.startDate ? new Date(value.startDate) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(
    value?.endDate ? new Date(value.endDate) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    startDate || endDate || new Date()
  );
  const [selectingStart, setSelectingStart] = useState(true);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
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

  // Update dates when value prop changes
  useEffect(() => {
    setStartDate(value?.startDate ? new Date(value.startDate) : null);
    setEndDate(value?.endDate ? new Date(value.endDate) : null);
    if (value?.startDate) {
      setCurrentMonth(new Date(value.startDate));
    } else if (value?.endDate) {
      setCurrentMonth(new Date(value.endDate));
    }
  }, [value]);

  const formatDate = useCallback((date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }, []);

  const formatDisplayValue = useMemo(() => {
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) {
      return `Từ ${formatDate(startDate)}`;
    }
    if (endDate) {
      return `Đến ${formatDate(endDate)}`;
    }
    return '';
  }, [startDate, endDate, formatDate]);

  const handleDateSelect = useCallback((date: Date) => {
    if (selectingStart) {
      // If selecting start date and end date exists and is before this date, clear end date
      if (endDate && date > endDate) {
        setStartDate(date);
        setEndDate(null);
        setSelectingStart(false);
      } else {
        setStartDate(date);
        setSelectingStart(false);
      }
    } else {
      // Selecting end date
      let finalStart = startDate;
      let finalEnd = date;
      
      if (startDate && date < startDate) {
        // If end date is before start date, swap them
        finalStart = date;
        finalEnd = startDate;
        setStartDate(date);
        setEndDate(startDate);
      } else {
        setEndDate(date);
      }
      
      // Auto-apply when both dates are selected
      if (finalStart && finalEnd) {
        onChange({
          startDate: finalStart.toISOString().split('T')[0],
          endDate: finalEnd.toISOString().split('T')[0]
        });
        setIsOpen(false);
        return;
      }
      setSelectingStart(true);
    }
  }, [selectingStart, startDate, endDate, onChange]);

  const handleApply = useCallback(() => {
    // Validate: ensure endDate is not before startDate
    if (startDate && endDate && endDate < startDate) {
      // Swap if needed
      onChange({
        startDate: endDate.toISOString().split('T')[0],
        endDate: startDate.toISOString().split('T')[0]
      });
    } else {
      onChange({
        startDate: startDate ? startDate.toISOString().split('T')[0] : null,
        endDate: endDate ? endDate.toISOString().split('T')[0] : null
      });
    }
    setIsOpen(false);
  }, [startDate, endDate, onChange]);

  const handleClear = useCallback(() => {
    setStartDate(null);
    setEndDate(null);
    onChange(null);
    setIsOpen(false);
  }, [onChange]);

  const handleTodayClick = useCallback(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    if (selectingStart) {
      setStartDate(today);
      setSelectingStart(false);
    } else {
      setEndDate(today);
      setSelectingStart(true);
    }
  }, [selectingStart]);

  const navigateMonth = useCallback((direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  }, []);

  const getDaysInMonth = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, []);

  const isToday = useCallback((date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    return compareDate.getTime() === today.getTime();
  }, []);

  const isInRange = useCallback((date: Date) => {
    if (!startDate || !endDate) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const compareStart = new Date(startDate);
    compareStart.setHours(0, 0, 0, 0);
    const compareEnd = new Date(endDate);
    compareEnd.setHours(0, 0, 0, 0);
    return compareDate >= compareStart && compareDate <= compareEnd;
  }, [startDate, endDate]);

  const isStartDate = useCallback((date: Date) => {
    if (!startDate) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const compareStart = new Date(startDate);
    compareStart.setHours(0, 0, 0, 0);
    return compareDate.getTime() === compareStart.getTime();
  }, [startDate]);

  const isEndDate = useCallback((date: Date) => {
    if (!endDate) return false;
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    const compareEnd = new Date(endDate);
    compareEnd.setHours(0, 0, 0, 0);
    return compareDate.getTime() === compareEnd.getTime();
  }, [endDate]);

  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth, getDaysInMonth]);

  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                      'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];
  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  return (
    <div className={`relative ${className}`} ref={datePickerRef}>
      {/* Input Field */}
      <div className="relative">
          <input
          type="text"
          value={formatDisplayValue}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {(startDate || endDate) && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              disabled={disabled}
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Calendar className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200">
            <button
              type="button"
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h3 className="text-sm font-medium text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Days of week header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map(day => (
                <div key={day} className="text-xs font-medium text-gray-500 text-center py-1">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, index) => (
                <div key={index} className="aspect-square">
                  {day ? (
                    <button
                      type="button"
                      onClick={() => handleDateSelect(day)}
                      className={`w-full h-full text-sm rounded transition-colors relative ${
                        isStartDate(day) || isEndDate(day)
                          ? 'bg-primary-600 text-white font-medium z-10'
                          : isInRange(day)
                          ? 'bg-primary-100 text-primary-600'
                          : isToday(day)
                          ? 'bg-primary-50 text-primary-600 font-medium border-2 border-primary-300'
                          : !selectingStart && startDate && day < startDate
                          ? 'opacity-50 cursor-not-allowed'
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                      disabled={!selectingStart && startDate && day < startDate}
                      title={
                        isStartDate(day) ? 'Ngày bắt đầu' :
                        isEndDate(day) ? 'Ngày kết thúc' :
                        isInRange(day) ? 'Trong khoảng' :
                        isToday(day) ? 'Hôm nay' : ''
                      }
                    >
                      {day.getDate()}
                      {isStartDate(day) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-primary-600"></span>
                      )}
                      {isEndDate(day) && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-white rounded-full border-2 border-primary-600"></span>
                      )}
                    </button>
                  ) : (
                    <div></div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between p-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <span>{selectingStart ? 'Chọn ngày bắt đầu' : 'Chọn ngày kết thúc'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleClear}
                className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={handleTodayClick}
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="text-sm text-white bg-primary-600 hover:bg-primary-700 font-medium px-3 py-1 rounded transition-colors"
              >
                Áp dụng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

