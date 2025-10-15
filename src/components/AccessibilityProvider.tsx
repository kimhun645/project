import React, { createContext, useContext, useEffect, useState } from 'react';
import { useScreenReader, useLiveRegion, useKeyboardNavigation, useReducedMotion, useHighContrast, useFontSize } from '@/hooks/useAccessibility';

interface AccessibilityContextType {
  // Screen reader
  announce: (message: string) => void;
  liveMessage: string;
  
  // Keyboard navigation
  isKeyboardUser: boolean;
  
  // User preferences
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  fontSize: 'small' | 'medium' | 'large';
  updateFontSize: (size: 'small' | 'medium' | 'large') => void;
  
  // Accessibility features
  enableHighContrast: boolean;
  enableLargeText: boolean;
  enableScreenReader: boolean;
  
  // Toggle functions
  toggleHighContrast: () => void;
  toggleLargeText: () => void;
  toggleScreenReader: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const { announce, liveMessage } = useScreenReader();
  const { isKeyboardUser } = useKeyboardNavigation();
  const { prefersReducedMotion } = useReducedMotion();
  const { prefersHighContrast } = useHighContrast();
  const { fontSize, updateFontSize } = useFontSize();
  
  const [enableHighContrast, setEnableHighContrast] = useState(false);
  const [enableLargeText, setEnableLargeText] = useState(false);
  const [enableScreenReader, setEnableScreenReader] = useState(true);

  // Apply accessibility settings to document
  useEffect(() => {
    const root = document.documentElement;
    
    // High contrast
    if (enableHighContrast || prefersHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (enableLargeText || fontSize === 'large') {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (prefersReducedMotion) {
      root.classList.add('reduced-motion');
    } else {
      root.classList.remove('reduced-motion');
    }
    
    // Font size
    root.classList.remove('font-small', 'font-medium', 'font-large');
    root.classList.add(`font-${fontSize}`);
    
  }, [enableHighContrast, enableLargeText, prefersReducedMotion, prefersHighContrast, fontSize]);

  // Keyboard navigation styles
  useEffect(() => {
    if (isKeyboardUser) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  }, [isKeyboardUser]);

  const toggleHighContrast = () => {
    setEnableHighContrast(prev => !prev);
    announce(enableHighContrast ? 'ปิดโหมดคอนทราสต์สูง' : 'เปิดโหมดคอนทราสต์สูง');
  };

  const toggleLargeText = () => {
    setEnableLargeText(prev => !prev);
    announce(enableLargeText ? 'ปิดโหมดตัวอักษรใหญ่' : 'เปิดโหมดตัวอักษรใหญ่');
  };

  const toggleScreenReader = () => {
    setEnableScreenReader(prev => !prev);
    announce(enableScreenReader ? 'ปิดโหมดหน้าจออ่าน' : 'เปิดโหมดหน้าจออ่าน');
  };

  const value: AccessibilityContextType = {
    announce,
    liveMessage,
    isKeyboardUser,
    prefersReducedMotion,
    prefersHighContrast,
    fontSize,
    updateFontSize,
    enableHighContrast,
    enableLargeText,
    enableScreenReader,
    toggleHighContrast,
    toggleLargeText,
    toggleScreenReader,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
      {/* Live region for screen reader announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        role="status"
      >
        {liveMessage}
      </div>
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
}

// Accessibility utilities
export const a11y = {
  // ARIA attributes
  label: (text: string) => ({ 'aria-label': text }),
  describedBy: (id: string) => ({ 'aria-describedby': id }),
  expanded: (expanded: boolean) => ({ 'aria-expanded': expanded }),
  hidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
  live: (polite: boolean = true) => ({ 'aria-live': polite ? 'polite' : 'assertive' }),
  
  // Role attributes
  button: () => ({ role: 'button', tabIndex: 0 }),
  dialog: () => ({ role: 'dialog', 'aria-modal': true }),
  alert: () => ({ role: 'alert' }),
  status: () => ({ role: 'status' }),
  
  // Keyboard navigation
  onKeyDown: (handler: (e: React.KeyboardEvent) => void) => ({ onKeyDown: handler }),
  onKeyPress: (handler: (e: React.KeyboardEvent) => void) => ({ onKeyPress: handler }),
  
  // Focus management
  tabIndex: (index: number) => ({ tabIndex: index }),
  autoFocus: () => ({ autoFocus: true }),
  
  // Screen reader only content
  srOnly: () => ({ className: 'sr-only' }),
  
  // Skip links
  skipLink: (target: string, label: string) => ({
    href: `#${target}`,
    'aria-label': label,
    className: 'skip-link'
  })
};

// Screen reader only class
export const srOnly = 'sr-only';
