export interface SecurityConfig {
  enableTwoFactor: boolean;
  sessionTimeout: number; // in minutes
  maxLoginAttempts: number;
  lockoutDuration: number; // in minutes
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
  auditLogging: boolean;
  dataEncryption: boolean;
  ipWhitelist: string[];
  rolePermissions: Record<string, string[]>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId?: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SecurityEvent {
  type: 'login' | 'logout' | 'permission_denied' | 'suspicious_activity' | 'data_access' | 'data_modification';
  userId: string;
  details: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

export class SecurityService {
  private static config: SecurityConfig = {
    enableTwoFactor: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    auditLogging: true,
    dataEncryption: true,
    ipWhitelist: [],
    rolePermissions: {
      'admin': ['read', 'create', 'update', 'delete', 'approve', 'export', 'import', 'settings'],
      'manager': ['read', 'create', 'update', 'approve', 'export'],
      'staff': ['read', 'create', 'update']
    }
  };

  private static loginAttempts: Map<string, { count: number; lastAttempt: Date; locked: boolean }> = new Map();
  private static securityEvents: SecurityEvent[] = [];
  private static auditLogs: AuditLog[] = [];

  // Get security configuration
  static getConfig(): SecurityConfig {
    return { ...this.config };
  }

  // Update security configuration
  static updateConfig(newConfig: Partial<SecurityConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logSecurityEvent('settings_update', 'system', 'Security configuration updated', 'medium');
  }

  // Check if user is locked out
  static isUserLockedOut(userId: string): boolean {
    const attempts = this.loginAttempts.get(userId);
    if (!attempts) return false;
    
    if (attempts.locked) {
      const lockoutTime = new Date(attempts.lastAttempt);
      const lockoutDuration = this.config.lockoutDuration * 60 * 1000; // Convert to milliseconds
      const now = new Date();
      
      if (now.getTime() - lockoutTime.getTime() > lockoutDuration) {
        // Lockout period has expired
        this.loginAttempts.delete(userId);
        return false;
      }
      
      return true;
    }
    
    return false;
  }

  // Record login attempt
  static recordLoginAttempt(userId: string, success: boolean): void {
    const attempts = this.loginAttempts.get(userId) || { count: 0, lastAttempt: new Date(), locked: false };
    
    if (success) {
      // Reset attempts on successful login
      this.loginAttempts.delete(userId);
      this.logSecurityEvent('login_success', userId, 'User logged in successfully', 'low');
    } else {
      attempts.count++;
      attempts.lastAttempt = new Date();
      
      if (attempts.count >= this.config.maxLoginAttempts) {
        attempts.locked = true;
        this.logSecurityEvent('account_locked', userId, `Account locked after ${attempts.count} failed attempts`, 'high');
      } else {
        this.logSecurityEvent('login_failed', userId, `Failed login attempt ${attempts.count}/${this.config.maxLoginAttempts}`, 'medium');
      }
      
      this.loginAttempts.set(userId, attempts);
    }
  }

  // Check password strength
  static validatePassword(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const policy = this.config.passwordPolicy;
    
    if (password.length < policy.minLength) {
      errors.push(`รหัสผ่านต้องมีอย่างน้อย ${policy.minLength} ตัวอักษร`);
    }
    
    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่');
    }
    
    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิมพ์เล็ก');
    }
    
    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวเลข');
    }
    
    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('รหัสผ่านต้องมีตัวอักษรพิเศษ');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Check user permissions
  static hasPermission(userRole: string, action: string): boolean {
    const permissions = this.config.rolePermissions[userRole] || [];
    return permissions.includes(action);
  }

  // Check multiple permissions
  static hasPermissions(userRole: string, actions: string[]): boolean {
    const permissions = this.config.rolePermissions[userRole] || [];
    return actions.every(action => permissions.includes(action));
  }

  // Log security event
  static logSecurityEvent(type: SecurityEvent['type'], userId: string, details: string, severity: SecurityEvent['severity']): void {
    if (!this.config.auditLogging) return;
    
    const event: SecurityEvent = {
      type,
      userId,
      details,
      severity,
      timestamp: new Date().toISOString()
    };
    
    this.securityEvents.push(event);
    
    // Keep only last 1000 events
    if (this.securityEvents.length > 1000) {
      this.securityEvents = this.securityEvents.slice(-1000);
    }
    
    // Log to console for development
    console.log(`[SECURITY - ${severity.toUpperCase()}] ${type}: ${details}`);
  }

  // Log audit event
  static logAuditEvent(
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    resource: string,
    resourceId?: string,
    details?: string,
    ipAddress?: string,
    userAgent?: string
  ): void {
    if (!this.config.auditLogging) return;
    
    const log: AuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      userName,
      userRole,
      action,
      resource,
      resourceId,
      details: details || '',
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date().toISOString(),
      severity: this.getSeverityForAction(action)
    };
    
    this.auditLogs.push(log);
    
    // Keep only last 5000 audit logs
    if (this.auditLogs.length > 5000) {
      this.auditLogs = this.auditLogs.slice(-5000);
    }
  }

  // Get severity for action
  private static getSeverityForAction(action: string): AuditLog['severity'] {
    const criticalActions = ['delete', 'export', 'import', 'settings_update'];
    const highActions = ['create', 'update', 'approve', 'reject'];
    const mediumActions = ['read', 'view', 'search'];
    
    if (criticalActions.includes(action)) return 'critical';
    if (highActions.includes(action)) return 'high';
    if (mediumActions.includes(action)) return 'medium';
    return 'low';
  }

  // Get security events
  static getSecurityEvents(limit: number = 100): SecurityEvent[] {
    return this.securityEvents.slice(-limit).reverse();
  }

  // Get audit logs
  static getAuditLogs(limit: number = 100): AuditLog[] {
    return this.auditLogs.slice(-limit).reverse();
  }

  // Get security statistics
  static getSecurityStatistics(): {
    totalEvents: number;
    eventsBySeverity: Record<string, number>;
    eventsByType: Record<string, number>;
    recentActivity: number;
    lockedAccounts: number;
  } {
    const eventsBySeverity = this.securityEvents.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const eventsByType = this.securityEvents.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const recentActivity = this.securityEvents.filter(event => {
      const eventTime = new Date(event.timestamp);
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      return eventTime > oneHourAgo;
    }).length;
    
    const lockedAccounts = Array.from(this.loginAttempts.values()).filter(attempt => attempt.locked).length;
    
    return {
      totalEvents: this.securityEvents.length,
      eventsBySeverity,
      eventsByType,
      recentActivity,
      lockedAccounts
    };
  }

  // Check IP whitelist
  static isIPAllowed(ipAddress: string): boolean {
    if (this.config.ipWhitelist.length === 0) return true;
    return this.config.ipWhitelist.includes(ipAddress);
  }

  // Generate security report
  static generateSecurityReport(): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      highEvents: number;
      mediumEvents: number;
      lowEvents: number;
      lockedAccounts: number;
    };
    recentEvents: SecurityEvent[];
    auditLogs: AuditLog[];
    recommendations: string[];
  } {
    const stats = this.getSecurityStatistics();
    const recentEvents = this.getSecurityEvents(50);
    const auditLogs = this.getAuditLogs(50);
    
    const recommendations: string[] = [];
    
    if (stats.eventsBySeverity.critical > 0) {
      recommendations.push('มีเหตุการณ์ความปลอดภัยระดับวิกฤต ควรตรวจสอบทันที');
    }
    
    if (stats.lockedAccounts > 0) {
      recommendations.push('มีบัญชีที่ถูกล็อค ควรตรวจสอบการเข้าสู่ระบบ');
    }
    
    if (stats.recentActivity > 10) {
      recommendations.push('มีการใช้งานระบบมากผิดปกติ ควรตรวจสอบ');
    }
    
    if (!this.config.enableTwoFactor) {
      recommendations.push('ควรเปิดใช้งานการยืนยันตัวตนสองขั้นตอน');
    }
    
    if (this.config.sessionTimeout > 60) {
      recommendations.push('ควรลดเวลาหมดอายุของเซสชันเพื่อความปลอดภัย');
    }
    
    return {
      summary: {
        totalEvents: stats.totalEvents,
        criticalEvents: stats.eventsBySeverity.critical || 0,
        highEvents: stats.eventsBySeverity.high || 0,
        mediumEvents: stats.eventsBySeverity.medium || 0,
        lowEvents: stats.eventsBySeverity.low || 0,
        lockedAccounts: stats.lockedAccounts
      },
      recentEvents,
      auditLogs,
      recommendations
    };
  }

  // Clear old security data
  static clearOldData(): void {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Clear old security events
    this.securityEvents = this.securityEvents.filter(event => 
      new Date(event.timestamp) > oneWeekAgo
    );
    
    // Clear old audit logs
    this.auditLogs = this.auditLogs.filter(log => 
      new Date(log.timestamp) > oneWeekAgo
    );
    
    // Clear old login attempts
    for (const [userId, attempts] of this.loginAttempts.entries()) {
      if (new Date(attempts.lastAttempt) < oneWeekAgo) {
        this.loginAttempts.delete(userId);
      }
    }
  }

  // Export security data
  static exportSecurityData(): void {
    const report = this.generateSecurityReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      config: this.config,
      report
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
