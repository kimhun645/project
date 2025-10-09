# Products Style Components

ชุด components ที่ออกแบบตามสไตล์ของหน้า Products เพื่อให้หน้าตาและ UX สม่ำเสมอทั่วทั้งระบบ

## 🎨 Components ที่มี

### 1. ProductsStylePageLayout
Layout หลักที่มี padding และ spacing เหมือนหน้า Products

```tsx
import { ProductsStylePageLayout } from '@/components/ui/shared-components';

<ProductsStylePageLayout>
  {/* เนื้อหาของหน้า */}
</ProductsStylePageLayout>
```

### 2. ProductsStylePageHeader
Header ที่มี gradient background, search, และ status bar

```tsx
<ProductsStylePageHeader
  title="ชื่อหน้า"
  searchPlaceholder="ค้นหา..."
  searchValue={searchTerm}
  onSearchChange={setSearchTerm}
  onRefresh={handleRefresh}
  scannerDetected={scannerDetected}
  actionButtons={<Button>เพิ่มข้อมูล</Button>}
/>
```

### 3. ProductsStyleStatsCards
Cards แสดงสถิติที่มี animation และ hover effects

```tsx
const statsCards: StatCard[] = [
  {
    title: "สินค้าทั้งหมด",
    value: 150,
    icon: <Package className="h-6 w-6" />,
    color: "purple",
    percentage: "100%"
  }
];

<ProductsStyleStatsCards cards={statsCards} />
```

### 4. ProductsStyleBulkActionsBar
Bar สำหรับ bulk actions เมื่อเลือกหลายรายการ

```tsx
<ProductsStyleBulkActionsBar
  selectedCount={selectedItems.length}
  onClear={() => setSelectedItems([])}
  onCopy={() => console.log('Copy')}
  onExport={() => console.log('Export')}
  onDelete={handleBulkDelete}
/>
```

### 5. ProductsStyleDataTable
Table/Grid view ที่มี header สวยงามและ functionality ครบถ้วน

```tsx
const columns: ProductsStyleTableColumn[] = [
  {
    key: 'name',
    title: 'ชื่อ',
    sortable: true,
    render: (value) => <div>{value}</div>
  }
];

<ProductsStyleDataTable
  title="รายการข้อมูล"
  description="คำอธิบาย"
  data={data}
  columns={columns}
  currentViewMode={viewMode}
  onViewModeChange={setViewMode}
  onSort={handleSort}
  onRefresh={handleRefresh}
  onClearSelection={() => setSelectedItems([])}
  selectedItems={selectedItems}
  onSelectItem={handleSelectItem}
  onSelectAll={handleSelectAll}
  onEdit={handleEdit}
  onDelete={handleDelete}
  onFilter={() => setShowFilter(true)}
  sortField="name"
  sortDirection="asc"
  loading={false}
  emptyMessage="ไม่พบข้อมูล"
  getItemId={(item) => item.id}
  getItemName={(item) => item.name}
/>
```

### 6. ProductsStylePagination
Pagination controls ที่สวยงาม

```tsx
<ProductsStylePagination
  currentPage={currentPage}
  totalPages={totalPages}
  totalItems={totalItems}
  itemsPerPage={itemsPerPage}
  onPageChange={handlePageChange}
  onItemsPerPageChange={handleItemsPerPageChange}
  itemsPerPageOptions={[10, 25, 50, 100]}
/>
```

### 7. ProductsStyleDeleteConfirmationDialog
Dialog ยืนยันการลบ

```tsx
<ProductsStyleDeleteConfirmationDialog
  open={deleteDialogOpen}
  onOpenChange={setDeleteDialogOpen}
  onConfirm={handleConfirmDelete}
  title="ยืนยันการลบ"
  itemName="รายการที่เลือก"
/>
```

## 🎯 Features

- **Consistent Design**: ใช้ theme และ styling เหมือนหน้า Products
- **Responsive**: รองรับทุกขนาดหน้าจอ
- **Interactive**: มี hover effects, animations, และ transitions
- **Flexible**: สามารถปรับแต่งได้ตามความต้องการ
- **Type Safe**: มี TypeScript types ครบถ้วน

## 📝 Types

```tsx
interface StatCard {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: 'purple' | 'orange' | 'red' | 'teal' | 'green';
  percentage?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ProductsStyleTableColumn {
  key: string;
  title: string;
  sortable?: boolean;
  hidden?: boolean;
  render?: (value: any, row?: any) => React.ReactNode;
}
```

## 🚀 การใช้งานในหน้าอื่นๆ

```tsx
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

export default function MyPage() {
  return (
    <ProductsStylePageLayout>
      <ProductsStylePageHeader
        title="หน้าของฉัน"
        searchPlaceholder="ค้นหา..."
        searchValue=""
        onSearchChange={() => {}}
        onRefresh={() => {}}
        scannerDetected={false}
      />
      
      {/* เนื้อหาอื่นๆ */}
    </ProductsStylePageLayout>
  );
}
```

## 📁 ไฟล์ที่เกี่ยวข้อง

- `src/components/ui/products-style-components.tsx` - Core components
- `src/components/ui/products-style-data-table.tsx` - Data table component
- `src/components/ui/products-style-pagination.tsx` - Pagination component
- `src/components/ui/shared-components.tsx` - Export file
- `src/components/examples/ProductsStyleComponentsExample.tsx` - ตัวอย่างการใช้งาน

## ✅ หน้าที่ใช้แล้ว

- ✅ **Movements** - ใช้ Products Style Components ทั้งหมด
- 🔄 **Products** - ใช้ custom implementation (สามารถเปลี่ยนเป็น shared components ได้)

## 🎨 Design System

### Colors
- **Purple**: Primary actions, active states
- **Orange**: Warnings, bulk actions
- **Red**: Destructive actions, errors
- **Teal**: Success, positive values
- **Green**: Stock in, positive trends

### Spacing
- **Padding**: `px-4 sm:px-6 lg:px-8`
- **Gap**: `gap-4` สำหรับ cards, `gap-2` สำหรับ buttons
- **Margin**: `mb-4` สำหรับ sections

### Shadows
- **Cards**: `shadow-2xl` with hover `hover:shadow-purple-500/20`
- **Buttons**: `shadow-lg` for active states
- **Headers**: `shadow-lg` with gradient backgrounds
