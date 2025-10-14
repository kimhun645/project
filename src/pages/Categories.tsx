
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileEdit as Edit, Trash2, Pill, BarChart3, TrendingUp, Layers, Package, Filter } from 'lucide-react';
import { type Category } from '@/lib/firestoreService';
import { AddCategoryDialog } from '@/components/Dialogs/AddCategoryDialog';
import { EditCategoryDialog } from '@/components/Dialogs/EditCategoryDialog';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import {
  ProductsStylePageLayout,
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  ProductsStyleBulkActionsBar,
  ProductsStyleDataTable,
  ProductsStylePagination,
  ProductsStyleDeleteConfirmationDialog,
  type StatCard,
  type ProductsStyleTableColumn
} from '@/components/ui/shared-components';

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Pagination and view state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Bulk actions state
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');
  
  const { toast } = useToast();

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for category when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาหมวดหมู่: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  // Filter categories based on search and type filter
  const filteredCategories = categories.filter(category => {
    if (!category || !category.id) return false; // Skip invalid categories
    
    const matchesSearch = !searchTerm || 
      (category.name && category.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesType = typeFilter === 'all' || 
      (typeFilter === 'medicine' && category.is_medicine) ||
      (typeFilter === 'non-medicine' && !category.is_medicine);
    
    return matchesSearch && matchesType;
  });

  // Sort categories
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!a || !b) return 0; // Skip invalid items
    
    let aValue = a[sortField as keyof Category];
    let bValue = b[sortField as keyof Category];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = sortedCategories.slice(startIndex, endIndex);

  // Bulk actions handlers
  const handleSelectCategory = (categoryId: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCategories(paginatedCategories.map(cat => cat.id));
    } else {
      setSelectedCategories([]);
    }
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      for (const categoryId of selectedCategories) {
        await FirestoreService.deleteCategory(categoryId);
      }

      toast({
        title: "สำเร็จ",
        description: `ลบหมวดหมู่ ${selectedCategories.length} รายการสำเร็จแล้ว`,
      });

      setSelectedCategories([]);
      fetchCategories();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      const categoriesData = await FirestoreService.getCategories();
      const productsData = await FirestoreService.getProducts();

      const counts: Record<string, number> = {};
      productsData.forEach(product => {
        counts[product.category_id] = (counts[product.category_id] || 0) + 1;
      });

      setCategories(categoriesData || []);
      setProductCounts(counts);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลหมวดหมู่ได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleDeleteCategory = async (categoryOrId: string | Category) => {
    try {
      const categoryId = typeof categoryOrId === 'string' ? categoryOrId : categoryOrId.id;
      const productCount = productCounts[categoryId] || 0;
      if (productCount > 0) {
        toast({
          title: "ไม่สามารถลบได้",
          description: `หมวดหมู่นี้มีสินค้า ${productCount} รายการ กรุณาย้ายสินค้าไปหมวดหมู่อื่นก่อน`,
          variant: "destructive",
        });
        return;
      }

      const { FirestoreService } = await import('@/lib/firestoreService');
        await FirestoreService.deleteCategory(categoryId);

      toast({
        title: "สำเร็จ",
        description: "ลบหมวดหมู่สำเร็จแล้ว",
      });

      fetchCategories();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบหมวดหมู่ได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const totalCategories = categories.length;
  const medicineCategories = categories.filter(c => c.is_medicine).length;
  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);
  
  // Calculate efficiency based on actual data
  const calculateEfficiency = () => {
    if (totalCategories === 0) return 0;
    
    // Base efficiency on category utilization and medicine category ratio
    const categoryUtilization = Math.min(totalProducts / (totalCategories * 10), 1); // Assume 10 products per category is optimal
    const medicineRatio = medicineCategories > 0 ? Math.min(medicineCategories / totalCategories, 0.3) : 0; // Medicine categories should be max 30%
    const efficiency = (categoryUtilization * 0.7 + medicineRatio * 0.3) * 100;
    
    return Math.round(efficiency);
  };
  
  const efficiency = calculateEfficiency();
  
  // Calculate trend based on recent activity (mock calculation)
  const calculateTrend = () => {
    if (totalProducts === 0) return { value: "0%", isPositive: true };
    
    // Simple trend calculation based on product distribution
    const avgProductsPerCategory = totalProducts / Math.max(totalCategories, 1);
    const trendValue = Math.min(Math.round(avgProductsPerCategory * 2), 25); // Max 25% trend
    
    return {
      value: `${trendValue}%`,
      isPositive: trendValue > 0
    };
  };
  
  const trend = calculateTrend();

  // Define columns for data table
  const columns: ProductsStyleTableColumn[] = [
    {
      key: 'name',
      title: 'ชื่อหมวดหมู่',
      sortable: true,
      render: (cellValue: any, category: Category) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{category.name || 'ไม่มีชื่อ'}</span>
          {category?.is_medicine && (
            <Pill className="h-4 w-4 text-green-600" title="หมวดหมู่ยา" />
          )}
        </div>
      )
    },
    {
      key: 'description',
      title: 'คำอธิบาย',
      sortable: true,
      render: (cellValue: any, category: Category) => (
        <span className="text-sm text-muted-foreground">
          {category?.description || 'ไม่มีคำอธิบาย'}
        </span>
      )
    },
    {
      key: 'product_count',
      title: 'จำนวนสินค้า',
      sortable: true,
      render: (cellValue: any, category: Category) => {
        if (!category?.id) return <span className="text-sm text-muted-foreground">-</span>;
        const count = productCounts[category.id] || 0;
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            {count.toLocaleString()} สินค้า
          </Badge>
        );
      }
    },
    {
      key: 'is_medicine',
      title: 'ประเภท',
      sortable: true,
      render: (cellValue: any, category: Category) => (
        category?.is_medicine ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            ยา
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">
            ทั่วไป
          </Badge>
        )
      )
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (cellValue: any, category: Category) => (
        <div className="flex items-center gap-1">
          {category?.id ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditCategory(category)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteCategory(category.id)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">-</span>
          )}
        </div>
      )
    }
  ];

  // Define stats cards
  const statsCards: StatCard[] = [
    {
      title: "หมวดหมู่ทั้งหมด",
      value: totalCategories.toString(),
      icon: <BarChart3 className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "หมวดหมู่ยา",
      value: medicineCategories.toString(),
      icon: <Pill className="h-6 w-6" />,
      color: medicineCategories > 0 ? "green" : "red"
    },
    {
      title: "สินค้ารวม",
      value: totalProducts.toLocaleString(),
      icon: <Package className="h-6 w-6" />,
      color: "purple"
    },
    {
      title: "ประสิทธิภาพ",
      value: `${efficiency}%`,
      icon: <TrendingUp className="h-6 w-6" />,
      color: efficiency >= 80 ? "green" : efficiency >= 60 ? "orange" : "red"
    }
  ];

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="หมวดหมู่สินค้า"
        description="จัดการและจัดหมวดหมู่สินค้าอย่างเป็นระบบ"
        icon={Layers}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="ค้นหาหมวดหมู่ ชื่อหรือคำอธิบาย..."
        scannerDetected={scannerDetected}
        primaryAction={
          <AddCategoryDialog onCategoryAdded={fetchCategories} />
        }
        secondaryActions={[
          <Button
            key="filter"
            variant="outline"
            size="sm"
            onClick={() => setShowFilterDialog(true)}
            className="h-9 px-4 rounded-xl border-2 border-purple-200 hover:border-purple-300 bg-white/80 backdrop-blur-sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            ตัวกรอง
          </Button>
        ]}
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Bulk Actions Bar */}
      {selectedCategories.length > 0 && (
        <ProductsStyleBulkActionsBar
          selectedCount={selectedCategories.length}
          onClearSelection={() => setSelectedCategories([])}
          onExport={() => {/* TODO: Implement export functionality */}}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Data Table */}
      <ProductsStyleDataTable
        title="รายการหมวดหมู่"
        description="จัดการหมวดหมู่สินค้าทั้งหมดในระบบ"
        data={paginatedCategories || []}
        columns={columns}
        currentViewMode={viewMode || 'table'}
        onViewModeChange={setViewMode}
        onSort={handleSort}
        onRefresh={fetchCategories}
        onClearSelection={() => setSelectedCategories([])}
        selectedItems={selectedCategories || []}
        onSelectItem={handleSelectCategory}
        onSelectAll={handleSelectAll}
        onEdit={(category) => category && handleEditCategory(category)}
        onDelete={handleDeleteCategory}
        onFilter={() => setShowFilterDialog(true)}
        sortField={sortField || 'name'}
        sortDirection={sortDirection || 'asc'}
        loading={isLoading || false}
        emptyMessage="ไม่พบข้อมูลหมวดหมู่ที่ตรงกับการค้นหา"
        getItemId={(item) => item?.id || 'unknown'}
        getItemName={(item) => item.name || 'ไม่มีชื่อ'}
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        filterDialog={
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                ตัวกรองหมวดหมู่
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                เลือกตัวกรองเพื่อค้นหาหมวดหมู่ตามที่ต้องการ
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ประเภทหมวดหมู่</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full h-11 text-base border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 bg-white/90 backdrop-blur-sm font-medium transition-all duration-300 focus-ring rounded-2xl">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-2xl">
                    <SelectItem value="all" className="text-base font-medium py-3">ทุกประเภท</SelectItem>
                    <SelectItem value="medicine" className="text-base font-medium py-3">หมวดหมู่ยา</SelectItem>
                    <SelectItem value="non-medicine" className="text-base font-medium py-3">หมวดหมู่ทั่วไป</SelectItem>
                  </SelectContent>
                </Select>
       </div>
     </div>
            
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowFilterDialog(false)}
                className="px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300"
              >
                ปิด
              </Button>
              <Button
                onClick={() => {
                  setShowFilterDialog(false);
                  setCurrentPage(1);
                }}
                className="px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                ใช้ตัวกรอง
              </Button>
            </div>
          </DialogContent>
        }
      />

      {/* Pagination */}
      <ProductsStylePagination
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        totalItems={sortedCategories.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[5, 10, 20, 50]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="ยืนยันการลบ"
        description="คุณแน่ใจหรือไม่ที่จะลบหมวดหมู่ที่เลือก?"
        itemName="หมวดหมู่"
        itemCount={selectedCategories.length}
      />

     {/* Edit Category Dialog */}
     <EditCategoryDialog
       category={editingCategory}
       open={editDialogOpen}
       onOpenChange={setEditDialogOpen}
       onCategoryUpdated={fetchCategories}
     />
    </ProductsStylePageLayout>
 );
}
