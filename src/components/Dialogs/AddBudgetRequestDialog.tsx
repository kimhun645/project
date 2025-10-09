import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  Send, 
  Loader2, 
  Search, 
  Package, 
  User, 
  Calendar,
  DollarSign,
  FileText,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api, type AccountCode, type BudgetRequest as DBBudgetRequest, type Requester } from '@/lib/apiService';
import { emailService, type EmailData } from '@/lib/emailService';

interface MaterialItem {
  product_id?: string;
  name: string;
  quantity: string;
  unit: string;
  unit_price?: number;
  total_price?: number;
}

interface BudgetRequestForm {
  requester: string;
  request_date: string;
  account_code: string;
  amount: string;
  note: string;
  material_list: MaterialItem[];
  approver_id: string;
  approver_name: string;
  approver_email: string;
  cc_emails: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  unit: string;
  unit_price: number;
  current_stock: number;
  category_name?: string;
}

interface Approver {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
}

interface AddBudgetRequestDialogProps {
  onSuccess: () => void;
  editRequest?: DBBudgetRequest;
}

export function AddBudgetRequestDialog({ onSuccess, editRequest }: AddBudgetRequestDialogProps) {
  const { toast } = useToast();
  const today = new Date().toISOString().split('T')[0];
  
  const [formData, setFormData] = useState<BudgetRequestForm>({
    requester: editRequest?.requester || '',
    request_date: editRequest?.request_date || today,
    account_code: editRequest?.account_code || '',
    amount: editRequest?.amount?.toString() || '',
    note: editRequest?.note || '',
    material_list: editRequest?.material_list || [{ name: '', quantity: '', unit: '' }],
    approver_id: '',
    approver_name: '',
    approver_email: '',
    cc_emails: ''
  });

  const [accountCodes, setAccountCodes] = useState<AccountCode[]>([]);
  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [approvers, setApprovers] = useState<Approver[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingRequesters, setIsLoadingRequesters] = useState(true);
  const [isLoadingApprovers, setIsLoadingApprovers] = useState(true);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingAccountCodes, setIsLoadingAccountCodes] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unit: '', unit_price: '' });

  const loadRequesters = async () => {
    try {
      setIsLoadingRequesters(true);
      const data = await api.getRequesters();
      // Ensure data is always an array
      setRequesters(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading requesters:', error);
      setRequesters([]);
      // Don't show error toast for connection issues
    } finally {
      setIsLoadingRequesters(false);
    }
  };

  const loadApprovers = async () => {
    try {
      setIsLoadingApprovers(true);
      const data = await api.getApprovers();
      setApprovers(data || []);
    } catch (error) {
      console.error('Error loading approvers:', error);
      setApprovers([]);
      // Don't show error toast for connection issues
    } finally {
      setIsLoadingApprovers(false);
    }
  };

  const loadProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const data = await api.getProducts();
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      setProducts([]);
      // Don't show error toast for connection issues
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchAccountCodes = async () => {
    try {
      setIsLoadingAccountCodes(true);
      const data = await api.getAccountCodes();
      setAccountCodes(data || []);
    } catch (error) {
      console.error('Error loading account codes:', error);
      setAccountCodes([]);
      // Don't show error toast for connection issues
    } finally {
      setIsLoadingAccountCodes(false);
    }
  };

  useEffect(() => {
    fetchAccountCodes();
    loadRequesters();
    loadApprovers();
    loadProducts();
  }, []);

  const handleInputChange = (field: keyof BudgetRequestForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (index: number, field: keyof MaterialItem, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      material_list: prev.material_list.map((item, i) => {
        if (i === index) {
          const updatedItem = { ...item, [field]: value };
          if (field === 'quantity' && updatedItem.unit_price) {
            updatedItem.total_price = parseFloat(value.toString()) * updatedItem.unit_price;
          }
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const addMaterialFromProduct = (product: Product) => {
    const newItem: MaterialItem = {
      product_id: product.id,
      name: product.name,
      quantity: '1',
      unit: product.unit
    };
    
      setFormData(prev => ({
        ...prev,
      material_list: [...prev.material_list, newItem]
    }));
    setSearchTerm('');
  };

  const addNewMaterial = () => {
    if (!newMaterial.name || !newMaterial.unit) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ชื่อวัสดุและหน่วยเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    const newItem: MaterialItem = {
      name: newMaterial.name,
      quantity: '1',
      unit: newMaterial.unit
    };
    
    setFormData(prev => ({
      ...prev,
      material_list: [...prev.material_list, newItem]
    }));
    
    setNewMaterial({ name: '', unit: '', unit_price: '' });
    setShowAddMaterial(false);
  };

  const removeMaterialItem = (index: number) => {
    if (formData.material_list.length > 1) {
      setFormData(prev => ({
        ...prev,
        material_list: prev.material_list.filter((_, i) => i !== index)
      }));
    }
  };


  const handleApproverChange = (approverId: string) => {
    const approver = approvers.find(a => a.id.toString() === approverId);
    if (approver) {
      setFormData(prev => ({
        ...prev,
        approver_id: approverId,
        approver_name: approver.name,
        approver_email: approver.email
      }));
    }
  };

  const sendApprovalEmail = async (requestData: DBBudgetRequest, approverName: string, approverEmail: string, ccEmails: string) => {
    try {
      const approveUrl = `${window.location.origin}/approval/${requestData.id}`;
      
      // Parse CC emails
      const ccList = ccEmails.split(',').map(email => email.trim()).filter(email => email && email.includes('@'));
      
      const emailData: EmailData = {
        to: approverEmail,
        cc: ccList.length > 0 ? ccList : undefined,
        subject: `📋 คำขออนุมัติใช้งบประมาณ ${requestData.request_no}`,
        html: `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>คำขออนุมัติใช้งบประมาณ</title>
        <style>
              body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; font-size: 16px; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
          .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; }
          .label { font-weight: bold; color: #495057; }
          .value { color: #212529; }
              .material-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
              .material-table th, .material-table td { border: 1px solid #dee2e6; padding: 8px; text-align: left; }
              .material-table th { background-color: #f8f9fa; font-weight: bold; }
              .btn { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 10px 0; }
              .btn:hover { background: linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%); }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
                <h1 style="margin: 0;">📋 คำขออนุมัติใช้งบประมาณ</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">ศูนย์จัดการธนบัตร นครราชสีมา</p>
          </div>
          <div class="content">
                <p>เรียน <strong>${approverName}</strong>,</p>
                
                <p>มีคำขออนุมัติใช้งบประมาณใหม่ที่ต้องการการพิจารณาของคุณ</p>
                
                <div class="info-row">
                  <span class="label">รหัสคำขอ:</span>
                  <span class="value">${requestData.request_no}</span>
                </div>
            <div class="info-row">
              <span class="label">ผู้ขอ:</span>
              <span class="value">${requestData.requester}</span>
            </div>
            <div class="info-row">
                  <span class="label">วันที่ขอ:</span>
              <span class="value">${new Date(requestData.request_date).toLocaleDateString('th-TH')}</span>
            </div>
            <div class="info-row">
              <span class="label">รหัสบัญชี:</span>
                  <span class="value">${requestData.account_code}${requestData.account_name ? ` (${requestData.account_name})` : ''}</span>
            </div>
            <div class="info-row">
              <span class="label">จำนวนเงิน:</span>
                  <span class="value">${parseFloat(requestData.amount.toString()).toLocaleString('th-TH')} บาท</span>
            </div>
            
                ${requestData.material_list && requestData.material_list.length > 0 ? `
                <h3>รายการวัสดุที่ขออนุมัติ:</h3>
                <table class="material-table">
                  <thead>
                    <tr>
                      <th>รายการ</th>
                      <th>จำนวน</th>
                      <th>หน่วย</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${requestData.material_list.map(item => `
                      <tr>
                        <td>${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.unit}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ` : ''}
                
                ${requestData.note ? `
                <div style="margin: 15px 0;">
                  <strong>หมายเหตุ:</strong><br>
                  ${requestData.note}
                </div>
                ` : ''}
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${approveUrl}" class="btn">📋 พิจารณาอนุมัติ</a>
            </div>
            
            <div class="footer">
              <p>อีเมลนี้ถูกส่งจากระบบบริหารพัสดุ</p>
              <p>หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ</p>
            </div>
          </div>
        </div>
      </body>
      </html>
        `,
        text: `
คำขออนุมัติใช้งบประมาณ

เรียน ${approverName},

มีคำขออนุมัติใช้งบประมาณใหม่ที่ต้องการการพิจารณาของคุณ

รหัสคำขอ: ${requestData.request_no}
ผู้ขอ: ${requestData.requester}
วันที่ขอ: ${new Date(requestData.request_date).toLocaleDateString('th-TH')}
รหัสบัญชี: ${requestData.account_code}${requestData.account_name ? ` (${requestData.account_name})` : ''}
จำนวนเงิน: ${parseFloat(requestData.amount.toString()).toLocaleString('th-TH')} บาท

${requestData.material_list && requestData.material_list.length > 0 ? `
รายการวัสดุที่ขออนุมัติ:
${requestData.material_list.map(item => `- ${item.name}: ${item.quantity} ${item.unit}`).join('\n')}
` : ''}

${requestData.note ? `หมายเหตุ: ${requestData.note}` : ''}

คลิกลิงก์เพื่อพิจารณาอนุมัติ: ${approveUrl}

---
อีเมลนี้ถูกส่งจากระบบบริหารพัสดุ
        `
      };

      await emailService.sendEmail(emailData);
      
    } catch (error) {
      console.error('Error sending approval email:', error);
      throw error;
    }
  };

  const handleBudgetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.requester || !formData.account_code || !formData.approver_id) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "ชื่อผู้ขอ รหัสบัญชี และผู้อนุมัติเป็นข้อมูลที่จำเป็น",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedAccount = accountCodes.find(ac => ac.code === formData.account_code);
      const materialList = formData.material_list.filter(item => 
        item.name.trim() !== '' && item.quantity.trim() !== ''
      );
      
      
      // Generate request number
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now();
      const requestNo = `BR-${currentYear}-${timestamp.toString().slice(-3)}`;

      const requestData = {
        request_no: requestNo,
        requester: formData.requester,
        request_date: formData.request_date,
        account_code: formData.account_code,
        account_name: selectedAccount?.name || '',
        amount: parseFloat(formData.amount) || 0,
        note: formData.note,
        material_list: materialList,
      };

      // สร้างคำขอใช้งบประมาณ
      const newRequest = await api.createBudgetRequest(requestData);
      
      // ส่งอีเมลไปยังผู้อนุมัติ
      await sendApprovalEmail(newRequest, formData.approver_name, formData.approver_email, formData.cc_emails);
      
      toast({
        title: "ส่งคำขออนุมัติเรียบร้อยแล้ว",
        description: `คำขอ ${newRequest.request_no} ถูกส่งไปยัง ${formData.approver_name} เรียบร้อยแล้ว`,
      });

      onSuccess();
      
    } catch (error) {
      console.error('Error submitting budget request:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งคำขออนุมัติได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          เพิ่มคำขออนุมัติใช้งบประมาณ
        </h1>
        <p className="text-gray-600">กรอกข้อมูลคำขออนุมัติใช้งบประมาณใหม่</p>
      </div>

      <form onSubmit={handleBudgetSubmit} className="space-y-8">
        {/* Basic Information Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <FileText className="h-6 w-6 text-blue-600" />
              ข้อมูลพื้นฐาน
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="requester" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  ผู้ขอใช้งบประมาณ *
                </Label>
                <Select
                  value={formData.requester}
                  onValueChange={(value) => { if (value !== '__loading__' && value !== '__empty__') handleInputChange('requester', value); }}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={isLoadingRequesters ? "กำลังโหลด..." : "เลือกผู้ขอใช้งบประมาณ"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingRequesters ? (
                      <SelectItem value="__loading__" disabled>กำลังโหลดรายชื่อผู้ขอ...</SelectItem>
                    ) : !requesters || !Array.isArray(requesters) || requesters.length === 0 ? (
                      <SelectItem value="__empty__" disabled>ไม่พบรายชื่อผู้ขอ</SelectItem>
                    ) : (
                      requesters.map((requester) => (
                        <SelectItem key={requester.id} value={requester.name}>
                          {requester.name} ({requester.department || 'ทั่วไป'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request_date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  วันที่ *
                </Label>
                <Input
                  id="request_date"
                  type="date"
                  value={formData.request_date}
                  onChange={(e) => handleInputChange('request_date', e.target.value)}
                  className="h-11"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account_code" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  รหัสบัญชี *
                </Label>
                <Select
                  value={formData.account_code}
                  onValueChange={(value) => handleInputChange('account_code', value)}
                  required
                  disabled={isLoadingAccountCodes}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={isLoadingAccountCodes ? "กำลังโหลด..." : "เลือกรหัสบัญชี"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAccountCodes ? (
                      <SelectItem value="loading" disabled>กำลังโหลดข้อมูล...</SelectItem>
                    ) : accountCodes.length > 0 ? (
                      accountCodes.map((account) => (
                        <SelectItem key={account.id} value={account.code}>
                          {account.code} - {account.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>ไม่มีข้อมูลรหัสบัญชี</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  จำนวนเงิน (บาท) *
                </Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.00"
                  className="h-11"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Approver Information Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              ข้อมูลผู้อนุมัติ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Approver Selection */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="approver" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  ผู้อนุมัติ *
                </Label>
                <Select
                  value={formData.approver_id}
                  onValueChange={handleApproverChange}
                  disabled={isLoadingApprovers}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={isLoadingApprovers ? "กำลังโหลด..." : "เลือกผู้อนุมัติ"} />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingApprovers ? (
                      <SelectItem value="loading" disabled>กำลังโหลดข้อมูล...</SelectItem>
                    ) : approvers.length > 0 ? (
                      approvers.map((approver) => (
                        <SelectItem key={approver.id} value={approver.id.toString()}>
                          {approver.name} ({approver.department || approver.position || 'ทั่วไป'})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-data" disabled>ไม่มีข้อมูลผู้อนุมัติ</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {formData.approver_email && (
                <div className="space-y-2">
                  <Label>อีเมลผู้อนุมัติ</Label>
                  <div className="h-11 px-3 py-2 bg-gray-50 border rounded-md flex items-center">
                    <span className="text-sm text-gray-600">{formData.approver_email}</span>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* CC Email */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cc_emails" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  CC Email (ไม่บังคับ)
                </Label>
                <Input
                  id="cc_emails"
                  type="email"
                  value={formData.cc_emails}
                  onChange={(e) => handleInputChange('cc_emails', e.target.value)}
                  placeholder="email1@example.com, email2@example.com"
                  className="h-11"
                />
                <p className="text-xs text-gray-500">
                  คั่นด้วยเครื่องหมายจุลภาค (,) หากมีหลายอีเมล
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Material List Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-red-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <Package className="h-6 w-6 text-orange-600" />
              รายการวัสดุ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            {/* Search and Add Material */}
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                    placeholder="ค้นหาวัสดุจากคลัง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-11"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddMaterial(!showAddMaterial)}
                  className="h-11"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  เพิ่มวัสดุใหม่
                </Button>
              </div>

              {/* Product Search Results */}
              {searchTerm && filteredProducts.length > 0 && (
                <div className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium mb-3">เลือกจากคลังสินค้า:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredProducts.slice(0, 6).map((product) => (
                      <Button
                        key={product.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addMaterialFromProduct(product)}
                        className="justify-start h-auto p-3"
                      >
                        <div className="text-left">
                          <div className="font-medium">{product.name}</div>
                          <div className="text-xs text-gray-500">
                            {product.unit}
                            {product.category_name && ` • ${product.category_name}`}
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Material Form */}
              {showAddMaterial && (
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-medium mb-3">เพิ่มวัสดุใหม่:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="ชื่อวัสดุ"
                      value={newMaterial.name}
                      onChange={(e) => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="หน่วย (เช่น ชิ้น, กล่อง)"
                        value={newMaterial.unit}
                        onChange={(e) => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                      />
                      <Button type="button" onClick={addNewMaterial} size="sm">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
        </div>

            <Separator />

        {/* Material List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
                <h4 className="font-medium">รายการที่เลือก:</h4>
                <Badge variant="secondary">
                  {formData.material_list.length} รายการ
                </Badge>
          </div>
          
              <div className="space-y-3">
                {formData.material_list.map((item, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 border rounded-lg bg-gray-50">
                    <div className="flex-1">
                      <Label>ชื่อวัสดุ</Label>
                      <Input
                        value={item.name}
                        onChange={(e) => handleMaterialChange(index, 'name', e.target.value)}
                        placeholder="ระบุชื่อวัสดุ"
                        className="mt-1"
                      />
                    </div>
                    <div className="w-24">
                      <Label>จำนวน</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.quantity}
                        onChange={(e) => handleMaterialChange(index, 'quantity', e.target.value)}
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div className="w-20">
                      <Label>หน่วย</Label>
                      <Input
                        value={item.unit}
                        onChange={(e) => handleMaterialChange(index, 'unit', e.target.value)}
                        placeholder="ชิ้น"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeMaterialItem(index)}
                      disabled={formData.material_list.length === 1}
                      className="mb-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

            </div>
          </CardContent>
        </Card>

        {/* Note Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <AlertCircle className="h-6 w-6 text-gray-600" />
              หมายเหตุเพิ่มเติม
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
          <Textarea
            value={formData.note}
            onChange={(e) => handleInputChange('note', e.target.value)}
            placeholder="ระบุหมายเหตุเพิ่มเติม (ไม่บังคับ)"
              rows={4}
              className="resize-none"
          />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6">
          <Button 
            type="button" 
            variant="outline" 
            size="lg"
            onClick={onSuccess}
            disabled={isSubmitting}
            className="px-8"
          >
            ยกเลิก
          </Button>
          <Button 
            type="submit" 
            size="lg"
            disabled={isSubmitting}
            className="px-8 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                กำลังส่งคำขอและอีเมล...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                ส่งคำขออนุมัติและอีเมล
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}