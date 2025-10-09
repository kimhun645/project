// Shared UI Components for consistent design across all pages
export { StatsCards, createProductStats, createMovementStats } from './stats-cards';
export { BulkActionsBar } from './bulk-actions-bar';
export { PageHeader } from './page-header';
export { DataTable, type TableColumn, type ViewMode } from './data-table';
export { DeleteConfirmationDialog } from './delete-confirmation-dialog';
export { PageLayout } from './page-layout';
export { Pagination } from './pagination';

// Products Style Components (Enhanced UI)
export { 
  ProductsStylePageLayout,
  ProductsStylePageHeader,
  ProductsStyleStatsCards,
  ProductsStyleBulkActionsBar,
  ProductsStyleDeleteConfirmationDialog,
  type StatCard,
  type TableColumn as ProductsStyleTableColumn,
  type PageLayoutProps,
  type PageHeaderProps,
  type StatsCardsProps,
  type BulkActionsBarProps,
  type PaginationProps,
  type DeleteConfirmationDialogProps
} from './products-style-components';

export { 
  ProductsStyleDataTable,
  type ProductsStyleDataTableProps
} from './products-style-data-table';

export { 
  ProductsStylePagination,
  type ProductsStylePaginationProps 
} from './products-style-pagination';
