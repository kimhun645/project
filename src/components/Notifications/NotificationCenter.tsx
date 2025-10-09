import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Trash2, Settings, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { notificationService, Notification, NotificationSettings } from '@/lib/notificationService';
import { cn } from '@/lib/utils';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>(notificationService.getSettings());
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    // Load initial notifications
    setNotifications(notificationService.getNotifications());

    // Subscribe to notification changes
    const unsubscribe = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
    });

    return unsubscribe;
  }, []);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  const handleMarkAsRead = (id: string) => {
    notificationService.markAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    notificationService.markAllAsRead();
  };

  const handleDelete = (id: string) => {
    notificationService.deleteNotification(id);
  };

  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };

  const handleSettingsChange = (newSettings: Partial<NotificationSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    notificationService.updateSettings(updatedSettings);
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50" onClick={onClose}>
      <div className="flex justify-end pt-16 pr-4">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
          <Card className="border-0 shadow-none">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold">การแจ้งเตือน</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
                  >
                    <Filter className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs defaultValue="notifications" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="notifications">
                    การแจ้งเตือน
                    {notificationService.getUnreadCount() > 0 && (
                      <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
                        {notificationService.getUnreadCount()}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="settings">ตั้งค่า</TabsTrigger>
                </TabsList>

                <TabsContent value="notifications" className="p-4 space-y-4">
                  {/* Filter buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant={filter === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('all')}
                    >
                      ทั้งหมด ({notifications.length})
                    </Button>
                    <Button
                      variant={filter === 'unread' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setFilter('unread')}
                    >
                      ยังไม่อ่าน ({notificationService.getUnreadCount()})
                    </Button>
                  </div>

                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      disabled={notificationService.getUnreadCount() === 0}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      อ่านทั้งหมด
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleClearAll}
                      disabled={notifications.length === 0}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      ลบทั้งหมด
                    </Button>
                  </div>

                  {/* Notifications list */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredNotifications.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p>ไม่มีการแจ้งเตือน</p>
                      </div>
                    ) : (
                      filteredNotifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            'p-3 rounded-lg border transition-all duration-200 hover:shadow-md',
                            getNotificationColor(notification.type),
                            !notification.read && 'ring-2 ring-blue-200'
                          )}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="text-lg">{getNotificationIcon(notification.type)}</div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <div className="flex items-center space-x-1">
                                  {!notification.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(notification.id)}
                                    className="h-6 w-6 p-0"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-xs text-gray-400">
                                  {notification.timestamp.toLocaleString('th-TH')}
                                </span>
                                <div className="flex space-x-1">
                                  {!notification.read && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <Check className="h-3 w-3 mr-1" />
                                      อ่านแล้ว
                                    </Button>
                                  )}
                                  {notification.actionUrl && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        window.location.href = notification.actionUrl!;
                                        onClose();
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      {notification.actionText || 'ดูรายละเอียด'}
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="p-4 space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">การแจ้งเตือนในแอป</h4>
                        <p className="text-sm text-gray-500">แสดงการแจ้งเตือนในแอปพลิเคชัน</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableInApp}
                        onChange={(e) => handleSettingsChange({ enableInApp: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">การแจ้งเตือนแบบ Push</h4>
                        <p className="text-sm text-gray-500">ส่งการแจ้งเตือนไปยังเบราว์เซอร์</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enablePush}
                        onChange={(e) => handleSettingsChange({ enablePush: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">การแจ้งเตือนทางอีเมล</h4>
                        <p className="text-sm text-gray-500">ส่งการแจ้งเตือนไปยังอีเมล</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.enableEmail}
                        onChange={(e) => handleSettingsChange({ enableEmail: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">เกณฑ์สินค้าใกล้หมด</label>
                      <input
                        type="number"
                        value={settings.lowStockThreshold}
                        onChange={(e) => handleSettingsChange({ lowStockThreshold: parseInt(e.target.value) })}
                        className="w-full p-2 border rounded"
                        min="1"
                        max="100"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">แจ้งเตือนสินค้าหมด</h4>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อสินค้าหมดสต็อก</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.outOfStockAlert}
                        onChange={(e) => handleSettingsChange({ outOfStockAlert: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">แจ้งเตือนการเคลื่อนไหว</h4>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีการเคลื่อนไหวสต็อก</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.movementAlerts}
                        onChange={(e) => handleSettingsChange({ movementAlerts: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">แจ้งเตือนคำขออนุมัติ</h4>
                        <p className="text-sm text-gray-500">แจ้งเตือนเมื่อมีคำขออนุมัติใหม่</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.approvalAlerts}
                        onChange={(e) => handleSettingsChange({ approvalAlerts: e.target.checked })}
                        className="h-4 w-4 text-blue-600"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
