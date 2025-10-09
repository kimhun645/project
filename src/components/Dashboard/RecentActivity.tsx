import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useStock } from '@/contexts/StockContext';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ArrowRight,
  Activity
} from 'lucide-react';

interface Movement {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  created_at: string;
  created_by?: string;
}

interface RecentActivityProps {
  movements: Movement[];
}

export function RecentActivity({ movements }: RecentActivityProps) {
  const { products } = useStock();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'วันนี้';
    } else if (diffDays === 2) {
      return 'เมื่อวาน';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} วันที่แล้ว`;
    } else {
      return date.toLocaleDateString('th-TH', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product?.name || 'สินค้าไม่ทราบ';
  };

  const getMovementIcon = (type: 'in' | 'out') => {
    if (type === 'in') {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
  };

  const getMovementColor = (type: 'in' | 'out') => {
    if (type === 'in') {
      return 'bg-green-100 text-green-800 border-green-200';
    } else {
      return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getMovementText = (type: 'in' | 'out') => {
    if (type === 'in') {
      return 'รับเข้า';
    } else {
      return 'จ่ายออก';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full translate-y-40 -translate-x-40 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-purple-200 rounded-full -translate-x-24 -translate-y-24 blur-2xl"></div>
      </div>
      
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
        <CardTitle className="text-lg sm:text-xl font-bold text-blue-800 flex items-center">
          <Activity className="h-6 w-6 mr-3 text-blue-600" />
          กิจกรรมล่าสุด
        </CardTitle>
        <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 border-2 border-blue-300 font-bold px-3 py-1">
          {movements.length} รายการ
        </Badge>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="space-y-4">
          {movements.length > 0 ? (
            movements.map((movement, index) => (
              <div key={movement.id} className="relative">
                {/* Timeline connector */}
                {index < movements.length - 1 && (
                  <div className="absolute left-6 top-8 w-0.5 h-12 bg-blue-200"></div>
                )}
                
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-full border-2 ${getMovementColor(movement.type)}`}>
                      {getMovementIcon(movement.type)}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-base font-semibold text-gray-800 truncate">
                        {getProductName(movement.product_id)}
                      </p>
                      <Badge 
                        variant="secondary" 
                        className={`text-sm font-bold px-3 py-1 border-2 ${getMovementColor(movement.type)}`}
                      >
                        {getMovementText(movement.type)}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-gray-600 font-medium">
                        จำนวน: <span className="font-bold">{(movement.quantity || 0).toLocaleString('th-TH')}</span>
                      </p>
                      <p className="text-sm text-gray-500 flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        {formatTime(movement.created_at)}
                      </p>
                    </div>
                    
                    {movement.reason && (
                      <p className="text-sm text-gray-600 mb-3 font-medium">
                        เหตุผล: {movement.reason}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500 font-medium">
                        {formatDate(movement.created_at)}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 text-sm text-blue-700 hover:text-blue-800 border-2 border-blue-300 hover:bg-blue-50 font-medium"
                        asChild
                      >
                        <Link to={`/movements?id=${movement.id}`}>
                          ดูรายละเอียด
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <Package className="h-16 w-16 text-blue-300 mx-auto mb-4" />
              <p className="text-base text-gray-600 font-medium mb-2">ยังไม่มีกิจกรรมล่าสุด</p>
              <p className="text-sm text-gray-500">การเคลื่อนไหวของสต็อกจะแสดงที่นี่</p>
            </div>
          )}
        </div>
        
        {/* View All Button */}
        {movements.length > 0 && (
          <div className="text-center pt-6 border-t border-blue-200">
            <Button variant="outline" size="sm" asChild className="border-2 border-blue-300 hover:bg-blue-50 text-blue-700 font-medium">
              <Link to="/movements">
                ดูการเคลื่อนไหวทั้งหมด
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
