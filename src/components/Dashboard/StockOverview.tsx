import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle,
  XCircle,
  Package
} from 'lucide-react';
import { formatNumber } from '@/lib/utils';

interface StockOverviewProps {
  stats: {
    totalProducts: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
}

export function StockOverview({ stats }: StockOverviewProps) {
  const warehouseUsage = stats.totalProducts > 0 
    ? Math.round(((stats.totalProducts - stats.outOfStockItems) / stats.totalProducts) * 100) 
    : 0;

  return (
    <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900">ภาพรวมสต็อก</CardTitle>
        <p className="text-sm text-gray-500">สถานะสินค้าในคลัง</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center p-3 rounded-xl bg-orange-50">
          <div className="w-10 h-10 rounded-lg bg-orange-200 text-orange-700 flex items-center justify-center flex-shrink-0 mr-3">
            <AlertCircle className="h-5 w-5" />
          </div>
          <span className="font-medium text-sm text-gray-900">สินค้าใกล้หมด</span>
          <Badge className="ml-auto bg-white border border-orange-200 text-orange-600">
            {formatNumber(stats.lowStockItems)}
          </Badge>
        </div>
        
        <div className="flex items-center p-3 rounded-xl bg-red-50">
          <div className="w-10 h-10 rounded-lg bg-red-200 text-red-700 flex items-center justify-center flex-shrink-0 mr-3">
            <XCircle className="h-5 w-5" />
          </div>
          <span className="font-medium text-sm text-gray-900">สินค้าไม่มีในสต็อก</span>
          <Badge className="ml-auto bg-white border border-red-200 text-red-600">
            {formatNumber(stats.outOfStockItems)}
          </Badge>
        </div>
        
        <div className="flex items-center p-3 rounded-xl bg-teal-50">
          <div className="w-10 h-10 rounded-lg bg-teal-200 text-teal-700 flex items-center justify-center flex-shrink-0 mr-3">
            <Package className="h-5 w-5" />
          </div>
          <span className="font-medium text-sm text-gray-900">สินค้าทั้งหมดในสต็อก</span>
          <Badge className="ml-auto bg-white border border-teal-200 text-teal-600">
            {formatNumber(stats.totalProducts)}
          </Badge>
        </div>
        
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-900">พื้นที่ใช้งานในคลัง</span>
            <span className="text-sm font-bold text-purple-600">
              {warehouseUsage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2.5 rounded-full transition-all duration-1000" 
              style={{ width: `${warehouseUsage}%` }}
            ></div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}