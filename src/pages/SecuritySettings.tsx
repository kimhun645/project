import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Users, 
  Eye, 
  Lock, 
  Key, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { UserRole, hasPermission, Permission } from '@/lib/rbac';
import { auditLogger, AuditAction } from '@/lib/auditLogger';
import { ensureArray, safeMap, safeLength, safeFilter } from '@/utils/arraySafety';

interface SecuritySettings {
  twoFactorEnabled: boolean;
  sessionTimeout: number;
  passwordExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  auditLogRetention: number;
  encryptionEnabled: boolean;
  ipWhitelist: string[];
  allowedDomains: string[];
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  level: string;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export default function SecuritySettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState<SecuritySettings>({
    twoFactorEnabled: false,
    sessionTimeout: 30,
    passwordExpiry: 90,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    auditLogRetention: 365,
    encryptionEnabled: true,
    ipWhitelist: [],
    allowedDomains: []
  });
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [newDomain, setNewDomain] = useState('');

  // ตรวจสอบสิทธิ์การเข้าถึง
  const canManageSecurity = hasPermission(user!, Permission.MANAGE_SETTINGS);
  const canViewAuditLogs = hasPermission(user!, Permission.VIEW_AUDIT_LOGS);

  useEffect(() => {
    if (canManageSecurity) {
      loadSettings();
    }
    if (canViewAuditLogs) {
      loadAuditLogs();
    }
  }, [canManageSecurity, canViewAuditLogs]);

  const loadSettings = async () => {
    try {
      // โหลดการตั้งค่าความปลอดภัยจาก API
      const response = await fetch('/api/security-settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading security settings:', error);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs?limit=50');
      if (response.ok) {
        const data = await response.json();
        setAuditLogs(data.logs);
      }
    } catch (error) {
      console.error('Error loading audit logs:', error);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/security-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        toast({
          title: "บันทึกการตั้งค่าเรียบร้อย",
          description: "การตั้งค่าความปลอดภัยได้รับการอัพเดทแล้ว",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addIpToWhitelist = () => {
    if (newIp && !settings.ipWhitelist.includes(newIp)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp]
      }));
      setNewIp('');
    }
  };

  const removeIpFromWhitelist = (ip: string) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: safeFilter(prev.ipWhitelist, i => i !== ip)
    }));
  };

  const addDomainToWhitelist = () => {
    if (newDomain && !settings.allowedDomains.includes(newDomain)) {
      setSettings(prev => ({
        ...prev,
        allowedDomains: [...prev.allowedDomains, newDomain]
      }));
      setNewDomain('');
    }
  };

  const removeDomainFromWhitelist = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      allowedDomains: safeFilter(prev.allowedDomains, d => d !== domain)
    }));
  };

  const exportAuditLogs = async () => {
    try {
      const response = await fetch('/api/audit-logs/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออก audit logs ได้",
        variant: "destructive",
      });
    }
  };

  const clearAuditLogs = async () => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบ audit logs ทั้งหมด?')) {
      try {
        const response = await fetch('/api/audit-logs', {
          method: 'DELETE',
        });
        if (response.ok) {
          setAuditLogs([]);
          toast({
            title: "ลบ audit logs เรียบร้อย",
            description: "audit logs ทั้งหมดถูกลบแล้ว",
          });
        }
      } catch (error) {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบ audit logs ได้",
          variant: "destructive",
        });
      }
    }
  };

  if (!canManageSecurity && !canViewAuditLogs) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Alert className="max-w-md">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="w-full space-y-6 pb-8">
        <PageHeader 
          title="การตั้งค่าความปลอดภัย"
          description="จัดการการตั้งค่าความปลอดภัยและติดตามการใช้งานระบบ"
          icon={Shield}
        />

        <Tabs defaultValue="settings" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">การตั้งค่า</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-6">
            {canManageSecurity ? (
              <>
                {/* Session Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Lock className="mr-2 h-5 w-5" />
                      การตั้งค่า Session
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="sessionTimeout">Session Timeout (นาที)</Label>
                        <Input
                          id="sessionTimeout"
                          type="number"
                          value={settings.sessionTimeout}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            sessionTimeout: parseInt(e.target.value) || 30
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="passwordExpiry">Password Expiry (วัน)</Label>
                        <Input
                          id="passwordExpiry"
                          type="number"
                          value={settings.passwordExpiry}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            passwordExpiry: parseInt(e.target.value) || 90
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Security Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="mr-2 h-5 w-5" />
                      การตั้งค่าความปลอดภัย
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="encryptionEnabled">เปิดใช้งานการเข้ารหัสข้อมูล</Label>
                        <p className="text-sm text-muted-foreground">
                          เข้ารหัสข้อมูลที่สำคัญก่อนเก็บในฐานข้อมูล
                        </p>
                      </div>
                      <Switch
                        id="encryptionEnabled"
                        checked={settings.encryptionEnabled}
                        onCheckedChange={(checked) => setSettings(prev => ({
                          ...prev,
                          encryptionEnabled: checked
                        }))}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="maxLoginAttempts">จำนวนครั้งที่ล็อกอินผิดสูงสุด</Label>
                        <Input
                          id="maxLoginAttempts"
                          type="number"
                          value={settings.maxLoginAttempts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            maxLoginAttempts: parseInt(e.target.value) || 5
                          }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="lockoutDuration">ระยะเวลาล็อค (นาที)</Label>
                        <Input
                          id="lockoutDuration"
                          type="number"
                          value={settings.lockoutDuration}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            lockoutDuration: parseInt(e.target.value) || 15
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* IP Whitelist */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Key className="mr-2 h-5 w-5" />
                      IP Whitelist
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="เพิ่ม IP Address"
                        value={newIp}
                        onChange={(e) => setNewIp(e.target.value)}
                      />
                      <Button onClick={addIpToWhitelist}>เพิ่ม</Button>
                    </div>
                    <div className="space-y-2">
                      {safeMap(settings.ipWhitelist, (ip, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-accent rounded">
                          <span>{ip}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIpFromWhitelist(ip)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={loading}>
                    {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
                  </Button>
                </div>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  คุณไม่มีสิทธิ์จัดการการตั้งค่าความปลอดภัย
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            {canViewAuditLogs ? (
              <>
                {/* Audit Logs Actions */}
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Audit Logs</h3>
                  <div className="space-x-2">
                    <Button variant="outline" onClick={exportAuditLogs}>
                      <Download className="mr-2 h-4 w-4" />
                      ส่งออก
                    </Button>
                    <Button variant="destructive" onClick={clearAuditLogs}>
                      <Trash2 className="mr-2 h-4 w-4" />
                      ลบทั้งหมด
                    </Button>
                  </div>
                </div>

                {/* Audit Logs Table */}
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b">
                          <tr>
                            <th className="text-left p-4">เวลา</th>
                            <th className="text-left p-4">ผู้ใช้</th>
                            <th className="text-left p-4">การกระทำ</th>
                            <th className="text-left p-4">สถานะ</th>
                            <th className="text-left p-4">IP</th>
                          </tr>
                        </thead>
                        <tbody>
                          {safeMap(auditLogs, (log) => (
                            <tr key={log.id} className="border-b">
                              <td className="p-4 text-sm">
                                {new Date(log.timestamp).toLocaleString('th-TH')}
                              </td>
                              <td className="p-4 text-sm">
                                <div>
                                  <div className="font-medium">{log.userEmail}</div>
                                  <div className="text-muted-foreground">{log.userRole}</div>
                                </div>
                              </td>
                              <td className="p-4 text-sm">
                                <Badge variant="outline">{log.action}</Badge>
                              </td>
                              <td className="p-4">
                                {log.success ? (
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                              </td>
                              <td className="p-4 text-sm text-muted-foreground">
                                {log.ipAddress || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  คุณไม่มีสิทธิ์ดู audit logs
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
