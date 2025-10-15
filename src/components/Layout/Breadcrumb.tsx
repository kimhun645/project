import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '/': 'หน้าหลัก',
  '/dashboard': 'แดชบอร์ด',
  '/products': 'สินค้า',
  '/categories': 'หมวดหมู่',
  '/suppliers': 'ผู้จำหน่าย',
  '/movements': 'การเบิก/การรับพัสดุ',
  '/scanner': 'สแกนบาร์โค้ด',
  '/budget-request': 'ขอใช้งบประมาณ',
  '/approval': 'การอนุมัติ',
  '/approval/list': 'ประวัติการอนุมัติ',
  '/reports': 'รายงาน',
  '/settings': 'ตั้งค่า',
};

interface BreadcrumbProps {
  className?: string;
}

export function Breadcrumb({ className }: BreadcrumbProps) {
  const location = useLocation();
  
  // Generate breadcrumb items from current path
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { label: 'หน้าหลัก', path: '/', icon: Home }
  ];

  // Build breadcrumb items
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment;
    breadcrumbItems.push({
      label,
      path: currentPath,
      icon: null
    });
  });

  // Don't show breadcrumb on home page
  if (location.pathname === '/') {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-1 text-sm text-muted-foreground', className)}>
      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        const isFirst = index === 0;
        
        return (
          <React.Fragment key={item.path}>
            {isFirst && (
              <Link
                to={item.path}
                className="flex items-center hover:text-foreground transition-colors"
              >
                <item.icon className="h-4 w-4 mr-1" />
                {item.label}
              </Link>
            )}
            
            {!isFirst && (
              <>
                <ChevronRight className="h-4 w-4" />
                {isLast ? (
                  <span className="font-medium text-foreground">{item.label}</span>
                ) : (
                  <Link
                    to={item.path}
                    className="hover:text-foreground transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
