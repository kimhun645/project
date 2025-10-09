import React, { useState } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/Search/GlobalSearch';
import { useNavigate } from 'react-router-dom';

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
  const navigate = useNavigate();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (loading || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      // Add a small delay to show the animation
      setTimeout(() => {
        setIsRefreshing(false);
      }, 1000);
    }
  };

  return (
    <header className="relative overflow-hidden mb-4 -mx-4 sm:-mx-6 lg:-mx-8 rounded-2xl shadow-xl">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700"></div>
      
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-36 h-36 bg-white/5 rounded-full blur-xl animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>
      
      {/* Main Header Content */}
      <div className="relative z-10 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Left Side - Title and Description */}
          <div className="flex-1">
            <h1 className="relative text-3xl lg:text-4xl font-bold text-white mb-1 drop-shadow-2xl">
              <span className="relative z-10">แดชบอร์ด</span>
              <div className="absolute inset-0 text-white/20 blur-sm transform translate-x-1 translate-y-1">
                แดชบอร์ด
              </div>
            </h1>
            <div className="relative text-white/90 text-base lg:text-lg font-medium drop-shadow-lg">
              <span className="relative z-10">ภาพรวมระบบบริหารจัดการสต็อกสินค้าทั้งหมด</span>
              <div className="absolute inset-0 text-white/20 blur-sm transform translate-x-0.5 translate-y-0.5">
                ภาพรวมระบบบริหารจัดการสต็อกสินค้าทั้งหมด
              </div>
            </div>
          </div>
          
          {/* Right Side - Search and Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search Bar */}
            <div className="flex-1 min-w-0">
              <GlobalSearch 
                className="w-full max-w-lg" 
                placeholder="ค้นหาทุกอย่างในระบบ..."
                showFilters={true}
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button 
                onClick={handleRefresh}
                disabled={loading || isRefreshing}
                variant="outline" 
                size="sm" 
                className="group relative p-4 rounded-full bg-gradient-to-br from-blue-500/40 via-purple-500/30 to-indigo-500/40 backdrop-blur-sm border-blue-400/50 hover:from-blue-500/60 hover:via-purple-500/50 hover:to-indigo-500/60 text-white hover:text-white transition-all duration-300 shadow-2xl hover:shadow-blue-500/40 hover:scale-110 transform hover:-translate-y-1"
              >
                {/* Animated background rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Pulsing ring effect */}
                <div className="absolute inset-0 rounded-full border-2 border-white/30 group-hover:border-white/50 group-hover:scale-110 transition-all duration-300"></div>
                
                {/* Icon with enhanced effects */}
                <div className="relative z-10">
                  <RefreshCw className={`h-6 w-6 ${(loading || isRefreshing) ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform duration-500 drop-shadow-lg`} />
                  
                  {/* Glow effect */}
                  <div className="absolute inset-0 rounded-full bg-white/20 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* Loading state indicator */}
                {(loading || isRefreshing) && (
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/50 animate-spin"></div>
                )}
                
                {/* Success animation */}
                {!loading && !isRefreshing && (
                  <div className="absolute inset-0 rounded-full bg-green-400/20 scale-0 group-hover:scale-110 transition-transform duration-300"></div>
                )}
              </Button>
              
              <Button 
                onClick={() => navigate('/products')}
                size="sm" 
                className="group relative px-6 py-3 rounded-xl bg-gradient-to-br from-green-500/40 via-emerald-500/30 to-teal-500/40 backdrop-blur-sm border-green-400/50 hover:from-green-500/60 hover:via-emerald-500/50 hover:to-teal-500/60 text-white hover:text-white font-medium transition-all duration-300 shadow-2xl hover:shadow-green-500/40 hover:scale-105 transform"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10 flex items-center">
                  <div className="relative">
                    <Plus className="h-5 w-5 mr-2 group-hover:rotate-90 transition-transform duration-300" />
                    <div className="absolute inset-0 h-5 w-5 mr-2 bg-white/20 rounded-full blur-sm group-hover:blur-md transition-all duration-300"></div>
                  </div>
                  <span className="relative z-10">เพิ่มสินค้า</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Decorative Line */}
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="flex items-center justify-between text-white/70 text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <div className="w-3 h-3 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-300 rounded-full blur-sm animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 bg-green-200 rounded-full blur-md animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                </div>
                <span className="font-medium text-green-100">ระบบออนไลน์</span>
              </div>
              <div className="w-px h-4 bg-gradient-to-b from-transparent via-white/30 to-transparent"></div>
              <span>อัปเดตล่าสุด: {new Date().toLocaleString('th-TH')}</span>
            </div>
            <div className="hidden sm:flex items-center gap-4">
              <span className="font-medium text-blue-100">พร้อมใช้งาน</span>
              <div className="relative">
                <div className="w-3 h-3 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full shadow-lg shadow-blue-400/50"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-300 rounded-full blur-sm"></div>
                <div className="absolute inset-0 w-3 h-3 bg-blue-200 rounded-full blur-md"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
