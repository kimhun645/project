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
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, 
  X, 
  Building2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  User,
  MessageSquare,
  Edit
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { api, Supplier } from '@/lib/apiService';

interface EditSupplierDialogProps {
  supplier: Supplier | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSupplierUpdated: () => void;
}

export function EditSupplierDialog({ supplier, open, onOpenChange, onSupplierUpdated }: EditSupplierDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  const resetForm = () => {
    setFormData({
      name: '',
      contact_person: '',
      email: '',
      phone: '',
      address: '',
      notes: ''
    });
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    if (open && supplier) {
      setFormData({
        name: supplier.name || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        notes: supplier.notes || ''
      });
    }
  }, [open, supplier]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplier?.id) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลผู้จำหน่ายที่ต้องการแก้ไข",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        description: "กรุณาระบุชื่อผู้จำหน่าย",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      await FirestoreService.updateSupplier(supplier.id, {
        name: formData.name.trim(),
        contact_person: formData.contact_person.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        notes: formData.notes.trim() || undefined
      });

      toast({
        title: "แก้ไขผู้จำหน่ายเรียบร้อย",
        description: `แก้ไขผู้จำหน่าย ${formData.name} เรียบร้อยแล้ว`,
      });

      resetForm();
      onOpenChange(false);
      onSupplierUpdated();

    } catch (error) {
      console.error('Error updating supplier:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถแก้ไขผู้จำหน่ายได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!supplier) return null;

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
                  แก้ไขผู้จำหน่าย
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-600 font-medium mt-1">
                  แก้ไขข้อมูลผู้จำหน่ายในระบบ
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
                <Building2 className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลพื้นฐาน</h3>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-700 flex items-center">
                <span className="text-red-500 mr-1">*</span>
                ชื่อผู้จำหน่าย
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData('name', e.target.value)}
                placeholder="กรอกชื่อผู้จำหน่าย"
                className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="contact_person" className="text-xs font-semibold text-slate-700">ชื่อผู้ติดต่อ</Label>
              <Input
                id="contact_person"
                value={formData.contact_person}
                onChange={(e) => updateFormData('contact_person', e.target.value)}
                placeholder="กรอกชื่อผู้ติดต่อ"
                className="h-9 text-sm border-2 border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg"
              />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg">
                <Mail className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลการติดต่อ</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-slate-700">อีเมล</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormData('email', e.target.value)}
                    placeholder="example@company.com"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-8"
                  />
                  <Mail className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-500" />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-700">เบอร์โทรศัพท์</Label>
                <div className="relative">
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => updateFormData('phone', e.target.value)}
                    placeholder="02-123-4567"
                    className="h-9 text-sm border-2 border-slate-200 focus:border-green-500 focus:ring-2 focus:ring-green-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg pl-8"
                  />
                  <Phone className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-slate-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Address Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-orange-500 to-red-600 rounded-lg">
                <MapPin className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ที่อยู่</h3>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-700">ที่อยู่ผู้จำหน่าย</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => updateFormData('address', e.target.value)}
                placeholder="กรอกที่อยู่ผู้จำหน่าย"
                className="min-h-[80px] text-sm border-2 border-slate-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg resize-none"
              />
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <div className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                <MessageSquare className="h-3 w-3 text-white" />
              </div>
              <h3 className="text-base font-semibold text-slate-800">ข้อมูลเพิ่มเติม</h3>
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs font-semibold text-slate-700">หมายเหตุ</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="หมายเหตุเพิ่มเติมเกี่ยวกับผู้จำหน่ายนี้..."
                className="min-h-[60px] text-sm border-2 border-slate-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow-md rounded-lg resize-none"
              />
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
              disabled={isLoading}
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
                  แก้ไขผู้จำหน่าย
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}