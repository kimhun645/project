import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  useEffect(() => {
    if (request_id) {
      fetchBudgetRequest(request_id);
    } else {
      fetchPendingRequests();
    }
  }, [request_id]);

  // Filtered and sorted requests
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(allRequests)) {
      return [];
    }
    
    return allRequests.filter(request => {
      // Search term filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          request.request_no?.toLowerCase().includes(searchLower) ||
          request.requester?.toLowerCase().includes(searchLower) ||
          request.account_code?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== 'ALL' && request.status !== statusFilter) {
        return false;
      }
      
      // Amount filter
      if (amountFilter !== 'ALL') {
        const amount = parseFloat(request.amount.toString());
        switch (amountFilter) {
          case 'UNDER_1000':
            if (amount >= 1000) return false;
            break;
          case '1000_5000':
            if (amount < 1000 || amount > 5000) return false;
            break;
          case '5000_10000':
            if (amount < 5000 || amount > 10000) return false;
            break;
          case 'OVER_10000':
            if (amount <= 10000) return false;
            break;
        }
      }
      
      return true;
    });
  }, [allRequests, searchTerm, statusFilter, amountFilter]);

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
      const { firestoreService } = await import('@/lib/firestoreService');
      for (const requestId of selectedRequests) {
        await firestoreService.updateBudgetRequest(requestId, {
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
      const { firestoreService } = await import('@/lib/firestoreService');
      for (const requestId of selectedRequests) {
        await firestoreService.updateBudgetRequest(requestId, {
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
      render: (value, row) => (
        <div className="font-semibold text-blue-600">
          {value}
        </div>
      )
    },
    {
      key: 'requester',
      title: 'ผู้ขอ',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-gray-500" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'amount',
      title: 'จำนวนเงิน',
      sortable: true,
      render: (value) => (
        <div className="text-right">
          <div className="font-semibold text-green-600">
            ฿{parseFloat(value.toString()).toLocaleString('th-TH')}
          </div>
        </div>
      )
    },
    {
      key: 'account_code',
      title: 'รหัสบัญชี',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          {row.account_name && (
            <div className="text-sm text-gray-500">{row.account_name}</div>
          )}
        </div>
      )
    },
    {
      key: 'request_date',
      title: 'วันที่ขอ',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <span>{new Date(value).toLocaleDateString('th-TH')}</span>
        </div>
      )
    },
    {
      key: 'status',
      title: 'สถานะ',
      sortable: true,
      render: (value) => (
        <Badge 
          variant={value === 'PENDING' ? 'secondary' : 
                 value === 'APPROVED' ? 'default' : 'destructive'}
          className={`px-3 py-1 text-sm font-bold ${
            value === 'PENDING' 
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0' 
              : value === 'APPROVED' 
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
          }`}
        >
          {value === 'PENDING' ? (
            <>
              <Clock className="h-3 w-3 mr-1" />
              รอการอนุมัติ
            </>
          ) : value === 'APPROVED' ? (
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
      )
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
            {row.status === 'PENDING' ? 'พิจารณา' : 'ดู'}
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
      const { firestoreService } = await import('@/lib/firestoreService');
      const requests = await firestoreService.getBudgetRequests();
      setAllRequests(requests);
      const pending = requests.filter(req => req.status === 'PENDING');
      setPendingRequests(pending);
    } catch (err) {
      console.error('Error fetching pending requests:', err);
      // Don't show error message for connection issues
      setAllRequests([]);
      setPendingRequests([]);
      if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        setError('ไม่สามารถโหลดรายการคำขอได้');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBudgetRequest = async (id: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching budget request with ID:', id);
      const { firestoreService } = await import('@/lib/firestoreService');
      const request = await firestoreService.getBudgetRequest(id);
      console.log('Received budget request:', request);
      setBudgetRequest(request);
      
      // Fetch approval info if not pending
      if (request.status !== 'PENDING') {
        try {
          const approval = await firestoreService.getApprovalByRequestId(request.id.toString());
          setApprovalInfo(approval);
        } catch (err) {
          console.log('No approval info found or error:', err);
        }
      }
    } catch (err) {
      console.error('Error fetching budget request:', err);
      setError('ไม่สามารถโหลดข้อมูลคำขอได้');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search functions - Only show PENDING requests
  const getFilteredRequests = () => {
    // Only show PENDING requests
    let filtered = allRequests.filter(req => req.status === 'PENDING');

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req => 
        req.request_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.account_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (req.account_name && req.account_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Amount filter
    if (amountFilter !== 'ALL') {
      filtered = filtered.filter(req => {
        const amount = parseFloat(req.amount.toString());
        switch (amountFilter) {
          case 'LOW': return amount < 10000;
          case 'MEDIUM': return amount >= 10000 && amount < 50000;
          case 'HIGH': return amount >= 50000;
          default: return true;
        }
      });
    }

    return filtered;
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

  const handleApprove = () => {
    setShowApprovalDialog(true);
  };

  const handleReject = () => {
    setShowRejectDialog(true);
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

  const confirmApprove = async () => {
    if (!budgetRequest || confirmationText !== 'อนุมัติ') return;
    
    try {
      setIsLoading(true);
      
      // Get approver name from current context or settings
      let approverName = 'ผู้บริหาร'; // Default fallback
      try {
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          approverName = settings.approverName || approverName;
        }
      } catch (error) {
        console.log('Using default approver name:', approverName);
      }

      // Update budget request with approval info
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.updateBudgetRequest(budgetRequest.id.toString(), {
        ...budgetRequest,
        status: 'APPROVED',
        approved_by: approverName,
        approved_at: new Date().toISOString()
      });

      await firestoreService.createApproval({
        request_id: parseInt(budgetRequest.id.toString()),
        approver_name: approverName,
        decision: 'APPROVED',
        remark: approvalRemark
      });
      
      // Send approval notification email
      await sendApprovalNotification(budgetRequest, 'APPROVED', approverName, approvalRemark);
      
      setShowApprovalDialog(false);
      setApprovalRemark('');
      setConfirmationText('');
      
      // Navigate back to approval list
      navigate('/approval');
    } catch (err) {
      console.error('Error approving request:', err);
      setError('ไม่สามารถอนุมัติคำขอได้');
    } finally {
      setIsLoading(false);
    }
  };

  const confirmReject = async () => {
    if (!budgetRequest || confirmationText !== 'ปฏิเสธ') return;
    
    try {
      setIsLoading(true);
      
      // Get approver name from current context or settings
      let approverName = 'ผู้บริหาร'; // Default fallback
      try {
        const settingsResponse = await fetch('/api/settings');
        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();
          approverName = settings.approverName || approverName;
        }
      } catch (error) {
        console.log('Using default approver name:', approverName);
      }

      // Update budget request with rejection info
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.updateBudgetRequest(budgetRequest.id.toString(), {
        ...budgetRequest,
        status: 'REJECTED',
        approved_by: approverName,
        approved_at: new Date().toISOString()
      });

      await firestoreService.createApproval({
        request_id: parseInt(budgetRequest.id.toString()),
        approver_name: approverName,
        decision: 'REJECTED',
        remark: approvalRemark
      });
      
      // Send rejection notification email
      await sendApprovalNotification(budgetRequest, 'REJECTED', approverName, approvalRemark);
      
      setShowRejectDialog(false);
      setApprovalRemark('');
      setConfirmationText('');
      
      // Navigate back to approval list
      navigate('/approval');
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError('ไม่สามารถปฏิเสธคำขอได้');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = async (request: DBBudgetRequest) => {
    let approvalInfo: ApprovalInfo | null = null;
    if (request.status !== 'PENDING') {
        try {
          const { firestoreService } = await import('@/lib/firestoreService');
          const data = await firestoreService.getApprovalByRequestId(request.id.toString());
          approvalInfo = data;
        } catch (err) {
          console.error('Error fetching approval data for print:', err);
        }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsTable = request.material_list?.length
      ? `<table style="width:100%;border-collapse:collapse;margin:20px 0;font-size:12px;"><thead><tr style="background-color:#f1f1f1;"><th style="border:1px solid #ddd;padding:10px;text-align:center;">รายการ</th><th style="border:1px solid #ddd;padding:10px;text-align:center;">จำนวน</th></tr></thead><tbody>${request.material_list
          .map(
            (item, idx) => `<tr><td style="border:1px solid #ddd;padding:10px;">${item.item}</td><td style="border:1px solid #ddd;padding:10px;text-align:center;">${item.quantity}</td></tr>`
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
    <div class="print-title">แบบฟอร์มขออนุมัติจัดซื้อ</div>
    <div class="print-code">
      <strong>รหัสคำขอ:</strong> ${request.request_no}<br>
      <strong>วันที่:</strong> ${new Date(request.request_date).toLocaleDateString('th-TH')}
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
    <strong>เรื่อง</strong> ขออนุมัติใช้งบประมาณจัดซื้อวัสดุสำนักงาน<br>
    <strong>เรียน</strong> ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา
  </div>
  
  <div class="memo-content">
    <p>
      งานธุรการ ขอใช้งบประมาณจำนวน <strong>${parseFloat(request.amount.toString()).toLocaleString('th-TH')} บาท</strong> 
      (<u>${convertToThaiText(parseFloat(request.amount.toString()))}</u>) 
      จากรหัสบัญชี <strong>${request.account_code}</strong>${request.account_name ? ` (${request.account_name})` : ''}
      เพื่อซื้อ <strong>วัสดุสำนักงาน</strong> ตามรายการดังต่อไปนี้
    </p>
    
    ${itemsTable}
    
    <p>
      จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
    </p>
  </div>
  
  ${approvalInfo ? `
  <div class="approval-section">
    <div class="memo-signature">
      <div style="margin-bottom: 60px; text-align: center;">
        (${approvalInfo.approver_name})<br>
        ตำแหน่ง ผู้จัดการศูนย์
      </div>
      <div class="center-text">
        วันที่อนุมัติ ${new Date(approvalInfo.created_at).toLocaleDateString('th-TH')}
      </div>
    </div>
  </div>
  ` : `
  <div class="approval-section">
    <div class="memo-signature">
      <div style="margin-bottom: 60px; text-align: center;">
        (${request.requester})<br>
        ตำแหน่ง เจ้าหน้าที่งานบริหารธนบัตรอาวุโส (ควบ)
      </div>
      <div class="center-text">
        วันที่อนุมัติ...../...../.......
      </div>
    </div>
  </div>
  `}
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

    return (
      <ProductsStylePageLayout>
        {/* Page Header */}
        <ProductsStylePageHeader
          title="พิจารณาคำขอใช้งบประมาณ"
          searchPlaceholder="ค้นหาคำขอใช้งบประมาณ..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          onRefresh={handleRefresh}
          scannerDetected={false}
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
                        <p className="font-semibold text-gray-800 text-base">{budgetRequest.approved_by || 'ผู้บริหาร'}</p>
                      </div>
                    )}
                  </div>

                  {/* Approval Buttons */}
                  {budgetRequest.status === 'PENDING' && (
                    <div className="space-y-4 mt-8">
                      {/* Approve Button */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-green-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <Button
                          onClick={() => handleApprove()}
                          className="relative w-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                          disabled={isLoading}
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-full">
                              <Check className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <div className="text-xl font-bold">อนุมัติ</div>
                              <div className="text-sm opacity-90">ยืนยันการอนุมัติคำขอ</div>
                            </div>
                          </div>
                        </Button>
                      </div>

                      {/* Reject Button */}
                      <div className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                        <Button
                          onClick={() => handleReject()}
                          className="relative w-full bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 text-white font-bold py-6 rounded-2xl shadow-2xl transform hover:scale-105 transition-all duration-300 border-0"
                          disabled={isLoading}
                        >
                          <div className="flex items-center justify-center space-x-3">
                            <div className="p-2 bg-white/20 rounded-full">
                              <X className="h-6 w-6" />
                            </div>
                            <div className="text-left">
                              <div className="text-xl font-bold">ปฏิเสธ</div>
                              <div className="text-sm opacity-90">ปฏิเสธคำขอนี้</div>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>
                  )}
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