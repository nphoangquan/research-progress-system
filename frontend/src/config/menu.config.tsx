import { ReactNode } from 'react';
import {
  LayoutDashboard,
  FolderOpen,
  CheckSquare,
  FileText,
  BarChart3,
  Activity,
  User,
  Bell,
  Settings,
  LogOut,
  Users,
  HelpCircle,
  Tag
} from 'lucide-react';

export type Role = 'ADMIN' | 'LECTURER' | 'STUDENT';

export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  path?: string | null;
  roles?: Role[];
  children?: MenuItem[];
  section?: string;
  badge?: number;
  action?: 'logout' | 'toggle-sidebar';
  exact?: boolean; // For exact path matching
}

export interface MenuSection {
  id: string;
  label: string;
  items: MenuItem[];
  roles?: Role[];
}

/**
 * Menu configuration organized by functional domains
 * Follows best practices: config-based, role-based, domain-driven grouping
 */
export const menuConfig: MenuSection[] = [
  {
    id: 'overview',
    label: 'TỔNG QUAN',
    items: [
      {
        id: 'dashboard',
        label: 'Bảng điều khiển',
        icon: <LayoutDashboard className="w-5 h-5" />,
        path: '/dashboard',
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        exact: true
      },
      {
        id: 'analytics',
        label: 'Phân tích',
        icon: <BarChart3 className="w-5 h-5" />,
        path: '/analytics',
        roles: ['ADMIN', 'LECTURER', 'STUDENT']
      },
      {
        id: 'user-activity',
        label: 'Hoạt động Người dùng',
        icon: <Activity className="w-5 h-5" />,
        path: '/user-activity',
        roles: ['ADMIN', 'LECTURER', 'STUDENT']
      }
    ]
  },
  {
    id: 'research',
    label: 'QUẢN LÝ NGHIÊN CỨU',
    items: [
      {
        id: 'projects',
        label: 'Dự án',
        icon: <FolderOpen className="w-5 h-5" />,
        path: '/projects',
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        children: [
          {
            id: 'projects-all',
            label: 'Tất cả Dự án',
            path: '/projects',
            roles: ['ADMIN', 'LECTURER', 'STUDENT'],
            exact: true
          },
          {
            id: 'projects-archived',
            label: 'Dự án Đã Lưu trữ',
            path: '/projects/archived',
            roles: ['ADMIN', 'LECTURER']
          },
          {
            id: 'projects-create',
            label: 'Tạo Dự án Mới',
            path: '/projects/new',
            roles: ['ADMIN', 'LECTURER']
          }
        ]
      },
      {
        id: 'tasks',
        label: 'Nhiệm vụ',
        icon: <CheckSquare className="w-5 h-5" />,
        path: '/tasks',
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        children: [
          {
            id: 'tasks-all',
            label: 'Tất cả Nhiệm vụ',
            path: '/tasks',
            roles: ['ADMIN', 'LECTURER', 'STUDENT'],
            exact: true
          },
          {
            id: 'tasks-kanban',
            label: 'Kanban View',
            path: '/tasks/kanban',
            roles: ['ADMIN', 'LECTURER', 'STUDENT']
          },
          {
            id: 'tasks-create',
            label: 'Tạo Nhiệm vụ',
            path: '/tasks/new',
            roles: ['ADMIN', 'LECTURER']
          }
        ]
      },
      {
        id: 'documents',
        label: 'Tài liệu',
        icon: <FileText className="w-5 h-5" />,
        path: '/documents',
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        children: [
          {
            id: 'documents-all',
            label: 'Tất cả Tài liệu',
            path: '/documents',
            roles: ['ADMIN', 'LECTURER', 'STUDENT'],
            exact: true
          },
          {
            id: 'documents-upload',
            label: 'Tải lên Tài liệu',
            path: '/documents/upload',
            roles: ['ADMIN', 'LECTURER', 'STUDENT']
          },
          {
            id: 'library',
            label: 'Thư viện Công khai',
            path: '/library',
            roles: ['ADMIN', 'LECTURER', 'STUDENT']
          }
        ]
      }
    ]
  },
  {
    id: 'administration',
    label: 'QUẢN TRỊ',
    roles: ['ADMIN'],
    items: [
      {
        id: 'users',
        label: 'Quản lý Người dùng',
        icon: <Users className="w-5 h-5" />,
        path: '/admin/users',
        roles: ['ADMIN']
      },
      {
        id: 'system-settings',
        label: 'Cài đặt Hệ thống',
        icon: <Settings className="w-5 h-5" />,
        path: '/admin/settings',
        roles: ['ADMIN']
      },
      {
        id: 'reports',
        label: 'Báo cáo & Nhật ký',
        icon: <FileText className="w-5 h-5" />,
        path: '/admin/reports',
        roles: ['ADMIN']
      },
      {
        id: 'labels',
        label: 'Quản lý Nhãn',
        icon: <Tag className="w-5 h-5" />,
        path: '/admin/labels',
        roles: ['ADMIN']
      }
    ]
  },
  {
    id: 'support',
    label: 'HỖ TRỢ & CÀI ĐẶT',
    items: [
      {
        id: 'profile',
        label: 'Hồ sơ',
        icon: <User className="w-5 h-5" />,
        path: '/profile',
        roles: ['ADMIN', 'LECTURER', 'STUDENT']
      },
      {
        id: 'notifications',
        label: 'Thông báo',
        icon: <Bell className="w-5 h-5" />,
        path: '/notifications',
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        badge: 0 // Will be dynamic from API
      },
      {
        id: 'help',
        label: 'Trợ giúp',
        icon: <HelpCircle className="w-5 h-5" />,
        path: '/help',
        roles: ['ADMIN', 'LECTURER', 'STUDENT']
      },
      {
        id: 'logout',
        label: 'Đăng xuất',
        icon: <LogOut className="w-5 h-5" />,
        path: null,
        roles: ['ADMIN', 'LECTURER', 'STUDENT'],
        action: 'logout'
      }
    ]
  }
];

/**
 * Filter menu items based on user role
 */
export const filterMenuByRole = (role: Role): MenuSection[] => {
  return menuConfig
    .filter(section => !section.roles || section.roles.includes(role))
    .map(section => ({
      ...section,
      items: section.items
        .filter(item => !item.roles || item.roles.includes(role))
        .map(item => ({
          ...item,
          children: item.children?.filter(
            child => !child.roles || child.roles.includes(role)
          )
        }))
    }))
    .filter(section => section.items.length > 0);
};

/**
 * Flatten menu structure for easier navigation
 */
export const flattenMenuItems = (sections: MenuSection[]): MenuItem[] => {
  const items: MenuItem[] = [];
  
  sections.forEach(section => {
    section.items.forEach(item => {
      items.push(item);
      if (item.children) {
        items.push(...item.children);
      }
    });
  });
  
  return items;
};

/**
 * Find menu item by path
 */
export const findMenuItemByPath = (
  path: string,
  sections: MenuSection[]
): MenuItem | null => {
  const allItems = flattenMenuItems(sections);
  
  // Try exact match first
  let item = allItems.find(
    item => item.path === path && item.exact
  );
  
  // Fallback to startsWith match
  if (!item) {
    item = allItems.find(
      item => item.path && path.startsWith(item.path) && !item.exact
    );
  }
  
  return item || null;
};

