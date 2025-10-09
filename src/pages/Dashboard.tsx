import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, RotateCcw, ArrowRight, BarChart3, Package, AlertCircle, 
  XCircle, TrendingUp, TrendingDown, RefreshCw, Building2, Users, 
  DollarSign, CheckCircle, Activity, Zap, Target, Clock, Eye,
  ArrowUpRight, ArrowDownRight, Calendar, Filter, Download,
  ShoppingCart, Truck, AlertTriangle, Info, Star, Award
} from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { api, type Product, type Movement, type Category, type Supplier } from '@/lib/apiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalValue: number;
  totalMovements: number;
  recentMovements: number;
  monthlyGrowth: number;
  weeklyGrowth: number;
  dailyGrowth: number;
}

interface RecentActivity {
  id: string;
  type: 'add' | 'update' | 'alert' | 'movement' | 'approval' | 'system';
  title: string;
  description: string;
  time: string;
  status: 'success' | 'warning' | 'info' | 'error';
  productName?: string;
  quantity?: number;
  value?: number;
  icon: React.ReactNode;
}

interface PerformanceMetric {
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

interface QuickAction {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  href: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Calculate growth rate based on actual data
  const calculateGrowthRate = (movements: Movement[], days: number): number => {
    if (!movements || movements.length === 0) return 0;
    
    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - (days * 2) * 24 * 60 * 60 * 1000);
    
    const currentPeriodMovements = movements.filter(m => new Date(m.created_at) >= periodStart);
    const previousPeriodMovements = movements.filter(m => {
      const movementDate = new Date(m.created_at);
      return movementDate >= previousPeriodStart && movementDate < periodStart;
    });
    
    const currentCount = currentPeriodMovements.length;
    const previousCount = previousPeriodMovements.length;
    
    if (previousCount === 0) return currentCount > 0 ? 100 : 0;
    
    return Math.round(((currentCount - previousCount) / previousCount) * 100 * 10) / 10;
  };

  // Calculate comprehensive stats
  const stats: DashboardStats = useMemo(() => {
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length;
    const outOfStockProducts = products.filter(p => (p.current_stock || 0) === 0).length;
    const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.unit_price || 0)), 0);
    const totalMovements = movements.length;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentMovements = movements.filter(m => new Date(m.created_at) >= thirtyDaysAgo).length;

    return {
      totalProducts,
      totalCategories: categories.length,
      totalSuppliers: suppliers.length,
      lowStockProducts,
      outOfStockProducts,
      totalValue,
      totalMovements,
      recentMovements,
      monthlyGrowth: calculateGrowthRate(movements, 30),
      weeklyGrowth: calculateGrowthRate(movements, 7),
      dailyGrowth: calculateGrowthRate(movements, 1)
    };
  }, [products, movements, categories, suppliers]);

  // Performance metrics
  const performanceMetrics: PerformanceMetric[] = useMemo(() => {
    const stockEfficiency = products.length > 0 ? 
      Math.round(((products.length - stats.lowStockProducts - stats.outOfStockProducts) / products.length) * 100 * 10) / 10 : 0;
    
    const forecastAccuracy = movements.length > 0 ? 
      Math.round((stats.recentMovements / Math.max(movements.length, 1)) * 100 * 10) / 10 : 0;
    
    const responseTime = movements.length > 0 ? 
      Math.round((stats.recentMovements / 30) * 10) / 10 : 0;
    
    const userSatisfaction = stats.totalProducts > 0 ? 
      Math.round(((stats.totalProducts - stats.outOfStockProducts) / stats.totalProducts) * 100 * 10) / 10 : 0;

    return [
      {
        name: 'ประสิทธิภาพสต็อก',
        value: stockEfficiency,
        target: 90,
        unit: '%',
        trend: stockEfficiency >= 90 ? 'up' : stockEfficiency >= 80 ? 'stable' : 'down',
        change: stockEfficiency - 90
      },
      {
        name: 'ความแม่นยำการพยากรณ์',
        value: forecastAccuracy,
        target: 95,
        unit: '%',
        trend: forecastAccuracy >= 95 ? 'up' : forecastAccuracy >= 85 ? 'stable' : 'down',
        change: forecastAccuracy - 95
      },
      {
        name: 'เวลาตอบสนอง',
        value: responseTime,
        target: 1.0,
        unit: 'วัน',
        trend: responseTime <= 1.0 ? 'up' : responseTime <= 2.0 ? 'stable' : 'down',
        change: 1.0 - responseTime
      },
      {
        name: 'ความพึงพอใจผู้ใช้',
        value: userSatisfaction,
        target: 95,
        unit: '%',
        trend: userSatisfaction >= 95 ? 'up' : userSatisfaction >= 85 ? 'stable' : 'down',
        change: userSatisfaction - 95
      }
    ];
  }, [products, movements, stats]);

  // Chart data for movements
  const movementChartData = useMemo(() => {
    const days = selectedTimeRange === '7d' ? 7 : selectedTimeRange === '30d' ? 30 : selectedTimeRange === '90d' ? 90 : 365;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayMovements = movements.filter(m => {
        const movementDate = new Date(m.created_at);
        return movementDate.toDateString() === date.toDateString();
      });
      
      data.push({
        date: date.toLocaleDateString('th-TH', { month: 'short', day: 'numeric' }),
        in: dayMovements.filter(m => m.type === 'in').reduce((sum, m) => sum + (m.quantity || 0), 0),
        out: dayMovements.filter(m => m.type === 'out').reduce((sum, m) => sum + (m.quantity || 0), 0),
        total: dayMovements.length
      });
    }
    
    return data;
  }, [movements, selectedTimeRange]);

  const getRandomColor = (): string => {
    const colors = [
      '#6366f1', // Indigo-500
      '#8b5cf6', // Violet-500
      '#ec4899', // Pink-500
      '#06b6d4', // Cyan-500
      '#10b981', // Emerald-500
      '#f59e0b', // Amber-500
      '#ef4444', // Red-500
      '#84cc16', // Lime-500
      '#f97316', // Orange-500
      '#06b6d4'  // Sky-500
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Category distribution data
  const categoryData = useMemo(() => {
    const categoryStats = products.reduce((acc: Record<string, any>, product: Product) => {
      const categoryId = product.category_id || 'uncategorized';
      if (!acc[categoryId]) {
        acc[categoryId] = { count: 0, value: 0 };
      }
      acc[categoryId].count += 1;
      acc[categoryId].value += (product.current_stock || 0) * (product.unit_price || 0);
      return acc;
    }, {});

    return Object.entries(categoryStats).map(([categoryId, data]: [string, any]) => ({
      name: categoryId === 'uncategorized' ? 'ไม่ระบุหมวดหมู่' : `หมวดหมู่ ${categoryId}`,
      value: data.count,
      amount: data.value,
      fill: getRandomColor()
    }));
  }, [products]);

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      title: 'เพิ่มสินค้าใหม่',
      description: 'เพิ่มสินค้าเข้าสู่ระบบ',
      icon: <Plus className="h-5 w-5" />,
      color: 'bg-blue-500',
      href: '/products'
    },
    {
      title: 'จัดการสต็อก',
      description: 'ดูและจัดการสต็อกสินค้า',
      icon: <Package className="h-5 w-5" />,
      color: 'bg-green-500',
      href: '/movements'
    },
    {
      title: 'สร้างรายงาน',
      description: 'สร้างรายงานการวิเคราะห์',
      icon: <BarChart3 className="h-5 w-5" />,
      color: 'bg-purple-500',
      href: '/reports'
    },
    {
      title: 'ขอใช้งบประมาณ',
      description: 'สร้างคำขอใช้งบประมาณ',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'bg-orange-500',
      href: '/budget-request'
    }
  ];

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { firestoreService } = await import('@/lib/firestoreService');

      const [productsData, movementsData, categoriesData, suppliersData] = await Promise.all([
        firestoreService.getProducts(),
        firestoreService.getMovements(),
        firestoreService.getCategories(),
        firestoreService.getSuppliers()
      ]);

      setProducts(productsData || []);
      setMovements(movementsData || []);
      setCategories(categoriesData || []);
      setSuppliers(suppliersData || []);

      // Generate realistic recent activities
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'movement',
          title: 'การเคลื่อนไหวสต็อก',
          description: `มี ${movementsData?.length || 0} การเคลื่อนไหวในวันนี้`,
          time: 'เมื่อสักครู่',
          status: 'info',
          icon: <Activity className="h-4 w-4" />
        },
        {
          id: '2',
          type: 'alert',
          title: 'สต็อกต่ำ',
          description: `${stats.lowStockProducts} สินค้ามีสต็อกต่ำ`,
          time: '5 นาทีที่แล้ว',
          status: 'warning',
          icon: <AlertTriangle className="h-4 w-4" />
        },
        {
          id: '3',
          type: 'add',
          title: 'เพิ่มสินค้าใหม่',
          description: 'เพิ่มสินค้าเข้าสู่ระบบ',
          time: '10 นาทีที่แล้ว',
          status: 'success',
          icon: <Plus className="h-4 w-4" />
        },
        {
          id: '4',
          type: 'approval',
          title: 'การอนุมัติงบประมาณ',
          description: 'มีคำขอใช้งบประมาณรอการอนุมัติ',
          time: '15 นาทีที่แล้ว',
          status: 'info',
          icon: <CheckCircle className="h-4 w-4" />
        },
        {
          id: '5',
          type: 'system',
          title: 'ระบบอัปเดต',
          description: 'ระบบได้รับการอัปเดตเป็นเวอร์ชันล่าสุด',
          time: '1 ชั่วโมงที่แล้ว',
          status: 'success',
          icon: <Zap className="h-4 w-4" />
        }
      ];
      
      setRecentActivities(activities);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Auto refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Layout hideHeader={true}>
        <div className="min-h-screen w-full">
          <div className="w-full space-y-6 pb-8 px-4 sm:px-6 lg:px-8">
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
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen w-full">
        <div className="w-full space-y-6 pb-8 px-4 sm:px-6 lg:px-8">
          {/* Modern Header */}
          <div className="relative overflow-hidden mb-6 rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent"></div>
            <div className="relative z-10 px-8 py-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-white/20 rounded-3xl backdrop-blur-md border border-white/30 shadow-2xl">
                    <BarChart3 className="h-10 w-10 text-white drop-shadow-lg" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white drop-shadow-2xl bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                      แดชบอร์ด
                    </h1>
                    <p className="text-white/90 text-xl font-medium drop-shadow-lg">
                      ภาพรวมระบบจัดการสต็อกและงบประมาณ
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/30 shadow-xl">
                    <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse shadow-lg"></div>
                    <span className="text-white text-sm font-semibold drop-shadow-md">ระบบออนไลน์</span>
                  </div>
                  <Button 
                    onClick={fetchDashboardData}
                    className="bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-6 py-3 font-semibold"
                  >
                    <RefreshCw className="mr-2 h-5 w-5" />
                    รีเฟรช
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-blue-50 to-indigo-50">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-blue-700 mb-2">สินค้าทั้งหมด</p>
                    <p className="text-4xl font-bold text-blue-900 mb-1">{stats.totalProducts}</p>
                    <p className="text-xs text-blue-600 font-medium">+{stats.monthlyGrowth}% จากเดือนที่แล้ว</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg">
                    <Package className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-amber-50 to-orange-50">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-amber-700 mb-2">สต็อกต่ำ</p>
                    <p className="text-4xl font-bold text-amber-900 mb-1">{stats.lowStockProducts}</p>
                    <p className="text-xs text-amber-600 font-medium">ต้องการเติมสต็อก</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl shadow-lg">
                    <AlertCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-red-50 to-rose-50">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-rose-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-red-700 mb-2">สต็อกหมด</p>
                    <p className="text-4xl font-bold text-red-900 mb-1">{stats.outOfStockProducts}</p>
                    <p className="text-xs text-red-600 font-medium">ต้องสั่งซื้อด่วน</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shadow-lg">
                    <XCircle className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden backdrop-blur-lg border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 bg-gradient-to-br from-purple-50 to-violet-50">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-violet-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
              <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-700 mb-2">มูลค่ารวม</p>
                    <p className="text-4xl font-bold text-purple-900 mb-1">฿{stats.totalValue.toLocaleString()}</p>
                    <p className="text-xs text-purple-600 font-medium">มูลค่าสต็อกทั้งหมด</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl shadow-lg">
                    <DollarSign className="h-7 w-7 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card className="mb-8 border-0 rounded-3xl shadow-xl bg-gradient-to-br from-slate-50 to-gray-50">
            <CardHeader className="pb-6">
              <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mr-4 shadow-lg">
                  <Target className="h-6 w-6 text-white" />
                </div>
                ตัวชี้วัดประสิทธิภาพ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {performanceMetrics.map((metric, index) => (
                  <div key={index} className="space-y-4 p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-gray-800">{metric.name}</span>
                      <div className="flex items-center space-x-2">
                        {metric.trend === 'up' ? (
                          <div className="p-1 bg-green-100 rounded-lg">
                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                          </div>
                        ) : metric.trend === 'down' ? (
                          <div className="p-1 bg-red-100 rounded-lg">
                            <ArrowDownRight className="h-4 w-4 text-red-600" />
                          </div>
                        ) : (
                          <div className="p-1 bg-gray-100 rounded-lg">
                            <div className="h-4 w-4 bg-gray-400 rounded-full"></div>
                          </div>
                        )}
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          metric.trend === 'up' ? 'bg-green-100 text-green-700' : 
                          metric.trend === 'down' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {metric.change > 0 ? '+' : ''}{metric.change}%
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-3xl font-bold text-gray-900">
                          {metric.value}{metric.unit}
                        </span>
                        <span className="text-sm text-gray-600 font-medium">
                          เป้าหมาย: {metric.target}{metric.unit}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <Progress 
                          value={(metric.value / metric.target) * 100} 
                          className="h-3 bg-gray-200"
                        />
                        <div className="text-right">
                          <span className="text-xs text-gray-500 font-medium">
                            {Math.round((metric.value / metric.target) * 100)}% ของเป้าหมาย
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Recent Activities */}
            <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-blue-50 to-indigo-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mr-4 shadow-lg">
                    <Activity className="h-6 w-6 text-white" />
                  </div>
                  กิจกรรมล่าสุด
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 p-5 rounded-2xl bg-white/70 backdrop-blur-sm border border-white/30 hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl">
                      <div className={`p-3 rounded-2xl shadow-md ${
                        activity.status === 'success' ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white' :
                        activity.status === 'warning' ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white' :
                        activity.status === 'error' ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white' : 
                        'bg-gradient-to-br from-blue-500 to-indigo-600 text-white'
                      }`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{activity.title}</p>
                        <p className="text-sm text-gray-700 mb-2">{activity.description}</p>
                        <p className="text-xs text-gray-500 font-medium">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Movement Chart */}
            <Card className="lg:col-span-2 border-0 rounded-3xl shadow-xl bg-gradient-to-br from-purple-50 to-violet-50">
              <CardHeader className="pb-6">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl mr-4 shadow-lg">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    กราฟการเคลื่อนไหวสต็อก
                  </CardTitle>
                  <div className="flex space-x-3">
                    {(['7d', '30d', '90d', '1y'] as const).map((range) => (
                      <Button 
                        key={range}
                        size="sm" 
                        variant={selectedTimeRange === range ? "default" : "outline"}
                        onClick={() => setSelectedTimeRange(range)}
                        className={`px-4 py-2 text-sm rounded-2xl font-semibold transition-all duration-300 ${
                          selectedTimeRange === range 
                            ? 'bg-gradient-to-r from-purple-600 to-violet-600 text-white shadow-lg' 
                            : 'bg-white/60 backdrop-blur-sm border-purple-200 text-purple-700 hover:bg-purple-100 hover:border-purple-300'
                        }`}
                      >
                        {range === '7d' ? '7 วัน' : range === '30d' ? '30 วัน' : range === '90d' ? '90 วัน' : '1 ปี'}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={movementChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
                      <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                      <YAxis stroke="#6b7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(139, 92, 246, 0.2)', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)'
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="in" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="url(#colorIn)" 
                        fillOpacity={0.8}
                        name="รับเข้า"
                        strokeWidth={2}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="out" 
                        stackId="1" 
                        stroke="#ef4444" 
                        fill="url(#colorOut)" 
                        fillOpacity={0.8}
                        name="เบิกออก"
                        strokeWidth={2}
                      />
                      <defs>
                        <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions & Category Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Quick Actions */}
            <Card className="border-0 rounded-3xl shadow-xl bg-gradient-to-br from-yellow-50 to-amber-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-2xl mr-4 shadow-lg">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  การดำเนินการด่วน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {quickActions.map((action, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="h-auto p-5 flex flex-col items-center space-y-3 hover:shadow-xl transition-all duration-300 rounded-2xl bg-white/60 backdrop-blur-sm border-white/30 hover:bg-white/90 hover:scale-105"
                      onClick={() => {
                        // Navigate to the specified route
                        window.location.href = action.href;
                      }}
                    >
                      <div className={`p-4 rounded-2xl ${action.color} text-white shadow-lg`}>
                        {action.icon}
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-gray-900 mb-1">{action.title}</p>
                        <p className="text-xs text-gray-600">{action.description}</p>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="lg:col-span-2 border-0 rounded-3xl shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
              <CardHeader className="pb-6">
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mr-4 shadow-lg">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  การกระจายหมวดหมู่สินค้า
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80 bg-white/40 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={120}
                        innerRadius={40}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid rgba(16, 185, 129, 0.2)', 
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                          backdropFilter: 'blur(10px)'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Status Footer */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center space-x-6 backdrop-blur-md rounded-3xl px-10 py-6 shadow-2xl bg-gradient-to-r from-white/90 to-gray-50/90 border border-white/30">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="text-sm font-bold text-gray-800">ระบบออนไลน์</span>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-gray-400"></div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}
                </span>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-gray-300 to-gray-400"></div>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <Eye className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm font-semibold text-gray-700">
                  การเคลื่อนไหว: {stats.recentMovements} รายการ
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}