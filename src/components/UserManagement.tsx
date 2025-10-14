import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, Search, Filter, MoreHorizontal, User, Mail, Phone, Calendar, Shield, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  displayName: string;
  email: string;
  role: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  phone?: string;
  department?: string;
  passwordHash?: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    displayName: '',
    email: '',
    role: 'staff',
    phone: '',
    department: '',
    isActive: true
  });

  // Load users
  useEffect(() => {
    loadUsers();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive : !user.isActive
      );
    }

    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // Load from Firestore collection 'users'
      const { firestoreService } = await import('@/lib/firestoreService');
      const users = await firestoreService.getUsers();
      setUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้ใช้ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddUser = async () => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const newUser: Omit<User, 'id'> = {
        ...formData,
        createdAt: new Date().toISOString(),
        lastLogin: undefined,
        passwordHash: 'placeholder' // Placeholder, actual password handling would be more complex
      };
      
      await firestoreService.addUser(newUser);
      await loadUsers(); // Reload data
      setIsAddDialogOpen(false);
      resetForm();
      
      toast({
        title: "เพิ่มผู้ใช้สำเร็จ",
        description: `เพิ่มผู้ใช้ ${formData.displayName} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const updatedUser: Partial<User> = {
        ...formData
      };
      
      await firestoreService.updateUser(selectedUser.id, updatedUser);
      await loadUsers(); // Reload data
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      resetForm();
      
      toast({
        title: "แก้ไขผู้ใช้สำเร็จ",
        description: `แก้ไขข้อมูลผู้ใช้ ${formData.displayName} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error editing user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.deleteUser(userId);
      await loadUsers(); // Reload data
      
      toast({
        title: "ลบผู้ใช้สำเร็จ",
        description: "ลบผู้ใช้เรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const user = users.find(u => u.id === userId);
      if (!user) return;
      
      await firestoreService.updateUser(userId, {
        isActive: !user.isActive
      });
      
      await loadUsers(); // Reload data
      
      toast({
        title: "เปลี่ยนสถานะสำเร็จ",
        description: "เปลี่ยนสถานะผู้ใช้เรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเปลี่ยนสถานะได้",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      displayName: '',
      email: '',
      role: 'staff',
      phone: '',
      department: '',
      isActive: true
    });
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      displayName: user.displayName,
      email: user.email,
      role: user.role,
      phone: user.phone || '',
      department: user.department || '',
      isActive: user.isActive
    });
    setIsEditDialogOpen(true);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'staff': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusBadgeColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h2>
          <p className="text-gray-600">จัดการข้อมูลผู้ใช้และสิทธิ์การเข้าถึง</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              เพิ่มผู้ใช้
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
              <DialogDescription>
                กรอกข้อมูลผู้ใช้ที่ต้องการเพิ่ม
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">ชื่อ-นามสกุล</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder="กรอกชื่อ-นามสกุล"
                />
              </div>
              <div>
                <Label htmlFor="email">อีเมล</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="กรอกอีเมล"
                />
              </div>
              <div>
                <Label htmlFor="role">บทบาท</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกบทบาท" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                    <SelectItem value="manager">ผู้จัดการศูนย์</SelectItem>
                    <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>
              <div>
                <Label htmlFor="department">แผนก</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  placeholder="กรอกแผนก"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAddUser}>
                เพิ่มผู้ใช้
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  id="search"
                  placeholder="ค้นหาตามชื่อหรืออีเมล"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="role-filter">บทบาท</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="manager">ผู้จัดการศูนย์</SelectItem>
                  <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="status-filter">สถานะ</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            รายการผู้ใช้ ({filteredUsers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลผู้ใช้</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{user.displayName}</h3>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role === 'admin' ? 'ผู้ดูแลระบบ' :
                           user.role === 'manager' ? 'ผู้จัดการศูนย์' :
                           user.role === 'staff' ? 'เจ้าหน้าที่' : user.role}
                        </Badge>
                        <Badge className={getStatusBadgeColor(user.isActive)}>
                          {user.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Mail className="h-4 w-4" />
                          {user.email}
                        </span>
                        {user.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {user.phone}
                          </span>
                        )}
                        {user.department && (
                          <span>{user.department}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>สร้าง: {user.createdAt}</span>
                        {user.lastLogin && (
                          <span>เข้าสู่ระบบล่าสุด: {user.lastLogin}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={() => handleToggleStatus(user.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                          <AlertDialogDescription>
                            คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ {user.name}? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteUser(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            ลบ
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลผู้ใช้</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลผู้ใช้ {selectedUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-displayName">ชื่อ-นามสกุล</Label>
              <Input
                id="edit-displayName"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="กรอกชื่อ-นามสกุล"
              />
            </div>
            <div>
              <Label htmlFor="edit-email">อีเมล</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="กรอกอีเมล"
              />
            </div>
            <div>
              <Label htmlFor="edit-role">บทบาท</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกบทบาท" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                  <SelectItem value="manager">ผู้จัดการศูนย์</SelectItem>
                  <SelectItem value="staff">เจ้าหน้าที่</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-phone">เบอร์โทรศัพท์</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="กรอกเบอร์โทรศัพท์"
              />
            </div>
            <div>
              <Label htmlFor="edit-department">แผนก</Label>
              <Input
                id="edit-department"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder="กรอกแผนก"
              />
            </div>
            <div>
              <Label htmlFor="edit-status">สถานะ</Label>
              <Select value={formData.isActive ? 'active' : 'inactive'} onValueChange={(value) => setFormData(prev => ({ ...prev, isActive: value === 'active' }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสถานะ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">ใช้งาน</SelectItem>
                  <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditUser}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
