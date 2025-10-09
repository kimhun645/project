import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface DeleteConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title: string;
  description: string;
  itemName?: string;
  className?: string;
}

export function DeleteConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  className = ""
}: DeleteConfirmationDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className={`bg-gradient-to-br from-white to-red-50 shadow-2xl border-0 rounded-2xl backdrop-blur-lg ${className}`}>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-bold text-red-800">
            {title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            {itemName ? (
              <>
                คุณแน่ใจหรือไม่ที่จะลบ{itemName}? 
                <br />
                <span className="text-destructive font-medium">
                  การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </span>
              </>
            ) : (
              description
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-2 border-red-200 hover:bg-red-50 rounded-2xl transition-all duration-300 hover:scale-105 transform">
            ยกเลิก
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white font-bold rounded-2xl transition-all duration-300 hover:scale-105 transform shadow-lg hover:shadow-red-500/30"
          >
            ยืนยันการลบ
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
