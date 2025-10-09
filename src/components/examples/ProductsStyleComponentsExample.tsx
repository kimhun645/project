import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { Package, TrendingUp, AlertTriangle, BarChart3, ArrowUp, ArrowDown, Activity } from 'lucide-react';

// Example usage of Products Style Components
export function ProductsStyleComponentsExample() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Example stats cards
  const statsCards: StatCard[] = [
    {
      title: "สินค้าทั้งหมด",
      value: 150,
      icon: <Package className="h-6 w-6" />,
      color: "purple",
      percentage: "100%"
    },
    {
      title: "สต็อกต่ำ",
      value: 12,
      icon: <AlertTriangle className="h-6 w-6" />,
      color: "orange",
      percentage: "8%"
    },
    {
      title: "หมดสต็อก",
      value: 3,
      icon: <TrendingUp className="h-6 w-6" />,
      color: "red",
      percentage: "2%"
    },
    {
      title: "มูลค่ารวม",
      value: "฿1,250,000",
      icon: <BarChart3 className="h-6 w-6" />,
      color: "teal",
      percentage: "100%"
    }
  ];

  // Example table columns
  const columns: ProductsStyleTableColumn[] = [
    {
      key: 'name',
      title: 'ชื่อสินค้า',
      sortable: true,
      render: (value) => (
        <div className="font-bold text-base">
          <div className="max-w-[200px] truncate" title={value}>
            {value}
          </div>
        </div>
      )
    },
    {
      key: 'sku',
      title: 'SKU',
      sortable: true,
      render: (value) => (
        <div className="text-muted-foreground text-base">
          {value}
        </div>
      )
    },
    {
      key: 'stock',
      title: 'สต็อก',
      sortable: true,
      render: (value) => (
        <div className="font-bold text-base">
          <span className={value <= 10 ? 'text-orange-600' : 'text-slate-700'}>
            {value.toLocaleString()}
          </span>
        </div>
      )
    },
    {
      key: 'price',
      title: 'ราคา',
      sortable: true,
      render: (value) => (
        <div className="font-bold text-base text-green-600">
          ฿{value.toLocaleString()}
        </div>
      )
    },
    {
      key: 'status',
      title: 'สถานะ',
      render: (value, row) => (
        <Badge 
          variant={row.stock > 10 ? 'default' : 'secondary'}
          className={`text-base font-bold px-4 py-2 ${
            row.stock > 10 
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' 
              : 'bg-orange-500/10 text-orange-600 border-orange-200'
          }`}
        >
          {row.stock > 10 ? 'ปกติ' : 'ต่ำ'}
        </Badge>
      )
    }
  ];

  // Example data
  const exampleData = [
    { id: '1', name: 'สินค้าตัวอย่าง 1', sku: 'SKU001', stock: 50, price: 1000, status: 'ปกติ' },
    { id: '2', name: 'สินค้าตัวอย่าง 2', sku: 'SKU002', stock: 5, price: 2500, status: 'ต่ำ' },
    { id: '3', name: 'สินค้าตัวอย่าง 3', sku: 'SKU003', stock: 0, price: 500, status: 'หมด' },
    { id: '4', name: 'สินค้าตัวอย่าง 4', sku: 'SKU004', stock: 25, price: 1500, status: 'ปกติ' },
    { id: '5', name: 'สินค้าตัวอย่าง 5', sku: 'SKU005', stock: 8, price: 3000, status: 'ต่ำ' },
  ];

  const filteredData = exampleData.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(paginatedData.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleSort = (field: string) => {
    console.log('Sort by:', field);
  };

  const handleDelete = (id: string) => {
    console.log('Delete item:', id);
    setDeleteDialogOpen(true);
  };

  const handleEdit = (item: any) => {
    console.log('Edit item:', item);
  };

  const handleBulkDelete = () => {
    console.log('Bulk delete:', selectedItems);
    setDeleteDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1);
  };

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="ตัวอย่างการใช้ Products Style Components"
        searchPlaceholder="ค้นหาสินค้า ชื่อ หรือ SKU..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={() => console.log('Refresh')}
        scannerDetected={false}
        actionButtons={
          <Button className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white">
            เพิ่มสินค้า
          </Button>
        }
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Bulk Actions Bar */}
      <ProductsStyleBulkActionsBar
        selectedCount={selectedItems.length}
        onClear={() => setSelectedItems([])}
        onCopy={() => console.log('Copy')}
        onExport={() => console.log('Export')}
        onDelete={handleBulkDelete}
      />

      {/* Data Table */}
      <ProductsStyleDataTable
        title="รายการสินค้า"
        description="จัดการข้อมูลสินค้าทั้งหมดในระบบ"
        data={paginatedData}
        columns={columns}
        currentViewMode={viewMode}
        onViewModeChange={setViewMode}
        onSort={handleSort}
        onRefresh={() => console.log('Refresh')}
        onClearSelection={() => setSelectedItems([])}
        selectedItems={selectedItems}
        onSelectItem={handleSelectItem}
        onSelectAll={handleSelectAll}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onFilter={() => console.log('Filter')}
        sortField="name"
        sortDirection="asc"
        loading={false}
        emptyMessage="ไม่พบข้อมูลสินค้า"
        getItemId={(item) => item.id}
        getItemName={(item) => item.name}
      />

      {/* Pagination */}
      <ProductsStylePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        itemsPerPageOptions={[5, 10, 25, 50]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={() => {
          console.log('Confirm delete');
          setDeleteDialogOpen(false);
        }}
        title="ยืนยันการลบ"
        itemName="รายการที่เลือก"
      />
    </ProductsStylePageLayout>
  );
}
