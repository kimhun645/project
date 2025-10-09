import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, BarChart3, AlertTriangle, Package, ArrowUp, ArrowDown, Activity } from 'lucide-react';

interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'green' | 'red' | 'blue' | 'orange' | 'teal' | 'purple';
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsCardsProps {
  cards: StatCard[];
  className?: string;
}

const colorConfig = {
  green: {
    bg: 'from-green-500/10 via-emerald-500/5 to-transparent',
    iconBg: 'from-green-500 to-emerald-600',
    shadow: 'shadow-green-500/20',
    text: 'text-green-500',
    badge: 'bg-green-50',
    icon: 'text-green-500'
  },
  red: {
    bg: 'from-red-500/10 via-pink-500/5 to-transparent',
    iconBg: 'from-red-500 to-pink-600',
    shadow: 'shadow-red-500/20',
    text: 'text-red-500',
    badge: 'bg-red-50',
    icon: 'text-red-500'
  },
  blue: {
    bg: 'from-blue-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'from-blue-500 to-indigo-600',
    shadow: 'shadow-blue-500/20',
    text: 'text-blue-500',
    badge: 'bg-blue-50',
    icon: 'text-blue-500'
  },
  orange: {
    bg: 'from-orange-500/10 via-amber-500/5 to-transparent',
    iconBg: 'from-orange-500 to-amber-600',
    shadow: 'shadow-orange-500/20',
    text: 'text-orange-500',
    badge: 'bg-orange-50',
    icon: 'text-orange-500'
  },
  teal: {
    bg: 'from-teal-500/10 via-cyan-500/5 to-transparent',
    iconBg: 'from-teal-500 to-cyan-600',
    shadow: 'shadow-teal-500/20',
    text: 'text-teal-500',
    badge: 'bg-teal-50',
    icon: 'text-teal-500'
  },
  purple: {
    bg: 'from-purple-500/10 via-indigo-500/5 to-transparent',
    iconBg: 'from-purple-500 to-indigo-600',
    shadow: 'shadow-purple-500/20',
    text: 'text-purple-500',
    badge: 'bg-purple-50',
    icon: 'text-purple-500'
  }
};

export function StatsCards({ cards, className = '' }: StatsCardsProps) {
  return (
    <section className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 px-6 sm:px-8 lg:px-12 ${className}`}>
      {cards.map((card, index) => {
        const config = colorConfig[card.color];
        
        return (
          <Card 
            key={index}
            className={`group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:${config.shadow} transition-all duration-500 hover:-translate-y-3 hover:scale-105 transform`}
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${config.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.iconBg.replace('500', '400').replace('600', '400')}/30 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500 blur-sm`}></div>
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${config.iconBg.replace('500', '300').replace('600', '300')}/20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-125 transition-transform duration-700 blur-md`}></div>
            
            <CardContent className="p-6 flex items-center gap-4 relative z-10">
              <div className={`relative p-4 bg-gradient-to-br ${config.iconBg} text-white rounded-2xl group-hover:scale-110 transition-all duration-300 shadow-lg ${config.shadow}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-2xl"></div>
                <div className="relative h-6 w-6 drop-shadow-lg">
                  {card.icon}
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl blur-sm"></div>
              </div>
              
              <div className="flex-1">
                <p className="text-sm text-gray-600 font-medium">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 drop-shadow-sm">
                  {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
                </p>
              </div>
              
              <div className={`text-sm font-semibold ${config.text} flex items-center ${config.badge} px-3 py-1 rounded-full`}>
                <TrendingUp className="h-4 w-4 mr-1" />
                {card.percentage || (card.value > 0 ? '100%' : '0%')}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}

// Predefined card configurations for common use cases
export const createProductStats = (data: {
  totalProducts: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
}) => [
  {
    title: 'สินค้าทั้งหมด',
    value: data.totalProducts,
    icon: <Package className="h-6 w-6" />,
    color: 'purple' as const,
    percentage: data.totalProducts > 0 ? '100%' : '0%'
  },
  {
    title: 'สต็อกต่ำ',
    value: data.lowStockProducts,
    icon: <AlertTriangle className="h-6 w-6" />,
    color: 'orange' as const,
    percentage: data.totalProducts > 0 ? Math.round((data.lowStockProducts / data.totalProducts) * 100) + '%' : '0%'
  },
  {
    title: 'หมดสต็อก',
    value: data.outOfStockProducts,
    icon: <TrendingUp className="h-6 w-6" />,
    color: 'red' as const,
    percentage: data.totalProducts > 0 ? Math.round((data.outOfStockProducts / data.totalProducts) * 100) + '%' : '0%'
  },
  {
    title: 'มูลค่ารวม',
    value: `฿${data.totalValue.toLocaleString()}`,
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'teal' as const,
    percentage: data.totalValue > 0 ? '100%' : '0%'
  }
];

export const createMovementStats = (data: {
  todayStockIn: number;
  todayStockOut: number;
  totalMovements: number;
  netMovement: number;
}) => [
  {
    title: 'รับเข้าวันนี้',
    value: data.todayStockIn,
    icon: <ArrowUp className="h-6 w-6" />,
    color: 'green' as const,
    percentage: data.todayStockIn > 0 ? '100%' : '0%'
  },
  {
    title: 'เบิกออกวันนี้',
    value: data.todayStockOut,
    icon: <ArrowDown className="h-6 w-6" />,
    color: 'red' as const,
    percentage: data.todayStockOut > 0 ? '100%' : '0%'
  },
  {
    title: 'รายการทั้งหมด',
    value: data.totalMovements,
    icon: <Package className="h-6 w-6" />,
    color: 'blue' as const,
    percentage: data.totalMovements > 0 ? '100%' : '0%'
  },
  {
    title: 'ยอดสุทธิ',
    value: data.netMovement,
    icon: <BarChart3 className="h-6 w-6" />,
    color: 'teal' as const,
    percentage: data.netMovement > 0 ? '+' : '' + (data.netMovement > 0 ? '100%' : '0%')
  }
];
