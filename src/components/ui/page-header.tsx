import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';

interface PageHeaderProps {
  title: string;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onRefresh?: () => void;
  scannerDetected?: boolean;
  actionButtons?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  searchPlaceholder = "ค้นหา...",
  searchValue = "",
  onSearchChange,
  onRefresh,
  scannerDetected = false,
  actionButtons,
  className = ""
}: PageHeaderProps) {
  return (
    <header className={`relative overflow-hidden mb-6 mx-6 sm:mx-8 lg:mx-12 rounded-xl shadow-lg ${className}`}>
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-700"></div>
      
      {/* Subtle Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-6 -right-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
        <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-white/5 rounded-full blur-lg"></div>
      </div>
      
      {/* Main Header Content */}
      <div className="relative z-10 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Left Side - Title */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white drop-shadow-lg">
              {title}
            </h1>
          </div>
          
          {/* Right Side - Search and Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="w-80">
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {onRefresh && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={onRefresh}
                  className="h-9 px-3 rounded-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
              
              {actionButtons}
            </div>
          </div>
        </div>
        
        {/* Bottom Status Bar */}
        <div className="mt-3 pt-3 border-t border-white/20">
          <div className="flex items-center justify-between text-white/80 text-xs">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="font-medium">ระบบบริหารพัสดุ</span>
              </div>
              <div className="w-px h-3 bg-white/30"></div>
              <span>อัปเดต: {new Date().toLocaleTimeString('th-TH')}</span>
            </div>
            <div className="flex items-center gap-3">
              <BarcodeScannerIndicator isDetected={scannerDetected} />
              {scannerDetected && (
                <span className="text-xs text-green-100 bg-green-500/20 px-2 py-1 rounded-full">
                  สแกนพร้อม
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
