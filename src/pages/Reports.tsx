
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, Download, Package, DollarSign, AlertTriangle, FolderOpen, RefreshCw, FileText, TrendingDown, Activity, Filter, Calendar, BarChart, PieChart, LineChart } from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { useStock } from '@/contexts/StockContext';
import { api } from '@/lib/apiService';
import { useToast } from '@/hooks/use-toast';
import {
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  TableColumn,
  type StatCard
} from '@/components/ui/products-style-components';
import { Layout } from '@/components/Layout/Layout';
import { ProductsStyleDataTable as DataTable } from '@/components/ui/products-style-data-table';
import { ProductsStylePagination as Pagination } from '@/components/ui/products-style-pagination';

export default function Reports() {
  const { products, categories, movements } = useStock();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('inventory');
  const [timeRange, setTimeRange] = useState('7days');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [dateRange, setDateRange] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [showCharts, setShowCharts] = useState(false);

  // Generate real data for charts from actual database data
  const inventoryData = useMemo(() => {
    return categories.map(category => ({
      name: category.name,
      value: products.filter(p => p.category_id === category.id).reduce((sum, p) => sum + p.current_stock, 0)
    }));
  }, [categories, products]);

  // Generate real sales data based on actual stock movements
  const salesData = useMemo(() => {
    const days = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'];
    const today = new Date();
    
    return days.map((day, index) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - (6 - index));
      
      const dayMovements = movements.filter(m => {
        const movementDate = new Date(m.created_at);
        return movementDate.toDateString() === dayDate.toDateString();
      });
      
      const sales = dayMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => {
          const product = products.find(p => p.id === m.product_id);
          return sum + (m.quantity * (product?.unit_price || 0));
        }, 0);
      
      const purchases = dayMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => {
          const product = products.find(p => p.id === m.product_id);
          return sum + (m.quantity * (product?.unit_price || 0));
        }, 0);
      
      return {
        name: day,
        sales: sales,
        purchases: purchases
      };
    });
  }, [movements, products]);

  // Generate comprehensive movement data based on date range
  const stockMovementData = useMemo(() => {
    const data = [];
    const today = new Date();
    
    if (dateRange === 'daily') {
      // Last 30 days
      for (let i = 29; i >= 0; i--) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() - i);
        
        const dayMovements = movements.filter(m => {
          const movementDate = new Date(m.created_at);
          return movementDate.toDateString() === dayDate.toDateString();
        });
        
        const stockIn = dayMovements
          .filter(m => m.type === 'in')
          .reduce((sum, m) => {
            const product = products.find(p => p.id === m.product_id);
            return sum + (m.quantity * (product?.unit_price || 0));
          }, 0);
        
        const stockOut = dayMovements
          .filter(m => m.type === 'out')
          .reduce((sum, m) => {
            const product = products.find(p => p.id === m.product_id);
            return sum + (m.quantity * (product?.unit_price || 0));
          }, 0);
        
        data.push({
          name: dayDate.toLocaleDateString('th-TH', { day: '2-digit', month: '2-digit' }),
          stockIn: stockIn,
          stockOut: stockOut,
          date: dayDate
        });
      }
    } else if (dateRange === 'monthly') {
      // Last 12 months
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const nextMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1);
        
        const monthMovements = movements.filter(m => {
          const movementDate = new Date(m.created_at);
          return movementDate >= monthDate && movementDate < nextMonth;
        });
        
        const stockIn = monthMovements
          .filter(m => m.type === 'in')
          .reduce((sum, m) => {
            const product = products.find(p => p.id === m.product_id);
            return sum + (m.quantity * (product?.unit_price || 0));
          }, 0);
        
        const stockOut = monthMovements
          .filter(m => m.type === 'out')
          .reduce((sum, m) => {
            const product = products.find(p => p.id === m.product_id);
            return sum + (m.quantity * (product?.unit_price || 0));
          }, 0);
        
        data.push({
          name: monthDate.toLocaleDateString('th-TH', { month: 'short', year: 'numeric' }),
          stockIn: stockIn,
          stockOut: stockOut,
          date: monthDate
        });
      }
    } else if (dateRange === 'yearly') {
      // Last 5 years
      for (let i = 4; i >= 0; i--) {
        const yearDate = new Date(today.getFullYear() - i, 0, 1);
        const nextYear = new Date(yearDate.getFullYear() + 1, 0, 1);
        
        const yearMovements = movements.filter(m => {
        const movementDate = new Date(m.created_at);
          return movementDate >= yearDate && movementDate < nextYear;
      });
      
        const stockIn = yearMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => {
          const product = products.find(p => p.id === m.product_id);
          return sum + (m.quantity * (product?.unit_price || 0));
        }, 0);
      
        const stockOut = yearMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => {
          const product = products.find(p => p.id === m.product_id);
          return sum + (m.quantity * (product?.unit_price || 0));
        }, 0);
      
        data.push({
          name: yearDate.getFullYear().toString(),
        stockIn: stockIn,
          stockOut: stockOut,
          date: yearDate
        });
      }
    }
    
    return data;
  }, [movements, products, dateRange]);

  // Generate detailed movement report data
  const detailedMovementData = useMemo(() => {
    return movements.map(movement => {
      const product = products.find(p => p.id === movement.product_id);
      const category = categories.find(c => c.id === product?.category_id);
      
      return {
        id: movement.id,
        date: new Date(movement.created_at).toLocaleDateString('th-TH'),
        productName: product?.name || 'ไม่พบสินค้า',
        productSku: product?.sku || 'ไม่พบ SKU',
        category: category?.name || 'ไม่ระบุหมวดหมู่',
        type: movement.type === 'in' ? 'รับเข้า' : 'เบิกออก',
        quantity: movement.quantity,
        unitPrice: product?.unit_price || 0,
        totalValue: movement.quantity * (product?.unit_price || 0),
        reason: movement.reason || 'ไม่ระบุเหตุผล',
        createdBy: 'ไม่ระบุผู้ดำเนินการ' // movement.created_by || 'ไม่ระบุผู้ดำเนินการ'
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [movements, products, categories]);

  // Generate inventory summary data
  const inventorySummaryData = useMemo(() => {
    return products.map(product => {
      const category = categories.find(c => c.id === product.category_id);
      const productMovements = movements.filter(m => m.product_id === product.id);
      
      const totalIn = productMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const totalOut = productMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const currentStock = product.current_stock || 0;
      const stockValue = currentStock * (product.unit_price || 0);
      
      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        category: category?.name || 'ไม่ระบุ',
        currentStock: currentStock,
        minStock: product.min_stock || 0,
        unitPrice: product.unit_price || 0,
        stockValue: stockValue,
        totalIn: totalIn,
        totalOut: totalOut,
        status: currentStock <= (product.min_stock || 0) ? 'สต็อกต่ำ' : 'ปกติ',
        lastMovement: productMovements.length > 0 
          ? new Date(Math.max(...productMovements.map(m => new Date(m.created_at).getTime()))).toLocaleDateString('th-TH')
          : 'ไม่มีการเคลื่อนไหว'
      };
    });
  }, [products, categories, movements]);

  // Filtered and paginated data
  const filteredData = useMemo(() => {
    let data = [];
    
    switch (reportType) {
      case 'inventory':
        data = inventorySummaryData.filter(item => 
          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      case 'movements':
        data = detailedMovementData.filter(item => 
          item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.productSku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          item.type?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      case 'sales':
        data = salesData.filter(day => 
          day.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      case 'categories':
        data = inventoryData.filter(cat => 
          cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        break;
      default:
        data = inventorySummaryData;
    }
    
    return data;
  }, [inventorySummaryData, detailedMovementData, salesData, inventoryData, reportType, searchTerm]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  // Table columns for different report types
  const getColumns = (): TableColumn[] => {
    switch (reportType) {
      case 'inventory':
        return [
          {
            key: 'sku',
            title: 'SKU',
            sortable: true,
            render: (value) => <div className="font-mono text-sm font-medium text-gray-900">{value}</div>
          },
          {
            key: 'name',
            title: 'ชื่อสินค้า',
            sortable: true,
            render: (value) => <div className="font-medium text-sm text-gray-900">{value}</div>
          },
          {
            key: 'category',
            title: 'หมวดหมู่',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
          },
          {
            key: 'currentStock',
            title: 'สต็อกปัจจุบัน',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-gray-900">{value || 0}</span>
              </div>
            )
          },
          {
            key: 'unitPrice',
            title: 'ราคาต่อหน่วย',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-green-700">฿{parseFloat(value?.toString() || '0').toLocaleString('th-TH')}</span>
              </div>
            )
          },
          {
            key: 'stockValue',
            title: 'มูลค่าสต็อก',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-blue-700">฿{parseFloat(value?.toString() || '0').toLocaleString('th-TH')}</span>
              </div>
            )
          },
          {
            key: 'totalIn',
            title: 'รับเข้าทั้งหมด',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-green-700">{value || 0}</span>
              </div>
            )
          },
          {
            key: 'totalOut',
            title: 'เบิกออกทั้งหมด',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-red-700">{value || 0}</span>
              </div>
            )
          },
          {
            key: 'status',
            title: 'สถานะ',
            sortable: true,
            render: (value) => (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'สต็อกต่ำ'
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {value}
              </div>
            )
          },
          {
            key: 'lastMovement',
            title: 'การเคลื่อนไหวล่าสุด',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
          }
        ];
      case 'movements':
        return [
          {
            key: 'date',
            title: 'วันที่',
            sortable: true,
            render: (value) => <div className="font-medium text-sm text-gray-900">{value}</div>
          },
          {
            key: 'productSku',
            title: 'SKU',
            sortable: true,
            render: (value) => <div className="font-mono text-sm font-medium text-gray-900">{value}</div>
          },
          {
            key: 'productName',
            title: 'ชื่อสินค้า',
            sortable: true,
            render: (value) => <div className="font-medium text-sm text-gray-900">{value}</div>
          },
          {
            key: 'category',
            title: 'หมวดหมู่',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
          },
          {
            key: 'type',
            title: 'ประเภท',
            sortable: true,
            render: (value) => (
              <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                value === 'รับเข้า'
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {value}
              </div>
            )
          },
          {
            key: 'quantity',
            title: 'จำนวน',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-gray-900">{value || 0}</span>
              </div>
            )
          },
          {
            key: 'unitPrice',
            title: 'ราคาต่อหน่วย',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-green-700">฿{parseFloat(value?.toString() || '0').toLocaleString('th-TH')}</span>
              </div>
            )
          },
          {
            key: 'totalValue',
            title: 'มูลค่ารวม',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-blue-700">฿{parseFloat(value?.toString() || '0').toLocaleString('th-TH')}</span>
              </div>
            )
          },
          {
            key: 'reason',
            title: 'เหตุผล',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
          },
          {
            key: 'createdBy',
            title: 'ผู้ดำเนินการ',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
          }
        ];
      default:
        return [];
    }
  };

  // Handlers
  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map((item: any) => item.id?.toString() || item.sku));
    } else {
      setSelectedItems([]);
    }
  };

  const handleClearSelection = () => {
    setSelectedItems([]);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const handleToggleCharts = () => {
    setShowCharts(!showCharts);
  };

  const handleSort = (field: string) => {
    // Implement sorting logic if needed
    console.log('Sort by:', field);
  };

  const handleExportReport = () => {
    try {
      // Create report data based on current selection
      let reportData = [];
      let fileName = '';
      let reportTitle = '';
      
      switch (reportType) {
        case 'inventory':
          fileName = `รายงานสต็อกสินค้าทั้งหมด_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงานสต็อกสินค้าทั้งหมด';
          reportData = inventorySummaryData.map(item => ({
            'SKU': item.sku,
            'ชื่อสินค้า': item.name,
            'หมวดหมู่': item.category,
            'สต็อกปัจจุบัน': item.currentStock,
            'สต็อกต่ำสุด': item.minStock,
            'ราคาต่อหน่วย': item.unitPrice,
            'มูลค่าสต็อก': item.stockValue,
            'รับเข้าทั้งหมด': item.totalIn,
            'เบิกออกทั้งหมด': item.totalOut,
            'สถานะ': item.status,
            'การเคลื่อนไหวล่าสุด': item.lastMovement
          }));
          break;
          
        case 'movements':
          fileName = `รายงานการเคลื่อนไหวสต็อก_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงานการเคลื่อนไหวสต็อก';
          reportData = detailedMovementData.map(item => ({
            'วันที่': item.date,
            'SKU': item.productSku,
            'ชื่อสินค้า': item.productName,
            'หมวดหมู่': item.category,
            'ประเภท': item.type,
            'จำนวน': item.quantity,
            'ราคาต่อหน่วย': item.unitPrice,
            'มูลค่ารวม': item.totalValue,
            'เหตุผล': item.reason,
            'ผู้ดำเนินการ': item.createdBy
          }));
          break;
          
        case 'sales':
          fileName = `รายงานการขาย_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงานการขาย';
          reportData = salesData.map(day => ({
            'วัน': day.name,
            'ยอดขาย (มูลค่า)': day.sales.toFixed(2),
            'การซื้อ (มูลค่า)': day.purchases.toFixed(2),
            'กำไร (มูลค่า)': (day.sales - day.purchases).toFixed(2)
          }));
          break;
          
        case 'categories':
          fileName = `รายงานหมวดหมู่_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงานหมวดหมู่';
          reportData = inventoryData.map(cat => ({
            'หมวดหมู่': cat.name,
            'จำนวนสินค้า': cat.value,
            'เปอร์เซ็นต์': ((cat.value / products.reduce((sum, p) => sum + p.current_stock, 0)) * 100).toFixed(2) + '%'
          }));
          break;
          
        default:
          fileName = `รายงาน_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงาน';
          reportData = [];
      }
      
      // Convert to CSV with UTF-8 BOM for Excel compatibility
      if (reportData.length > 0) {
        const headers = Object.keys(reportData[0]);
        const csvContent = [
          // Add report title and metadata
          `รายงาน: ${reportTitle}`,
          `วันที่สร้างรายงาน: ${new Date().toLocaleDateString('th-TH')}`,
          `จำนวนรายการ: ${reportData.length} รายการ`,
          `ช่วงเวลา: ${dateRange === 'daily' ? 'รายวัน' : dateRange === 'monthly' ? 'รายเดือน' : 'รายปี'}`,
          '', // Empty line
          headers.join(','),
          ...reportData.map(row => 
            headers.map(header => {
              const value = row[header];
              // Handle values that contain commas or quotes
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            }).join(',')
          )
        ].join('\n');
        
        // Create and download file with UTF-8 BOM for Excel
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: "ส่งออกรายงานสำเร็จ",
          description: `ไฟล์ ${fileName} ได้ถูกดาวน์โหลดแล้ว`,
        });
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกรายงานได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
    }
  };

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  // Calculate stats
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + ((p.unit_price || 0) * (p.current_stock || 0)), 0);
  const lowStockProducts = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length;
  const totalCategories = categories.length;
  const totalMovements = movements.length;

  // Define stats cards
  const statsCards: StatCard[] = [
    {
      title: "สินค้าทั้งหมด",
      value: totalProducts.toString(),
      icon: <Package className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "มูลค่าสต็อก",
      value: `฿${totalValue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: "purple"
    },
    {
      title: "สต็อกต่ำ",
      value: lowStockProducts.toString(),
      icon: <AlertTriangle className="h-6 w-6" />,
      color: lowStockProducts > 0 ? "orange" : "green"
    },
    {
      title: "หมวดหมู่",
      value: totalCategories.toString(),
      icon: <FolderOpen className="h-6 w-6" />,
      color: "teal"
    }
  ];

  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen w-full">
        <div className="w-full space-y-4 pb-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <ProductsStylePageHeader
        title="รายงานและการวิเคราะห์"
        searchPlaceholder="ค้นหารายงานหรือข้อมูล..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={handleRefresh}
        scannerDetected={false}
        actionButtons={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilter}
              className={`h-9 px-3 rounded-lg transition-all duration-200 ${
                showFilters 
                  ? 'bg-blue-500 text-white border-blue-500' 
                  : 'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              ตัวกรอง
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleCharts}
              className={`h-9 px-3 rounded-lg transition-all duration-200 ${
                showCharts 
                  ? 'bg-green-500 text-white border-green-500' 
                  : 'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              เรียกดูชาร์ท
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="h-9 px-3 rounded-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleExportReport}
              className="h-9 px-3 rounded-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
            >
              <Download className="h-4 w-4 mr-2" />
              ส่งออกรายงาน
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Filter Controls */}
      {showFilters && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ประเภทรายงาน:</label>
              <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="inventory">รายการสินค้าทั้งหมด</SelectItem>
                    <SelectItem value="movements">รายการเบิกจ่าย/รับ</SelectItem>
                  <SelectItem value="sales">รายงานการขาย</SelectItem>
                  <SelectItem value="categories">การวิเคราะห์หมวดหมู่</SelectItem>
                </SelectContent>
              </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ช่วงเวลา:</label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as 'daily' | 'monthly' | 'yearly')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">รายวัน (30 วัน)</SelectItem>
                    <SelectItem value="monthly">รายเดือน (12 เดือน)</SelectItem>
                    <SelectItem value="yearly">รายปี (5 ปี)</SelectItem>
                </SelectContent>
              </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">ประเภทกราฟ:</label>
                <Select value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'line' | 'pie')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bar">แท่ง</SelectItem>
                    <SelectItem value="line">เส้น</SelectItem>
                    <SelectItem value="pie">วงกลม</SelectItem>
                </SelectContent>
              </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {(reportType === 'inventory' || reportType === 'movements') && (
        <DataTable
          title={reportType === 'inventory' ? "รายการสินค้าทั้งหมด" : "รายการเบิกจ่าย/รับ"}
          description={`พบ ${filteredData.length} รายการ`}
          data={paginatedData}
          columns={getColumns()}
          currentViewMode={viewMode}
          onViewModeChange={setViewMode}
          onSort={handleSort}
          onRefresh={handleRefresh}
          onClearSelection={handleClearSelection}
          selectedItems={selectedItems}
          onSelectItem={handleSelectItem}
          onSelectAll={handleSelectAll}
          onDelete={() => {}}
          onFilter={handleFilter}
          sortField=""
          sortDirection="asc"
          loading={loading}
          emptyMessage={reportType === 'inventory' ? "ไม่พบข้อมูลสินค้า" : "ไม่พบข้อมูลการเคลื่อนไหว"}
          getItemId={(item) => item.id?.toString() || item.sku || item.productSku}
          getItemName={(item) => item.name || item.productName}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / itemsPerPage)}
        />
      )}

      {/* Charts for other report types */}
      {showCharts && reportType !== 'inventory' && (
        <div className="space-y-6">
          {reportType === 'movements' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">การเคลื่อนไหวสต็อกตามช่วงเวลา</CardTitle>
              </CardHeader>
              <CardContent>
                {stockMovementData.some(item => item.stockIn > 0 || item.stockOut > 0) ? (
                  <>
                    <div className="w-full h-[300px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsBarChart data={stockMovementData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`฿${Number(value).toFixed(2)}`, '']} />
                          <Bar dataKey="stockIn" fill="#82ca9d" name="รับเข้า" />
                          <Bar dataKey="stockOut" fill="#ff7300" name="เบิกออก" />
                        </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-center">
                <Button 
                  variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReportType('movements');
                          handleExportReport();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออกรายงานการเคลื่อนไหว
                </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลการเคลื่อนไหว</h3>
                    <p className="text-muted-foreground">ยังไม่มีการเคลื่อนไหวสต็อกในช่วงเวลาที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {reportType === 'sales' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">ยอดขาย vs การซื้อ</CardTitle>
              </CardHeader>
              <CardContent>
                {salesData.some(day => day.sales > 0 || day.purchases > 0) ? (
                  <>
                    <div className="w-full h-[300px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsLineChart data={salesData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(value) => [`฿${Number(value).toFixed(2)}`, '']} />
                          <Line type="monotone" dataKey="sales" stroke="#8884d8" strokeWidth={2} name="ยอดขาย" />
                          <Line type="monotone" dataKey="purchases" stroke="#82ca9d" strokeWidth={2} name="การซื้อ" />
                        </RechartsLineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-center">
                <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReportType('sales');
                          handleExportReport();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออกรายงานการขาย
                </Button>
              </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลการขาย</h3>
                    <p className="text-muted-foreground">ยังไม่มีการเคลื่อนไหวสต็อกใน 7 วันที่ผ่านมา</p>
            </div>
                )}
          </CardContent>
        </Card>
          )}


          {reportType === 'categories' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">การวิเคราะห์หมวดหมู่</CardTitle>
              </CardHeader>
              <CardContent>
                {inventoryData.some(cat => cat.value > 0) ? (
                  <>
                    <div className="w-full h-[300px] sm:h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            data={inventoryData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {inventoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setReportType('categories');
                          handleExportReport();
                        }}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        ส่งออกรายงานหมวดหมู่
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลหมวดหมู่</h3>
                    <p className="text-muted-foreground">ยังไม่มีหมวดหมู่ในระบบ</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Pagination */}
      {(reportType === 'inventory' || reportType === 'movements') && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredData.length / itemsPerPage)}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50]}
        />
      )}

      {/* Charts for inventory report */}
      {showCharts && reportType === 'inventory' && (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">สต็อกแยกตามหมวดหมู่</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryData.some(cat => cat.value > 0) ? (
                    <>
                      <div className="w-full h-[250px] sm:h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                            <Pie
                              data={inventoryData}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {inventoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                        </RechartsPieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-4 flex justify-center">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setReportType('categories');
                            handleExportReport();
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          ส่งออกรายงานหมวดหมู่
                        </Button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลสต็อก</h3>
                      <p className="text-muted-foreground">ยังไม่มีสินค้าในระบบ</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-gradient-card shadow-card">
                <CardHeader>
                  <CardTitle className="text-lg sm:text-xl">ระดับสต็อก</CardTitle>
                </CardHeader>
                <CardContent>
                  {inventoryData.some(cat => cat.value > 0) ? (
                    <div className="w-full h-[250px] sm:h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                      <RechartsBarChart data={inventoryData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                      </RechartsBarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">ไม่มีข้อมูลสต็อก</h3>
                      <p className="text-muted-foreground">ยังไม่มีสินค้าในระบบ</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
                  </div>
          )}
        </div>
        </div>
    </Layout>
  );
}
