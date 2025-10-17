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
import { Plus, Edit, Trash2, Search, Hash, FileText, DollarSign, Building, Tag, CheckCircle, XCircle, Copy, Download, Upload, Key } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AccountCode {
  id: string;
  code: string;
  name: string;
  description?: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  updatedBy?: string;
}

export function AccountManagement() {
  const [accountCodes, setAccountCodes] = useState<AccountCode[]>([]);
  const [filteredAccountCodes, setFilteredAccountCodes] = useState<AccountCode[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBulkImportDialogOpen, setIsBulkImportDialogOpen] = useState(false);
  const [selectedAccountCode, setSelectedAccountCode] = useState<AccountCode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { toast } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category: 'revenue',
    isActive: true
  });

  const [bulkImportData, setBulkImportData] = useState('');

  // Load account codes
  useEffect(() => {
    loadAccountCodes();
  }, []);

  // Filter account codes
  useEffect(() => {
    let filtered = accountCodes;

    if (searchTerm) {
      filtered = filtered.filter(accountCode => 
        accountCode.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        accountCode.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (accountCode.description && accountCode.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(accountCode => accountCode.category === categoryFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(accountCode => 
        statusFilter === 'active' ? accountCode.isActive : !accountCode.isActive
      );
    }

    setFilteredAccountCodes(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [accountCodes, searchTerm, categoryFilter, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAccountCodes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccountCodes = filteredAccountCodes.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const loadAccountCodes = async () => {
    setIsLoading(true);
    try {
      // Load from Firestore collection 'accountCodes'
      const { FirestoreService } = await import('@/lib/firestoreService');
      const accountCodes = await FirestoreService.getAccountCodes();
      setAccountCodes(accountCodes);
      
      if (accountCodes.length === 0) {
        toast({
          title: "ไม่พบข้อมูล",
          description: "ไม่พบข้อมูลรหัสบัญชีในระบบ กรุณาเพิ่มข้อมูลก่อน",
          variant: "default",
        });
      }
    } catch (error) {
      console.error('Error loading account codes:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถโหลดข้อมูลรหัสบัญชีได้: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const handleCreateSampleData = async () => {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      await FirestoreService.createSampleAccountCodes();
      await loadAccountCodes(); // Reload data
      
      toast({
        title: "สร้างข้อมูลตัวอย่างสำเร็จ",
        description: "สร้างข้อมูลตัวอย่างรหัสบัญชีเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error creating sample data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างข้อมูลตัวอย่างได้",
        variant: "destructive",
      });
    }
  };

  const handleAddAccountCode = async () => {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      const newAccountCode: Omit<AccountCode, 'id'> = {
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user', // Replace with actual user ID
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user'
      };
      
      await FirestoreService.addAccountCode(newAccountCode);
      await loadAccountCodes(); // Reload data
      setIsAddDialogOpen(false);
      resetForm();

      toast({
        title: "เพิ่มรหัสบัญชีสำเร็จ",
        description: `เพิ่มรหัสบัญชี ${formData.code} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error adding account code:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่มรหัสบัญชีได้",
        variant: "destructive",
      });
    }
  };

  const handleEditAccountCode = async () => {
    if (!selectedAccountCode) return;
    
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      const updatedAccountCode: Partial<AccountCode> = {
        ...formData,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user'
      };
      
      await FirestoreService.updateAccountCode(selectedAccountCode.id, updatedAccountCode);
      await loadAccountCodes(); // Reload data
      setIsEditDialogOpen(false);
      setSelectedAccountCode(null);
      resetForm();

      toast({
        title: "แก้ไขรหัสบัญชีสำเร็จ",
        description: `แก้ไขข้อมูลรหัสบัญชี ${formData.code} เรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการแก้ไขรหัสบัญชี:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถแก้ไขรหัสบัญชีได้: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccountCode = async (accountCodeId: string) => {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      await FirestoreService.deleteAccountCode(accountCodeId);
      await loadAccountCodes(); // Reload data
      
      toast({
        title: "ลบรหัสบัญชีสำเร็จ",
        description: "ลบรหัสบัญชีเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error deleting account code:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบรหัสบัญชีได้",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (accountCodeId: string) => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const accountCode = accountCodes.find(ac => ac.id === accountCodeId);
      if (!accountCode) return;
      
      await FirestoreService.updateAccountCode(accountCodeId, {
        isActive: !accountCode.isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: 'current-user'
      });
      
      await loadAccountCodes(); // Reload data
      
        toast({
        title: "เปลี่ยนสถานะสำเร็จ",
        description: "เปลี่ยนสถานะรหัสบัญชีเรียบร้อยแล้ว",
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

  const handleBulkImport = async () => {
    try {
      // Parse CSV data
      const lines = bulkImportData.split('\n').filter(line => line.trim());
      const accountCodes = lines.map(line => {
        const [code, name, description, category] = line.split(',').map(item => item.trim());
        return {
          code,
          name,
          description: description || '',
          category: category || 'revenue',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'current-user',
          updatedAt: new Date().toISOString(),
          updatedBy: 'current-user'
        };
      });

      const { FirestoreService } = await import('@/lib/firestoreService');
      await FirestoreService.bulkAddAccountCodes(accountCodes);
      await loadAccountCodes(); // Reload data
      
      setIsBulkImportDialogOpen(false);
      setBulkImportData('');
      
      toast({
        title: "นำเข้าข้อมูลสำเร็จ",
        description: `นำเข้ารหัสบัญชี ${accountCodes.length} รายการเรียบร้อยแล้ว`,
      });
    } catch (error) {
      console.error('Error bulk importing:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleExportData = async () => {
    try {
      const csvContent = filteredAccountCodes.map(ac => 
        `${ac.code},${ac.name},${ac.description || ''},${ac.category},${ac.isActive ? 'active' : 'inactive'}`
      ).join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `account-codes-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ส่งออกข้อมูลรหัสบัญชีเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category: 'revenue',
      isActive: true
    });
  };

  const openEditDialog = (accountCode: AccountCode) => {
    setSelectedAccountCode(accountCode);
    setFormData({
      code: accountCode.code,
      name: accountCode.name,
      description: accountCode.description || '',
      category: accountCode.category,
      isActive: accountCode.isActive
    });
    setIsEditDialogOpen(true);
  };

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'revenue': return 'bg-green-100 text-green-800';
      case 'expense': return 'bg-red-100 text-red-800';
      case 'asset': return 'bg-blue-100 text-blue-800';
      case 'liability': return 'bg-yellow-100 text-yellow-800';
      case 'equity': return 'bg-purple-100 text-purple-800';
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
          <h2 className="text-2xl font-bold text-gray-900">จัดการรหัสบัญชี</h2>
          <p className="text-gray-600">จัดการรหัสบัญชีสำหรับระบบบัญชี</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCreateSampleData}>
            <Hash className="h-4 w-4 mr-2" />
            สร้างข้อมูลตัวอย่าง
          </Button>
          <Button variant="outline" onClick={handleExportData}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
          <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                นำเข้า
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                เพิ่มรหัสบัญชี
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>เพิ่มรหัสบัญชีใหม่</DialogTitle>
              <DialogDescription>
                สร้างรหัสบัญชีใหม่สำหรับระบบบัญชี
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="code">รหัสบัญชี</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  placeholder="เช่น 1001, 2001"
                />
              </div>
              <div>
                <Label htmlFor="name">ชื่อบัญชี</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="เช่น เงินสด, เงินฝากธนาคาร"
                />
              </div>
              <div>
                <Label htmlFor="description">คำอธิบาย</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="คำอธิบายเพิ่มเติม"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="category">หมวดหมู่</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">รายได้</SelectItem>
                    <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
                    <SelectItem value="asset">สินทรัพย์</SelectItem>
                    <SelectItem value="liability">หนี้สิน</SelectItem>
                    <SelectItem value="equity">ส่วนของเจ้าของ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                ยกเลิก
              </Button>
              <Button onClick={handleAddAccountCode}>
                เพิ่มรหัสบัญชี
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                  placeholder="ค้นหาตามรหัส, ชื่อ หรือคำอธิบาย"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Label htmlFor="category-filter">หมวดหมู่</Label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทั้งหมด</SelectItem>
                  <SelectItem value="revenue">รายได้</SelectItem>
                  <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
                  <SelectItem value="asset">สินทรัพย์</SelectItem>
                  <SelectItem value="liability">หนี้สิน</SelectItem>
                  <SelectItem value="equity">ส่วนของเจ้าของ</SelectItem>
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

      {/* Account Codes Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Hash className="h-5 w-5" />
              รายการรหัสบัญชี ({filteredAccountCodes.length})
            </CardTitle>
            <div className="flex items-center gap-2">
              <Label htmlFor="items-per-page" className="text-sm">แสดงต่อหน้า:</Label>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">กำลังโหลดข้อมูล...</p>
            </div>
          ) : currentAccountCodes.length === 0 ? (
            <div className="text-center py-8">
              <Hash className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">ไม่พบข้อมูลรหัสบัญชี</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentAccountCodes.map((accountCode) => (
                <div key={accountCode.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <Hash className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900">{accountCode.name}</h3>
                        <Badge className={getCategoryBadgeColor(accountCode.category)}>
                          {accountCode.category === 'revenue' ? 'รายได้' :
                           accountCode.category === 'expense' ? 'ค่าใช้จ่าย' :
                           accountCode.category === 'asset' ? 'สินทรัพย์' :
                           accountCode.category === 'liability' ? 'หนี้สิน' :
                           accountCode.category === 'equity' ? 'ส่วนของเจ้าของ' : accountCode.category}
                        </Badge>
                        <Badge className={getStatusBadgeColor(accountCode.isActive)}>
                          {accountCode.isActive ? 'ใช้งาน' : 'ไม่ใช้งาน'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Tag className="h-4 w-4" />
                          รหัส: {accountCode.code}
                        </span>
                        {accountCode.description && (
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {accountCode.description}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-400 mt-1">
                        <span>สร้าง: {new Date(accountCode.createdAt).toLocaleDateString('th-TH')}</span>
                        {accountCode.updatedAt && (
                          <span>อัปเดต: {new Date(accountCode.updatedAt).toLocaleDateString('th-TH')}</span>
                        )}
                        <span>โดย: {accountCode.createdBy}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={accountCode.isActive}
                      onCheckedChange={() => handleToggleStatus(accountCode.id)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(accountCode.code)}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(accountCode)}
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
                            คุณแน่ใจหรือไม่ที่จะลบรหัสบัญชี {accountCode.name} ({accountCode.code})? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteAccountCode(accountCode.id)}
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
        
        {/* Pagination */}
        {filteredAccountCodes.length > 0 && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                แสดง {startIndex + 1} ถึง {Math.min(endIndex, filteredAccountCodes.length)} จาก {filteredAccountCodes.length} รายการ
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ก่อนหน้า
                </Button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  ถัดไป
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลรหัสบัญชี</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลรหัสบัญชี {selectedAccountCode?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-code">รหัสบัญชี</Label>
              <Input
                id="edit-code"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                placeholder="เช่น 1001, 2001"
              />
            </div>
            <div>
              <Label htmlFor="edit-name">ชื่อบัญชี</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="เช่น เงินสด, เงินฝากธนาคาร"
              />
            </div>
            <div>
              <Label htmlFor="edit-description">คำอธิบาย</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="คำอธิบายเพิ่มเติม"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-category">หมวดหมู่</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกหมวดหมู่" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="revenue">รายได้</SelectItem>
                  <SelectItem value="expense">ค่าใช้จ่าย</SelectItem>
                  <SelectItem value="asset">สินทรัพย์</SelectItem>
                  <SelectItem value="liability">หนี้สิน</SelectItem>
                  <SelectItem value="equity">ส่วนของเจ้าของ</SelectItem>
                </SelectContent>
              </Select>
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
            <Button onClick={handleEditAccountCode}>
              บันทึกการเปลี่ยนแปลง
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={isBulkImportDialogOpen} onOpenChange={setIsBulkImportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>นำเข้าข้อมูลรหัสบัญชี</DialogTitle>
            <DialogDescription>
              นำเข้าข้อมูลรหัสบัญชีจากไฟล์ CSV (รูปแบบ: รหัส,ชื่อ,คำอธิบาย,หมวดหมู่)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="bulkImport">ข้อมูล CSV</Label>
              <Textarea
                id="bulkImport"
                value={bulkImportData}
                onChange={(e) => setBulkImportData(e.target.value)}
                placeholder="1001,เงินสด,เงินสดในมือ,asset&#10;1002,เงินฝากธนาคาร,เงินฝากธนาคาร,asset&#10;2001,ค่าใช้จ่ายสำนักงาน,ค่าใช้จ่ายสำนักงาน,expense"
                rows={10}
                className="font-mono text-sm"
              />
            </div>
            <div className="text-sm text-gray-500">
              <p>รูปแบบข้อมูล: รหัส,ชื่อ,คำอธิบาย,หมวดหมู่</p>
              <p>หมวดหมู่ที่รองรับ: revenue, expense, asset, liability, equity</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkImportDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleBulkImport}>
              นำเข้าข้อมูล
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
