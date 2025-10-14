import React, { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/lib/userService';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const validateForm = () => {
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'กรุณาใส่รหัสผ่านปัจจุบัน';
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'กรุณาใส่รหัสผ่านใหม่';
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'กรุณายืนยันรหัสผ่านใหม่';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'รหัสผ่านใหม่ไม่ตรงกัน';
    }

    if (formData.currentPassword === formData.newPassword) {
      newErrors.newPassword = 'รหัสผ่านใหม่ต้องแตกต่างจากรหัสผ่านปัจจุบัน';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some(error => error !== '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    
    try {
      await userService.changePassword(formData.currentPassword, formData.newPassword);
      
      toast({
        title: "เปลี่ยนรหัสผ่านสำเร็จ",
        description: "รหัสผ่านของคุณได้รับการอัปเดตเรียบร้อยแล้ว",
        variant: "default"
      });
      
      // Reset form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      onOpenChange(false);
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      let errorMessage = 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน';
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'รหัสผ่านปัจจุบันไม่ถูกต้อง';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'รหัสผ่านใหม่ไม่แข็งแรงพอ';
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'กรุณาเข้าสู่ระบบใหม่ก่อนเปลี่ยนรหัสผ่าน';
      }
      
      toast({
        title: "เปลี่ยนรหัสผ่านไม่สำเร็จ",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="เปลี่ยนรหัสผ่าน"
      description="กรุณาใส่ข้อมูลเพื่อเปลี่ยนรหัสผ่านของคุณ"
      variant="professional"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Password */}
        <div className="space-y-2">
          <Label htmlFor="currentPassword" className="text-sm font-semibold text-gray-700">
            รหัสผ่านปัจจุบัน
          </Label>
          <div className="relative">
            <Input
              id="currentPassword"
              type={showCurrentPassword ? "text" : "password"}
              value={formData.currentPassword}
              onChange={(e) => handleInputChange('currentPassword', e.target.value)}
              placeholder="ใส่รหัสผ่านปัจจุบัน"
              className={`h-11 px-4 pr-12 text-sm border-2 rounded-xl transition-all duration-200 ${
                errors.currentPassword 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.currentPassword && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errors.currentPassword}
            </div>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-2">
          <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
            รหัสผ่านใหม่
          </Label>
          <div className="relative">
            <Input
              id="newPassword"
              type={showNewPassword ? "text" : "password"}
              value={formData.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="ใส่รหัสผ่านใหม่"
              className={`h-11 px-4 pr-12 text-sm border-2 rounded-xl transition-all duration-200 ${
                errors.newPassword 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errors.newPassword}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
            ยืนยันรหัสผ่านใหม่
          </Label>
          <div className="relative">
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="ยืนยันรหัสผ่านใหม่"
              className={`h-11 px-4 pr-12 text-sm border-2 rounded-xl transition-all duration-200 ${
                errors.confirmPassword 
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-200'
              }`}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              {errors.confirmPassword}
            </div>
          )}
        </div>

        {/* Password Requirements */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Lock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">ข้อกำหนดรหัสผ่าน:</p>
              <ul className="space-y-1 text-xs">
                <li>• ต้องมีอย่างน้อย 6 ตัวอักษร</li>
                <li>• ต้องแตกต่างจากรหัสผ่านปัจจุบัน</li>
                <li>• แนะนำให้ใช้ตัวอักษร ตัวเลข และสัญลักษณ์</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="h-11 px-6 text-sm font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 bg-white transition-all duration-200 shadow-sm hover:shadow-md rounded-xl"
            disabled={isLoading}
          >
            ยกเลิก
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 px-8 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-200 rounded-xl border-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                กำลังเปลี่ยนรหัสผ่าน...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                เปลี่ยนรหัสผ่าน
              </>
            )}
          </Button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
