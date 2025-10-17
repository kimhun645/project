import { db } from './firebase';
import { collection, addDoc, query, orderBy, limit, getDocs, where, Timestamp } from 'firebase/firestore';

export interface LogEntry {
  id?: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  description: string;
  resource: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  metadata?: Record<string, any>;
}

export class LogService {
  private static collectionName = 'logs';

  /**
   * สร้าง collection system_logs และเพิ่มข้อมูลเริ่มต้น
   */
  static async initializeSystemLogs(): Promise<void> {
    try {
      // ตรวจสอบว่ามี collection หรือไม่
      const q = query(collection(db, this.collectionName), limit(1));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        // สร้าง logs เริ่มต้น
        const initialLogs = [
          {
            userId: 'system',
            userName: 'System',
            userRole: 'admin',
            action: 'SYSTEM_INIT',
            description: 'ระบบเริ่มต้นใช้งาน',
            resource: 'System',
            ipAddress: '127.0.0.1',
            userAgent: 'System',
            timestamp: new Date().toISOString(),
            severity: 'info' as const,
            metadata: { initialization: true }
          },
          {
            userId: 'system',
            userName: 'System',
            userRole: 'admin',
            action: 'COLLECTION_CREATED',
            description: 'สร้าง collection system_logs',
            resource: 'Firestore',
            ipAddress: '127.0.0.1',
            userAgent: 'System',
            timestamp: new Date().toISOString(),
            severity: 'success' as const,
            metadata: { collection: 'system_logs' }
          }
        ];

        // เพิ่ม logs เริ่มต้น
        for (const log of initialLogs) {
          await addDoc(collection(db, this.collectionName), {
            ...log,
            timestamp: Timestamp.fromDate(new Date())
          });
        }
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * บันทึก log การใช้งาน
   */
  static async log(
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    description: string,
    resource: string,
    options: {
      resourceId?: string;
      severity?: 'info' | 'warning' | 'error' | 'success';
      metadata?: Record<string, any>;
    } = {}
  ): Promise<void> {
    try {
      console.log('📝 LogService: ===== STARTING LOG PROCESS =====');
      console.log('📝 LogService: Action:', action);
      console.log('📝 LogService: User ID:', userId);
      console.log('📝 LogService: User Name:', userName);
      console.log('📝 LogService: User Role:', userRole);
      console.log('📝 LogService: Description:', description);
      console.log('📝 LogService: Resource:', resource);
      console.log('📝 LogService: Severity:', options.severity || 'info');
      
      const logEntry: Omit<LogEntry, 'id'> = {
        userId,
        userName,
        userRole,
        action,
        description,
        resource,
        resourceId: options.resourceId,
        ipAddress: this.getClientIP(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        severity: options.severity || 'info',
        metadata: options.metadata || {}
      };

      console.log('📝 LogService: Log entry prepared:', logEntry);
      console.log('📝 LogService: Collection name:', this.collectionName);
      console.log('📝 LogService: Database instance:', db);

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...logEntry,
        timestamp: Timestamp.fromDate(new Date())
      });
      
      console.log('📝 LogService: ✅ Log saved successfully with ID:', docRef.id);
      console.log('📝 LogService: ===== LOG PROCESS COMPLETED =====');
    } catch (error) {
      console.error('❌ LogService: ===== LOG PROCESS FAILED =====');
      console.error('❌ LogService: Error details:', error);
      console.error('❌ LogService: Error message:', error.message);
      console.error('❌ LogService: Error stack:', error.stack);
      console.error('❌ LogService: ===== END ERROR =====');
      // Don't throw error to avoid breaking the main functionality
    }
  }

  /**
   * ดึง logs ล่าสุด (optimized)
   */
  static async getRecentLogs(limitCount: number = 20): Promise<LogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];
      
      return logs;
    } catch (error) {
      return [];
    }
  }

  /**
   * ดึง logs แบบ pagination
   */
  static async getLogsPaginated(page: number = 1, pageSize: number = 10): Promise<{
    logs: LogEntry[];
    hasMore: boolean;
    total: number;
  }> {
    try {
      console.log(`📊 Loading logs page ${page}, size ${pageSize}...`);
      const startTime = Date.now();
      
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];
      
      const loadTime = Date.now() - startTime;
      console.log(`✅ Loaded ${logs.length} logs in ${loadTime}ms`);
      
      return {
        logs,
        hasMore: logs.length === pageSize,
        total: logs.length
      };
    } catch (error) {
      console.error('❌ Failed to get paginated logs:', error);
      return { logs: [], hasMore: false, total: 0 };
    }
  }

  /**
   * ดึง logs ตาม user
   */
  static async getUserLogs(userId: string, limitCount: number = 50): Promise<LogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];
    } catch (error) {
      console.error('❌ Failed to get user logs:', error);
      return [];
    }
  }

  /**
   * ดึง logs ตาม severity
   */
  static async getLogsBySeverity(
    severity: 'info' | 'warning' | 'error' | 'success',
    limitCount: number = 50
  ): Promise<LogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('severity', '==', severity),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];
    } catch (error) {
      console.error('❌ Failed to get logs by severity:', error);
      return [];
    }
  }

  /**
   * ดึง logs ตาม resource
   */
  static async getResourceLogs(resource: string, limitCount: number = 50): Promise<LogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('resource', '==', resource),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];
    } catch (error) {
      console.error('❌ Failed to get resource logs:', error);
      return [];
    }
  }

  /**
   * ดึง IP address ของ client
   */
  private static getClientIP(): string {
    // This is a simplified version - in production you might want to get real IP
    return '127.0.0.1';
  }

  /**
   * Log การเข้าสู่ระบบ
   */
  static async logLogin(userId: string, userName: string, userRole: string): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      'LOGIN',
      'เข้าสู่ระบบ',
      'AUTH',
      { severity: 'success' }
    );
  }

  /**
   * Log การออกจากระบบ
   */
  static async logLogout(userId: string, userName: string, userRole: string): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      'LOGOUT',
      'ออกจากระบบ',
      'AUTH',
      { severity: 'info' }
    );
  }

  /**
   * Log การสร้างข้อมูล
   */
  static async logCreate(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      'CREATE',
      description,
      resource,
      { resourceId, severity: 'success' }
    );
  }

  /**
   * Log การอัปเดตข้อมูล
   */
  static async logUpdate(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      'UPDATE',
      description,
      resource,
      { resourceId, severity: 'info' }
    );
  }

  /**
   * Log การลบข้อมูล
   */
  static async logDelete(
    userId: string,
    userName: string,
    userRole: string,
    resource: string,
    resourceId: string,
    description: string
  ): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      'DELETE',
      description,
      resource,
      { resourceId, severity: 'warning' }
    );
  }

  /**
   * Log ข้อผิดพลาด
   */
  static async logError(
    userId: string,
    userName: string,
    userRole: string,
    action: string,
    description: string,
    resource: string,
    error?: any
  ): Promise<void> {
    await this.log(
      userId,
      userName,
      userRole,
      action,
      description,
      resource,
      { 
        severity: 'error',
        metadata: { error: error?.message || error }
      }
    );
  }
}
