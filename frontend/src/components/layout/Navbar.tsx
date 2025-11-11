import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import ConnectionStatus from '../ConnectionStatus';
import GlobalSearch from '../GlobalSearch';
import type { User } from '../../types/auth';
import researchLogo from '../../assets/images/research_logo.png';
import { 
  LayoutDashboard, 
  FolderOpen, 
  CheckSquare,
  FileText,
  BookOpen,
  User as UserIcon, 
  Bell,
  Settings,
  BarChart3,
  Activity,
  Menu,
  X,
  LogOut
} from 'lucide-react';

interface NavbarProps {
  user: User;
}

export default function Navbar({ user }: NavbarProps) {
  const location = useLocation();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-medium border-b border-gray-100 sticky top-0 z-50">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <Link to="/dashboard" className="flex items-center">
              <img 
                src={researchLogo} 
                alt="Research Progress" 
                className="h-56 object-contain"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-1">
            <Link
              to="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/dashboard')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-2" />
              Bảng điều khiển
            </Link>
            <Link
              to="/projects"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/projects')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Dự án
            </Link>
            <Link
              to="/tasks"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/tasks')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-2" />
              Nhiệm vụ
            </Link>
            <Link
              to="/documents"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/documents')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Tài liệu
            </Link>
            <Link
              to="/library"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/library')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Thư viện
            </Link>
            <Link
              to="/analytics"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/analytics')
                  ? 'bg-primary-100 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Phân tích
            </Link>
          </div>

          {/* Right Side - Search, Notifications, User */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <GlobalSearch />
            <ConnectionStatus />
            <Link
              to="/user-activity"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Hoạt động Người dùng"
            >
              <Activity className="w-5 h-5" />
            </Link>
            <Link
              to="/profile"
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Hồ sơ"
            >
              <UserIcon className="w-5 h-5" />
            </Link>
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <GlobalSearch />
            <button
              onClick={logout}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Đăng xuất"
            >
              <LogOut className="w-5 h-5" />
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <Link
              to="/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/dashboard')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 inline mr-2" />
              Bảng điều khiển
            </Link>
            <Link
              to="/projects"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/projects')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FolderOpen className="w-4 h-4 inline mr-2" />
              Dự án
            </Link>
            <Link
              to="/tasks"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/tasks')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CheckSquare className="w-4 h-4 inline mr-2" />
              Nhiệm vụ
            </Link>
            <Link
              to="/documents"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/documents')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Tài liệu
            </Link>
            <Link
              to="/library"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/library')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BookOpen className="w-4 h-4 inline mr-2" />
              Thư viện
            </Link>
            <Link
              to="/analytics"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-sm font-medium ${
                isActive('/analytics')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Phân tích
            </Link>
            <Link
              to="/user-activity"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Activity className="w-4 h-4 inline mr-2" />
              Hoạt động Người dùng
            </Link>
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <UserIcon className="w-4 h-4 inline mr-2" />
              Hồ sơ
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
