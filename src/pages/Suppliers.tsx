
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileEdit as Edit, Trash2, Phone, Mail, MapPin, User, CheckCircle, Building2, BarChart3, TrendingUp, Package, Filter } from 'lucide-react';
import { type Supplier } from '@/lib/firestoreService';
import { AddSupplierDialog } from '@/components/Dialogs/AddSupplierDialog';
import { EditSupplierDialog } from '@/components/Dialogs/EditSupplierDialog';
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

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Pagination and view state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Bulk actions state
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  
  const { toast } = useToast();

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for supplier when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาผู้จัดหา: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  // Filter suppliers based on search and status filter
  const filteredSuppliers = suppliers.filter(supplier => {
    if (!supplier || !supplier.id || !supplier.name) return false; // Skip invalid suppliers
    
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && (productCounts[supplier.id] || 0) > 0) ||
      (statusFilter === 'inactive' && (productCounts[supplier.id] || 0) === 0);
    
    return matchesSearch && matchesStatus;
  });

  // Sort suppliers
  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    if (!a || !b) return 0; // Skip invalid items
    
    let aValue = a[sortField as keyof Supplier];
    let bValue = b[sortField as keyof Supplier];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedSuppliers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSuppliers = sortedSuppliers.slice(startIndex, endIndex).filter(supplier => supplier && supplier.id);

  // Bulk actions handlers
  const handleSelectSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSuppliers(paginatedSuppliers.map(supplier => supplier.id));
    } else {
      setSelectedSuppliers([]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      for (const supplierId of selectedSuppliers) {
        await firestoreService.deleteSupplier(supplierId);
      }
      
      toast({
        title: "สำเร็จ",
        description: `ลบผู้จัดหา ${selectedSuppliers.length} รายการสำเร็จแล้ว`,
      });
      
      setSelectedSuppliers([]);
      fetchSuppliers();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้จัดหาได้",
        variant: "destructive",
      });
    }
  };

  // Calculate stats
  const totalSuppliers = suppliers.length;
  const activeSuppliers = Object.values(productCounts).filter(count => count > 0).length;
  const totalProducts = Object.values(productCounts).reduce((sum, count) => sum + count, 0);
  const efficiency = totalSuppliers > 0 ? Math.round((activeSuppliers / totalSuppliers) * 100) : 0;

  const fetchSuppliers = async () => {
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const suppliersData = await firestoreService.getSuppliers();
      const productsData = await firestoreService.getProducts();

      const counts: Record<string, number> = {};
      productsData.forEach(product => {
        counts[product.supplier_id] = (counts[product.supplier_id] || 0) + 1;
      });

      setSuppliers(suppliersData || []);
      setProductCounts(counts);
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลดข้อมูลผู้จัดหาได้",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setEditDialogOpen(true);
  };

  const handleDeleteSupplier = async (supplierOrId: string | Supplier) => {
    try {
      const supplierId = typeof supplierOrId === 'string' ? supplierOrId : supplierOrId.id;
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.deleteSupplier(supplierId);

      toast({
        title: "สำเร็จ",
        description: "ลบผู้จัดหาสำเร็จแล้ว",
      });

      fetchSuppliers();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้จัดหาได้",
        variant: "destructive",
      });
    }
  };

  // Define columns for data table
  const columns: ProductsStyleTableColumn[] = [
    {
      key: 'name',
      title: 'ชื่อผู้จัดหา',
      sortable: true,
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{supplier?.name || 'Unknown'}</span>
          {(productCounts[supplier?.id] || 0) > 0 && (
            <CheckCircle className="h-4 w-4 text-green-600" title="มีสินค้า" />
          )}
        </div>
      )
    },
    {
      key: 'email',
      title: 'อีเมล',
      sortable: true,
      render: (supplier: Supplier) => (
        <span className="text-sm text-muted-foreground">
          {supplier?.email || '-'}
        </span>
      )
    },
    {
      key: 'phone',
      title: 'เบอร์โทร',
      sortable: true,
      render: (supplier: Supplier) => (
        <span className="text-sm text-muted-foreground">
          {supplier?.phone || '-'}
        </span>
      )
    },
    {
      key: 'product_count',
      title: 'จำนวนสินค้า',
      sortable: true,
      render: (supplier: Supplier) => {
        if (!supplier?.id) return <span className="text-sm text-muted-foreground">-</span>;
        const count = productCounts[supplier.id] || 0;
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            {count.toLocaleString()} สินค้า
          </Badge>
        );
      }
    },
    {
      key: 'status',
      title: 'สถานะ',
      sortable: true,
      render: (supplier: Supplier) => {
        const count = productCounts[supplier?.id] || 0;
        return count > 0 ? (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
            ใช้งาน
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-600 border-gray-200">
            ไม่ใช้งาน
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (supplier: Supplier) => (
        <div className="flex items-center gap-1">
          {supplier?.id ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => handleEditSupplier(supplier)}
                className="h-8 w-8 p-0 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSupplier(supplier.id)}
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
      title: "ผู้จัดหาทั้งหมด",
      value: totalSuppliers.toString(),
      icon: <Building2 className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "ผู้จัดหาที่ใช้งาน",
      value: activeSuppliers.toString(),
      icon: <CheckCircle className="h-6 w-6" />,
      color: activeSuppliers > 0 ? "green" : "red"
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

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="ผู้จัดหา"
        searchPlaceholder="ค้นหาผู้จัดหา ชื่อหรืออีเมล..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchSuppliers}
        scannerDetected={scannerDetected}
        actionButtons={<AddSupplierDialog onSupplierAdded={fetchSuppliers} />}
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Bulk Actions Bar */}
      {selectedSuppliers.length > 0 && (
        <ProductsStyleBulkActionsBar
          selectedCount={selectedSuppliers.length}
          onClear={() => setSelectedSuppliers([])}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Data Table */}
      <ProductsStyleDataTable
        title="รายการผู้จัดหา"
        description="จัดการข้อมูลผู้จัดหาและซัพพลายเออร์อย่างครบถ้วน"
        data={paginatedSuppliers || []}
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
        onRefresh={fetchSuppliers}
        onClearSelection={() => setSelectedSuppliers([])}
        selectedItems={selectedSuppliers}
        onSelectItem={handleSelectSupplier}
        onSelectAll={handleSelectAll}
        onEdit={handleEditSupplier}
        onDelete={handleDeleteSupplier}
        onFilter={() => setShowFilterDialog(true)}
        sortField={sortField || 'name'}
        sortDirection={sortDirection || 'asc'}
        loading={isLoading || false}
        emptyMessage="ไม่พบข้อมูลผู้จัดหาที่ตรงกับการค้นหา"
        getItemId={(item) => item?.id || 'unknown'}
        getItemName={(item) => item?.name || 'Unknown'}
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        filterDialog={
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-purple-800">ตัวกรองข้อมูล</DialogTitle>
              <DialogDescription className="text-base">
                กรองข้อมูลผู้จัดหาตามสถานะการใช้งาน
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">สถานะการใช้งาน</label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    <SelectItem value="active">ใช้งาน</SelectItem>
                    <SelectItem value="inactive">ไม่ใช้งาน</SelectItem>
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
        totalItems={sortedSuppliers.length}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[6, 12, 24, 48]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={false}
        onOpenChange={() => {}}
        onConfirm={() => {}}
        title="ยืนยันการลบ"
        itemName="ผู้จัดหา"
      />

      {/* Edit Supplier Dialog */}
      <EditSupplierDialog
        supplier={editingSupplier}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSupplierUpdated={fetchSuppliers}
      />
    </ProductsStylePageLayout>
  );
}
