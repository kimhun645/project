import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Layout } from '@/components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Profile() {
  const { currentUser, signOut } = useAuth();
  const { toast } = useToast();
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: currentUser?.displayName || '',
    email: currentUser?.email || ''
  });

  const handleEdit = () => {
    setIsEditing(true);
    setEditData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || ''
    });
  };

  const handleSave = () => {
    // Here you would typically update the user profile
    // For now, we'll just show a success message
    toast({
      title: "บันทึกสำเร็จ",
      description: "ข้อมูลโปรไฟล์ได้รับการอัปเดตเรียบร้อยแล้ว",
      variant: "default"
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData({
      displayName: currentUser?.displayName || '',
      email: currentUser?.email || ''
    });
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'manager':
        return 'ผู้จัดการ';
      case 'staff':
        return 'เจ้าหน้าที่';
      default:
        return 'ไม่ระบุ';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'staff':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 rounded-2xl shadow-2xl mb-8">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/5 rounded-full translate-y-40 -translate-x-40"></div>
          
          <div className="relative px-8 py-12">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border-4 border-white/30 shadow-xl">
                    <User className="h-12 w-12 text-white" />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center">
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  </div>
                </div>
                
                {/* User Info */}
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">{currentUser?.displayName || 'ผู้ใช้'}</h1>
                  <p className="text-blue-100 text-lg mb-1">{currentUser?.email || ''}</p>
                  <div className="flex items-center space-x-2">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
                      <Shield className="h-3 w-3 mr-1" />
                      {getRoleDisplayName(currentUser?.role || '')}
                    </Badge>
                    <div className="flex items-center space-x-1 text-green-300">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm">ออนไลน์</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {!isEditing ? (
                  <Button
                    onClick={handleEdit}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <Edit3 className="h-5 w-5 mr-2" />
                    แก้ไขโปรไฟล์
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      onClick={handleCancel}
                      className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      onClick={handleSave}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      บันทึก
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">สถานะบัญชี</p>
                  <p className="text-2xl font-bold text-green-600">ใช้งานได้</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">การยืนยันอีเมล</p>
                  <p className="text-2xl font-bold text-blue-600">ยืนยันแล้ว</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Mail className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">ความปลอดภัย</p>
                  <p className="text-2xl font-bold text-yellow-600">ปานกลาง</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                  <Shield className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">บทบาท</p>
                  <p className="text-2xl font-bold text-purple-600">{getRoleDisplayName(currentUser?.role || '')}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <User className="h-6 w-6" />
                  </div>
                  ข้อมูลส่วนตัว
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      ชื่อผู้ใช้
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editData.displayName}
                        onChange={(e) => setEditData(prev => ({ ...prev, displayName: e.target.value }))}
                        className="h-12 px-4 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-200 rounded-xl transition-all duration-300 shadow-sm"
                        placeholder="กรอกชื่อผู้ใช้"
                      />
                    ) : (
                      <div className="text-xl font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">
                        {currentUser?.displayName || ''}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      อีเมล
                    </Label>
                    {isEditing ? (
                      <Input
                        value={editData.email}
                        onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                        type="email"
                        className="h-12 px-4 text-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-200 rounded-xl transition-all duration-300 shadow-sm"
                        placeholder="กรอกอีเมล"
                      />
                    ) : (
                      <div className="text-xl font-semibold text-gray-900 bg-gray-50 px-4 py-3 rounded-xl">
                        {currentUser?.email || ''}
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      บทบาท
                    </Label>
                    <div className="flex items-center gap-2">
                      <Badge className={`px-4 py-2 text-sm font-semibold border-2 ${getRoleColor(currentUser?.role || '')} rounded-xl shadow-sm`}>
                        <Shield className="h-4 w-4 mr-2" />
                        {getRoleDisplayName(currentUser?.role || '')}
                      </Badge>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-500 rounded-full animate-pulse"></div>
                      สถานะ
                    </Label>
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-xl font-semibold text-green-600">ออนไลน์</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Key className="h-6 w-6" />
                  </div>
                  ความปลอดภัย
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Key className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 text-lg">รหัสผ่าน</div>
                        <div className="text-sm text-gray-600">อัปเดตล่าสุด: ไม่ระบุ</div>
                      </div>
                    </div>
                    <Button
                      onClick={() => setChangePasswordDialogOpen(true)}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                    >
                      <Key className="h-4 w-4 mr-2" />
                      เปลี่ยนรหัสผ่าน
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6" />
                  </div>
                  การดำเนินการ
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <Button
                  onClick={() => setChangePasswordDialogOpen(true)}
                  className="w-full justify-start bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Key className="h-5 w-5 mr-3" />
                  เปลี่ยนรหัสผ่าน
                </Button>
                <Button
                  onClick={signOut}
                  className="w-full justify-start bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <LogOut className="h-5 w-5 mr-3" />
                  ออกจากระบบ
                </Button>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl hover:shadow-3xl transition-all duration-500 transform hover:-translate-y-1">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-t-xl">
                <CardTitle className="flex items-center gap-3 text-xl">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <UserCheck className="h-6 w-6" />
                  </div>
                  สถานะบัญชี
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-200">
                  <span className="text-sm font-semibold text-gray-700">สถานะ</span>
                  <Badge className="bg-green-500 text-white border-0 px-3 py-1 rounded-lg">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    ใช้งานได้
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <span className="text-sm font-semibold text-gray-700">การยืนยันอีเมล</span>
                  <Badge className="bg-blue-500 text-white border-0 px-3 py-1 rounded-lg">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    ยืนยันแล้ว
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                  <span className="text-sm font-semibold text-gray-700">2FA</span>
                  <Badge className="bg-yellow-500 text-white border-0 px-3 py-1 rounded-lg">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    ไม่เปิดใช้
                  </Badge>
                </div>
              </CardContent>
            </Card>
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
