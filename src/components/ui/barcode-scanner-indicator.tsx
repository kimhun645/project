import React from 'react';
import { Badge } from '@/components/ui/badge';
import { QrCode } from 'lucide-react';

interface BarcodeScannerIndicatorProps {
  isDetected: boolean;
  className?: string;
}

export function BarcodeScannerIndicator({ isDetected, className = '' }: BarcodeScannerIndicatorProps) {
  return (
    <Badge 
      variant={isDetected ? 'default' : 'secondary'}
      className={`flex items-center gap-1 text-xs ${className}`}
    >
      <QrCode className={`h-3 w-3 ${isDetected ? 'text-green-600' : 'text-red-600'}`} />
      {isDetected ? 'เชื่อมต่อ' : 'ยังไม่ได้เชื่อมต่อ'}
    </Badge>
  );
}
