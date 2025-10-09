import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { 
  FileText,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  XCircle
} from 'lucide-react';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface StatsCardsProps {
  stats: {
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
  };
  products: any[];
}

export function StatsCards({ stats, products }: StatsCardsProps) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Card 1 - Total Products */}
      <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-purple-500/20 transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-indigo-400/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-300/20 to-indigo-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
        <CardContent className="p-6 flex items-center gap-4 relative z-10">
          <div className="relative p-4 bg-gradient-to-br from-purple-500 to-indigo-600 text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg shadow-purple-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <FileText className="relative h-6 w-6 drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">สินค้าทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">{formatNumber(stats.totalProducts)}</p>
          </div>
          <div className="text-sm font-semibold text-green-500 flex items-center bg-green-50 px-3 py-1 rounded-full">
            <TrendingUp className="h-4 w-4 mr-1" />
            {products.length > 0 ? Math.round((stats.totalProducts / products.length) * 100) : 0}%
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Total Value */}
      <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-teal-500/20 transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-300/20 to-cyan-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
        <CardContent className="p-6 flex items-center gap-4 relative z-10">
          <div className="relative p-4 bg-gradient-to-br from-teal-500 to-cyan-600 text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg shadow-teal-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <DollarSign className="relative h-6 w-6 drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">มูลค่าทั้งหมด</p>
            <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">{formatCurrency(stats.totalValue)}</p>
          </div>
          <div className="text-sm font-semibold text-green-500 flex items-center bg-green-50 px-3 py-1 rounded-full">
            <TrendingUp className="h-4 w-4 mr-1" />
            {stats.totalValue > 0 ? '100%' : '0%'}
          </div>
        </CardContent>
      </Card>

      {/* Card 3 - Low Stock Alerts */}
      <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-orange-500/20 transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-amber-400/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
        <CardContent className="p-6 flex items-center gap-4 relative z-10">
          <div className="relative p-4 bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg shadow-orange-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <AlertTriangle className="relative h-6 w-6 drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">สินค้าใกล้หมด</p>
            <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">{formatNumber(stats.lowStockItems)}</p>
          </div>
          <div className="text-sm font-semibold text-orange-500 flex items-center bg-orange-50 px-3 py-1 rounded-full">
            <AlertTriangle className="h-4 w-4 mr-1" />
            {stats.totalProducts > 0 ? Math.round((stats.lowStockItems / stats.totalProducts) * 100) : 0}%
          </div>
        </CardContent>
      </Card>

      {/* Card 4 - Out of Stock */}
      <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-red-500/20 transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-pink-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/30 to-pink-400/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-300/20 to-pink-300/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md"></div>
        <CardContent className="p-6 flex items-center gap-4 relative z-10">
          <div className="relative p-4 bg-gradient-to-br from-red-500 to-pink-600 text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg shadow-red-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
            <XCircle className="relative h-6 w-6 drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 font-medium">สินค้าหมด</p>
            <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">{formatNumber(stats.outOfStockItems)}</p>
          </div>
          <div className="text-sm font-semibold text-red-500 flex items-center bg-red-50 px-3 py-1 rounded-full">
            <XCircle className="h-4 w-4 mr-1" />
            {stats.totalProducts > 0 ? Math.round((stats.outOfStockItems / stats.totalProducts) * 100) : 0}%
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
