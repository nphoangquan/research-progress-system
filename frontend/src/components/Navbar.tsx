import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import ConnectionStatus from './ConnectionStatus';
import GlobalSearch from './GlobalSearch';
import type { User } from '../types/auth';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare,
  FileText,
  User as UserIcon, 
  LogOut,
  Bell,
  Settings,
  BarChart3,
  Activity,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const { logout } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-medium border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/dashboard" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <span className="text-xl font-bold text-gray-900">
                Research Progress
              </span>
            </Link>
          </div>
          
          {/* Navigation Links - Left Side */}
          <div className="hidden md:flex items-center flex-1 pl-8 ml-10">
            <div className="flex items-center space-x-1">
            <Link 
              to="/dashboard" 
              className={`nav-link ${isActive('/dashboard') ? 'nav-link-active' : ''}`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
            <Link 
              to="/projects" 
              className={`nav-link ${isActive('/projects') ? 'nav-link-active' : ''}`}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Projects
            </Link>
            {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
              <>
                <Link 
                  to="/tasks" 
                  className={`nav-link ${isActive('/tasks') ? 'nav-link-active' : ''}`}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Link>
                <Link 
                  to="/documents" 
                  className={`nav-link ${isActive('/documents') ? 'nav-link-active' : ''}`}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Documents
                </Link>
                <Link 
                  to="/analytics" 
                  className={`nav-link ${isActive('/analytics') ? 'nav-link-active' : ''}`}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Link>
                <Link 
                  to="/user-activity" 
                  className={`nav-link ${isActive('/user-activity') ? 'nav-link-active' : ''}`}
                >
                  <Activity className="w-4 h-4 mr-2" />
                  Activity
                </Link>
              </>
            )}
            </div>
          </div>
          
          {/* User Menu - Right Side */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Search */}
          <GlobalSearch />
          
          {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Bell className="w-5 h-5" />
            </button>
            
            {/* Settings */}
            <Link to="/profile" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200">
              <Settings className="w-5 h-5" />
            </Link>
            
            {/* User Profile */}
            <div className="flex items-center space-x-3 pl-3 border-l border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-primary-600" />
                </div>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName || 'Loading...'}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              
              {/* Connection Status */}
              <ConnectionStatus />
              
              {/* Logout */}
              <button
                onClick={handleLogout}
                className="btn-ghost p-2 text-gray-400 hover:text-error-600 hover:bg-error-50"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <Link 
                to="/dashboard" 
                className={`nav-link-mobile ${isActive('/dashboard') ? 'nav-link-mobile-active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Link>
              <Link 
                to="/projects" 
                className={`nav-link-mobile ${isActive('/projects') ? 'nav-link-mobile-active' : ''}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                Projects
              </Link>
              {(user?.role === 'ADMIN' || user?.role === 'LECTURER') && (
                <>
                  <Link 
                    to="/tasks" 
                    className={`nav-link-mobile ${isActive('/tasks') ? 'nav-link-mobile-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <CheckSquare className="w-4 h-4 mr-2" />
                    Tasks
                  </Link>
                  <Link 
                    to="/documents" 
                    className={`nav-link-mobile ${isActive('/documents') ? 'nav-link-mobile-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Documents
                  </Link>
                  <Link 
                    to="/analytics" 
                    className={`nav-link-mobile ${isActive('/analytics') ? 'nav-link-mobile-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Analytics
                  </Link>
                  <Link 
                    to="/user-activity" 
                    className={`nav-link-mobile ${isActive('/user-activity') ? 'nav-link-mobile-active' : ''}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Activity className="w-4 h-4 mr-2" />
                    User Activity
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}