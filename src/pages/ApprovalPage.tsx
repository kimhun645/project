import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { 
  CheckCircle, 
  XCircle, 
  Printer, 
  User, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Package,
  ArrowLeft,
  List,
  Home,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  TrendingUp,
  Users,
  Building2,
  Bell,
  Settings,
  RefreshCw,
  Download,
  Share2,
  MoreHorizontal,
  AlertTriangle,
  Info,
  Zap
} from 'lucide-react';
import { type BudgetRequest as DBBudgetRequest, type Approval as ApprovalInfo } from '@/lib/firestoreService';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { useToast } from '@/hooks/use-toast';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { 
  ProductsStylePageLayout, 
  ProductsStylePageHeader, 
  ProductsStyleStatsCards, 
  ProductsStyleBulkActionsBar, 
  ProductsStyleDeleteConfirmationDialog,
  TableColumn 
} from '@/components/ui/products-style-components';
import { ProductsStyleDataTable } from '@/components/ui/products-style-data-table';
import { ProductsStylePagination } from '@/components/ui/products-style-pagination';

// Function to convert number to Thai text
const convertToThaiText = (num: number): string => {
  const thaiNumbers = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const thaiUnits = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน', 'ล้าน'];
  
  if (num === 0) return 'ศูนย์';
  if (num < 10) return thaiNumbers[num];
  
  const numStr = num.toString();
  const len = numStr.length;
  let result = '';
  
  for (let i = 0; i < len; i++) {
    const digit = parseInt(numStr[i]);
    const position = len - i - 1;
    
    if (digit !== 0) {
      if (position === 1 && digit === 1) {
        result += 'สิบ';
      } else if (position === 1 && digit === 2) {
        result += 'ยี่สิบ';
      } else if (position === 1) {
        result += thaiNumbers[digit] + 'สิบ';
      } else {
        result += thaiNumbers[digit] + thaiUnits[position];
      }
    }
  }
  
  return result + 'บาทถ้วน';
};

const ApprovalPage: React.FC = () => {
  const { request_id } = useParams<{ request_id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuth();
  
  // State declarations
  const [budgetRequest, setBudgetRequest] = useState<DBBudgetRequest | null>(null);
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null);
  const [pendingRequests, setPendingRequests] = useState<DBBudgetRequest[]>([]);
  const [allRequests, setAllRequests] = useState<DBBudgetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [approvalRemark, setApprovalRemark] = useState('');
  const [confirmationText, setConfirmationText] = useState('');
  
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('PENDING');
  const [amountFilter, setAmountFilter] = useState<string>('ALL');
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<string>('request_date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table');

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for approval request when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาการอนุมัติ: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });

  useEffect(() => {
    if (request_id) {
      fetchBudgetRequest(request_id);
    } else {
      fetchPendingRequests();
    }
  }, [request_id]);

  // Filter and search functions - Show all requests
  const getFilteredRequests = () => {
    // Show all requests (not just PENDING)
    let filtered = allRequests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.request_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.account_name && req.account_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Amount filter
    if (amountFilter !== 'ALL') {
      filtered = filtered.filter(req => {
        const amount = parseFloat(req.amount?.toString() || '0');
        switch (amountFilter) {
          case 'UNDER_1000': return amount < 1000;
          case '1000_5000': return amount >= 1000 && amount <= 5000;
          case '5000_10000': return amount > 5000 && amount <= 10000;
          case 'OVER_10000': return amount > 10000;
          default: return true;
        }
      });
    }

    return filtered;
  };

  // Use getFilteredRequests function
  const filteredRequests = getFilteredRequests();
  
  // Debug logging
  console.log('🔍 Debug Info:');
  console.log('📊 allRequests:', allRequests.length);
  console.log('🔍 filteredRequests:', filteredRequests.length);
  console.log('🔍 searchTerm:', searchTerm);
  console.log('🔍 statusFilter:', statusFilter);
  console.log('🔍 amountFilter:', amountFilter);

  // Sorted requests
  const sortedRequests = useMemo(() => {
    return [...filteredRequests].sort((a, b) => {
      let aValue: any = a[sortField as keyof DBBudgetRequest];
      let bValue: any = b[sortField as keyof DBBudgetRequest];
      
      if (sortField === 'amount') {
        aValue = parseFloat(aValue?.toString() || '0');
        bValue = parseFloat(bValue?.toString() || '0');
      } else if (sortField === 'request_date') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      } else {
        aValue = aValue?.toString().toLowerCase() || '';
        bValue = bValue?.toString().toLowerCase() || '';
      }
      
      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }, [filteredRequests, sortField, sortDirection]);

  // Paginated requests
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedRequests.slice(startIndex, endIndex);
  }, [sortedRequests, currentPage, itemsPerPage]);

  // Statistics
  const stats = useMemo(() => {
    const total = allRequests.length;
    const pending = allRequests.filter(r => r.status === 'PENDING').length;
    const approved = allRequests.filter(r => r.status === 'APPROVED').length;
    const rejected = allRequests.filter(r => r.status === 'REJECTED').length;
    const totalAmount = allRequests.reduce((sum, r) => sum + parseFloat(r.amount.toString()), 0);
    
    return { total, pending, approved, rejected, totalAmount };
  }, [allRequests]);

  // Bulk actions handlers
  const handleSelectRequest = (requestId: string) => {
    setSelectedRequests(prev => 
      prev.includes(requestId) 
        ? prev.filter(id => id !== requestId)
        : [...prev, requestId]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(paginatedRequests.map(r => r.id.toString()));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequests.length === 0) return;
    
    try {
      setIsLoading(true);
      const { FirestoreService } = await import('@/lib/firestoreService');
      for (const requestId of selectedRequests) {
        await FirestoreService.updateBudgetRequest(requestId, {
          status: 'APPROVED',
          approved_by: 'ผู้บริหาร',
          approved_at: new Date().toISOString()
        });
      }
      
      toast({
        title: "อนุมัติสำเร็จ",
        description: `อนุมัติคำขอ ${selectedRequests.length} รายการเรียบร้อยแล้ว`,
        variant: "default"
      });
      
      setSelectedRequests([]);
      await fetchPendingRequests();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถอนุมัติคำขอได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedRequests.length === 0) return;
    
    try {
      setIsLoading(true);
      const { FirestoreService } = await import('@/lib/firestoreService');
      for (const requestId of selectedRequests) {
        await FirestoreService.updateBudgetRequest(requestId, {
          status: 'REJECTED',
          approved_by: 'ผู้บริหาร',
          approved_at: new Date().toISOString()
        });
      }
      
      toast({
        title: "ปฏิเสธสำเร็จ",
        description: `ปฏิเสธคำขอ ${selectedRequests.length} รายการเรียบร้อยแล้ว`,
        variant: "default"
      });
      
      setSelectedRequests([]);
      await fetchPendingRequests();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถปฏิเสธคำขอได้",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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

  const handleRefresh = () => {
    if (request_id) {
      fetchBudgetRequest(request_id);
    } else {
      fetchPendingRequests();
    }
  };

  const handleClearSelection = () => {
    setSelectedRequests([]);
  };

  const handleFilter = () => {
    setShowFilters(!showFilters);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('PENDING');
    setAmountFilter('ALL');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'PENDING' || amountFilter !== 'ALL';

  // Table columns definition
  const columns: TableColumn[] = [
    {
      key: 'request_no',
      title: 'รหัสคำขอ',
      sortable: true,
      render: (value, row) => {
        let displayValue = '';
        if (typeof value === 'string') {
          displayValue = value;
        } else if (value && typeof value === 'object' && value.request_no) {
          displayValue = value.request_no;
        } else {
          displayValue = String(value || '');
        }
        
        return (
          <div className="font-semibold text-blue-600">
            {displayValue}
          </div>
        );
      }
    },
    {
      key: 'requester',
      title: 'ผู้ขอ',
      sortable: true,
      render: (value) => {
        let displayValue = '';
        if (typeof value === 'string') {
          displayValue = value;
        } else if (value && typeof value === 'object' && value.requester) {
          displayValue = value.requester;
        } else {
          displayValue = String(value || '');
        }
        
        return (
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span>{displayValue}</span>
          </div>
        );
      }
    },
    {
      key: 'amount',
      title: 'จำนวนเงิน',
      sortable: true,
      render: (value) => {
        // Handle different data types
        let amount = 0;
        if (typeof value === 'number') {
          amount = value;
        } else if (typeof value === 'string') {
          amount = parseFloat(value) || 0;
        } else if (value && typeof value === 'object' && value.amount) {
          amount = parseFloat(value.amount) || 0;
        }
        
        return (
          <div className="text-center">
            <div className="font-semibold text-green-600">
              ฿{amount.toLocaleString('th-TH')}
            </div>
          </div>
        );
      }
    },
    {
      key: 'account_code',
      title: 'รหัสบัญชี',
      sortable: true,
      render: (value, row) => {
        let accountCode = '';
        let accountName = '';
        
        if (typeof value === 'string') {
          accountCode = value;
        } else if (value && typeof value === 'object' && value.account_code) {
          accountCode = value.account_code;
        } else {
          accountCode = String(value || '');
        }
        
        if (row && typeof row === 'object' && row.account_name) {
          accountName = row.account_name;
        } else if (value && typeof value === 'object' && value.account_name) {
          accountName = value.account_name;
        }
        
        return (
          <div>
            <div className="font-medium">{accountCode}</div>
            {accountName && (
              <div className="text-sm text-gray-500">{accountName}</div>
            )}
          </div>
        );
      }
    },
    {
      key: 'request_date',
      title: 'วันที่ขอ',
      sortable: true,
      render: (value, row) => {
        let dateValue = '';
        
        // Try to get date from different sources
        if (typeof value === 'string') {
          dateValue = value;
        } else if (value && typeof value === 'object' && value.request_date) {
          dateValue = value.request_date;
        } else if (row && typeof row === 'object' && row.request_date) {
          dateValue = row.request_date;
        } else {
          dateValue = String(value || '');
        }
        
        // Handle different date formats
        let date;
        if (dateValue.includes('T')) {
          // ISO format: 2024-01-17T00:00:00.000Z
          date = new Date(dateValue);
        } else if (dateValue.includes('-')) {
          // Date format: 2024-01-17
          date = new Date(dateValue + 'T00:00:00.000Z');
        } else {
          // Try parsing as is
          date = new Date(dateValue);
        }
        
        const isValidDate = !isNaN(date.getTime());
        return (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span>{isValidDate ? date.toLocaleDateString('th-TH', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              calendar: 'gregory'
            }) : 'ไม่ระบุ'}</span>
          </div>
        );
      }
    },
    {
      key: 'status',
      title: 'สถานะ',
      sortable: true,
      render: (value, row) => {
        let status = '';
        
        // Try to get status from different sources
        if (typeof value === 'string') {
          status = value;
        } else if (value && typeof value === 'object' && value.status) {
          status = value.status;
        } else if (row && typeof row === 'object' && row.status) {
          status = row.status;
        } else {
          status = String(value || '');
        }
        
        // Normalize status
        status = status.toUpperCase();
        
        return (
          <Badge 
            variant={status === 'PENDING' ? 'secondary' : 
                   status === 'APPROVED' ? 'default' : 'destructive'}
            className={`px-3 py-1 text-sm font-bold ${
              status === 'PENDING' 
                ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0' 
                : status === 'APPROVED' 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                  : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
            }`}
          >
            {status === 'PENDING' ? (
              <>
                <Clock className="h-3 w-3 mr-1" />
                รอการอนุมัติ
              </>
            ) : status === 'APPROVED' ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                อนุมัติแล้ว
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 mr-1" />
                ปฏิเสธ
              </>
            )}
          </Badge>
        );
      }
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (value, row) => (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/approval/${row.id}`)}
            className="h-8 px-3"
          >
            <Eye className="h-4 w-4 mr-1" />
            พิจารณา
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePrint(row)}
            className="h-8 px-3"
          >
            <Printer className="h-4 w-4 mr-1" />
            พิมพ์
          </Button>
        </div>
      )
    }
  ];

  const fetchPendingRequests = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 กำลังดึงข้อมูลคำขอใช้งบประมาณ...');
      
      // เพิ่มการตรวจสอบ Firebase connection
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // ตรวจสอบว่า Firebase ทำงานหรือไม่
      if (!FirestoreService) {
        throw new Error('Firebase service not available');
      }
      
      const requests = await FirestoreService.getBudgetRequests();
      console.log('📊 ข้อมูลที่ได้รับ:', requests.length, 'รายการ');
      console.log('📋 รายการคำขอ:', requests);
      
      // ตรวจสอบว่าข้อมูลเป็น array หรือไม่
      if (!Array.isArray(requests)) {
        console.warn('⚠️ ข้อมูลที่ได้รับไม่ใช่ array:', typeof requests);
        setAllRequests([]);
        setPendingRequests([]);
        return;
      }
      
      setAllRequests(requests);
      const pending = requests.filter(req => req.status === 'PENDING');
      console.log('⏳ คำขอที่รอการอนุมัติ:', pending.length, 'รายการ');
      setPendingRequests(pending);
      
      // แสดงข้อความเมื่อไม่มีข้อมูล
      if (requests.length === 0) {
        console.log('📭 ไม่พบข้อมูลคำขอใช้งบประมาณ');
      }
    } catch (err) {
      console.error('❌ ข้อผิดพลาดในการดึงข้อมูล:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      
      setAllRequests([]);
      setPendingRequests([]);
      
      // แสดง error message ที่ชัดเจนขึ้น
      if (err instanceof Error) {
        if (err.message.includes('Failed to fetch')) {
          setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
        } else if (err.message.includes('NetworkError')) {
          setError('เกิดข้อผิดพลาดเครือข่าย กรุณาลองใหม่อีกครั้ง');
        } else if (err.message.includes('Firebase service not available')) {
          setError('Firebase service ไม่พร้อมใช้งาน กรุณารีเฟรชหน้า');
        } else {
          setError(`ไม่สามารถโหลดรายการคำขอได้: ${err.message}`);
        }
      } else {
        setError('ไม่สามารถโหลดรายการคำขอได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgetRequest = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔍 Fetching budget request with ID:', id);
      
      const { FirestoreService } = await import('@/lib/firestoreService');
      console.log('📦 FirestoreService loaded:', !!FirestoreService);
      
      const request = await FirestoreService.getBudgetRequest(id);
      console.log('📊 Received budget request:', request);
      
      if (!request) {
        console.warn('⚠️ No budget request found for ID:', id);
        setError('ไม่พบข้อมูลคำขอใช้งบประมาณ');
        return;
      }
      
      setBudgetRequest(request);
      
      // Fetch approval info if not pending
      if (request.status !== 'PENDING') {
        try {
          const approval = await FirestoreService.getApprovalByRequestId(request.id.toString());
          setApprovalInfo(approval);
        } catch (err) {
          console.log('No approval info found or error:', err);
        }
      }
    } catch (err) {
      console.error('❌ Error fetching budget request:', err);
      console.error('❌ Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : undefined,
        name: err instanceof Error ? err.name : undefined
      });
      setError(`ไม่สามารถโหลดข้อมูลคำขอได้: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };


  const getStatusStats = () => {
    const pending = allRequests.filter(req => req.status === 'PENDING').length;
    const approved = allRequests.filter(req => req.status === 'APPROVED').length;
    const rejected = allRequests.filter(req => req.status === 'REJECTED').length;
    const totalAmount = allRequests
      .filter(req => req.status === 'PENDING')
      .reduce((sum, req) => sum + parseFloat(req.amount.toString()), 0);

    return { pending, approved, rejected, totalAmount };
  };

  const handleApprove = async (requestId?: string) => {
    if (requestId) {
      // Single request approval
      const currentStatus = String(budgetRequest?.status || '').toUpperCase();
      
      if (currentStatus === 'APPROVED') {
        alert('คำขอนี้ได้รับการอนุมัติแล้ว');
        return;
      }

      // Check if user has permission to approve
      if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์ในการอนุมัติ');
        return;
      }

      try {
        const { FirestoreService } = await import('@/lib/firestoreService');
        const approverName = currentUser?.displayName || currentUser?.email || 'ผู้อนุมัติ';
        
        await FirestoreService.updateBudgetRequestStatus(requestId, 'APPROVED', approverName);
        
        // Refresh the budget request data
        await fetchBudgetRequest(requestId);
        
        // Show success message
        toast({
          title: "อนุมัติสำเร็จ",
          description: "อนุมัติคำขอเรียบร้อยแล้ว",
          variant: "default"
        });
        
      } catch (error) {
        console.error('Error approving request:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถอนุมัติคำขอได้",
          variant: "destructive"
        });
      }
    } else {
      // Multiple requests approval
      setShowApprovalDialog(true);
    }
  };


  const handleReject = async (requestId?: string) => {
    if (requestId) {
      // Single request rejection
      const currentStatus = String(budgetRequest?.status || '').toUpperCase();
      if (currentStatus === 'REJECTED') {
        alert('คำขอนี้ถูกปฏิเสธแล้ว');
        return;
      }

      // Check if user has permission to reject
      if (!currentUser) {
        alert('กรุณาเข้าสู่ระบบก่อน');
        return;
      }

      if (currentUser.role !== 'manager' && currentUser.role !== 'admin') {
        alert('คุณไม่มีสิทธิ์ในการปฏิเสธ');
        return;
      }

      try {
        const { FirestoreService } = await import('@/lib/firestoreService');
        const approverName = currentUser?.displayName || currentUser?.email || 'ผู้อนุมัติ';
        
        await FirestoreService.updateBudgetRequestStatus(requestId, 'REJECTED', approverName);
        
        // Refresh the budget request data
        await fetchBudgetRequest(requestId);
        
        // Show success message
        toast({
          title: "ปฏิเสธสำเร็จ",
          description: "ปฏิเสธคำขอเรียบร้อยแล้ว",
          variant: "default"
        });
        
      } catch (error) {
        console.error('Error rejecting request:', error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถปฏิเสธคำขอได้",
          variant: "destructive"
        });
      }
    } else {
      // Multiple requests rejection
      setShowRejectDialog(true);
    }
  };


  const sendApprovalNotification = async (requestData: DBBudgetRequest, decision: 'APPROVED' | 'REJECTED', approverName: string, remark: string) => {
    try {
      // Get requester email from settings or request data
      let requesterEmail = 'requester@stockflow.com'; // Default fallback
      
      try {
        // Try to get requester email from settings
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          requesterEmail = settings.email || requesterEmail;
        }
      } catch (error) {
        console.log('Using default requester email:', requesterEmail);
      }
      
      const subject = decision === 'APPROVED' 
        ? `✅ คำขอใช้งบประมาณ ${requestData.request_no} ได้รับการอนุมัติ`
        : `❌ คำขอใช้งบประมาณ ${requestData.request_no} ถูกปฏิเสธ`;

      const statusText = decision === 'APPROVED' ? 'อนุมัติ' : 'ปฏิเสธ';
      const statusColor = decision === 'APPROVED' ? '#28a745' : '#dc3545';
      const statusIcon = decision === 'APPROVED' ? '✅' : '❌';

      const htmlBody = `
        <!DOCTYPE html>
        <html lang="th">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ผลการพิจารณาคำขอใช้งบประมาณ</title>
          <style>
            body { font-family: 'Sarabun', Arial, sans-serif; line-height: 1.6; color: #333; font-size: 16px; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; }
            .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
            .status-approved { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .status-rejected { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 16px; }
            .label { font-weight: bold; color: #495057; }
            .value { color: #212529; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; text-align: center; color: #6c757d; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0; text-align: center;">${statusIcon} ผลการพิจารณาคำขอใช้งบประมาณ</h1>
            </div>
            <div class="content">
              <div class="status-badge ${decision === 'APPROVED' ? 'status-approved' : 'status-rejected'}">
                ${statusIcon} คำขอได้รับการ${statusText}
              </div>
              
              <div class="info-row">
                <span class="label">รหัสคำขอ:</span>
                <span class="value">${requestData.request_no}</span>
              </div>
              <div class="info-row">
                <span class="label">ผู้ขอ:</span>
                <span class="value">${requestData.requester}</span>
              </div>
              <div class="info-row">
                <span class="label">วันที่ขอ:</span>
                <span class="value">${new Date(requestData.request_date).toLocaleDateString('th-TH')}</span>
              </div>
              <div class="info-row">
                <span class="label">รหัสบัญชี:</span>
                <span class="value">${requestData.account_code}${requestData.account_name ? ` (${requestData.account_name})` : ''}</span>
              </div>
              <div class="info-row">
                <span class="label">จำนวนเงิน:</span>
                <span class="value">${parseFloat(requestData.amount.toString()).toLocaleString('th-TH')} บาท</span>
              </div>
              <div class="info-row">
                <span class="label">ผู้อนุมัติ:</span>
                <span class="value">${approverName}</span>
              </div>
              <div class="info-row">
                <span class="label">วันที่พิจารณา:</span>
                <span class="value">${new Date().toLocaleDateString('th-TH')}</span>
              </div>
              
              ${remark ? `
                <div style="margin-top: 20px; padding: 15px; background-color: #e9ecef; border-radius: 8px; border-left: 4px solid ${statusColor};">
                  <strong>หมายเหตุจากผู้อนุมัติ:</strong><br>
                  ${remark}
                </div>
              ` : ''}
              
              <div class="footer">
                <p>อีเมลนี้ถูกส่งจากระบบ Stock Scribe Analyzer</p>
                <p>หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      const textBody = `
ผลการพิจารณาคำขอใช้งบประมาณ

${statusIcon} คำขอได้รับการ${statusText}

รหัสคำขอ: ${requestData.request_no}
ผู้ขอ: ${requestData.requester}
วันที่ขอ: ${new Date(requestData.request_date).toLocaleDateString('th-TH')}
รหัสบัญชี: ${requestData.account_code}${requestData.account_name ? ` (${requestData.account_name})` : ''}
จำนวนเงิน: ${parseFloat(requestData.amount.toString()).toLocaleString('th-TH')} บาท
ผู้อนุมัติ: ${approverName}
วันที่พิจารณา: ${new Date().toLocaleDateString('th-TH')}

${remark ? `หมายเหตุจากผู้อนุมัติ: ${remark}` : ''}

---
อีเมลนี้ถูกส่งจากระบบ Stock Scribe Analyzer
      `;

      // Send email notification
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'koratnrs@rockchatn.com',
          to: requesterEmail,
          subject: subject,
          html: htmlBody,
          text: textBody
        })
      });

      if (!response.ok) {
        console.error('Failed to send approval notification email');
      } else {
        console.log('Approval notification email sent successfully');
      }

    } catch (error) {
      console.error('Error sending approval notification:', error);
    }
  };



  const handlePrint = async (request: DBBudgetRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsTable = request.material_list?.length
      ? `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px;"><thead><tr style="background-color:#f1f1f1;"><th style="border:1px solid #ddd;padding:10px;text-align:center;">ลำดับที่</th><th style="border:1px solid #ddd;padding:10px;text-align:center;">รายการ</th><th style="border:1px solid #ddd;padding:10px;text-align:center;">จำนวน</th></tr></thead><tbody>${request.material_list
          .map(
            (item, idx) => `<tr><td style="border:1px solid #ddd;padding:10px;text-align:center;">${idx + 1}</td><td style="border:1px solid #ddd;padding:10px;">${item.name || item.item || '-'}</td><td style="border:1px solid #ddd;padding:10px;text-align:center;">${item.quantity || '-'} ${item.unit || ''}</td></tr>`
          )
          .join('')}</tbody></table>`
      : `<p style="text-align:center;color:#666;font-size:12px;margin:20px 0;">ไม่มีรายการวัสดุ</p>`;

    const printContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คำขออนุมัติใช้งบประมาณ ${request.request_no}</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page { 
      size: A4 portrait; 
      margin: 1.5cm; 
    }
    body { 
      font-family: 'Sarabun', 'Tahoma', sans-serif; 
      font-size: 14px; 
      line-height: 1.8; 
      margin: 0; 
      padding: 20px;
      color: #333;
    }
    .print-header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 20px; 
      padding-bottom: 15px; 
      border-bottom: 2px solid #2c3e50; 
    }
    .print-logo { 
      width: 30%; 
      text-align: left; 
    }
    .print-title { 
      width: 40%; 
      text-align: center; 
      font-weight: bold; 
      font-size: 20px; 
    }
    .print-code { 
      width: 30%; 
      text-align: right; 
    }
    .memo-title { 
      text-align: center; 
      font-weight: 700; 
      font-size: 24px; 
      margin-bottom: 25px; 
      color: #2c3e50; 
    }
    .memo-header { 
      display: flex; 
      justify-content: space-between; 
      margin-bottom: 20px; 
    }
    .memo-to { 
      margin-bottom: 20px; 
    }
    .memo-content { 
      margin-bottom: 25px; 
      text-indent: 2rem; 
      text-align: justify; 
    }
    .memo-signature { 
      display: flex; 
      justify-content: flex-end; 
      flex-direction: column; 
      align-items: flex-end; 
      margin-top: 50px; 
    }
    .memo-table { 
      width: 100%; 
      margin: 20px 0; 
      border-collapse: collapse; 
    }
    .memo-table th { 
      background-color: #f1f1f1; 
      padding: 10px; 
      border: 1px solid #ddd; 
      text-align: center; 
    }
    .memo-table td { 
      padding: 10px; 
      border: 1px solid #ddd; 
    }
    .approval-section { 
      margin-top: 40px; 
      padding-top: 20px; 
      border-top: 1px dashed #ccc; 
    }
    .center-text { 
      text-align: center; 
    }
    @media print {
      body { 
        padding: 0; 
        margin: 0; 
      }
    }
  </style>
</head>
<body>
  <div class="print-header">
    <div class="print-logo">
      <strong>ศูนย์จัดการธนบัตร นครราชสีมา</strong><br>
      สำนักงานธนาคารแห่งประเทศไทย
    </div>
    <div class="print-title"></div>
    <div class="print-code">
      <strong>รหัสคำขอ:</strong> ${request.request_no}<br>
      <strong>วันที่:</strong> ${new Date(request.request_date).toLocaleDateString('th-TH')}<br>
      <strong>สถานะ:</strong> ${request.status === 'PENDING' ? 'รอการอนุมัติ' : 
                               request.status === 'APPROVED' ? 'อนุมัติแล้ว' : 
                               request.status === 'REJECTED' ? 'ปฏิเสธ' : 'ไม่ระบุ'}
    </div>
  </div>

  <div class="memo-title">บันทึกขออนุมัติใช้งบประมาณ</div>
  
  <div class="memo-header">
    <div>
      <strong>ส่วนงาน</strong> ศูนย์จัดการธนบัตร นครราชสีมา
    </div>
    <div style="text-align: right;">
      <strong>วันที่</strong> ${new Date(request.request_date).toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>
  </div>
  
  <div class="memo-to">
    <strong>เรื่อง</strong> ขออนุมัติใช้งบประมาณจัดซื้อ (${request.account_name || ''})<br>
    <strong>เรียน</strong> ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา
  </div>
  
  <div class="memo-content">
    <p>
      งานธุรการ ขอใช้งบประมาณจำนวน <strong>${parseFloat(request.amount.toString()).toLocaleString('th-TH')} บาท</strong> 
      (<u>${convertToThaiText(parseFloat(request.amount.toString()))}</u>) 
      จากรหัสบัญชี <strong>${request.account_code}</strong>${request.account_name ? ` (${request.account_name})` : ''}
      ตามรายการดังต่อไปนี้
    </p>
    
    ${itemsTable}
    
    <p>
      จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
    </p>
  </div>
  
  <div class="approval-section">
    <div class="memo-signature">
      <div style="margin-bottom: 60px; text-align: center;">
        (ลงชื่อ) ................................................<br>
        (${request.requester})<br>
        ตำแหน่ง เจ้าหน้าที่งานบริหารธนบัตรอาวุโส (ควบ)
      </div>
      <div class="center-text">
        ${request.status === 'APPROVED' || request.status === 'REJECTED' 
          ? `วันที่อนุมัติ: ${request.approved_at ? new Date(request.approved_at).toLocaleDateString('th-TH', {
              year: 'numeric',
              month: '2-digit', 
              day: '2-digit',
              calendar: 'gregory'
            }) : 'ไม่ระบุ'}`
          : 'วันที่อนุมัติ...../...../.......'
        }
      </div>
      ${request.status === 'APPROVED' || request.status === 'REJECTED' 
        ? `<div class="center-text" style="margin-top: 10px;">
             ผู้อนุมัติ: ${request.approver_name || 'ไม่ระบุ'}
           </div>`
        : ''
      }
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Show error when there's an error loading the request
  if (request_id && error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto p-6">
          <Button
            variant="outline"
            onClick={() => navigate('/approval')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            กลับ
          </Button>
          
          <Card>
            <CardContent className="text-center py-12">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <div className="space-y-2">
                <Button onClick={() => window.location.reload()}>
                  รีเฟรชหน้า
                </Button>
                <Button variant="outline" onClick={() => navigate('/approval')}>
                  กลับไปหน้ารายการ
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Show detail view when request_id is provided
  if (request_id && budgetRequest) {
    return (
      <Layout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
          <div className="max-w-7xl mx-auto p-6">
            {/* Back Button */}
            <Button
              variant="outline"
              onClick={() => navigate('/approval')}
              className="mb-6 bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
            
            {/* Modern Modal Design */}
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">คำขออนุมัติใช้งบประมาณ</h1>
                      <p className="text-blue-100 text-lg">รหัสคำขอ: {budgetRequest.request_no}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-blue-100 mb-1">วันที่ขอ</div>
                    <div className="text-lg font-semibold">
                      {new Date(budgetRequest.request_date).toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8">
                {/* Status and Basic Info */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-xl">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-orange-600 font-medium">สถานะ</div>
                        <div className="text-lg font-bold text-orange-800">
                          {String(budgetRequest.status).toUpperCase() === 'PENDING' ? 'รอการอนุมัติ' : 
                           String(budgetRequest.status).toUpperCase() === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">จำนวนเงิน</div>
                        <div className="text-lg font-bold text-green-800">
                          ฿{parseFloat(budgetRequest.amount.toString()).toLocaleString('th-TH')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Requester Card */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-purple-100 rounded-xl">
                        <User className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-purple-600 font-medium">ผู้ขอ</div>
                        <div className="text-lg font-bold text-purple-800">{budgetRequest.requester}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approver Info - Only show if approved/rejected */}
                {(budgetRequest.status === 'APPROVED' || budgetRequest.status === 'REJECTED') && (
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-indigo-100 rounded-xl">
                        <CheckCircle className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm text-indigo-600 font-medium mb-1">ผู้อนุมัติ</div>
                        <div className="text-lg font-bold text-indigo-800">
                          {budgetRequest.approved_by && !budgetRequest.approved_by.includes('@') 
                            ? budgetRequest.approved_by 
                            : budgetRequest.approver_name || 'ผู้จัดการศูนย์'}
                        </div>
                        {budgetRequest.approved_at && (
                          <div className="text-sm text-indigo-600 mt-1">
                            วันที่: {new Date(budgetRequest.approved_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Document Content */}
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-8 border border-gray-200">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">บันทึกขออนุมัติใช้งบประมาณ</h2>
                    <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-500 mx-auto rounded-full"></div>
                  </div>

                  {/* Organization Info */}
                  <div className="space-y-4 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">ส่วนงาน</div>
                        <div className="font-semibold text-gray-800">ศูนย์จัดการธนบัตร นครราชสีมา</div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-gray-200">
                        <div className="text-sm text-gray-600 mb-1">รหัสบัญชี</div>
                        <div className="font-semibold text-gray-800">
                          {budgetRequest.account_code} {budgetRequest.account_name && `(${budgetRequest.account_name})`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Content */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                    <p className="text-justify leading-relaxed text-gray-700">
                      งานธุรการ ขอใช้งบประมาณจำนวน <span className="font-bold text-blue-600 text-lg">
                        {parseFloat(budgetRequest.amount.toString()).toLocaleString('th-TH')} บาท
                      </span> 
                      (<span className="text-green-600 font-medium">{convertToThaiText(parseFloat(budgetRequest.amount.toString()))}</span>) 
                      จากรหัสบัญชี <span className="font-bold text-purple-600">{budgetRequest.account_code}</span>
                      {budgetRequest.account_name && <span className="text-gray-600"> ({budgetRequest.account_name})</span>}
                      ตามรายการดังต่อไปนี้
                    </p>
                  </div>

                  {/* Material List */}
                  {budgetRequest.material_list && budgetRequest.material_list.length > 0 ? (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                      <div className="bg-gradient-to-r from-gray-100 to-slate-100 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800">รายการวัสดุ</h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">ลำดับ</th>
                              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 border-b border-gray-200">รายการ</th>
                              <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600 border-b border-gray-200">จำนวน</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budgetRequest.material_list.map((item: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-6 py-4 text-center text-gray-600 font-medium">{idx + 1}</td>
                                <td className="px-6 py-4 text-gray-800">{item.name || '-'}</td>
                                <td className="px-6 py-4 text-center text-gray-600">{item.quantity || '-'} {item.unit || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center mb-6">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">ไม่มีรายการวัสดุ</p>
                    </div>
                  )}

                  {/* Closing Statement */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <p className="text-justify text-gray-700 font-medium">
                      จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </p>
                  </div>
                </div>

                {/* Action Buttons - Only show for PENDING status */}
                {String(budgetRequest.status).toUpperCase() === 'PENDING' && (
                  <div className="mt-8 flex justify-center space-x-4">
                    <Button
                      onClick={() => handleApprove(budgetRequest.id)}
                      className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <CheckCircle className="h-5 w-5 mr-2" />
                      อนุมัติ
                    </Button>
                    <Button
                      onClick={() => handleReject(budgetRequest.id)}
                      className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
                    >
                      <XCircle className="h-5 w-5 mr-2" />
                      ปฏิเสธ
                    </Button>
                  </div>
                )}

                {/* Signature Section */}
                <div className="mt-8 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-8 border border-gray-200">
                  <div className="flex justify-between items-end">
                    {/* Requester Signature */}
                    <div className="text-center">
                      <div className="mb-8">
                        <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                        <div className="text-sm text-gray-600">(ลงชื่อ) ................................................</div>
                        <div className="text-sm font-semibold text-gray-800">({budgetRequest.requester})</div>
                        <div className="text-sm text-gray-600">ตำแหน่ง เจ้าหน้าที่งานบริหารธนบัตรอาวุโส (ควบ)</div>
                      </div>
                    </div>
                    
                    {/* Approver Signature */}
                    {budgetRequest.status !== 'PENDING' && (
                      <div className="text-center">
                        <div className="mb-8">
                          <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                          <div className="text-sm text-gray-600">ผู้อนุมัติ</div>
                          <div className="text-sm font-semibold text-gray-800">
                            ({budgetRequest.approved_by && !budgetRequest.approved_by.includes('@') 
                              ? budgetRequest.approved_by 
                              : budgetRequest.approver_name || 'ผู้จัดการศูนย์'})
                          </div>
                          <div className="text-sm text-gray-600">ตำแหน่ง ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          วันที่อนุมัติ: {budgetRequest.approved_at ? 
                            new Date(budgetRequest.approved_at).toLocaleDateString('th-TH', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            }) : '...../...../.......'
                          }
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show pending requests list when no specific request_id
  if (!request_id) {
    if (isLoading) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">กำลังโหลดรายการคำขอ...</p>
            </div>
          </div>
        </Layout>
      );
    }

    if (error) {
      return (
        <Layout>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => navigate('/')}>
                กลับสู่หน้าหลัก
              </Button>
            </div>
          </div>
        </Layout>
      );
    }

    // Show message when no requests found
    if (allRequests.length === 0) {
      return (
        <ProductsStylePageLayout>
          <ProductsStylePageHeader
            title="การอนุมัติใช้งบประมาณ"
            description="จัดการการอนุมัติคำขอใช้งบประมาณ"
            showBackButton={false}
            actions={
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchPendingRequests()}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/budget-request')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  สร้างคำขอใหม่
                </Button>
              </div>
            }
          />
          
          <div className="space-y-6">
            {/* Stats Cards */}
            <ProductsStyleStatsCards
              stats={[
                {
                  title: 'รอการอนุมัติ',
                  value: pendingRequests.length.toString(),
                  change: '0%',
                  trend: 'neutral',
                  icon: <Clock className="h-6 w-6" />,
                  color: 'yellow'
                },
                {
                  title: 'อนุมัติแล้ว',
                  value: allRequests.filter(r => r.status === 'APPROVED').length.toString(),
                  change: '0%',
                  trend: 'up',
                  icon: <CheckCircle className="h-6 w-6" />,
                  color: 'green'
                },
                {
                  title: 'ปฏิเสธแล้ว',
                  value: allRequests.filter(r => r.status === 'REJECTED').length.toString(),
                  change: '0%',
                  trend: 'down',
                  icon: <XCircle className="h-6 w-6" />,
                  color: 'red'
                },
                {
                  title: 'ทั้งหมด',
                  value: allRequests.length.toString(),
                  change: '0%',
                  trend: 'neutral',
                  icon: <FileText className="h-6 w-6" />,
                  color: 'blue'
                }
              ]}
            />

            {/* Empty State */}
            <Card className="bg-gradient-to-br from-gray-50 via-white to-slate-50 border-2 border-gray-200 shadow-xl">
              <CardContent className="p-12 text-center">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                  <FileText className="h-10 w-10 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบคำขออนุมัติ</h3>
                <p className="text-gray-600 mb-6">ยังไม่มีคำขอใช้งบประมาณที่รอการอนุมัติในระบบ</p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => navigate('/budget-request')}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    สร้างคำขอใหม่
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => fetchPendingRequests()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    รีเฟรชข้อมูล
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </ProductsStylePageLayout>
      );
    }

    return (
      <ProductsStylePageLayout>
        {/* Page Header */}
        <ProductsStylePageHeader
          title="พิจารณาคำขอใช้งบประมาณ"
          searchPlaceholder="ค้นหาคำขอใช้งบประมาณ..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
          scannerDetected={scannerDetected}
          actionButtons={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFilter}
                className={`h-9 px-3 rounded-lg transition-all duration-200 ${
                  showFilters 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white'
                }`}
              >
                <Filter className="h-4 w-4 mr-2" />
                ตัวกรอง
              </Button>
            </div>
          }
        />

        {/* Stats Cards */}
        <ProductsStyleStatsCards
          cards={[
            {
              title: "รอการอนุมัติ",
              value: stats.pending.toString(),
              icon: <Clock className="h-6 w-6" />,
              color: "orange"
            },
            {
              title: "อนุมัติแล้ว",
              value: stats.approved.toString(),
              icon: <CheckCircle className="h-6 w-6" />,
              color: "green"
            },
            {
              title: "ปฏิเสธ",
              value: stats.rejected.toString(),
              icon: <XCircle className="h-6 w-6" />,
              color: "red"
            },
            {
              title: "มูลค่ารวม",
              value: `฿${stats.totalAmount.toLocaleString('th-TH')}`,
              icon: <TrendingUp className="h-6 w-6" />,
              color: "teal"
            }
          ]}
        />

        {/* Bulk Actions Bar */}
        {selectedRequests.length > 0 && (
          <ProductsStyleBulkActionsBar
            selectedCount={selectedRequests.length}
            onClearSelection={handleClearSelection}
            actions={[
              {
                label: "อนุมัติทั้งหมด",
                icon: CheckCircle,
                onClick: handleBulkApprove,
                variant: "default"
              },
              {
                label: "ปฏิเสธทั้งหมด",
                icon: XCircle,
                onClick: handleBulkReject,
                variant: "destructive"
              }
            ]}
          />
        )}

        {/* Filter Controls */}
        {showFilters && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="status-filter">สถานะ:</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทั้งหมด</SelectItem>
                      <SelectItem value="PENDING">รอการอนุมัติ</SelectItem>
                      <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                      <SelectItem value="REJECTED">ไม่อนุมัติ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor="amount-filter">จำนวนเงิน:</Label>
                  <Select value={amountFilter} onValueChange={setAmountFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">ทั้งหมด</SelectItem>
                      <SelectItem value="UNDER_1000">ต่ำกว่า 1,000</SelectItem>
                      <SelectItem value="1000_5000">1,000 - 5,000</SelectItem>
                      <SelectItem value="5000_10000">5,000 - 10,000</SelectItem>
                      <SelectItem value="OVER_10000">มากกว่า 10,000</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  <X className="h-4 w-4 mr-2" />
                  ล้างตัวกรอง
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data Table */}
        <ProductsStyleDataTable
          title="รายการคำขอใช้งบประมาณ"
          description={`พบ ${filteredRequests.length} รายการ`}
          data={paginatedRequests}
          columns={columns}
          currentViewMode={viewMode}
          onViewModeChange={setViewMode}
          onSort={handleSort}
          onRefresh={handleRefresh}
          onClearSelection={handleClearSelection}
          selectedItems={selectedRequests}
          onSelectItem={handleSelectRequest}
          onSelectAll={handleSelectAll}
          onDelete={(id) => {
            // Handle individual delete if needed
            console.log('Delete request:', id);
          }}
          onFilter={handleFilter}
          sortField={sortField}
          sortDirection={sortDirection}
          loading={isLoading}
          emptyMessage="ไม่พบคำขอใช้งบประมาณ"
          getItemId={(item) => item.id.toString()}
          getItemName={(item) => item.request_no}
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
        />

        {/* Pagination */}
        <ProductsStylePagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredRequests.length / itemsPerPage)}
          totalItems={filteredRequests.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
          onItemsPerPageChange={setItemsPerPage}
          itemsPerPageOptions={[5, 10, 20, 50]}
        />
      </ProductsStylePageLayout>
    );
  }

  if (error || !budgetRequest) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-gray-600 mb-4">{error || 'ไม่พบข้อมูลคำขอ'}</p>
            <Button onClick={() => navigate('/')}>
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title={`คำขอใช้งบประมาณ ${budgetRequest.request_no}`}
          description="รายละเอียดคำขอใช้งบประมาณและข้อมูลการอนุมัติ"
          icon={FileText}
          stats={[
            {
              label: "สถานะ",
              value: budgetRequest.status === 'PENDING' ? 'รอการอนุมัติ' : 
                     budgetRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ',
              icon: budgetRequest.status === 'PENDING' ? Clock : 
                    budgetRequest.status === 'APPROVED' ? CheckCircle : XCircle,
              gradient: budgetRequest.status === 'PENDING' ? "from-orange-600 to-amber-600" :
                       budgetRequest.status === 'APPROVED' ? "from-emerald-600 to-teal-600" : "from-red-600 to-pink-600"
            },
            {
              label: "จำนวนเงิน",
              value: `${parseFloat(budgetRequest.amount.toString()).toLocaleString('th-TH')} บาท `,
              icon: DollarSign,
              gradient: "from-blue-600 to-cyan-600"
            },
            {
              label: "ผู้ขอ",
              value: budgetRequest.requester,
              icon: User,
              gradient: "from-purple-600 to-pink-600"
            },
            {
              label: "วันที่ขอ",
              value: new Date(budgetRequest.request_date).toLocaleDateString('th-TH'),
              icon: Calendar,
              gradient: "from-indigo-600 to-blue-600"
            }
          ]}
        />

        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content - Professional Memo Format */}
            <div className="lg:col-span-3">
              <Card className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 border-2 border-blue-200 shadow-2xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <CardTitle className="text-2xl font-bold flex items-center">
                    <div className="p-2 bg-white/20 rounded-xl mr-3">
                      <FileText className="h-6 w-6" />
                    </div>
                    รหัสคำขอ: {budgetRequest.request_no}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  {/* Print Header (hidden on screen, visible when printing) */}
                  <div className="hidden print:flex print:justify-between print:mb-5 print:pb-4 print:border-b-2 print:border-slate-700">
                    <div className="print:w-1/3 print:text-left">
                      <strong>ศูนย์จัดการธนบัตร นครราชสีมา</strong><br />
                      สำนักงานธนาคารแห่งประเทศไทย
                    </div>
                    <div className="print:w-1/3 print:text-center print:font-bold print:text-xl">
                      แบบฟอร์มขออนุมัติจัดซื้อ
                    </div>
                    <div className="print:w-1/3 print:text-right">
                      <strong>รหัสคำขอ:</strong> {budgetRequest.request_no}<br />
                      <strong>วันที่:</strong> {new Date(budgetRequest.request_date).toLocaleDateString('th-TH')}
                    </div>
                  </div>

                  {/* Memo Container */}
                  <div className="bg-white p-8 rounded-xl shadow-lg border-2 border-gray-100">
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-slate-700">บันทึกขออนุมัติใช้งบประมาณ</h2>
                    </div>
                    
                    {/* Memo Header */}
                    <div className="flex justify-between mb-6">
                      <div>
                        <strong>ส่วนงาน</strong> ศูนย์จัดการธนบัตร นครราชสีมา
                      </div>
                      <div className="text-right">
                        <strong>วันที่</strong> {new Date(budgetRequest.request_date).toLocaleDateString('th-TH', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                    
                    {/* Memo To */}
                    <div className="mb-6">
                      <strong>เรื่อง</strong> ขออนุมัติใช้งบประมาณจัดซื้อวัสดุสำนักงาน<br />
                      <strong>เรียน</strong> ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา
                    </div>
                    
                    <div className="mb-8 text-justify indent-8">
                      <p className="mb-6">
                        งานธุรการ ขอใช้งบประมาณจำนวน <span className="text-blue-600 font-semibold">{parseFloat(budgetRequest.amount.toString()).toLocaleString('th-TH')} บาท </span> 
                        (<u className="text-green-600 font-medium">{convertToThaiText(parseFloat(budgetRequest.amount.toString()))}</u>) 
                        จากรหัสบัญชี <span className="text-purple-600 font-semibold">{budgetRequest.account_code}</span>
                        {budgetRequest.account_name && <span className="text-gray-600"> ({budgetRequest.account_name})</span>}
                        เพื่อซื้อ <strong>{budgetRequest.account_name || 'วัสดุสำนักงาน'}</strong> ตามรายการดังต่อไปนี้
                      </p>
                      
                      {budgetRequest.material_list && budgetRequest.material_list.length > 0 ? (
                        <div className="mb-6">
                          <table className="w-full border-collapse print:border-2 print:border-black">
                            <thead>
                              <tr className="print:bg-gray-200">
                                <th className="w-3/4 bg-gray-100 p-3 text-center font-bold border border-gray-300 print:border-black print:bg-gray-200">รายการ</th>
                                <th className="w-1/4 bg-gray-100 p-3 text-center font-bold border border-gray-300 print:border-black print:bg-gray-200">จำนวน</th>
                              </tr>
                            </thead>
                            <tbody>
                              {budgetRequest.material_list.map((item, index) => (
                                <tr key={index} className="print:border-b print:border-black">
                                  <td className="p-3 border border-gray-300 text-gray-800 print:border-black print:bg-white">{item.name || item.item}</td>
                                  <td className="p-3 border border-gray-300 text-center text-gray-800 print:border-black print:bg-white">{item.quantity} {item.unit || ''}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 mb-6 bg-gray-50 rounded-xl print:hidden">
                          <Package className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-lg font-medium">ไม่มีรายการวัสดุ</p>
                        </div>
                      )}
                      
                      <p className="text-slate-700">
                        จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                      </p>
                    </div>
                    
                    {/* Signature Section */}
                    <div className="mt-12 pt-8 border-t-2 border-dashed border-gray-300 print:border-black">
                      <div className="flex justify-between print:justify-around">
                        {/* Requester Signature */}
                        <div className="text-center print:text-sm">
                          <div className="mb-8 print:mb-4">
                            <div className="h-16 print:h-12 border-b border-gray-300 print:border-black mb-2"></div>
                            ({budgetRequest.requester})<br />
                            ตำแหน่ง เจ้าหน้าที่งานบริหารธนบัตรอาวุโส (ควบ)
                          </div>
                        </div>
                        
                        {/* Approver Signature */}
                        {budgetRequest.status !== 'PENDING' && (
                          <div className="text-center print:text-sm">
                            <div className="mb-8 print:mb-4">
                              <div className="h-16 print:h-12 border-b border-gray-300 print:border-black mb-2"></div>
                              <strong>ผู้อนุมัติ</strong><br />
                              ({budgetRequest.approved_by || 'ผู้บริหาร'})<br />
                              ตำแหน่ง ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา
                            </div>
                            <div className="print:text-xs">
                              วันที่อนุมัติ {budgetRequest.approved_at ? 
                                new Date(budgetRequest.approved_at).toLocaleDateString('th-TH', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                }) : '...../...../.......'
                              }
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Note Section (hidden when printing) */}
                  {budgetRequest.note && (
                    <div className="mt-6 print:hidden">
                      <Label className="text-sm font-medium text-gray-600 mb-2 block">หมายเหตุเพิ่มเติม</Label>
                      <div className="p-4 bg-gray-50 rounded-lg border-l-4 border-gray-400">
                        <p className="text-gray-700">{budgetRequest.note}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Action Menu */}
              <Card className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-2 border-blue-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    การดำเนินการ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <Button
                      onClick={() => handlePrint(budgetRequest)}
                      className="w-full justify-start bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      พิมพ์เอกสาร
                    </Button>
                    <Button
                      onClick={() => navigate('/approval')}
                      className="w-full justify-start bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0"
                    >
                      <List className="h-4 w-4 mr-2" />
                      ดูรายการทั้งหมด
                    </Button>
                    <Button
                      onClick={() => navigate('/budget-request')}
                      className="w-full justify-start bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      ส่งกลับเพื่อแก้ไข
                    </Button>
                    <Button
                      onClick={() => navigate('/approval')}
                      className="w-full justify-start bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white border-0"
                    >
                      <Home className="h-4 w-4 mr-2" />
                      กลับหน้าหลัก
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Status Card */}
              <Card className="bg-gradient-to-br from-emerald-50 via-white to-teal-50 border-2 border-emerald-200 shadow-xl">
                <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    สถานะคำขอ
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="text-center mb-6">
                    <Badge 
                      className={`px-6 py-3 text-sm font-bold text-lg border-0 ${
                        budgetRequest.status === 'PENDING' 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' 
                          : budgetRequest.status === 'APPROVED' 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                            : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
                      }`}
                    >
                      {budgetRequest.status === 'PENDING' ? (
                        <>
                          <Clock className="h-4 w-4 mr-1" />
                          รอการอนุมัติ
                        </>
                      ) : budgetRequest.status === 'APPROVED' ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          อนุมัติแล้ว
                        </>
                      ) : (
                        <>
                          <XCircle className="h-4 w-4 mr-1" />
                          ปฏิเสธ
                        </>
                      )}
                    </Badge>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div>
                      <Label className="text-xs font-medium text-gray-500 mb-1 block">ผู้ขอ</Label>
                      <p className="font-semibold text-gray-800 text-base">{budgetRequest.requester}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs font-medium text-gray-500 mb-1 block">ส่งคำขอเมื่อ</Label>
                      <p className="font-semibold text-gray-800 text-base">
                        {new Date(budgetRequest.request_date).toLocaleString('th-TH')}
                      </p>
                    </div>
                    
                    {budgetRequest.status !== 'PENDING' && (
                      <div>
                        <Label className="text-xs font-medium text-gray-500 mb-1 block">ผู้อนุมัติ</Label>
                        <p className="font-semibold text-gray-800 text-base">
                          {budgetRequest.approved_by && !budgetRequest.approved_by.includes('@') 
                            ? budgetRequest.approved_by 
                            : budgetRequest.approver_name || 'ผู้จัดการศูนย์'}
                        </p>
                      </div>
                    )}
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Approval Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-green-100 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-green-700">ยืนยันการอนุมัติ</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              คุณต้องการอนุมัติคำขอใช้งบประมาณ <span className="font-semibold text-blue-600">{budgetRequest?.request_no}</span> หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="approval-remark" className="text-sm font-medium text-gray-700">หมายเหตุ (ถ้ามี)</Label>
              <Textarea
                id="approval-remark"
                value={approvalRemark}
                onChange={(e) => setApprovalRemark(e.target.value)}
                placeholder="กรอกหมายเหตุเพิ่มเติม..."
                className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="confirmation-text" className="text-sm font-medium text-gray-700">
                พิมพ์คำว่า <span className="font-bold text-green-600">"อนุมัติ"</span> เพื่อยืนยัน
              </Label>
              <Input
                id="confirmation-text"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="พิมพ์คำว่า อนุมัติ"
                className="mt-2 border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              onClick={() => {
                setConfirmationText('');
                setApprovalRemark('');
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmApprove} 
              disabled={confirmationText !== 'อนุมัติ'}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-4 w-4 mr-2" />
              อนุมัติ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-100 rounded-full">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-red-700">ยืนยันการปฏิเสธ</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-gray-600">
              คุณต้องการปฏิเสธคำขอใช้งบประมาณ <span className="font-semibold text-blue-600">{budgetRequest?.request_no}</span> หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label htmlFor="reject-remark" className="text-sm font-medium text-gray-700">เหตุผลในการปฏิเสธ <span className="text-red-500">*</span></Label>
              <Textarea
                id="reject-remark"
                value={approvalRemark}
                onChange={(e) => setApprovalRemark(e.target.value)}
                placeholder="กรอกเหตุผลในการปฏิเสธ..."
                className="mt-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
                rows={3}
                required
              />
            </div>
            <div>
              <Label htmlFor="confirmation-text-reject" className="text-sm font-medium text-gray-700">
                พิมพ์คำว่า <span className="font-bold text-red-600">"ปฏิเสธ"</span> เพื่อยืนยัน
              </Label>
              <Input
                id="confirmation-text-reject"
                value={confirmationText}
                onChange={(e) => setConfirmationText(e.target.value)}
                placeholder="พิมพ์คำว่า ปฏิเสธ"
                className="mt-2 border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
            </div>
          </div>
          <AlertDialogFooter className="gap-3">
            <AlertDialogCancel 
              onClick={() => {
                setConfirmationText('');
                setApprovalRemark('');
              }}
              className="border-gray-300 text-gray-600 hover:bg-gray-50"
            >
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmReject} 
              disabled={confirmationText !== 'ปฏิเสธ' || !approvalRemark.trim()}
              className="bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <X className="h-4 w-4 mr-2" />
              ปฏิเสธ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </Layout>
  );
};

export default ApprovalPage;