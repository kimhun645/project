import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  hideHeader?: boolean;
  onLogout?: () => void;
}

export function Layout({ children, title, hideHeader = false, onLogout }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-gradient-primary relative overflow-hidden font-thai">
      {/* Background Decoration - Removed glass effects */}
      
      {/* Fixed Sidebar - Always visible */}
      <Sidebar onLogout={onLogout} />
      
      {/* Main Content Area - Always with sidebar offset */}
      <div className="w-full pl-16 lg:pl-64 flex flex-col min-h-screen relative z-10 transition-all duration-300 ease-in-out">
        <main className="flex-1 overflow-auto">
          <div className="w-full px-4 py-6 sm:px-6 lg:px-8 relative">
            {/* Content Background - Removed glass effects */}
            <div className="relative z-10 w-full">
              <div className="w-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}