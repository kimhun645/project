import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Key, 
  ArrowRight, 
  CheckCircle, 
  AlertCircle,
  Clock,
  Mail
} from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';

const ApprovalVerify: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [accessCode, setAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isExpired, setIsExpired] = useState(false);

  const email = searchParams.get('email');

  useEffect(() => {
    if (!email) {
      navigate('/approval');
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [email, navigate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessCode.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกรหัสเข้าถึง' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      console.log('Verifying access code:', accessCode, 'for email:', email);
      
      const response = await fetch('/api/verify-access-code', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ 
          email: email,
          code: accessCode 
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setMessage({ 
          type: 'error', 
          text: result.message || 'รหัสเข้าถึงไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง' 
        });
        return;
      }
      
      setMessage({ 
        type: 'success', 
        text: 'รหัสเข้าถึงถูกต้อง กำลังเข้าสู่ระบบ...' 
      });
      
      // Navigate to approval page after successful verification
      setTimeout(() => {
        navigate('/approval');
      }, 2000);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'เกิดข้อผิดพลาดในการตรวจสอบรหัส กรุณาลองใหม่อีกครั้ง' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    
    setIsLoading(true);
    setMessage(null);

    try {
      console.log('Resending access code for:', email);
      
      const response = await fetch('/api/resend-access-code', {
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
          text: result.message || 'เกิดข้อผิดพลาดในการส่งรหัสใหม่' 
        });
        return;
      }
      
      setMessage({ 
        type: 'success', 
        text: result.message || `ส่งรหัสเข้าถึงใหม่ไปยัง ${email} เรียบร้อยแล้ว` 
      });
      
      // Reset timer
      setTimeLeft(300);
      setIsExpired(false);
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'เกิดข้อผิดพลาดในการส่งรหัสใหม่ กรุณาลองใหม่อีกครั้ง' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <Layout hideHeader={true}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="p-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
              <Key className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ยืนยันรหัสเข้าถึง</h1>
            <p className="text-gray-600">กรอกรหัสเข้าถึงที่ส่งไปยังอีเมลของคุณ</p>
          </div>

          {/* Main Card */}
          <Card className="bg-gradient-to-br from-white via-blue-50 to-cyan-50 border-2 border-blue-200 shadow-2xl">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
              <CardTitle className="text-xl font-bold flex items-center">
                <Shield className="h-6 w-6 mr-3" />
                ตรวจสอบรหัสเข้าถึง
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {/* Email Info */}
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-600">ส่งไปยัง</span>
                </div>
                <p className="font-semibold text-gray-800">{email}</p>
              </div>

              {/* Timer */}
              <div className="text-center mb-6">
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                  isExpired 
                    ? 'bg-red-100 text-red-700 border border-red-200' 
                    : 'bg-orange-100 text-orange-700 border border-orange-200'
                }`}>
                  <Clock className="h-4 w-4" />
                  {isExpired ? 'รหัสหมดอายุ' : `หมดอายุใน ${formatTime(timeLeft)}`}
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyCode} className="space-y-6">
                <div>
                  <Label htmlFor="access-code" className="text-sm font-medium text-gray-700 mb-2 block">
                    รหัสเข้าถึง (6 หลัก)
                  </Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="access-code"
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="กรอกรหัส 6 หลัก"
                      className="pl-10 text-center text-lg tracking-widest"
                      maxLength={6}
                      disabled={isExpired}
                      required
                    />
                  </div>
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

                <div className="space-y-3">
                  <Button
                    type="submit"
                    disabled={isLoading || isExpired || accessCode.length !== 6}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        กำลังตรวจสอบ...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-5 w-5 mr-2" />
                        ยืนยันรหัสเข้าถึง
                      </>
                    )}
                  </Button>

                  {isExpired && (
                    <Button
                      type="button"
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          กำลังส่งใหม่...
                        </>
                      ) : (
                        <>
                          <Mail className="h-5 w-5 mr-2" />
                          ส่งรหัสใหม่
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </form>

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

export default ApprovalVerify;
