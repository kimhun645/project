import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Package, 
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AnalyticsService, AnalyticsData, ChartData } from '@/lib/analyticsService';
import { useNotifications } from '@/hooks/useNotifications';

interface AnalyticsDashboardProps {
  className?: string;
}

export function AnalyticsDashboard({ className = "" }: AnalyticsDashboardProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedChart, setSelectedChart] = useState('monthlyTrends');
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const { showNotification, showSystemNotification } = useNotifications();

  // Load analytics data
  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  // Update chart data when selection changes
  useEffect(() => {
    if (analyticsData) {
      const chart = AnalyticsService.getChartData(selectedChart, analyticsData);
      setChartData(chart);
    }
  }, [analyticsData, selectedChart]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      const data = await AnalyticsService.getAnalyticsData();
      setAnalyticsData(data);
      showSystemNotification('โหลดข้อมูล', 'โหลดข้อมูลวิเคราะห์เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error('Error loading analytics data:', error);
      showNotification({
        title: 'ข้อผิดพลาด',
        message: 'ไม่สามารถโหลดข้อมูลวิเคราะห์ได้',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = () => {
    if (analyticsData) {
      AnalyticsService.exportAnalyticsData(analyticsData);
      showNotification({
        title: 'ส่งออกข้อมูล',
        message: 'ส่งออกข้อมูลวิเคราะห์เรียบร้อยแล้ว',
        type: 'success'
      });
    }
  };

  const refreshData = () => {
    loadAnalyticsData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">กำลังโหลดข้อมูล...</span>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">ไม่สามารถโหลดข้อมูลวิเคราะห์ได้</p>
        <Button onClick={refreshData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          ลองใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">แดชบอร์ดวิเคราะห์</h2>
          <p className="text-gray-600">ภาพรวมและสถิติของระบบ</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 วัน</SelectItem>
              <SelectItem value="30d">30 วัน</SelectItem>
              <SelectItem value="90d">90 วัน</SelectItem>
              <SelectItem value="1y">1 ปี</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={refreshData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเฟรช
          </Button>
          <Button onClick={exportAnalytics}>
            <Download className="h-4 w-4 mr-2" />
            ส่งออก
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สินค้าทั้งหมด</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalProducts.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData.recentMovements} การเคลื่อนไหวล่าสุด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มูลค่ารวม</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">฿{analyticsData.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.topProducts.length} สินค้าหลัก
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">สต็อกต่ำ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{analyticsData.lowStockProducts}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.outOfStockProducts} สต็อกหมด
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การเคลื่อนไหว</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.totalMovements.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.recentMovements} รายการล่าสุด
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
          <TabsTrigger value="trends">แนวโน้ม</TabsTrigger>
          <TabsTrigger value="distribution">การกระจาย</TabsTrigger>
          <TabsTrigger value="performance">ประสิทธิภาพ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  สินค้าหลัก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topProducts.slice(0, 5).map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{product.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">฿{product.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{product.quantity} ชิ้น</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  หมวดหมู่หลัก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.topCategories.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">฿{category.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">{category.count} รายการ</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Monthly Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  แนวโน้มรายเดือน
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.monthlyTrends.slice(-6).map((trend, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">{trend.month}</div>
                        <div className="text-sm text-gray-500">
                          {trend.products} สินค้า • {trend.movements} การเคลื่อนไหว
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">฿{trend.value.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">มูลค่า</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Category Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  การวิเคราะห์หมวดหมู่
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.categoryAnalysis.map((category, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">{category.name}</div>
                        <div className="text-sm text-gray-500">
                          การเติบโต: {category.growth > 0 ? '+' : ''}{category.growth.toFixed(1)}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={category.trend === 'up' ? 'default' : category.trend === 'down' ? 'destructive' : 'secondary'}
                        >
                          {category.trend === 'up' ? 'เพิ่มขึ้น' : category.trend === 'down' ? 'ลดลง' : 'คงที่'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Stock Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  การกระจายสต็อก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.stockDistribution.map((range, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{range.range}</span>
                        <span className="text-sm text-gray-500">({range.count} รายการ)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{range.percentage.toFixed(1)}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${range.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Movement Types */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  ประเภทการเคลื่อนไหว
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.movementTypes.map((type, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.type}</span>
                        <span className="text-sm text-gray-500">({type.count} รายการ)</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{type.percentage.toFixed(1)}%</div>
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  สุขภาพระบบ
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Uptime</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${analyticsData.systemHealth.uptime}%` }}
                        />
                      </div>
                      <span className="font-semibold">{analyticsData.systemHealth.uptime}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ประสิทธิภาพ</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${analyticsData.systemHealth.performance}%` }}
                        />
                      </div>
                      <span className="font-semibold">{analyticsData.systemHealth.performance}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">ข้อผิดพลาด</span>
                    <Badge variant="outline">{analyticsData.systemHealth.errors}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="font-medium">คำเตือน</span>
                    <Badge variant="outline">{analyticsData.systemHealth.warnings}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  กิจกรรมผู้ใช้
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.userActivity.slice(0, 5).map((user, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div>
                        <div className="font-medium">{user.user}</div>
                        <div className="text-sm text-gray-500">
                          {user.actions} การดำเนินการ
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {new Date(user.lastActive).toLocaleDateString('th-TH')}
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(user.lastActive).toLocaleTimeString('th-TH')}
                        </div>
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
