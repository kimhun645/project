import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ChangePasswordDialog } from '@/components/Dialogs/ChangePasswordDialog';
import { 
  User, 
  Mail, 
  Shield, 
  Calendar, 
  Clock, 
  Key, 
  LogOut, 
  Edit3, 
  CheckCircle, 
  AlertTriangle,
  UserCheck,
  Activity,
  RefreshCw,
  Bell,
  Settings,
  Camera,
  Save,
  X,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Smartphone,
  Monitor,
  Globe,
  Database,
  BarChart3,
  TrendingUp,
  Award,
  Star,
  Heart,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout/Layout';

export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const { toast } = useToast();
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || '',
    phone: '',
    department: '',
    position: ''
  });

  // Mock data for demonstration
  const [userStats] = useState({
    totalLogins: 156,
    lastLogin: '2024-01-15T10:30:00Z',
    sessionDuration: '2h 45m',
    actionsToday: 23,
    totalActions: 1247,
    rank: 'Gold',
    level: 8,
    experience: 75
  });

  const [notifications, setNotifications] = useState({
    email: true,
    push: false,
    sms: true,
    weekly: true,
    monthly: false,
    security: true,
    updates: true
  });

  const [preferences, setPreferences] = useState({
    theme: 'light',
    language: 'th',
    timezone: 'Asia/Bangkok',
    dateFormat: 'DD/MM/YYYY',
    currency: 'THB'
  });

  useEffect(() => {
    if (currentUser) {
      setEditData({
        displayName: currentUser.displayName || '',
        email: currentUser.email || '',
        phone: '',
        department: '',
        position: ''
      });
    }
  }, [currentUser]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    toast({
      title: "บันทึกสำเร็จ",
      description: "ข้อมูลส่วนตัวได้รับการอัปเดตแล้ว",
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || '',
      phone: '',
      department: '',
      position: ''
    });
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "ออกจากระบบ",
        description: "คุณได้ออกจากระบบเรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast({
      title: "การตั้งค่าอัปเดต",
      description: `การแจ้งเตือน ${key} ได้รับการอัปเดตแล้ว`,
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Gold': return 'bg-yellow-500';
      case 'Silver': return 'bg-gray-400';
      case 'Bronze': return 'bg-orange-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Header Section */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl opacity-90"></div>
            <div className="relative bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20">
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-white/30 shadow-xl">
                    <AvatarImage src={(currentUser as any)?.photoURL || ''} />
                    <AvatarFallback className="text-2xl font-bold bg-white/20 text-white">
                      {getInitials(currentUser?.displayName || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2 border-4 border-white">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{currentUser?.displayName || 'ผู้ใช้'}</h1>
                    <Badge className={`${getRankColor(userStats.rank)} text-white border-0`}>
                      <Award className="h-3 w-3 mr-1" />
                      {userStats.rank}
                    </Badge>
                  </div>
                  <p className="text-white/80 text-lg mb-4">{currentUser?.email}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>เข้าร่วม: {new Date().toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      <span>ระดับ: {userStats.level}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span>ประสบการณ์: {userStats.experience}%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleEdit}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                  >
                    <Edit3 className="h-4 w-4 mr-2" />
                    แก้ไข
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-300/50"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    ออกจากระบบ
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">การเข้าสู่ระบบ</p>
                    <p className="text-3xl font-bold">{userStats.totalLogins}</p>
                    <p className="text-blue-200 text-xs">ครั้งทั้งหมด</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">การดำเนินการ</p>
                    <p className="text-3xl font-bold">{userStats.actionsToday}</p>
                    <p className="text-green-200 text-xs">วันนี้</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">ระยะเวลาเซสชัน</p>
                    <p className="text-3xl font-bold">{userStats.sessionDuration}</p>
                    <p className="text-purple-200 text-xs">เฉลี่ย</p>
                  </div>
                  <Clock className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">คะแนนรวม</p>
                    <p className="text-3xl font-bold">{userStats.totalActions}</p>
                    <p className="text-orange-200 text-xs">คะแนน</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <User className="h-6 w-6 text-blue-600" />
                    ข้อมูลส่วนตัว
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  {isEditing ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="displayName" className="text-sm font-medium">ชื่อ-นามสกุล</Label>
                          <Input
                            id="displayName"
                            value={editData.displayName}
                            onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-sm font-medium">อีเมล</Label>
                          <Input
                            id="email"
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-sm font-medium">เบอร์โทรศัพท์</Label>
                          <Input
                            id="phone"
                            value={editData.phone}
                            onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="department" className="text-sm font-medium">แผนก</Label>
                          <Input
                            id="department"
                            value={editData.department}
                            onChange={(e) => setEditData(prev => ({ ...prev, department: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="position" className="text-sm font-medium">ตำแหน่ง</Label>
                          <Input
                            id="position"
                            value={editData.position}
                            onChange={(e) => setEditData(prev => ({ ...prev, position: e.target.value }))}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="flex gap-3 pt-4">
                        <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                          <Save className="h-4 w-4 mr-2" />
                          บันทึก
                        </Button>
                        <Button variant="outline" onClick={handleCancel}>
                          <X className="h-4 w-4 mr-2" />
                          ยกเลิก
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <User className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">ชื่อ-นามสกุล</p>
                              <p className="font-medium">{currentUser?.displayName || 'ไม่ระบุ'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">อีเมล</p>
                              <p className="font-medium">{currentUser?.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">เบอร์โทรศัพท์</p>
                              <p className="font-medium">{editData.phone || 'ไม่ระบุ'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-gray-500" />
                            <div>
                              <p className="text-sm text-gray-500">สถานะ</p>
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                ใช้งานได้
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-red-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Shield className="h-6 w-6 text-red-600" />
                    ความปลอดภัย
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">รหัสผ่าน</p>
                          <p className="text-sm text-gray-500">อัปเดตล่าสุด: 15 ม.ค. 2567</p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setChangePasswordDialogOpen(true)}
                      >
                        เปลี่ยนรหัสผ่าน
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Monitor className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">การเข้าสู่ระบบ 2 ขั้นตอน</p>
                          <p className="text-sm text-gray-500">เพิ่มความปลอดภัยให้กับบัญชี</p>
                        </div>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              
              {/* Notifications */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-yellow-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Bell className="h-5 w-5 text-yellow-600" />
                    การแจ้งเตือน
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {Object.entries(notifications).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">
                          {key === 'email' ? 'อีเมล' :
                           key === 'push' ? 'Push Notification' :
                           key === 'sms' ? 'SMS' :
                           key === 'weekly' ? 'รายสัปดาห์' :
                           key === 'monthly' ? 'รายเดือน' :
                           key === 'security' ? 'ความปลอดภัย' :
                           key === 'updates' ? 'อัปเดต' : key}
                        </span>
                        <Switch
                          checked={value}
                          onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Preferences */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-green-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <Settings className="h-5 w-5 text-green-600" />
                    การตั้งค่า
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ธีม</span>
                      <Badge variant="outline">{preferences.theme === 'light' ? 'สว่าง' : 'มืด'}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">ภาษา</span>
                      <Badge variant="outline">ไทย</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">เขตเวลา</span>
                      <Badge variant="outline">GMT+7</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">รูปแบบวันที่</span>
                      <Badge variant="outline">DD/MM/YYYY</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Activity Summary */}
              <Card className="shadow-xl border-0">
                <CardHeader className="bg-gradient-to-r from-slate-50 to-purple-50 border-b">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <BarChart3 className="h-5 w-5 text-purple-600" />
                    สรุปกิจกรรม
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">เข้าสู่ระบบครั้งล่าสุด</span>
                      <span className="text-sm font-medium">{new Date(userStats.lastLogin).toLocaleDateString('th-TH')}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">การดำเนินการวันนี้</span>
                      <span className="text-sm font-medium">{userStats.actionsToday} ครั้ง</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">คะแนนรวม</span>
                      <span className="text-sm font-medium">{userStats.totalActions}</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">ระดับ</span>
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">Level {userStats.level}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password Dialog */}
      <ChangePasswordDialog
        open={changePasswordDialogOpen}
        onOpenChange={setChangePasswordDialogOpen}
      />
    </Layout>
  );
}