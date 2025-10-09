import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { api } from '@/lib/apiService';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    if (!token) {
      setError('ลิงก์ไม่ถูกต้อง');
      return;
    }
    if (!password || password.length < 6) {
      setError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }
    if (password !== confirm) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }
    setBusy(true);
    try {
      // Note: This endpoint may not exist in the current API
      // await api.confirmPasswordReset(token, password);
      throw new Error('Password reset functionality not implemented');
      setInfo('รีเซ็ตรหัสผ่านสำเร็จ กำลังพาไปหน้าเข้าสู่ระบบ...');
      setTimeout(() => navigate('/login'), 1500);
    } catch (e: any) {
      setError(e?.message || 'รีเซ็ตรหัสผ่านไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur-sm shadow-2xl border-white/20">
          <CardHeader>
            <CardTitle>รีเซ็ตรหัสผ่าน</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>รหัสผ่านใหม่</Label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ยืนยันรหัสผ่าน</Label>
                <Input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              </div>
              {error && (
                <Alert variant="destructive" className="bg-red-50 border-red-200">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}
              {info && (
                <Alert className="bg-blue-50 border-blue-200">
                  <AlertDescription className="text-blue-700">{info}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={busy} className="w-full">รีเซ็ต</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


