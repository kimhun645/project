import { toast } from '@/hooks/use-toast';

export interface NotificationConfig {
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private notifications: NotificationConfig[] = [];
  private listeners: ((notifications: NotificationConfig[]) => void)[] = [];

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Real-time notifications
  showNotification(config: NotificationConfig) {
    this.notifications.push({
      ...config,
      duration: config.duration || 5000
    });

    // Show toast notification
    toast({
      title: config.title,
      description: config.message,
      variant: config.type === 'error' ? 'destructive' : 'default',
      duration: config.duration || 5000
    });

    // Notify listeners
    this.notifyListeners();

    // Auto remove after duration
    if (config.duration) {
      setTimeout(() => {
        this.removeNotification(config);
      }, config.duration);
    }
  }

  // Stock alerts
  showLowStockAlert(productName: string, currentStock: number, minStock: number) {
    this.showNotification({
      title: "⚠️ สต็อกต่ำ",
      message: `${productName} เหลือ ${currentStock} ชิ้น (ขั้นต่ำ: ${minStock})`,
      type: 'warning',
      duration: 10000,
      action: {
        label: "ดูรายละเอียด",
        onClick: () => {
          // Navigate to products page with filter
          window.location.href = '/products?filter=low-stock';
        }
      }
    });
  }

  showOutOfStockAlert(productName: string) {
    this.showNotification({
      title: "🚨 สต็อกหมด",
      message: `${productName} สต็อกหมดแล้ว`,
      type: 'error',
      duration: 15000,
      action: {
        label: "สั่งซื้อ",
        onClick: () => {
          // Navigate to products page
          window.location.href = '/products';
        }
      }
    });
  }

  // System notifications
  showSystemNotification(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') {
    this.showNotification({
      title,
      message,
      type,
      duration: 5000
    });
  }

  // Data backup notifications
  showBackupNotification(type: 'start' | 'success' | 'error') {
    switch (type) {
      case 'start':
        this.showNotification({
          title: "🔄 กำลังสำรองข้อมูล",
          message: "ระบบกำลังสำรองข้อมูล กรุณารอสักครู่",
          type: 'info',
          duration: 3000
        });
        break;
      case 'success':
        this.showNotification({
          title: "✅ สำรองข้อมูลสำเร็จ",
          message: "ข้อมูลได้รับการสำรองเรียบร้อยแล้ว",
          type: 'success',
          duration: 5000
        });
        break;
      case 'error':
        this.showNotification({
          title: "❌ สำรองข้อมูลล้มเหลว",
          message: "ไม่สามารถสำรองข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
          type: 'error',
          duration: 8000
        });
        break;
    }
  }

  // User activity notifications
  showUserActivityNotification(userName: string, action: string) {
    this.showNotification({
      title: "👤 กิจกรรมผู้ใช้",
      message: `${userName} ${action}`,
      type: 'info',
      duration: 3000
    });
  }

  // Data import/export notifications
  showDataOperationNotification(operation: 'import' | 'export', status: 'start' | 'success' | 'error', count?: number) {
    const operationText = operation === 'import' ? 'นำเข้า' : 'ส่งออก';
    const countText = count ? ` ${count} รายการ` : '';
    
    switch (status) {
      case 'start':
        this.showNotification({
          title: `🔄 กำลัง${operationText}ข้อมูล`,
          message: `ระบบกำลัง${operationText}ข้อมูล${countText}`,
          type: 'info',
          duration: 3000
        });
        break;
      case 'success':
        this.showNotification({
          title: `✅ ${operationText}ข้อมูลสำเร็จ`,
          message: `${operationText}ข้อมูล${countText}เรียบร้อยแล้ว`,
          type: 'success',
          duration: 5000
        });
        break;
      case 'error':
        this.showNotification({
          title: `❌ ${operationText}ข้อมูลล้มเหลว`,
          message: `ไม่สามารถ${operationText}ข้อมูลได้`,
          type: 'error',
          duration: 8000
        });
        break;
    }
  }

  // Permission notifications
  showPermissionNotification(action: string, hasPermission: boolean) {
    if (hasPermission) {
      this.showNotification({
        title: "✅ การอนุญาต",
        message: `คุณมีสิทธิ์${action}`,
        type: 'success',
        duration: 3000
      });
    } else {
      this.showNotification({
        title: "❌ ไม่มีสิทธิ์",
        message: `คุณไม่มีสิทธิ์${action}`,
        type: 'error',
        duration: 5000
      });
    }
  }

  // Network status notifications
  showNetworkStatusNotification(isOnline: boolean) {
    if (isOnline) {
      this.showNotification({
        title: "🌐 เชื่อมต่ออินเทอร์เน็ต",
        message: "ระบบเชื่อมต่ออินเทอร์เน็ตแล้ว",
        type: 'success',
        duration: 3000
      });
    } else {
      this.showNotification({
        title: "📡 ขาดการเชื่อมต่อ",
        message: "ระบบขาดการเชื่อมต่ออินเทอร์เน็ต",
        type: 'error',
        duration: 0 // Don't auto-dismiss
      });
    }
  }

  // Remove notification
  removeNotification(config: NotificationConfig) {
    const index = this.notifications.indexOf(config);
    if (index > -1) {
      this.notifications.splice(index, 1);
      this.notifyListeners();
    }
  }

  // Get all notifications
  getNotifications(): NotificationConfig[] {
    return [...this.notifications];
  }

  // Clear all notifications
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Subscribe to notifications
  subscribe(listener: (notifications: NotificationConfig[]) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();