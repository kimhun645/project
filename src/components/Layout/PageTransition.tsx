import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    setIsTransitioning(true);
    
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div
      className={cn(
        'transition-all duration-300 ease-in-out',
        isTransitioning
          ? 'opacity-0 transform translate-y-2'
          : 'opacity-100 transform translate-y-0',
        className
      )}
    >
      {displayChildren}
    </div>
  );
}

// Fade transition for page changes
export function FadeTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setIsVisible(false);
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div
      className={cn(
        'transition-opacity duration-200 ease-in-out',
        isVisible ? 'opacity-100' : 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
}

// Slide transition for page changes
export function SlideTransition({ children, className }: PageTransitionProps) {
  const location = useLocation();
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  useEffect(() => {
    // Simple direction logic - can be enhanced with more sophisticated routing
    setDirection(Math.random() > 0.5 ? 'left' : 'right');
  }, [location.pathname]);

  return (
    <div
      className={cn(
        'transition-transform duration-300 ease-in-out',
        direction === 'left' 
          ? 'transform translate-x-full' 
          : 'transform -translate-x-full',
        className
      )}
    >
      {children}
    </div>
  );
}
