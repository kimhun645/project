import React, { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Plus, Loader2, CalendarIcon, Package, Tag, Building2, MapPin, DollarSign, BarChart3, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  variant?: 'default' | 'colorful' | 'professional' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function AddProductDialogWithResponsiveModal({ 
  onProductAdded, 
  variant = 'colorful',
  size = 'lg'
}: AddProductDialogProps) {
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
    current_stock: '',
    min_stock: '',
    max_stock: '',
    location: ''
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
      current_stock: '',
      min_stock: '',
      max_stock: '',
      location: ''
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
      if (!open) return;
      
      const isEnter = event.key === 'Enter';
      const isValidChar = /^[a-zA-Z0-9]$/.test(event.key);
      
      if (isValidChar || isEnter) {
        if (scannerTimeoutRef.current) {
          clearTimeout(scannerTimeoutRef.current);
        }

        if (isEnter) {
          if (scannerInputRef.current.length > 3) {
            const scannedBarcode = scannerInputRef.current;
            setFormData(prev => ({ ...prev, barcode: scannedBarcode }));
            
            toast({
              title: "สแกนบาร์โค้ดสำเร็จ",
              description: `บาร์โค้ด: ${scannedBarcode}`,
            });
          }
          
          scannerInputRef.current = '';
        } else {
          scannerInputRef.current += event.key;
          
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
    
    if (!formData.name || !formData.category_id || !formData.supplier_id || !formData.unit_price) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อสินค้า หมวดหมู่ ผู้จำหน่าย และราคา",
        variant: "destructive",
      });
      return;
    }

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
      let sku = formData.sku;
      if (!sku && formData.barcode) {
        sku = formData.barcode;
      }
      
      if (!sku) {
        sku = await generateSKU();
      }

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

      resetForm();
      setOpen(false);
      onProductAdded();

    } catch (error) {
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

  const trigger = (
    <Button 
      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-12 px-8 text-base font-bold rounded-xl border-0"
    >
      <Plus className="h-5 w-5 mr-2" />
      เพิ่มสินค้าใหม่
    </Button>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={handleOpenChange}
      title="เพิ่มสินค้าใหม่"
      description="สร้างสินค้าใหม่ในระบบจัดการพัสดุ"
      icon={<Package className="h-6 w-6 text-white" />}
      trigger={trigger}
      size={size}
      variant={variant}
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-4 px-6">
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

        {/* Expiry Date for Medicine */}
        {selectedCategory?.is_medicine && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">วันหมดอายุ</h3>
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
        <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
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
    </ResponsiveModal>
  );
}
