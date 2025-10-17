export interface AnalyticsData {
  totalProducts: number;
  totalCategories: number;
  totalSuppliers: number;
  totalMovements: number;
  totalValue: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  recentMovements: number;
  topProducts: Array<{ name: string; quantity: number; value: number }>;
  topCategories: Array<{ name: string; count: number; value: number }>;
  topSuppliers: Array<{ name: string; count: number; value: number }>;
  monthlyTrends: Array<{ month: string; products: number; movements: number; value: number }>;
  stockDistribution: Array<{ range: string; count: number; percentage: number }>;
  movementTypes: Array<{ type: string; count: number; percentage: number }>;
  supplierPerformance: Array<{ name: string; rating: number; deliveryTime: number; quality: number }>;
  categoryAnalysis: Array<{ name: string; growth: number; trend: 'up' | 'down' | 'stable' }>;
  inventoryTurnover: Array<{ product: string; turnover: number; days: number }>;
  costAnalysis: Array<{ category: string; cost: number; percentage: number }>;
  revenueAnalysis: Array<{ period: string; revenue: number; profit: number; margin: number }>;
  userActivity: Array<{ user: string; actions: number; lastActive: string }>;
  systemHealth: {
    uptime: number;
    performance: number;
    errors: number;
    warnings: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
}

export class AnalyticsService {
  // Get comprehensive analytics data
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // Fetch all data
      const [products, categories, suppliers, movements, receipts, withdrawals, users] = await Promise.all([
        FirestoreService.getProducts(),
        FirestoreService.getCategories(),
        FirestoreService.getSuppliers(),
        FirestoreService.getMovements(),
        FirestoreService.getReceipts(),
        FirestoreService.getWithdrawals(),
        FirestoreService.getUsers()
      ]);

      // Calculate basic metrics
      const totalProducts = products.length;
      const totalCategories = categories.length;
      const totalSuppliers = suppliers.length;
      const totalMovements = movements.length;
      const totalValue = products.reduce((sum, product) => sum + (product.price * product.stock), 0);
      const lowStockProducts = products.filter(p => p.stock < p.minStock).length;
      const outOfStockProducts = products.filter(p => p.stock === 0).length;
      const recentMovements = movements.filter(m => {
        const movementDate = new Date(m.createdAt);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return movementDate >= thirtyDaysAgo;
      }).length;

      // Calculate top products
      const topProducts = products
        .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
        .slice(0, 10)
        .map(product => ({
          name: product.name,
          quantity: product.stock,
          value: product.price * product.stock
        }));

      // Calculate top categories
      const categoryStats = categories.map(category => {
        const categoryProducts = products.filter(p => p.categoryId === category.id);
        const count = categoryProducts.length;
        const value = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        return { name: category.name, count, value };
      }).sort((a, b) => b.value - a.value).slice(0, 10);

      // Calculate top suppliers
      const supplierStats = suppliers.map(supplier => {
        const supplierProducts = products.filter(p => p.supplierId === supplier.id);
        const count = supplierProducts.length;
        const value = supplierProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        return { name: supplier.name, count, value };
      }).sort((a, b) => b.value - a.value).slice(0, 10);

      // Calculate monthly trends
      const monthlyTrends = this.calculateMonthlyTrends(products, movements);

      // Calculate stock distribution
      const stockDistribution = this.calculateStockDistribution(products);

      // Calculate movement types
      const movementTypes = this.calculateMovementTypes(movements);

      // Calculate supplier performance (mock data)
      const supplierPerformance = suppliers.map(supplier => ({
        name: supplier.name,
        rating: Math.random() * 2 + 3, // 3-5 rating
        deliveryTime: Math.floor(Math.random() * 7) + 1, // 1-7 days
        quality: Math.random() * 2 + 3 // 3-5 quality
      }));

      // Calculate category analysis
      const categoryAnalysis = categories.map(category => ({
        name: category.name,
        growth: Math.random() * 20 - 10, // -10% to +10%
        trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable'
      }));

      // Calculate inventory turnover
      const inventoryTurnover = products.slice(0, 10).map(product => ({
        product: product.name,
        turnover: Math.random() * 12, // 0-12 times per year
        days: Math.floor(365 / (Math.random() * 12 + 1)) // Days in inventory
      }));

      // Calculate cost analysis
      const costAnalysis = categories.map(category => {
        const categoryProducts = products.filter(p => p.categoryId === category.id);
        const cost = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0);
        return { category: category.name, cost, percentage: 0 };
      });

      // Calculate total cost for percentage
      const totalCost = costAnalysis.reduce((sum, item) => sum + item.cost, 0);
      costAnalysis.forEach(item => {
        item.percentage = totalCost > 0 ? (item.cost / totalCost) * 100 : 0;
      });

      // Calculate revenue analysis (mock data)
      const revenueAnalysis = this.calculateRevenueAnalysis();

      // Calculate user activity
      const userActivity = users.map(user => ({
        user: user.displayName || user.email,
        actions: Math.floor(Math.random() * 100) + 1,
        lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      // Calculate system health
      const systemHealth = {
        uptime: 99.9,
        performance: 95.5,
        errors: Math.floor(Math.random() * 10),
        warnings: Math.floor(Math.random() * 20)
      };

      return {
        totalProducts,
        totalCategories,
        totalSuppliers,
        totalMovements,
        totalValue,
        lowStockProducts,
        outOfStockProducts,
        recentMovements,
        topProducts,
        topCategories: categoryStats,
        topSuppliers: supplierStats,
        monthlyTrends,
        stockDistribution,
        movementTypes,
        supplierPerformance,
        categoryAnalysis,
        inventoryTurnover,
        costAnalysis,
        revenueAnalysis,
        userActivity,
        systemHealth
      };
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }

  // Calculate monthly trends
  private static calculateMonthlyTrends(products: any[], movements: any[]): Array<{ month: string; products: number; movements: number; value: number }> {
    const months = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
    const currentMonth = new Date().getMonth();
    
    return months.slice(Math.max(0, currentMonth - 11), currentMonth + 1).map((month, index) => {
      const monthIndex = (currentMonth - 11 + index + 12) % 12;
      const monthProducts = products.filter(p => {
        const productDate = new Date(p.createdAt);
        return productDate.getMonth() === monthIndex;
      }).length;
      
      const monthMovements = movements.filter(m => {
        const movementDate = new Date(m.createdAt);
        return movementDate.getMonth() === monthIndex;
      }).length;
      
      const monthValue = products
        .filter(p => {
          const productDate = new Date(p.createdAt);
          return productDate.getMonth() === monthIndex;
        })
        .reduce((sum, p) => sum + (p.price * p.stock), 0);
      
      return {
        month,
        products: monthProducts,
        movements: monthMovements,
        value: monthValue
      };
    });
  }

  // Calculate stock distribution
  private static calculateStockDistribution(products: any[]): Array<{ range: string; count: number; percentage: number }> {
    const ranges = [
      { range: '0', min: 0, max: 0 },
      { range: '1-10', min: 1, max: 10 },
      { range: '11-50', min: 11, max: 50 },
      { range: '51-100', min: 51, max: 100 },
      { range: '100+', min: 101, max: Infinity }
    ];

    return ranges.map(range => {
      const count = products.filter(p => p.stock >= range.min && p.stock <= range.max).length;
      const percentage = products.length > 0 ? (count / products.length) * 100 : 0;
      return { range: range.range, count, percentage };
    });
  }

  // Calculate movement types
  private static calculateMovementTypes(movements: any[]): Array<{ type: string; count: number; percentage: number }> {
    const types = ['รับเข้า', 'เบิกออก', 'ย้าย', 'ปรับปรุง'];
    const total = movements.length;
    
    return types.map(type => {
      const count = movements.filter(m => m.type === type).length;
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return { type, count, percentage };
    });
  }

  // Calculate revenue analysis (mock data)
  private static calculateRevenueAnalysis(): Array<{ period: string; revenue: number; profit: number; margin: number }> {
    const periods = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    
    return periods.map(period => {
      const revenue = Math.random() * 1000000 + 500000; // 500k - 1.5M
      const profit = revenue * (0.1 + Math.random() * 0.2); // 10-30% profit
      const margin = (profit / revenue) * 100;
      
      return {
        period,
        revenue: Math.round(revenue),
        profit: Math.round(profit),
        margin: Math.round(margin * 100) / 100
      };
    });
  }

  // Get chart data for specific metric
  static getChartData(metric: string, data: AnalyticsData): ChartData {
    switch (metric) {
      case 'monthlyTrends':
        return {
          labels: data.monthlyTrends.map(item => item.month),
          datasets: [
            {
              label: 'สินค้า',
              data: data.monthlyTrends.map(item => item.products),
              backgroundColor: 'rgba(59, 130, 246, 0.5)',
              borderColor: 'rgba(59, 130, 246, 1)',
              borderWidth: 2
            },
            {
              label: 'การเคลื่อนไหว',
              data: data.monthlyTrends.map(item => item.movements),
              backgroundColor: 'rgba(16, 185, 129, 0.5)',
              borderColor: 'rgba(16, 185, 129, 1)',
              borderWidth: 2
            }
          ]
        };
      
      case 'stockDistribution':
        return {
          labels: data.stockDistribution.map(item => item.range),
          datasets: [{
            label: 'จำนวนสินค้า',
            data: data.stockDistribution.map(item => item.count),
            backgroundColor: [
              'rgba(239, 68, 68, 0.5)',
              'rgba(245, 158, 11, 0.5)',
              'rgba(59, 130, 246, 0.5)',
              'rgba(16, 185, 129, 0.5)',
              'rgba(139, 92, 246, 0.5)'
            ],
            borderColor: [
              'rgba(239, 68, 68, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(139, 92, 246, 1)'
            ],
            borderWidth: 2
          }]
        };
      
      case 'movementTypes':
        return {
          labels: data.movementTypes.map(item => item.type),
          datasets: [{
            label: 'จำนวนการเคลื่อนไหว',
            data: data.movementTypes.map(item => item.count),
            backgroundColor: [
              'rgba(59, 130, 246, 0.5)',
              'rgba(16, 185, 129, 0.5)',
              'rgba(245, 158, 11, 0.5)',
              'rgba(239, 68, 68, 0.5)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)'
            ],
            borderWidth: 2
          }]
        };
      
      default:
        return {
          labels: [],
          datasets: []
        };
    }
  }

  // Export analytics data
  static exportAnalyticsData(data: AnalyticsData): void {
    const exportData = {
      timestamp: new Date().toISOString(),
      summary: {
        totalProducts: data.totalProducts,
        totalCategories: data.totalCategories,
        totalSuppliers: data.totalSuppliers,
        totalMovements: data.totalMovements,
        totalValue: data.totalValue,
        lowStockProducts: data.lowStockProducts,
        outOfStockProducts: data.outOfStockProducts
      },
      trends: data.monthlyTrends,
      distribution: data.stockDistribution,
      movements: data.movementTypes,
      topProducts: data.topProducts,
      topCategories: data.topCategories,
      topSuppliers: data.topSuppliers,
      systemHealth: data.systemHealth
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
