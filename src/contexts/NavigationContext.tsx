import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface NavigationContextType {
  isNavigating: boolean;
  navigateTo: (path: string, options?: { replace?: boolean; state?: any }) => Promise<void>;
  navigateBack: () => void;
  navigateForward: () => void;
  canGoBack: boolean;
  canGoForward: boolean;
  currentPath: string;
  previousPath: string | null;
  navigationHistory: string[];
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const navigateTo = useCallback(async (path: string, options?: { replace?: boolean; state?: any }) => {
    if (isNavigating) return; // Prevent multiple simultaneous navigations
    
    setIsNavigating(true);
    
    try {
      // Add to history if not replacing
      if (!options?.replace) {
        const newHistory = navigationHistory.slice(0, currentIndex + 1);
        newHistory.push(path);
        setNavigationHistory(newHistory);
        setCurrentIndex(newHistory.length - 1);
      }
      
      // Add loading delay for better UX
      await new Promise(resolve => setTimeout(resolve, 100));
      
      navigate(path, options);
    } catch (error) {
      console.error('Navigation error:', error);
    } finally {
      // Reset navigating state after a delay
      setTimeout(() => setIsNavigating(false), 300);
    }
  }, [navigate, isNavigating, navigationHistory, currentIndex]);

  const navigateBack = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      const previousPath = navigationHistory[newIndex];
      setCurrentIndex(newIndex);
      navigate(previousPath);
    }
  }, [navigate, currentIndex, navigationHistory]);

  const navigateForward = useCallback(() => {
    if (currentIndex < navigationHistory.length - 1) {
      const newIndex = currentIndex + 1;
      const nextPath = navigationHistory[newIndex];
      setCurrentIndex(newIndex);
      navigate(nextPath);
    }
  }, [navigate, currentIndex, navigationHistory]);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < navigationHistory.length - 1;
  const currentPath = location.pathname;
  const previousPath = currentIndex > 0 ? navigationHistory[currentIndex - 1] : null;

  const value: NavigationContextType = {
    isNavigating,
    navigateTo,
    navigateBack,
    navigateForward,
    canGoBack,
    canGoForward,
    currentPath,
    previousPath,
    navigationHistory: navigationHistory.slice(0, currentIndex + 1)
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (context === undefined) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
