import { useState } from 'react';
import { Settings, Globe, Mail, HardDrive, Shield, Wrench, Activity } from 'lucide-react';
import GeneralSettings from './settings/GeneralSettings';
import EmailSettings from './settings/EmailSettings';
import StorageSettings from './settings/StorageSettings';
import SecuritySettings from './settings/SecuritySettings';
import MaintenanceSettings from './settings/MaintenanceSettings';
import SystemHealth from './settings/SystemHealth';

type TabId = 'general' | 'email' | 'storage' | 'security' | 'maintenance' | 'health';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const tabs: Tab[] = [
  { id: 'general', label: 'Chung', icon: Globe },
  { id: 'email', label: 'Email', icon: Mail },
  { id: 'storage', label: 'Lưu trữ', icon: HardDrive },
  { id: 'security', label: 'Bảo mật', icon: Shield },
  { id: 'maintenance', label: 'Bảo trì', icon: Wrench },
  { id: 'health', label: 'Trạng thái', icon: Activity },
];

export default function SystemSettings() {
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'email':
        return <EmailSettings />;
      case 'storage':
        return <StorageSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'maintenance':
        return <MaintenanceSettings />;
      case 'health':
        return <SystemHealth />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="page-header mb-6">
        <div className="flex items-center gap-3">
          <Settings className="w-6 h-6 text-gray-600" />
          <h1 className="page-title">Cài đặt Hệ thống</h1>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Quản lý cấu hình và thiết lập hệ thống
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-1 px-4" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                    ${
                      isActive
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">{renderTabContent()}</div>
      </div>
    </div>
  );
}

