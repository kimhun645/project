import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus,
  RotateCcw,
  ArrowRight,
  BarChart3,
  Package,
  AlertCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw
} from 'lucide-react';
import { useStock } from '@/contexts/StockContext';
import { useAuth } from '@/contexts/AuthContext';
import { api, type Product, type Movement } from '@/lib/apiService';
import { DashboardHeader } from '@/components/Layout/DashboardHeader';
import { StatsCards } from '@/components/Dashboard/StatsCards';
import { RecentActivities } from '@/components/Dashboard/RecentActivities';
import { StockOverview } from '@/components/Dashboard/StockOverview';
import { CategoryDistribution } from '@/components/Dashboard/CategoryDistribution';

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

interface CategoryDistribution {
  name: string;
  percentage: number;
  color: string;
  count: number;
  value: number;
}

export function TemplateDashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [categoryDistribution, setCategoryDistribution] = useState<CategoryDistribution[]>([]);
  
  const { 
    products, 
    movements, 
    categories, 
    stats, 
    loading: stockLoading,
    refreshData 
  } = useStock();
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Refresh data from context
      await refreshData();
      
      // Process recent activities from movements
      const recentMovements = movements
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5);
      
      const activities: RecentActivity[] = recentMovements.map((movement, index) => {
        const product = products.find(p => p.id === movement.product_id);
        const timeAgo = getTimeAgo(new Date(movement.created_at));
        
        return {
          id: movement.id,
          type: movement.type === 'IN' ? 'add' : movement.type === 'OUT' ? 'update' : 'movement',
          title: movement.type === 'IN' ? 'เพิ่มสินค้าเข้า' : 
                 movement.type === 'OUT' ? 'เบิกสินค้าออก' : 'ปรับปรุงสต็อก',
          description: `สินค้า: ${product?.name || 'ไม่ทราบ'}\nจำนวน: ${movement.quantity > 0 ? '+' : ''}${movement.quantity}\nเหตุผล: ${movement.reason}`,
          time: timeAgo,
          status: movement.type === 'IN' ? 'success' : movement.type === 'OUT' ? 'warning' : 'info',
          productName: product?.name,
          quantity: movement.quantity
        };
      });
      
      setRecentActivities(activities);
      
      // Calculate category distribution
      const categoryStats = categories.map(category => {
        const categoryProducts = products.filter(p => p.category === category.name);
        const count = categoryProducts.length;
        const value = categoryProducts.reduce((sum, p) => sum + (p.current_stock * p.unit_price), 0);
        const percentage = products.length > 0 ? Math.round((count / products.length) * 100) : 0;
        
        return {
          name: category.name,
          percentage,
          color: category.color || getRandomColor(),
          count,
          value
        };
      }).sort((a, b) => b.count - a.count);
      
      setCategoryDistribution(categoryStats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'เมื่อสักครู่';
    if (diffInMinutes < 60) return `${diffInMinutes} นาทีที่แล้ว`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} ชั่วโมงที่แล้ว`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'เมื่อวาน';
    if (diffInDays < 7) return `${diffInDays} วันที่แล้ว`;
    
    return date.toLocaleDateString('th-TH');
  };

  const getRandomColor = (): string => {
    const colors = ['purple', 'pink', 'teal', 'blue', 'green', 'orange', 'red', 'indigo'];
    return colors[Math.floor(Math.random() * colors.length)];
  };


  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);



  if (loading || stockLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-700">กำลังโหลดข้อมูล...</p>
            <p className="text-sm text-gray-500">กรุณารอสักครู่</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      
      {/* Header */}
      <DashboardHeader 
        onRefresh={fetchDashboardData}
        loading={loading}
      />

      {/* Stats Cards */}
      <StatsCards 
        stats={stats}
        products={products}
      />

      {/* Main Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Recent Activities */}
        <RecentActivities activities={recentActivities} />

        {/* Stock Overview */}
        <StockOverview stats={stats} />
      </section>

      {/* Second Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Category Distribution */}
        <CategoryDistribution 
          categoryDistribution={categoryDistribution}
          totalProducts={stats.totalProducts}
        />

        {/* Movement Chart */}
        <Card className="lg:col-span-2 group relative overflow-hidden backdrop-blur-lg border-0 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500">
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-bold text-gray-900">กราฟการณ์เคลื่อนไหว</CardTitle>
                <p className="text-sm text-gray-500">แสดงการเคลื่อนไหวล่าสุดใน 30 วันที่ผ่านมา</p>
              </div>
              <div className="flex space-x-2">
                <Button size="sm" className="px-3 py-1.5 text-sm rounded-xl bg-purple-100 text-purple-600 font-medium">
                  วัน
                </Button>
                <Button variant="outline" size="sm" className="px-3 py-1.5 text-sm rounded-xl">
                  สัปดาห์
                </Button>
                <Button variant="outline" size="sm" className="px-3 py-1.5 text-sm rounded-xl">
                  เดือน
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mt-4 h-64 w-full bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <p className="text-gray-600 font-medium">กราฟการเคลื่อนไหว</p>
                <p className="text-sm text-gray-500">ข้อมูลจะแสดงที่นี่</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <div className="mt-12 text-center">
        <div className="inline-flex items-center space-x-2 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">
            อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}
          </span>
        </div>
      </div>
    </div>
  );
}
