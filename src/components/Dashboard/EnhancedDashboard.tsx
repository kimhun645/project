import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  AlertTriangle, 
  Clock,
  Users,
  DollarSign,
  BarChart3,
  RefreshCw,
  Settings,
  Zap,
  AlertCircle,
  Calendar,
  ShoppingCart,
  Activity,
  PieChart,
  Eye,
  ArrowRight,
  Star,
  Shield,
  Target
} from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { useStock } from '@/contexts/StockContext';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  outOfStockItems: number;
  expiredItems: number;
  totalValue: number;
  recentMovements: number;
  pendingApprovals: number;
  monthlyGrowth: number;
  topCategories: Array<{ name: string; count: number; value: number; color: string }>;
  lowStockProducts: Array<{ id: string; name: string; currentStock: number; minStock: number; category: string }>;
  outOfStockProducts: Array<{ id: string; name: string; category: string; lastRestock: string }>;
  expiredProducts: Array<{ id: string; name: string; expiryDate: string; category: string; daysUntilExpiry: number }>;
}

export function EnhancedDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const { getStockLevel } = useStock();
  const { user } = useAuth();

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');

      const [products, categories, movements] = await Promise.all([
        FirestoreService.getProducts(),
        FirestoreService.getCategories(),
        FirestoreService.getMovements()
      ]);

      const lowStockItems = products.filter(p => p.currentStock <= p.minStock).length;
      const outOfStockItems = products.filter(p => p.currentStock === 0).length;
      const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.price || 0)), 0);

      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const recentMovements = movements.filter(m => {
        const movementDate = new Date(m.createdAt);
        return movementDate >= thirtyDaysAgo;
      }).length;

      const categoryColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#8B5CF6'];
      const categoryCounts = products.reduce((acc, product) => {
        const categoryId = product.categoryId;
        if (!acc[categoryId]) {
          acc[categoryId] = { count: 0, value: 0 };
        }
        acc[categoryId].count++;
        acc[categoryId].value += product.currentStock * (product.price || 0);
        return acc;
      }, {} as Record<string, { count: number; value: number }>);

      const topCategories = Object.entries(categoryCounts)
        .map(([categoryId, data], index) => {
          const category = categories.find(c => c.id === categoryId);
          return {
            name: category?.name || 'ไม่ระบุ',
            count: data.count,
            value: data.value,
            color: categoryColors[index % categoryColors.length]
          };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 5);

      const lowStockProducts = products
        .filter(p => p.currentStock > 0 && p.currentStock <= p.minStock)
        .slice(0, 4)
        .map(p => {
          const category = categories.find(c => c.id === p.categoryId);
          return {
            id: p.id,
            name: p.name,
            currentStock: p.currentStock,
            minStock: p.minStock,
            category: category?.name || 'ไม่ระบุ'
          };
        });

      const outOfStockProducts = products
        .filter(p => p.currentStock === 0)
        .slice(0, 3)
        .map(p => {
          const category = categories.find(c => c.id === p.categoryId);
          return {
            id: p.id,
            name: p.name,
            category: category?.name || 'ไม่ระบุ',
            lastRestock: p.updatedAt || p.createdAt
          };
        });

      const expiredProducts = products
        .filter(p => p.expiryDate)
        .map(p => {
          const expiryDate = new Date(p.expiryDate!);
          const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const category = categories.find(c => c.id === p.categoryId);
          return {
            id: p.id,
            name: p.name,
            expiryDate: p.expiryDate!,
            category: category?.name || 'ไม่ระบุ',
            daysUntilExpiry
          };
        })
        .filter(p => p.daysUntilExpiry <= 30)
        .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
        .slice(0, 3);

      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      const lastMonthMovements = movements.filter(m => {
        const movementDate = new Date(m.createdAt);
        return movementDate >= thirtyDaysAgo;
      }).length;
      const previousMonthMovements = movements.filter(m => {
        const movementDate = new Date(m.createdAt);
        return movementDate >= sixtyDaysAgo && movementDate < thirtyDaysAgo;
      }).length;
      const monthlyGrowth = previousMonthMovements > 0
        ? ((lastMonthMovements - previousMonthMovements) / previousMonthMovements) * 100
        : 0;

      const dashboardStats: DashboardStats = {
        totalProducts: products.length,
        lowStockItems,
        outOfStockItems,
        expiredItems: expiredProducts.length,
        totalValue,
        recentMovements,
        pendingApprovals: 0,
        monthlyGrowth,
        topCategories,
        lowStockProducts,
        outOfStockProducts,
        expiredProducts
      };

      setStats(dashboardStats);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>กำลังโหลดข้อมูล...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  return (
    <div className="space-y-8">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              แดชบอร์ด
            </h1>
            <p className="text-blue-100 text-lg">
              สวัสดี {user?.displayName || user?.email} 👋 ยินดีต้อนรับสู่ระบบบริหารพัสดุ
            </p>
            <div className="flex items-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                <Activity className="h-4 w-4" />
                <span className="text-sm">ระบบทำงานปกติ</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/20 rounded-full px-4 py-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">อัปเดต: {lastUpdated.toLocaleTimeString('th-TH')}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={fetchDashboardData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              รีเฟรช
            </Button>
            <Button 
              variant="secondary" 
              size="sm"
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Settings className="h-4 w-4 mr-2" />
              ตั้งค่า
            </Button>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-white/5 rounded-full"></div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-blue-700">สินค้าทั้งหมด</CardTitle>
            <div className="p-2 bg-blue-500 rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{formatNumber(stats.totalProducts)}</div>
            <p className="text-sm text-blue-600/70 flex items-center">
              <TrendingUp className="h-3 w-3 mr-1" />
              รายการสินค้าในระบบ
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-amber-50 to-amber-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-amber-700">สินค้าใกล้หมด</CardTitle>
            <div className="p-2 bg-amber-500 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-600 mb-1">{formatNumber(stats.lowStockItems)}</div>
            <p className="text-sm text-amber-600/70 flex items-center">
              <Zap className="h-3 w-3 mr-1" />
              ต้องเติมสต็อก
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-red-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-red-700">สินค้าหมด</CardTitle>
            <div className="p-2 bg-red-500 rounded-lg">
              <AlertCircle className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-1">{formatNumber(stats.outOfStockItems)}</div>
            <p className="text-sm text-red-600/70 flex items-center">
              <Target className="h-3 w-3 mr-1" />
              ต้องสั่งซื้อด่วน
            </p>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -translate-y-10 translate-x-10"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-700">มูลค่ารวม</CardTitle>
            <div className="p-2 bg-green-500 rounded-lg">
              <DollarSign className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">{formatCurrency(stats.totalValue)}</div>
            <p className="text-sm text-green-600/70 flex items-center">
              <Star className="h-3 w-3 mr-1" />
              มูลค่าสต็อกทั้งหมด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modern Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution Pie Chart */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-blue-600" />
                หมวดหมู่สินค้า
              </CardTitle>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                {stats.topCategories.length} หมวดหมู่
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={stats.topCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {stats.topCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value, name) => [formatNumber(Number(value)), 'จำนวน']}
                    labelFormatter={(label) => `หมวดหมู่: ${label}`}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2">
              {stats.topCategories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatNumber(category.count)} รายการ</div>
                    <div className="text-xs text-gray-500">{formatCurrency(category.value)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Summary */}
        <Card className="shadow-lg border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold flex items-center">
                <Activity className="h-5 w-5 mr-2 text-green-600" />
                สรุปกิจกรรม
              </CardTitle>
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                วันนี้
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-800">การเบิก/การรับพัสดุ</p>
                    <p className="text-sm text-green-600">{stats.recentMovements} รายการวันนี้</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">{stats.recentMovements}</div>
                  <div className="text-xs text-green-500">รายการ</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-amber-500 rounded-lg">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-800">รอการอนุมัติ</p>
                    <p className="text-sm text-amber-600">{stats.pendingApprovals} รายการต้องดำเนินการ</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-amber-600">{stats.pendingApprovals}</div>
                  <div className="text-xs text-amber-500">รายการ</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-500 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800">การเติบโต</p>
                    <p className="text-sm text-blue-600">+{stats.monthlyGrowth}% จากเดือนที่แล้ว</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600">+{stats.monthlyGrowth}%</div>
                  <div className="text-xs text-blue-500">เปรียบเทียบ</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Stock Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low Stock Products */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center text-amber-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                สินค้าใกล้หมด
              </CardTitle>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                {stats.lowStockProducts.length} รายการ
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.lowStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-amber-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-xs text-amber-600">สต็อกปัจจุบัน: {product.currentStock}</div>
                      <div className="text-xs text-gray-500">ขั้นต่ำ: {product.minStock}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-300">
                    <Eye className="h-4 w-4 mr-1" />
                    ดู
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-amber-200">
              <Button className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                <ArrowRight className="h-4 w-4 mr-2" />
                ดูทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Out of Stock Products */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-red-50 to-pink-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center text-red-700">
                <AlertCircle className="h-5 w-5 mr-2" />
                สินค้าหมด
              </CardTitle>
              <Badge variant="secondary" className="bg-red-100 text-red-700">
                {stats.outOfStockProducts.length} รายการ
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.outOfStockProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="text-xs text-red-600">หมดสต็อก</div>
                      <div className="text-xs text-gray-500">เติมล่าสุด: {product.lastRestock}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-300">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    สั่งซื้อ
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-red-200">
              <Button className="w-full bg-red-500 hover:bg-red-600 text-white">
                <ArrowRight className="h-4 w-4 mr-2" />
                ดูทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expired Products */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-indigo-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold flex items-center text-purple-700">
                <Calendar className="h-5 w-5 mr-2" />
                สินค้าหมดอายุ
              </CardTitle>
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {stats.expiredProducts.length} รายการ
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {stats.expiredProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-purple-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-800">{product.name}</p>
                    <p className="text-sm text-gray-600">{product.category}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`text-xs ${product.daysUntilExpiry <= 0 ? 'text-red-600' : product.daysUntilExpiry <= 3 ? 'text-amber-600' : 'text-purple-600'}`}>
                        {product.daysUntilExpiry <= 0 ? 'หมดอายุแล้ว' : `เหลือ ${product.daysUntilExpiry} วัน`}
                      </div>
                      <div className="text-xs text-gray-500">หมดอายุ: {product.expiryDate}</div>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="text-purple-600 border-purple-300">
                    <Shield className="h-4 w-4 mr-1" />
                    จัดการ
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">
                <ArrowRight className="h-4 w-4 mr-2" />
                ดูทั้งหมด
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-muted-foreground">
        อัปเดตล่าสุด: {lastUpdated.toLocaleString('th-TH')}
      </div>
    </div>
  );
}
