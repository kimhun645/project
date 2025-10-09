import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Shield, 
  Crown, 
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { userService, UserRole } from '@/lib/userService';

interface RoleManagementProps {
  currentUserRole: string;
}

export function RoleManagement({ currentUserRole }: RoleManagementProps) {
  const { hasPermission } = useAuth();
  const roles = userService.getAllRoles();

  const getRoleIcon = (roleId: string) => {
    switch (roleId) {
      case 'admin': return <Crown className="h-6 w-6" />;
      case 'manager': return <Shield className="h-6 w-6" />;
      default: return <User className="h-6 w-6" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    const colorMap = {
      blue: 'bg-blue-50 text-blue-700 border-blue-200',
      green: 'bg-green-50 text-green-700 border-green-200',
      red: 'bg-red-50 text-red-700 border-red-200'
    };
    return colorMap[role.color as keyof typeof colorMap] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getPermissionIcon = (permission: string) => {
    if (permission.includes('create')) return '➕';
    if (permission.includes('read')) return '👁️';
    if (permission.includes('update')) return '✏️';
    if (permission.includes('delete')) return '🗑️';
    if (permission.includes('approve')) return '✅';
    if (permission.includes('export')) return '📤';
    if (permission.includes('admin')) return '⚙️';
    return '📋';
  };

  const getPermissionCategory = (permission: string) => {
    if (permission.startsWith('products:')) return 'สินค้า';
    if (permission.startsWith('categories:')) return 'หมวดหมู่';
    if (permission.startsWith('suppliers:')) return 'ผู้จำหน่าย';
    if (permission.startsWith('movements:')) return 'การเคลื่อนไหว';
    if (permission.startsWith('reports:')) return 'รายงาน';
    if (permission.startsWith('budget:')) return 'งบประมาณ';
    if (permission.startsWith('approval:')) return 'การอนุมัติ';
    if (permission.startsWith('users:')) return 'ผู้ใช้';
    if (permission.startsWith('settings:')) return 'ตั้งค่า';
    if (permission.startsWith('system:')) return 'ระบบ';
    return 'อื่นๆ';
  };

  const groupPermissionsByCategory = (permissions: string[]) => {
    const grouped: { [key: string]: string[] } = {};
    permissions.forEach(permission => {
      const category = getPermissionCategory(permission);
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(permission);
    });
    return grouped;
  };

  const canViewRoles = hasPermission('settings:read');

  if (!canViewRoles) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
          <p className="text-gray-500">คุณไม่มีสิทธิ์ในการดูข้อมูลบทบาท</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">จัดการบทบาทและสิทธิ์</h2>
        <p className="text-gray-600">ดูข้อมูลบทบาทและสิทธิ์การเข้าถึงระบบ</p>
      </div>

      <div className="grid gap-6">
        {roles.map(role => {
          const groupedPermissions = groupPermissionsByCategory(role.permissions);
          const isCurrentRole = role.id === currentUserRole;
          
          return (
            <Card key={role.id} className={isCurrentRole ? 'ring-2 ring-blue-500' : ''}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getRoleColor(role)}`}>
                    {getRoleIcon(role.id)}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {role.name}
                      {isCurrentRole && (
                        <Badge variant="outline" className="text-blue-600 border-blue-200">
                          บทบาทปัจจุบัน
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">สิทธิ์การเข้าถึง</h4>
                    <div className="grid gap-3">
                      {Object.entries(groupedPermissions).map(([category, permissions]) => (
                        <div key={category} className="space-y-2">
                          <h5 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                            <Info className="h-4 w-4" />
                            {category}
                          </h5>
                          <div className="flex flex-wrap gap-2">
                            {permissions.map(permission => (
                              <Badge
                                key={permission}
                                variant="outline"
                                className="text-xs"
                              >
                                <span className="mr-1">{getPermissionIcon(permission)}</span>
                                {permission.replace(/^[^:]+:/, '').replace(/_/g, ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>จำนวนสิทธิ์ทั้งหมด: {role.permissions.length}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full bg-${role.color}-500`}></div>
                        <span className="capitalize">{role.color}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">คำอธิบายสิทธิ์</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">ประเภทการดำเนินการ</h4>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <span>👁️</span>
                  <span>ดูข้อมูล (Read)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>➕</span>
                  <span>เพิ่มข้อมูล (Create)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✏️</span>
                  <span>แก้ไขข้อมูล (Update)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>🗑️</span>
                  <span>ลบข้อมูล (Delete)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>✅</span>
                  <span>อนุมัติ (Approve)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>📤</span>
                  <span>ส่งออก (Export)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>⚙️</span>
                  <span>จัดการระบบ (Admin)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">ระดับการเข้าถึง</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-500" />
                  <span><strong>ผู้ใช้งาน:</strong> ใช้งานระบบได้ทุกฟีเจอร์ ยกเว้นการอนุมัติและตั้งค่า</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span><strong>ผู้จัดการ:</strong> ใช้งานได้ทุกฟีเจอร์ รวมถึงการอนุมัติ</span>
                </div>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-red-500" />
                  <span><strong>ผู้ดูแลระบบ:</strong> ใช้งานได้ทุกฟีเจอร์ รวมถึงการจัดการผู้ใช้</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
