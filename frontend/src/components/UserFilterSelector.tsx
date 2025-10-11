import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { 
  Search, 
  X, 
  Check, 
  User,
  Mail,
  Shield,
  GraduationCap
} from 'lucide-react';

interface User {
  id: string;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
  studentId?: string;
  isActive: boolean;
}

interface UserFilterSelectorProps {
  selectedUsers: string[];
  onSelectionChange: (userIds: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export default function UserFilterSelector({ 
  selectedUsers, 
  onSelectionChange, 
  multiple = true,
  placeholder = "All Uploaders",
  className = ""
}: UserFilterSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedUsers);

  // Fetch users
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.data.users as User[];
    },
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
    } else {
      setLocalSelection([userId]);
      setIsOpen(false);
    }
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedUsers);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    if (filteredUsers) {
      const allUserIds = filteredUsers.map(user => user.id);
      setLocalSelection(allUserIds);
    }
  };

  const handleClearAll = () => {
    setLocalSelection([]);
  };

  const getSelectedUserNames = () => {
    if (!users) return placeholder;
    const selected = users.filter(u => selectedUsers.includes(u.id));
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0].fullName;
    return `${selected.length} users selected`;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800';
      case 'LECTURER':
        return 'bg-blue-100 text-blue-800';
      case 'STUDENT':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Shield className="w-3 h-3" />;
      case 'LECTURER':
        return <GraduationCap className="w-3 h-3" />;
      case 'STUDENT':
        return <User className="w-3 h-3" />;
      default:
        return <User className="w-3 h-3" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`${selectedUsers.length === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {getSelectedUserNames()}
          </span>
          <User className="w-4 h-4 text-gray-400" />
        </div>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] mx-4 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Filter by Uploaders
                </h3>
                <p className="text-sm text-gray-600">
                  Choose users to filter documents
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-6 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search users by name, email, or student ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Action Buttons */}
              {multiple && filteredUsers && filteredUsers.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Select All ({filteredUsers.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            {/* Users List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No users found matching your search' : 'No users available'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleUserToggle(user.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        localSelection.includes(user.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center ${
                              localSelection.includes(user.id) ? 'bg-primary-500' : 'bg-gray-300'
                            }`}>
                              {localSelection.includes(user.id) && (
                                <Check className="w-2 h-2 text-white" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {user.fullName}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getRoleColor(user.role)}`}>
                              {user.role}
                            </span>
                            {!user.isActive && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                                Inactive
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span className="truncate">{user.email}</span>
                            </div>
                            {user.studentId && (
                              <div className="flex items-center space-x-1">
                                <GraduationCap className="w-3 h-3" />
                                <span>{user.studentId}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              {getRoleIcon(user.role)}
                              <span>{user.role}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <div className="text-sm text-gray-600">
                {localSelection.length} user{localSelection.length !== 1 ? 's' : ''} selected
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Apply Filter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
