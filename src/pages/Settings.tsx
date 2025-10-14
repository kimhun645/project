import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Shield, Palette, Upload, Download, Trash2, Settings as SettingsIcon, Package, Key, CreditCard, Plus, FileEdit as Edit, Trash, CheckCircle, AlertTriangle, RefreshCw, Mail, Globe, Lock, Users, FileText, BarChart3, Crown, UserCheck, UserX, LogOut, Search, Filter, Grid3x3 as Grid3X3, List } from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreService } from '@/lib/firestoreService';
import { UserManagement } from '@/components/UserManagement';
import { RoleManagement } from '@/components/RoleManagement';
import { AccountManagement } from '@/components/AccountManagement';
import {
  ProductsStylePageLayout,
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  type StatCard
} from '@/components/ui/products-style-components';

// Schema สำหรับการตั้งค่า
const settingsSchema = z.object({
  // ข้อมูลบริษัท
  companyName: z.string().min(1, 'ชื่อบริษัทจำเป็นต้องระบุ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().min(1, 'เบอร์โทรศัพท์จำเป็นต้องระบุ'),
  address: z.string().min(1, 'ที่อยู่จำเป็นต้องระบุ'),
  currency: z.enum(['THB', 'USD', 'EUR']),
  
  // การตั้งค่าการแจ้งเตือน
  lowStockAlert: z.boolean(),
  emailNotifications: z.boolean(),
  autoBackup: z.boolean(),
  
  // การตั้งค่าผู้อนุมัติ
  approverName: z.string().min(1, 'ชื่อผู้อนุมัติจำเป็นต้องระบุ'),
  approverEmail: z.string().email('รูปแบบอีเมลผู้อนุมัติไม่ถูกต้อง'),
  ccEmails: z.string().optional(),

  // การตั้งค่าการรักษาความปลอดภัย
  sessionTimeout: z.number().min(5, 'เวลาหมดอายุต้องไม่น้อยกว่า 5 นาที'),
  maxLoginAttempts: z.number().min(3, 'จำนวนครั้งที่พยายามเข้าสู่ระบบต้องไม่น้อยกว่า 3'),
  requireTwoFactor: z.boolean(),
  
  // การตั้งค่าธีม
  theme: z.enum(['light', 'dark', 'system']),
  primaryColor: z.string(),
  fontSize: z.enum(['small', 'medium', 'large']),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { currentUser, isLoading, signOut, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalRoles: 3, // Fixed roles: staff, manager, admin
    totalAccountCodes: 0,
    totalSettings: 8 // Fixed settings categories
  });
  const [statsLoading, setStatsLoading] = useState(true);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      currency: 'THB',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      approverName: '',
      approverEmail: '',
      ccEmails: '',
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      theme: 'light',
      primaryColor: '#3b82f6',
      fontSize: 'medium',
    },
  });

  useEffect(() => {
    loadSettings();
    loadStatsData();
  }, []);

  const loadStatsData = async () => {
    setStatsLoading(true);
    try {
      // Load users count
      console.log('🔍 กำลังดึงข้อมูลผู้ใช้...');
      const users = await FirestoreService.getUsers();
      console.log('👥 จำนวนผู้ใช้ที่ได้:', users.length, users);
      
      // Load account codes count
      console.log('🔍 กำลังดึงข้อมูลรหัสบัญชี...');
      const accountCodes = await FirestoreService.getAccountCodes();
      console.log('🔑 จำนวนรหัสบัญชีที่ได้:', accountCodes.length, accountCodes);
      
      const newStatsData = {
        totalUsers: users.length,
        totalRoles: 3, // Fixed: staff, manager, admin
        totalAccountCodes: accountCodes.length,
        totalSettings: 8 // Fixed: general, notifications, security, theme, etc.
      };
      
      console.log('📊 สถิติที่ได้:', newStatsData);
      setStatsData(newStatsData);
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการโหลดข้อมูลสถิติ:', error);
      // Keep default values if error occurs
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settings = await FirestoreService.getSettings();
      if (settings) {
        form.reset(settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async (data: SettingsFormData) => {
    try {
      await FirestoreService.saveSettings(data);
      toast({
        title: "บันทึกการตั้งค่าเรียบร้อย",
        description: "การตั้งค่าถูกบันทึกเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้",
        variant: "destructive",
      });
    }
  };


  const handleExportData = async () => {
    try {
      toast({
        title: "ฟีเจอร์ส่งออกข้อมูล",
        description: "กำลังพัฒนา - ใช้ Export ในแต่ละหน้าแทน",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      toast({
        title: "ฟีเจอร์นำเข้าข้อมูล",
        description: "กำลังพัฒนา - ใช้ Import ในแต่ละหน้าแทน",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  // Stats cards data with real data
  const statsCards: StatCard[] = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: statsLoading ? "..." : statsData.totalUsers.toString(),
      icon: <Users className="h-6 w-6" />,
      color: "blue",
    },
    {
      title: "บทบาทที่ใช้งาน",
      value: statsLoading ? "..." : statsData.totalRoles.toString(),
      icon: <Shield className="h-6 w-6" />,
      color: "green",
    },
    {
      title: "รหัสบัญชี",
      value: statsLoading ? "..." : statsData.totalAccountCodes.toString(),
      icon: <Key className="h-6 w-6" />,
      color: "purple",
    },
    {
      title: "การตั้งค่า",
      value: statsLoading ? "..." : statsData.totalSettings.toString(),
      icon: <SettingsIcon className="h-6 w-6" />,
      color: "orange",
    },
  ];

  const handleDeleteAllData = async () => {
      try {
      toast({
        title: "คำเตือน",
        description: "ฟีเจอร์นี้ปิดการใช้งานเพื่อความปลอดภัยของข้อมูล",
        variant: "destructive",
      });
      } catch (error) {
        toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบข้อมูลได้",
          variant: "destructive",
        });
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลผู้ใช้</h2>
          <p className="text-gray-600">กรุณาเข้าสู่ระบบใหม่</p>
            </div>
      </Layout>
    );
  }

  const canManageUsers = hasPermission('users:read');
  const canManageSettings = hasPermission('settings:read');

  return (
    <ProductsStylePageLayout>
      <ProductsStylePageHeader
        title="การตั้งค่าระบบ"
        description="จัดการการตั้งค่าและผู้ใช้ในระบบ"
        icon={SettingsIcon}
        searchPlaceholder="ค้นหาการตั้งค่า..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => {
          setSearchTerm('');
          loadStatsData();
          toast({ title: "รีเฟรชการตั้งค่า", description: "โหลดข้อมูลใหม่เรียบร้อยแล้ว" });
        }}
        primaryAction={
          <Button onClick={handleSignOut} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
        }
        secondaryActions={[
          <Button key="view-mode" variant="outline" onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}>
            {viewMode === 'table' ? <Grid3X3 className="h-4 w-4 mr-2" /> : <List className="h-4 w-4 mr-2" />}
            {viewMode === 'table' ? 'Grid View' : 'Table View'}
          </Button>
        ]}
      />

      <div className="space-y-6 mt-6">
        {/* Stats Cards */}
        <ProductsStyleStatsCards cards={statsCards} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
                ทั่วไป
              </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
                การแจ้งเตือน
              </TabsTrigger>
            <TabsTrigger value="accounts" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Account
              </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              ผู้ใช้
              </TabsTrigger>
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              บทบาท
              </TabsTrigger>
            </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {canManageSettings ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
                  {/* Company Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                  ข้อมูลบริษัท
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อบริษัท</FormLabel>
                        <FormControl>
                                <Input {...field} placeholder="ชื่อบริษัท" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                                <Input {...field} type="email" placeholder="company@example.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                                <Input {...field} placeholder="02-123-4567" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สกุลเงิน</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                                    <SelectValue placeholder="เลือกสกุลเงิน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                                  <SelectItem value="THB">บาท (THB)</SelectItem>
                                  <SelectItem value="USD">ดอลลาร์ (USD)</SelectItem>
                                  <SelectItem value="EUR">ยูโร (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่</FormLabel>
                      <FormControl>
                              <Input {...field} placeholder="ที่อยู่บริษัท" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      บันทึกการตั้งค่า
              </Button>
            </div>
                </form>
              </Form>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
                  <p className="text-gray-500">คุณไม่มีสิทธิ์ในการจัดการการตั้งค่า</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            {canManageSettings ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSaveSettings)} className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                  การตั้งค่าการแจ้งเตือน
                </CardTitle>
              </CardHeader>
                    <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="lowStockAlert"
                  render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                      <div>
                              <FormLabel>แจ้งเตือนสต็อกต่ำ</FormLabel>
                              <p className="text-sm text-gray-500">แจ้งเตือนเมื่อสต็อกสินค้าต่ำกว่าที่กำหนด</p>
                      </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                      <div>
                              <FormLabel>การแจ้งเตือนทางอีเมล</FormLabel>
                              <p className="text-sm text-gray-500">ส่งการแจ้งเตือนผ่านอีเมล</p>
                      </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                <FormField
                  control={form.control}
                  name="autoBackup"
                  render={({ field }) => (
                          <FormItem className="flex items-center justify-between">
                      <div>
                              <FormLabel>สำรองข้อมูลอัตโนมัติ</FormLabel>
                              <p className="text-sm text-gray-500">สำรองข้อมูลทุกวันอัตโนมัติ</p>
                      </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
              </CardContent>
            </Card>

                  <div className="flex justify-end">
                    <Button type="submit" className="bg-gradient-to-r from-blue-500 to-indigo-600">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      บันทึกการตั้งค่า
                        </Button>
                      </div>
                </form>
              </Form>
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
                  <p className="text-gray-500">คุณไม่มีสิทธิ์ในการจัดการการตั้งค่า</p>
              </CardContent>
            </Card>
            )}
          </TabsContent>

          {/* Account Management */}
          <TabsContent value="accounts">
            <AccountManagement />
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Role Management */}
          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>
        </Tabs>
      </div>

    </ProductsStylePageLayout>
  );
}