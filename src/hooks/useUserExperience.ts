import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from './useNotifications';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: 'th' | 'en';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  sounds: boolean;
  notifications: boolean;
  autoSave: boolean;
  compactMode: boolean;
  showTooltips: boolean;
  keyboardShortcuts: boolean;
}

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

export interface UserExperienceConfig {
  enableAnimations: boolean;
  enableSounds: boolean;
  enableTooltips: boolean;
  enableKeyboardShortcuts: boolean;
  enableAutoSave: boolean;
  enableCompactMode: boolean;
  enableAccessibility: boolean;
  enablePerformanceMode: boolean;
}

export function useUserExperience() {
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'light',
    language: 'th',
    fontSize: 'medium',
    animations: true,
    sounds: true,
    notifications: true,
    autoSave: true,
    compactMode: false,
    showTooltips: true,
    keyboardShortcuts: true
  });

  const [config, setConfig] = useState<UserExperienceConfig>({
    enableAnimations: true,
    enableSounds: true,
    enableTooltips: true,
    enableKeyboardShortcuts: true,
    enableAutoSave: true,
    enableCompactMode: false,
    enableAccessibility: true,
    enablePerformanceMode: false
  });

  const [shortcuts, setShortcuts] = useState<KeyboardShortcut[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isLoading, setIsLoading] = useState(false);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());

  const { showNotification, showSystemNotification } = useNotifications();

  // Load preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      setPreferences(JSON.parse(savedPreferences));
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
  }, [preferences]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      showSystemNotification('เชื่อมต่ออินเทอร์เน็ต', 'ระบบเชื่อมต่ออินเทอร์เน็ตแล้ว', 'success');
    };

    const handleOffline = () => {
      setIsOnline(false);
      showSystemNotification('ขาดการเชื่อมต่อ', 'ระบบขาดการเชื่อมต่ออินเทอร์เน็ต', 'error');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showSystemNotification]);

  // Monitor user activity
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!preferences.keyboardShortcuts) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const shortcut = shortcuts.find(s => 
        s.key === event.key &&
        s.ctrl === event.ctrlKey &&
        s.shift === event.shiftKey &&
        s.alt === event.altKey
      );

      if (shortcut) {
        event.preventDefault();
        shortcut.action();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, preferences.keyboardShortcuts]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  }, []);

  // Update config
  const updateConfig = useCallback((newConfig: Partial<UserExperienceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
  }, []);

  // Add keyboard shortcut
  const addShortcut = useCallback((shortcut: KeyboardShortcut) => {
    setShortcuts(prev => [...prev, shortcut]);
  }, []);

  // Remove keyboard shortcut
  const removeShortcut = useCallback((key: string) => {
    setShortcuts(prev => prev.filter(s => s.key !== key));
  }, []);

  // Toggle theme
  const toggleTheme = useCallback(() => {
    const newTheme = preferences.theme === 'light' ? 'dark' : 'light';
    updatePreferences({ theme: newTheme });
    showSystemNotification('เปลี่ยนธีม', `เปลี่ยนเป็นธีม${newTheme === 'light' ? 'สว่าง' : 'มืด'}`, 'info');
  }, [preferences.theme, updatePreferences, showSystemNotification]);

  // Toggle compact mode
  const toggleCompactMode = useCallback(() => {
    updatePreferences({ compactMode: !preferences.compactMode });
    showSystemNotification('เปลี่ยนโหมด', `เปลี่ยนเป็นโหมด${preferences.compactMode ? 'ปกติ' : 'กะทัดรัด'}`, 'info');
  }, [preferences.compactMode, updatePreferences, showSystemNotification]);

  // Toggle animations
  const toggleAnimations = useCallback(() => {
    updatePreferences({ animations: !preferences.animations });
    showSystemNotification('เปลี่ยนแอนิเมชัน', `แอนิเมชัน${preferences.animations ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.animations, updatePreferences, showSystemNotification]);

  // Toggle sounds
  const toggleSounds = useCallback(() => {
    updatePreferences({ sounds: !preferences.sounds });
    showSystemNotification('เปลี่ยนเสียง', `เสียง${preferences.sounds ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.sounds, updatePreferences, showSystemNotification]);

  // Toggle notifications
  const toggleNotifications = useCallback(() => {
    updatePreferences({ notifications: !preferences.notifications });
    showSystemNotification('เปลี่ยนการแจ้งเตือน', `การแจ้งเตือน${preferences.notifications ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.notifications, updatePreferences, showSystemNotification]);

  // Toggle auto save
  const toggleAutoSave = useCallback(() => {
    updatePreferences({ autoSave: !preferences.autoSave });
    showSystemNotification('เปลี่ยนการบันทึกอัตโนมัติ', `การบันทึกอัตโนมัติ${preferences.autoSave ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.autoSave, updatePreferences, showSystemNotification]);

  // Toggle tooltips
  const toggleTooltips = useCallback(() => {
    updatePreferences({ showTooltips: !preferences.showTooltips });
    showSystemNotification('เปลี่ยนคำแนะนำ', `คำแนะนำ${preferences.showTooltips ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.showTooltips, updatePreferences, showSystemNotification]);

  // Toggle keyboard shortcuts
  const toggleKeyboardShortcuts = useCallback(() => {
    updatePreferences({ keyboardShortcuts: !preferences.keyboardShortcuts });
    showSystemNotification('เปลี่ยนคีย์ลัด', `คีย์ลัด${preferences.keyboardShortcuts ? 'ปิด' : 'เปิด'}`, 'info');
  }, [preferences.keyboardShortcuts, updatePreferences, showSystemNotification]);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  // Get user activity status
  const getUserActivityStatus = useCallback(() => {
    const now = new Date();
    const timeSinceActivity = now.getTime() - lastActivity.getTime();
    const minutesSinceActivity = Math.floor(timeSinceActivity / (1000 * 60));
    
    if (minutesSinceActivity < 1) return 'active';
    if (minutesSinceActivity < 5) return 'idle';
    return 'inactive';
  }, [lastActivity]);

  // Get accessibility features
  const getAccessibilityFeatures = useCallback(() => {
    return {
      highContrast: preferences.theme === 'dark',
      largeText: preferences.fontSize === 'large',
      reducedMotion: !preferences.animations,
      screenReader: config.enableAccessibility,
      keyboardNavigation: preferences.keyboardShortcuts
    };
  }, [preferences, config]);

  // Get performance recommendations
  const getPerformanceRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (preferences.animations && config.enablePerformanceMode) {
      recommendations.push('ปิดแอนิเมชันเพื่อเพิ่มประสิทธิภาพ');
    }
    
    if (preferences.sounds && config.enablePerformanceMode) {
      recommendations.push('ปิดเสียงเพื่อเพิ่มประสิทธิภาพ');
    }
    
    if (!preferences.compactMode && config.enablePerformanceMode) {
      recommendations.push('ใช้โหมดกะทัดรัดเพื่อเพิ่มประสิทธิภาพ');
    }
    
    return recommendations;
  }, [preferences, config]);

  // Export user preferences
  const exportPreferences = useCallback(() => {
    const exportData = {
      preferences,
      config,
      shortcuts,
      lastActivity: lastActivity.toISOString(),
      isOnline,
      isLoading
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `user_preferences_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [preferences, config, shortcuts, lastActivity, isOnline, isLoading]);

  // Import user preferences
  const importPreferences = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.preferences) setPreferences(data.preferences);
        if (data.config) setConfig(data.config);
        if (data.shortcuts) setShortcuts(data.shortcuts);
        showSystemNotification('นำเข้าการตั้งค่า', 'นำเข้าการตั้งค่าผู้ใช้เรียบร้อยแล้ว', 'success');
      } catch (error) {
        showSystemNotification('ข้อผิดพลาด', 'ไม่สามารถนำเข้าข้อมูลได้', 'error');
      }
    };
    reader.readAsText(file);
  }, [showSystemNotification]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    setPreferences({
      theme: 'light',
      language: 'th',
      fontSize: 'medium',
      animations: true,
      sounds: true,
      notifications: true,
      autoSave: true,
      compactMode: false,
      showTooltips: true,
      keyboardShortcuts: true
    });
    setConfig({
      enableAnimations: true,
      enableSounds: true,
      enableTooltips: true,
      enableKeyboardShortcuts: true,
      enableAutoSave: true,
      enableCompactMode: false,
      enableAccessibility: true,
      enablePerformanceMode: false
    });
    setShortcuts([]);
    showSystemNotification('รีเซ็ตการตั้งค่า', 'รีเซ็ตการตั้งค่าเป็นค่าเริ่มต้นแล้ว', 'info');
  }, [showSystemNotification]);

  return {
    preferences,
    config,
    shortcuts,
    isOnline,
    isLoading,
    lastActivity,
    updatePreferences,
    updateConfig,
    addShortcut,
    removeShortcut,
    toggleTheme,
    toggleCompactMode,
    toggleAnimations,
    toggleSounds,
    toggleNotifications,
    toggleAutoSave,
    toggleTooltips,
    toggleKeyboardShortcuts,
    setLoading,
    getUserActivityStatus,
    getAccessibilityFeatures,
    getPerformanceRecommendations,
    exportPreferences,
    importPreferences,
    resetToDefaults
  };
}
