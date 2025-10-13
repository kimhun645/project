import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  FileText,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Upload,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirestoreService } from '@/lib/firestoreService';
import * as XLSX from 'xlsx';

interface AccountCode {
  id: string;
  code?: string;
  name: string;
  type?: string;
  created_at?: any;
  updated_at?: any;
}

export function AccountManagement() {
  const { toast } = useToast();
  const [accountCodes, setAccountCodes] = useState<AccountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountCode | null>(null);
  const [newAccount, setNewAccount] = useState({ code: '', name: '', type: 'account' });
  const [importedData, setImportedData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAccountCodes();
  }, []);

  const loadAccountCodes = async () => {
    try {
      setLoading(true);
      const codes = await FirestoreService.getAccountCodes();
      setAccountCodes(codes);
    } catch (error) {
      console.error('Error loading account codes:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูล Account Codes ได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAccount = async () => {
    try {
      if (!newAccount.name.trim()) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาระบุชื่อ Account Code",
          variant: "destructive",
        });
        return;
      }

      await FirestoreService.addAccountCode({
        ...newAccount,
        created_at: new Date(),
        updated_at: new Date()
      });

      toast({
        title: "เพิ่ม Account Code สำเร็จ",
        description: "Account Code ถูกเพิ่มเรียบร้อยแล้ว",
      });

      setNewAccount({ code: '', name: '', type: 'account' });
      setIsAddDialogOpen(false);
      loadAccountCodes();
    } catch (error) {
      console.error('Error adding account code:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถเพิ่ม Account Code ได้",
        variant: "destructive",
      });
    }
  };

  const handleEditAccount = async () => {
    if (!editingAccount) return;

    try {
      if (!editingAccount.name.trim()) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณาระบุชื่อ Account Code",
          variant: "destructive",
        });
        return;
      }

      await FirestoreService.updateAccountCode(editingAccount.id, {
        ...editingAccount,
        updated_at: new Date()
      });

      toast({
        title: "แก้ไข Account Code สำเร็จ",
        description: "Account Code ถูกแก้ไขเรียบร้อยแล้ว",
      });

      setEditingAccount(null);
      setIsEditDialogOpen(false);
      loadAccountCodes();
    } catch (error) {
      console.error('Error updating account code:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไข Account Code ได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบ Account Code นี้?')) return;

    try {
      await FirestoreService.deleteAccountCode(id);
      toast({
        title: "ลบ Account Code สำเร็จ",
        description: "Account Code ถูกลบเรียบร้อยแล้ว",
      });
      loadAccountCodes();
    } catch (error) {
      console.error('Error deleting account code:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบ Account Code ได้",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // แปลงข้อมูล Excel เป็นรูปแบบที่ต้องการ
        const processedData = jsonData
          .filter((row: any) => row.length > 0 && row[0] && row[1]) // กรองแถวที่ว่าง
          .map((row: any, index: number) => ({
            code: row[0]?.toString().trim() || '',
            name: row[1]?.toString().trim() || '',
            type: row[2]?.toString().trim() || 'account',
            rowNumber: index + 2 // บรรทัดที่ใน Excel (เริ่มจาก 2 เพราะมี header)
          }));

        setImportedData(processedData);
        toast({
          title: "นำเข้าไฟล์สำเร็จ",
          description: `พบข้อมูล ${processedData.length} รายการ`,
        });
      } catch (error) {
        console.error('Error reading Excel file:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถอ่านไฟล์ Excel ได้",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImportData = async () => {
    if (importedData.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "กรุณาเลือกไฟล์ Excel ก่อน",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      for (const item of importedData) {
        try {
          await FirestoreService.addAccountCode({
            code: item.code || undefined,
            name: item.name,
            type: item.type,
            created_at: new Date(),
            updated_at: new Date()
          });
          successCount++;
        } catch (error) {
          console.error(`Error importing item ${item.rowNumber}:`, error);
          errorCount++;
        }
      }

      toast({
        title: "นำเข้าข้อมูลเสร็จสิ้น",
        description: `สำเร็จ: ${successCount} รายการ, ผิดพลาด: ${errorCount} รายการ`,
      });

      setImportedData([]);
      setIsImportDialogOpen(false);
      loadAccountCodes();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      ['Code', 'Name', 'Type'],
      ['53010200', 'ค่าไฟฟ้า', 'account'],
      ['53010300', 'ค่าน้ำประปา', 'account'],
      ['', 'หมวด 1 : ค่าใช้จ่ายเกี่ยวกับพนักงาน', 'header']
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Account Codes');

    XLSX.writeFile(workbook, 'account-codes-template.xlsx');
  };

  const filteredAccounts = accountCodes.filter(account => {
    const matchesSearch = account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (account.code && account.code.includes(searchTerm));
    const matchesFilter = filterType === 'all' || account.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const accountCount = accountCodes.filter(acc => acc.type !== 'header').length;
  const headerCount = accountCodes.filter(acc => acc.type === 'header').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">จัดการ Account Codes</h2>
          <p className="text-muted-foreground">
            จัดการรหัสบัญชีและหมวดหมู่ค่าใช้จ่าย
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={loadAccountCodes} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            ดาวน์โหลด Template
          </Button>
          <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                นำเข้า Excel
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>นำเข้าข้อมูล Account Codes จาก Excel</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="excel-file">เลือกไฟล์ Excel</Label>
                  <Input
                    id="excel-file"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    ref={fileInputRef}
                    className="mt-2"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    รองรับไฟล์ .xlsx และ .xls
                  </p>
                </div>
                
                {importedData.length > 0 && (
                  <div>
                    <Label>ข้อมูลที่จะนำเข้า ({importedData.length} รายการ)</Label>
                    <div className="max-h-60 overflow-y-auto border rounded-md p-4 mt-2">
                      <div className="space-y-2">
                        {importedData.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                            {item.code && <Badge variant="outline">{item.code}</Badge>}
                            <span className="flex-1">{item.name}</span>
                            <Badge variant={item.type === 'header' ? 'secondary' : 'default'}>
                              {item.type}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button 
                  onClick={handleImportData} 
                  disabled={importedData.length === 0 || isImporting}
                >
                  {isImporting ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      กำลังนำเข้า...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      นำเข้าข้อมูล
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                เพิ่ม Account Code
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>เพิ่ม Account Code ใหม่</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">รหัส (ไม่บังคับ)</Label>
                  <Input
                    id="code"
                    value={newAccount.code}
                    onChange={(e) => setNewAccount({ ...newAccount, code: e.target.value })}
                    placeholder="เช่น 53010200"
                  />
                </div>
                <div>
                  <Label htmlFor="name">ชื่อ *</Label>
                  <Input
                    id="name"
                    value={newAccount.name}
                    onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                    placeholder="เช่น ค่าไฟฟ้า"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">ประเภท</Label>
                  <select
                    id="type"
                    value={newAccount.type}
                    onChange={(e) => setNewAccount({ ...newAccount, type: e.target.value })}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="account">Account Code</option>
                    <option value="header">Header</option>
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  ยกเลิก
                </Button>
                <Button onClick={handleAddAccount}>
                  เพิ่ม
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Account Codes</p>
                <p className="text-2xl font-bold">{accountCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Headers</p>
                <p className="text-2xl font-bold">{headerCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">รวมทั้งหมด</p>
                <p className="text-2xl font-bold">{accountCodes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import Instructions */}
      <Alert>
        <FileSpreadsheet className="h-4 w-4" />
        <AlertDescription>
          <strong>คำแนะนำการนำเข้า Excel:</strong>
          <ul className="mt-2 space-y-1 text-sm">
            <li>• คอลัมน์ A: รหัสบัญชี (ไม่บังคับ)</li>
            <li>• คอลัมน์ B: ชื่อบัญชี (จำเป็น)</li>
            <li>• คอลัมน์ C: ประเภท (account/header)</li>
            <li>• แถวแรกจะเป็น header และจะถูกข้าม</li>
            <li>• ดาวน์โหลด template เพื่อดูรูปแบบที่ถูกต้อง</li>
          </ul>
        </AlertDescription>
      </Alert>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">ค้นหา</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="ค้นหาตามชื่อหรือรหัส..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Label htmlFor="filter">กรองตามประเภท</Label>
              <select
                id="filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="all">ทั้งหมด</option>
                <option value="account">Account Code</option>
                <option value="header">Header</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account Codes List */}
      <Card>
        <CardHeader>
          <CardTitle>รายการ Account Codes</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">ไม่พบข้อมูล Account Codes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredAccounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {account.code && (
                        <Badge variant="outline">{account.code}</Badge>
                      )}
                      <span className="font-medium">{account.name}</span>
                      {account.type === 'header' && (
                        <Badge variant="secondary">Header</Badge>
                      )}
                    </div>
                    {account.created_at && (
                      <p className="text-sm text-muted-foreground mt-1">
                        สร้างเมื่อ: {new Date(account.created_at.seconds * 1000).toLocaleDateString('th-TH')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAccount(account);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAccount(account.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>แก้ไข Account Code</DialogTitle>
          </DialogHeader>
          {editingAccount && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-code">รหัส</Label>
                <Input
                  id="edit-code"
                  value={editingAccount.code || ''}
                  onChange={(e) => setEditingAccount({ ...editingAccount, code: e.target.value })}
                  placeholder="เช่น 53010200"
                />
              </div>
              <div>
                <Label htmlFor="edit-name">ชื่อ *</Label>
                <Input
                  id="edit-name"
                  value={editingAccount.name}
                  onChange={(e) => setEditingAccount({ ...editingAccount, name: e.target.value })}
                  placeholder="เช่น ค่าไฟฟ้า"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-type">ประเภท</Label>
                <select
                  id="edit-type"
                  value={editingAccount.type || 'account'}
                  onChange={(e) => setEditingAccount({ ...editingAccount, type: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="account">Account Code</option>
                  <option value="header">Header</option>
                </select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              ยกเลิก
            </Button>
            <Button onClick={handleEditAccount}>
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
