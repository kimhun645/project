import React, { useState, useEffect } from 'react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Edit3, Save, Loader2, Package, Building2, Tag, DollarSign, BarChart3, MapPin, AlertCircle, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { FirestoreService } from '@/lib/firestoreService';

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  supplier_id: string;
  unit_price: number;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit?: string;
  location?: string;
  barcode?: string;
  category_name?: string;
  supplier_name?: string;
  created_at: string;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

interface Supplier {
  id: string;
  name: string;
}

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  variant?: 'default' | 'colorful' | 'professional' | 'minimal';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export function EditProductDialog({ 
  product, 
  open, 
  onOpenChange, 
  onSuccess, 
  variant = 'colorful',
  size = 'lg'
}: EditProductDialogProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    supplier_id: '',
    barcode: '',
    location: '',
    unit_price: 0,
    current_stock: 0,
    min_stock: 0,
    max_stock: 0,
    unit: '',
    expiry_date: null as Date | null,
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        category_id: product.category_id || '',
        supplier_id: product.supplier_id || '',
        barcode: product.barcode || '',
        location: product.location || '',
        unit_price: product.unit_price || 0,
        current_stock: product.current_stock || 0,
        min_stock: product.min_stock || 0,
        max_stock: product.max_stock || 0,
        unit: product.unit || '',
        expiry_date: product.expiry_date ? new Date(product.expiry_date) : null,
      });
    }
  }, [product]);

  useEffect(() => {
    if (open) {
      fetchData();
    }
  }, [open]);

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      const [categoriesData, suppliersData] = await Promise.all([
        FirestoreService.getCategories(),
        FirestoreService.getSuppliers(),
      ]);
      setCategories(categoriesData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        variant: "destructive",
      });
    } finally {
      setIsDataLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Validate required fields
    if (!formData.name.trim()) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณากรอกชื่อสินค้า",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category_id) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกหมวดหมู่",
        variant: "destructive",
      });
      return;
    }

    if (!formData.supplier_id) {
      toast({
        title: "ข้อมูลไม่ครบถ้วน",
        description: "กรุณาเลือกผู้จำหน่าย",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare update data, excluding undefined values
      const updateData: any = {
        name: formData.name,
        sku: formData.sku,
        description: formData.description || '',
        category_id: formData.category_id,
        supplier_id: formData.supplier_id,
        unit_price: formData.unit_price,
        current_stock: formData.current_stock,
        min_stock: formData.min_stock,
        max_stock: formData.max_stock || 0,
        unit: formData.unit || '',
        location: formData.location || '',
        barcode: formData.barcode || '',
      };

      // Only add expiry_date if it exists
      if (formData.expiry_date) {
        updateData.expiry_date = formData.expiry_date.toISOString();
      }

      console.log('🔄 Updating product:', product.id, updateData);
      
      // Debug: Check for undefined values in updateData
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
      
      const undefinedFields = checkForUndefined(updateData);
      if (undefinedFields.length > 0) {
        console.error('❌ Found undefined fields in updateData:', undefinedFields);
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: `พบข้อมูลที่ไม่ถูกต้อง: ${undefinedFields.join(', ')}`,
          variant: "destructive",
        });
        return;
      }
      
      await FirestoreService.updateProduct(product.id, updateData);
      
      toast({
        title: "สำเร็จ",
        description: "แก้ไขสินค้าสำเร็จ",
        variant: "default",
      });
      
      console.log('🔄 Calling onSuccess callback...');
      if (typeof onSuccess === 'function') {
        onSuccess();
      } else {
        console.error('❌ onSuccess is not a function:', typeof onSuccess);
      }
      
      console.log('🔄 Calling onOpenChange callback...');
      if (typeof onOpenChange === 'function') {
        onOpenChange(false);
      } else {
        console.error('❌ onOpenChange is not a function:', typeof onOpenChange);
      }
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      
      let errorMessage = "เกิดข้อผิดพลาดในการแก้ไขสินค้า";
      if (error.message) {
        errorMessage = error.message;
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

  if (!product) return null;

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="แก้ไขสินค้า"
      description={product.name}
      icon={<Edit3 className="h-6 w-6 text-white" />}
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
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="กรอกชื่อสินค้า"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="sku" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  SKU
                </Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  placeholder="SKU-0001"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="description" className="text-xs font-semibold text-slate-700">รายละเอียดสินค้า</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="รายละเอียดสินค้า"
                className="text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                rows={3}
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
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => setFormData({...formData, category_id: value})}
                  disabled={isDataLoading}
                >
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
                <Select
                  value={formData.supplier_id}
                  onValueChange={(value) => setFormData({...formData, supplier_id: value})}
                  disabled={isDataLoading}
                >
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
                  onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                  placeholder="สแกนหรือป้อนบาร์โค้ด"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="location" className="text-xs font-semibold text-slate-700">ตำแหน่งจัดเก็บ</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
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
                  ราคาต่อหน่วย (บาท)
                </Label>
                <div className="relative">
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    value={formData.unit_price}
                    onChange={(e) => setFormData({...formData, unit_price: parseFloat(e.target.value) || 0})}
                    placeholder="0.00"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-7"
                    required
                  />
                  <span className="absolute left-2 top-1/2 transform -translate-y-1/2 text-slate-500 text-xs">฿</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="unit" className="text-xs font-semibold text-slate-700">หน่วยนับ</Label>
                <Input
                  id="unit"
                  value={formData.unit}
                  onChange={(e) => setFormData({...formData, unit: e.target.value})}
                  placeholder="เช่น ชิ้น, กล่อง, แพ็ค"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="current_stock" className="text-xs font-semibold text-slate-700">สต็อกปัจจุบัน</Label>
                <Input
                  id="current_stock"
                  type="number"
                  value={formData.current_stock}
                  onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="min_stock" className="text-xs font-semibold text-slate-700">สต็อกขั้นต่ำ</Label>
                <Input
                  id="min_stock"
                  type="number"
                  value={formData.min_stock}
                  onChange={(e) => setFormData({...formData, min_stock: parseInt(e.target.value) || 0})}
                  placeholder="0"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="max_stock" className="text-xs font-semibold text-slate-700">สต็อกสูงสุด</Label>
              <Input
                id="max_stock"
                type="number"
                value={formData.max_stock}
                onChange={(e) => setFormData({...formData, max_stock: parseInt(e.target.value) || 0})}
                placeholder="0"
                className="h-9 text-sm border-2 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
              />
            </div>
          </div>

          {/* Expiry Date Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg">
                <AlertCircle className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">วันหมดอายุ</h3>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-700">วันหมดอายุ</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-9 justify-start text-left font-normal text-sm border-2 border-slate-200 hover:border-emerald-500 hover:bg-slate-50 bg-white transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                  >
                    <CalendarIcon className="mr-2 h-3 w-3 text-slate-500" />
                    {formData.expiry_date ? format(formData.expiry_date, 'dd/MM/yyyy', { locale: th }) : 'เลือกวันหมดอายุ'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-lg border-2 border-slate-200 shadow-xl" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.expiry_date || undefined}
                    onSelect={(date) => setFormData({...formData, expiry_date: date || null})}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
                  บันทึกการแก้ไข
                </>
              )}
            </Button>
          </div>
        </form>
    </ResponsiveModal>
  );
}

