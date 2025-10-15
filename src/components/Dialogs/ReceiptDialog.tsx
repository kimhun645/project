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
  ArrowUp, 
  FileText, 
  Hash, 
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  User,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirestoreService } from '@/lib/firestoreService';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';

interface ProductForReceipt {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
  barcode?: string;
  is_medicine?: boolean;
}

interface ReceiptItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier: string;
  batch_no?: string;
  expiry_date?: string;
}

interface ReceiptDialogProps {
  onReceiptAdded: () => void;
}

export function ReceiptDialog({ onReceiptAdded }: ReceiptDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductForReceipt[]>([]);
  
  // Barcode scanner
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (barcode) => {
      console.log('🔍 Barcode scanned:', barcode);
      const product = products.find(p => p.barcode === barcode);
      if (product) {
        addProductToReceipt(product.id);
        toast({
          title: "สแกนบาร์โค้ดสำเร็จ",
          description: `พบสินค้า: ${product.name}`,
        });
      } else {
        toast({
          title: "ไม่พบสินค้า",
          description: `บาร์โค้ด "${barcode}" ไม่มีในระบบ`,
          variant: "destructive",
        });
      }
    }
  });
  
  const [formData, setFormData] = useState({
    receipt_no: '',
    receipt_date: new Date().toISOString().split('T')[0],
    receiver_name: '',
    department: '',
    supplier: '',
    invoice_no: '',
    notes: ''
  });

  const [receiptItems, setReceiptItems] = useState<ReceiptItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedQuantity, setSelectedQuantity] = useState('');
  const [selectedUnitPrice, setSelectedUnitPrice] = useState('');
  const [selectedExpiryDate, setSelectedExpiryDate] = useState('');
  const [selectedBatchNo, setSelectedBatchNo] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [addMethod, setAddMethod] = useState<'dropdown' | 'barcode'>('barcode');

  const resetForm = () => {
    setFormData({
      receipt_no: '',
      receipt_date: new Date().toISOString().split('T')[0],
      receiver_name: '',
      department: '',
      supplier: '',
      invoice_no: '',
      notes: ''
    });
    setReceiptItems([]);
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedUnitPrice('');
    setSelectedExpiryDate('');
    setSelectedBatchNo('');
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
      generateReceiptNo();
    }
  }, [open]);

  const fetchProducts = async () => {
    try {
      console.log('🔄 Fetching products for ReceiptDialog...');
      const data = await FirestoreService.getProducts();
      console.log('📦 Products fetched:', data?.length || 0, 'items');
      setProducts(data || []);
    } catch (error) {
      console.error('❌ Error fetching products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const generateReceiptNo = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const receiptNo = `RC${year}${month}${day}${random}`;
    updateFormData('receipt_no', receiptNo);
  };

  // ตรวจสอบข้อมูลยาที่จำเป็น
  const validateMedicineItem = (product: ProductForReceipt, item: ReceiptItem) => {
    if (product.is_medicine) {
      if (!item.expiry_date) {
        return 'ยาต้องระบุวันที่หมดอายุ';
      }
      if (!item.batch_no) {
        return 'ยาต้องระบุเลขที่ล็อต';
      }
    }
    return null;
  };

  const addProductToReceipt = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    const existingItem = receiptItems.find(item => item.product_id === productId);
    if (existingItem) {
      toast({
        title: "สินค้าซ้ำ",
        description: "สินค้านี้มีในรายการรับแล้ว",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(selectedQuantity) || 1;
    const unitPrice = parseFloat(selectedUnitPrice) || 0;
    const totalPrice = quantity * unitPrice;

    const newItem: ReceiptItem = {
      id: Date.now().toString(),
      product_id: productId,
      product_name: product.name,
      product_sku: product.sku || '',
      quantity: quantity,
      unit: 'ชิ้น',
      unit_price: unitPrice,
      total_price: totalPrice,
      supplier: formData.supplier || 'ไม่ระบุ',
      batch_no: selectedBatchNo || undefined,
      expiry_date: selectedExpiryDate || undefined
    };

    // ตรวจสอบข้อมูลยา
    const medicineError = validateMedicineItem(product, newItem);
    if (medicineError) {
      toast({
        title: "ข้อมูลยาไม่ครบถ้วน",
        description: medicineError,
        variant: "destructive",
      });
      return;
    }

    setReceiptItems(prev => [...prev, newItem]);
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedUnitPrice('');
    setSelectedExpiryDate('');
    setSelectedBatchNo('');
  };

  const removeItem = (itemId: string) => {
    setReceiptItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateItemQuantity = (itemId: string, quantity: number) => {
    setReceiptItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const totalPrice = quantity * item.unit_price;
        return { ...item, quantity, total_price: totalPrice };
      }
      return item;
    }));
  };

  const updateItemUnitPrice = (itemId: string, unitPrice: number) => {
    setReceiptItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const totalPrice = item.quantity * unitPrice;
        return { ...item, unit_price: unitPrice, total_price: totalPrice };
      }
      return item;
    }));
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
      addProductToReceipt(product.id);
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
        description: "กรุณาเลือกสินค้าที่ต้องการรับเข้า",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 Dropdown product selected:', selectedProductId);
    addProductToReceipt(selectedProductId);
    setSelectedProductId('');
    setSelectedQuantity('');
    setSelectedUnitPrice('');
    setSelectedExpiryDate('');
    setSelectedBatchNo('');
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
    
    if (!formData.receipt_no || !formData.receipt_date || !formData.receiver_name) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุเลขที่รับ วันที่ และชื่อผู้รับ",
        variant: "destructive",
      });
      return;
    }

    if (receiptItems.length === 0) {
      toast({
        title: "กรุณาเพิ่มรายการสินค้า",
        description: "กรุณาเพิ่มสินค้าที่ต้องการรับ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔄 Starting receipt creation:', formData);
      console.log('📦 Receipt items:', receiptItems);
      
      // Create receipt record
      const receiptData = {
        receipt_no: formData.receipt_no,
        receipt_date: formData.receipt_date,
        receiver_name: formData.receiver_name,
        department: formData.department || 'ไม่ระบุ',
        supplier: formData.supplier || 'ไม่ระบุ',
        invoice_no: formData.invoice_no || '',
        notes: formData.notes || '',
        items: receiptItems,
        status: 'completed',
        created_at: new Date().toISOString(),
        created_by: 'current_user' // TODO: Get from auth context
      };
      
      console.log('📝 Creating receipt with data:', receiptData);
      
      // Debug: Check for undefined values
      const checkForUndefined = (obj: any, path = ''): string[] => {
        const undefinedFields: string[] = [];
        for (const key in obj) {
          const currentPath = path ? `${path}.${key}` : key;
          if (obj[key] === undefined) {
            undefinedFields.push(currentPath);
          } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            undefinedFields.push(...checkForUndefined(obj[key], currentPath));
          }
        }
        return undefinedFields;
      };
      
      const undefinedFields = checkForUndefined(receiptData);
      if (undefinedFields.length > 0) {
        console.error('❌ Found undefined fields:', undefinedFields);
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: `พบข้อมูลที่ไม่ถูกต้อง: ${undefinedFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      await FirestoreService.createReceipt(receiptData);
      console.log('✅ Receipt created successfully');
      
      // Notify parent component to refresh data
      onReceiptAdded();

      // Update product stocks
      for (const item of receiptItems) {
        const product = await FirestoreService.getProduct(item.product_id);
        if (product) {
          const newStock = (product.current_stock || 0) + item.quantity;
          
          console.log('📊 Updating stock for product:', {
            productId: item.product_id,
            current: product.current_stock,
            quantity: item.quantity,
            newStock: newStock
          });

          await FirestoreService.updateProduct(item.product_id, {
            current_stock: newStock
          });
          console.log('✅ Stock updated successfully for product:', item.product_id);
        }
      }

      toast({
        title: "บันทึกการรับเข้าพัสดุเรียบร้อย",
        description: `บันทึกการรับเข้าพัสดุเลขที่ ${formData.receipt_no} เรียบร้อยแล้ว`,
      });

      resetForm();
      setOpen(false);
      onReceiptAdded();

    } catch (error) {
      console.error('❌ Error creating receipt:', error);
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

  const totalAmount = receiptItems.reduce((sum, item) => sum + item.total_price, 0);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button 
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-12 px-8 text-base font-bold rounded-xl border-0"
          onClick={() => {
            setOpen(true);
          }}
        >
          <ArrowUp className="h-5 w-5 mr-2" />
          การรับเข้าพัสดุ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] w-[95vw] max-h-[90vh] bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50 shadow-2xl border border-green-200 rounded-2xl relative overflow-hidden p-0">
        {/* Vibrant Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-cyan-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-100/30 via-transparent to-cyan-100/30"></div>
        
        {/* Colorful Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 via-emerald-400 to-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-green-400 to-emerald-400"></div>
        
        <DialogHeader className="relative z-20 pb-4 px-6 pt-6 border-b border-green-200/60 bg-gradient-to-r from-white/95 to-green-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg">
                <ArrowUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                  การรับเข้าพัสดุ
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                  บันทึกการรับเข้าพัสดุเข้าคลัง
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

          {/* Receipt Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลการรับ</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  เลขที่การรับ
                </Label>
                <Input
                  value={formData.receipt_no}
                  onChange={(e) => updateFormData('receipt_no', e.target.value)}
                  placeholder="เลขที่การรับ"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  วันที่รับ
                </Label>
                <Input
                  type="date"
                  value={formData.receipt_date}
                  onChange={(e) => updateFormData('receipt_date', e.target.value)}
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ชื่อผู้รับ
                </Label>
                <Input
                  value={formData.receiver_name}
                  onChange={(e) => updateFormData('receiver_name', e.target.value)}
                  placeholder="ชื่อผู้รับ"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
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
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  ผู้จำหน่าย
                </Label>
                <Input
                  value={formData.supplier}
                  onChange={(e) => updateFormData('supplier', e.target.value)}
                  placeholder="ผู้จำหน่าย"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  เลขที่ใบแจ้งหนี้
                </Label>
                <Input
                  value={formData.invoice_no}
                  onChange={(e) => updateFormData('invoice_no', e.target.value)}
                  placeholder="เลขที่ใบแจ้งหนี้"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Add Product Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Package className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">เพิ่มรายการสินค้า</h3>
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
                      type="text"
                      value={manualBarcode}
                      onChange={(e) => setManualBarcode(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleManualBarcodeSubmit()}
                      placeholder="กรอกบาร์โค้ดสินค้า"
                      className="h-9 text-sm border-2 border-blue-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-blue-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                    />
                    <Button
                      type="button"
                      onClick={handleManualBarcodeSubmit}
                      disabled={!manualBarcode.trim()}
                      className="h-9 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg border-0"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      เพิ่ม
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  สินค้า
                </Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                    <SelectValue placeholder="เลือกสินค้า" />
                  </SelectTrigger>
                  <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                    {products.length === 0 ? (
                      <SelectItem value="no-products" disabled className="text-sm py-2 text-gray-500">
                        ไม่มีสินค้าในระบบ
                      </SelectItem>
                    ) : (
                      products.map((product) => (
                        <SelectItem key={product.id} value={product.id} className="text-sm py-2 hover:bg-blue-50">
                          <div className="font-semibold">{product.name}</div>
                        </SelectItem>
                      ))
                    )}
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
                  ราคาต่อหน่วย
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={selectedUnitPrice}
                  onChange={(e) => setSelectedUnitPrice(e.target.value)}
                  placeholder="ราคาต่อหน่วย"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  เลขที่ล็อต {selectedProductId && products.find(p => p.id === selectedProductId)?.is_medicine && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  value={selectedBatchNo}
                  onChange={(e) => setSelectedBatchNo(e.target.value)}
                  placeholder="เลขที่ล็อต"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700">
                  วันที่หมดอายุ {selectedProductId && products.find(p => p.id === selectedProductId)?.is_medicine && <span className="text-red-500">*</span>}
                </Label>
                <Input
                  type="date"
                  value={selectedExpiryDate}
                  onChange={(e) => setSelectedExpiryDate(e.target.value)}
                  className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleDropdownSubmit}
                className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all duration-200 rounded-lg border-0"
              >
                <Plus className="h-4 w-4 mr-1" />
                เพิ่มรายการ
              </Button>
            </div>
              </div>
            )}
          </div>

          {/* Receipt Items List */}
          {receiptItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                  <TrendingUp className="h-3 w-3 text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">รายการสินค้าที่รับ</h3>
              </div>
              
              <div className="space-y-2">
                {receiptItems.map((item) => (
                  <div key={item.id} className="p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-800 text-sm">{item.product_name}</h4>
                        <p className="text-xs text-gray-600">SKU: {item.product_sku}</p>
                        {item.is_medicine && <p className="text-xs text-red-600 font-medium">ยา</p>}
                        {selectedBatchNo && <p className="text-xs text-gray-600">ล็อต: {selectedBatchNo}</p>}
                        {item.expiry_date && <p className="text-xs text-gray-600">หมดอายุ: {item.expiry_date}</p>}
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="text-right">
                          <div className="flex items-center space-x-1">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateItemQuantity(item.id, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-sm text-center"
                            />
                            <span className="text-xs text-gray-500">{item.unit}</span>
                          </div>
                          <div className="flex items-center space-x-1 mt-1">
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) => updateItemUnitPrice(item.id, parseFloat(e.target.value) || 0)}
                              className="w-20 h-8 text-sm text-center"
                            />
                            <span className="text-xs text-gray-500">บาท</span>
                          </div>
                          <div className="text-xs text-green-600 font-medium mt-1">
                            รวม: {item.total_price.toFixed(2)} บาท
                          </div>
                        </div>
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

              {/* Total Amount */}
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-green-800">ยอดรวมทั้งสิ้น:</span>
                  <span className="text-lg font-bold text-green-800">{totalAmount.toFixed(2)} บาท</span>
                </div>
              </div>
            </div>
          )}

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
          <div className="relative z-10 flex justify-end space-x-3 pt-6 px-6 border-t border-green-200/60 bg-gradient-to-r from-green-50/95 to-white/95 backdrop-blur-sm">
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
              disabled={isLoading || scannerDetected || receiptItems.length === 0}
              className="h-11 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl border-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  บันทึกการรับเข้าพัสดุ
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
