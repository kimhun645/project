import React from 'react';
import { Badge } from '@/components/ui/badge';
import { QrCode } from 'lucide-react';

interface BarcodeScannerIndicatorProps {
  isDetected: boolean;
  className?: string;
}

export function BarcodeScannerIndicator({ isDetected, className = '' }: BarcodeScannerIndicatorProps) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-300 ${
      isDetected 
        ? 'bg-green-50 border-green-200 text-green-800' 
        : 'bg-red-50 border-red-200 text-red-800'
    } ${className}`}>
      <div className={`h-2 w-2 rounded-full ${isDetected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
      <QrCode className={`h-4 w-4 ${isDetected ? 'text-green-600' : 'text-red-600'}`} />
      <span className="text-sm font-medium">
        {isDetected ? 'เครื่องสแกนเชื่อมต่อ' : 'รอการเชื่อมต่อเครื่องสแกน'}
      </span>
    </div>
  );
}
