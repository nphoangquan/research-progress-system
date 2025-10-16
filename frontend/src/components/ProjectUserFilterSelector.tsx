import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search, X, Users } from 'lucide-react';
import api from '../lib/axios';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: string;
  studentId?: string;
}

interface ProjectUserFilterSelectorProps {
  projectId: string;
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ProjectUserFilterSelector({
  projectId,
  selectedUsers,
  onSelectionChange,
  multiple = false,
  placeholder = "Select users...",
  className = ""
}: ProjectUserFilterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedUsers);

  // Fetch project members
  const { data: users, isLoading } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: async () => {
      const response = await api.get(`/users/project/${projectId}`);
      return response.data.users as User[];
    },
    enabled: !!projectId,
  });

  // Filter users based on search
  const filteredUsers = users?.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.studentId && user.studentId.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  // Update local selection when prop changes
  useEffect(() => {
    setLocalSelection(selectedUsers);
  }, [selectedUsers]);

  const handleUserToggle = (userId: string) => {
    if (multiple) {
      const newSelection = localSelection.includes(userId)
        ? localSelection.filter(id => id !== userId)
        : [...localSelection, userId];
      setLocalSelection(newSelection);
      onSelectionChange(newSelection);
    } else {
      const newSelection = localSelection.includes(userId) ? [] : [userId];
      setLocalSelection(newSelection);
      onSelectionChange(newSelection);
      setIsOpen(false);
    }
  };

  const handleClearSelection = () => {
    setLocalSelection([]);
    onSelectionChange([]);
  };

  const getDisplayText = () => {
    if (localSelection.length === 0) {
      return placeholder;
    }
    
    if (multiple) {
      return `${localSelection.length} user${localSelection.length !== 1 ? 's' : ''} selected`;
    }
    
    const selectedUser = users?.find(user => user.id === localSelection[0]);
    return selectedUser?.fullName || placeholder;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-red-100 text-red-800';
      case 'LECTURER': return 'bg-blue-100 text-blue-800';
      case 'STUDENT': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
      >
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-gray-400" />
          <span className={`${localSelection.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {getDisplayText()}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {localSelection.length > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearSelection();
              }}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          {/* Search */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* User List */}
          <div className="max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="p-3 text-center text-gray-500">
                Loading users...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-3 text-center text-gray-500">
                {searchTerm ? 'No users found' : 'No users available'}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleUserToggle(user.id)}
                  className={`p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between ${
                    localSelection.includes(user.id) ? 'bg-primary-50' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-600">
                        {user.fullName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {user.fullName}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.email}
                        {user.studentId && ` • ${user.studentId}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                    {localSelection.includes(user.id) && (
                      <div className="w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
