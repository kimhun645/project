import React, { Suspense, lazy } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center p-8 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="text-sm text-gray-600">กำลังโหลด...</p>
      </CardContent>
    </Card>
  </div>
);

// Lazy load heavy components
export const LazyDashboard = lazy(() => import('@/pages/Dashboard'));
export const LazyProducts = lazy(() => import('@/pages/Products'));
export const LazyCategories = lazy(() => import('@/pages/Categories'));
export const LazySuppliers = lazy(() => import('@/pages/Suppliers'));
export const LazyMovements = lazy(() => import('@/pages/Movements'));
export const LazyScanner = lazy(() => import('@/pages/Scanner'));
export const LazyReports = lazy(() => import('@/pages/Reports'));
export const LazyProfile = lazy(() => import('@/pages/Profile'));
export const LazySettings = lazy(() => import('@/pages/Settings'));
export const LazyBudgetRequest = lazy(() => import('@/pages/BudgetRequest'));
export const LazyApprovalPage = lazy(() => import('@/pages/ApprovalPage'));

// Lazy load heavy dialogs
export const LazyAddProductDialog = lazy(() => import('@/components/Dialogs/AddProductDialogWithResponsiveModal'));
export const LazyEditProductDialog = lazy(() => import('@/components/Dialogs/EditProductDialog'));
export const LazyAddCategoryDialog = lazy(() => import('@/components/Dialogs/AddCategoryDialog'));
export const LazyEditCategoryDialog = lazy(() => import('@/components/Dialogs/EditCategoryDialog'));
export const LazyAddSupplierDialog = lazy(() => import('@/components/Dialogs/AddSupplierDialog'));
export const LazyEditSupplierDialog = lazy(() => import('@/components/Dialogs/EditSupplierDialog'));
export const LazyAddMovementDialog = lazy(() => import('@/components/Dialogs/AddMovementDialog'));
export const LazyEditMovementDialog = lazy(() => import('@/components/Dialogs/EditMovementDialog'));
export const LazyReceiptDialog = lazy(() => import('@/components/Dialogs/ReceiptDialog'));
export const LazyWithdrawalDialog = lazy(() => import('@/components/Dialogs/WithdrawalDialog'));
export const LazyChangePasswordDialog = lazy(() => import('@/components/Dialogs/ChangePasswordDialog'));

// Lazy load charts and heavy components
export const LazyPieChart = lazy(() => import('@/components/Dashboard/PieChart'));
export const LazyEnhancedDashboard = lazy(() => import('@/components/Dashboard/EnhancedDashboard'));

// Wrapper components with Suspense
export const SuspenseWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<LoadingSpinner />}>
    {children}
  </Suspense>
);

// Preload function for critical components
export const preloadCriticalComponents = () => {
  // Preload critical components after initial load
  setTimeout(() => {
    import('@/pages/Dashboard');
    import('@/pages/Products');
    import('@/components/Dialogs/AddProductDialogWithResponsiveModal');
  }, 2000);
};

// Preload function for user interactions
export const preloadOnHover = (component: () => Promise<any>) => {
  let preloaded = false;
  
  return {
    onMouseEnter: () => {
      if (!preloaded) {
        preloaded = true;
        component();
      }
    }
  };
};
