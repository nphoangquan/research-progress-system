import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GlobalSearch from '../GlobalSearch';
import ConnectionStatus from '../ConnectionStatus';
import { Bell, User, LogOut, Menu } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
}

export default function TopBar({
  onToggleSidebar
}: TopBarProps) {
  const { getCurrentUser, logout } = useAuth();
  const user = getCurrentUser();

  if (!user) {
    return null;
  }

  return (
    <header className="sticky top-0 z-30">
      <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
        {/* Left: Sidebar Toggle + Search */}
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors lg:hidden"
            title="Menu"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex-1 max-w-2xl">
            <GlobalSearch />
          </div>
        </div>

        {/* Right: Status, Notifications, User Menu */}
        <div className="flex items-center gap-2">
          <ConnectionStatus />
          
          <Link
            to="/notifications"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors relative"
            title="Thông báo"
          >
            <Bell className="w-5 h-5" />
            {/* Badge would go here */}
          </Link>
          
          <Link
            to="/profile"
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Hồ sơ"
          >
            <User className="w-5 h-5" />
          </Link>
          
          <button
            onClick={logout}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}

