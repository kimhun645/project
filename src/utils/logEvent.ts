import { db, auth } from '../firebase/config';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export type LogType = "AUTH" | "USER" | "SYSTEM" | "INVENTORY" | "DEBUG" | "SECURITY" | "PERFORMANCE";
export type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "SUCCESS";

export interface LogEntry {
  type: LogType;
  action: string;
  message: string;
  data?: Record<string, any>;
  level?: LogLevel;
  userId?: string;
  userName?: string;
  userRole?: string;
  resource?: string;
  resourceId?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  requestId?: string;
  duration?: number;
  tags?: string[];
}

export const logEvent = async (
  type: LogType,
  action: string,
  message: string,
  data?: Record<string, any>,
  level: LogLevel = "INFO",
  options?: {
    resource?: string;
    resourceId?: string;
    duration?: number;
    tags?: string[];
  }
) => {
  try {
    const user = auth.currentUser;
    const sessionId = sessionStorage.getItem('sessionId') || generateSessionId();
    if (!sessionStorage.getItem('sessionId')) {
      sessionStorage.setItem('sessionId', sessionId);
    }

    const logData: LogEntry = {
      type,
      action,
      message,
      data: data || null,
      level,
      userId: user ? user.uid : "anonymous",
      userName: user ? user.displayName || user.email || "Unknown" : "Anonymous",
      userRole: user ? (user as any).role || "user" : "anonymous",
      resource: options?.resource || "System",
      resourceId: options?.resourceId,
      ipAddress: getClientIP(),
      userAgent: navigator.userAgent,
      sessionId,
      requestId: generateRequestId(),
      duration: options?.duration,
      tags: options?.tags || []
    };

    const docRef = await addDoc(collection(db, "logs"), {
      ...logData,
      timestamp: serverTimestamp(),
    });
    
    if (!docRef.id) {
      throw new Error('Failed to create log document');
    }
    
    return docRef.id;
  } catch (err) {
    console.error("Failed to write log:", err);
    throw err;
  }
};

// Helper functions
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const getClientIP = (): string => {
  // This is a placeholder. In a real application, you'd get the IP from the server.
  return 'N/A';
};

// Convenience functions for common log types
export const logAuth = (action: string, message: string, data?: Record<string, any>) => {
  return logEvent("AUTH", action, message, data, "INFO", { resource: "Authentication" });
};

export const logUser = (action: string, message: string, data?: Record<string, any>) => {
  return logEvent("USER", action, message, data, "INFO", { resource: "User Management" });
};

export const logSystem = (action: string, message: string, data?: Record<string, any>, level: LogLevel = "INFO") => {
  return logEvent("SYSTEM", action, message, data, level, { resource: "System" });
};

export const logInventory = (action: string, message: string, data?: Record<string, any>) => {
  return logEvent("INVENTORY", action, message, data, "INFO", { resource: "Inventory" });
};

export const logSecurity = (action: string, message: string, data?: Record<string, any>, level: LogLevel = "WARN") => {
  return logEvent("SECURITY", action, message, data, level, { resource: "Security" });
};

export const logPerformance = (action: string, message: string, duration: number, data?: Record<string, any>) => {
  return logEvent("PERFORMANCE", action, message, data, "INFO", { 
    resource: "Performance", 
    duration,
    tags: ["performance", "timing"]
  });
};

export const logError = (action: string, message: string, error: Error, data?: Record<string, any>) => {
  return logEvent("SYSTEM", action, message, { 
    ...data, 
    error: error.message, 
    stack: error.stack 
  }, "ERROR", { 
    resource: "Error Handling",
    tags: ["error", "exception"]
  });
};
