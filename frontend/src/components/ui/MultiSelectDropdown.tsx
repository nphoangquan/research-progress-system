import React from 'react';
import { useState } from 'react';
import { User, X, ChevronDown, AlertCircle } from 'lucide-react';

interface MultiSelectDropdownProps {
  label: string;
  options: Array<{ id: string; fullName: string; studentId?: string; email?: string }>;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export default function MultiSelectDropdown({
  label,
  options,
  selectedIds,
  onChange,
  error,
  placeholder = "Select options...",
  required = false
}: MultiSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (optionId: string) => {
    if (!selectedIds.includes(optionId)) {
      onChange([...selectedIds, optionId]);
    }
    setIsOpen(false);
  };

  const handleRemove = (optionId: string) => {
    onChange(selectedIds.filter(id => id !== optionId));
  };

  const selectedOptions = options.filter(option => selectedIds.includes(option.id));
  const availableOptions = options.filter(option => !selectedIds.includes(option.id));

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      
      <div className="relative">
        <User className="absolute left-3 top-3 text-gray-400 w-5 h-5 z-10" />
        
        <div 
          className={`border border-gray-300 rounded-lg pl-10 pr-10 py-2 min-h-[42px] cursor-pointer transition-colors ${
            error ? 'border-error-300' : 'hover:border-gray-400'
          } ${isOpen ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-2">
            {selectedOptions.length > 0 ? (
              selectedOptions.map((option) => (
                <span
                  key={option.id}
                  className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-md"
                >
                  {option.fullName}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(option.id);
                    }}
                    className="ml-1 text-primary-600 hover:text-primary-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))
            ) : (
              <span className="text-gray-500 text-sm py-1">
                {placeholder}
              </span>
            )}
          </div>
        </div>
        
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {availableOptions.length > 0 ? (
              availableOptions.map((option) => (
                <div
                  key={option.id}
                  className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                  onClick={() => handleSelect(option.id)}
                >
                  {option.fullName}{option.studentId || option.email ? ` (${option.studentId || option.email})` : ''}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No more options available
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-error-600 flex items-center">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}
    </div>
  );
}
