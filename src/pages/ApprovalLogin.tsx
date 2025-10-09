import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Building2,
  Shield
} from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';

const ApprovalLogin: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check if coming from email link
  const requestId = searchParams.get('request_id');
  const decision = searchParams.get('decision');
  const isFromEmail = requestId && decision;

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกอีเมล' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      // Call API to validate approver email and send access code
      console.log('Validating approver email:', email);
      
      const response = await fetch('/api/validate-approver-email', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.message || 'เกิดข้อผิดพลาดในการตรวจสอบอีเมล' 
        });
        return;
      }
      
      setMessage({ 
        type: 'success', 
        text: result.message 
      });
      
      // Navigate to access code verification page
      navigate(`/approval/verify?email=${encodeURIComponent(email)}`);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'เกิดข้อผิดพลาดในการส่งรหัสเข้าถึง กรุณาลองใหม่อีกครั้ง' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDirectAccess = () => {
    if (isFromEmail) {
      // Direct access from email link
      navigate(`/approval/${requestId}`);
    }
  };

  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Shield className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ระบบพิจารณาอนุมัติ</h1>
            <p className="text-gray-600">เข้าสู่ระบบเพื่อพิจารณาคำขอใช้งบประมาณ</p>
          </div>

          {/* Main Card */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 border-2 border-blue-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <CardTitle className="text-xl font-bold flex items-center">
                <Lock className="h-6 w-6 mr-3" />
                {isFromEmail ? 'เข้าถึงโดยตรง' : 'ขอรหัสเข้าถึง'}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isFromEmail ? (
                // Direct access from email
                <div className="space-y-6">
                  <div className="text-center">
                    <div className="p-3 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">ลิงก์จากอีเมล</h3>
                    <p className="text-gray-600 text-sm">
                      คุณได้รับลิงก์นี้จากอีเมลคำขออนุมัติ สามารถเข้าถึงได้โดยตรง
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Building2 className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">รายละเอียดคำขอ</span>
                    </div>
                    <p className="text-sm text-blue-700">
                      รหัสคำขอ: <span className="font-semibold">{requestId}</span>
                    </p>
                    <p className="text-sm text-blue-700">
                      การดำเนินการ: <span className="font-semibold">{decision === 'APPROVE' ? 'อนุมัติ' : 'ปฏิเสธ'}</span>
                    </p>
                  </div>

                  <Button
                    onClick={handleDirectAccess}
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <ArrowRight className="h-5 w-5 mr-2" />
                    เข้าสู่ระบบพิจารณา
                  </Button>
                </div>
              ) : (
                // Request access code
                <form onSubmit={handleRequestAccess} className="space-y-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700 mb-2 block">
                      อีเมลผู้อนุมัติ
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="กรอกอีเมลผู้อนุมัติที่ลงทะเบียนไว้"
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      เฉพาะอีเมลของผู้อนุมัติที่ลงทะเบียนในระบบเท่านั้น
                    </p>
                  </div>

                  {message && (
                    <Alert className={message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                      {message.type === 'error' ? (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription className={message.type === 'error' ? 'text-red-700' : 'text-green-700'}>
                        {message.text}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังส่งรหัส...
                      </>
                    ) : (
                      <>
                        <Mail className="h-5 w-5 mr-2" />
                        ขอรหัสเข้าถึง
                      </>
                    )}
                  </Button>
                </form>
              )}

              {/* Footer */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  ระบบพิจารณาอนุมัติใช้งบประมาณ<br />
                  ศูนย์จัดการธนบัตร นครราชสีมา
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default ApprovalLogin;
