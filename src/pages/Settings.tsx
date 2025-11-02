import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LogCard from '@/components/LogCard';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { 
  User, 
  Bell, 
  Shield, 
  Palette, 
  Upload, 
  Download, 
  Trash2, 
  Settings as SettingsIcon, 
  Package, 
  Key, 
  CreditCard, 
  FileEdit as Edit, 
  Trash, 
  CheckCircle, 
  AlertTriangle, 
  RefreshCw, 
  Mail, 
  Globe, 
  Lock, 
  Users, 
  FileText, 
  BarChart3, 
  Crown, 
  UserCheck, 
  UserX, 
  LogOut, 
  Search, 
  Filter, 
  Grid3x3 as Grid3X3, 
  List,
  Database,
  Archive,
  FileDown,
  FileUp,
  HardDrive,
  Activity,
  Eye,
  EyeOff
} from 'lucide-react';
import { Layout } from '@/components/Layout/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { FirestoreService } from '@/lib/firestoreService';
import { UserManagement } from '@/components/UserManagement';
import { RoleManagement } from '@/components/RoleManagement';
import { AccountManagement } from '@/components/AccountManagement';

// Schema สำหรับการตั้งค่า - เฉพาะฟิลด์ที่มีในฟอร์ม
const settingsSchema = z.object({
  // ข้อมูลบริษัท
  companyName: z.string().min(1, 'ชื่อบริษัทจำเป็นต้องระบุ'),
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง'),
  phone: z.string().min(1, 'เบอร์โทรศัพท์จำเป็นต้องระบุ'),
  address: z.string().min(1, 'ที่อยู่จำเป็นต้องระบุ'),
  currency: z.enum(['THB', 'USD', 'EUR']),
  
  // การตั้งค่าการแจ้งเตือน
  lowStockAlert: z.boolean(),
  emailNotifications: z.boolean(),
  autoBackup: z.boolean(),
  
  // การตั้งค่าผู้อนุมัติ - ทำให้เป็น optional
  approverName: z.string().optional(),
  approverEmail: z.string().email('รูปแบบอีเมลผู้อนุมัติไม่ถูกต้อง').optional().or(z.literal('')),
  ccEmails: z.string().optional(),

  // ฟิลด์ที่ไม่มีในฟอร์ม - ทำให้เป็น optional
  sessionTimeout: z.number().optional(),
  maxLoginAttempts: z.number().optional(),
  requireTwoFactor: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  primaryColor: z.string().optional(),
  fontSize: z.enum(['small', 'medium', 'large']).optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const { toast } = useToast();
  const { currentUser, isLoading, signOut, hasPermission } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [logViewerLogs, setLogViewerLogs] = useState<any[]>([]);
  const [logViewerFilter, setLogViewerFilter] = useState<string>("ALL");
  const [logViewerLevelFilter, setLogViewerLevelFilter] = useState<string>("ALL");
  const [logViewerSearchTerm, setLogViewerSearchTerm] = useState<string>("");
  const [logViewerAutoRefresh, setLogViewerAutoRefresh] = useState(true);
  const [logViewerExpandedLogs, setLogViewerExpandedLogs] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [statsData, setStatsData] = useState({
    totalUsers: 0,
    totalRoles: 3, // Fixed roles: staff, manager, admin
    totalAccountCodes: 0,
    totalSettings: 8 // Fixed settings categories
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [hasMoreLogs, setHasMoreLogs] = useState(true);

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      currency: 'THB',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      approverName: '',
      approverEmail: '',
      ccEmails: '',
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      requireTwoFactor: false,
      theme: 'light',
      primaryColor: '#3b82f6',
      fontSize: 'medium',
    },
  });

  useEffect(() => {
    loadSettings();
    loadStatsData();
    if (activeTab === 'log-viewer') {
      loadLogViewerLogs();
    }
  }, [activeTab]);

  // Listen for log refresh events from login/logout
  useEffect(() => {
    const handleLogRefresh = () => {
      if (activeTab === 'log-viewer') {
        loadLogViewerLogs();
      }
    };

    window.addEventListener('logRefresh', handleLogRefresh);
    return () => window.removeEventListener('logRefresh', handleLogRefresh);
  }, [activeTab]);



  const loadLogViewerLogs = async () => {
    try {
      let q = query(
        collection(db, "logs"), 
        orderBy("timestamp", "desc"),
        limit(100)
      );

      // Apply filters - use logs collection fields directly
      if (logViewerFilter !== "ALL") {
        q = query(q, where("type", "==", logViewerFilter));
      }

      if (logViewerLevelFilter !== "ALL") {
        q = query(q, where("level", "==", logViewerLevelFilter));
      }

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map((doc) => {
          const logData = doc.data();
          // Use logs collection structure directly
          return {
            id: doc.id,
            type: logData['type'],
            action: logData['action'],
            message: logData['message'],
            level: logData['level'],
            data: logData['data'],
            userId: logData['userId'],
            userName: logData['userName'],
            userRole: logData['userRole'],
            resource: logData['resource'],
            resourceId: logData['resourceId'],
            ipAddress: logData['ipAddress'],
            userAgent: logData['userAgent'],
            sessionId: logData['sessionId'],
            requestId: logData['requestId'],
            duration: logData['duration'],
            tags: logData['tags'] || [],
            timestamp: logData['timestamp']
          };
        });
        setLogViewerLogs(data);
      }, (error) => {
        console.error("Error fetching log viewer logs:", error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลด logs ได้",
          variant: "destructive",
        });
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error loading log viewer logs:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถโหลด logs ได้",
        variant: "destructive",
      });
      return undefined;
    }
  };

  const handleLogViewerExpandLog = (log: any) => {
    const newExpanded = new Set(logViewerExpandedLogs);
    if (newExpanded.has(log.id)) {
      newExpanded.delete(log.id);
    } else {
      newExpanded.add(log.id);
    }
    setLogViewerExpandedLogs(newExpanded);
  };


  // Create logs collection and sample data
  const createLogsCollection = async () => {
    try {
      setLoading(true);
      
      // Test Firebase connection first
      const { db } = await import('@/lib/firebase');
      const { collection, addDoc, getDocs, query, limit } = await import('firebase/firestore');
      
      // Test write to logs collection
      const testDoc = await addDoc(collection(db, 'logs'), {
        type: 'SYSTEM',
        action: 'CONNECTION_TEST',
        message: 'Testing Firebase connection',
        level: 'INFO',
        userId: 'test',
        userName: 'Test User',
        userRole: 'admin',
        resource: 'System',
        timestamp: new Date().toISOString(),
        data: { test: true }
      });
      
      // Test read from logs collection
      const q = query(collection(db, 'logs'), limit(1));
      const snapshot = await getDocs(q);
      
      const { logEvent, logAuth, logUser, logSystem, logInventory, logSecurity, logPerformance } = await import('@/utils/logEvent');
      
      const results = await Promise.allSettled([
        // Authentication logs
        logAuth("LOGIN", "User logged in successfully", { method: "email" }),
        logAuth("LOGOUT", "User logged out", { sessionDuration: "2h 30m" }),
        logAuth("PASSWORD_RESET", "Password reset requested", { email: "user@example.com" }),
        
        // User Management logs
        logUser("CREATE_USER", "New user account created", { userId: "user123", role: "manager" }),
        logUser("UPDATE_USER", "User profile updated", { userId: "user123", changes: ["email", "role"] }),
        logUser("DELETE_USER", "User account deleted", { userId: "user456", reason: "inactive" }),
        
        // System logs
        logSystem("SYSTEM_INIT", "System initialization completed", { version: "1.0.0" }),
        logSystem("BACKUP_COMPLETE", "System backup completed", { size: "2.5GB", duration: "15m" }),
        logSystem("CONNECTION_ERROR", "Database connection failed", { error: "timeout", retryCount: 3 }),
        
        // Inventory logs
        logInventory("ADD_PRODUCT", "Product added to inventory", { productId: "prod001", quantity: 100 }),
        logInventory("UPDATE_STOCK", "Stock level updated", { productId: "prod002", oldStock: 50, newStock: 75 }),
        logInventory("STOCK_LOW", "Product stock is running low", { productId: "prod003", currentStock: 5 }),
        
        // Security logs
        logSecurity("PERMISSION_CHECK", "Permission validation completed", { resource: "dashboard", access: "granted" }),
        logSecurity("LOGIN_ATTEMPT", "Failed login attempt detected", { ip: "192.168.1.100", attempts: 3 }),
        logSecurity("ACCESS_DENIED", "Access denied to restricted resource", { user: "guest", resource: "admin_panel" }),
        
        // Performance logs
        logPerformance("PAGE_LOAD", "Dashboard page loaded", 1200, { page: "dashboard" }),
        logPerformance("API_RESPONSE", "API response time", 450, { endpoint: "/api/products", method: "GET" }),
        logPerformance("DATABASE_QUERY", "Database query executed", 89, { query: "SELECT * FROM products" }),
        
        // Debug logs
        logEvent("DEBUG", "DEBUG_TEST", "Debug logging test", { testData: "sample", timestamp: new Date().toISOString() }, "DEBUG"),
        logEvent("DEBUG", "CACHE_HIT", "Cache hit for user data", { cacheKey: "user_123", hitRate: "85%" }, "DEBUG"),
        logEvent("DEBUG", "VALIDATION_PASSED", "Data validation completed", { fields: ["email", "password"], status: "valid" }, "DEBUG")
      ]);
      
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failureCount = results.filter(r => r.status === 'rejected').length;
      
      toast({
        title: "สร้าง Logs Collection สำเร็จ",
        description: `สร้าง logs สำเร็จ ${successCount} รายการ, ล้มเหลว ${failureCount} รายการ`,
        variant: "default",
      });
      
      setTimeout(async () => {
        await loadLogViewerLogs();
      }, 2000);
      
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้าง logs collection ได้: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogViewerExport = async () => {
    try {
      const csvContent = [
        "Timestamp,Type,Action,Message,Level,User,Resource,Session ID",
        ...logViewerLogs.filter(log => {
          if (!logViewerSearchTerm) return true;
          const searchLower = logViewerSearchTerm.toLowerCase();
          return (
            log.message?.toLowerCase().includes(searchLower) ||
            log.action?.toLowerCase().includes(searchLower) ||
            log.userName?.toLowerCase().includes(searchLower) ||
            log.resource?.toLowerCase().includes(searchLower)
          );
        }).map(log => [
          log.timestamp?.toDate?.()?.toISOString() || "N/A",
          log.type || "N/A",
          log.action || "N/A",
          `"${(log.message || "").replace(/"/g, '""')}"`,
          log.level || "N/A",
          log.userName || log.userId || "Anonymous",
          log.resource || "N/A",
          log.sessionId || "N/A"
        ].join(","))
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "สำเร็จ",
        description: "ส่งออก logs เรียบร้อยแล้ว",
      });
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออก logs ได้",
        variant: "destructive",
      });
    }
  };

  const loadStatsData = async () => {
    setStatsLoading(true);
    try {
      // Load users count
      const users = await FirestoreService.getUsers();
      
      // Load account codes count
      const accountCodes = await FirestoreService.getAccountCodes();
      
      setStatsData(prev => ({
        ...prev,
        totalUsers: users?.length || 0,
        totalAccountCodes: accountCodes?.length || 0
      }));
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      
      // Load settings from Firestore
      const settings = await FirestoreService.getSettings();
      
      if (settings) {
        // Map Firestore data to form data
        const formData: SettingsFormData = {
          companyName: settings.company_name || '',
          email: settings.email || '',
          phone: settings.phone || '',
          address: settings.address || '',
          currency: (settings.currency as 'THB' | 'USD' | 'EUR') || 'THB',
          lowStockAlert: settings.low_stock_alert ?? true,
          emailNotifications: settings.email_notifications ?? true,
          autoBackup: settings.auto_backup ?? true,
          approverName: settings.approver_name || '',
          approverEmail: settings.approver_email || '',
          ccEmails: settings.cc_emails || '',
          sessionTimeout: settings.session_timeout || 30,
          maxLoginAttempts: settings.max_login_attempts || 5,
          requireTwoFactor: settings.require_two_factor ?? false,
          theme: (settings.theme as 'light' | 'dark' | 'system') || 'light',
          primaryColor: settings.primary_color || '#3b82f6',
          fontSize: (settings.font_size as 'small' | 'medium' | 'large') || 'medium',
        };
        
        form.reset(formData);
      } else {
        // Fallback to localStorage if no Firestore data
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          form.reset(settings);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      
      // Fallback to localStorage on error
      try {
        const savedSettings = localStorage.getItem('app-settings');
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          form.reset(settings);
        }
      } catch (localError) {
        console.error('Error loading from localStorage:', localError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (data: SettingsFormData) => {
    console.log('🔧 handleSaveSettings called with data:', data);
    
    try {
      setLoading(true);
      
      // Validate required fields
      if (!data.companyName || !data.email || !data.phone || !data.address) {
        toast({
          title: "ข้อมูลไม่ครบถ้วน",
          description: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน",
          variant: "destructive",
        });
        return;
      }
      
      console.log('💾 Saving to Firestore...');
      
      // Save to Firestore
      await FirestoreService.saveSettings({
        company_name: data.companyName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        currency: data.currency,
        low_stock_alert: data.lowStockAlert,
        email_notifications: data.emailNotifications,
        auto_backup: data.autoBackup,
        approver_name: data.approverName || '',
        approver_email: data.approverEmail || '',
        cc_emails: data.ccEmails || '',
        session_timeout: data.sessionTimeout,
        max_login_attempts: data.maxLoginAttempts,
        require_two_factor: data.requireTwoFactor,
        theme: data.theme,
        primary_color: data.primaryColor,
        font_size: data.fontSize,
      });
      
      console.log('✅ Firestore save successful');
      
      // Also save to localStorage as backup
      localStorage.setItem('app-settings', JSON.stringify(data));
      
      console.log('✅ localStorage backup successful');
      
      toast({
        title: "บันทึกสำเร็จ",
        description: "การตั้งค่าได้รับการบันทึกแล้ว",
      });
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกการตั้งค่าได้: " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      
      // Get all data from Firestore
      const [products, categories, suppliers, movements, receipts, withdrawals, users] = await Promise.all([
        FirestoreService.getProducts(),
        FirestoreService.getCategories(),
        FirestoreService.getSuppliers(),
        FirestoreService.getMovements(),
        FirestoreService.getReceipts(),
        FirestoreService.getWithdrawals(),
        FirestoreService.getUsers()
      ]);

      const backupData = {
        timestamp: new Date().toISOString(),
        version: "1.0.0",
        data: {
          products: products || [],
          categories: categories || [],
          suppliers: suppliers || [],
          movements: movements || [],
          receipts: receipts || [],
          withdrawals: withdrawals || [],
          users: users || []
        }
      };

      // Create and download file
      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "สำรองข้อมูลสำเร็จ",
        description: "ข้อมูลถูกส่งออกเป็นไฟล์ JSON แล้ว",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสำรองข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportBackup = async (file: File) => {
    try {
      setLoading(true);
      
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      if (!backupData.data) {
        throw new Error('รูปแบบไฟล์ไม่ถูกต้อง');
      }

      // Import data to Firestore
      const { data } = backupData;
      
      // Import products
      if (data.products && data.products.length > 0) {
        for (const product of data.products) {
          await FirestoreService.addProduct(product);
        }
      }
      
      // Import categories
      if (data.categories && data.categories.length > 0) {
        for (const category of data.categories) {
          await FirestoreService.addCategory(category);
        }
      }
      
      // Import suppliers
      if (data.suppliers && data.suppliers.length > 0) {
        for (const supplier of data.suppliers) {
          await FirestoreService.addSupplier(supplier);
        }
      }
      
      // Import movements
      if (data.movements && data.movements.length > 0) {
        for (const movement of data.movements) {
          await FirestoreService.addMovement(movement);
        }
      }
      
      // Import receipts
      if (data.receipts && data.receipts.length > 0) {
        for (const receipt of data.receipts) {
          await FirestoreService.addReceipt(receipt);
        }
      }
      
      // Import withdrawals
      if (data.withdrawals && data.withdrawals.length > 0) {
        for (const withdrawal of data.withdrawals) {
          await FirestoreService.addWithdrawal(withdrawal);
        }
      }

      toast({
        title: "นำเข้าข้อมูลสำเร็จ",
        description: "ข้อมูลถูกนำเข้าสู่ระบบเรียบร้อยแล้ว",
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำเข้าข้อมูลได้",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Stats cards data with real data
  const statsCards = [
    {
      title: "ผู้ใช้ทั้งหมด",
      value: statsLoading ? "..." : statsData.totalUsers.toString(),
      icon: <Users className="h-6 w-6" />,
      color: "blue",
      gradient: "from-blue-500 to-cyan-600",
      bgGradient: "from-blue-50 to-cyan-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      shadow: "shadow-blue-200",
    },
    {
      title: "บทบาทที่ใช้งาน",
      value: statsLoading ? "..." : statsData.totalRoles.toString(),
      icon: <Shield className="h-6 w-6" />,
      color: "green",
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-50 to-green-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      shadow: "shadow-emerald-200",
    },
    {
      title: "รหัสบัญชี",
      value: statsLoading ? "..." : statsData.totalAccountCodes.toString(),
      icon: <Key className="h-6 w-6" />,
      color: "purple",
      gradient: "from-purple-500 to-violet-600",
      bgGradient: "from-purple-50 to-violet-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      shadow: "shadow-purple-200",
    },
    {
      title: "การตั้งค่า",
      value: statsLoading ? "..." : statsData.totalSettings.toString(),
      icon: <SettingsIcon className="h-6 w-6" />,
      color: "orange",
      gradient: "from-orange-500 to-amber-600",
      bgGradient: "from-orange-50 to-amber-50",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      shadow: "shadow-orange-200",
    },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.href = '/login';
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!currentUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">ไม่พบข้อมูลผู้ใช้</h2>
          <p className="text-gray-600">กรุณาเข้าสู่ระบบใหม่</p>
            </div>
      </Layout>
    );
  }

  const canManageUsers = hasPermission('users:read');
  const canManageSettings = hasPermission('settings:read');
  
  // Debug permissions
  console.log('🔐 Permission check:', {
    canManageSettings,
    currentUser: currentUser?.email,
    userRole: currentUser?.role
  });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative overflow-hidden">
          {/* Enhanced Background decoration with more vibrant colors */}
          <div className="absolute inset-0 overflow-hidden">
            {/* Primary gradient orbs */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/40 to-cyan-600/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/40 to-pink-600/40 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-cyan-400/30 to-blue-600/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-br from-emerald-400/30 to-teal-600/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-400/30 to-amber-600/30 rounded-full blur-3xl animate-pulse" />
            
            {/* Additional colorful orbs */}
            <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-gradient-to-br from-rose-400/25 to-pink-500/25 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-2/3 right-1/3 w-48 h-48 bg-gradient-to-br from-violet-400/25 to-purple-500/25 rounded-full blur-2xl animate-pulse" />
            <div className="absolute bottom-1/3 right-1/2 w-48 h-48 bg-gradient-to-br from-teal-400/25 to-cyan-500/25 rounded-full blur-2xl animate-pulse" />
            <div className="absolute top-1/2 left-1/6 w-48 h-48 bg-gradient-to-br from-amber-400/25 to-yellow-500/25 rounded-full blur-2xl animate-pulse" />
            
            {/* Subtle floating particles */}
            <div className="absolute top-1/6 left-1/6 w-32 h-32 bg-gradient-to-br from-indigo-300/20 to-blue-400/20 rounded-full blur-xl animate-bounce" />
            <div className="absolute top-3/4 right-1/6 w-32 h-32 bg-gradient-to-br from-pink-300/20 to-rose-400/20 rounded-full blur-xl animate-bounce" />
            <div className="absolute bottom-1/6 right-1/3 w-32 h-32 bg-gradient-to-br from-green-300/20 to-emerald-400/20 rounded-full blur-xl animate-bounce" />
          </div>

          <div className="relative z-10">
            {/* Modern Header with enhanced colors */}
            <div className="bg-gradient-to-r from-white/95 via-blue-50/90 to-indigo-50/95 backdrop-blur-xl border-b border-white/40 shadow-2xl">
              <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                      <SettingsIcon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">การตั้งค่าระบบ</h1>
                      <p className="text-gray-600 mt-1">จัดการการตั้งค่าและผู้ใช้ในระบบ</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Button 
                      onClick={() => {
          setSearchTerm('');
          loadStatsData();
          toast({ title: "รีเฟรชการตั้งค่า", description: "โหลดข้อมูลใหม่เรียบร้อยแล้ว" });
        }}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 backdrop-blur-sm border-blue-200/50 hover:from-blue-100 hover:to-cyan-100 hover:border-blue-300/50 shadow-lg hover:shadow-xl transition-all duration-300 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
                      <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
                      รีเฟรช
                    </Button>
                    <Button 
                      onClick={handleSignOut} 
                      className="bg-gradient-to-r from-red-50 to-pink-50 backdrop-blur-sm border-red-200/50 hover:from-red-100 hover:to-pink-100 hover:border-red-300/50 shadow-lg hover:shadow-xl transition-all duration-300 text-red-600 border border-input bg-background hover:bg-accent hover:text-accent-foreground"
                    >
            <LogOut className="h-4 w-4 mr-2" />
            ออกจากระบบ
          </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
              {/* Enhanced Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((card, index) => (
                  <div
                    key={index}
                    className={`group relative overflow-hidden bg-gradient-to-br ${card.bgGradient} backdrop-blur-sm rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:scale-105 border border-white/30`}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}></div>
                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${card.gradient} opacity-20 rounded-full -translate-y-16 translate-x-16 group-hover:scale-110 transition-transform duration-500`}></div>
                    <div className="relative p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`p-4 rounded-2xl ${card.iconBg} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                          <div className={`${card.iconColor} group-hover:scale-110 transition-transform duration-300`}>
                            {card.icon}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-2xl font-bold bg-gradient-to-r ${card.gradient} bg-clip-text text-transparent`}>{card.value}</p>
                          <p className="text-sm text-gray-600">{card.title}</p>
                        </div>
                      </div>
                      <div className="mt-4">
                        <div className={`h-1 w-full bg-gradient-to-r ${card.gradient} rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modern Tabs with enhanced colors */}
              <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="p-2">
                    <TabsList className="grid w-full grid-cols-7 bg-gradient-to-r from-gray-100/70 to-gray-200/70 rounded-2xl p-1 shadow-inner">
                      <TabsTrigger 
                        value="general" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-blue-50"
                      >
              <SettingsIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">ทั่วไป</span>
              </TabsTrigger>
                      <TabsTrigger 
                        value="notifications" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-emerald-50"
                      >
              <Bell className="h-4 w-4" />
                        <span className="hidden sm:inline">แจ้งเตือน</span>
              </TabsTrigger>
                      <TabsTrigger 
                        value="accounts" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-purple-50"
                      >
              <CreditCard className="h-4 w-4" />
                        <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
                      <TabsTrigger 
                        value="users" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-amber-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-orange-50"
                      >
              <Users className="h-4 w-4" />
                        <span className="hidden sm:inline">ผู้ใช้</span>
              </TabsTrigger>
                      <TabsTrigger 
                        value="roles" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-rose-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-pink-50"
                      >
              <Shield className="h-4 w-4" />
                        <span className="hidden sm:inline">บทบาท</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="backup" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-indigo-50"
                      >
                        <Database className="h-4 w-4" />
                        <span className="hidden sm:inline">สำรองข้อมูล</span>
                      </TabsTrigger>
                      <TabsTrigger 
                        value="log-viewer" 
                        className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-500 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 rounded-xl hover:bg-red-50"
                      >
                        <Activity className="h-4 w-4" />
                        <span className="hidden sm:inline">Log Viewer</span>
              </TabsTrigger>
            </TabsList>
                  </div>

                  {/* Tab Content */}
                  <div className="p-6">
          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            {canManageSettings ? (
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg">
              <Form {...form}>
                            <form onSubmit={(e) => {
                              console.log('📝 Form submit triggered');
                              e.preventDefault();
                              form.handleSubmit(handleSaveSettings)(e);
                            }} className="space-y-8">
                  {/* Company Information */}
                              <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                                <div className="relative">
                                  <CardHeader className="pb-4">
                                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                        <Package className="h-5 w-5" />
                  ข้อมูลบริษัท
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ชื่อบริษัท</FormLabel>
                        <FormControl>
                                              <Input {...field} className="bg-white/70 border-gray-200 focus:border-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>อีเมล</FormLabel>
                        <FormControl>
                                              <Input {...field} className="bg-white/70 border-gray-200 focus:border-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>เบอร์โทรศัพท์</FormLabel>
                        <FormControl>
                                              <Input {...field} className="bg-white/70 border-gray-200 focus:border-blue-500" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>สกุลเงิน</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                                                <SelectTrigger className="bg-white/70 border-gray-200 focus:border-blue-500">
                                    <SelectValue placeholder="เลือกสกุลเงิน" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                                  <SelectItem value="THB">บาท (THB)</SelectItem>
                                  <SelectItem value="USD">ดอลลาร์ (USD)</SelectItem>
                                  <SelectItem value="EUR">ยูโร (EUR)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ที่อยู่</FormLabel>
                      <FormControl>
                                            <Input {...field} className="bg-white/70 border-gray-200 focus:border-blue-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
                                </div>
            </Card>

                  {/* Form Errors Display */}
                  {Object.keys(form.formState.errors).length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="text-red-800 font-semibold mb-2">กรุณาแก้ไขข้อผิดพลาด:</h4>
                      <ul className="text-red-700 text-sm space-y-1">
                        {Object.entries(form.formState.errors).map(([field, error]) => (
                          <li key={field}>• {error?.message}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Save Button */}
                              <div className="flex justify-end pt-6">
                                <Button 
                                  type="submit" 
                                  disabled={loading}
                                  onClick={() => {
                                    console.log('🔘 Save button clicked');
                                    console.log('Form values:', form.getValues());
                                    console.log('Form errors:', form.formState.errors);
                                    console.log('Loading state:', loading);
                                  }}
                                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50"
                                >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่า'}
              </Button>
            </div>
                </form>
              </Form>
                        </div>
                      ) : (
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-8 text-center border border-white/30">
                          <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-gray-600 mb-2">ไม่มีสิทธิ์เข้าถึง</h3>
                  <p className="text-gray-500">คุณไม่มีสิทธิ์ในการจัดการการตั้งค่า</p>
                        </div>
            )}
          </TabsContent>

          {/* Notifications Settings */}
                    <TabsContent value="notifications">
                      <div className="space-y-6">
                        {/* Email Notifications */}
                        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative p-6">
                    <CardHeader>
                              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                                <Mail className="h-5 w-5 text-blue-600" />
                                การแจ้งเตือนทางอีเมล
                </CardTitle>
              </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-100 rounded-lg">
                                      <AlertTriangle className="h-4 w-4 text-red-600" />
                                    </div>
                      <div>
                                      <h4 className="font-semibold text-gray-900">แจ้งเตือนสต็อกต่ำ</h4>
                                      <p className="text-sm text-gray-600">แจ้งเตือนเมื่อสินค้าใกล้หมด</p>
                      </div>
                                  </div>
                                  <Switch 
                                    checked={form.watch('lowStockAlert')}
                                    onCheckedChange={(checked) => form.setValue('lowStockAlert', checked)}
                                  />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Bell className="h-4 w-4 text-blue-600" />
                                    </div>
                      <div>
                                      <h4 className="font-semibold text-gray-900">การแจ้งเตือนทั่วไป</h4>
                                      <p className="text-sm text-gray-600">รับการแจ้งเตือนจากระบบ</p>
                      </div>
                                  </div>
                                  <Switch 
                                    checked={form.watch('emailNotifications')}
                                    onCheckedChange={(checked) => form.setValue('emailNotifications', checked)}
                                  />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Database className="h-4 w-4 text-green-600" />
                                    </div>
                      <div>
                                      <h4 className="font-semibold text-gray-900">สำรองข้อมูลอัตโนมัติ</h4>
                                      <p className="text-sm text-gray-600">แจ้งเตือนเมื่อสำรองข้อมูล</p>
                      </div>
                                  </div>
                                  <Switch 
                                    checked={form.watch('autoBackup')}
                                    onCheckedChange={(checked) => form.setValue('autoBackup', checked)}
                                  />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <User className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">การเข้าสู่ระบบ</h4>
                                      <p className="text-sm text-gray-600">แจ้งเตือนการเข้าสู่ระบบใหม่</p>
                                    </div>
                                  </div>
                                  <Switch defaultChecked />
                                </div>
                              </div>
              </CardContent>
                          </div>
            </Card>

                        {/* Push Notifications */}
                        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative p-6">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                                <Bell className="h-5 w-5 text-green-600" />
                                การแจ้งเตือนแบบ Push
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                      <Package className="h-4 w-4 text-orange-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">การเคลื่อนไหวสินค้า</h4>
                                      <p className="text-sm text-gray-600">แจ้งเตือนการรับ/เบิกสินค้า</p>
                                    </div>
                                  </div>
                                  <Switch defaultChecked />
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                      <CheckCircle className="h-4 w-4 text-indigo-600" />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-gray-900">การอนุมัติ</h4>
                                      <p className="text-sm text-gray-600">แจ้งเตือนการอนุมัติงบประมาณ</p>
                                    </div>
                                  </div>
                                  <Switch defaultChecked />
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>

                        {/* Notification Settings */}
                        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative p-6">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-900">
                                <SettingsIcon className="h-5 w-5 text-purple-600" />
                                การตั้งค่าการแจ้งเตือน
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                  <Label htmlFor="notification-frequency">ความถี่ในการแจ้งเตือน</Label>
                                  <Select defaultValue="immediate">
                                    <SelectTrigger className="bg-white/70 border-gray-200">
                                      <SelectValue placeholder="เลือกความถี่" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="immediate">ทันที</SelectItem>
                                      <SelectItem value="hourly">ทุกชั่วโมง</SelectItem>
                                      <SelectItem value="daily">ทุกวัน</SelectItem>
                                      <SelectItem value="weekly">ทุกสัปดาห์</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="space-y-2">
                                  <Label htmlFor="quiet-hours">ช่วงเวลาปิดเสียง</Label>
                                  <Select defaultValue="22:00-06:00">
                                    <SelectTrigger className="bg-white/70 border-gray-200">
                                      <SelectValue placeholder="เลือกช่วงเวลา" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="22:00-06:00">22:00 - 06:00</SelectItem>
                                      <SelectItem value="23:00-07:00">23:00 - 07:00</SelectItem>
                                      <SelectItem value="00:00-08:00">00:00 - 08:00</SelectItem>
                                      <SelectItem value="none">ไม่ปิดเสียง</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              <div className="flex justify-end pt-4">
                                <Button 
                                  onClick={() => {
                                    toast({
                                      title: "บันทึกการตั้งค่า",
                                      description: "การตั้งค่าการแจ้งเตือนได้รับการบันทึกแล้ว",
                                    });
                                  }}
                                  className="bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-lg hover:shadow-xl transition-all duration-300"
                                >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      บันทึกการตั้งค่า
                        </Button>
                      </div>
              </CardContent>
                          </div>
            </Card>
                      </div>
          </TabsContent>

          <TabsContent value="accounts">
            <AccountManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="roles">
            <RoleManagement />
          </TabsContent>

                    <TabsContent value="backup">
                      <div className="space-y-6">
                        {/* Backup Actions */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Export Data */}
                          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative p-6">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <FileDown className="h-5 w-5 text-blue-600" />
                                  ส่งออกข้อมูล
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                  ส่งออกข้อมูลทั้งหมดในระบบเป็นไฟล์ JSON สำหรับการสำรองข้อมูล
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    สินค้า, หมวดหมู่, ผู้จำหน่าย
      </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    การเคลื่อนไหว, ใบรับ, ใบเบิก
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    ข้อมูลผู้ใช้และบทบาท
                                  </div>
                                </div>
                                <Button 
                                  onClick={handleExportData}
                                  disabled={loading}
                                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                                >
                                  {loading ? (
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                  ) : (
                                    <Download className="h-4 w-4 mr-2" />
                                  )}
                                  ส่งออกข้อมูล
                                </Button>
                              </CardContent>
                            </div>
                          </Card>

                          {/* Import Data */}
                          <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            <div className="relative p-6">
                              <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                  <FileUp className="h-5 w-5 text-green-600" />
                                  นำเข้าข้อมูล
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <p className="text-sm text-gray-600">
                                  นำเข้าข้อมูลจากไฟล์ JSON ที่ส่งออกไว้
                                </p>
                                <div className="space-y-2">
                                  <div className="flex items-center gap-2 text-sm text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    ข้อมูลเดิมจะไม่ถูกลบ
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-amber-500">
                                    <AlertTriangle className="h-4 w-4" />
                                    ข้อมูลซ้ำจะถูกเพิ่มใหม่
                                  </div>
                                </div>
                                <Input
                                  type="file"
                                  accept=".json"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleImportBackup(file);
                                    }
                                  }}
                                  className="w-full bg-white/70 border-gray-200"
                                />
                                <p className="text-xs text-gray-500">
                                  เลือกไฟล์ JSON ที่ส่งออกจากระบบ
                                </p>
                              </CardContent>
                            </div>
                          </Card>
                        </div>

                        {/* Backup Information */}
                        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-violet-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative p-6">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <Archive className="h-5 w-5 text-purple-600" />
                                ข้อมูลการสำรอง
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                                  <HardDrive className="h-8 w-8 text-blue-600" />
                                  <div>
                                    <p className="font-semibold text-blue-900">การสำรองอัตโนมัติ</p>
                                    <p className="text-sm text-blue-700">ทุกวันเวลา 02:00 น.</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                                  <Database className="h-8 w-8 text-green-600" />
                                  <div>
                                    <p className="font-semibold text-green-900">ข้อมูลที่สำรอง</p>
                                    <p className="text-sm text-green-700">7 หมวดหมู่ข้อมูล</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                                  <Shield className="h-8 w-8 text-purple-600" />
                                  <div>
                                    <p className="font-semibold text-purple-900">ความปลอดภัย</p>
                                    <p className="text-sm text-purple-700">เข้ารหัสและเก็บรักษา</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>

                        {/* Backup History */}
                        <Card className="group relative overflow-hidden bg-white/80 backdrop-blur-sm border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
                          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-amber-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                          <div className="relative p-6">
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-orange-600" />
                                ประวัติการสำรองข้อมูล
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <CheckCircle className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">สำรองข้อมูลล่าสุด</p>
                                      <p className="text-sm text-gray-600">
                                        {new Date().toLocaleDateString('th-TH', { 
                                          year: 'numeric', 
                                          month: '2-digit', 
                                          day: '2-digit' 
                                        })} {new Date().toLocaleTimeString('th-TH', { 
                                          hour: '2-digit', 
                                          minute: '2-digit' 
                                        })}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">2.5 MB</p>
                                    <p className="text-xs text-gray-500">1,250 รายการ</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                      <Database className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">สำรองข้อมูลอัตโนมัติ</p>
                                      <p className="text-sm text-gray-600">
                                        {(() => {
                                          const yesterday = new Date();
                                          yesterday.setDate(yesterday.getDate() - 1);
                                          return yesterday.toLocaleDateString('th-TH', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit' 
                                          }) + ' 02:00 น.';
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">2.3 MB</p>
                                    <p className="text-xs text-gray-500">1,200 รายการ</p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                      <Archive className="h-4 w-4 text-purple-600" />
                                    </div>
                                    <div>
                                      <p className="font-semibold text-gray-900">สำรองข้อมูลรายสัปดาห์</p>
                                      <p className="text-sm text-gray-600">
                                        {(() => {
                                          const lastWeek = new Date();
                                          lastWeek.setDate(lastWeek.getDate() - 7);
                                          return lastWeek.toLocaleDateString('th-TH', { 
                                            year: 'numeric', 
                                            month: '2-digit', 
                                            day: '2-digit' 
                                          }) + ' 02:00 น.';
                                        })()}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm font-medium text-gray-900">2.1 MB</p>
                                    <p className="text-xs text-gray-500">1,100 รายการ</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </div>
                    </TabsContent>


                    <TabsContent value="log-viewer">
                      <div className="space-y-6">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">Log Viewer</h3>
                            <p className="text-sm text-gray-600">ดู logs ระบบแบบ real-time</p>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              onClick={createLogsCollection} 
                              variant="outline"
                              className="h-9 rounded-md px-3"
                              disabled={loading}
                            >
                              <Database className="h-4 w-4 mr-2" />
                              {loading ? 'กำลังสร้าง...' : 'สร้าง Logs Collection'}
                            </Button>
                          </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Total Logs</p>
                                  <p className="text-2xl font-bold">{logViewerLogs.length}</p>
                              </div>
                                <Activity className="h-8 w-8 text-blue-500" />
                                          </div>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Errors</p>
                                  <p className="text-2xl font-bold text-red-500">
                                    {logViewerLogs.filter(log => log.level === "ERROR").length}
                                  </p>
                                          </div>
                                <AlertTriangle className="h-8 w-8 text-red-500" />
                                        </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Warnings</p>
                                  <p className="text-2xl font-bold text-yellow-500">
                                    {logViewerLogs.filter(log => log.level === "WARNING").length}
                                  </p>
                                      </div>
                                <AlertTriangle className="h-8 w-8 text-yellow-500" />
                                    </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm text-gray-600">Success</p>
                                  <p className="text-2xl font-bold text-green-500">
                                    {logViewerLogs.filter(log => log.level === "SUCCESS").length}
                                  </p>
                                      </div>
                                <CheckCircle className="h-8 w-8 text-green-500" />
                                    </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Controls */}
                        <Card>
                          <CardContent className="p-4">
                            <div className="flex flex-wrap gap-4 items-center">
                              {/* Search */}
                              <div className="flex-1 min-w-64">
                                <div className="relative">
                                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <Input
                                    placeholder="ค้นหา logs..."
                                    value={logViewerSearchTerm}
                                    onChange={(e) => setLogViewerSearchTerm(e.target.value)}
                                    className="pl-10"
                                  />
                                </div>
                              </div>

                              {/* Type Filter */}
                              <Select value={logViewerFilter} onValueChange={setLogViewerFilter}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="เลือกประเภท" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                  <SelectItem value="AUTH">Authentication</SelectItem>
                                  <SelectItem value="USER">User Management</SelectItem>
                                  <SelectItem value="SYSTEM">System</SelectItem>
                                  <SelectItem value="INVENTORY">Inventory</SelectItem>
                                  <SelectItem value="SECURITY">Security</SelectItem>
                                  <SelectItem value="PERFORMANCE">Performance</SelectItem>
                                  <SelectItem value="DEBUG">Debug</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Level Filter */}
                              <Select value={logViewerLevelFilter} onValueChange={setLogViewerLevelFilter}>
                                <SelectTrigger className="w-48">
                                  <SelectValue placeholder="เลือกระดับ" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="ALL">ทั้งหมด</SelectItem>
                                  <SelectItem value="INFO">Info</SelectItem>
                                  <SelectItem value="SUCCESS">Success</SelectItem>
                                  <SelectItem value="WARN">Warning</SelectItem>
                                  <SelectItem value="ERROR">Error</SelectItem>
                                  <SelectItem value="DEBUG">Debug</SelectItem>
                                </SelectContent>
                              </Select>

                              {/* Actions */}
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => setLogViewerAutoRefresh(!logViewerAutoRefresh)}
                                  className="flex items-center gap-2"
                                >
                                  {logViewerAutoRefresh ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  {logViewerAutoRefresh ? "หยุด" : "เริ่ม"} Auto Refresh
                                </Button>

                                <Button
                                  variant="outline"
                                  onClick={handleLogViewerExport}
                                  className="flex items-center gap-2"
                                >
                                  <Download className="h-4 w-4" />
                                  Export CSV
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Logs List */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                              <span>Logs ({logViewerLogs.filter(log => {
                                if (!logViewerSearchTerm) return true;
                                const searchLower = logViewerSearchTerm.toLowerCase();
                                return (
                                  log.message?.toLowerCase().includes(searchLower) ||
                                  log.action?.toLowerCase().includes(searchLower) ||
                                  log.userName?.toLowerCase().includes(searchLower) ||
                                  log.resource?.toLowerCase().includes(searchLower)
                                );
                              }).length} รายการ)</span>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {logViewerLogs.filter(log => {
                              if (!logViewerSearchTerm) return true;
                              const searchLower = logViewerSearchTerm.toLowerCase();
                              return (
                                log.message?.toLowerCase().includes(searchLower) ||
                                log.action?.toLowerCase().includes(searchLower) ||
                                log.userName?.toLowerCase().includes(searchLower) ||
                                log.resource?.toLowerCase().includes(searchLower)
                              );
                            }).length > 0 ? (
                              <div className="space-y-3">
                                {logViewerLogs.filter(log => {
                                  if (!logViewerSearchTerm) return true;
                                  const searchLower = logViewerSearchTerm.toLowerCase();
                                  return (
                                    log.message?.toLowerCase().includes(searchLower) ||
                                    log.action?.toLowerCase().includes(searchLower) ||
                                    log.userName?.toLowerCase().includes(searchLower) ||
                                    log.resource?.toLowerCase().includes(searchLower)
                                  );
                                }).map((log) => (
                                  <LogCard
                                    key={log.id}
                                    log={{
                                      ...log,
                                      expanded: logViewerExpandedLogs.has(log.id)
                                    }}
                                    onExpand={handleLogViewerExpandLog}
                                  />
                                ))}
                                  </div>
                            ) : (
                              <div className="text-center py-12">
                                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500 text-lg">ไม่พบ logs ที่ตรงกับการค้นหา</p>
                                <p className="text-gray-400 text-sm">ลองเปลี่ยนตัวกรองหรือคำค้นหา</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}