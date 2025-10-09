// Security Middleware for RBAC and Audit
import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, hasPermission, canPerformAction, canAccessPage } from './rbac';
import { auditLogger, AuditAction, logUserAction, logSecurityViolation } from './auditLogger';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    isActive: boolean;
  };
}

/**
 * Middleware ตรวจสอบสิทธิ์ตาม permission
 */
export function requirePermission(permission: Permission) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const permissionCheck = hasPermission(req.user, permission);
    
    if (!permissionCheck.hasPermission) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to access ${permission}`, {
        permission,
        reason: permissionCheck.reason,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
        details: permissionCheck.reason
      });
    }

    next();
  };
}

/**
 * Middleware ตรวจสอบสิทธิ์ตาม action
 */
export function requireAction(action: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const actionCheck = canPerformAction(req.user, action, req.params.id);
    
    if (!actionCheck.hasPermission) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to perform ${action}`, {
        action,
        resourceId: req.params.id,
        reason: actionCheck.reason,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions for this action',
        details: actionCheck.reason
      });
    }

    next();
  };
}

/**
 * Middleware ตรวจสอบ role
 */
export function requireRole(roles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    if (!roles.includes(req.user.role)) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to access role-restricted resource`, {
        requiredRoles: roles,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient role privileges',
        details: `Required roles: ${roles.join(', ')}, User role: ${req.user.role}`
      });
    }

    next();
  };
}

/**
 * Middleware ตรวจสอบว่าเป็น admin
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole([UserRole.ADMIN])(req, res, next);
}

/**
 * Middleware ตรวจสอบว่าเป็น manager หรือ admin
 */
export function requireManagerOrAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER])(req, res, next);
}

/**
 * Middleware ตรวจสอบว่าเป็น staff หรือสูงกว่า
 */
export function requireStaffOrAbove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF])(req, res, next);
}

/**
 * Middleware บันทึก audit log สำหรับการเข้าถึงข้อมูล
 */
export function auditDataAccess(resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      logUserAction(req.user, AuditAction.PRODUCT_VIEWED, {
        resource,
        resourceId: req.params.id,
        method: req.method,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
}

/**
 * Middleware บันทึก audit log สำหรับการสร้างข้อมูล
 */
export function auditDataCreation(resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      logUserAction(req.user, AuditAction.PRODUCT_CREATED, {
        resource,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
}

/**
 * Middleware บันทึก audit log สำหรับการแก้ไขข้อมูล
 */
export function auditDataUpdate(resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      logUserAction(req.user, AuditAction.PRODUCT_UPDATED, {
        resource,
        resourceId: req.params.id,
        data: req.body,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
}

/**
 * Middleware บันทึก audit log สำหรับการลบข้อมูล
 */
export function auditDataDeletion(resource: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.user) {
      logUserAction(req.user, AuditAction.PRODUCT_DELETED, {
        resource,
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });
    }
    next();
  };
}

/**
 * Middleware บันทึก audit log สำหรับการเข้าสู่ระบบ
 */
export function auditLogin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    logUserAction(req.user, AuditAction.LOGIN, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware บันทึก audit log สำหรับการออกจากระบบ
 */
export function auditLogout(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    logUserAction(req.user, AuditAction.LOGOUT, {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware บันทึก audit log สำหรับการสแกนบาร์โค้ด
 */
export function auditBarcodeScan(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    logUserAction(req.user, AuditAction.PRODUCT_SCANNED, {
      barcode: req.body.barcode || req.query.barcode,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware บันทึก audit log สำหรับการอนุมัติ
 */
export function auditApproval(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    logUserAction(req.user, AuditAction.BUDGET_REQUEST_APPROVED, {
      requestId: req.params.id,
      action: req.body.action,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware บันทึก audit log สำหรับการส่งออกข้อมูล
 */
export function auditDataExport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (req.user) {
    logUserAction(req.user, AuditAction.DATA_EXPORTED, {
      exportType: req.query.type || 'unknown',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    });
  }
  next();
}

/**
 * Middleware ตรวจสอบการเข้าถึงหน้า
 */
export function requirePageAccess(page: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    const accessCheck = canAccessPage(req.user, page);
    
    if (!accessCheck.hasPermission) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to access page ${page}`, {
        page,
        reason: accessCheck.reason,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions to access this page',
        details: accessCheck.reason
      });
    }

    next();
  };
}

/**
 * Middleware ตรวจสอบการเข้าถึงข้อมูลตาม ownership
 */
export function requireOwnership(field: string = 'userId') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // ตรวจสอบว่าเป็นเจ้าของข้อมูลหรือไม่
    const resourceUserId = req.params[field] || req.body[field];
    if (resourceUserId !== req.user.id) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to access resource owned by ${resourceUserId}`, {
        resourceUserId,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access your own resources',
        details: `Resource owner: ${resourceUserId}, Your ID: ${req.user.id}`
      });
    }

    next();
  };
}

/**
 * Middleware ตรวจสอบการเข้าถึงข้อมูลตาม department
 */
export function requireDepartmentAccess(departmentField: string = 'department') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Unauthorized',
        message: 'User not authenticated'
      });
    }

    // ตรวจสอบว่าเป็น admin หรือไม่
    if (req.user.role === UserRole.ADMIN) {
      return next();
    }

    // ตรวจสอบว่าเป็น manager หรือไม่
    if (req.user.role === UserRole.MANAGER) {
      return next();
    }

    // ตรวจสอบว่าเป็น staff ใน department เดียวกันหรือไม่
    const resourceDepartment = req.params[departmentField] || req.body[departmentField];
    const userDepartment = req.user.department;
    
    if (resourceDepartment !== userDepartment) {
      // บันทึก security violation
      logSecurityViolation(req.user, `Attempted to access resource from different department`, {
        resourceDepartment,
        userDepartment,
        userRole: req.user.role,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(403).json({
        error: 'Forbidden',
        message: 'You can only access resources from your department',
        details: `Resource department: ${resourceDepartment}, Your department: ${userDepartment}`
      });
    }

    next();
  };
}
