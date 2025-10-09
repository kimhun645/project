import React from 'react';
import { cn } from '@/lib/utils';

interface PageLoaderProps {
  message?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function PageLoader({ 
  message = 'กำลังโหลด...', 
  className,
  size = 'md' 
}: PageLoaderProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-12 w-12',
    lg: 'h-16 w-16'
  };

  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center bg-background/80 backdrop-blur-sm',
      className
    )}>
      <div className="flex flex-col items-center space-y-4">
        {/* Animated spinner */}
        <div className="relative">
          <div className={cn(
            'animate-spin rounded-full border-4 border-primary/20',
            sizeClasses[size]
          )}></div>
          <div className={cn(
            'animate-spin rounded-full border-4 border-transparent border-t-primary absolute top-0 left-0',
            sizeClasses[size]
          )}></div>
        </div>
        
        {/* Loading message */}
        <div className="text-center">
          <p className="text-muted-foreground font-medium">{message}</p>
          <div className="flex space-x-1 mt-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation loading overlay
export function NavigationLoader({ isVisible }: { isVisible: boolean }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-3">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
        <p className="text-sm text-muted-foreground">กำลังเปลี่ยนหน้า...</p>
      </div>
    </div>
  );
}
