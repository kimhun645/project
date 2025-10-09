import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

interface CategoryDistribution {
  name: string;
  percentage: number;
  color: string;
  count: number;
  value: number;
}

interface CategoryDistributionProps {
  categoryDistribution: CategoryDistribution[];
  totalProducts: number;
}

export function CategoryDistribution({ categoryDistribution, totalProducts }: CategoryDistributionProps) {
  return (
    <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold text-gray-900">การกระจายหมวดหมู่</CardTitle>
        <p className="text-sm text-gray-500">สัดส่วนสินค้าในแต่ละหมวดหมู่</p>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center my-6">
          <div className="relative">
            <div className="w-40 h-40 rounded-full bg-gradient-to-r from-purple-500/10 to-indigo-500/10 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-500/30 to-indigo-500/30 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-gray-900">{formatNumber(totalProducts)}</span>
                  <span className="text-xs text-gray-500">สินค้า</span>
                </div>
              </div>
            </div>
            
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-4 border-purple-500 border-t-transparent border-r-transparent transform rotate-45"></div>
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-4 border-pink-500 border-b-transparent border-l-transparent transform rotate-45" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 0, 50% 0)' }}></div>
            <div className="absolute top-0 left-0 w-40 h-40 rounded-full border-4 border-teal-500 border-t-transparent border-l-transparent transform rotate-45" style={{ clipPath: 'polygon(50% 50%, 100% 100%, 50% 100%)' }}></div>
          </div>
        </div>
        
        <div className="space-y-3 text-sm">
          {categoryDistribution && categoryDistribution.length > 0 ? categoryDistribution.map((category, index) => (
            <div key={index} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  category.color === 'purple' ? 'bg-purple-500' :
                  category.color === 'pink' ? 'bg-pink-500' :
                  category.color === 'teal' ? 'bg-teal-500' :
                  category.color === 'blue' ? 'bg-blue-500' :
                  category.color === 'green' ? 'bg-green-500' :
                  category.color === 'orange' ? 'bg-orange-500' :
                  category.color === 'red' ? 'bg-red-500' :
                  'bg-indigo-500'
                }`}></span>
                <span className="text-gray-900">{category.name}</span>
              </div>
              <div className="text-right">
                <span className="font-semibold text-gray-900">{category.percentage}%</span>
                <div className="text-xs text-gray-500">{formatNumber(category.count)} รายการ</div>
              </div>
            </div>
          )) : (
            <div className="text-center py-4 text-gray-500">
              <p>ยังไม่มีหมวดหมู่สินค้า</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}