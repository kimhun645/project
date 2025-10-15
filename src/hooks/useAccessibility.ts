import { useEffect, useRef, useState } from 'react';

// Hook for managing focus
export function useFocusManagement() {
  const focusRef = useRef<HTMLElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const focus = () => {
    if (focusRef.current) {
      focusRef.current.focus();
    }
  };

  const trapFocus = (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  };

  const saveFocus = () => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  };

  const restoreFocus = () => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus();
    }
  };

  return {
    focusRef,
    focus,
    trapFocus,
    saveFocus,
    restoreFocus
  };
}

// Hook for screen reader announcements
export function useScreenReader() {
  const [announcements, setAnnouncements] = useState<string[]>([]);

  const announce = (message: string) => {
    setAnnouncements(prev => [...prev, message]);
  };

  const clearAnnouncements = () => {
    setAnnouncements([]);
  };

  return {
    announcements,
    announce,
    clearAnnouncements
  };
}

// Hook for keyboard navigation
export function useKeyboardNavigation() {
  const [isKeyboardUser, setIsKeyboardUser] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        setIsKeyboardUser(true);
      }
    };

    const handleMouseDown = () => {
      setIsKeyboardUser(false);
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return { isKeyboardUser };
}

// Hook for ARIA live regions
export function useLiveRegion() {
  const [liveMessage, setLiveMessage] = useState<string>('');

  const announce = (message: string) => {
    setLiveMessage(message);
    // Clear after a short delay to allow screen readers to announce
    setTimeout(() => setLiveMessage(''), 1000);
  };

  return {
    liveMessage,
    announce
  };
}

// Hook for skip links
export function useSkipLinks() {
  const skipLinks = [
    {
      id: 'main-content',
      label: 'ข้ามไปยังเนื้อหาหลัก',
      target: 'main'
    },
    {
      id: 'navigation',
      label: 'ข้ามไปยังเมนูนำทาง',
      target: 'nav'
    },
    {
      id: 'search',
      label: 'ข้ามไปยังการค้นหา',
      target: 'search'
    }
  ];

  return { skipLinks };
}

// Hook for color contrast checking
export function useColorContrast() {
  const checkContrast = (foreground: string, background: string): number => {
    // Simplified contrast ratio calculation
    // In a real app, you'd use a proper color contrast library
    const getLuminance = (color: string) => {
      const rgb = parseInt(color.replace('#', ''), 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  };

  const isAccessible = (foreground: string, background: string): boolean => {
    const ratio = checkContrast(foreground, background);
    return ratio >= 4.5; // WCAG AA standard
  };

  return { checkContrast, isAccessible };
}

// Hook for reduced motion preferences
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { prefersReducedMotion };
}

// Hook for high contrast mode
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return { prefersHighContrast };
}

// Hook for font size preferences
export function useFontSize() {
  const [fontSize, setFontSize] = useState<'small' | 'medium' | 'large'>('medium');

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: no-preference)');
    // This is a simplified example - in reality you'd check for font-size preferences
    const storedFontSize = localStorage.getItem('fontSize') as 'small' | 'medium' | 'large';
    if (storedFontSize) {
      setFontSize(storedFontSize);
    }
  }, []);

  const updateFontSize = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    localStorage.setItem('fontSize', size);
  };

  return { fontSize, updateFontSize };
}
