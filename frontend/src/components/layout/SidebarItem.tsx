import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import type { MenuItem } from '../../config/menu.config';

interface SidebarItemProps {
  item: MenuItem;
  isCollapsed: boolean;
  level?: number; // For nested items
  onAction?: (action: string) => void;
}

export default function SidebarItem({
  item,
  isCollapsed,
  level = 0,
  onAction
}: SidebarItemProps) {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const hasChildren = item.children && item.children.length > 0;
  const isActive = item.path
    ? item.exact
      ? location.pathname === item.path
      : location.pathname.startsWith(item.path)
    : false;
  
  const hasActiveChild = hasChildren
    ? item.children!.some(child =>
        child.path
          ? child.exact
            ? location.pathname === child.path
            : location.pathname.startsWith(child.path)
          : false
      )
    : false;

  const handleClick = () => {
    if (item.action && onAction) {
      onAction(item.action);
      return;
    }
    
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const itemContent = (
    <div
      className={`
        flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer
        ${isCollapsed ? 'justify-center' : ''}
        ${isActive || hasActiveChild
          ? 'bg-primary-100 text-primary-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100'
        }
        ${level > 0 ? 'ml-4 text-sm' : ''}
      `}
      onClick={!item.path && !item.action && hasChildren ? handleClick : undefined}
    >
      {item.icon && (
        <span className={`flex-shrink-0 ${isCollapsed ? '' : 'w-5 h-5'}`}>
          {item.icon}
        </span>
      )}
      
      {!isCollapsed && (
        <>
          <span className="flex-1">{item.label}</span>
          
          {item.badge !== undefined && item.badge > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full px-2 py-0.5 min-w-[20px] text-center">
              {item.badge}
            </span>
          )}
          
          {hasChildren && (
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                isExpanded ? 'rotate-180' : ''
              }`}
            />
          )}
        </>
      )}
    </div>
  );

  if (item.action) {
    return (
      <button
        className="w-full text-left"
        onClick={handleClick}
        title={isCollapsed ? item.label : undefined}
      >
        {itemContent}
      </button>
    );
  }

  if (!item.path) {
    return (
      <div className="w-full" title={isCollapsed ? item.label : undefined}>
        {itemContent}
      </div>
    );
  }

  return (
    <div className="w-full">
      <Link
        to={item.path!}
        className="block"
        title={isCollapsed ? item.label : undefined}
        onClick={(e) => {
          if (hasChildren) {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {itemContent}
      </Link>
      
      {hasChildren && !isCollapsed && isExpanded && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child) => (
            <SidebarItem
              key={child.id}
              item={child}
              isCollapsed={isCollapsed}
              level={level + 1}
              onAction={onAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}

