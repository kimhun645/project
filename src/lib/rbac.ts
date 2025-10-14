// Role-based Access Control (RBAC) System
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager', 
  STAFF = 'staff'
}

export enum Permission {
  // Product Management
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  UPDATE_PRODUCTS = 'update_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Stock Management
  VIEW_STOCK = 'view_stock',
  UPDATE_STOCK = 'update_stock',
  MANAGE_MOVEMENTS = 'manage_movements',
  
  // Category Management
  VIEW_CATEGORIES = 'view_categories',
  MANAGE_CATEGORIES = 'manage_categories',
  
  // Supplier Management
  VIEW_SUPPLIERS = 'view_suppliers',
  MANAGE_SUPPLIERS = 'manage_suppliers',
  
  // Budget Management
  VIEW_BUDGET_REQUESTS = 'view_budget_requests',
  CREATE_BUDGET_REQUESTS = 'create_budget_requests',
  APPROVE_BUDGET_REQUESTS = 'approve_budget_requests',
  
  // Reports
  VIEW_REPORTS = 'view_reports',
  EXPORT_DATA = 'export_data',
  
  // User Management
  VIEW_USERS = 'view_users',
  MANAGE_USERS = 'manage_users',
  
  // Settings
  VIEW_SETTINGS = 'view_settings',
  MANAGE_SETTINGS = 'manage_settings',
  
  // Scanner
  USE_SCANNER = 'use_scanner',
  
  // Audit
  VIEW_AUDIT_LOGS = 'view_audit_logs'
}

// กำหนดสิทธิ์ตาม roles
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // Admin มีสิทธิ์ทุกอย่าง
    ...Object.values(Permission)
  ],
  
  [UserRole.MANAGER]: [
    // Product Management
    Permission.VIEW_PRODUCTS,
    Permission.CREATE_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    Permission.DELETE_PRODUCTS,
    
    // Stock Management
    Permission.VIEW_STOCK,
    Permission.UPDATE_STOCK,
    Permission.MANAGE_MOVEMENTS,
    
    // Category Management
    Permission.VIEW_CATEGORIES,
    Permission.MANAGE_CATEGORIES,
    
    // Supplier Management
    Permission.VIEW_SUPPLIERS,
    Permission.MANAGE_SUPPLIERS,
    
    // Budget Management
    Permission.VIEW_BUDGET_REQUESTS,
    Permission.CREATE_BUDGET_REQUESTS,
    Permission.APPROVE_BUDGET_REQUESTS,
    
    // Reports
    Permission.VIEW_REPORTS,
    Permission.EXPORT_DATA,
    
    // User Management (จำกัด)
    Permission.VIEW_USERS,
    
    // Settings
    Permission.VIEW_SETTINGS,
    
    // Scanner
    Permission.USE_SCANNER,
    
    // Audit
    Permission.VIEW_AUDIT_LOGS
  ],
  
  [UserRole.STAFF]: [
    // Product Management (ดูและแก้ไข)
    Permission.VIEW_PRODUCTS,
    Permission.UPDATE_PRODUCTS,
    
    // Stock Management
    Permission.VIEW_STOCK,
    Permission.UPDATE_STOCK,
    Permission.MANAGE_MOVEMENTS,
    
    // Category Management (ดูอย่างเดียว)
    Permission.VIEW_CATEGORIES,
    
    // Supplier Management (ดูอย่างเดียว)
    Permission.VIEW_SUPPLIERS,
    
    // Budget Management
    Permission.VIEW_BUDGET_REQUESTS,
    Permission.CREATE_BUDGET_REQUESTS,
    
    // Reports (จำกัด)
    Permission.VIEW_REPORTS,
    
    // Scanner
    Permission.USE_SCANNER
  ]
};

export interface User {
  id: string;
  email: string;
  displayName?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  lastLoginAt?: Date;
}

export interface PermissionCheck {
  hasPermission: boolean;
  reason?: string;
}

/**
 * ตรวจสอบว่าผู้ใช้มีสิทธิ์หรือไม่
 */
export function hasPermission(user: User, permission: Permission): PermissionCheck {
  // ตรวจสอบว่า user ยังใช้งานอยู่หรือไม่
  if (!user.isActive) {
    return {
      hasPermission: false,
      reason: 'User account is inactive'
    };
  }
  
  // ตรวจสอบสิทธิ์ตาม role
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  const hasAccess = userPermissions.includes(permission);
  
  return {
    hasPermission: hasAccess,
    reason: hasAccess ? undefined : `User role '${user.role}' does not have permission '${permission}'`
  };
}

/**
 * ตรวจสอบสิทธิ์หลายตัวพร้อมกัน
 */
export function hasAnyPermission(user: User, permissions: Permission[]): PermissionCheck {
  for (const permission of permissions) {
    const check = hasPermission(user, permission);
    if (check.hasPermission) {
      return { hasPermission: true };
    }
  }
  
  return {
    hasPermission: false,
    reason: `User role '${user.role}' does not have any of the required permissions`
  };
}

/**
 * ตรวจสอบสิทธิ์ทั้งหมด
 */
export function hasAllPermissions(user: User, permissions: Permission[]): PermissionCheck {
  for (const permission of permissions) {
    const check = hasPermission(user, permission);
    if (!check.hasPermission) {
      return check;
    }
  }
  
  return { hasPermission: true };
}

/**
 * ตรวจสอบว่าเป็น Admin หรือไม่
 */
export function isAdmin(user: User): boolean {
  return user.role === UserRole.ADMIN;
}

/**
 * ตรวจสอบว่าเป็น Manager หรือสูงกว่า
 */
export function isManagerOrAbove(user: User): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.MANAGER;
}

/**
 * ตรวจสอบว่าเป็น Staff หรือสูงกว่า
 */
export function isStaffOrAbove(user: User): boolean {
  return user.role !== UserRole.VIEWER;
}

/**
 * ตรวจสอบว่าเป็น Viewer หรือไม่
 */
export function isViewer(user: User): boolean {
  return user.role === UserRole.VIEWER;
}

/**
 * ตรวจสอบสิทธิ์การเข้าถึงหน้า
 */
export function canAccessPage(user: User, page: string): PermissionCheck {
  const pagePermissions: Record<string, Permission[]> = {
    'dashboard': [Permission.VIEW_PRODUCTS],
    'products': [Permission.VIEW_PRODUCTS],
    'categories': [Permission.VIEW_CATEGORIES],
    'suppliers': [Permission.VIEW_SUPPLIERS],
    'movements': [Permission.VIEW_STOCK],
    'scanner': [Permission.USE_SCANNER],
    'budget-request': [Permission.CREATE_BUDGET_REQUESTS],
    'approval': [Permission.APPROVE_BUDGET_REQUESTS],
    'reports': [Permission.VIEW_REPORTS],
    'settings': [Permission.VIEW_SETTINGS],
    'users': [Permission.VIEW_USERS]
  };
  
  const requiredPermissions = pagePermissions[page] || [];
  if (requiredPermissions.length === 0) {
    return { hasPermission: true }; // หน้าไม่ต้องการสิทธิ์พิเศษ
  }
  
  return hasAnyPermission(user, requiredPermissions);
}

/**
 * ตรวจสอบสิทธิ์การดำเนินการ
 */
export function canPerformAction(user: User, action: string, resource?: string): PermissionCheck {
  const actionPermissions: Record<string, Permission> = {
    'create_product': Permission.CREATE_PRODUCTS,
    'update_product': Permission.UPDATE_PRODUCTS,
    'delete_product': Permission.DELETE_PRODUCTS,
    'update_stock': Permission.UPDATE_STOCK,
    'create_movement': Permission.MANAGE_MOVEMENTS,
    'create_budget_request': Permission.CREATE_BUDGET_REQUESTS,
    'approve_budget_request': Permission.APPROVE_BUDGET_REQUESTS,
    'export_data': Permission.EXPORT_DATA,
    'manage_users': Permission.MANAGE_USERS,
    'manage_settings': Permission.MANAGE_SETTINGS
  };
  
  const permission = actionPermissions[action];
  if (!permission) {
    return {
      hasPermission: false,
      reason: `Unknown action: ${action}`
    };
  }
  
  return hasPermission(user, permission);
}
