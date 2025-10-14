import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowUp, ArrowDown, Activity, TrendingUp, BarChart3, Filter, RefreshCw, Eye, Edit, Trash2, Printer, MoreVertical, User, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type Movement } from '@/lib/firestoreService';
import { EditMovementDialog } from '@/components/Dialogs/EditMovementDialog';
import { WithdrawalDialog } from '@/components/Dialogs/WithdrawalDialog';
import { ReceiptDialog } from '@/components/Dialogs/ReceiptDialog';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { display, formatDateSafe, formatNumberSafe } from '@/utils/display';
import { ErrorBoundary } from '@/components/ErrorBoundary';
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

interface MovementWithProduct {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  person_name?: string;
  person_role?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  withdrawal_no?: string;
  withdrawal_date?: string;
}

// Helper function to format date (using safe formatter)
const formatDate = (dateString: string | undefined): string => {
  return formatDateSafe(dateString);
};

export default function Movements() {
  const [movements, setMovements] = useState<MovementWithProduct[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedMovements, setSelectedMovements] = useState<number[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [movementToDelete, setMovementToDelete] = useState<MovementWithProduct | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [movementToEdit, setMovementToEdit] = useState<MovementWithProduct | null>(null);
  const [movementToView, setMovementToView] = useState<MovementWithProduct | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [pagination, setPagination] = useState(true);
  const [showFilterDialog, setShowFilterDialog] = useState(false);

  const { toast } = useToast();
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for movement when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาการเคลื่อนไหว: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  // Fetch movements data
  const fetchMovements = async () => {
    try {
      setIsLoading(true);
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // Fetch both movements and withdrawals
      const [movementsData, withdrawalsData] = await Promise.all([
        FirestoreService.getMovements(),
        FirestoreService.getWithdrawals()
      ]);
      
      
      // Convert withdrawals to movements format for display
      const withdrawalMovements: MovementWithProduct[] = [];
      withdrawalsData.forEach(withdrawal => {
        withdrawal.items.forEach(item => {
          withdrawalMovements.push({
            id: `${withdrawal.id}-${item.id}`,
            product_id: item.product_id,
            product_name: item.product_name,
            product_sku: '', // Withdrawals don't have SKU
            type: 'out' as const,
            quantity: item.quantity,
            reason: item.reason,
            person_name: withdrawal.requester_name,
            person_role: 'ผู้เบิก',
            created_at: withdrawal.created_at,
            updated_at: withdrawal.created_at,
            created_by: withdrawal.created_by,
            withdrawal_no: withdrawal.withdrawal_no,
            withdrawal_date: withdrawal.withdrawal_date
          });
        });
      });
      
      
      // Combine movements and withdrawal movements
      const allMovements = [...movementsData, ...withdrawalMovements];
      
      // Ensure all movements have required properties
        const sanitizedMovements: MovementWithProduct[] = allMovements.map(movement => {
          const sanitized: MovementWithProduct = {
            id: movement.id || '',
            product_id: movement.product_id || '',
            product_name: movement.product_name || '',
            product_sku: movement.product_sku || '',
            type: (movement.type || 'out') as 'in' | 'out',
            quantity: movement.quantity || 0,
            reason: movement.reason || '',
            person_name: movement.person_name || '',
            person_role: movement.person_role || '',
            created_at: movement.created_at || new Date().toISOString(),
            updated_at: movement.updated_at || new Date().toISOString(),
            created_by: movement.created_by || ''
          };
        
        // Add optional withdrawal properties
        if ((movement as any).withdrawal_no) {
          sanitized.withdrawal_no = (movement as any).withdrawal_no;
        }
        if ((movement as any).withdrawal_date) {
          sanitized.withdrawal_date = (movement as any).withdrawal_date;
        }
        
        return sanitized;
      });
      
      setMovements(sanitizedMovements);
      setWithdrawals(withdrawalsData);
      
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
  const handleSelectMovement = (id: string | number) => {
    setSelectedMovements(prev => 
      (prev || []).includes(id) 
        ? (prev || []).filter(itemId => itemId !== id)
        : [...(prev || []), id]
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
  const handleDeleteMovement = (id: string | number) => {
    const movement = (movements || []).find(m => m && m.id === id);
    if (movement) {
      setMovementToDelete(movement);
      setDeleteDialogOpen(true);
    }
  };

  // Handle view movement
  const handleViewMovement = (movement: MovementWithProduct) => {
    setMovementToView(movement);
    setViewDialogOpen(true);
  };

  // Handle edit movement
  const handleEditMovement = (movementId: string | number) => {
    const movement = (movements || []).find(m => m && m.id === movementId);
    if (movement) {
      // Check if it's a withdrawal movement (cannot be edited)
      if (movement.withdrawal_no) {
        toast({
          title: "ไม่สามารถแก้ไขได้",
          description: "ไม่สามารถแก้ไขรายการเบิกพัสดุได้ กรุณาใช้การเบิกพัสดุใหม่แทน",
          variant: "destructive",
        });
        return;
      }
      
      setMovementToEdit(movement);
      setEditDialogOpen(true);
    }
  };

  // Handle print movement
  const handlePrintMovement = (movement: MovementWithProduct) => {
    const printContent = `
      <div style="font-family: 'Sarabun', sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; color: #1f2937; margin-bottom: 30px;">รายละเอียด${movement.withdrawal_no ? 'การเบิกพัสดุ' : 'การรับพัสดุ'}</h1>
        
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-bottom: 15px;">ข้อมูลทั่วไป</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">รหัสการเคลื่อนไหว:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${movement.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">วันที่:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${formatDate(movement.created_at)}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">ประเภท:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: ${movement.type === 'in' ? '#059669' : '#dc2626'}; font-weight: bold;">
                  ${movement.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                </span>
              </td>
            </tr>
            ${movement.withdrawal_no ? `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">เลขที่เบิก:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${movement.withdrawal_no}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-bottom: 15px;">ข้อมูลสินค้า</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">ชื่อสินค้า:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${movement.product_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">รหัส SKU:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-family: monospace;">${movement.product_sku || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">จำนวน:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
                <span style="color: ${movement.type === 'in' ? '#059669' : '#dc2626'}; font-weight: bold; font-size: 18px;">
                  ${movement.type === 'in' ? '+' : '-'}${movement.quantity.toLocaleString()}
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">เหตุผล:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${movement.reason || '-'}</td>
            </tr>
          </table>
        </div>

        ${movement.person_name ? `
        <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #374151; margin-bottom: 15px;">ข้อมูลผู้เกี่ยวข้อง</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 30%;">${movement.person_role || 'ผู้เกี่ยวข้อง'}:</td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${movement.person_name}</td>
            </tr>
          </table>
        </div>
        ` : ''}

        <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 12px;">
          พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>รายละเอียดการเคลื่อนไหวสต็อก</title>
            <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
              body { margin: 0; padding: 0; }
              @media print {
                body { margin: 0; }
                @page { margin: 0.5in; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }

    toast({
      title: "กำลังพิมพ์",
      description: "กำลังเปิดหน้าต่างพิมพ์รายละเอียดการเคลื่อนไหว",
    });
  };

  // Confirm delete
  const confirmDeleteMovement = async () => {
    if (!movementToDelete) return;

    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      if ((selectedMovements || []).length > 0) {
        // Handle bulk delete
        const deletePromises = (selectedMovements || []).filter(id => id).map(async (id) => {
          const movement = (movements || []).find(m => m && m.id === id);
          if (movement) {
            // Check if it's a withdrawal movement
            if (movement.withdrawal_no) {
              // Extract withdrawal ID from the movement ID
              const withdrawalId = String(id).split('-')[0];
              await FirestoreService.deleteWithdrawal(withdrawalId);
              
              // Restore stock for withdrawal items
              if (movement.type === 'out') {
                await FirestoreService.updateProduct(movement.product_id, {
                  current_stock: (await FirestoreService.getProduct(movement.product_id))?.current_stock + movement.quantity
                });
              }
            } else {
              // Regular movement - restore stock
              if (movement.type === 'out') {
                await FirestoreService.updateProduct(movement.product_id, {
                  current_stock: (await FirestoreService.getProduct(movement.product_id))?.current_stock + movement.quantity
                });
              } else if (movement.type === 'in') {
                await FirestoreService.updateProduct(movement.product_id, {
                  current_stock: (await FirestoreService.getProduct(movement.product_id))?.current_stock - movement.quantity
                });
              }
              
              await FirestoreService.deleteMovement(String(id));
            }
          }
        });
        
        await Promise.all(deletePromises);
        setSelectedMovements([]);
        toast({
          title: 'ลบสำเร็จ',
          description: `ลบการเคลื่อนไหว ${(selectedMovements || []).length} รายการแล้ว`,
        });
      } else {
        // Handle single delete
        if (movementToDelete && movementToDelete.id) {
          // Check if it's a withdrawal movement
          if (movementToDelete.withdrawal_no) {
            // Extract withdrawal ID from the movement ID
            const withdrawalId = String(movementToDelete.id).split('-')[0];
            await FirestoreService.deleteWithdrawal(withdrawalId);
            
            // Restore stock for withdrawal items
            if (movementToDelete.type === 'out') {
              await FirestoreService.updateProduct(movementToDelete.product_id, {
                current_stock: (await FirestoreService.getProduct(movementToDelete.product_id))?.current_stock + movementToDelete.quantity
              });
            }
          } else {
            // Regular movement - restore stock
            if (movementToDelete.type === 'out') {
              await FirestoreService.updateProduct(movementToDelete.product_id, {
                current_stock: (await FirestoreService.getProduct(movementToDelete.product_id))?.current_stock + movementToDelete.quantity
              });
            } else if (movementToDelete.type === 'in') {
              await FirestoreService.updateProduct(movementToDelete.product_id, {
                current_stock: (await FirestoreService.getProduct(movementToDelete.product_id))?.current_stock - movementToDelete.quantity
              });
            }
            
            await FirestoreService.deleteMovement(movementToDelete.id);
          }
          
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
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  
  // Get today's movements (for stock-in only)
  const todayMovements = (movements || []).filter(m => {
    if (!m || !m.created_at) return false;
    const movementDate = new Date(m.created_at);
    return movementDate >= todayStart && movementDate < todayEnd;
  });
  
  // Get today's withdrawals (for stock-out) - use withdrawals data directly
  const todayWithdrawals = (withdrawals || []).filter(w => {
    if (!w || !w.created_at) return false;
    
    // Handle Firestore Timestamp
    let withdrawalDate: Date;
    if (w.created_at && typeof w.created_at === 'object' && 'toDate' in w.created_at) {
      // Firestore Timestamp
      withdrawalDate = (w.created_at as any).toDate();
    } else if (typeof w.created_at === 'string') {
      // String date
      withdrawalDate = new Date(w.created_at);
    } else {
      return false;
    }
    
    return withdrawalDate >= todayStart && withdrawalDate < todayEnd;
  });
  
  
  const todayStockIn = todayMovements.filter(m => m && m.type === 'in').length;
  const todayStockOut = todayWithdrawals.length; // Count withdrawals directly
  
  // Calculate total stats
  const totalMovements = (movements || []).length;
  const totalStockIn = (movements || []).filter(m => m && m.type === 'in').length;
  const totalWithdrawals = (withdrawals || []).length; // Count withdrawals directly
  const totalQuantityIn = (movements || []).filter(m => m && m.type === 'in').reduce((sum, m) => sum + (m.quantity || 0), 0);
  const totalQuantityOut = (withdrawals || []).reduce((sum, w) => {
    const itemsQuantity = (w.items || []).reduce((itemSum: number, item: any) => itemSum + (item.quantity || 0), 0);
    return sum + itemsQuantity;
  }, 0);

  // Define table columns
  const columns: TableColumn[] = [
    {
      key: 'created_at',
      title: 'วันที่',
      sortable: true,
      render: (value, row) => (
        <div className="font-bold text-base sm:text-lg">
          <div className="flex flex-col">
            <span>{formatDate(value)}</span>
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
      key: 'withdrawal_no',
      title: 'เลขที่เบิก',
      sortable: true,
      render: (value, row) => (
        <div className="text-sm">
          {value ? (
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              {value}
            </Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
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
            {row.type === 'in' ? '+' : '-'}{formatNumberSafe(value)}
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
          <div className="max-w-[150px] truncate" title={display(value)}>
            {display(value)}
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
          {display(value)}
                            </div>
      )
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (value, movement) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleViewMovement(movement)}
            className="h-8 w-8 p-0 hover:bg-blue-50"
            title="ดูรายละเอียด"
          >
            <Eye className="h-4 w-4 text-blue-600" />
          </Button>
          {!movement.withdrawal_no && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditMovement(movement.id)}
              className="h-8 w-8 p-0 hover:bg-green-50"
              title="แก้ไข"
            >
              <Edit className="h-4 w-4 text-green-600" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handlePrintMovement(movement)}
            className="h-8 w-8 p-0 hover:bg-purple-50"
            title="พิมพ์"
          >
            <Printer className="h-4 w-4 text-purple-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteMovement(movement.id)}
            className="h-8 w-8 p-0 hover:bg-red-50"
            title="ลบ"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ];

  // Create stats cards
  const statsCards: StatCard[] = [
    {
      title: "รับพัสดุวันนี้",
      value: todayStockIn,
      icon: <ArrowUp className="h-6 w-6" />,
      color: "green",
      percentage: totalMovements > 0 ? `${Math.round((todayStockIn / totalMovements) * 100)}%` : "0%"
    },
    {
      title: "เบิกพัสดุวันนี้",
      value: todayStockOut,
      icon: <ArrowDown className="h-6 w-6" />,
      color: "red",
      percentage: totalWithdrawals > 0 ? `${Math.round((todayStockOut / totalWithdrawals) * 100)}%` : "0%"
    },
    {
      title: "รายการทั้งหมด",
      value: totalMovements,
      icon: <Activity className="h-6 w-6" />,
      color: "purple",
      percentage: "100%"
    },
    {
      title: "ยอดสุทธิวันนี้",
      value: `${(todayStockIn - todayStockOut) >= 0 ? '+' : ''}${(todayStockIn - todayStockOut)}`,
      icon: <BarChart3 className="h-6 w-6" />,
      color: (todayStockIn - todayStockOut) >= 0 ? "teal" : "orange",
      percentage: totalMovements > 0 ? "100%" : "0%"
    }
  ];

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="การเบิกและรับพัสดุ"
        searchPlaceholder="ค้นหาการเบิก/รับพัสดุ ชื่อสินค้า SKU หรือเลขที่อ้างอิง..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchMovements}
        scannerDetected={scannerDetected}
        actionButtons={
          <div className="flex items-center gap-2">
            <WithdrawalDialog onWithdrawalAdded={fetchMovements} />
            <ReceiptDialog onReceiptAdded={fetchMovements} />
          </div>
        }
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
      <ErrorBoundary>
        <ProductsStyleDataTable
        title="รายการเบิกและรับพัสดุ"
        description="จัดการการเบิกพัสดุและการรับพัสดุเข้าสต็อก"
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
        onDelete={handleDeleteMovement}
        onFilter={() => setShowFilterDialog(true)}
        sortField={sortField || 'created_at'}
        sortDirection={sortDirection || 'desc'}
        loading={isLoading || false}
        emptyMessage="ไม่พบข้อมูลการเบิกหรือรับพัสดุที่ตรงกับการค้นหา"
        getItemId={(item) => item.id}
        getItemName={(item) => item.product_name}
        currentPage={currentPage || 1}
        totalPages={totalPages || 1}
        filterDialog={
          <DialogContent className="sm:max-w-md bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Filter className="h-5 w-5 text-purple-600" />
                ตัวกรองการเบิกและรับพัสดุ
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                เลือกตัวกรองเพื่อค้นหาการเบิกหรือรับพัสดุตามที่ต้องการ
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {/* Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">ประเภทการเบิก/รับพัสดุ</label>
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
      </ErrorBoundary>

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

      {/* View Movement Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-2xl bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-lg border-0 rounded-2xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              รายละเอียด{movementToView?.withdrawal_no ? 'การเบิกพัสดุ' : 'การรับพัสดุ'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              ข้อมูล{movementToView?.withdrawal_no ? 'การเบิกพัสดุ' : 'การรับพัสดุ'}ที่เลือก
            </DialogDescription>
          </DialogHeader>

          {movementToView && (
            <div className="space-y-6 py-4">
              {/* ข้อมูลทั่วไป */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  ข้อมูลทั่วไป
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">รหัส{movementToView.withdrawal_no ? 'การเบิก' : 'การรับ'}</label>
                    <p className="text-base font-mono bg-white px-3 py-2 rounded-lg border">
                      {movementToView.withdrawal_no || movementToView.id}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">วันที่</label>
                    <p className="text-base bg-white px-3 py-2 rounded-lg border">
                      {formatDate(movementToView.created_at)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">ประเภท</label>
                    <div className="mt-1">
                      <Badge 
                        variant={movementToView.type === 'in' ? 'default' : 'secondary'}
                        className={`text-base font-bold px-4 py-2 ${movementToView.type === 'in' 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        <div className="flex items-center">
                          {movementToView.type === 'in' ? (
                            <ArrowUp className="mr-2 h-4 w-4" />
                          ) : (
                            <ArrowDown className="mr-2 h-4 w-4" />
                          )}
                          {movementToView.type === 'in' ? 'รับเข้า' : 'เบิกออก'}
                        </div>
                      </Badge>
                    </div>
                  </div>
                  {movementToView.withdrawal_no && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">เลขที่เบิก</label>
                      <p className="text-base bg-white px-3 py-2 rounded-lg border">
                        {movementToView.withdrawal_no}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ข้อมูลสินค้า */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  ข้อมูลสินค้า
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">ชื่อสินค้า</label>
                    <p className="text-base bg-white px-3 py-2 rounded-lg border">
                      {movementToView.product_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">รหัส SKU</label>
                    <p className="text-base font-mono bg-white px-3 py-2 rounded-lg border">
                      {movementToView.product_sku || '-'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">จำนวน</label>
                    <p className={`text-2xl font-bold bg-white px-3 py-2 rounded-lg border ${
                      movementToView.type === 'in' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {movementToView.type === 'in' ? '+' : '-'}{movementToView.quantity.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">เหตุผล</label>
                    <p className="text-base bg-white px-3 py-2 rounded-lg border">
                      {movementToView.reason || '-'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ข้อมูลผู้เกี่ยวข้อง */}
              {movementToView.person_name && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3 flex items-center gap-2">
                    <User className="h-5 w-5" />
                    ข้อมูล{movementToView.withdrawal_no ? 'ผู้เบิก' : 'ผู้รับ'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">
                        {movementToView.withdrawal_no ? 'ผู้เบิกพัสดุ' : 'ผู้รับพัสดุ'}
                      </label>
                      <p className="text-base bg-white px-3 py-2 rounded-lg border">
                        {movementToView.person_name}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setViewDialogOpen(false)}
              className="px-6 rounded-xl border-2 border-gray-200 hover:border-gray-300"
            >
              ปิด
            </Button>
            {movementToView && (
              <Button
                onClick={() => handlePrintMovement(movementToView)}
                className="px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                <Printer className="h-4 w-4 mr-2" />
                พิมพ์
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ProductsStylePageLayout>
  );
}