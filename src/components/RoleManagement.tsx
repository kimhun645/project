import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, Eye, Plus, Edit, Trash2, Check, X, Download, User, Settings, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RoleManagement() {
  const [selectedRole, setSelectedRole] = useState<string>('admin');
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });
  const [addFormData, setAddFormData] = useState({
    name: '',
    description: '',
    color: 'blue',
    permissions: [] as string[]
  });
  const { toast } = useToast();

  // Role definitions with permissions
  const roleData = {
    staff: {
      name: 'เจ้าหน้าที่',
      description: 'สามารถใช้งานระบบได้ทุกฟีเจอร์ ยกเว้นการอนุมัติและตั้งค่าระบบ',
      color: 'blue',
      permissions: [
        { category: 'สินค้า', actions: ['read', 'create', 'update'] },
        { category: 'หมวดหมู่', actions: ['read', 'create', 'update'] },
        { category: 'ผู้จำหน่าย', actions: ['read', 'create', 'update'] },
        { category: 'การเคลื่อนไหว', actions: ['read', 'create', 'update'] },
        { category: 'รายงาน', actions: ['read'] },
        { category: 'งบประมาณ', actions: ['read', 'create', 'update'] }
      ]
    },
    manager: {
      name: 'ผู้จัดการศูนย์',
      description: 'สามารถใช้งานได้ทุกฟีเจอร์ รวมถึงการอนุมัติและจัดการข้อมูล',
      color: 'green',
      permissions: [
        { category: 'สินค้า', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'หมวดหมู่', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'ผู้จำหน่าย', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'การเคลื่อนไหว', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'รายงาน', actions: ['read', 'export'] },
        { category: 'งบประมาณ', actions: ['read', 'create', 'update', 'approve'] },
        { category: 'การอนุมัติ', actions: ['read', 'approve', 'reject'] }
      ]
    },
    admin: {
      name: 'ผู้ดูแลระบบ',
      description: 'สามารถใช้งานได้ทุกฟีเจอร์ รวมถึงการจัดการผู้ใช้และตั้งค่าระบบ',
      color: 'red',
      permissions: [
        { category: 'สินค้า', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'หมวดหมู่', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'ผู้จำหน่าย', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'การเคลื่อนไหว', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'รายงาน', actions: ['read', 'export'] },
        { category: 'งบประมาณ', actions: ['read', 'create', 'update', 'approve'] },
        { category: 'การอนุมัติ', actions: ['read', 'approve', 'reject'] },
        { category: 'ผู้ใช้', actions: ['read', 'create', 'update', 'delete'] },
        { category: 'ตั้งค่า', actions: ['read', 'update'] }
      ]
    }
  };

  const getTotalPermissions = (roleKey: string) => {
    return roleData[roleKey as keyof typeof roleData].permissions.reduce((total, category) => total + category.actions.length, 0);
  };

  const getColorClass = (color: string) => {
    switch (color) {
      case 'blue': return 'bg-blue-100 text-blue-800';
      case 'green': return 'bg-green-100 text-green-800';
      case 'red': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'read': return <Eye className="h-4 w-4" />;
      case 'create': return <Plus className="h-4 w-4" />;
      case 'update': return <Edit className="h-4 w-4" />;
      case 'delete': return <Trash2 className="h-4 w-4" />;
      case 'approve': return <Check className="h-4 w-4" />;
      case 'reject': return <X className="h-4 w-4" />;
      case 'export': return <Download className="h-4 w-4" />;
      default: return <Eye className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'read': return 'text-gray-600';
      case 'create': return 'text-green-600';
      case 'update': return 'text-blue-600';
      case 'delete': return 'text-red-600';
      case 'approve': return 'text-green-600';
      case 'reject': return 'text-red-600';
      case 'export': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  const currentRole = roleData[selectedRole as keyof typeof roleData];

  const openEditDialog = () => {
    setEditFormData({
      name: currentRole.name,
      description: currentRole.description,
      permissions: currentRole.permissions.flatMap(p => p.actions)
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveRole = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!editFormData.name || !editFormData.description) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อและคำอธิบายบทบาท",
          variant: "destructive",
        });
        return;
      }

      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // Convert permissions array to the expected format
      const permissions = [
        { category: 'สินค้า', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'หมวดหมู่', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'ผู้จำหน่าย', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'การเคลื่อนไหว', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'รายงาน', actions: editFormData.permissions.filter(p => ['read', 'export'].includes(p)) },
        { category: 'งบประมาณ', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'approve'].includes(p)) },
        { category: 'การอนุมัติ', actions: editFormData.permissions.filter(p => ['read', 'approve', 'reject'].includes(p)) },
        { category: 'ผู้ใช้', actions: editFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'ตั้งค่า', actions: editFormData.permissions.filter(p => ['read', 'update'].includes(p)) }
      ].filter(p => p.actions.length > 0);

      const roleData = {
        name: editFormData.name,
        description: editFormData.description,
        permissions: permissions,
        color: currentRole.color
      };

      // Update role in Firestore
      await FirestoreService.updateRole(selectedRole, roleData);
      
      toast({
        title: "บันทึกสำเร็จ",
        description: `แก้ไขบทบาท ${editFormData.name} เรียบร้อยแล้ว`,
      });
      setIsEditDialogOpen(false);
    } catch (error: any) {
      console.error('Error saving role:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถบันทึกบทบาทได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRole = async () => {
    try {
      setIsLoading(true);
      
      // Validate required fields
      if (!addFormData.name || !addFormData.description) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกชื่อและคำอธิบายบทบาท",
          variant: "destructive",
        });
        return;
      }

      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // Convert permissions array to the expected format
      const permissions = [
        { category: 'สินค้า', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'หมวดหมู่', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'ผู้จำหน่าย', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'การเคลื่อนไหว', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'รายงาน', actions: addFormData.permissions.filter(p => ['read', 'export'].includes(p)) },
        { category: 'งบประมาณ', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'approve'].includes(p)) },
        { category: 'การอนุมัติ', actions: addFormData.permissions.filter(p => ['read', 'approve', 'reject'].includes(p)) },
        { category: 'ผู้ใช้', actions: addFormData.permissions.filter(p => ['read', 'create', 'update', 'delete'].includes(p)) },
        { category: 'ตั้งค่า', actions: addFormData.permissions.filter(p => ['read', 'update'].includes(p)) }
      ].filter(p => p.actions.length > 0);

      const roleData = {
        name: addFormData.name,
        description: addFormData.description,
        permissions: permissions,
        color: addFormData.color
      };

      await FirestoreService.addRole(roleData);
      
      toast({
        title: "เพิ่มบทบาทสำเร็จ",
        description: `เพิ่มบทบาท ${addFormData.name} เรียบร้อยแล้ว`,
      });
      setIsAddDialogOpen(false);
      resetAddForm();
    } catch (error: any) {
      console.error('Error adding role:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: error.message || "ไม่สามารถเพิ่มบทบาทได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePermission = (permission: string) => {
    setEditFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const toggleAddPermission = (permission: string) => {
    setAddFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const resetAddForm = () => {
    setAddFormData({
      name: '',
      description: '',
      color: 'blue',
      permissions: []
    });
  };

  const openAddDialog = () => {
    resetAddForm();
    setIsAddDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header with Edit Button */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Button
            variant={selectedRole === 'staff' ? 'default' : 'outline'}
            onClick={() => setSelectedRole('staff')}
            className={selectedRole === 'staff' ? 'bg-blue-600 hover:bg-blue-700' : ''}
          >
            เจ้าหน้าที่
          </Button>
          <Button
            variant={selectedRole === 'manager' ? 'default' : 'outline'}
            onClick={() => setSelectedRole('manager')}
            className={selectedRole === 'manager' ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            ผู้จัดการศูนย์
          </Button>
          <Button
            variant={selectedRole === 'admin' ? 'default' : 'outline'}
            onClick={() => setSelectedRole('admin')}
            className={selectedRole === 'admin' ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            ผู้ดูแลระบบ
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog} variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มบทบาทใหม่
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>เพิ่มบทบาทใหม่</DialogTitle>
                <DialogDescription>
                  สร้างบทบาทใหม่พร้อมกำหนดสิทธิ์การเข้าถึง
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="add-role-name">ชื่อบทบาท</Label>
                    <Input
                      id="add-role-name"
                      value={addFormData.name}
                      onChange={(e) => setAddFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="กรอกชื่อบทบาท"
                    />
                  </div>
                  <div>
                    <Label htmlFor="add-role-color">สี</Label>
                    <Select value={addFormData.color} onValueChange={(value) => setAddFormData(prev => ({ ...prev, color: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกสี" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="blue">น้ำเงิน</SelectItem>
                        <SelectItem value="green">เขียว</SelectItem>
                        <SelectItem value="red">แดง</SelectItem>
                        <SelectItem value="purple">ม่วง</SelectItem>
                        <SelectItem value="orange">ส้ม</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="add-role-description">คำอธิบาย</Label>
                  <Textarea
                    id="add-role-description"
                    value={addFormData.description}
                    onChange={(e) => setAddFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="กรอกคำอธิบายบทบาท"
                    rows={3}
                  />
                </div>

                {/* Permissions */}
                <div>
                  <Label className="text-lg font-semibold">สิทธิ์การเข้าถึง</Label>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {[
                      { category: 'สินค้า', actions: ['read', 'create', 'update', 'delete'] },
                      { category: 'หมวดหมู่', actions: ['read', 'create', 'update', 'delete'] },
                      { category: 'ผู้จำหน่าย', actions: ['read', 'create', 'update', 'delete'] },
                      { category: 'การเคลื่อนไหว', actions: ['read', 'create', 'update', 'delete'] },
                      { category: 'รายงาน', actions: ['read', 'export'] },
                      { category: 'งบประมาณ', actions: ['read', 'create', 'update', 'approve'] },
                      { category: 'การอนุมัติ', actions: ['read', 'approve', 'reject'] },
                      { category: 'ผู้ใช้', actions: ['read', 'create', 'update', 'delete'] },
                      { category: 'ตั้งค่า', actions: ['read', 'update'] }
                    ].map((permission, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{permission.category}</h4>
                        <div className="space-y-2">
                          {permission.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center space-x-2">
                              <Switch
                                checked={addFormData.permissions.includes(action)}
                                onCheckedChange={() => toggleAddPermission(action)}
                              />
                              <Label className="flex items-center gap-2">
                                {getActionIcon(action)}
                                <span className="text-sm">
                                  {action === 'read' ? 'ดู' :
                                   action === 'create' ? 'สร้าง' :
                                   action === 'update' ? 'แก้ไข' :
                                   action === 'delete' ? 'ลบ' :
                                   action === 'approve' ? 'อนุมัติ' :
                                   action === 'reject' ? 'ปฏิเสธ' :
                                   action === 'export' ? 'ส่งออก' : action}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddRole} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      เพิ่มบทบาท
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openEditDialog} className="bg-blue-600 hover:bg-blue-700">
                <Edit className="h-4 w-4 mr-2" />
                แก้ไขบทบาท
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>แก้ไขบทบาท: {currentRole.name}</DialogTitle>
                <DialogDescription>
                  แก้ไขข้อมูลและสิทธิ์การเข้าถึงของบทบาทนี้
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role-name">ชื่อบทบาท</Label>
                    <Input
                      id="role-name"
                      value={editFormData.name}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="กรอกชื่อบทบาท"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role-description">คำอธิบาย</Label>
                    <Textarea
                      id="role-description"
                      value={editFormData.description}
                      onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="กรอกคำอธิบายบทบาท"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Permissions */}
                <div>
                  <Label className="text-lg font-semibold">สิทธิ์การเข้าถึง</Label>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    {currentRole.permissions.map((permission, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-3">{permission.category}</h4>
                        <div className="space-y-2">
                          {permission.actions.map((action, actionIndex) => (
                            <div key={actionIndex} className="flex items-center space-x-2">
                              <Switch
                                checked={editFormData.permissions.includes(action)}
                                onCheckedChange={() => togglePermission(action)}
                              />
                              <Label className="flex items-center gap-2">
                                {getActionIcon(action)}
                                <span className="text-sm">
                                  {action === 'read' ? 'ดู' :
                                   action === 'create' ? 'สร้าง' :
                                   action === 'update' ? 'แก้ไข' :
                                   action === 'delete' ? 'ลบ' :
                                   action === 'approve' ? 'อนุมัติ' :
                                   action === 'reject' ? 'ปฏิเสธ' :
                                   action === 'export' ? 'ส่งออก' : action}
                                </span>
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleSaveRole} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      บันทึกการเปลี่ยนแปลง
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Role Details */}
      <Card className="border-l-4 border-t-4 border-l-blue-200 border-t-blue-200">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getColorClass(currentRole.color)}`}>
              <Shield className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">
                {currentRole.name}
              </CardTitle>
              <p className="text-gray-600 mt-1">
                {currentRole.description}
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">สิทธิ์การเข้าถึง</h3>
              <div className="space-y-4">
                {currentRole.permissions.map((permission, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">i</span>
                      </div>
                      <span className="font-medium text-gray-900">{permission.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {permission.actions.map((action, actionIndex) => (
                        <div
                          key={actionIndex}
                          className={`flex items-center gap-1 px-2 py-1 rounded-md bg-white border ${getActionColor(action)}`}
                        >
                          {getActionIcon(action)}
                          <span className="text-sm font-medium">
                            {action === 'read' ? 'read' :
                             action === 'create' ? '+ create' :
                             action === 'update' ? 'update' :
                             action === 'delete' ? 'delete' :
                             action === 'approve' ? 'approve' :
                             action === 'reject' ? 'reject' :
                             action === 'export' ? 'export' : action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-gray-600">
                จำนวนสิทธิ์ทั้งหมด: {getTotalPermissions(selectedRole)}
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${
                  currentRole.color === 'blue' ? 'bg-blue-500' :
                  currentRole.color === 'green' ? 'bg-green-500' :
                  currentRole.color === 'red' ? 'bg-red-500' : 'bg-gray-500'
                }`}></div>
                <span className="text-sm font-medium capitalize text-gray-700">
                  {currentRole.color === 'blue' ? 'Blue' :
                   currentRole.color === 'green' ? 'Green' :
                   currentRole.color === 'red' ? 'Red' : 'Gray'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}