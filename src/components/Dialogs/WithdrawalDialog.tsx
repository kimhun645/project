import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Loader2, 
  X, 
  Package, 
  ArrowDown, 
  FileText, 
  Hash, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  Calendar,
  User,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { firestoreService } from '@/lib/firestoreService';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';

interface ProductForWithdrawal {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  barcode?: string;
}

interface WithdrawalItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit: string;
  reason: string;
}

interface WithdrawalDialogProps {
  onWithdrawalAdded: () => void;
}

export function WithdrawalDialog({ onWithdrawalAdded }: WithdrawalDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductForWithdrawal[]>([]);
  
  // Barcode scanner
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (barcode) => {
      console.log('🔍 Barcode scanned:', barcode);
      console.log('📦 Available products:', products.length);
      console.log('📦 Products with barcodes:', products.filter(p => p.barcode).map(p => ({ name: p.name, barcode: p.barcode })));
      
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        console.log('✅ Product found:', product);
        addProductToWithdrawal(product.id);
        toast({
          title: "สแกนบาร์โค้ดสำเร็จ",
          description: `พบสินค้า: ${product.name}`,
        });
      } else {
        console.log('❌ Product not found for barcode:', barcode);
        toast({
          title: "ไม่พบสินค้า",
          description: `บาร์โค้ด "${barcode}" ไม่มีในระบบ`,
          variant: "destructive",
        });
      }
    }
  });
  
  const [formData, setFormData] = useState({
    withdrawal_no: '',
    withdrawal_date: new Date().toISOString().split('T')[0],
    requester_name: '',
    department: '',
    notes: ''
  });

  const [withdrawalItems, setWithdrawalItems] = useState<WithdrawalItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [addMethod, setAddMethod] = useState<'dropdown' | 'barcode'>('barcode');

  const resetForm = () => {
    setFormData({
      withdrawal_no: '',
      withdrawal_date: new Date().toISOString().split('T')[0],
      requester_name: '',
      department: '',
      notes: ''
    });
    setWithdrawalItems([]);
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedReason('');
    setManualBarcode('');
    setAddMethod('barcode');
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (scannerDetected && newOpen === false) {
      console.log('🚫 Modal close blocked - barcode scanning in progress');
      return;
    }
    
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (open) {
      fetchProducts();
      generateWithdrawalNo();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching products...');
      const data = await firestoreService.getProducts();
      console.log('📦 Products loaded:', data?.length || 0, 'items');
      console.log('📦 Products with barcodes:', data?.filter(p => p.barcode).length || 0, 'items');
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const generateWithdrawalNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const withdrawalNo = `WD${year}${month}${day}${random}`;
    updateFormData('withdrawal_no', withdrawalNo);
  };

  const addProductToWithdrawal = (productId: string) => {
    console.log('🔄 Adding product to withdrawal:', productId);
    const product = products.find(p => p.id === productId);
    if (!product) {
      console.log('❌ Product not found:', productId);
      return;
    }

    console.log('✅ Product found:', product);
    const existingItem = withdrawalItems.find(item => item.product_id === productId);
    
    if (existingItem) {
      console.log('📈 Updating existing item:', existingItem);
      // เพิ่มจำนวนของสินค้าที่มีอยู่แล้ว
      setWithdrawalItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast({
        title: "เพิ่มจำนวนสินค้า",
        description: `เพิ่มจำนวน ${product.name} เป็น ${existingItem.quantity + 1} ชิ้น`,
      });
    } else {
      console.log('➕ Adding new item');
      // เพิ่มสินค้าใหม่
      const newItem: WithdrawalItem = {
        id: Date.now().toString(),
        product_id: productId,
        product_name: product.name,
        product_sku: product.sku,
        quantity: 1, // สแกน 1 ครั้ง = 1 ชิ้น
        unit: 'ชิ้น',
        reason: 'ใช้งาน' // ไม่ต้องใส่เหตุผล
      };

      console.log('📝 New item created:', newItem);
      setWithdrawalItems(prev => {
        const updated = [...prev, newItem];
        console.log('📦 Updated withdrawal items:', updated);
        return updated;
      });
      toast({
        title: "เพิ่มสินค้า",
        description: `เพิ่ม ${product.name} 1 ชิ้น`,
      });
    }
  };

  const removeItem = (itemId: string) => {
    setWithdrawalItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setWithdrawalItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const handleManualBarcodeSubmit = () => {
    if (!manualBarcode.trim()) {
      toast({
        title: "กรุณากรอกบาร์โค้ด",
        description: "กรุณากรอกบาร์โค้ดที่ต้องการค้นหา",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Manual barcode search:', manualBarcode);
    const product = products.find(p => p.barcode === manualBarcode.trim());
    if (product) {
      console.log('✅ Product found:', product);
      addProductToWithdrawal(product.id);
      setManualBarcode('');
      toast({
        title: "พบสินค้า",
        description: `พบสินค้า: ${product.name}`,
      });
    } else {
      console.log('❌ Product not found for barcode:', manualBarcode);
      toast({
        title: "ไม่พบสินค้า",
        description: `บาร์โค้ด "${manualBarcode}" ไม่มีในระบบ`,
        variant: "destructive",
      });
    }
  };

  const handleDropdownSubmit = () => {
    if (!selectedProductId) {
      toast({
        title: "กรุณาเลือกสินค้า",
        description: "กรุณาเลือกสินค้าที่ต้องการเบิก",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Dropdown product selected:', selectedProductId);
    addProductToWithdrawal(selectedProductId);
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedReason('');
    toast({
      title: "เพิ่มสินค้า",
      description: "เพิ่มสินค้าจากรายการเรียบร้อย",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (scannerDetected) {
      console.log('🚫 Form submission blocked - barcode scanning in progress');
      return;
    }
    
    if (!formData.withdrawal_no || !formData.withdrawal_date || !formData.requester_name) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุเลขที่เบิก วันที่ และชื่อผู้เบิก",
        variant: "destructive",
      });
      return;
    }

    if (withdrawalItems.length === 0) {
      toast({
        title: "กรุณาเพิ่มรายการสินค้า",
        description: "กรุณาเพิ่มสินค้าที่ต้องการเบิก",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Starting withdrawal creation:', formData);
      console.log('📦 Withdrawal items:', withdrawalItems);
      
      // Create withdrawal record
      const withdrawalData = {
        withdrawal_no: formData.withdrawal_no,
        withdrawal_date: formData.withdrawal_date,
        requester_name: formData.requester_name,
        department: formData.department || 'ไม่ระบุ',
        notes: formData.notes || '',
        items: withdrawalItems,
        status: 'pending',
        created_at: new Date().toISOString(),
        created_by: 'current_user' // TODO: Get from auth context
      };
      
      console.log('📝 Creating withdrawal with data:', withdrawalData);
      await firestoreService.createWithdrawal(withdrawalData);
      console.log('✅ Withdrawal created successfully');

      // Update product stocks
      for (const item of withdrawalItems) {
        const product = await firestoreService.getProduct(item.product_id);
        if (product) {
          const newStock = (product.current_stock || 0) - item.quantity;
          
          console.log('📊 Updating stock for product:', {
            productId: item.product_id,
            current: product.current_stock,
            quantity: item.quantity,
            newStock: newStock
          });

          await firestoreService.updateProduct(item.product_id, {
            current_stock: newStock
          });
          console.log('✅ Stock updated successfully for product:', item.product_id);
        }
      }

      toast({
        title: "บันทึกการเบิกพัสดุเรียบร้อย",
        description: `บันทึกการเบิกพัสดุเลขที่ ${formData.withdrawal_no} เรียบร้อยแล้ว`,
      });

      resetForm();
      setOpen(false);
      onWithdrawalAdded();

    } catch (error) {
      console.error('❌ Error creating withdrawal:', error);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      toast({
        title: "เกิดข้อผิดพลาด",
        description: `ไม่สามารถบันทึกข้อมูลได้: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-12 px-8 text-base font-bold rounded-xl border-0"
          onClick={() => {
            setOpen(true);
          }}
        >
          <ArrowDown className="h-5 w-5 mr-2" />
          การเบิกพัสดุ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] w-[95vw] max-h-[90vh] bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 shadow-2xl border border-red-200 rounded-2xl relative overflow-hidden p-0">
        {/* Vibrant Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-pink-50 to-orange-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-pink-100/30 via-transparent to-orange-100/30"></div>
        
        {/* Colorful Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-400 via-pink-400 to-orange-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-red-400 to-pink-400"></div>
        
        <DialogHeader className="relative z-20 pb-4 px-6 pt-6 border-b border-red-200/60 bg-gradient-to-r from-white/95 to-red-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl shadow-lg">
                <ArrowDown className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                  การเบิกพัสดุ
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                  บันทึกการเบิกพัสดุออกจากคลัง
                </DialogDescription>
                <div className="flex items-center space-x-1 mt-2">
                  <div className={`h-2 w-2 rounded-full ${scannerDetected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className="text-xs text-slate-500 font-medium">
                    {scannerDetected ? 'เครื่องสแกนเชื่อมต่อ' : 'รอการเชื่อมต่อเครื่องสแกน'}
                  </span>
                </div>
                {scannerDetected && (
                  <div className="flex items-center space-x-1 mt-1">
                    <Package className="h-3 w-3 text-green-600" />
                    <span className="text-xs text-green-600 font-medium">
                      สแกนบาร์โค้ด: {lastScannedCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <DialogClose className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200 hover:scale-110 z-30 relative -mr-2 -mt-2">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 py-4 px-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Barcode Scanner Section */}
          {scannerDetected && (
            <div className="p-3 bg-green-100 border-2 border-green-300 rounded-lg flex items-center animate-pulse">
              <Package className="h-4 w-4 text-green-700 mr-2" />
              <span className="text-sm text-green-800 font-bold">
                สแกนสำเร็จ: {lastScannedCode}
              </span>
            </div>
          )}

          {/* Withdrawal Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลการเบิก</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  เลขที่การเบิก
                </Label>
                <Input
                  value={formData.withdrawal_no}
                  onChange={(e) => updateFormData('withdrawal_no', e.target.value)}
                  placeholder="เลขที่การเบิก"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  วันที่เบิก
                </Label>
                <Input
                  type="date"
                  value={formData.withdrawal_date}
                  onChange={(e) => updateFormData('withdrawal_date', e.target.value)}
                  className="h-9 text-sm border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ชื่อผู้เบิก
                </Label>
                <Input
                  value={formData.requester_name}
                  onChange={(e) => updateFormData('requester_name', e.target.value)}
                  placeholder="ชื่อผู้เบิก"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  แผนก/หน่วยงาน
                </Label>
                <Input
                  value={formData.department}
                  onChange={(e) => updateFormData('department', e.target.value)}
                  placeholder="แผนก/หน่วยงาน"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

            </div>
          </div>

          {/* Add Product Method Selection */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Package className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">เพิ่มสินค้า</h3>
            </div>
            
            {/* Method Selection */}
            <div className="flex space-x-2 mb-3">
              <Button
                type="button"
                onClick={() => setAddMethod('barcode')}
                variant={addMethod === 'barcode' ? 'default' : 'outline'}
                className={`h-9 px-4 text-sm font-bold transition-all duration-200 rounded-lg ${
                  addMethod === 'barcode' 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg' 
                    : 'border-2 border-green-200 text-green-600 hover:bg-green-50'
                }`}
              >
                <Package className="h-4 w-4 mr-1" />
                บาร์โค้ด
              </Button>
              <Button
                type="button"
                onClick={() => setAddMethod('dropdown')}
                variant={addMethod === 'dropdown' ? 'default' : 'outline'}
                className={`h-9 px-4 text-sm font-bold transition-all duration-200 rounded-lg ${
                  addMethod === 'dropdown' 
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg' 
                    : 'border-2 border-blue-200 text-blue-600 hover:bg-blue-50'
                }`}
              >
                <Package className="h-4 w-4 mr-1" />
                รายการ
              </Button>
            </div>
            
            {/* Barcode Method */}
            {addMethod === 'barcode' && (
              <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-green-700 font-medium">
                    วิธีใช้งาน: สแกนบาร์โค้ดสินค้าเพื่อเพิ่มรายการ
                  </span>
                </div>
                <div className="text-xs text-green-600 space-y-1">
                  <p>• สแกน 1 ครั้ง = เพิ่ม 1 ชิ้น</p>
                  <p>• สแกนรหัสเดิม = เพิ่มจำนวนของสินค้านั้น</p>
                  <p>• สแกนรหัสใหม่ = เพิ่มสินค้าใหม่</p>
                  <p className="text-blue-600 font-medium">💡 ทดสอบ: พิมพ์บาร์โค้ดของสินค้าแล้วกด Enter</p>
                </div>
                
                {/* Manual Barcode Input */}
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Package className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-blue-700 font-medium">
                      กรอกบาร์โค้ดด้วยตนเอง
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <Input
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      placeholder="กรอกบาร์โค้ดสินค้า"
                      className="flex-1 h-9 text-sm border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleManualBarcodeSubmit();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleManualBarcodeSubmit}
                      className="h-9 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg border-0"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      ค้นหา
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Dropdown Method */}
            {addMethod === 'dropdown' && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Package className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-700 font-medium">
                    เลือกสินค้าจากรายการ
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      สินค้า
                    </Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                        <SelectValue placeholder="เลือกสินค้า" />
                      </SelectTrigger>
                      <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id} className="text-sm py-2 hover:bg-blue-50">
                            <div className="font-semibold">{product.name}</div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      จำนวน
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={selectedQuantity}
                      onChange={(e) => setSelectedQuantity(e.target.value)}
                      placeholder="จำนวน"
                      className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-700">
                      เหตุผล
                    </Label>
                    <Input
                      value={selectedReason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      placeholder="เหตุผล"
                      className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end mt-3">
                  <Button
                    type="button"
                    onClick={handleDropdownSubmit}
                    className="h-9 px-6 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg border-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เพิ่มสินค้า
                  </Button>
                </div>
              </div>
            )}
            
          </div>

          {/* Withdrawal Items List */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <TrendingDown className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">รายการสินค้าที่เบิก</h3>
            </div>
            
            {withdrawalItems.length > 0 ? (
              <div className="space-y-2">
                {withdrawalItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{item.product_name}</h4>
                        <p className="text-xs text-gray-600">จำนวน: {item.quantity} {item.unit}</p>
                        <p className="text-xs text-blue-600">ยอดคงเหลือ: {products.find(p => p.id === item.product_id)?.current_stock || 0} {item.unit}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={item.quantity <= 1}
                        >
                          -
                        </Button>
                        <span className="text-sm font-medium w-8 text-center">{item.quantity}</span>
                        <Button
                          type="button"
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          +
                        </Button>
                        <Button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">ยังไม่มีรายการสินค้า</p>
                <p className="text-xs text-gray-500">สแกนบาร์โค้ดเพื่อเพิ่มรายการ</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">หมายเหตุ</h3>
            </div>
            
            <div className="space-y-1">
              <Textarea
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="หมายเหตุเพิ่มเติม..."
                rows={3}
                className="text-sm border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex justify-end space-x-3 pt-6 px-6 border-t border-red-200/60 bg-gradient-to-r from-red-50/95 to-white/95 backdrop-blur-sm">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                setOpen(false);
              }}
              className="h-11 px-6 text-sm font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 bg-white transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || scannerDetected || withdrawalItems.length === 0}
              className="h-11 px-8 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : scannerDetected ? (
                <>
                  <Package className="mr-2 h-4 w-4 animate-pulse" />
                  กำลังสแกนบาร์โค้ด...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  บันทึกการเบิกพัสดุ
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
