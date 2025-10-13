import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, FileEdit as Edit, Trash2, User as UserIcon, Shield, Crown, Mail, Calendar, CheckCircle, XCircle, Loader2, Search, Filter, MoreVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { userService, User, CreateUserData, UpdateUserData, UserRole } from '@/lib/userService';
import { firestoreService } from '@/lib/firestoreService';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

interface UserManagementProps {
  currentUserRole: string;
}

export function UserManagement({ currentUserRole }: UserManagementProps) {
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');

  const [createForm, setCreateForm] = useState<CreateUserData>({
    email: '',
    password: '',
    displayName: '',
    role: 'user'
  });

  const [editForm, setEditForm] = useState<UpdateUserData>({
    displayName: '',
    role: 'user',
    isActive: true
  });

  const roles = userService.getAllRoles();

  const formatDate = (dateString: string | undefined, formatStr: string): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr, { locale: th });
    } catch (error) {
      return 'N/A';
    }
  };

  useEffect(() => {
    console.log('🚀 useEffect เริ่มต้น');
    fetchUsers();
  }, []);

  useEffect(() => {
    console.log('🔄 users state เปลี่ยน:', users.length, 'ผู้ใช้');
  }, [users]);

  const fetchUsers = async () => {
    try {
      console.log('🔄 เริ่มต้น fetchUsers');
      setIsLoading(true);
      console.log('🔍 กำลังดึงข้อมูลผู้ใช้ด้วย firestoreService...');
      const usersData = await firestoreService.getUsers();
      console.log('✅ ดึงข้อมูลผู้ใช้สำเร็จ:', usersData);
      console.log('📊 จำนวนผู้ใช้ที่ได้:', usersData.length);
      setUsers(usersData);
      console.log('✅ setUsers เรียบร้อย');
      console.log('🔍 ตรวจสอบ users state ใหม่:', usersData);
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      console.log('✅ fetchUsers เสร็จสิ้น');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!createForm.email || !createForm.password || !createForm.displayName) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุอีเมล รหัสผ่าน และชื่อผู้ใช้",
        variant: "destructive",
      });
      return;
    }

    try {
      await userService.createUser(createForm);
      toast({
        title: "สร้างผู้ใช้เรียบร้อย",
        description: `สร้างผู้ใช้ ${createForm.displayName} เรียบร้อยแล้ว`,
      });
      
      setCreateForm({ email: '', password: '', displayName: '', role: 'user' });
      setShowCreateDialog(false);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingUser) return;

    try {
      await userService.updateUser(editingUser.id, editForm);
      toast({
        title: "อัปเดตผู้ใช้เรียบร้อย",
        description: `อัปเดตผู้ใช้ ${editForm.displayName} เรียบร้อยแล้ว`,
      });
      
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userToDelete?: User) => {
    const targetUser = userToDelete || deletingUser;
    console.log('🔍 handleDeleteUser ถูกเรียกด้วย:', { userToDelete, deletingUser, targetUser });
    
    if (!targetUser) {
      console.log('❌ ไม่มี targetUser');
      return;
    }

    // ตรวจสอบการยืนยัน
    const expectedConfirmation = 'delete';
    if (deleteConfirmation !== expectedConfirmation) {
      toast({
        title: "การยืนยันไม่ถูกต้อง",
        description: `กรุณาพิมพ์ "${expectedConfirmation}" เพื่อยืนยันการลบ`,
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('🗑️ กำลังลบผู้ใช้ด้วย firestoreService:', targetUser.id, targetUser.displayName);
      console.log('🔍 ตรวจสอบ targetUser object:', targetUser);
      console.log('🔍 ตรวจสอบ firestoreService:', firestoreService);
      
      await firestoreService.deleteUser(targetUser.id);
      console.log('✅ ลบผู้ใช้สำเร็จ');
      
      toast({
        title: "ลบผู้ใช้เรียบร้อย",
        description: `ลบผู้ใช้ ${targetUser.displayName} เรียบร้อยแล้ว`,
      });
      
      console.log('🔍 กำลังปิด dialog และล้าง state');
      setDeletingUser(null);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
      console.log('🔍 กำลัง refresh ข้อมูลผู้ใช้');
      fetchUsers();
      console.log('✅ การลบเสร็จสิ้น');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการลบผู้ใช้:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message,
        variant: "destructive",
      });
      console.log('🔍 กำลังปิด dialog เนื่องจาก error');
      setDeletingUser(null);
      setShowDeleteDialog(false);
      setDeleteConfirmation('');
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName,
      role: user.role,
      isActive: user.isActive
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: string) => {
    const roleInfo = userService.getRoleInfo(role);
    return roleInfo?.color || 'gray';
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
                         (statusFilter === 'active' && user.isActive) ||
                         (statusFilter === 'inactive' && !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const canManageUsers = hasPermission('users:read');

  if (!canManageUsers) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
          <p className="text-gray-500">คุณไม่มีสิทธิ์ในการจัดการผู้ใช้</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">จัดการผู้ใช้</h2>
          <p className="text-gray-600">จัดการผู้ใช้และสิทธิ์การเข้าถึงระบบ</p>
        </div>
        {hasPermission('users:create') && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มผู้ใช้
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>เพิ่มผู้ใช้ใหม่</DialogTitle>
                <DialogDescription>
                  สร้างบัญชีผู้ใช้ใหม่ในระบบ
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">อีเมล</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    placeholder="user@example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">รหัสผ่าน</Label>
                  <Input
                    id="password"
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="รหัสผ่าน"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">ชื่อผู้ใช้</Label>
                  <Input
                    id="displayName"
                    value={createForm.displayName}
                    onChange={(e) => setCreateForm({...createForm, displayName: e.target.value})}
                    placeholder="ชื่อผู้ใช้"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">บทบาท</Label>
                  <Select value={createForm.role} onValueChange={(value: any) => setCreateForm({...createForm, role: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>
                          <div className="flex items-center gap-2">
                            {getRoleIcon(role.id)}
                            {role.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    ยกเลิก
                  </Button>
                  <Button type="submit">สร้างผู้ใช้</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="ค้นหาผู้ใช้..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="บทบาท" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกบทบาท</SelectItem>
                {roles.map(role => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="สถานะ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                <SelectItem value="active">ใช้งาน</SelectItem>
                <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>กำลังโหลดข้อมูล...</p>
            </CardContent>
          </Card>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <UserIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่พบผู้ใช้</h3>
              <p className="text-gray-500">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map(user => (
            <Card key={user.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {getRoleIcon(user.role)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.displayName}</h3>
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {user.email}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={`text-${getRoleColor(user.role)}-600 border-${getRoleColor(user.role)}-200`}>
                          {userService.getRoleInfo(user.role)?.name}
                        </Badge>
                        {user.isActive ? (
                          <Badge variant="outline" className="text-green-600 border-green-200">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            ใช้งาน
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200">
                            <XCircle className="h-3 w-3 mr-1" />
                            ไม่ใช้งาน
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right text-sm text-gray-500">
                      <p>สร้าง: {formatDate(user.createdAt, 'dd/MM/yyyy')}</p>
                      {user.lastLoginAt && (
                        <p>เข้าสู่ระบบล่าสุด: {formatDate(user.lastLoginAt, 'dd/MM/yyyy HH:mm')}</p>
                      )}
                    </div>
                    {hasPermission('users:update') && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {hasPermission('users:delete') && (
                      <AlertDialog open={showDeleteDialog && deletingUser?.id === user.id} onOpenChange={(open) => {
                        if (!open) {
                          setShowDeleteDialog(false);
                          setDeletingUser(null);
                        }
                      }}>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              console.log('🔍 ปุ่มลบถูกคลิก');
                              console.log('🔍 User ที่จะลบ:', user);
                              setDeletingUser(user);
                              setShowDeleteDialog(true);
                              console.log('🔍 Dialog ถูกเปิด');
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
                            <AlertDialogDescription>
                              คุณแน่ใจหรือไม่ที่จะลบผู้ใช้ {user.displayName}? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="py-4">
                            <div className="space-y-2">
                              <Label htmlFor="deleteConfirmation" className="text-sm font-medium">
                                พิมพ์ <span className="font-bold text-red-600">delete</span> เพื่อยืนยันการลบ
                              </Label>
                              <Input
                                id="deleteConfirmation"
                                value={deleteConfirmation}
                                onChange={(e) => setDeleteConfirmation(e.target.value)}
                                placeholder="delete"
                                className="w-full"
                              />
                            </div>
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel 
                              onClick={() => {
                                setDeleteConfirmation('');
                                setDeletingUser(null);
                                setShowDeleteDialog(false);
                              }}
                            >
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                console.log('🔍 AlertDialogAction ถูกคลิก');
                                console.log('🔍 User ที่จะลบ:', user);
                                console.log('🔍 การยืนยัน:', deleteConfirmation);
                                handleDeleteUser(user);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                              disabled={deleteConfirmation !== 'delete'}
                            >
                              ลบ
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขผู้ใช้</DialogTitle>
              <DialogDescription>
                แก้ไขข้อมูลผู้ใช้ {editingUser.displayName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="editDisplayName">ชื่อผู้ใช้</Label>
                <Input
                  id="editDisplayName"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({...editForm, displayName: e.target.value})}
                  placeholder="ชื่อผู้ใช้"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editRole">บทบาท</Label>
                <Select value={editForm.role} onValueChange={(value: any) => setEditForm({...editForm, role: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role.id} value={role.id}>
                        <div className="flex items-center gap-2">
                          {getRoleIcon(role.id)}
                          {role.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="editIsActive"
                  checked={editForm.isActive}
                  onCheckedChange={(checked) => setEditForm({...editForm, isActive: checked})}
                />
                <Label htmlFor="editIsActive">ใช้งาน</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setEditingUser(null)}>
                  ยกเลิก
                </Button>
                <Button type="submit">บันทึก</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
