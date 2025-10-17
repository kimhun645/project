import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs, 
  where, 
  Timestamp, 
  onSnapshot,
  startAfter,
  endBefore,
  QueryDocumentSnapshot,
  DocumentData,
  Unsubscribe
} from 'firebase/firestore';

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
  severity: 'info' | 'warning' | 'error' | 'success' | 'debug';
  metadata?: Record<string, any>;
  sessionId?: string;
  requestId?: string;
  duration?: number; // milliseconds
  tags?: string[];
}

export interface LogFilter {
  severity?: string[];
  action?: string[];
  resource?: string[];
  userId?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
}

export interface LogStats {
  total: number;
  bySeverity: Record<string, number>;
  byAction: Record<string, number>;
  byResource: Record<string, number>;
  byUser: Record<string, number>;
  recentActivity: LogEntry[];
}

export class AdvancedLogService {
  private static collectionName = 'system_logs';
  private static listeners: Map<string, Unsubscribe> = new Map();

  /**
   * บันทึก log แบบ advanced
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
      severity?: 'info' | 'warning' | 'error' | 'success' | 'debug';
      metadata?: Record<string, any>;
      sessionId?: string;
      requestId?: string;
      duration?: number;
      tags?: string[];
    } = {}
  ): Promise<string> {
    try {
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
        metadata: options.metadata || {},
        sessionId: options.sessionId || this.generateSessionId(),
        requestId: options.requestId || this.generateRequestId(),
        duration: options.duration,
        tags: options.tags || []
      };

      const docRef = await addDoc(collection(db, this.collectionName), {
        ...logEntry,
        timestamp: Timestamp.fromDate(new Date())
      });

      return docRef.id;
    } catch (error) {
      console.error('AdvancedLogService: Failed to save log:', error);
      throw error;
    }
  }

  /**
   * ดึง logs แบบ real-time
   */
  static subscribeToLogs(
    callback: (logs: LogEntry[]) => void,
    filter?: LogFilter,
    limitCount: number = 50
  ): Unsubscribe {
    let q = query(
      collection(db, this.collectionName),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    // Apply filters
    if (filter?.severity && filter.severity.length > 0) {
      q = query(q, where('severity', 'in', filter.severity));
    }

    if (filter?.action && filter.action.length > 0) {
      q = query(q, where('action', 'in', filter.action));
    }

    if (filter?.resource && filter.resource.length > 0) {
      q = query(q, where('resource', 'in', filter.resource));
    }

    if (filter?.userId && filter.userId.length > 0) {
      q = query(q, where('userId', 'in', filter.userId));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];

      // Apply client-side filters
      let filteredLogs = logs;

      if (filter?.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.description.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          log.userName.toLowerCase().includes(searchTerm)
        );
      }

      if (filter?.dateRange) {
        filteredLogs = filteredLogs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate >= filter.dateRange!.start && logDate <= filter.dateRange!.end;
        });
      }

      callback(filteredLogs);
    });

    return unsubscribe;
  }

  /**
   * ดึง logs แบบ pagination
   */
  static async getLogsPaginated(
    page: number = 1,
    pageSize: number = 20,
    filter?: LogFilter,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<{
    logs: LogEntry[];
    hasMore: boolean;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
    total: number;
  }> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(pageSize)
      );

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      // Apply filters
      if (filter?.severity && filter.severity.length > 0) {
        q = query(q, where('severity', 'in', filter.severity));
      }

      if (filter?.action && filter.action.length > 0) {
        q = query(q, where('action', 'in', filter.action));
      }

      if (filter?.resource && filter.resource.length > 0) {
        q = query(q, where('resource', 'in', filter.resource));
      }

      if (filter?.userId && filter.userId.length > 0) {
        q = query(q, where('userId', 'in', filter.userId));
      }

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];

      return {
        logs,
        hasMore: logs.length === pageSize,
        lastDoc: snapshot.docs[snapshot.docs.length - 1],
        total: logs.length
      };
    } catch (error) {
      console.error('AdvancedLogService: Failed to get logs:', error);
      return { logs: [], hasMore: false, total: 0 };
    }
  }

  /**
   * ดึงสถิติ logs
   */
  static async getLogStats(filter?: LogFilter): Promise<LogStats> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(1000) // Get last 1000 logs for stats
      );

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || doc.data().timestamp
      })) as LogEntry[];

      // Apply filters
      let filteredLogs = logs;
      if (filter?.search) {
        const searchTerm = filter.search.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.description.toLowerCase().includes(searchTerm) ||
          log.action.toLowerCase().includes(searchTerm) ||
          log.resource.toLowerCase().includes(searchTerm) ||
          log.userName.toLowerCase().includes(searchTerm)
        );
      }

      // Calculate stats
      const stats: LogStats = {
        total: filteredLogs.length,
        bySeverity: {},
        byAction: {},
        byResource: {},
        byUser: {},
        recentActivity: filteredLogs.slice(0, 10)
      };

      filteredLogs.forEach(log => {
        // By severity
        stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
        
        // By action
        stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
        
        // By resource
        stats.byResource[log.resource] = (stats.byResource[log.resource] || 0) + 1;
        
        // By user
        stats.byUser[log.userName] = (stats.byUser[log.userName] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('AdvancedLogService: Failed to get stats:', error);
      return {
        total: 0,
        bySeverity: {},
        byAction: {},
        byResource: {},
        byUser: {},
        recentActivity: []
      };
    }
  }

  /**
   * Export logs to CSV
   */
  static async exportLogs(filter?: LogFilter): Promise<string> {
    try {
      const { logs } = await this.getLogsPaginated(1, 10000, filter);
      
      const csvHeaders = [
        'Timestamp',
        'User',
        'Action',
        'Description',
        'Resource',
        'Severity',
        'IP Address',
        'User Agent'
      ];

      const csvRows = logs.map(log => [
        log.timestamp,
        log.userName,
        log.action,
        log.description,
        log.resource,
        log.severity,
        log.ipAddress || '',
        log.userAgent || ''
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      return csvContent;
    } catch (error) {
      console.error('AdvancedLogService: Failed to export logs:', error);
      throw error;
    }
  }

  /**
   * Clear old logs (older than specified days)
   */
  static async clearOldLogs(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );

      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => 
        doc.ref.delete()
      );

      await Promise.all(deletePromises);
      return snapshot.docs.length;
    } catch (error) {
      console.error('AdvancedLogService: Failed to clear old logs:', error);
      throw error;
    }
  }

  /**
   * Generate session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate request ID
   */
  private static generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP (placeholder)
   */
  private static getClientIP(): string {
    return 'N/A';
  }

  /**
   * Cleanup listeners
   */
  static cleanup(): void {
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
  }
}
