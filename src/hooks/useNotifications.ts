import { useState, useEffect } from 'react';
import { notificationService, NotificationConfig } from '@/lib/notificationService';

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationConfig[]>([]);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(setNotifications);
    return unsubscribe;
  }, []);

  const showNotification = (config: NotificationConfig) => {
    notificationService.showNotification(config);
  };

  const showLowStockAlert = (productName: string, currentStock: number, minStock: number) => {
    notificationService.showLowStockAlert(productName, currentStock, minStock);
  };

  const showOutOfStockAlert = (productName: string) => {
    notificationService.showOutOfStockAlert(productName);
  };

  const showSystemNotification = (title: string, message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    notificationService.showSystemNotification(title, message, type);
  };

  const showBackupNotification = (type: 'start' | 'success' | 'error') => {
    notificationService.showBackupNotification(type);
  };

  const showUserActivityNotification = (userName: string, action: string) => {
    notificationService.showUserActivityNotification(userName, action);
  };

  const showDataOperationNotification = (operation: 'import' | 'export', status: 'start' | 'success' | 'error', count?: number) => {
    notificationService.showDataOperationNotification(operation, status, count);
  };

  const showPermissionNotification = (action: string, hasPermission: boolean) => {
    notificationService.showPermissionNotification(action, hasPermission);
  };

  const showNetworkStatusNotification = (isOnline: boolean) => {
    notificationService.showNetworkStatusNotification(isOnline);
  };

  const clearAll = () => {
    notificationService.clearAll();
  };

  return {
    notifications,
    showNotification,
    showLowStockAlert,
    showOutOfStockAlert,
    showSystemNotification,
    showBackupNotification,
    showUserActivityNotification,
    showDataOperationNotification,
    showPermissionNotification,
    showNetworkStatusNotification,
    clearAll
  };
}
