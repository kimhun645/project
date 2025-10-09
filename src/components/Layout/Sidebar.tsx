import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigation } from '@/contexts/NavigationContext';
import {
  Package,
  BarChart3,
  ArrowUpDown,
  Settings,
  FileText,
  Tags,
  Truck,
  ScanLine,
  DollarSign,
  CheckCircle,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  onLogout?: () => void;
}

const navigation = [
  { name: 'แดชบอร์ด', href: '/dashboard', icon: BarChart3 },
  { name: 'สินค้า', href: '/products', icon: Package },
  { name: 'การเคลื่อนไหวสต็อก', href: '/movements', icon: ArrowUpDown },
  { name: 'หมวดหมู่', href: '/categories', icon: Tags },
  { name: 'ผู้จำหน่าย', href: '/suppliers', icon: Truck },
  { name: 'สแกนบาร์โค้ด', href: '/scanner', icon: ScanLine },
  { name: 'ขอใช้งบประมาณ', href: '/budget-request', icon: DollarSign },
  { name: 'การอนุมัติ', href: '/approval', icon: CheckCircle, disabled: false },
  { name: 'รายงาน', href: '/reports', icon: FileText },
  { name: 'ตั้งค่า', href: '/settings', icon: Settings },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { navigateTo, isNavigating } = useNavigation();

  const handleLogout = async () => {
    try {
      if (onLogout) {
        await onLogout();
      } else {
        await logout();
      }
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleNavigation = async (href: string) => {
    if (isNavigating) return; // Prevent navigation if already navigating
    await navigateTo(href);
  };

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-16 lg:w-64 bg-gradient-primary shadow-glow border-r border-primary/20 font-thai transition-all duration-300 ease-in-out">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
          <div className="flex flex-shrink-0 items-center px-2 lg:px-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-white/20 rounded-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-xl font-bold text-white drop-shadow-sm">ระบบบริหารพัสดุ</h1>
                <p className="text-xs text-white/80">Material Management</p>
              </div>
            </div>
          </div>
          
          <nav className="mt-8 flex-1 space-y-1 px-1 lg:px-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const isDisabled = item.disabled;
              
              if (isDisabled) {
                return (
                  <div
                    key={item.name}
                    className={cn(
                      'group flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-not-allowed opacity-50'
                    )}
                    title={`${item.name} - ระบบพิจารณาอนุมัติใช้งบประมาณ`}
                  >
                    <item.icon className="mr-0 lg:mr-3 h-5 w-5 flex-shrink-0 drop-shadow-sm text-white/40" />
                    <span className="hidden lg:block text-white/40">{item.name}</span>
                  </div>
                );
              }
              
              return (
                <button
                  key={item.name}
                  onClick={() => handleNavigation(item.href)}
                  disabled={isNavigating}
                  className={cn(
                    'group flex items-center px-2 lg:px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 w-full text-left',
                    isActive
                      ? 'bg-white/20 text-white shadow-glow border border-white/30'
                      : 'text-white/80 hover:bg-white/10 hover:text-white',
                    isNavigating && 'opacity-50 cursor-not-allowed'
                  )}
                  title={item.name}
                >
                  <item.icon
                    className={cn(
                    'mr-0 lg:mr-3 h-5 w-5 flex-shrink-0 drop-shadow-sm transition-transform duration-200',
                    isActive 
                      ? 'text-white' 
                      : 'text-white/70 group-hover:text-white group-hover:scale-110',
                    isNavigating && 'animate-pulse'
                  )}
                  />
                  <span className="hidden lg:block">{item.name}</span>
                  {isNavigating && isActive && (
                    <div className="hidden lg:block ml-auto">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
        
        <div className="flex flex-shrink-0 border-t border-white/20 p-2 lg:p-4">
          <div className="group block w-full flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="inline-block h-9 w-9 rounded-full bg-white/20"></div>
                <div className="hidden lg:block ml-3">
                  <p className="text-sm font-medium text-white drop-shadow-sm">
                    {user?.displayName || user?.email || 'ผู้ดูแลระบบ'}
                  </p>
                  <p className="text-xs text-white/80">{user?.role === 'admin' ? 'ผู้ดูแลระบบ' : 'ผู้จัดการสต็อก'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 rounded-md text-white/80 hover:bg-white/10 hover:text-white transition-all duration-200"
                title="ออกจากระบบ"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}