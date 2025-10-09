// Theme Manager for Material Management System
export interface ThemeSettings {
  mode: 'light' | 'dark' | 'auto';
  colorPalette: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  fontSize: 'small' | 'medium' | 'large';
  borderRadius: 'none' | 'small' | 'medium' | 'large';
  spacing: 'compact' | 'normal' | 'comfortable';
  animations: boolean;
  reducedMotion: boolean;
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

class ThemeManager {
  private settings: ThemeSettings = {
    mode: 'light',
    colorPalette: 'light',
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    accentColor: '#f59e0b',
    fontFamily: 'Noto Sans Thai',
    fontSize: 'medium',
    borderRadius: 'medium',
    spacing: 'normal',
    animations: true,
    reducedMotion: false
  };

  private colorPalettes: Record<string, ColorPalette> = {
    light: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    },
    dark: {
      primary: '#60a5fa',
      secondary: '#94a3b8',
      accent: '#fbbf24',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textSecondary: '#94a3b8',
      border: '#334155',
      success: '#34d399',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa'
    },
    default: {
      primary: '#3b82f6',
      secondary: '#64748b',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textSecondary: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6'
    }
  };

  private listeners: Array<(settings: ThemeSettings) => void> = [];

  constructor() {
    this.loadSettings();
    this.applyTheme();
    this.setupSystemThemeDetection();
  }

  // Load settings from localStorage
  private loadSettings() {
    const saved = localStorage.getItem('themeSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  // Save settings to localStorage
  private saveSettings() {
    localStorage.setItem('themeSettings', JSON.stringify(this.settings));
  }

  // Setup system theme detection
  private setupSystemThemeDetection() {
    if (this.settings.mode === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      this.handleSystemThemeChange(mediaQuery);
      mediaQuery.addEventListener('change', this.handleSystemThemeChange);
    }
  }

  private handleSystemThemeChange = (mediaQuery: MediaQueryList) => {
    if (this.settings.mode === 'auto') {
      this.applyTheme();
    }
  };

  // Apply theme to document
  private applyTheme() {
    try {
      const root = document.documentElement;
      const palette = this.getCurrentColorPalette();

      // Ensure palette exists and has required properties
      if (!palette || typeof palette !== 'object') {
        console.warn('ThemeManager: Invalid palette, using fallback');
        return;
      }

      // Apply CSS custom properties with fallbacks
      root.style.setProperty('--color-primary', palette.primary || '#3b82f6');
      root.style.setProperty('--color-secondary', palette.secondary || '#64748b');
      root.style.setProperty('--color-accent', palette.accent || '#f59e0b');
      root.style.setProperty('--color-background', palette.background || '#ffffff');
      root.style.setProperty('--color-surface', palette.surface || '#f8fafc');
      root.style.setProperty('--color-text', palette.text || '#1e293b');
      root.style.setProperty('--color-text-secondary', palette.textSecondary || '#64748b');
      root.style.setProperty('--color-border', palette.border || '#e2e8f0');
      root.style.setProperty('--color-success', palette.success || '#10b981');
      root.style.setProperty('--color-warning', palette.warning || '#f59e0b');
      root.style.setProperty('--color-error', palette.error || '#ef4444');
      root.style.setProperty('--color-info', palette.info || '#3b82f6');
    } catch (error) {
      console.error('ThemeManager: Error applying theme:', error);
    }

    // Apply font family
    root.style.setProperty('--font-family', this.settings.fontFamily);

    // Apply font size
    const fontSizeMap = {
      small: '14px',
      medium: '16px',
      large: '18px'
    };
    root.style.setProperty('--font-size-base', fontSizeMap[this.settings.fontSize]);

    // Apply border radius
    const borderRadiusMap = {
      none: '0px',
      small: '4px',
      medium: '8px',
      large: '12px'
    };
    root.style.setProperty('--border-radius', borderRadiusMap[this.settings.borderRadius]);

    // Apply spacing
    const spacingMap = {
      compact: '0.5rem',
      normal: '1rem',
      comfortable: '1.5rem'
    };
    root.style.setProperty('--spacing', spacingMap[this.settings.spacing]);

    // Apply animations
    if (!this.settings.animations || this.settings.reducedMotion) {
      root.style.setProperty('--animation-duration', '0s');
    } else {
      root.style.setProperty('--animation-duration', '0.3s');
    }

    // Apply dark mode class
    if (this.getCurrentMode() === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Get current color palette
  private getCurrentColorPalette(): ColorPalette {
    const paletteKey = this.settings.colorPalette || 'light';
    const palette = this.colorPalettes[paletteKey] || this.colorPalettes.default || this.colorPalettes.light;
    
    // Ensure all required properties exist
    return {
      primary: palette.primary || '#3b82f6',
      secondary: palette.secondary || '#64748b',
      accent: palette.accent || '#f59e0b',
      background: palette.background || '#ffffff',
      surface: palette.surface || '#f8fafc',
      text: palette.text || '#1e293b',
      textSecondary: palette.textSecondary || '#64748b',
      border: palette.border || '#e2e8f0',
      success: palette.success || '#10b981',
      warning: palette.warning || '#f59e0b',
      error: palette.error || '#ef4444',
      info: palette.info || '#3b82f6'
    };
  }

  // Get current mode (considering auto mode)
  private getCurrentMode(): 'light' | 'dark' {
    if (this.settings.mode === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return this.settings.mode;
  }

  // Get current settings
  getSettings(): ThemeSettings {
    return { ...this.settings };
  }

  // Update settings
  updateSettings(newSettings: Partial<ThemeSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
    this.applyTheme();
    this.notifyListeners();
  }


  // Get available color palettes
  getAvailableColorPalettes(): Record<string, ColorPalette> {
    return this.colorPalettes;
  }

  // Get available themes
  getAvailableThemes() {
    return [
      {
        id: 'light',
        name: 'โหมดสว่าง',
        description: 'ธีมสว่างเหมาะสำหรับการใช้งานในเวลากลางวัน',
        preview: this.colorPalettes.light
      },
      {
        id: 'dark',
        name: 'โหมดมืด',
        description: 'ธีมมืดเหมาะสำหรับการใช้งานในเวลากลางคืน',
        preview: this.colorPalettes.dark
      },
      {
        id: 'auto',
        name: 'อัตโนมัติ',
        description: 'เปลี่ยนธีมตามการตั้งค่าระบบ',
        preview: null
      }
    ];
  }

  // Get available font families
  getAvailableFontFamilies() {
    return [
      { id: 'Noto Sans Thai', name: 'Noto Sans Thai', description: 'ฟอนต์ไทยที่อ่านง่าย' },
      { id: 'Kanit', name: 'Kanit', description: 'ฟอนต์ไทยสไตล์โมเดิร์น' },
      { id: 'Prompt', name: 'Prompt', description: 'ฟอนต์ไทยที่ทันสมัย' },
      { id: 'Sarabun', name: 'Sarabun', description: 'ฟอนต์ไทยแบบดั้งเดิม' },
      { id: 'Inter', name: 'Inter', description: 'ฟอนต์อังกฤษที่อ่านง่าย' }
    ];
  }

  // Get available font sizes
  getAvailableFontSizes() {
    return [
      { id: 'small', name: 'เล็ก', description: 'เหมาะสำหรับหน้าจอขนาดเล็ก' },
      { id: 'medium', name: 'กลาง', description: 'ขนาดมาตรฐาน' },
      { id: 'large', name: 'ใหญ่', description: 'เหมาะสำหรับการอ่าน' }
    ];
  }

  // Get available border radius options
  getAvailableBorderRadius() {
    return [
      { id: 'none', name: 'ไม่มี', description: 'มุมโค้งมน' },
      { id: 'small', name: 'เล็ก', description: 'มุมโค้งมนเล็กน้อย' },
      { id: 'medium', name: 'กลาง', description: 'มุมโค้งมนปานกลาง' },
      { id: 'large', name: 'ใหญ่', description: 'มุมโค้งมนมาก' }
    ];
  }

  // Get available spacing options
  getAvailableSpacing() {
    return [
      { id: 'compact', name: 'กระชับ', description: 'ระยะห่างน้อย เหมาะสำหรับหน้าจอเล็ก' },
      { id: 'normal', name: 'ปกติ', description: 'ระยะห่างมาตรฐาน' },
      { id: 'comfortable', name: 'สบายตา', description: 'ระยะห่างมาก เหมาะสำหรับการอ่าน' }
    ];
  }

  // Subscribe to theme changes
  subscribe(listener: (settings: ThemeSettings) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.settings }));
  }

  // Reset to default theme
  resetToDefault() {
    this.settings = {
      mode: 'light',
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#f59e0b',
      fontFamily: 'Noto Sans Thai',
      fontSize: 'medium',
      borderRadius: 'medium',
      spacing: 'normal',
      animations: true,
      reducedMotion: false
    };
    this.saveSettings();
    this.applyTheme();
    this.notifyListeners();
  }

  // Export theme settings
  exportTheme(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  // Import theme settings
  importTheme(themeJson: string) {
    try {
      const importedSettings = JSON.parse(themeJson);
      this.updateSettings(importedSettings);
      return true;
    } catch (error) {
      console.error('Error importing theme:', error);
      return false;
    }
  }

  // Check if reduced motion is preferred
  isReducedMotionPreferred(): boolean {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  // Check if dark mode is preferred
  isDarkModePreferred(): boolean {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
}

// Create singleton instance
export const themeManager = new ThemeManager();

// Export types
export type { ThemeSettings, ColorPalette };
