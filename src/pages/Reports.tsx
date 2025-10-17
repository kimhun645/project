
import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, TrendingUp, Download, Package, DollarSign, AlertTriangle, 
  FolderOpen, RefreshCw, FileText, TrendingDown, Activity, Filter, 
  Calendar, BarChart, PieChart, LineChart, Search, Settings, 
  Eye, EyeOff, ChevronDown, ChevronRight, Clock, Users, 
  ShoppingCart, Truck, Warehouse, Zap, Target, Award, Printer
} from 'lucide-react';
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
  const { products, categories, movements, loading } = useStock();
  const { toast } = useToast();
  const [reportType, setReportType] = useState('inventory');
  const [timeRange, setTimeRange] = useState('7days');
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
  
  // เพิ่ม state สำหรับฟีเจอร์ใหม่
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [movementType, setMovementType] = useState<'all' | 'in' | 'out'>('all');

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

  // Generate detailed movement report data with advanced filtering
  const detailedMovementData = useMemo(() => {
    let filteredMovements = movements;
    
    // Filter by date range
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      filteredMovements = movements.filter(movement => {
        const movementDate = new Date(movement.created_at);
        return movementDate >= start && movementDate <= end;
      });
    }
    
    // Filter by product
    if (selectedProduct && selectedProduct !== 'all') {
      filteredMovements = filteredMovements.filter(movement => 
        movement.product_id === selectedProduct
      );
    }
    
    // Filter by category
    if (selectedCategory && selectedCategory !== 'all') {
      filteredMovements = filteredMovements.filter(movement => {
        const product = products.find(p => p.id === movement.product_id);
        return product?.category_id === selectedCategory;
      });
    }
    
    // Filter by movement type
    if (movementType !== 'all') {
      filteredMovements = filteredMovements.filter(movement => 
        movement.type === movementType
      );
    }
    
    return filteredMovements.map(movement => {
      const product = products.find(p => p.id === movement.product_id);
      const category = categories.find(c => c.id === product?.category_id);
      
      // ตรวจสอบและแก้ไขวันที่
      let formattedDate = 'ไม่ระบุวันที่';
      let formattedTime = 'ไม่ระบุเวลา';
      
      try {
        // ตรวจสอบฟิลด์วันที่หลายแบบ
        let dateValue = movement.created_at || movement.date || movement.createdAt;
        
        if (dateValue) {
          // แปลงเป็น Date object
          let date;
          if (typeof dateValue === 'string') {
            // ถ้าเป็น string ให้แปลงเป็น Date
            date = new Date(dateValue);
          } else if (dateValue.toDate) {
            // ถ้าเป็น Firestore Timestamp
            date = dateValue.toDate();
          } else if (dateValue.seconds) {
            // ถ้าเป็น object ที่มี seconds
            date = new Date(dateValue.seconds * 1000);
          } else {
            date = new Date(dateValue);
          }
          
          // ตรวจสอบว่าเป็นวันที่ที่ถูกต้อง
          if (!isNaN(date.getTime()) && date.getFullYear() > 1900) {
            formattedDate = date.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            formattedTime = date.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          } else {
            // ถ้าวันที่ไม่ถูกต้อง ให้ใช้วันที่ปัจจุบัน
            const now = new Date();
            formattedDate = now.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
            });
            formattedTime = now.toLocaleTimeString('th-TH', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            });
          }
        } else {
          // ถ้าไม่มีข้อมูลวันที่ ให้ใช้วันที่ปัจจุบัน
          const now = new Date();
          formattedDate = now.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          });
          formattedTime = now.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        }
      } catch (error) {
        // ถ้าเกิดข้อผิดพลาด ให้ใช้วันที่ปัจจุบัน
        const now = new Date();
        formattedDate = now.toLocaleDateString('th-TH', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        formattedTime = now.toLocaleTimeString('th-TH', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }

      // ตรวจสอบและแก้ไขราคา
      const unitPrice = product?.unit_price || 0;
      const totalValue = movement.quantity * unitPrice;

      // ตรวจสอบและแก้ไขเหตุผล
      let reason = 'ไม่ระบุเหตุผล';
      if (movement.reason) {
        // แก้ไข undefined ในเหตุผล
        reason = movement.reason.replace('undefined - ', '').replace('undefined', '');
        if (reason.trim() === '') {
          reason = 'ไม่ระบุเหตุผล';
        }
      }

      return {
        id: movement.id,
        date: formattedDate,
        time: formattedTime,
        productName: product?.name || 'ไม่พบสินค้า',
        productSku: product?.sku || 'ไม่พบ SKU',
        category: category?.name || 'ไม่ระบุหมวดหมู่',
        type: movement.type === 'in' ? 'รับเข้า' : 'เบิกออก',
        quantity: movement.quantity,
        unitPrice: unitPrice,
        totalValue: totalValue,
        reason: reason,
        createdBy: movement.created_by || 'ไม่ระบุผู้ดำเนินการ'
      };
    }).sort((a, b) => {
      // แก้ไขการเรียงลำดับให้ปลอดภัย
      try {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (!isNaN(dateA.getTime()) && !isNaN(dateB.getTime())) {
          return dateB.getTime() - dateA.getTime();
        }
        return 0;
      } catch (error) {
        console.error('Error sorting dates:', error);
        return 0;
      }
    });
  }, [movements, products, categories, startDate, endDate, selectedProduct, selectedCategory, movementType]);

  // Generate inventory summary data with enhanced stock tracking
  const inventorySummaryData = useMemo(() => {
    return products.map(product => {
      const category = categories.find(c => c.id === product.category_id);
      const productMovements = movements.filter(m => m.product_id === product.id);
      
      // Calculate movements by date range if specified
      let filteredMovements = productMovements;
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredMovements = productMovements.filter(movement => {
          const movementDate = new Date(movement.created_at);
          return movementDate >= start && movementDate <= end;
        });
      }
      
      const totalIn = filteredMovements
        .filter(m => m.type === 'in')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const totalOut = filteredMovements
        .filter(m => m.type === 'out')
        .reduce((sum, m) => sum + m.quantity, 0);
      
      const currentStock = product.current_stock || 0;
      const stockValue = currentStock * (product.unit_price || 0);
      
      // Calculate stock turnover rate
      const avgStock = (totalIn + currentStock) / 2;
      const turnoverRate = avgStock > 0 ? (totalOut / avgStock) : 0;
      
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
        turnoverRate: turnoverRate,
        status: currentStock <= (product.min_stock || 0) ? 'สต็อกต่ำ' : 
                currentStock <= (product.min_stock || 0) * 1.5 ? 'สต็อกต่ำ' : 'ปกติ',
        lastMovement: productMovements.length > 0 
          ? new Date(Math.max(...productMovements.map(m => new Date(m.created_at).getTime()))).toLocaleDateString('th-TH')
          : 'ไม่มีการเคลื่อนไหว',
        // เพิ่มข้อมูลประวัติการเคลื่อนไหว
        movementHistory: productMovements.slice(0, 5).map(m => ({
          date: new Date(m.created_at).toLocaleDateString('th-TH'),
          type: m.type === 'in' ? 'รับเข้า' : 'เบิกออก',
          quantity: m.quantity,
          reason: m.reason || 'ไม่ระบุเหตุผล'
        }))
      };
    });
  }, [products, categories, movements, startDate, endDate]);

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
          },
          {
            key: 'turnoverRate',
            title: 'อัตราการหมุนเวียน',
            sortable: true,
            render: (value) => (
              <div className="text-right">
                <span className="font-semibold text-sm text-blue-700">
                  {parseFloat(value?.toString() || '0').toFixed(2)}
                </span>
              </div>
            )
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
            key: 'time',
            title: 'เวลา',
            sortable: true,
            render: (value) => <div className="text-sm text-gray-600">{value}</div>
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

  const handlePrintInventoryReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const currentDate = new Date().toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const printContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>รายงานสินค้าคงเหลือ</title>
        <style>
          @page {
            size: A4;
            margin: 20mm;
          }
          
          body {
            font-family: 'Sarabun', 'TH Sarabun New', sans-serif;
            font-size: 14px;
            line-height: 1.4;
            color: #333;
            margin: 0;
            padding: 0;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 15px;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            color: #1e40af;
            margin: 0 0 10px 0;
          }
          
          .header h2 {
            font-size: 18px;
            font-weight: normal;
            color: #374151;
            margin: 0 0 5px 0;
          }
          
          .header .date {
            font-size: 16px;
            color: #6b7280;
            margin: 0;
          }
          
          .table-container {
            width: 100%;
            overflow: hidden;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          th {
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            color: white;
            padding: 12px 8px;
            text-align: center;
            font-weight: bold;
            font-size: 14px;
            border: 1px solid #1e40af;
          }
          
          td {
            padding: 10px 8px;
            border: 1px solid #d1d5db;
            text-align: center;
            font-size: 13px;
          }
          
          tr:nth-child(even) {
            background-color: #f8fafc;
          }
          
          tr:hover {
            background-color: #e0f2fe;
          }
          
          .number {
            text-align: right;
            font-weight: 500;
          }
          
          .sku {
            font-family: 'Courier New', monospace;
            font-weight: bold;
            color: #1e40af;
          }
          
          .product-name {
            text-align: left;
            font-weight: 500;
          }
          
          .category {
            color: #059669;
            font-weight: 500;
          }
          
          .stock {
            font-weight: bold;
            color: #dc2626;
          }
          
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
            padding-top: 15px;
          }
          
          @media print {
            body { -webkit-print-color-adjust: exact; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>รายงานสินค้าคงเหลือ</h1>
          <h2>ณ วันที่ ${currentDate}</h2>
          <p class="date">ศูนย์จัดการธนบัตร นครราชสีมา</p>
        </div>
        
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th style="width: 8%;">ลำดับที่</th>
                <th style="width: 15%;">รหัส SKU</th>
                <th style="width: 35%;">ชื่อสินค้า</th>
                <th style="width: 20%;">หมวดหมู่</th>
                <th style="width: 22%;">สต๊อกปัจจุบัน</th>
              </tr>
            </thead>
            <tbody>
              ${inventorySummaryData.map((item, index) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td class="sku">${item.sku || '-'}</td>
                  <td class="product-name">${item.name || '-'}</td>
                  <td class="category">${item.category || '-'}</td>
                  <td class="stock">${item.currentStock || 0}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
          <p>จำนวนรายการทั้งหมด: ${inventorySummaryData.length} รายการ</p>
        </div>
        
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
  };

  const handleExportReport = () => {
    try {
      // Create report data based on current selection
      let reportData = [];
      let fileName = '';
      let reportTitle = '';
      
      switch (reportType) {
        case 'inventory':
          handlePrintInventoryReport();
          return;
          
        case 'movements':
          fileName = `รายงานการเบิก/การรับพัสดุ_${new Date().toISOString().split('T')[0]}.csv`;
          reportTitle = 'รายงานการเบิก/การรับพัสดุ';
          reportData = detailedMovementData.map(item => ({
            'วันที่': item.date,
            'เวลา': item.time,
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
          startDate && endDate ? `ช่วงวันที่: ${startDate} ถึง ${endDate}` : '',
          selectedProduct && selectedProduct !== 'all' ? `สินค้า: ${products.find(p => p.id === selectedProduct)?.name || 'ไม่ระบุ'}` : '',
          selectedCategory && selectedCategory !== 'all' ? `หมวดหมู่: ${categories.find(c => c.id === selectedCategory)?.name || 'ไม่ระบุ'}` : '',
          movementType !== 'all' ? `ประเภทการเคลื่อนไหว: ${movementType === 'in' ? 'รับเข้าเท่านั้น' : 'เบิกออกเท่านั้น'}` : '',
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
          ),
          '', // Empty line
          'สรุปข้อมูล:',
          reportType === 'inventory' ? [
            `มูลค่าสต็อกรวม: ฿${inventorySummaryData.reduce((sum, item) => sum + item.stockValue, 0).toLocaleString('th-TH')}`,
            `จำนวนสินค้าที่สต็อกต่ำ: ${inventorySummaryData.filter(item => item.status === 'สต็อกต่ำ').length} รายการ`,
            `อัตราการหมุนเวียนเฉลี่ย: ${(inventorySummaryData.reduce((sum, item) => sum + item.turnoverRate, 0) / inventorySummaryData.length).toFixed(2)}`
          ].join('\n') : '',
          reportType === 'movements' ? [
            `จำนวนการเคลื่อนไหวทั้งหมด: ${detailedMovementData.length} รายการ`,
            `มูลค่ารับเข้าทั้งหมด: ฿${detailedMovementData.filter(item => item.type === 'รับเข้า').reduce((sum, item) => sum + item.totalValue, 0).toLocaleString('th-TH')}`,
            `มูลค่าเบิกออกทั้งหมด: ฿${detailedMovementData.filter(item => item.type === 'เบิกออก').reduce((sum, item) => sum + item.totalValue, 0).toLocaleString('th-TH')}`
          ].join('\n') : ''
        ].filter(line => line !== '').join('\n');
        
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
  
  // Debug logging
  console.log('📊 Reports Debug Info:', {
    reportType,
    totalProducts,
    totalMovements,
    filteredDataLength: filteredData.length,
    inventorySummaryDataLength: inventorySummaryData.length,
    detailedMovementDataLength: detailedMovementData.length,
    products: products.slice(0, 3), // Show first 3 products for debugging
    movements: movements.slice(0, 3), // Show first 3 movements for debugging
    searchTerm,
    startDate,
    endDate,
    selectedProduct,
    selectedCategory,
    movementType
  });

  // ตรวจสอบสถานะการโหลดข้อมูล
  useEffect(() => {
    console.log('🔍 ตรวจสอบสถานะข้อมูล:', {
      productsCount: products.length,
      categoriesCount: categories.length,
      movementsCount: movements.length,
      isAuthenticated: true, // ควรมาจาก AuthContext
      loading: false // ควรมาจาก StockContext
    });
  }, [products, categories, movements]);
  
  // Additional debug for inventory data
  if (reportType === 'inventory') {
    console.log('📦 Inventory Debug:', {
      inventorySummaryData: inventorySummaryData.slice(0, 3),
      filteredData: filteredData.slice(0, 3),
      paginatedData: paginatedData.slice(0, 3),
      movementsCount: movements.length,
      productsCount: products.length,
      categoriesCount: categories.length
    });
  }

  // Debug movements data
  console.log('🔄 Movements Debug:', {
    totalMovements: movements.length,
    withdrawalMovements: movements.filter(m => m.reason?.includes('การเบิก')).length,
    receiptMovements: movements.filter(m => m.reason?.includes('การรับ')).length,
    sampleMovements: movements.slice(0, 3).map(m => ({
      id: m.id,
      product_id: m.product_id,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason
    }))
  });

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
      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full space-y-6 pb-8 px-4 sm:px-6 lg:px-8">
          
          {/* Modern Header */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl">
                  <BarChart3 className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">รายงานและการวิเคราะห์</h1>
                  <p className="text-gray-600 mt-1">ดูข้อมูลและสถิติของระบบจัดการสินค้า</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFilter}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                showFilters 
                      ? 'bg-blue-500 text-white border-blue-500 shadow-lg' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <Filter className="h-4 w-4 mr-2" />
              ตัวกรอง
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleCharts}
                  className={`h-10 px-4 rounded-lg transition-all duration-200 ${
                showCharts 
                      ? 'bg-green-500 text-white border-green-500 shadow-lg' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
              }`}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
                  กราฟ
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
                  className="h-10 px-4 rounded-lg bg-white border-gray-200 hover:bg-gray-50 text-gray-700 transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              รีเฟรช
            </Button>
            <Button 
              size="sm"
              onClick={handleExportReport}
                  className="h-10 px-4 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg transition-all duration-200"
            >
              <Printer className="h-4 w-4 mr-2" />
                  {reportType === 'inventory' ? 'พิมพ์' : 'ส่งออก'}
            </Button>
          </div>
            </div>
          </div>

      {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((card, index) => (
              <Card key={index} className="bg-white rounded-xl shadow-lg border-0 overflow-hidden hover:shadow-xl transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          {index === 0 && "สินค้าทั้งหมด"}
                          {index === 1 && "มูลค่ารวม"}
                          {index === 2 && "ต้องเติมสต็อก"}
                          {index === 3 && "หมวดหมู่"}
                        </Badge>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg transition-all duration-300 group-hover:scale-110 ${
                      card.color === 'teal' ? 'bg-teal-100 text-teal-600' :
                      card.color === 'purple' ? 'bg-purple-100 text-purple-600' :
                      card.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                      card.color === 'green' ? 'bg-green-100 text-green-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {card.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl shadow-lg border border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-full">
                    <RefreshCw className="h-6 w-6 text-blue-600 animate-spin" />
              </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-blue-800 mb-1">กำลังโหลดข้อมูล...</h3>
                    <p className="text-blue-700">กรุณารอสักครู่ กำลังดึงข้อมูลจาก Firestore</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* No Data Warning - แสดงเฉพาะเมื่อไม่มีข้อมูลจริง */}
          {!loading && products.length === 0 && (
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl shadow-lg border border-yellow-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-yellow-800 mb-1">ยังไม่มีข้อมูลในระบบ</h3>
                    <p className="text-yellow-700">กรุณาเพิ่มสินค้าและหมวดหมู่ในระบบก่อนดูรายงาน</p>
                    <div className="mt-2 text-sm text-yellow-600">
                      <p>ข้อมูลที่ตรวจสอบ:</p>
                      <ul className="list-disc list-inside ml-4">
                        <li>สินค้า: {products.length} รายการ</li>
                        <li>หมวดหมู่: {categories.length} รายการ</li>
                        <li>การเคลื่อนไหว: {movements.length} รายการ</li>
                      </ul>
                    </div>
                  </div>
                  <Button
                    onClick={() => window.location.href = '/products'}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white"
                  >
                    <Package className="h-4 w-4 mr-2" />
                    เพิ่มสินค้า
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl shadow-lg border border-blue-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">การดำเนินการด่วน</CardTitle>
              <p className="text-gray-600">เครื่องมือที่ใช้บ่อยสำหรับการวิเคราะห์ข้อมูล</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2 bg-white hover:bg-blue-50 border-blue-200 hover:border-blue-300"
                  onClick={() => {
                    setReportType('inventory');
                    setShowFilters(true);
                  }}
                >
                  <Warehouse className="h-6 w-6 text-blue-600" />
                  <span className="text-sm font-medium">ยอดคงเหลือ</span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-16 flex-col gap-2 bg-white hover:bg-green-50 border-green-200 hover:border-green-300"
                  onClick={() => {
                    setReportType('movements');
                    setShowFilters(true);
                  }}
                >
                  <Activity className="h-6 w-6 text-green-600" />
                  <span className="text-sm font-medium">การเคลื่อนไหว</span>
                </Button>
                
              </div>
            </CardContent>
          </Card>

          {/* Report Type Selection */}
          <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">เลือกประเภทรายงาน</CardTitle>
              <p className="text-gray-600">เลือกประเภทรายงานที่ต้องการดู</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Inventory Report */}
                <div 
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    reportType === 'inventory' 
                      ? 'border-blue-500 bg-blue-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-blue-300'
                  }`}
                  onClick={() => setReportType('inventory')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      reportType === 'inventory' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Warehouse className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">ยอดสินค้าคงเหลือ</h3>
                      <p className="text-sm text-gray-600">ดูสต็อกสินค้าทั้งหมด</p>
                    </div>
                  </div>
                </div>

                {/* Movements Report */}
                <div 
                  className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-lg ${
                    reportType === 'movements' 
                      ? 'border-green-500 bg-green-50 shadow-lg' 
                      : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                  onClick={() => setReportType('movements')}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      reportType === 'movements' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      <Activity className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">การเบิก/การรับ</h3>
                      <p className="text-sm text-gray-600">ประวัติการเคลื่อนไหว</p>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">ตัวกรองขั้นสูง</CardTitle>
                <p className="text-gray-600">ปรับแต่งการแสดงผลตามต้องการ</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Basic Filters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">ช่วงเวลา</Label>
                <Select value={dateRange} onValueChange={(value) => setDateRange(value as 'daily' | 'monthly' | 'yearly')}>
                        <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="daily">รายวัน (30 วัน)</SelectItem>
                    <SelectItem value="monthly">รายเดือน (12 เดือน)</SelectItem>
                    <SelectItem value="yearly">รายปี (5 ปี)</SelectItem>
                </SelectContent>
              </Select>
              </div>
              
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">ประเภทกราฟ</Label>
                <Select value={chartType} onValueChange={(value) => setChartType(value as 'bar' | 'line' | 'pie')}>
                        <SelectTrigger className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="bar">แท่ง</SelectItem>
                    <SelectItem value="line">เส้น</SelectItem>
                    <SelectItem value="pie">วงกลม</SelectItem>
                </SelectContent>
              </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">ค้นหา</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="ค้นหาสินค้าหรือข้อมูล..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Advanced Filters */}
                  <div className="border-t pt-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">ตัวกรองเพิ่มเติม</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Date Range Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">ช่วงวันที่</Label>
                        <div className="space-y-2">
                          <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full"
                            placeholder="วันที่เริ่มต้น"
                          />
                          <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="w-full"
                            placeholder="วันที่สิ้นสุด"
                          />
                        </div>
                      </div>

                      {/* Product Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">สินค้า</Label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="เลือกสินค้า" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {products.map(product => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} ({product.sku})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Category Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">หมวดหมู่</Label>
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="เลือกหมวดหมู่" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            {categories.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Movement Type Filter */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">ประเภทการเคลื่อนไหว</Label>
                        <Select value={movementType} onValueChange={(value) => setMovementType(value as 'all' | 'in' | 'out')}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">ทั้งหมด</SelectItem>
                            <SelectItem value="in">รับเข้าเท่านั้น</SelectItem>
                            <SelectItem value="out">เบิกออกเท่านั้น</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Clear Filters Button */}
                    <div className="flex justify-end mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setStartDate('');
                          setEndDate('');
                          setSelectedProduct('all');
                          setSelectedCategory('all');
                          setMovementType('all');
                          setSearchTerm('');
                        }}
                        className="px-6"
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        ล้างตัวกรอง
                      </Button>
                    </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Table */}
      {(reportType === 'inventory' || reportType === 'movements') && (
            <>
              {!loading && products.length > 0 && filteredData.length > 0 ? (
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-gray-900">
                          {reportType === 'inventory' ? "รายงานยอดสินค้าคงเหลือ" : "รายงานการเบิก/การรับ"}
                        </CardTitle>
                        <p className="text-gray-600 mt-1">พบ {filteredData.length} รายการ</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="px-3 py-1">
                          <Activity className="h-4 w-4 mr-1" />
                          {filteredData.length} รายการ
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleExportReport}
                          className="px-4"
                        >
                          {reportType === 'inventory' ? (
                            <>
                              <Printer className="h-4 w-4 mr-2" />
                              พิมพ์
                            </>
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-2" />
                              ส่งออก
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
        <DataTable
                      title=""
                      description=""
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
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                  <CardContent className="p-12">
                    <div className="text-center">
                      <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                        <Package className="h-10 w-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {reportType === 'inventory' ? "ไม่พบข้อมูลสินค้า" : "ไม่พบข้อมูลการเคลื่อนไหว"}
                      </h3>
                      <p className="text-gray-600 mb-6 max-w-md mx-auto">
                        {reportType === 'inventory' 
                          ? products.length === 0 
                            ? "ยังไม่มีสินค้าในระบบ กรุณาเพิ่มสินค้าก่อนดูรายงาน"
                            : "ไม่พบข้อมูลสินค้าตามตัวกรองที่เลือก ลองเปลี่ยนตัวกรองหรือล้างตัวกรอง"
                          : movements.length === 0
                            ? "ยังไม่มีการเคลื่อนไหวสินค้าในระบบ กรุณาเพิ่มการเบิก/รับสินค้าก่อนดูรายงาน"
                            : "ไม่พบข้อมูลการเคลื่อนไหวตามตัวกรองที่เลือก ลองเปลี่ยนตัวกรองหรือล้างตัวกรอง"
                        }
                      </p>
                      <div className="flex justify-center gap-3">
                        <Button
                          onClick={handleRefresh}
                          variant="outline"
                          className="px-6"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          รีเฟรช
                        </Button>
                        {reportType === 'inventory' && products.length === 0 && (
                          <Button
                            onClick={() => window.location.href = '/products'}
                            className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            เพิ่มสินค้า
                          </Button>
                        )}
                        {reportType === 'movements' && movements.length === 0 && (
                          <Button
                            onClick={() => window.location.href = '/movements'}
                            className="px-6 bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white"
                          >
                            <Activity className="h-4 w-4 mr-2" />
                            เพิ่มการเคลื่อนไหว
                          </Button>
                        )}
                        {(reportType === 'inventory' && products.length > 0) || (reportType === 'movements' && movements.length > 0) ? (
                          <Button
                            onClick={() => {
                              setStartDate('');
                              setEndDate('');
                              setSelectedProduct('all');
                              setSelectedCategory('all');
                              setMovementType('all');
                              setSearchTerm('');
                            }}
                            className="px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
                          >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            ล้างตัวกรอง
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Show data for other report types */}
          {false && (
            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  {reportType === 'sales' && "รายงานการขาย"}
                  {reportType === 'categories' && "การวิเคราะห์หมวดหมู่"}
                </CardTitle>
                <p className="text-gray-600">
                  {reportType === 'sales' && "ดูกราฟและสถิติการขาย"}
                  {reportType === 'categories' && "วิเคราะห์ข้อมูลแยกตามหมวดหมู่"}
                </p>
              </CardHeader>
              <CardContent className="p-8">
                <div className="text-center">
                  <div className="p-4 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                    <BarChart3 className="h-10 w-10 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {reportType === 'sales' && "รายงานการขาย"}
                    {reportType === 'categories' && "การวิเคราะห์หมวดหมู่"}
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {reportType === 'sales' && "ใช้ปุ่ม 'เรียกดูชาร์ท' เพื่อดูกราฟการขายและสถิติ"}
                    {reportType === 'categories' && "ใช้ปุ่ม 'เรียกดูชาร์ท' เพื่อดูการวิเคราะห์หมวดหมู่"}
                  </p>
                  <div className="flex justify-center gap-3">
                    <Button
                      onClick={handleToggleCharts}
                      className="px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      เรียกดูชาร์ท
                    </Button>
                    <Button
                      onClick={handleExportReport}
                      variant="outline"
                      className="px-6"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      ส่งออก
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
      )}

      {/* Charts for other report types */}
      {showCharts && reportType !== 'inventory' && (
        <div className="space-y-6">
          {reportType === 'movements' && (
            <Card className="bg-gradient-card shadow-card">
              <CardHeader>
                <CardTitle className="text-lg sm:text-xl">การเบิก/การรับพัสดุตามช่วงเวลา</CardTitle>
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
                    <p className="text-muted-foreground">ยังไม่มีการเบิก/การรับพัสดุในช่วงเวลาที่เลือก</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {false && reportType === 'sales' && (
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
                    <p className="text-muted-foreground">ยังไม่มีการเบิก/การรับพัสดุใน 7 วันที่ผ่านมา</p>
            </div>
                )}
          </CardContent>
        </Card>
          )}


          {false && reportType === 'categories' && (
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

      {/* Charts for inventory report - Disabled */}
      {false && showCharts && reportType === 'inventory' && (
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
