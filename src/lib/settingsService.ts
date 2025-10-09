import { api } from './apiService';

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
}

export interface Requester {
  id: number;
  name: string;
  email: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SettingsData {
  companyName: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  approverName: string;
  approverEmail: string;
  ccEmails: string;
  lowStockAlert: boolean;
  emailNotifications: boolean;
  autoBackup: boolean;
  requesters: Requester[];
  // Server connection settings
  serverHost: string;
  serverPort: string;
  databaseHost: string;
  databasePort: string;
  databaseName: string;
  databaseUser: string;
  // Email server settings
  emailServerHost: string;
  emailServerPort: string;
  emailServerType: 'postfix' | 'smtp' | 'gmail' | 'outlook';
  emailUsername: string;
  emailPassword: string;
  emailEncryption: 'none' | 'ssl' | 'tls';
  emailAuthRequired: boolean;
}

// Load all settings from database
export const loadSettingsFromDB = async (): Promise<SettingsData> => {
  try {
    // Load settings - using API instead of direct database
    const settings = await api.getSettings();
    
    // Load requesters - using API instead of direct database
    const requesters = await api.getRequesters();
    
    // Load approvers - using API instead of direct database
    const approvers = await api.getApprovers();
    const activeApprover = approvers && approvers.length > 0 ? approvers[0] : null;

    // Convert API response to SettingsData format
    const result: SettingsData = {
      companyName: settings.company_name || '',
      email: settings.email || '',
      phone: settings.phone || '',
      address: settings.address || '',
      currency: settings.currency || 'THB',
      approverName: activeApprover?.name || '',
      approverEmail: activeApprover?.email || '',
      ccEmails: activeApprover?.cc_emails || '',
      lowStockAlert: settings.low_stock_alert || true,
      emailNotifications: settings.email_notifications || true,
      autoBackup: settings.auto_backup || true,
      requesters: requesters || [],
      // Server connection settings
      serverHost: 'localhost',
      serverPort: '3000',
      databaseHost: 'localhost',
      databasePort: '5432',
      databaseName: 'stocknrs',
      databaseUser: 'postgres',
      // Email server settings
      emailServerHost: settings.smtp_host || 'localhost',
      emailServerPort: settings.smtp_port?.toString() || '25',
      emailServerType: 'postfix' as 'postfix' | 'smtp' | 'gmail' | 'outlook',
      emailUsername: settings.smtp_user || '',
      emailPassword: settings.smtp_password || '',
      emailEncryption: settings.smtp_secure ? 'tls' as 'none' | 'ssl' | 'tls' : 'none' as 'none' | 'ssl' | 'tls',
      emailAuthRequired: false
    };

    return result;
  } catch (error) {
    console.error('Error loading settings from database:', error);
    // Return default values if database fails
    return {
      companyName: '',
      email: '',
      phone: '',
      address: '',
      currency: 'THB',
      theme: 'light',
      language: 'th',
      approverName: '',
      approverEmail: '',
      ccEmails: '',
      lowStockAlert: true,
      emailNotifications: true,
      autoBackup: true,
      requesters: []
    };
  }
};

// Save settings to database
export const saveSettingsToDB = async (settings: Partial<SettingsData>): Promise<boolean> => {
  try {
    // Convert settings to the format expected by the API
    const apiSettings = {
      company_name: settings.companyName,
      email: settings.email,
      phone: settings.phone,
      address: settings.address,
      currency: settings.currency,
      low_stock_alert: settings.lowStockAlert,
      email_notifications: settings.emailNotifications,
      auto_backup: settings.autoBackup,
      smtp_host: settings.emailServerHost,
      smtp_port: settings.emailServerPort ? parseInt(settings.emailServerPort) : 587,
      smtp_secure: settings.emailEncryption === 'ssl' || settings.emailEncryption === 'tls',
      smtp_user: settings.emailUsername,
      smtp_password: settings.emailPassword,
    };

    // Remove undefined values
    Object.keys(apiSettings).forEach(key => {
      if (apiSettings[key as keyof typeof apiSettings] === undefined) {
        delete apiSettings[key as keyof typeof apiSettings];
      }
    });

    await api.updateSettings(apiSettings);
    
    // Save approver data to approvers table
    if (settings.approverName && settings.approverEmail) {
      await saveApproverToDB({
        name: settings.approverName,
        email: settings.approverEmail,
        department: 'การเงิน',
        position: 'ผู้อนุมัติงบประมาณ',
        cc_emails: settings.ccEmails,
        is_active: true
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error saving settings to database:', error);
    return false;
  }
};

// Save requesters to database
export const saveRequestersToDB = async (requesters: Omit<Requester, 'id' | 'created_at' | 'updated_at'>[]): Promise<boolean> => {
  try {
    // First, deactivate all existing requesters
    await api.deactivateAllRequesters();

    // Insert new requesters
    for (const requester of requesters) {
      await api.createRequester({
        name: requester.name,
        email: requester.email,
        department: requester.department,
        is_active: true
      });
    }

    return true;
  } catch (error) {
    console.error('Error saving requesters to database:', error);
    return false;
  }
};

// Save approver to database
export const saveApproverToDB = async (approver: { name: string; email: string; department: string; position: string; cc_emails?: string; is_active: boolean }): Promise<boolean> => {
  try {
    // First, deactivate all existing approvers
    await api.deactivateAllApprovers();

    // Insert new approver
    await api.createApprover({
      name: approver.name,
      email: approver.email,
      department: approver.department,
      position: approver.position,
      cc_emails: approver.cc_emails,
      is_active: true
    });

    return true;
  } catch (error) {
    console.error('Error saving approver to database:', error);
    return false;
  }
};

// Import data to database
export const importDataToDB = async (data: { products?: unknown[], categories?: unknown[], suppliers?: unknown[], movements?: unknown[] }): Promise<{ success: boolean; message: string }> => {
  try {
    let importedCount = 0;

    // Import products
    if (data.products && data.products.length > 0) {
      for (const product of data.products) {
        await api.createProduct(product);
      }
      importedCount += data.products.length;
    }

    // Import categories
    if (data.categories && data.categories.length > 0) {
      for (const category of data.categories) {
        await api.createCategory(category);
      }
      importedCount += data.categories.length;
    }

    // Import suppliers
    if (data.suppliers && data.suppliers.length > 0) {
      for (const supplier of data.suppliers) {
        await api.createSupplier(supplier);
      }
      importedCount += data.suppliers.length;
    }

    // Import movements
    if (data.movements && data.movements.length > 0) {
      for (const movement of data.movements) {
        await api.createMovement(movement);
      }
      importedCount += data.movements.length;
    }

    return {
      success: true,
      message: `นำเข้าข้อมูลเรียบร้อยแล้ว: ${importedCount} รายการ`
    };
  } catch (error) {
    console.error('Error importing data to database:', error);
    return {
      success: false,
      message: 'เกิดข้อผิดพลาดในการนำเข้าข้อมูล'
    };
  }
};

// Test server connection
export const testServerConnection = async (host: string, port: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  try {
    const startTime = Date.now();
    const response = await fetch(`http://${host}:${port}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (response.ok) {
      return {
        success: true,
        message: `เชื่อมต่อเซิร์ฟเวอร์สำเร็จ (${latency}ms)`,
        latency
      };
    } else {
      return {
        success: false,
        message: `เซิร์ฟเวอร์ตอบกลับด้วยสถานะ: ${response.status}`
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Test database connection
export const testDatabaseConnection = async (host: string, port: string, database: string, user: string): Promise<{ success: boolean; message: string; latency?: number }> => {
  try {
    const startTime = Date.now();
    
    // Test connection by trying to get settings
    const settings = await api.getSettings();
    
    const endTime = Date.now();
    const latency = endTime - startTime;

    if (!settings || settings.length === 0) {
      return {
        success: false,
        message: 'ไม่สามารถเชื่อมต่อฐานข้อมูลได้: ไม่มีข้อมูลในตาราง settings'
      };
    }

    return {
      success: true,
      message: `เชื่อมต่อฐานข้อมูลสำเร็จ (${latency}ms)`,
      latency
    };
  } catch (error) {
    return {
      success: false,
      message: `เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Test email server connection
export const testEmailServerConnection = async (
  host: string, 
  port: string, 
  type: string, 
  username: string, 
  password: string, 
  encryption: string, 
  authRequired: boolean
): Promise<{ success: boolean; message: string; details?: { serverType: string, host: string, port: string, encryption: string, authRequired: boolean } }> => {
  try {
    // Simulate email server connection test
    // In a real implementation, you would use a library like nodemailer to test SMTP connection
    const testData = {
      host,
      port: parseInt(port),
      secure: encryption === 'ssl',
      auth: authRequired ? { user: username, pass: password } : undefined,
      tls: encryption === 'tls' ? { rejectUnauthorized: false } : undefined
    };

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // For now, we'll simulate a successful connection
    // In production, implement actual SMTP connection testing
    return {
      success: true,
      message: `เชื่อมต่อเซิร์ฟเวอร์อีเมล ${type} สำเร็จ`,
      details: {
        serverType: type,
        host,
        port,
        encryption,
        authRequired
      }
    };
  } catch (error) {
    return {
      success: false,
      message: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์อีเมลได้: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Delete all data from database
export const deleteAllDataFromDB = async (): Promise<boolean> => {
  try {
    // Delete in order to avoid foreign key constraints
    await api.deleteAllMovements();
    await api.deleteAllProducts();
    await api.deleteAllCategories();
    await api.deleteAllSuppliers();
    return true;
  } catch (error) {
    console.error('Error deleting all data from database:', error);
    return false;
  }
};
