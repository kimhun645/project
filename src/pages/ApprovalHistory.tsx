import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Filter,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
  DollarSign,
  ArrowLeft,
  Download,
  Eye
} from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { PageHeader } from '@/components/Layout/PageHeader';
import { api, type BudgetRequest as DBBudgetRequest } from '@/lib/apiService';

const ApprovalHistory: React.FC = () => {
  const navigate = useNavigate();
  const [allRequests, setAllRequests] = useState<DBBudgetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [amountFilter, setAmountFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchAllRequests();
  }, []);

  const fetchAllRequests = async () => {
    try {
      setIsLoading(true);
      const { firestoreService } = await import('@/lib/firestoreService');
      const requests = await firestoreService.getBudgetRequests();
      // Ensure requests is always an array
      setAllRequests(Array.isArray(requests) ? requests : []);
    } catch (err) {
      console.error('Error fetching all requests:', err);
      setError('ไม่สามารถโหลดประวัติการอนุมัติได้');
      setAllRequests([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search functions
  const getFilteredRequests = () => {
    // Ensure allRequests is an array
    if (!Array.isArray(allRequests)) {
      return [];
    }

    let filtered = allRequests;

    // Status filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(req => req.status === statusFilter);
    }

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

    // Date filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(req => {
        const requestDate = new Date(req.request_date);
        switch (dateFilter) {
          case 'TODAY': 
            return requestDate >= today;
          case 'THIS_WEEK': 
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            return requestDate >= weekAgo;
          case 'THIS_MONTH': 
            const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
            return requestDate >= monthAgo;
          default: return true;
        }
      });
    }

    // Ensure filtered is still an array before sorting
    if (!Array.isArray(filtered)) {
      return [];
    }

    return filtered.sort((a, b) => new Date(b.request_date).getTime() - new Date(a.request_date).getTime());
  };

  const getStatusStats = () => {
    // Ensure allRequests is an array
    if (!Array.isArray(allRequests)) {
      return { pending: 0, approved: 0, rejected: 0, totalAmount: 0 };
    }

    const pending = allRequests.filter(req => req.status === 'PENDING').length;
    const approved = allRequests.filter(req => req.status === 'APPROVED').length;
    const rejected = allRequests.filter(req => req.status === 'REJECTED').length;
    const totalAmount = allRequests
      .filter(req => req.status === 'APPROVED')
      .reduce((sum, req) => sum + parseFloat(req.amount.toString()), 0);

    return { pending, approved, rejected, totalAmount };
  };

  const handleExportData = () => {
    const filteredRequests = getFilteredRequests();
    const csvContent = [
      ['รหัสคำขอ', 'ผู้ขอ', 'วันที่ขอ', 'รหัสบัญชี', 'จำนวนเงิน', 'สถานะ', 'หมายเหตุ'],
      ...filteredRequests.map(req => [
        req.request_no,
        req.requester,
        new Date(req.request_date).toLocaleDateString('th-TH'),
        req.account_code,
        parseFloat(req.amount.toString()).toLocaleString('th-TH'),
        req.status === 'PENDING' ? 'รอการอนุมัติ' : 
        req.status === 'APPROVED' ? 'อนุมัติแล้ว' : 'ปฏิเสธ',
        req.note || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `approval_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">กำลังโหลดประวัติการอนุมัติ...</p>
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
            <Button onClick={() => navigate('/approval')}>
              กลับสู่หน้าหลัก
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredRequests = getFilteredRequests();
  const stats = getStatusStats();

  return (
    <Layout hideHeader={true}>
      <div className="w-full space-y-6 pb-8">
        {/* Professional Page Header */}
        <PageHeader 
          title="ประวัติการอนุมัติ"
          description="รายการคำขอใช้งบประมาณทั้งหมดและประวัติการพิจารณา"
          icon={FileText}
          stats={[
            {
              label: "รอการอนุมัติ",
              value: stats.pending.toString(),
              icon: Clock,
              gradient: "from-orange-600 to-amber-600"
            },
            {
              label: "อนุมัติแล้ว",
              value: stats.approved.toString(),
              icon: CheckCircle,
              gradient: "from-emerald-600 to-teal-600"
            },
            {
              label: "ปฏิเสธ",
              value: stats.rejected.toString(),
              icon: XCircle,
              gradient: "from-red-600 to-pink-600"
            },
            {
              label: "มูลค่ารวม",
              value: `฿${stats.totalAmount.toLocaleString('th-TH')}`,
              icon: DollarSign,
              gradient: "from-blue-600 to-cyan-600"
            }
          ]}
        />

        {/* Search and Filter Section */}
        <Card className="bg-gradient-to-br from-blue-50 via-white to-cyan-50 border-2 border-blue-200 shadow-xl relative overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="ค้นหาด้วยรหัสคำขอ, ผู้ขอ, หรือรหัสบัญชี..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="สถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทั้งหมด</SelectItem>
                    <SelectItem value="PENDING">รอการอนุมัติ</SelectItem>
                    <SelectItem value="APPROVED">อนุมัติแล้ว</SelectItem>
                    <SelectItem value="REJECTED">ปฏิเสธ</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={amountFilter} onValueChange={setAmountFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="จำนวนเงิน" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทั้งหมด</SelectItem>
                    <SelectItem value="LOW">ต่ำกว่า 10,000</SelectItem>
                    <SelectItem value="MEDIUM">10,000 - 50,000</SelectItem>
                    <SelectItem value="HIGH">มากกว่า 50,000</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="วันที่" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">ทั้งหมด</SelectItem>
                    <SelectItem value="TODAY">วันนี้</SelectItem>
                    <SelectItem value="THIS_WEEK">สัปดาห์นี้</SelectItem>
                    <SelectItem value="THIS_MONTH">เดือนนี้</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">ประวัติการอนุมัติ</h2>
            <p className="text-gray-600">พบ {filteredRequests.length} รายการ</p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={handleExportData}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0"
            >
              <Download className="h-4 w-4 mr-2" />
              ส่งออกข้อมูล
            </Button>
            <Button 
              onClick={() => navigate('/approval')}
              className="bg-gradient-to-r from-gray-600 to-slate-600 hover:from-gray-700 hover:to-slate-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 border-0"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-50 via-white to-slate-50 border-2 border-gray-200 shadow-xl">
            <CardContent className="p-12 text-center">
              <div className="p-4 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <Search className="h-10 w-10 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบรายการที่ค้นหา</h3>
              <p className="text-gray-600 mb-6">ลองปรับเปลี่ยนคำค้นหาหรือตัวกรอง</p>
              <Button 
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setAmountFilter('ALL');
                  setDateFilter('ALL');
                }} 
                className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white"
              >
                ล้างตัวกรอง
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredRequests.map((request) => (
              <Card key={request.id} className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 border-2 border-blue-200 shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                        <FileText className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-700 mb-1">
                          {request.request_no}
                        </h3>
                        <p className="text-sm text-gray-600 flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {request.requester}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ฿{parseFloat(request.amount.toString()).toLocaleString('th-TH')}
                        </p>
                        <p className="text-xs text-gray-500">จำนวนเงิน</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={request.status === 'PENDING' ? 'secondary' : 
                                   request.status === 'APPROVED' ? 'default' : 'destructive'}
                          className={`px-4 py-2 text-sm font-bold ${
                            request.status === 'PENDING' 
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white border-0' 
                              : request.status === 'APPROVED' 
                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0'
                                : 'bg-gradient-to-r from-red-500 to-rose-500 text-white border-0'
                          }`}
                        >
                          {request.status === 'PENDING' ? (
                            <>
                              <Clock className="h-4 w-4 mr-1" />
                              รอการอนุมัติ
                            </>
                          ) : request.status === 'APPROVED' ? (
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
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">รหัสบัญชี</p>
                        <p className="font-semibold text-slate-700">
                          {request.account_code}
                        </p>
                        {request.account_name && (
                          <p className="text-xs text-gray-600">{request.account_name}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Calendar className="h-5 w-5 text-orange-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">วันที่ขอ</p>
                        <p className="font-semibold text-slate-700">
                          {new Date(request.request_date).toLocaleDateString('th-TH')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">รายการวัสดุ</p>
                        <p className="font-semibold text-slate-700">
                          {request.material_list?.length || 0} รายการ
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => navigate(`/approval/${request.id}`)}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 border-0"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <div className="p-1 bg-white/20 rounded-full">
                          <Eye className="h-4 w-4" />
                        </div>
                        <span>ดูรายละเอียด</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ApprovalHistory;
