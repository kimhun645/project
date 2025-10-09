import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, LogOut } from 'lucide-react';
import { sessionManager } from '@/lib/sessionManager';

interface SessionWarningDialogProps {
  isOpen: boolean;
  onExtend: () => void;
  onLogout: () => void;
  timeRemaining: number;
}

export function SessionWarningDialog({ 
  isOpen, 
  onExtend, 
  onLogout, 
  timeRemaining 
}: SessionWarningDialogProps) {
  const [timeLeft, setTimeLeft] = useState(timeRemaining);
  const [isExtending, setIsExtending] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      const remaining = sessionManager.getTimeUntilTimeout();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        onLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onLogout]);

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleExtend = async () => {
    setIsExtending(true);
    try {
      sessionManager.extendSession();
      onExtend();
    } catch (error) {
      console.error('Error extending session:', error);
    } finally {
      setIsExtending(false);
    }
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px] w-[95vw] max-h-[85vh]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            <DialogTitle>เซสชันจะหมดอายุ</DialogTitle>
          </div>
          <DialogDescription>
            เซสชันของคุณจะหมดอายุในอีก{' '}
            <span className="font-mono font-bold text-amber-600">
              {formatTime(timeLeft)}
            </span>
            {' '}นาที
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
            <Clock className="h-5 w-5 text-amber-600" />
            <div className="flex-1">
              <p className="text-sm text-amber-800">
                ระบบจะออกจากระบบโดยอัตโนมัติหากไม่มีการใช้งาน
              </p>
              <p className="text-xs text-amber-600 mt-1">
                คลิก "ขยายเซสชัน" เพื่อใช้งานต่อ
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full sm:w-auto"
          >
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
          <Button
            onClick={handleExtend}
            disabled={isExtending}
            className="w-full sm:w-auto"
          >
            {isExtending ? 'กำลังขยาย...' : 'ขยายเซสชัน'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
