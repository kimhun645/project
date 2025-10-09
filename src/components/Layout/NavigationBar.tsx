import React from 'react';
import { useNavigation } from '@/contexts/NavigationContext';
import { Breadcrumb } from './Breadcrumb';
import { NavigationLoader } from './PageLoader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';

interface NavigationBarProps {
  className?: string;
}

export function NavigationBar({ className }: NavigationBarProps) {
  const { 
    isNavigating, 
    navigateBack, 
    navigateForward, 
    canGoBack, 
    canGoForward,
    currentPath 
  } = useNavigation();

  return (
    <>
      <NavigationLoader isVisible={isNavigating} />
      
      <div className={`bg-background border-b border-border px-4 py-3 ${className}`}>
        <div className="flex items-center justify-end">
          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={navigateBack}
              disabled={!canGoBack || isNavigating}
              className="h-8 w-8 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={navigateForward}
              disabled={!canGoForward || isNavigating}
              className="h-8 w-8 p-0"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
              disabled={isNavigating}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
