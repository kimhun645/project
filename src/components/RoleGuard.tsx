import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Shield } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  fallbackPath?: string;
}

export function RoleGuard({ children, allowedRoles, fallbackPath = '/dashboard' }: RoleGuardProps) {
  const { currentUser, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-xl border-0">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-fit">
              <Shield className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-gray-900">ไม่มีสิทธิ์เข้าถึง</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              คุณไม่มีสิทธิ์เข้าถึงหน้านี้
            </p>
            <p className="text-sm text-gray-500">
              บทบาทปัจจุบัน: {currentUser.role === 'admin' ? 'ผู้ดูแลระบบ' : 
                              currentUser.role === 'manager' ? 'ผู้จัดการศูนย์' : 
                              currentUser.role === 'staff' ? 'เจ้าหน้าที่' : 'ผู้ใช้งาน'}
            </p>
            <div className="pt-4">
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                กลับหน้าก่อนหน้า
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>;
}

export function ManagerAndAdmin({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'manager']}>{children}</RoleGuard>;
}

export function StaffAndAbove({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRoles={['admin', 'manager', 'staff']}>{children}</RoleGuard>;
}
