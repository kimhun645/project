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
  Loader2, 
  X, 
  Package, 
  ArrowUp, 
  ArrowDown, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Edit,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FirestoreService, Movement } from '@/lib/firestoreService';

interface ProductForMovement {
  id: string;
  name: string;
  sku: string;
  current_stock: number;
}

interface MovementWithProduct extends Movement {
  product_name: string;
  product_sku: string;
}

interface EditMovementDialogProps {
  movement: MovementWithProduct | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMovementUpdated: () => void;
}

export function EditMovementDialog({ movement, open, onOpenChange, onMovementUpdated }: EditMovementDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<ProductForMovement[]>([]);
  
  const [formData, setFormData] = useState({
    product_id: '',
    type: '' as 'in' | 'out' | '',
    quantity: '',
    reason: '',
    reference: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      product_id: '',
      type: '' as 'in' | 'out' | '',
      quantity: '',
      reason: '',
      reference: '',
      notes: ''
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (open && movement) {
      fetchProducts();
      // Populate form with movement data
      setFormData({
        product_id: movement.product_id || '',
        type: movement.type || '',
        quantity: movement.quantity?.toString() || '',
        reason: movement.reason || '',
        reference: movement.reference || '',
        notes: movement.notes || ''
      });
    }
  }, [open, movement]);

  const fetchProducts = async () => {
    try {
      const data = await FirestoreService.getProducts();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movement?.id) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลการเคลื่อนไหวที่ต้องการแก้ไข",
        variant: "destructive",
      });
      return;
    }

    if (!formData.product_id || !formData.type || !formData.quantity || !formData.reason) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุสินค้า ประเภท จำนวน และเหตุผล",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (quantity <= 0) {
      toast({
        title: "จำนวนไม่ถูกต้อง",
        description: "กรุณาระบุจำนวนที่มากกว่า 0",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Get current product stock
      const product = await FirestoreService.getProduct(formData.product_id);
      if (!product) throw new Error('ไม่พบสินค้า');

      // Calculate stock difference
      const originalQuantity = movement.quantity || 0;
      const quantityDifference = quantity - originalQuantity;
      const newStock = (product.current_stock || 0) + quantityDifference;

      // Check if stock out is possible
      if (newStock < 0) {
        toast({
          title: "สต็อกไม่เพียงพอ",
          description: `สต็อกปัจจุบัน: ${product.current_stock || 0} ไม่เพียงพอสำหรับการปรับปรุงนี้`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Update movement record
      await FirestoreService.updateMovement(movement.id, {
        product_id: formData.product_id,
        type: formData.type,
        quantity: quantity,
        reason: formData.reason,
        reference: formData.reference || undefined,
        notes: formData.notes || undefined
      });

      // Update product stock
      await FirestoreService.updateProduct(formData.product_id, {
        current_stock: newStock
      });

      toast({
        title: "แก้ไขข้อมูลเรียบร้อย",
        description: `แก้ไขการเคลื่อนไหว ${formData.type === 'in' ? 'รับเข้า' : 'เบิกออก'} ${quantity} หน่วยเรียบร้อยแล้ว`,
      });

      resetForm();
      onOpenChange(false);
      onMovementUpdated();

    } catch (error) {
      console.error('Error updating movement:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProduct = products.find(p => p.id === formData.product_id);
  const isStockOut = formData.type === 'out';
  const isStockIn = formData.type === 'in';
  const quantity = parseInt(formData.quantity) || 0;
  const originalQuantity = movement?.quantity || 0;
  const quantityDifference = quantity - originalQuantity;
  const newStock = selectedProduct ? 
    (selectedProduct.current_stock || 0) + quantityDifference : 0;

  if (!movement) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-lg">
                <Edit className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">
                  แก้ไขการเบิก/การรับพัสดุ
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                  แก้ไขข้อมูลการเบิก/การรับพัสดุในระบบ
                </DialogDescription>
              </div>
            </div>
            <DialogClose className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl p-2 transition-all duration-200 hover:scale-110 z-30 relative -mr-2 -mt-2">
              <X className="h-5 w-5" />
            </DialogClose>
          </div>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="relative z-10 space-y-4 py-4 px-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Product Selection Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                <Package className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">เลือกสินค้า</h3>
            </div>
            
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-slate-700 flex items-center">
                <span className="text-red-500 mr-1">*</span>
                สินค้า
              </Label>
              <Select value={formData.product_id} onValueChange={(value) => updateFormData('product_id', value)}>
                <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                  <SelectValue placeholder="เลือกสินค้าที่ต้องการแก้ไขการเคลื่อนไหว" />
                </SelectTrigger>
                <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id} className="text-sm py-2 hover:bg-blue-50">
                      <div className="flex items-center justify-between w-full">
                        <div>
                          <div className="font-semibold">{product.name}</div>
                          <div className="text-xs text-gray-500">SKU: {product.sku}</div>
                        </div>
                        <div className="text-xs text-blue-600 font-medium ml-2">
                          สต็อก: {product.current_stock || 0}
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProduct && (
              <div className="p-3 bg-white rounded-lg border border-blue-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-sm">{selectedProduct.name}</h4>
                    <p className="text-xs text-gray-600">SKU: {selectedProduct.sku}</p>
                  </div>
                  <div className="text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                    สต็อกปัจจุบัน: {selectedProduct.current_stock}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Movement Type and Quantity Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <TrendingUp className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">รายละเอียดการเคลื่อนไหว</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  ประเภทการเคลื่อนไหว
                </Label>
                <Select value={formData.type} onValueChange={(value) => updateFormData('type', value)}>
                  <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                    <SelectItem value="in" className="text-sm py-2 hover:bg-green-50">
                      <div className="flex items-center">
                        <ArrowUp className="mr-2 h-3 w-3 text-green-600" />
                        <span className="font-semibold">รับเข้า (Stock In)</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="out" className="text-sm py-2 hover:bg-green-50">
                      <div className="flex items-center">
                        <ArrowDown className="mr-2 h-3 w-3 text-red-600" />
                        <span className="font-semibold">เบิกออก (Stock Out)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="quantity" className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  จำนวน
                </Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => updateFormData('quantity', e.target.value)}
                  placeholder="จำนวนที่ต้องการ"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>
            </div>

            {/* Stock Preview */}
            {selectedProduct && formData.type && formData.quantity && (
              <div className="p-3 bg-white rounded-lg border border-green-200 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {isStockIn ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className="font-semibold text-gray-800 text-sm">
                      สต็อกหลังการแก้ไข:
                    </span>
                  </div>
                  <div className={`text-xs font-medium px-2 py-1 rounded ${
                    isStockIn 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {(newStock || 0).toLocaleString()}
                  </div>
                </div>
                {quantityDifference !== 0 && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded flex items-center">
                    <AlertCircle className="h-3 w-3 text-blue-600 mr-2" />
                    <span className="text-xs text-blue-700">
                      เปลี่ยนแปลง: {quantityDifference > 0 ? '+' : ''}{quantityDifference} หน่วย
                    </span>
                  </div>
                )}
                {newStock < 0 && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center">
                    <AlertCircle className="h-3 w-3 text-red-600 mr-2" />
                    <span className="text-xs text-red-700">
                      ⚠️ สต็อกไม่เพียงพอสำหรับการแก้ไขนี้
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Additional Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <FileText className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลเพิ่มเติม</h3>
            </div>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-slate-700 flex items-center">
                  <span className="text-red-500 mr-1">*</span>
                  เหตุผล
                </Label>
                <Select value={formData.reason} onValueChange={(value) => updateFormData('reason', value)}>
                  <SelectTrigger className="h-9 text-sm border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg">
                    <SelectValue placeholder="เลือกเหตุผลของการเคลื่อนไหว" />
                  </SelectTrigger>
                  <SelectContent className="relative z-50 rounded-lg border-2 border-slate-200 shadow-xl">
                    <SelectItem value="Purchase" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-2 h-3 w-3 text-green-600" />
                        <span>การสั่งซื้อ</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Return" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <ArrowUp className="mr-2 h-3 w-3 text-blue-600" />
                        <span>การคืนสินค้า</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Adjustment" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <Package className="mr-2 h-3 w-3 text-orange-600" />
                        <span>การปรับปรุงสต็อก</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Sale" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <ArrowDown className="mr-2 h-3 w-3 text-red-600" />
                        <span>การขาย</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Damaged" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <AlertCircle className="mr-2 h-3 w-3 text-red-600" />
                        <span>สินค้าเสียหาย</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Transfer" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <TrendingUp className="mr-2 h-3 w-3 text-indigo-600" />
                        <span>การโอนย้าย</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="Other" className="text-sm py-2 hover:bg-purple-50">
                      <div className="flex items-center">
                        <MessageSquare className="mr-2 h-3 w-3 text-gray-600" />
                        <span>อื่นๆ</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reference" className="text-xs font-semibold text-slate-700">
                  เลขที่อ้างอิง
                </Label>
                <Input
                  id="reference"
                  value={formData.reference}
                  onChange={(e) => updateFormData('reference', e.target.value)}
                  placeholder="เลขที่ใบสั่งซื้อ/ใบส่งของ/ใบเบิก"
                  className="h-9 text-sm border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">
                  หมายเหตุ
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => updateFormData('notes', e.target.value)}
                  placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับการเคลื่อนไหวนี้..."
                  rows={3}
                  className="text-sm border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg resize-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="relative z-10 flex justify-end space-x-3 pt-6 px-6 border-t border-pink-200/60 bg-gradient-to-r from-pink-50/95 to-white/95 backdrop-blur-sm">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                resetForm();
                onOpenChange(false);
              }}
              className="h-11 px-6 text-sm font-semibold border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 bg-white transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
            >
              ยกเลิก
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || newStock < 0}
              className="h-11 px-8 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl border-0"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  แก้ไขการเคลื่อนไหว
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}