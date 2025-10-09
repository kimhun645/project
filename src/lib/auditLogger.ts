// Audit Logging System
export enum AuditAction {
  // Authentication
  LOGIN = 'login',
  LOGOUT = 'logout',
  LOGIN_FAILED = 'login_failed',
  
  // Product Management
  PRODUCT_CREATED = 'product_created',
  PRODUCT_UPDATED = 'product_updated',
  PRODUCT_DELETED = 'product_deleted',
  PRODUCT_VIEWED = 'product_viewed',
  
  // Stock Management
  STOCK_UPDATED = 'stock_updated',
  STOCK_MOVEMENT_CREATED = 'stock_movement_created',
  STOCK_MOVEMENT_DELETED = 'stock_movement_deleted',
  
  // Category Management
  CATEGORY_CREATED = 'category_created',
  CATEGORY_UPDATED = 'category_updated',
  CATEGORY_DELETED = 'category_deleted',
  
  // Supplier Management
  SUPPLIER_CREATED = 'supplier_created',
  SUPPLIER_UPDATED = 'supplier_updated',
  SUPPLIER_DELETED = 'supplier_deleted',
  
  // Budget Management
  BUDGET_REQUEST_CREATED = 'budget_request_created',
  BUDGET_REQUEST_UPDATED = 'budget_request_updated',
  BUDGET_REQUEST_APPROVED = 'budget_request_approved',
  BUDGET_REQUEST_REJECTED = 'budget_request_rejected',
  
  // User Management
  USER_CREATED = 'user_created',
  USER_UPDATED = 'user_updated',
  USER_DELETED = 'user_deleted',
  USER_ROLE_CHANGED = 'user_role_changed',
  
  // Settings
  SETTINGS_UPDATED = 'settings_updated',
  
  // Scanner
  PRODUCT_SCANNED = 'product_scanned',
  
  // Data Export
  DATA_EXPORTED = 'data_exported',
  
  // System
  SYSTEM_ERROR = 'system_error',
  SECURITY_VIOLATION = 'security_violation'
}

export enum AuditLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: AuditAction;
  level: AuditLevel;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  level?: AuditLevel;
  startDate?: Date;
  endDate?: Date;
  success?: boolean;
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private logs: AuditLog[] = [];
  private maxLogs: number = 10000; // จำกัดจำนวน logs

  /**
   * บันทึก audit log
   */
  log(params: {
    userId: string;
    userEmail: string;
    userRole: string;
    action: AuditAction;
    level?: AuditLevel;
    resource?: string;
    resourceId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    success?: boolean;
    errorMessage?: string;
  }): void {
    const auditLog: AuditLog = {
      id: this.generateId(),
      userId: params.userId,
      userEmail: params.userEmail,
      userRole: params.userRole,
      action: params.action,
      level: params.level || AuditLevel.INFO,
      resource: params.resource,
      resourceId: params.resourceId,
      details: params.details,
      ipAddress: params.ipAddress,
      userAgent: params.userAgent,
      timestamp: new Date(),
      success: params.success !== false,
      errorMessage: params.errorMessage
    };

    // เพิ่ม log
    this.logs.unshift(auditLog);

    // จำกัดจำนวน logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // บันทึกลง console สำหรับ development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 Audit Log:', {
        action: auditLog.action,
        user: auditLog.userEmail,
        level: auditLog.level,
        success: auditLog.success,
        timestamp: auditLog.timestamp.toISOString()
      });
    }
  }

  /**
   * ดึง audit logs ตาม filter
   */
  getLogs(filter: AuditLogFilter = {}): AuditLog[] {
    let filteredLogs = [...this.logs];

    if (filter.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filter.action);
    }

    if (filter.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filter.level);
    }

    if (filter.startDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      filteredLogs = filteredLogs.filter(log => log.timestamp <= filter.endDate!);
    }

    if (filter.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === filter.success);
    }

    // จำกัดจำนวนผลลัพธ์
    const limit = filter.limit || 100;
    const offset = filter.offset || 0;
    
    return filteredLogs.slice(offset, offset + limit);
  }

  /**
   * นับจำนวน logs ตาม filter
   */
  countLogs(filter: AuditLogFilter = {}): number {
    return this.getLogs(filter).length;
  }

  /**
   * ดึง logs ของผู้ใช้คนหนึ่ง
   */
  getUserLogs(userId: string, limit: number = 50): AuditLog[] {
    return this.getLogs({ userId, limit });
  }

  /**
   * ดึง logs ตาม action
   */
  getActionLogs(action: AuditAction, limit: number = 100): AuditLog[] {
    return this.getLogs({ action, limit });
  }

  /**
   * ดึง logs ที่มีปัญหา (error หรือ critical)
   */
  getErrorLogs(limit: number = 100): AuditLog[] {
    return this.getLogs({ 
      level: AuditLevel.ERROR, 
      limit 
    }).concat(
      this.getLogs({ 
        level: AuditLevel.CRITICAL, 
        limit 
      })
    );
  }

  /**
   * ดึง logs ล่าสุด
   */
  getRecentLogs(limit: number = 100): AuditLog[] {
    return this.getLogs({ limit });
  }

  /**
   * สร้าง ID สำหรับ log
   */
  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * ล้าง logs เก่า (เก่ากว่า 30 วัน)
   */
  cleanOldLogs(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    this.logs = this.logs.filter(log => log.timestamp > thirtyDaysAgo);
  }

  /**
   * ส่งออก logs เป็น JSON
   */
  exportLogs(filter: AuditLogFilter = {}): string {
    const logs = this.getLogs(filter);
    return JSON.stringify(logs, null, 2);
  }

  /**
   * ส่งออก logs เป็น CSV
   */
  exportLogsAsCSV(filter: AuditLogFilter = {}): string {
    const logs = this.getLogs(filter);
    
    if (logs.length === 0) {
      return 'No logs found';
    }

    const headers = [
      'ID', 'User ID', 'User Email', 'User Role', 'Action', 'Level',
      'Resource', 'Resource ID', 'Success', 'IP Address', 'Timestamp', 'Details'
    ];

    const csvRows = [headers.join(',')];

    logs.forEach(log => {
      const row = [
        log.id,
        log.userId,
        log.userEmail,
        log.userRole,
        log.action,
        log.level,
        log.resource || '',
        log.resourceId || '',
        log.success ? 'Yes' : 'No',
        log.ipAddress || '',
        log.timestamp.toISOString(),
        log.details ? JSON.stringify(log.details) : ''
      ];
      csvRows.push(row.map(field => `"${field}"`).join(','));
    });

    return csvRows.join('\n');
  }
}

// สร้าง instance เดียว
export const auditLogger = new AuditLogger();

// Helper functions
export function logUserAction(
  user: { id: string; email: string; role: string },
  action: AuditAction,
  details?: Record<string, any>,
  success: boolean = true
): void {
  auditLogger.log({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action,
    details,
    success,
    level: success ? AuditLevel.INFO : AuditLevel.ERROR
  });
}

export function logSecurityViolation(
  user: { id: string; email: string; role: string },
  action: string,
  details?: Record<string, any>
): void {
  auditLogger.log({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: AuditAction.SECURITY_VIOLATION,
    details: { ...details, attemptedAction: action },
    success: false,
    level: AuditLevel.CRITICAL
  });
}

export function logSystemError(
  error: Error,
  context?: Record<string, any>
): void {
  auditLogger.log({
    userId: 'system',
    userEmail: 'system',
    userRole: 'system',
    action: AuditAction.SYSTEM_ERROR,
    details: { 
      errorMessage: error.message,
      errorStack: error.stack,
      ...context
    },
    success: false,
    level: AuditLevel.ERROR
  });
}
