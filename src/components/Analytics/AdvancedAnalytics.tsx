import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Download,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { useStock } from '@/contexts/StockContext';

interface AnalyticsData {
  sales: {
    total: number;
    growth: number;
    monthly: Array<{ month: string; value: number }>;
  };
  inventory: {
    totalValue: number;
    turnover: number;
    categories: Array<{ name: string; value: number; percentage: number }>;
  };
  movements: {
    total: number;
    in: number;
    out: number;
    daily: Array<{ date: string; in: number; out: number }>;
  };
  performance: {
    topProducts: Array<{ name: string; sales: number; growth: number }>;
    lowStock: Array<{ name: string; current: number; threshold: number }>;
    recentActivity: Array<{ type: string; description: string; timestamp: Date }>;
  };
}

export function AdvancedAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedTab, setSelectedTab] = useState('overview');
  const { products, categories, movements } = useStock();

  useEffect(() => {
    fetchAnalyticsData();
  }, [dateRange, products, categories, movements]);

  const fetchAnalyticsData = async () => {
    setLoading(true);
    try {
      const totalValue = products.reduce((sum, p) => sum + (p.currentStock * (p.price || 0)), 0);

      const categoryCounts = products.reduce((acc, product) => {
        const categoryId = product.categoryId;
        const category = categories.find(c => c.id === categoryId);
        const categoryName = category?.name || 'ไม่ระบุ';

        if (!acc[categoryName]) {
          acc[categoryName] = 0;
        }
        acc[categoryName] += product.currentStock * (product.price || 0);
        return acc;
      }, {} as Record<string, number>);

      const categoryAnalytics = Object.entries(categoryCounts)
        .map(([name, value]) => ({
          name,
          value,
          percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
        }))
        .sort((a, b) => b.value - a.value);

      const now = new Date();
      const getDaysAgo = (days: number) => new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : dateRange === '90d' ? 90 : 365;
      const rangeStart = getDaysAgo(days);

      const inMovements = movements.filter(m => {
        const date = new Date(m.createdAt);
        return m.type === 'in' && date >= rangeStart;
      });
      const outMovements = movements.filter(m => {
        const date = new Date(m.createdAt);
        return m.type === 'out' && date >= rangeStart;
      });

      const dailyMovements = Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = getDaysAgo(Math.min(days, 30) - i - 1);
        const dateStr = date.toISOString().split('T')[0];
        return {
          date: dateStr,
          in: movements.filter(m => m.type === 'in' && m.createdAt.startsWith(dateStr)).length,
          out: movements.filter(m => m.type === 'out' && m.createdAt.startsWith(dateStr)).length
        };
      });

      const productSales = products.map(p => ({
        name: p.name,
        sales: (p.currentStock * (p.price || 0)),
        growth: 0
      }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 4);

      const lowStockProducts = products
        .filter(p => p.currentStock <= p.minStock && p.currentStock > 0)
        .map(p => ({
          name: p.name,
          current: p.currentStock,
          threshold: p.minStock
        }))
        .slice(0, 3);

      const recentActivity = movements
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 3)
        .map(m => {
          const product = products.find(p => p.id === m.productId);
          return {
            type: m.type,
            description: `${m.type === 'in' ? 'รับเข้า' : 'เบิกออก'} ${product?.name || 'สินค้า'} จำนวน ${m.quantity} ${product?.unit || 'ชิ้น'}`,
            timestamp: new Date(m.createdAt)
          };
        });

      const analyticsData: AnalyticsData = {
        sales: {
          total: totalValue,
          growth: 0,
          monthly: []
        },
        inventory: {
          totalValue,
          turnover: 0,
          categories: categoryAnalytics
        },
        movements: {
          total: movements.filter(m => new Date(m.createdAt) >= rangeStart).length,
          in: inMovements.length,
          out: outMovements.length,
          daily: dailyMovements
        },
        performance: {
          topProducts: productSales,
          lowStock: lowStockProducts,
          recentActivity
        }
      };

      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('th-TH', {
      style: 'currency',
      currency: 'THB'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('th-TH').format(num);
  };

  const exportToExcel = () => {
    // This would integrate with an Excel export library
    console.log('Exporting to Excel...');
  };

  const exportToPDF = () => {
    // This would integrate with a PDF export library
    console.log('Exporting to PDF...');
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

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การวิเคราะห์ขั้นสูง</h1>
          <p className="text-gray-600">ข้อมูลเชิงลึกและสถิติการดำเนินงาน</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAnalyticsData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="h-4 w-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center space-x-2">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium">ช่วงเวลา:</span>
        <div className="flex space-x-1">
          {[
            { value: '7d', label: '7 วัน' },
            { value: '30d', label: '30 วัน' },
            { value: '90d', label: '90 วัน' },
            { value: '1y', label: '1 ปี' }
          ].map((range) => (
            <Button
              key={range.value}
              variant={dateRange === range.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range.value as any)}
            >
              {range.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="sales">ยอดขาย</TabsTrigger>
          <TabsTrigger value="inventory">สต็อก</TabsTrigger>
          <TabsTrigger value="performance">ประสิทธิภาพ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ยอดขายรวม</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.sales.total)}</div>
                <p className="text-xs text-green-600">
                  +{data.sales.growth}% จากเดือนที่แล้ว
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">มูลค่าสต็อก</CardTitle>
                <BarChart3 className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(data.inventory.totalValue)}</div>
                <p className="text-xs text-muted-foreground">
                  Turnover: {data.inventory.turnover}x
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การเคลื่อนไหว</CardTitle>
                <TrendingUp className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(data.movements.total)}</div>
                <p className="text-xs text-muted-foreground">
                  เข้า: {data.movements.in} | ออก: {data.movements.out}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">สินค้าใกล้หมด</CardTitle>
                <TrendingDown className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.performance.lowStock.length}</div>
                <p className="text-xs text-amber-600">
                  ต้องเติมสต็อก
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>ยอดขายรายเดือน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.sales.monthly.map((month, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{month.month}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${(month.value / 350000) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{formatCurrency(month.value)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>การเคลื่อนไหวรายวัน</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.movements.daily.map((day, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day.date}</span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm">{day.in}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm">{day.out}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sales" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>สินค้าขายดี</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.performance.topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{product.name}</h4>
                      <p className="text-sm text-gray-500">ยอดขาย: {formatCurrency(product.sales)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={product.growth > 0 ? 'default' : 'destructive'}>
                        {product.growth > 0 ? '+' : ''}{product.growth}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>หมวดหมู่สินค้า</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.inventory.categories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                      <span className="font-medium">{category.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm text-gray-600">{formatCurrency(category.value)}</span>
                      <Badge variant="outline">{category.percentage}%</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>สินค้าใกล้หมด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.lowStock.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-500">เหลือ: {item.current} ชิ้น</p>
                      </div>
                      <Badge variant="destructive">
                        ต่ำกว่า {item.threshold}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>กิจกรรมล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {data.performance.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                      <div className="flex-1">
                        <p className="text-sm">{activity.description}</p>
                        <p className="text-xs text-gray-500">
                          {activity.timestamp.toLocaleString('th-TH')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
