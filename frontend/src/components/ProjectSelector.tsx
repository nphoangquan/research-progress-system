import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { 
  Search, 
  X, 
  Check, 
  FolderOpen,
  Users,
  Calendar,
  CheckSquare
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  startDate: string;
  endDate: string;
  lecturer: {
    id: string;
    fullName: string;
  };
  students?: Array<{
    student: {
      id: string;
      fullName: string;
    };
  }>;
  _count?: {
    tasks: number;
    documents: number;
  };
}

interface ProjectSelectorProps {
  selectedProjects: string[];
  onSelectionChange: (projectIds: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
  className?: string;
}

export default function ProjectSelector({ 
  selectedProjects, 
  onSelectionChange, 
  multiple = false,
  placeholder = "Select projects...",
  className = ""
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [localSelection, setLocalSelection] = useState<string[]>(selectedProjects);

  // Fetch projects
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await api.get('/projects');
      return response.data.projects as Project[];
    },
  });

  // Filter projects based on search
  const filteredProjects = projects?.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.lecturer.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Update local selection when prop changes
  useEffect(() => {
    setLocalSelection(selectedProjects);
  }, [selectedProjects]);

  const handleProjectToggle = (projectId: string) => {
    if (multiple) {
      const currentSelection = localSelection || [];
      const newSelection = currentSelection.includes(projectId)
        ? currentSelection.filter(id => id !== projectId)
        : [...currentSelection, projectId];
      setLocalSelection(newSelection);
    } else {
      setLocalSelection([projectId]);
      setIsOpen(false);
    }
  };

  const handleConfirm = () => {
    onSelectionChange(localSelection || []);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalSelection(selectedProjects || []);
    setIsOpen(false);
  };

  const handleSelectAll = () => {
    if (filteredProjects) {
      const allProjectIds = filteredProjects.map(project => project.id);
      setLocalSelection(allProjectIds);
    }
  };

  const handleClearAll = () => {
    setLocalSelection([]);
  };

  const getSelectedProjectNames = () => {
    if (!projects) return placeholder;
    const selected = projects.filter(p => selectedProjects.includes(p.id));
    if (selected.length === 0) return placeholder;
    if (selected.length === 1) return selected[0].title;
    return `${selected.length} projects selected`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-3 text-left bg-white border border-gray-300 rounded-lg shadow-sm hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className={`${(selectedProjects?.length || 0) === 0 ? 'text-gray-500' : 'text-gray-900'}`}>
            {getSelectedProjectNames()}
          </span>
          <FolderOpen className="w-5 h-5 text-gray-400" />
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
                  {multiple ? 'Select Projects' : 'Select Project'}
                </h3>
                <p className="text-sm text-gray-600">
                  {multiple ? 'Choose one or more projects' : 'Choose a project'}
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
                  placeholder="Search projects by title, description, or lecturer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              {/* Action Buttons */}
              {multiple && filteredProjects && filteredProjects.length > 0 && (
                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 text-sm font-medium text-primary-600 bg-primary-50 border border-primary-200 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    Select All ({filteredProjects.length})
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

            {/* Projects List */}
            <div className="max-h-96 overflow-y-auto">
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading projects...</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-8 text-center">
                  <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">
                    {searchTerm ? 'No projects found matching your search' : 'No projects available'}
                  </p>
                </div>
              ) : (
                <div className="p-4 space-y-2">
                  {filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      onClick={() => handleProjectToggle(project.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        (localSelection || []).includes(project.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className={`flex-shrink-0 w-3 h-3 rounded-full flex items-center justify-center ${
                              (localSelection || []).includes(project.id) ? 'bg-primary-500' : 'bg-gray-300'
                            }`}>
                              {(localSelection || []).includes(project.id) && (
                                <Check className="w-2 h-2 text-white" />
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-gray-900 truncate">
                              {project.title}
                            </h4>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                              {project.status.replace('_', ' ')}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {project.description}
                          </p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <div className="flex items-center space-x-1">
                              <Users className="w-3 h-3" />
                              <span>{(project.students?.length || 0) + 1} members</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <CheckSquare className="w-3 h-3" />
                              <span>{project._count?.tasks || 0} tasks</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-3 h-3" />
                              <span>{new Date(project.startDate).toLocaleDateString()}</span>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>Progress</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                              <div
                                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${project.progress}%` }}
                              ></div>
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
                {localSelection.length} project{localSelection.length !== 1 ? 's' : ''} selected
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
                  {multiple ? 'Select Projects' : 'Select Project'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}