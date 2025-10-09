import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus,
  ArrowRight,
  Package,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentActivity {
  id: string;
  type: 'add' | 'update' | 'alert' | 'movement';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info';
  productName?: string;
  quantity?: number;
}

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  const navigate = useNavigate();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'add':
        return (
          <div className="relative p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg shadow-green-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <CheckCircle className="relative h-5 w-5 text-white drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
          </div>
        );
      case 'update':
        return (
          <div className="relative p-2 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-xl shadow-lg shadow-yellow-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <AlertTriangle className="relative h-5 w-5 text-white drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
          </div>
        );
      case 'alert':
        return (
          <div className="relative p-2 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg shadow-red-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <AlertTriangle className="relative h-5 w-5 text-white drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
          </div>
        );
      case 'movement':
        return (
          <div className="relative p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <Info className="relative h-5 w-5 text-white drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
          </div>
        );
      default:
        return (
          <div className="relative p-2 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl shadow-lg shadow-gray-500/30">
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-xl"></div>
            <Info className="relative h-5 w-5 text-white drop-shadow-lg" />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-xl blur-sm"></div>
          </div>
        );
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getButtonColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 border-green-200 hover:bg-green-50';
      case 'warning':
        return 'text-yellow-600 border-yellow-200 hover:bg-yellow-50';
      case 'info':
        return 'text-blue-600 border-blue-200 hover:bg-blue-50';
      default:
        return 'text-gray-600 border-gray-200 hover:bg-gray-50';
    }
  };

  return (
    <Card className="lg:col-span-2 group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-2xl hover:shadow-blue-500/20 transition-all duration-500 hover:-translate-y-1 transform">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-indigo-500/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      <CardHeader className="pb-4 relative z-10">
        <CardTitle className="text-lg font-bold text-gray-900 drop-shadow-sm">กิจกรรมล่าสุด</CardTitle>
        <p className="text-sm text-gray-600 font-medium">การเคลื่อนไหวล่าสุดในระบบของคุณ</p>
      </CardHeader>
      <CardContent className="space-y-4 relative z-10">
        {activities.length > 0 ? activities.map((activity) => (
          <div 
            key={activity.id} 
            className={`group/item flex items-start gap-4 p-4 rounded-xl border backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 transform ${getStatusColor(activity.status)}`}
          >
            <div className="flex-shrink-0 mt-1">
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900 text-sm">{activity.title}</h4>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
              <p className="text-sm text-gray-600 whitespace-pre-line mb-3">{activity.description}</p>
              <Button 
                size="sm" 
                variant="outline"
                className={`text-xs ${getButtonColor(activity.status)}`}
              >
                ดูรายละเอียด
              </Button>
            </div>
          </div>
        )) : (
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>ยังไม่มีกิจกรรมล่าสุด</p>
            <p className="text-sm">การเคลื่อนไหวสต็อกจะแสดงที่นี่</p>
          </div>
        )}
        
        <div className="flex gap-3 mt-6">
          <Button 
            onClick={() => navigate('/products')}
            className="flex-1 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="h-4 w-4 mr-2" />
            เพิ่มสินค้า
          </Button>
          <Button 
            onClick={() => navigate('/movements')}
            className="flex-1 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            ดูประวัติ <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
