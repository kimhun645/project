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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Loader2, CalendarIcon, X, Package, Tag, Building2, MapPin, DollarSign, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirestoreService } from '@/lib/firestoreService';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface CategoryForProduct {
  id: string;
  name: string;
  is_medicine?: boolean;
}

interface SupplierForProduct {
  id: string;
  name: string;
}

interface AddProductDialogProps {
  onProductAdded: () => void;
}

export function AddProductDialog({ onProductAdded }: AddProductDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<CategoryForProduct[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierForProduct[]>([]);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    description: '',
    category_id: '',
    supplier_id: '',
    unit_price: '',
    cost_price: '',
    current_stock: '0',
    min_stock: '',
    max_stock: '',
    location: '',
    unit: 'ชิ้น',
    is_medicine: false,
    expiry_date: '',
    batch_no: '',
    purchase_price: '',
    margin_percentage: ''
  });
  
  const selectedCategory = categories.find(cat => cat.id === formData.category_id);
  
  // Barcode scanner detection
  const scannerInputRef = React.useRef<string>('');
  const scannerTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      description: '',
      category_id: '',
      supplier_id: '',
      unit_price: '',
      cost_price: '',
      current_stock: '0',
      min_stock: '',
      max_stock: '',
      location: '',
      unit: 'ชิ้น',
      is_medicine: false,
      expiry_date: '',
      batch_no: '',
      purchase_price: '',
      margin_percentage: ''
    });
    setExpiryDate(undefined);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetForm();
    }
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchCategoriesAndSuppliers = async () => {
    try {
      const [categoriesResult, suppliersResult] = await Promise.all([
        FirestoreService.getCategories(),
        FirestoreService.getSuppliers()
      ]);

      setCategories(categoriesResult || []);
      setSuppliers(suppliersResult || []);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถดึงข้อมูลหมวดหมู่และผู้จำหน่ายได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (open) {
      fetchCategoriesAndSuppliers();
    }
  }, [open]);

  // ฟังก์ชันการคำนวณอัตโนมัติ
  const calculateSellingPrice = (costPrice: number, marginPercent: number) => {
    return costPrice * (1 + marginPercent / 100);
  };

  const calculateMargin = (costPrice: number, sellingPrice: number) => {
    return ((sellingPrice - costPrice) / costPrice) * 100;
  };

  // ตรวจสอบข้อมูลที่จำเป็น
  const validateProductData = () => {
    const errors = [];
    
    if (!formData.name) errors.push('ชื่อสินค้า');
    if (!formData.category_id) errors.push('หมวดหมู่');
    if (!formData.supplier_id) errors.push('ผู้จำหน่าย');
    if (!formData.unit_price) errors.push('ราคาขาย');
    
    // ตรวจสอบยาที่ต้องมีวันที่หมดอายุ
    if (selectedCategory?.is_medicine && !expiryDate) {
      errors.push('วันที่หมดอายุ (จำเป็นสำหรับยา)');
    }
    
    return errors;
  };

  // อัปเดตราคาขายเมื่อราคาต้นทุนหรือเปอร์เซ็นต์กำไรเปลี่ยน
  const updateSellingPrice = () => {
    const costPrice = parseFloat(formData.cost_price) || 0;
    const marginPercent = parseFloat(formData.margin_percentage) || 0;
    
    if (costPrice > 0 && marginPercent > 0) {
      const sellingPrice = calculateSellingPrice(costPrice, marginPercent);
      updateFormData('unit_price', sellingPrice.toFixed(2));
    }
  };

  // อัปเดตเปอร์เซ็นต์กำไรเมื่อราคาต้นทุนหรือราคาขายเปลี่ยน
  const updateMarginPercentage = () => {
    const costPrice = parseFloat(formData.cost_price) || 0;
    const sellingPrice = parseFloat(formData.unit_price) || 0;
    
    if (costPrice > 0 && sellingPrice > 0) {
      const margin = calculateMargin(costPrice, sellingPrice);
      updateFormData('margin_percentage', margin.toFixed(2));
    }
  };



  const generateSKU = async () => {
    try {
      const products = await FirestoreService.getProducts();
      
      let nextNum = 1;
      if (products && products.length > 0) {
        const lastSKU = products[0].sku;
        const match = lastSKU.match(/SKU-(\d+)/);
        if (match) {
          nextNum = parseInt(match[1]) + 1;
        }
      }

      return `SKU-${nextNum.toString().padStart(4, '0')}`;
    } catch (error) {
      return `SKU-${Date.now()}`;
    }
  };

  // Check if barcode exists
  const checkBarcodeExists = async (barcode: string) => {
    if (!barcode) return false;
    
    const { FirestoreService } = await import('@/lib/firestoreService');
    const product = await FirestoreService.getProductByBarcode(barcode);
    return !!product;
  };

  // Barcode scanner detection
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return; // Only when dialog is open
      
      const isEnter = event.key === 'Enter';
      const isValidChar = /^[a-zA-Z0-9]$/.test(event.key);
      
      if (isValidChar || isEnter) {
        // Clear existing timeout
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        if (isEnter) {
          // Process the accumulated input
          if (scannerInputRef.current.length > 3) { // Typical barcode length
            const scannedBarcode = scannerInputRef.current;
            setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
            
            toast({
              title: "สแกนบาร์โค้ดสำเร็จ",
              description: `บาร์โค้ด: ${scannedBarcode}`,
            });
          }
          
          // Reset the input buffer
          scannerInputRef.current = '';
        } else {
          // Accumulate characters
          scannerInputRef.current += event.key;
          
          // Set timeout to reset buffer if typing is too slow
          scannerTimeoutRef.current = setTimeout(() => {
            scannerInputRef.current = '';
          }, 100);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (scannerTimeoutRef.current) {
        clearTimeout(scannerTimeoutRef.current);
      }
    };
  }, [open, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // ใช้ฟังก์ชันตรวจสอบข้อมูลที่ปรับปรุงแล้ว
    const validationErrors = validateProductData();
    if (validationErrors.length > 0) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: `ข้อมูลที่ขาดหายไป: ${validationErrors.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Check if barcode already exists
    if (formData.barcode) {
      const barcodeExists = await checkBarcodeExists(formData.barcode);
      if (barcodeExists) {
        toast({
          title: "บาร์โค้ดซ้ำ",
          description: "บาร์โค้ดนี้มีอยู่ในระบบแล้ว กรุณาใช้บาร์โค้ดอื่น",
          variant: "destructive",
        });
        return;
      }
    }

    // Check if medicine category requires expiry date
    if (selectedCategory?.is_medicine && !expiryDate) {
      toast({
        title: "กรุณาระบุวันหมดอายุ",
        description: "หมวดหมู่ยาต้องระบุวันหมดอายุ",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Use barcode as SKU if SKU is empty but barcode is provided
      let sku = formData.sku;
      if (!sku && formData.barcode) {
        sku = formData.barcode;
      }
      
      // Generate SKU if both are empty
      if (!sku) {
        sku = await generateSKU();
      }

      // Check if SKU already exists
      const products = await FirestoreService.getProducts();
      const existingSKU = products.find(p => p.sku === sku);
      
      if (existingSKU) {
        toast({
          title: "SKU ซ้ำ",
          description: "SKU นี้มีอยู่ในระบบแล้ว กรุณาระบุ SKU อื่น",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Insert new product
      const productData = {
        name: formData.name,
        sku: sku,
        category_id: formData.category_id,
        supplier_id: formData.supplier_id,
        unit_price: parseFloat(formData.unit_price),
        current_stock: parseInt(formData.current_stock) || 0,
        min_stock: parseInt(formData.min_stock) || 0,
        ...(formData.barcode && { barcode: formData.barcode }),
        ...(formData.description && { description: formData.description }),
        ...(formData.max_stock && { max_stock: parseInt(formData.max_stock) }),
        ...(formData.location && { location: formData.location }),
        ...(expiryDate && { expiry_date: expiryDate.toISOString().split('T')[0] })
      };
      
      await FirestoreService.createProduct(productData);

      toast({
        title: "เพิ่มสินค้าเรียบร้อย",
        description: `เพิ่มสินค้า ${formData.name} (${sku}) เรียบร้อยแล้ว`,
      });

      // Reset form
      setFormData({
        name: '',
        sku: '',
        barcode: '',
        description: '',
        category_id: '',
        supplier_id: '',
        unit_price: '',
        cost_price: '',
        current_stock: '',
        min_stock: '',
        max_stock: '',
        location: ''
      });
      
      setExpiryDate(undefined);
      setOpen(false);
      onProductAdded();

    } catch (error) {
      // More specific error handling
      let errorMessage = "ไม่สามารถเพิ่มสินค้าได้";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = String(error.message);
      }
      
      toast({
        title: "เกิดข้อผิดพลาด",
        description: errorMessage,
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
          className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-12 px-8 text-base font-bold rounded-xl border-0"
          onClick={() => {
            setOpen(true);
          }}
        >
          <Plus className="h-5 w-5 mr-2" />
          เพิ่มสินค้าใหม่
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] bg-gradient-to-br from-pink-50 via-yellow-50 to-cyan-50 shadow-2xl border border-pink-200 rounded-2xl relative overflow-hidden p-0">
        {/* Vibrant Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-yellow-50 to-cyan-50"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/30 via-transparent to-green-100/30"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-purple-100/20 via-transparent to-pink-100/20"></div>
        
        {/* Colorful Accent Lines */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-400 via-yellow-400 via-green-400 to-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-400 via-pink-400 to-yellow-400"></div>
        
        {/* Vibrant Corner Accents */}
        <div className="absolute top-4 right-4 w-3 h-3 bg-pink-400 rounded-full shadow-lg"></div>
        <div className="absolute top-4 right-10 w-2 h-2 bg-yellow-400 rounded-full shadow-md"></div>
        <div className="absolute top-4 right-16 w-1 h-1 bg-green-400 rounded-full"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-cyan-400 rounded-full shadow-lg"></div>
        <div className="absolute bottom-4 left-10 w-2 h-2 bg-purple-400 rounded-full shadow-md"></div>
        <div className="absolute bottom-4 left-16 w-1 h-1 bg-orange-400 rounded-full"></div>
        
        {/* Floating Colorful Elements */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-br from-pink-200/40 to-yellow-200/40 rounded-full"></div>
        <div className="absolute top-1/3 right-1/3 w-12 h-12 bg-gradient-to-br from-green-200/40 to-cyan-200/40 rounded-full"></div>
        <div className="absolute bottom-1/4 right-1/4 w-14 h-14 bg-gradient-to-br from-purple-200/40 to-pink-200/40 rounded-full"></div>
        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 bg-gradient-to-br from-orange-200/40 to-yellow-200/40 rounded-full"></div>
        
        <DialogHeader className="relative z-20 pb-4 px-6 pt-6 border-b border-pink-200/60 bg-gradient-to-r from-white/95 to-pink-50/95 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                  เพิ่มสินค้าใหม่
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                  สร้างสินค้าใหม่ในระบบจัดการคลังสินค้า
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200 hover:scale-110 z-30 relative -mr-2 -mt-2">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 py-4 px-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Basic Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Tag className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลพื้นฐาน</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ชื่อสินค้า
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => updateFormData('name', e.target.value)}
                  placeholder="กรอกชื่อสินค้า"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sku" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-slate-400 mr-1">*</span>
                  SKU
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => updateFormData('sku', e.target.value)}
                  placeholder="SKU-0001"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">รายละเอียดสินค้า</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData('description', e.target.value)}
                placeholder="กรอกรายละเอียดเพิ่มเติมเกี่ยวกับสินค้า"
                className="min-h-[60px] text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Category & Supplier Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <Building2 className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">หมวดหมู่และผู้จำหน่าย</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  หมวดหมู่สินค้า
                </Label>
                <Select value={formData.category_id} onValueChange={(value) => updateFormData('category_id', value)}>
                  <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id} className="text-sm py-2 hover:bg-emerald-50">
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ผู้จำหน่าย
                </Label>
                <Select value={formData.supplier_id} onValueChange={(value) => updateFormData('supplier_id', value)}>
                  <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                    <SelectValue placeholder="เลือกผู้จำหน่าย" />
                  </SelectTrigger>
                  <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id} className="text-sm py-2 hover:bg-emerald-50">
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Barcode & Location Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <MapPin className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">บาร์โค้ดและตำแหน่งจัดเก็บ</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="barcode" className="text-xs font-semibold text-slate-700">บาร์โค้ดสินค้า</Label>
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => updateFormData('barcode', e.target.value)}
                  placeholder="สแกนหรือป้อนบาร์โค้ด"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
                <p className="text-xs text-slate-500">กด Enter เพื่อสแกนบาร์โค้ดอัตโนมัติ</p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs font-semibold text-slate-700">ตำแหน่งจัดเก็บ</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => updateFormData('location', e.target.value)}
                  placeholder="เช่น A-01-01, ชั้น 2"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <DollarSign className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ราคาและต้นทุน</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="unit_price" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ราคาขาย (บาท)
                </Label>
                <div className="relative">
                  <Input
                    id="unit_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => updateFormData('unit_price', e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-7"
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">฿</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="cost_price" className="text-xs font-semibold text-slate-700">ราคาต้นทุน (บาท)</Label>
                <div className="relative">
                  <Input
                    id="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.cost_price}
                    onChange={(e) => updateFormData('cost_price', e.target.value)}
                    placeholder="0.00"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-7"
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">฿</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="purchase_price" className="text-xs font-semibold text-slate-700">ราคาซื้อ (บาท)</Label>
                <div className="relative">
                  <Input
                    id="purchase_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.purchase_price}
                    onChange={(e) => {
                      updateFormData('purchase_price', e.target.value);
                      updateSellingPrice();
                    }}
                    placeholder="0.00"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-7"
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">฿</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="margin_percentage" className="text-xs font-semibold text-slate-700">เปอร์เซ็นต์กำไร (%)</Label>
                <div className="relative">
                  <Input
                    id="margin_percentage"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.margin_percentage}
                    onChange={(e) => {
                      updateFormData('margin_percentage', e.target.value);
                      updateSellingPrice();
                    }}
                    placeholder="0.00"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-7"
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stock Management Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-indigo-500 to-blue-600 rounded-lg">
                <BarChart3 className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">การจัดการสต็อก</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="current_stock" className="text-xs font-semibold text-slate-700">สต็อกปัจจุบัน</Label>
                <Input
                  id="current_stock"
                  type="number"
                  min="0"
                  value={formData.current_stock}
                  onChange={(e) => updateFormData('current_stock', e.target.value)}
                  placeholder="0"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="min_stock" className="text-xs font-semibold text-slate-700">สต็อกขั้นต่ำ</Label>
                <Input
                  id="min_stock"
                  type="number"
                  min="0"
                  value={formData.min_stock}
                  onChange={(e) => updateFormData('min_stock', e.target.value)}
                  placeholder="0"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="max_stock" className="text-xs font-semibold text-slate-700">สต็อกสูงสุด</Label>
                <Input
                  id="max_stock"
                  type="number"
                  min="0"
                  value={formData.max_stock}
                  onChange={(e) => updateFormData('max_stock', e.target.value)}
                  placeholder="ไม่จำกัด"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Medicine Information */}
          {selectedCategory?.is_medicine && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                  <AlertCircle className="h-3 w-3 text-white" />
                </div>
                <h3 className="text-base font-semibold text-slate-800">ข้อมูลยา</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="batch_no" className="text-xs font-semibold text-slate-700">เลขที่ล็อต</Label>
                  <Input
                    id="batch_no"
                    value={formData.batch_no}
                    onChange={(e) => updateFormData('batch_no', e.target.value)}
                    placeholder="เลขที่ล็อต"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="unit" className="text-xs font-semibold text-slate-700">หน่วยนับ</Label>
                  <Select value={formData.unit} onValueChange={(value) => updateFormData('unit', value)}>
                    <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                      <SelectValue placeholder="เลือกหน่วย" />
                    </SelectTrigger>
                    <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                      <SelectItem value="ชิ้น" className="text-sm py-2 hover:bg-emerald-50">ชิ้น</SelectItem>
                      <SelectItem value="กล่อง" className="text-sm py-2 hover:bg-emerald-50">กล่อง</SelectItem>
                      <SelectItem value="ขวด" className="text-sm py-2 hover:bg-emerald-50">ขวด</SelectItem>
                      <SelectItem value="แผง" className="text-sm py-2 hover:bg-emerald-50">แผง</SelectItem>
                      <SelectItem value="แคปซูล" className="text-sm py-2 hover:bg-emerald-50">แคปซูล</SelectItem>
                      <SelectItem value="เม็ด" className="text-sm py-2 hover:bg-emerald-50">เม็ด</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  วันหมดอายุ
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full h-9 justify-start text-left font-normal text-sm border-2 border-slate-200 hover:border-emerald-500 hover:bg-slate-50 bg-white transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                    >
                      <CalendarIcon className="mr-2 h-3 w-3 text-slate-500" />
                      {expiryDate ? format(expiryDate, "dd/MM/yyyy") : "เลือกวันหมดอายุ"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 rounded-lg border-2 border-slate-200 shadow-xl" align="start">
                    <Calendar
                      mode="single"
                      selected={expiryDate}
                      onSelect={setExpiryDate}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex items-start space-x-2 p-2 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-3 w-3 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-700 font-medium">
                    หมวดหมู่ยาต้องระบุวันหมดอายุเพื่อความปลอดภัย
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="relative z-10 flex justify-end space-x-3 pt-6 px-6 border-t border-pink-200/60 bg-gradient-to-r from-pink-50/95 to-white/95 backdrop-blur-sm">
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
              disabled={isLoading}
              className="h-11 px-8 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  เพิ่มสินค้า
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}