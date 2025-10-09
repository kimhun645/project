// Notification Service for Material Management System
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

export interface NotificationSettings {
  enablePush: boolean;
  enableEmail: boolean;
  enableInApp: boolean;
  lowStockThreshold: number;
  outOfStockAlert: boolean;
  movementAlerts: boolean;
  approvalAlerts: boolean;
}

class NotificationService {
  private notifications: Notification[] = [];
  private settings: NotificationSettings = {
    enablePush: true,
    enableEmail: false,
    enableInApp: true,
    lowStockThreshold: 10,
    outOfStockAlert: true,
    movementAlerts: true,
    approvalAlerts: true
  };
  private listeners: Array<(notifications: Notification[]) => void> = [];

  constructor() {
    this.loadSettings();
    this.loadNotifications();
    this.setupServiceWorker();
  }

  // Load settings from localStorage
  private loadSettings() {
    const saved = localStorage.getItem('notificationSettings');
    if (saved) {
      this.settings = { ...this.settings, ...JSON.parse(saved) };
    }
  }

  // Save settings to localStorage
  private saveSettings() {
    localStorage.setItem('notificationSettings', JSON.stringify(this.settings));
  }

  // Load notifications from localStorage
  private loadNotifications() {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      this.notifications = JSON.parse(saved).map((n: any) => ({
        ...n,
        timestamp: new Date(n.timestamp)
      }));
    }
  }

  // Save notifications to localStorage
  private saveNotifications() {
    localStorage.setItem('notifications', JSON.stringify(this.notifications));
  }

  // Setup service worker for push notifications
  private async setupServiceWorker() {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Check if service worker is already registered
        const existingRegistration = await navigator.serviceWorker.getRegistration('/');
        if (existingRegistration) {
          console.log('Service Worker already registered:', existingRegistration);
          return existingRegistration;
        }
        
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
      }
    }
    return null;
  }

  // Add notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    
    // Keep only last 100 notifications
    if (this.notifications.length > 100) {
      this.notifications = this.notifications.slice(0, 100);
    }

    this.saveNotifications();
    this.notifyListeners();

    // Send push notification if enabled
    if (this.settings.enablePush) {
      this.sendPushNotification(newNotification);
    }

    // Send email notification if enabled
    if (this.settings.enableEmail) {
      this.sendEmailNotification(newNotification);
    }

    return newNotification;
  }

  // Get all notifications
  getNotifications(): Notification[] {
    return this.notifications;
  }

  // Get unread notifications
  getUnreadNotifications(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  // Mark notification as read
  markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Mark all notifications as read
  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Delete notification
  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveNotifications();
    this.notifyListeners();
  }

  // Clear all notifications
  clearAllNotifications() {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
  }

  // Get notification settings
  getSettings(): NotificationSettings {
    return { ...this.settings };
  }

  // Update notification settings
  updateSettings(newSettings: Partial<NotificationSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.saveSettings();
  }

  // Subscribe to notification changes
  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Send push notification
  private async sendPushNotification(notification: Notification) {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notificationOptions = {
        body: notification.message,
        icon: '/icon-192x192.png',
        badge: '/badge-72x72.png',
        tag: notification.id,
        data: {
          url: notification.actionUrl || '/',
          id: notification.id
        }
      };

      new Notification(notification.title, notificationOptions);
    }
  }

  // Send email notification (placeholder)
  private async sendEmailNotification(notification: Notification) {
    // This would integrate with an email service
    console.log('Email notification:', notification);
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Check if notifications are supported
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Get unread count
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  // Create specific notification types
  createLowStockAlert(productName: string, currentStock: number, threshold: number) {
    return this.addNotification({
      type: 'warning',
      title: 'สินค้าใกล้หมด',
      message: `${productName} เหลือเพียง ${currentStock} ชิ้น (ต่ำกว่า ${threshold} ชิ้น)`,
      actionUrl: '/products',
      actionText: 'ดูสินค้า'
    });
  }

  createOutOfStockAlert(productName: string) {
    return this.addNotification({
      type: 'error',
      title: 'สินค้าหมด',
      message: `${productName} หมดสต็อกแล้ว`,
      actionUrl: '/products',
      actionText: 'ดูสินค้า'
    });
  }

  createMovementAlert(movementType: string, productName: string, quantity: number) {
    return this.addNotification({
      type: 'info',
      title: 'การเคลื่อนไหวสต็อก',
      message: `${movementType} ${productName} จำนวน ${quantity} ชิ้น`,
      actionUrl: '/movements',
      actionText: 'ดูการเคลื่อนไหว'
    });
  }

  createApprovalAlert(requestTitle: string, requester: string) {
    return this.addNotification({
      type: 'info',
      title: 'คำขออนุมัติใหม่',
      message: `${requestTitle} จาก ${requester}`,
      actionUrl: '/approval',
      actionText: 'ดูคำขอ'
    });
  }

  createApprovalStatusAlert(requestTitle: string, status: string) {
    return this.addNotification({
      type: status === 'approved' ? 'success' : 'warning',
      title: 'สถานะคำขอ',
      message: `${requestTitle} ${status === 'approved' ? 'อนุมัติแล้ว' : 'ถูกปฏิเสธ'}`,
      actionUrl: '/approval/history',
      actionText: 'ดูประวัติ'
    });
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Export types
export type { Notification, NotificationSettings };
