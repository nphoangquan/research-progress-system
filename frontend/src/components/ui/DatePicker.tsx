import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

interface DatePickerProps {
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export default function DatePicker({ 
  value, 
  onChange, 
  placeholder = "Chọn ngày", 
  className = "",
  disabled = false 
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(
    value ? new Date(value) : null
  );
  const [currentMonth, setCurrentMonth] = useState(
    selectedDate || new Date()
  );
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update selectedDate when value prop changes
  useEffect(() => {
    setSelectedDate(value ? new Date(value) : null);
    if (value) {
      setCurrentMonth(new Date(value));
    }
  }, [value]);

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onChange(date.toISOString().split('T')[0]);
    setIsOpen(false);
  };

  const handleClearDate = () => {
    setSelectedDate(null);
    onChange(null);
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    handleDateSelect(today);
  };

  const handleNoDueDateClick = () => {
    handleClearDate();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newMonth = new Date(prev);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const getDaysInMonth = (date: Date) => {
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
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const days = getDaysInMonth(currentMonth);

  return (
    <div className={`relative ${className}`} ref={datePickerRef}>
      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={formatDate(selectedDate)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : 'cursor-pointer'
          }`}
        />
        <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-2">
          {selectedDate && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearDate();
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
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[280px]">
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
              {currentMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
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
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(day => (
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
                      className={`w-full h-full text-sm rounded transition-colors ${
                        isSelected(day)
                          ? 'bg-primary-600 text-white'
                          : isToday(day)
                          ? 'bg-primary-100 text-primary-600 font-medium'
                          : 'hover:bg-gray-100 text-gray-900'
                      }`}
                    >
                      {day.getDate()}
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
            <button
              type="button"
              onClick={handleNoDueDateClick}
              className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Không có hạn chót
            </button>
            <button
              type="button"
              onClick={handleTodayClick}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
            >
              Hôm nay
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
