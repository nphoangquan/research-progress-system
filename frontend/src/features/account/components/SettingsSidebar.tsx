import type { AccountSettingsTab } from '../hooks/useAccountSettings';
import { User, Shield, Settings } from 'lucide-react';

interface SettingsSidebarProps {
  activeTab: AccountSettingsTab;
  onTabChange: (tab: AccountSettingsTab) => void;
}

const NAV_ITEMS: Array<{
  key: AccountSettingsTab;
  label: string;
  icon: typeof User;
}> = [
  { key: 'profile', label: 'Thông tin Hồ sơ', icon: User },
  { key: 'security', label: 'Bảo mật & Mật khẩu', icon: Shield },
  { key: 'preferences', label: 'Tùy chọn', icon: Settings }
];

export function SettingsSidebar({ activeTab, onTabChange }: SettingsSidebarProps) {
  return (
    <div className="card">
      <div className="card-body p-0">
        <nav className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium rounded-lg transition-colors ${
                activeTab === key
                  ? 'bg-primary-50 text-primary-700 border-r-2 border-primary-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mr-3" />
              {label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
