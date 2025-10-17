import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileEdit as Edit, Trash2, Package, BarChart3, TrendingUp, AlertTriangle, Eye, Filter, RefreshCw, Download, Upload, Grid3x3 as Grid3X3, List, CheckSquare, Square, MoreVertical, Copy, Star, Heart, Tag, DollarSign, MapPin, Building2 } from 'lucide-react';
import { type Product } from '@/lib/firestoreService';
import { AddProductDialog } from '@/components/Dialogs/AddProductDialog';
import { EditProductDialog } from '@/components/Dialogs/EditProductDialog';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { useAuth } from '@/contexts/AuthContext';
import { useStock } from '@/contexts/StockContext';
import { GlobalSearch } from '@/components/Search/GlobalSearch';
import {
  ProductsStylePageLayout,
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  ProductsStyleBulkActionsBar,
  ProductsStyleDataTable,
  ProductsStylePagination,
  ProductsStyleDeleteConfirmationDialog,
  type StatCard,
  type TableColumn
} from '@/components/ui/shared-components';

interface ProductWithCategory extends Product {
  categories?: { name: string };
  suppliers?: { name: string };
}

export default function Products() {
  const { toast } = useToast();
  const { currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithCategory | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<ProductWithCategory | null>(null);
  
  // Pagination and sorting states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<keyof ProductWithCategory>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for product when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาสินค้า: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
    const matchesSearch = 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    
    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = (product.current_stock || 0) <= (product.min_stock || 0);
    } else if (stockFilter === 'out') {
      matchesStock = (product.current_stock || 0) === 0;
    } else if (stockFilter === 'normal') {
      matchesStock = (product.current_stock || 0) > (product.min_stock || 0);
    }
    
    return matchesSearch && matchesCategory && matchesStock;
    })
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Handle sorting
  const handleSort = (field: keyof ProductWithCategory) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle items per page change
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Handle product selection
  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedProducts.length === paginatedProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;

    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // เตรียม userInfo สำหรับ logging
      const userInfo = currentUser ? {
        userId: currentUser.id,
        userName: currentUser.displayName || 'Unknown User',
        userRole: 'admin' // หรือดึงจาก currentUser.role ถ้ามี
      } : undefined;
      
      for (const productId of selectedProducts) {
        await FirestoreService.deleteProduct(productId, userInfo);
      }

      toast({
        title: "สำเร็จ",
        description: `ลบสินค้า ${selectedProducts.length} รายการสำเร็จแล้ว`,
      });

      fetchProducts();
      setSelectedProducts([]);
    } catch (error) {
      console.error('Error deleting products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const fetchProducts = async () => {
    try {
      if (refreshData) {
        await refreshData();
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลสินค้าได้",
        variant: "destructive",
      });
    }
  };

  const handleEditProduct = (product: ProductWithCategory) => {
    setEditingProduct(product);
    setEditDialogOpen(true);
  };

  const handleDeleteProduct = (product: ProductWithCategory) => {
    console.log('Deleting product - full object:', JSON.stringify(product, null, 2));
    console.log('Product keys:', Object.keys(product));
    console.log('Product ID:', product.id);

    const productId = product.id || (product as any).documentId;

    if (!product || !productId) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบข้อมูลสินค้าที่ต้องการลบ",
        variant: "destructive",
      });
      return;
    }

    const productWithId = { ...product, id: productId };
    setProductToDelete(productWithId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    if (!productToDelete.id) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่พบรหัสสินค้า",
        variant: "destructive",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      return;
    }

    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // เตรียม userInfo สำหรับ logging
      const userInfo = currentUser ? {
        userId: currentUser.id,
        userName: currentUser.displayName || 'Unknown User',
        userRole: 'admin' // หรือดึงจาก currentUser.role ถ้ามี
      } : undefined;
      
      await FirestoreService.deleteProduct(productToDelete.id, userInfo);

      toast({
        title: "สำเร็จ",
        description: `ลบสินค้า "${productToDelete.name}" สำเร็จแล้ว`,
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบสินค้าได้",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  // ใช้ข้อมูลจาก StockContext แทนการ fetch เอง
  const stockContext = useStock();
  const products = stockContext?.products || [];
  const categories = stockContext?.categories || [];
  const refreshData = stockContext?.refreshData;

  // Calculate stats
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0)).length;
  const outOfStockProducts = products.filter(p => (p.current_stock || 0) === 0).length;
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.unit_price || 0)), 0);
  const normalStockProducts = totalProducts - lowStockProducts - outOfStockProducts;

  // Define columns for data table
  const columns: TableColumn[] = [
    {
      key: 'id',
      title: 'เลขที่รายการ',
      sortable: false,
      render: (value, product) => {
        // หา index ของรายการใน filteredProducts ทั้งหมด
        const productIndex = filteredProducts.findIndex(p => p.id === product.id);
        const rowNumber = productIndex + 1;
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-slate-600">
              #{rowNumber}
            </span>
          </div>
        );
      }
    },
    {
      key: 'name',
      title: 'ชื่อสินค้า',
      sortable: true,
      render: (value, product) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{product?.name || 'Unknown'}</span>
          {product?.sku && (
            <Badge variant="outline" className="text-xs">
              {product.sku}
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'category_id',
      title: 'หมวดหมู่',
      sortable: true,
      render: (value, product) => (
        <span className="text-sm text-muted-foreground">
          {product?.category_name || '-'}
        </span>
      )
    },
    {
      key: 'current_stock',
      title: 'สต็อกปัจจุบัน',
      sortable: true,
      render: (value, product) => {
        const stock = product?.current_stock || 0;
        const minStock = product?.min_stock || 0;
        const isLowStock = stock <= minStock;
        const isOutOfStock = stock === 0;
        
        return (
          <div className="flex items-center gap-2">
            <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-green-600'}`}>
              {stock.toLocaleString()}
            </span>
            {isOutOfStock && <AlertTriangle className="h-4 w-4 text-red-500" />}
            {isLowStock && !isOutOfStock && <AlertTriangle className="h-4 w-4 text-orange-500" />}
          </div>
        );
      }
    },
    {
      key: 'unit_price',
      title: 'ราคาต่อหน่วย',
      sortable: true,
      render: (value, product) => (
        <span className="text-sm text-muted-foreground">
          {product?.unit_price ? `฿${product.unit_price.toLocaleString()}` : '-'}
        </span>
      )
    },
    {
      key: 'supplier_id',
      title: 'ผู้จัดหา',
      sortable: true,
      render: (value, product) => (
        <span className="text-sm text-muted-foreground">
          {product?.supplier_name || '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (value, product) => (
        <div className="flex items-center gap-1">
          {product?.id ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditProduct(product)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteProduct(product)}
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
      title: "สินค้าทั้งหมด",
      value: totalProducts.toString(),
      icon: <Package className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "สต็อกต่ำ",
      value: lowStockProducts.toString(),
      icon: <AlertTriangle className="h-6 w-6" />,
      color: lowStockProducts > 0 ? "orange" : "green"
    },
    {
      title: "สต็อกหมด",
      value: outOfStockProducts.toString(),
      icon: <AlertTriangle className="h-6 w-6" />,
      color: outOfStockProducts > 0 ? "red" : "green"
    },
    {
      title: "มูลค่ารวม",
      value: `฿${totalValue.toLocaleString()}`,
      icon: <DollarSign className="h-6 w-6" />,
      color: "purple"
    }
  ];

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="สินค้า"
        searchPlaceholder="ค้นหาสินค้า ชื่อ SKU หรือคำอธิบาย..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchProducts}
        scannerDetected={scannerDetected}
        actionButtons={<AddProductDialog onProductAdded={fetchProducts} />}
      />

      {/* Stats Cards */}
        <ProductsStyleStatsCards cards={statsCards} loading={isLoading} />

      {/* Bulk Actions Bar */}
      {selectedProducts.length > 0 && (
        <ProductsStyleBulkActionsBar
          selectedCount={selectedProducts.length}
          onClear={() => setSelectedProducts([])}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Data Table */}
      <ProductsStyleDataTable
        title="รายการสินค้า"
        description="จัดการข้อมูลสินค้าและสต็อกอย่างครบถ้วน"
        data={paginatedProducts || []}
        columns={columns}
        currentViewMode={viewMode || 'grid'}
        onViewModeChange={setViewMode}
        onSort={(field) => {
          if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortField(field);
            setSortDirection('asc');
          }
        }}
        onRefresh={fetchProducts}
        onClearSelection={() => setSelectedProducts([])}
        selectedItems={selectedProducts}
        onSelectItem={handleSelectProduct}
        onSelectAll={handleSelectAll}
        onEdit={handleEditProduct}
        onDelete={handleDeleteProduct}
        onFilter={() => setShowFilters(true)}
        sortField={sortField || 'name'}
        sortDirection={sortDirection || 'asc'}
        loading={isLoading || false}
        emptyMessage="ไม่พบข้อมูลสินค้าที่ตรงกับการค้นหา"
        getItemId={(item) => item?.id || 'unknown'}
        getItemName={(item) => item?.name || 'Unknown'}
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        filterDialog={
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-purple-800">ตัวกรองข้อมูล</DialogTitle>
              <DialogDescription className="text-base">
                กรองข้อมูลสินค้าตามหมวดหมู่และสถานะสต็อก
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">หมวดหมู่</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกหมวดหมู่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">สถานะสต็อก</label>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกสถานะสต็อก" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="normal">ปกติ</SelectItem>
                    <SelectItem value="low">สต็อกต่ำ</SelectItem>
                    <SelectItem value="out">สต็อกหมด</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogContent>
        }
      />

      {/* Pagination */}
      <ProductsStylePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredProducts.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[6, 12, 24, 48]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteProduct}
        title="ยืนยันการลบ"
        itemName={productToDelete?.name || 'สินค้า'}
      />

      {/* Edit Product Dialog */}
      <EditProductDialog
        product={editingProduct}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchProducts}
      />
    </ProductsStylePageLayout>
  );
}