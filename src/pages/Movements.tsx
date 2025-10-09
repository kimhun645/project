import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Activity, TrendingUp, BarChart3, Filter } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Movement } from '@/lib/firestoreService';
import { AddMovementDialog } from '@/components/Dialogs/AddMovementDialog';
import { EditMovementDialog } from '@/components/Dialogs/EditMovementDialog';
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

interface MovementWithProduct extends Movement {
  product_name: string;
  product_sku: string;
}

export default function Movements() {
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedMovements, setSelectedMovements] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<MovementWithProduct | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<MovementWithProduct | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState(true);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const { toast } = useToast();
  const { isDetected: scannerDetected } = useBarcodeScanner();

  // Fetch movements data
  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const { firestoreService } = await import('@/lib/firestoreService');
      const response = await firestoreService.getMovements();
      setMovements(response);
    } catch (error) {
      console.error('Error fetching movements:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลการเคลื่อนไหวได้',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMovements();
  }, []);

  // Filter movements based on search term and type filter
  const filteredMovements = (movements || []).filter(movement => {
    if (!movement) return false;
    
    const matchesSearch = 
      (movement.product_name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (movement.product_sku || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (movement.reference && movement.reference.toLowerCase().includes((searchTerm || '').toLowerCase()));
    
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  // Sort movements
  const sortedMovements = [...(filteredMovements || [])].sort((a, b) => {
    const aValue = a[sortField as keyof MovementWithProduct] || '';
    const bValue = b[sortField as keyof MovementWithProduct] || '';
    
    if (aValue < bValue) return (sortDirection || 'asc') === 'asc' ? -1 : 1;
    if (aValue > bValue) return (sortDirection || 'asc') === 'asc' ? 1 : -1;
    return 0;
  });

  // Paginate movements
  const totalPages = Math.ceil((sortedMovements || []).length / (itemsPerPage || 25));
  const startIndex = ((currentPage || 1) - 1) * (itemsPerPage || 25);
  const paginatedMovements = (sortedMovements || []).slice(startIndex, startIndex + (itemsPerPage || 25));

  // Handle selection
  const handleSelectMovement = (movementId: number) => {
    setSelectedMovements(prev => 
      (prev || []).includes(movementId) 
        ? (prev || []).filter(id => id !== movementId)
        : [...(prev || []), movementId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedMovements((paginatedMovements || []).filter(m => m && m.id).map(m => m.id));
    } else {
      setSelectedMovements([]);
    }
  };

  // Handle sorting
  const handleSort = (field: string) => {
    if ((sortField || 'created_at') === field) {
      setSortDirection((sortDirection || 'asc') === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field || 'created_at');
      setSortDirection('asc');
    }
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page || 1);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items || 25);
    setCurrentPage(1);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if ((selectedMovements || []).length === 0) return;
    
    setMovementToDelete({
      id: (selectedMovements || [])[0] || 0,
      product_name: `${(selectedMovements || []).length} รายการ`,
      product_sku: '',
      type: 'in',
      quantity: 0,
      reason: '',
      reference: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as MovementWithProduct);
    setDeleteDialogOpen(true);
  };

  // Handle delete movement
  const handleDeleteMovement = (movementOrId: number | Movement) => {
    const movementId = typeof movementOrId === 'number' ? movementOrId : movementOrId.id;
    const movement = (movements || []).find(m => m && m.id === movementId);
    if (movement) {
      setMovementToDelete(movement);
      setDeleteDialogOpen(true);
    }
  };

  // Handle edit movement
  const handleEditMovement = (movementId: number) => {
    const movement = (movements || []).find(m => m && m.id === movementId);
    if (movement) {
      setMovementToEdit(movement);
      setEditDialogOpen(true);
    }
  };

  // Confirm delete
  const confirmDeleteMovement = async () => {
    if (!movementToDelete) return;

    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      if ((selectedMovements || []).length > 0) {
        await Promise.all((selectedMovements || []).filter(id => id).map(id => firestoreService.deleteMovement(id)));
        setSelectedMovements([]);
        toast({
          title: 'ลบสำเร็จ',
          description: `ลบการเคลื่อนไหว ${(selectedMovements || []).length} รายการแล้ว`,
        });
      } else {
        if (movementToDelete && movementToDelete.id) {
          await firestoreService.deleteMovement(movementToDelete.id);
          toast({
            title: 'ลบสำเร็จ',
            description: 'ลบการเคลื่อนไหวแล้ว',
          });
        }
      }
      
      await fetchMovements();
      setDeleteDialogOpen(false);
      setMovementToDelete(null);
    } catch (error) {
      console.error('Error deleting movement:', error);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถลบการเคลื่อนไหวได้',
        variant: 'destructive',
      });
    }
  };

  // Calculate stats
  const today = new Date().toDateString();
  const todayMovements = (movements || []).filter(m => m && m.created_at && new Date(m.created_at).toDateString() === today);
  const todayStockIn = todayMovements.filter(m => m && m.type === 'in').length;
  const todayStockOut = todayMovements.filter(m => m && m.type === 'out').length;
  const totalMovements = (movements || []).length;
  const totalStockIn = (movements || []).filter(m => m && m.type === 'in').length;
  const totalStockOut = (movements || []).filter(m => m && m.type === 'out').length;
  const totalQuantityIn = (movements || []).filter(m => m && m.type === 'in').reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalQuantityOut = (movements || []).filter(m => m && m.type === 'out').reduce((sum, m) => sum + (m.quantity || 0), 0);

  // Define table columns
  const columns: ProductsStyleTableColumn[] = [
    {
      key: 'created_at',
      title: 'วันที่',
      sortable: true,
      render: (value, row) => (
        <div className="font-bold text-base sm:text-lg">
          <div className="flex flex-col">
            <span>{value ? new Date(value).toLocaleDateString('th-TH') : '-'}</span>
            <span className="text-xs text-muted-foreground sm:hidden">
              {row.product_sku || '-'}
            </span>
          </div>
                  </div>
      )
    },
    {
      key: 'product_name',
      title: 'สินค้า',
      sortable: true,
      render: (value) => (
        <div className="text-base sm:text-lg">
          <div className="max-w-[200px] truncate" title={value || ''}>
            {value || '-'}
          </div>
        </div>
      )
    },
    {
      key: 'product_sku',
      title: 'SKU',
      hidden: true,
      render: (value) => (
        <div className="text-muted-foreground text-base sm:text-lg hidden sm:table-cell">
          {value || '-'}
              </div>
      )
    },
    {
      key: 'type',
      title: 'ประเภท',
      sortable: true,
      render: (value) => (
                              <Badge 
          variant={value === 'in' ? 'default' : 'secondary'}
          className={`text-base font-bold px-4 py-2 ${value === 'in' 
                                  ? 'bg-green-500/10 text-green-600' 
                                  : 'bg-red-500/10 text-red-600'
                                }`}
                              >
                                <div className="flex items-center">
            {value === 'in' ? (
                                    <ArrowUp className="mr-2 h-4 w-4" />
                                  ) : (
                                    <ArrowDown className="mr-2 h-4 w-4" />
                                  )}
                                  <span className="hidden sm:inline">
              {value === 'in' ? 'รับเข้า' : 'เบิกออก'}
                                  </span>
                                  <span className="sm:hidden">
              {value === 'in' ? '+' : '-'}
                                  </span>
                                </div>
                              </Badge>
      )
    },
    {
      key: 'quantity',
      title: 'จำนวน',
      sortable: true,
      render: (value, row) => (
        <div className="font-bold text-base sm:text-lg">
          <span className={row.type === 'in' ? 'text-green-600' : 'text-red-600'}>
            {row.type === 'in' ? '+' : '-'}{(value || 0).toLocaleString()}
                          </span>
                        </div>
      )
    },
    {
      key: 'reason',
      title: 'เหตุผล',
      hidden: true,
      render: (value) => (
        <div className="text-base sm:text-lg hidden md:table-cell">
          <div className="max-w-[150px] truncate" title={value || ''}>
            {value || '-'}
                          </div>
                            </div>
      )
    },
    {
      key: 'reference',
      title: 'เลขที่อ้างอิง',
      hidden: true,
      render: (value) => (
        <div className="text-muted-foreground text-base sm:text-lg hidden lg:table-cell">
          {value || '-'}
                            </div>
      )
    }
  ];

  // Create stats cards
  const statsCards: StatCard[] = [
    {
      title: "รับเข้าวันนี้",
      value: todayStockIn,
      icon: <ArrowUp className="h-6 w-6" />,
      color: "green",
      percentage: totalMovements > 0 ? `${Math.round((todayStockIn / totalMovements) * 100)}%` : "0%"
    },
    {
      title: "เบิกออกวันนี้",
      value: todayStockOut,
      icon: <ArrowDown className="h-6 w-6" />,
      color: "red",
      percentage: totalMovements > 0 ? `${Math.round((todayStockOut / totalMovements) * 100)}%` : "0%"
    },
    {
      title: "การเคลื่อนไหวทั้งหมด",
      value: totalMovements,
      icon: <Activity className="h-6 w-6" />,
      color: "purple",
      percentage: "100%"
    },
    {
      title: "ยอดสุทธิ",
      value: `${(totalQuantityIn - totalQuantityOut) >= 0 ? '+' : ''}${(totalQuantityIn - totalQuantityOut).toLocaleString()}`,
      icon: <BarChart3 className="h-6 w-6" />,
      color: (totalQuantityIn - totalQuantityOut) >= 0 ? "teal" : "orange",
      percentage: totalMovements > 0 ? "100%" : "0%"
    }
  ];

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="การเคลื่อนไหวสต็อก"
        searchPlaceholder="ค้นหาการเคลื่อนไหว ชื่อสินค้า SKU หรือเลขที่อ้างอิง..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchMovements}
        scannerDetected={scannerDetected}
        actionButtons={<AddMovementDialog onMovementAdded={fetchMovements} />}
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Bulk Actions Bar */}
      <ProductsStyleBulkActionsBar
        selectedCount={selectedMovements.length}
        onClear={() => setSelectedMovements([])}
        onCopy={() => {/* TODO: Implement copy functionality */}}
        onExport={() => {/* TODO: Implement export functionality */}}
        onDelete={handleBulkDelete}
      />

      {/* Data Table */}
      <ProductsStyleDataTable
        title="รายการเคลื่อนไหว"
        description="ติดตามการรับเข้าและเบิกออกสต็อกทั้งหมด"
        data={paginatedMovements || []}
        columns={columns}
        currentViewMode={viewMode || 'table'}
        onViewModeChange={setViewMode}
        onSort={handleSort}
        onRefresh={fetchMovements}
        onClearSelection={() => setSelectedMovements([])}
        selectedItems={selectedMovements || []}
        onSelectItem={handleSelectMovement}
        onSelectAll={handleSelectAll}
        onEdit={(movement) => movement && handleEditMovement(movement.id)}
        onDelete={handleDeleteMovement}
        onFilter={() => setShowFilterDialog(true)}
        sortField={sortField || 'created_at'}
        sortDirection={sortDirection || 'desc'}
        loading={isLoading || false}
        emptyMessage="ไม่พบข้อมูลการเคลื่อนไหวสต็อกที่ตรงกับการค้นหา"
        getItemId={(item) => item.id}
        getItemName={(item) => item.product_name}
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        filterDialog={
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                ตัวกรองการเคลื่อนไหว
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                เลือกตัวกรองเพื่อค้นหาการเคลื่อนไหวตามที่ต้องการ
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ประเภทการเคลื่อนไหว</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full h-11 text-base border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-200/50 bg-white/90 backdrop-blur-sm font-medium transition-all duration-300 focus-ring rounded-2xl">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-sm border-2 border-purple-200 rounded-2xl">
                    <SelectItem value="all" className="text-base font-medium py-3">ทุกประเภท</SelectItem>
                    <SelectItem value="in" className="text-base font-medium py-3">รับเข้า</SelectItem>
                    <SelectItem value="out" className="text-base font-medium py-3">เบิกออก</SelectItem>
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
        totalItems={filteredMovements?.length || 0}
        itemsPerPage={itemsPerPage || 25}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[10, 25, 50, 100]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={deleteDialogOpen || false}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDeleteMovement}
        title="ยืนยันการลบการเคลื่อนไหว"
        itemName={movementToDelete?.product_name || 'รายการที่เลือก'}
      />

      {/* Edit Movement Dialog */}
      <EditMovementDialog
        movement={movementToEdit}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onMovementUpdated={fetchMovements}
      />
    </ProductsStylePageLayout>
  );
}