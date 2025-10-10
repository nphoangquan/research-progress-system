import { useState } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';

interface SelectDropdownProps {
  label: string;
  options: Array<{ id: string; fullName: string; studentId?: string; email?: string }>;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
  icon?: React.ReactNode;
}

export default function SelectDropdown({
  label,
  options,
  value,
  onChange,
  error,
  placeholder = "Select an option...",
  required = false,
  icon
}: SelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find(option => option.id === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10">
            {icon}
          </div>
        )}
        
        <div 
          className={`border border-gray-300 rounded-lg ${icon ? 'pl-10' : 'pl-3'} pr-10 py-2 min-h-[42px] cursor-pointer transition-colors ${
            error ? 'border-error-300' : 'hover:border-gray-400'
          } ${isOpen ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center justify-between">
            <span className={`text-sm ${selectedOption ? 'text-gray-900' : 'text-gray-500'}`}>
              {selectedOption ? `${selectedOption.fullName}${selectedOption.studentId || selectedOption.email ? ` (${selectedOption.studentId || selectedOption.email})` : ''}` : placeholder}
            </span>
          </div>
        </div>
        
        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {options.map((option) => (
              <div
                key={option.id}
                className={`px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm ${
                  value === option.id ? 'bg-primary-50 text-primary-900' : ''
                }`}
                onClick={() => {
                  onChange(option.id);
                  setIsOpen(false);
                }}
              >
                {option.fullName}{option.studentId || option.email ? ` (${option.studentId || option.email})` : ''}
              </div>
            ))}
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
