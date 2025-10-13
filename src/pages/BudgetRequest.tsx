import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Eye, Trash2, MoreHorizontal, Printer, Calendar, User, CreditCard, FileText, Clock, CheckCircle, Search, Filter, X, RefreshCw, TrendingUp, AlertTriangle, FileEdit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { type BudgetRequest as DBBudgetRequest, type Approval } from '@/lib/firestoreService';
import { useBarcodeScanner } from '@/hooks/use-barcode-scanner';
import { BarcodeScannerIndicator } from '@/components/ui/barcode-scanner-indicator';
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

import { AddBudgetRequestDialog } from '@/components/Dialogs/AddBudgetRequestDialog';

// Type for partial approval data we actually use
type ApprovalInfo = {
  approver_name: string;
  created_at: string;
  remark?: string;
};

export default function BudgetRequest() {
  const { toast } = useToast();
  const [requests, setRequests] = useState<DBBudgetRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<DBBudgetRequest | null>(null);
  const [approvalData, setApprovalData] = useState<ApprovalInfo | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<DBBudgetRequest | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination and view state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Bulk actions state
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);

  // Barcode scanner support
  const { scannerDetected, lastScannedCode } = useBarcodeScanner({
    onScan: (scannedCode) => {
      // Auto-search for budget request when barcode is scanned
      setSearchTerm(scannedCode);
      toast({
        title: "สแกนบาร์โค้ดสำเร็จ",
        description: `ค้นหาคำขอ: ${scannedCode}`,
      });
    },
    minLength: 3,
    timeout: 100
  });
  // Bulk actions handlers
  const handleSelectRequest = (requestId: string | number) => {
    const id = String(requestId);
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRequests(paginatedRequests.map(request => String(request.id)));
    } else {
      setSelectedRequests([]);
    }
  };

  const handleBulkDelete = async () => {
    try {
      for (const requestId of selectedRequests) {
        const { firestoreService } = await import('@/lib/firestoreService');
        await firestoreService.deleteBudgetRequest(requestId);
      }
      
      toast({
        title: "สำเร็จ",
        description: `ลบคำขอ ${selectedRequests.length} รายการสำเร็จแล้ว`,
      });
      
      setSelectedRequests([]);
      fetchRequests();
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบคำขอได้",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchRequests();
    // Reset all dialog states when component mounts
    setAddDialogOpen(false);
    setEditDialogOpen(false);
    setDetailDialogOpen(false);
    setDeleteDialogOpen(false);
    setSelectedRequest(null);
  }, []);

  // Debug: Log dialog states
  useEffect(() => {
    console.log('Dialog states:', {
      addDialogOpen,
      editDialogOpen,
      detailDialogOpen,
      deleteDialogOpen,
      selectedRequest: selectedRequest?.request_no
    });
  }, [addDialogOpen, editDialogOpen, detailDialogOpen, deleteDialogOpen, selectedRequest]);

  useEffect(() => {
    const fetchApprovalData = async () => {
      if (selectedRequest && selectedRequest.status !== 'PENDING') {
        console.log('🔍 กำลังดึงข้อมูลผู้อนุมัติสำหรับคำขอ:', selectedRequest.request_no);
        console.log('📊 ข้อมูล budgetRequest:', {
          approver_name: selectedRequest.approver_name,
          approved_by: selectedRequest.approved_by,
          approved_at: selectedRequest.approved_at,
          status: selectedRequest.status
        });

        try {
          // ตรวจสอบข้อมูลผู้อนุมัติจากหลายแหล่งตามลำดับความสำคัญ
          let approverName = '';
          let approvalDate = '';
          let remark = '';

          // 1. ตรวจสอบ approver_name (จาก FirestoreService.updateBudgetRequestStatus)
          if (selectedRequest.approver_name && selectedRequest.approver_name.trim() !== '') {
            approverName = selectedRequest.approver_name;
            approvalDate = selectedRequest.approved_at || new Date().toISOString();
            console.log('✅ พบข้อมูลผู้อนุมัติจาก approver_name:', approverName);
          }
          // 2. ตรวจสอบ approved_by (จาก ApprovalPage)
          else if (selectedRequest.approved_by && selectedRequest.approved_by.trim() !== '') {
            approverName = selectedRequest.approved_by;
            approvalDate = selectedRequest.approved_at || new Date().toISOString();
            console.log('✅ พบข้อมูลผู้อนุมัติจาก approved_by:', approverName);
          }
          // 3. หากไม่มีใน budgetRequest ให้ลองดึงจาก approval collection
          else {
            console.log('🔍 ไม่พบข้อมูลใน budgetRequest กำลังดึงจาก approval collection...');
            const { firestoreService } = await import('@/lib/firestoreService');
            const approval = await firestoreService.getApprovalByRequestId(String(selectedRequest.id));
            if (approval) {
              approverName = approval.approver_name || 'ไม่ระบุ';
              approvalDate = approval.created_at || new Date().toISOString();
              remark = approval.remark || '';
              console.log('✅ พบข้อมูลผู้อนุมัติจาก approval collection:', approverName);
            } else {
              console.log('⚠️ ไม่พบข้อมูลใน approval collection');
            }
          }

          // 4. หากยังไม่มีข้อมูล ให้ใช้ fallback
          if (!approverName || approverName.trim() === '') {
            approverName = 'ผู้จัดการศูนย์';
            approvalDate = selectedRequest.approved_at || new Date().toISOString();
            console.log('⚠️ ใช้ fallback approver name:', approverName);
          }

          // ตรวจสอบว่าเป็น email หรือไม่
          if (approverName.includes('@')) {
            approverName = 'ผู้จัดการศูนย์';
            console.log('⚠️ ตรวจพบ email เปลี่ยนเป็น fallback:', approverName);
          }

          const approvalInfo: ApprovalInfo = {
            approver_name: approverName,
            created_at: approvalDate,
            remark: remark || undefined
          };

          console.log('📋 ข้อมูลผู้อนุมัติที่ได้:', approvalInfo);
          setApprovalData(approvalInfo);

        } catch (err) {
          console.error('❌ ข้อผิดพลาดในการดึงข้อมูลผู้อนุมัติ:', err);
          // Fallback to budgetRequest data
          const approvalInfo: ApprovalInfo = {
            approver_name: selectedRequest.approved_by || selectedRequest.approver_name || 'ผู้จัดการศูนย์',
            created_at: selectedRequest.approved_at || new Date().toISOString(),
            remark: undefined
          };
          console.log('🔄 ใช้ fallback data:', approvalInfo);
          setApprovalData(approvalInfo);
        }
      } else {
        console.log('ℹ️ คำขอยังรอการอนุมัติ ไม่ต้องดึงข้อมูลผู้อนุมัติ');
        setApprovalData(null);
      }
    };
    fetchApprovalData();
  }, [selectedRequest]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      const data = await firestoreService.getBudgetRequests();
      console.log('🔍 ข้อมูลที่ได้รับจาก Firestore:', data);
      console.log('📊 จำนวนรายการ:', data?.length || 0);
      
      // Ensure data is always an array
      const requestsData = Array.isArray(data) ? data : [];
      console.log('✅ ข้อมูลที่ตั้งค่า:', requestsData);
      setRequests(requestsData);
    } catch (err) {
      console.error('Error fetching requests:', err);
      // Don't show error toast on initial load - just set empty array
      setRequests([]);
      // Only show error if it's not a connection issue
      if (err instanceof Error && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        toast({ 
          title: 'ไม่สามารถโหลดข้อมูลได้', 
          description: 'กรุณาตรวจสอบการเชื่อมต่อเครือข่าย', 
          variant: 'destructive' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle delete action
  const handleDelete = async () => {
    if (!requestToDelete) return;
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.deleteBudgetRequest(String(requestToDelete.id));
      toast({ title: 'ลบสำเร็จ', description: `ลบคำขอ ${requestToDelete.request_no} เรียบร้อยแล้ว` });
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
      // Refresh list
      fetchRequests();
    } catch (err) {
      console.error('Error deleting request:', err);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบคำขอได้', variant: 'destructive' });
    }
  };

  // Handle edit action
  const handleEdit = async (editedRequest: DBBudgetRequest) => {
    if (!selectedRequest) return;
    try {
      const { firestoreService } = await import('@/lib/firestoreService');
      await firestoreService.updateBudgetRequest(String(selectedRequest.id), editedRequest);
      toast({ title: 'แก้ไขสำเร็จ', description: `แก้ไขคำขอ ${selectedRequest.request_no} เรียบร้อยแล้ว` });
      setEditDialogOpen(false);
      setSelectedRequest(null);
      // Refresh list
      fetchRequests();
    } catch (err) {
      console.error('Error updating request:', err);
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถแก้ไขคำขอได้', variant: 'destructive' });
    }
  };

  const handlePrint = async (request: DBBudgetRequest) => {
    let approvalInfo: ApprovalInfo | null = null;
    if (request.status !== 'PENDING') {
      try {
        const { firestoreService } = await import('@/lib/firestoreService');
        const data = await firestoreService.getApprovalByRequestId(String(request.id));
        if (data) {
          approvalInfo = {
            approver_name: data.approver_name || 'ไม่ระบุ',
            created_at: data.created_at || new Date().toISOString(),
            remark: data.remark
          };
        }
      } catch (err) {
        console.error('Error fetching approval data for print:', err);
      }
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsTable = request.material_list?.length && Array.isArray(request.material_list)
      ? `<table style="width:100%;border-collapse:collapse;margin:15px 0;font-size:12px;"><thead><tr style="background-color:#f5f5f5;"><th style="border:1px solid #ccc;padding:8px;text-align:left;">รายการ</th><th style="border:1px solid #ccc;padding:8px;text-align:left;">จำนวน</th><th style="border:1px solid #ccc;padding:8px;text-align:left;">หน่วย</th></tr></thead><tbody>${request.material_list
          .map(
            (item, idx) => `<tr><td style="border:1px solid #ccc;padding:8px;">${item.name || item.item || '-'}</td><td style="border:1px solid #ccc;padding:8px;">${item.quantity || '-'}</td><td style="border:1px solid #ccc;padding:8px;">${item.unit || '-'}</td></tr>`
          )
          .join('')}</tbody></table>`
      : `<p style="text-align:center;color:#666;font-size:12px;margin:15px 0;">ไม่มีรายการวัสดุ</p>`;

    const printContent = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>คำขออนุมัติใช้งบประมาณ ${request.request_no}</title>
  <style>
    @page { 
      size: A4 portrait; 
      margin: 1.5cm; 
    }
    body { 
      font-family: 'Sarabun', 'Tahoma', sans-serif; 
      font-size: 12px; 
      line-height: 1.4; 
      margin: 0; 
      padding: 0;
      color: #333;
    }
    .header { 
      text-align: center; 
      margin-bottom: 20px; 
      border-bottom: 2px solid #333;
      padding-bottom: 15px;
    }
    .header h1 { 
      font-size: 18px; 
      margin: 0 0 5px 0; 
      font-weight: bold;
    }
    .header p { 
      font-size: 14px; 
      margin: 0; 
      color: #666;
    }
    .info-section { 
      margin: 15px 0; 
    }
    .info-row { 
      display: flex; 
      margin-bottom: 8px; 
      font-size: 12px;
    }
    .info-label { 
      font-weight: bold; 
      width: 120px; 
      flex-shrink: 0;
    }
    .info-value { 
      flex: 1;
    }
    .amount-highlight { 
      font-size: 16px; 
      font-weight: bold; 
      color: #2563eb;
    }
    .approval-section { 
      margin: 20px 0; 
      padding: 15px; 
      border: 1px solid #007bff; 
      background-color: #f8f9ff;
      border-radius: 5px;
    }
    .approval-section h3 { 
      margin: 0 0 10px 0; 
      font-size: 14px; 
      color: #007bff;
    }
    .material-section { 
      margin: 20px 0; 
    }
    .material-section h3 { 
      margin: 0 0 10px 0; 
      font-size: 14px; 
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
    }
    .note-section { 
      margin: 15px 0; 
      padding: 10px; 
      background-color: #f9f9f9; 
      border-left: 4px solid #666;
      font-size: 11px;
    }
    .footer { 
      margin-top: 30px; 
      text-align: center; 
      color: #666; 
      font-size: 10px;
      border-top: 1px solid #ddd;
      padding-top: 10px;
    }
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>คำขออนุมัติใช้งบประมาณ</h1>
    <p>เลขที่คำขอ: ${request.request_no}</p>
  </div>
  
  <div class="info-section">
    <div class="info-row">
      <div class="info-label">ผู้ขอ:</div>
      <div class="info-value">${request.requester}</div>
    </div>
    <div class="info-row">
      <div class="info-label">วันที่ขอ:</div>
      <div class="info-value">${new Date(request.request_date).toLocaleDateString('th-TH')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">รหัสบัญชี:</div>
      <div class="info-value">${request.account_code} ${request.account_name ? '- ' + request.account_name : ''}</div>
    </div>
    <div class="info-row">
      <div class="info-label">จำนวนเงิน:</div>
      <div class="info-value amount-highlight">฿${parseFloat((Number(request.amount) || 0).toFixed(2)).toLocaleString('th-TH')}</div>
    </div>
    <div class="info-row">
      <div class="info-label">สถานะ:</div>
      <div class="info-value">${request.status === 'PENDING' ? 'รอการอนุมัติ' : request.status === 'APPROVED' ? 'อนุมัติแล้ว' : request.status === 'REJECTED' ? 'ไม่อนุมัติ' : request.status || 'ไม่ระบุ'}</div>
    </div>
  </div>
  
  ${request.note ? `
  <div class="note-section">
    <strong>หมายเหตุ:</strong> ${request.note}
  </div>
  ` : ''}
  
  <div class="material-section">
    <h3>รายการวัสดุ</h3>
    ${itemsTable}
    ${request.material_list && request.material_list.length > 0 ? `
    <div style="margin-top: 15px; padding: 10px; background-color: #f9f9f9; border-radius: 4px;">
      <strong>สรุปรายการวัสดุ:</strong> ${request.material_list.length} รายการ
    </div>
    ` : ''}
  </div>
  
  ${approvalInfo ? `
  <div class="approval-section">
    <h3>ข้อมูลการอนุมัติ</h3>
    <div class="info-row">
      <div class="info-label">ผู้อนุมัติ:</div>
      <div class="info-value">${approvalInfo.approver_name}</div>
    </div>
    <div class="info-row">
      <div class="info-label">วันที่อนุมัติ:</div>
      <div class="info-value">${new Date(approvalInfo.created_at).toLocaleString('th-TH')}</div>
    </div>
    ${approvalInfo.remark ? `
    <div class="info-row">
      <div class="info-label">หมายเหตุ:</div>
      <div class="info-value">${approvalInfo.remark}</div>
    </div>
    ` : ''}
  </div>
  ` : ''}
  
  <div class="footer">
    <p>พิมพ์เมื่อ: ${new Date().toLocaleString('th-TH')}</p>
  </div>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">รอการอนุมัติ</Badge>;
      case 'APPROVED':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">อนุมัติแล้ว</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">ไม่อนุมัติ</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Filtered requests based on search and filters
  const filteredRequests = useMemo(() => {
    if (!Array.isArray(requests)) {
      return [];
    }
    return requests.filter(request => {
      // Search term filter
      const searchMatch = searchTerm === '' || 
        request.request_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.account_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.account_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.note?.toLowerCase().includes(searchTerm.toLowerCase());

      // Status filter
      const statusMatch = statusFilter === 'ALL' || request.status === statusFilter;

      // Date range filter
      let dateMatch = true;
      if (dateFrom || dateTo) {
        const requestDate = new Date(request.request_date);
        if (dateFrom) {
          const fromDate = new Date(dateFrom);
          dateMatch = dateMatch && requestDate >= fromDate;
        }
        if (dateTo) {
          const toDate = new Date(dateTo);
          toDate.setHours(23, 59, 59, 999); // End of day
          dateMatch = dateMatch && requestDate <= toDate;
        }
      }

      return searchMatch && statusMatch && dateMatch;
    });
  }, [requests, searchTerm, statusFilter, dateFrom, dateTo]);

  // Sort requests
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (!a || !b) return 0; // Skip invalid items
    
    let aValue = a[sortField as keyof DBBudgetRequest];
    let bValue = b[sortField as keyof DBBudgetRequest];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedRequests.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRequests = sortedRequests.slice(startIndex, endIndex).filter(request => request && request.id);

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'ALL' || dateFrom || dateTo;

  // Calculate statistics for filtered data
  const filteredStats = useMemo(() => {
    if (!hasActiveFilters || !Array.isArray(filteredRequests)) return null;
    
    const totalAmount = Array.isArray(filteredRequests) ? filteredRequests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0) : 0;
    const pendingAmount = Array.isArray(filteredRequests) ? filteredRequests
      .filter(r => r.status === 'PENDING')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) : 0;
    const approvedAmount = Array.isArray(filteredRequests) ? filteredRequests
      .filter(r => r.status === 'APPROVED')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) : 0;
    const rejectedAmount = Array.isArray(filteredRequests) ? filteredRequests
      .filter(r => r.status === 'REJECTED')
      .reduce((sum, r) => sum + (Number(r.amount) || 0), 0) : 0;

    return {
      total: Array.isArray(filteredRequests) ? filteredRequests.length : 0,
      pending: Array.isArray(filteredRequests) ? filteredRequests.filter(r => r.status === 'PENDING').length : 0,
      approved: Array.isArray(filteredRequests) ? filteredRequests.filter(r => r.status === 'APPROVED').length : 0,
      rejected: Array.isArray(filteredRequests) ? filteredRequests.filter(r => r.status === 'REJECTED').length : 0,
      totalAmount,
      pendingAmount,
      approvedAmount,
      rejectedAmount
    };
  }, [filteredRequests, hasActiveFilters]);

  // Calculate stats
  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === 'PENDING').length;
  const approvedRequests = requests.filter(r => r.status === 'APPROVED').length;
  const rejectedRequests = requests.filter(r => r.status === 'REJECTED').length;
  const totalAmount = requests.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const pendingAmount = requests.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Define columns for data table
  const columns: ProductsStyleTableColumn[] = [
    {
      key: 'request_no',
      title: 'หมายเลขคำขอ',
      sortable: true,
      render: (request: DBBudgetRequest) => {
        console.log('🔍 Render request_no:', request);
        console.log('🔍 request.request_no:', request?.request_no);
        console.log('🔍 request.id:', request?.id);
        console.log('🔍 request.requester:', request?.requester);
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">{request?.request_no || 'Unknown'}</span>
            {request?.status === 'PENDING' && (
              <Clock className="h-4 w-4 text-orange-600" />
            )}
          </div>
        );
      }
    },
    {
      key: 'requester',
      title: 'ผู้ขอ',
      sortable: true,
      render: (request: DBBudgetRequest) => (
        <span className="text-sm text-muted-foreground">
          {request?.requester || '-'}
        </span>
      )
    },
    {
      key: 'note',
      title: 'รายละเอียด',
      sortable: true,
      render: (request: DBBudgetRequest) => (
        <span className="text-sm text-muted-foreground">
          {request?.account_name || request?.note || '-'}
        </span>
      )
    },
    {
      key: 'amount',
      title: 'จำนวนเงิน',
      sortable: true,
      render: (request: DBBudgetRequest) => (
        <span className="text-sm font-semibold text-green-600">
          ฿{(Number(request?.amount) || 0).toLocaleString()}
        </span>
      )
    },
    {
      key: 'status',
      title: 'สถานะ',
      sortable: true,
      render: (request: DBBudgetRequest) => {
        const status = request?.status;
        return status === 'APPROVED' ? (
          <Badge variant="outline" className="bg-green-100 text-green-700 border-green-200">
            อนุมัติแล้ว
          </Badge>
        ) : status === 'REJECTED' ? (
          <Badge variant="outline" className="bg-red-100 text-red-700 border-red-200">
            ไม่อนุมัติ
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
            รอการอนุมัติ
          </Badge>
        );
      }
    },
    {
      key: 'created_at',
      title: 'วันที่สร้าง',
      sortable: true,
      render: (request: DBBudgetRequest) => (
        <span className="text-sm text-muted-foreground">
          {request?.created_at ? new Date(request.created_at).toLocaleDateString('th-TH') : '-'}
        </span>
      )
    },
    {
      key: 'actions',
      title: 'การดำเนินการ',
      sortable: false,
      render: (request: DBBudgetRequest) => (
        <div className="flex items-center gap-1">
          {request?.id ? (
            <>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => {
                  setSelectedRequest(request);
                  setDetailDialogOpen(true);
                }}
                className="h-8 w-8 p-0 hover:bg-blue-50"
                title="ดูรายละเอียด"
              >
                <Eye className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRequestToDelete(request);
                  setDeleteDialogOpen(true);
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-red-50"
                title="ลบ"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handlePrint(request)}
                className="h-8 w-8 p-0 hover:bg-gray-50"
                title="พิมพ์"
              >
                <Printer className="h-4 w-4" />
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
      title: "คำขอทั้งหมด",
      value: totalRequests.toString(),
      icon: <FileText className="h-6 w-6" />,
      color: "teal"
    },
    {
      title: "รอการอนุมัติ",
      value: pendingRequests.toString(),
      icon: <Clock className="h-6 w-6" />,
      color: pendingRequests > 0 ? "orange" : "green"
    },
    {
      title: "อนุมัติแล้ว",
      value: approvedRequests.toString(),
      icon: <CheckCircle className="h-6 w-6" />,
      color: approvedRequests > 0 ? "green" : "red"
    },
    {
      title: "มูลค่ารวม",
      value: `฿${totalAmount.toLocaleString()}`,
      icon: <CreditCard className="h-6 w-6" />,
      color: "purple"
    }
  ];

  if (loading) {
    return (
      <ProductsStylePageLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>กำลังโหลดข้อมูล...</p>
          </div>
        </div>
      </ProductsStylePageLayout>
    );
  }

  return (
    <ProductsStylePageLayout>
      {/* Page Header */}
      <ProductsStylePageHeader
        title="คำขออนุมัติใช้งบประมาณ"
        searchPlaceholder="ค้นหาคำขอใช้งบประมาณ..."
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        onRefresh={fetchRequests}
        scannerDetected={scannerDetected}
        actionButtons={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setEditDialogOpen(false);
                setDetailDialogOpen(false);
                setDeleteDialogOpen(false);
                setSelectedRequest(null);
                setAddDialogOpen(true);
              }}
              className="h-9 px-3 rounded-lg bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 text-white hover:text-white transition-all duration-200"
            >
              <FileText className="h-4 w-4 mr-2" />
              คำขอใช้งบประมาณ
            </Button>
          </div>
        }
      />

      {/* Stats Cards */}
      <ProductsStyleStatsCards cards={statsCards} />

      {/* Bulk Actions Bar */}
      {selectedRequests.length > 0 && (
        <ProductsStyleBulkActionsBar
          selectedCount={selectedRequests.length}
          onClear={() => setSelectedRequests([])}
          onDelete={handleBulkDelete}
        />
      )}

      {/* Filter Controls */}
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
              <Label htmlFor="date-from">วันที่เริ่มต้น:</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-40"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Label htmlFor="date-to">วันที่สิ้นสุด:</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-40"
              />
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

      {/* Data Table */}
      <ProductsStyleDataTable
        title="คำขออนุมัติใช้งบประมาณ"
        description="รายการคำขออนุมัติใช้งบประมาณทั้งหมด"
        data={paginatedRequests}
        columns={columns}
        currentViewMode={viewMode}
        onViewModeChange={setViewMode}
        onSort={(field) => {
          setSortField(field);
          setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        }}
        onRefresh={fetchRequests}
        onClearSelection={() => setSelectedRequests([])}
        selectedItems={selectedRequests}
        onSelectItem={handleSelectRequest}
        onSelectAll={handleSelectAll}
        sortField={sortField}
        sortDirection={sortDirection}
        loading={loading}
        emptyMessage="ไม่พบคำขออนุมัติใช้งบประมาณ"
        onFilter={() => {}} // Empty function for now
        getItemId={(request) => request?.id || ''}
        getItemName={(request) => request?.request_no || 'Unknown'}
      />

      {/* Pagination */}
      <ProductsStylePagination
        currentPage={currentPage}
        totalPages={totalPages}
        itemsPerPage={itemsPerPage}
        totalItems={sortedRequests.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemsPerPageOptions={[6, 12, 24, 48]}
      />

      {/* Delete Confirmation Dialog */}
      <ProductsStyleDeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="ยืนยันการลบคำขอ"
        itemName={requestToDelete?.request_no || ''}
      />

      {/* Add Request Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>เพิ่มคำขออนุมัติใช้งบประมาณ</DialogTitle>
            <DialogDescription>
              กรอกข้อมูลคำขออนุมัติใช้งบประมาณใหม่
            </DialogDescription>
          </DialogHeader>
          <AddBudgetRequestDialog
            onSuccess={() => {
              setAddDialogOpen(false);
              fetchRequests();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog - Modern Design */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0">
          {selectedRequest && (
            <div className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 min-h-[90vh]">
              {/* Header Section */}
              <div className="bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                      <FileText className="h-8 w-8" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold">รายละเอียดคำขออนุมัติใช้งบประมาณ</h1>
                      <p className="text-blue-100 text-lg">รหัสคำขอ: {selectedRequest.request_no}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDetailDialogOpen(false)}
                    className="h-10 w-10 p-0 hover:bg-white/20 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Content Section */}
              <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)]">
                {/* Status and Basic Info Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                  {/* Status Card */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-orange-100 rounded-xl">
                        <Clock className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm text-orange-600 font-medium">สถานะ</div>
                        <div className="text-lg font-bold text-orange-800">
                          {selectedRequest.status === 'PENDING' ? 'รอการอนุมัติ' : 
                           selectedRequest.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amount Card */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-green-100 rounded-xl">
                        <CreditCard className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-sm text-green-600 font-medium">จำนวนเงิน</div>
                        <div className="text-lg font-bold text-green-800">
                          ฿{parseFloat(Number(selectedRequest.amount).toFixed(2)).toLocaleString()}
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
                        <div className="text-lg font-bold text-purple-800">{selectedRequest.requester || '-'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Date Card */}
                  <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl p-6 border border-indigo-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="p-2 bg-indigo-100 rounded-xl">
                        <Calendar className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div>
                        <div className="text-sm text-indigo-600 font-medium">วันที่สร้าง</div>
                        <div className="text-lg font-bold text-indigo-800">
                          {new Date(selectedRequest.created_at).toLocaleDateString('th-TH')}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Approver Info - Only show if approved/rejected */}
                {approvalData && (
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 mb-8">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-emerald-100 rounded-xl">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-sm text-emerald-600 font-medium mb-1">ผู้อนุมัติ</div>
                        <div className="text-lg font-bold text-emerald-800">
                          {approvalData.approver_name}
                        </div>
                        <div className="text-sm text-emerald-600 mt-1">
                          วันที่: {new Date(approvalData.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    </div>
                    {approvalData.remark && (
                      <div className="mt-4 p-4 bg-white/50 rounded-xl border border-emerald-200">
                        <div className="text-sm text-emerald-600 font-medium mb-1">หมายเหตุ</div>
                        <div className="text-emerald-800">{approvalData.remark}</div>
                      </div>
                    )}
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
                          {selectedRequest.account_code} {selectedRequest.account_name && `(${selectedRequest.account_name})`}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Request Content */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                    <p className="text-justify leading-relaxed text-gray-700">
                      งานธุรการ ขอใช้งบประมาณจำนวน <span className="font-bold text-blue-600 text-lg">
                        {parseFloat(Number(selectedRequest.amount).toFixed(2)).toLocaleString()} บาท
                      </span> 
                      จากรหัสบัญชี <span className="font-bold text-purple-600">{selectedRequest.account_code}</span>
                      {selectedRequest.account_name && <span className="text-gray-600"> ({selectedRequest.account_name})</span>}
                      ตามรายการดังต่อไปนี้
                    </p>
                  </div>

                  {/* Material List */}
                  {selectedRequest.material_list && selectedRequest.material_list.length > 0 ? (
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
                            {selectedRequest.material_list.map((item, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="px-6 py-4 text-center text-gray-600 font-medium">{index + 1}</td>
                                <td className="px-6 py-4 text-gray-800">{item.name || item.item || '-'}</td>
                                <td className="px-6 py-4 text-center text-gray-600">{item.quantity || '-'} {item.unit || ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 text-center mb-6">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-gray-500 text-lg">ไม่มีรายการวัสดุ</p>
                    </div>
                  )}

                  {/* Note Section */}
                  {selectedRequest.note && (
                    <div className="bg-white p-6 rounded-xl border border-gray-200 mb-6">
                      <div className="text-sm text-gray-600 font-medium mb-2">หมายเหตุ</div>
                      <p className="text-gray-700">{selectedRequest.note}</p>
                    </div>
                  )}

                  {/* Closing Statement */}
                  <div className="bg-white p-6 rounded-xl border border-gray-200">
                    <p className="text-justify text-gray-700 font-medium">
                      จึงเรียนมาเพื่อโปรดพิจารณาอนุมัติ
                    </p>
                  </div>
                </div>

                {/* Signature Section */}
                <div className="mt-8 bg-gradient-to-br from-slate-50 to-gray-50 rounded-2xl p-8 border border-gray-200">
                  <div className="flex justify-between items-end">
                    {/* Requester Signature */}
                    <div className="text-center">
                      <div className="mb-8">
                        <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                        <div className="text-sm text-gray-600">(ลงชื่อ) ................................................</div>
                        <div className="text-sm font-semibold text-gray-800">({selectedRequest.requester})</div>
                        <div className="text-sm text-gray-600">ตำแหน่ง เจ้าหน้าที่งานบริหารธนบัตรอาวุโส (ควบ)</div>
                      </div>
                    </div>
                    
                    {/* Approver Signature */}
                    {approvalData && (
                      <div className="text-center">
                        <div className="mb-8">
                          <div className="h-16 border-b-2 border-gray-400 mb-2"></div>
                          <div className="text-sm text-gray-600">ผู้อนุมัติ</div>
                          <div className="text-sm font-semibold text-gray-800">({approvalData.approver_name})</div>
                          <div className="text-sm text-gray-600">ตำแหน่ง ผู้จัดการศูนย์ ศูนย์จัดการธนบัตร นครราชสีมา</div>
                        </div>
                        <div className="text-sm text-gray-600">
                          วันที่อนุมัติ: {new Date(approvalData.created_at).toLocaleDateString('th-TH', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="bg-white border-t border-gray-200 p-6">
                <div className="flex justify-end space-x-4">
                  <Button
                    variant="outline"
                    onClick={() => handlePrint(selectedRequest)}
                    className="px-6 py-2"
                  >
                    <Printer className="h-4 w-4 mr-2" />
                    พิมพ์เอกสาร
                  </Button>
                  <Button
                    onClick={() => setDetailDialogOpen(false)}
                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
                  >
                    ปิด
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Request Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setSelectedRequest(null);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>แก้ไขคำขออนุมัติใช้งบประมาณ</DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลคำขอ {selectedRequest?.request_no}
            </DialogDescription>
          </DialogHeader>
          {selectedRequest && (
            <AddBudgetRequestDialog
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedRequest(null);
                fetchRequests();
              }}
              editRequest={selectedRequest}
            />
          )}
        </DialogContent>
      </Dialog>
    </ProductsStylePageLayout>
  );
}