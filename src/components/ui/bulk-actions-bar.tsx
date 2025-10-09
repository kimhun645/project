import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckSquare, X, Copy, Download, Trash2 } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onCopy?: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  className?: string;
}

export function BulkActionsBar({ 
  selectedCount, 
  onClear, 
  onCopy, 
  onExport, 
  onDelete,
  className = '' 
}: BulkActionsBarProps) {
  if (selectedCount === 0) return null;

  return (
    <Card className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-1 transform mb-6 mx-6 sm:mx-8 lg:mx-12 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <CardContent className="p-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-orange-600" />
              <span className="text-lg font-semibold text-gray-700">
                เลือกแล้ว {selectedCount} รายการ
              </span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onClear}
              className="h-8 px-3 rounded-xl border-orange-200 hover:bg-orange-50 hover:border-orange-300"
            >
              <X className="h-4 w-4 mr-1" />
              ยกเลิก
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            {onCopy && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCopy}
                className="h-8 px-3 rounded-xl border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <Copy className="h-4 w-4 mr-1" />
                คัดลอก
              </Button>
            )}
            {onExport && (
              <Button
                variant="outline"
                size="sm"
                onClick={onExport}
                className="h-8 px-3 rounded-xl border-green-200 hover:bg-green-50 hover:border-green-300"
              >
                <Download className="h-4 w-4 mr-1" />
                ส่งออก
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={onDelete}
                className="h-8 px-3 rounded-xl"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                ลบทั้งหมด
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
