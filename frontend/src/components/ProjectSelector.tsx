import { useState, useEffect } from 'react';
import { Search, Check, X, AlertCircle } from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  progress: number;
  lecturer: {
    fullName: string;
  };
  students: Array<{
    student: {
      fullName: string;
    };
    role: string;
  }>;
}

interface ProjectSelectorProps {
  label: string;
  projects: Project[];
  selectedProjectIds: string[];
  onChange: (selectedIds: string[]) => void;
  error?: string;
  placeholder?: string;
  required?: boolean;
}

export default function ProjectSelector({
  label,
  projects,
  selectedProjectIds,
  onChange,
  error,
  placeholder = "Select projects...",
  required = false
}: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectAll, setSelectAll] = useState(false);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.lecturer.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Update select all state
  useEffect(() => {
    if (filteredProjects.length > 0) {
      const allSelected = filteredProjects.every(project => 
        selectedProjectIds.includes(project.id)
      );
      setSelectAll(allSelected);
    }
  }, [filteredProjects, selectedProjectIds]);

  const handleSelectAll = () => {
    if (selectAll) {
      // Deselect all filtered projects
      const filteredIds = filteredProjects.map(p => p.id);
      const newSelection = selectedProjectIds.filter(id => !filteredIds.includes(id));
      onChange(newSelection);
    } else {
      // Select all filtered projects
      const filteredIds = filteredProjects.map(p => p.id);
      const newSelection = [...new Set([...selectedProjectIds, ...filteredIds])];
      onChange(newSelection);
    }
  };

  const handleProjectToggle = (projectId: string) => {
    if (selectedProjectIds.includes(projectId)) {
      onChange(selectedProjectIds.filter(id => id !== projectId));
    } else {
      onChange([...selectedProjectIds, projectId]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    onChange(selectedProjectIds.filter(id => id !== projectId));
  };

  const selectedProjects = projects.filter(p => selectedProjectIds.includes(p.id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-error-500">*</span>}
      </label>
      
      <div className="relative">
        <div 
          className={`border border-gray-300 rounded-lg p-3 min-h-[42px] cursor-pointer transition-colors ${
            error ? 'border-error-300' : 'hover:border-gray-400'
          } ${isOpen ? 'border-primary-300 ring-1 ring-primary-200' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex flex-wrap gap-2">
            {selectedProjects.length > 0 ? (
              selectedProjects.map((project) => (
                <span
                  key={project.id}
                  className="inline-flex items-center px-2 py-1 bg-primary-100 text-primary-800 text-sm rounded-md"
                >
                  {project.title}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveProject(project.id);
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
        
        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-gray-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>

            {/* Select All */}
            {filteredProjects.length > 0 && (
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">
                    Select All ({filteredProjects.length} projects)
                  </span>
                </label>
              </div>
            )}

            {/* Projects List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleProjectToggle(project.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.id)}
                        onChange={() => handleProjectToggle(project.id)}
                        className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {project.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(project.status)}`}>
                            {project.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {project.description}
                        </p>
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                          <span>Lecturer: {project.lecturer.fullName}</span>
                          <span>{project.students.length} students</span>
                        </div>
                        <div className="mt-1">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                              <div 
                                className="bg-primary-600 h-1.5 rounded-full" 
                                style={{ width: `${project.progress}%` }}
                              ></div>
                            </div>
                            <span className="ml-2 text-xs text-gray-600">{project.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {searchTerm ? 'No projects found matching your search.' : 'No projects available.'}
                </div>
              )}
            </div>

            {/* Footer */}
            {selectedProjects.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {selectedProjects.length} project{selectedProjects.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange([])}
                    className="text-primary-600 hover:text-primary-800 font-medium"
                  >
                    Clear All
                  </button>
                </div>
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
