import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { filterMenuByRole } from "../../config/menu.config";
import SidebarItem from "./SidebarItem";
import { useGeneralSettings } from "../../hooks/useGeneralSettings";
import { Menu, ChevronLeft, GraduationCap } from "lucide-react";

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  isCollapsed,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
  const { getCurrentUser } = useAuth();
  const user = getCurrentUser();
  const { data } = useGeneralSettings();

  const filteredMenu = useMemo(() => {
    if (!user) return [];
    return filterMenuByRole(user.role);
  }, [user]);

  const systemName = (data as any)?.systemName || 'Research';
  const logoUrl = (data as any)?.logoUrl;

  const handleAction = (action: string) => {
    if (action === "logout") onLogout();
  };

  if (!user) return null;

  return (
    <aside
      className={`
        fixed left-0 top-0 h-full bg-white border-r border-gray-200
        transition-all duration-300 ease-in-out z-40
        ${isCollapsed ? "w-16" : "w-64"}
        ${isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"}
        flex flex-col
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-4">
        {!isCollapsed && (
          <Link
            to="/dashboard"
            className="flex items-center gap-2 flex-shrink-0"
          >
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={systemName}
                className="w-8 h-8 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const icon = e.currentTarget.parentElement?.querySelector('.logo-fallback-icon') as HTMLElement;
                  if (icon) icon.style.display = 'block';
                }}
              />
            ) : null}
            <GraduationCap 
              className={`w-8 h-8 text-gray-600 logo-fallback-icon ${logoUrl ? 'hidden' : ''}`}
            />
            <span className="font-bold text-lg text-gray-900 truncate">
              {systemName.length > 20 ? systemName.substring(0, 20) + '...' : systemName}
            </span>
          </Link>
        )}

        {isCollapsed && logoUrl && (
          <Link
            to="/dashboard"
            className="flex items-center justify-center flex-shrink-0"
            title={systemName}
          >
            <img 
              src={logoUrl} 
              alt={systemName}
              className="w-8 h-8 object-contain"
            />
          </Link>
        )}

        <div className="flex-1" />

        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          {isCollapsed ? (
            <Menu className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-6">
          {filteredMenu.map((section) => (
            <div key={section.id}>
              {!isCollapsed && section.label && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {section.label}
                </h3>
              )}
              <div className="space-y-1">
                {section.items.map((item) => (
                  <SidebarItem
                    key={item.id}
                    item={item}
                    isCollapsed={isCollapsed}
                    onAction={handleAction}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>

      {/* User info */}
      {!isCollapsed && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-medium text-sm">
                {user.fullName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.fullName}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
