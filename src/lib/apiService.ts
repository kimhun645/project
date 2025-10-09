// Use production backend URL for all environments
const getApiBaseUrl = () => {
  return 'https://stock-scribe-backend-601202807478.asia-southeast1.run.app/api';
};

const API_BASE_URL = getApiBaseUrl();
console.log('🔗 API Base URL:', API_BASE_URL);

// Enhanced error handling and logging
const handleApiResponse = async (response: Response, endpoint: string) => {
  const contentType = response.headers.get('content-type');
  
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
    
    try {
      if (contentType && contentType.includes('application/json')) {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } else {
        const textError = await response.text();
        console.error(`API Error Response (${endpoint}):`, textError);
        errorMessage = `Server error: ${textError.substring(0, 200)}`;
      }
    } catch (parseError) {
      console.error(`Failed to parse error response from ${endpoint}:`, parseError);
    }
    
    console.error(`❌ API Error (${endpoint}):`, {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      contentType,
      error: errorMessage
    });
    
    throw new Error(errorMessage);
  }
  
  if (contentType && contentType.includes('application/json')) {
    return await response.json();
  } else {
    const text = await response.text();
    console.warn(`⚠️ Non-JSON response from ${endpoint}:`, text.substring(0, 200));
    throw new Error(`Expected JSON response, got: ${contentType}`);
  }
};

// Firebase Authentication state
let firebaseIdToken: string | null = null;

// Firebase Authentication methods
export const auth = {
  // Set Firebase ID Token (called from AuthContext)
  setFirebaseIdToken(token: string | null) {
    firebaseIdToken = token;
    if (token) {
      localStorage.setItem('firebaseIdToken', token);
    } else {
      localStorage.removeItem('firebaseIdToken');
    }
  },

  // Get current Firebase ID Token
  getToken() {
    if (!firebaseIdToken) {
      firebaseIdToken = localStorage.getItem('firebaseIdToken');
    }
    return firebaseIdToken;
  },

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.getToken();
  },

  // Legacy methods for backward compatibility (deprecated)
  async login(username: string, password: string) {
    console.warn('⚠️ Legacy login method is deprecated. Use Firebase Authentication instead.');
    throw new Error('Please use Firebase Authentication for login');
  },

  logout() {
    this.setFirebaseIdToken(null);
  }
};

// Initialize token from localStorage
firebaseIdToken = localStorage.getItem('firebaseIdToken');

// Types
export type AccountCode = {
  id: string;
  code: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
};

export type Supplier = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
};

export type Product = {
  id: string;
  name: string;
  sku: string;
  description?: string;
  category_id: string;
  supplier_id: string;
  unit_price: number;
  current_stock: number;
  min_stock: number;
  max_stock?: number;
  unit?: string;
  location?: string;
  barcode?: string;
  category_name?: string;
  supplier_name?: string;
  created_at: string;
  updated_at: string;
};

export type Movement = {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  product_name?: string;
  sku?: string;
  created_at: string;
  updated_at: string;
};

export type BudgetRequest = {
  id?: number;
  request_no: string;
  requester: string;
  request_date: string;
  account_code: string;
  account_name?: string;
  amount: number;
  note?: string;
  material_list?: Array<{item: string; quantity: string}>;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at?: string;
  updated_at?: string;
};

export type Approval = {
  id?: string;
  request_id: number;
  decision: string;
  remark?: string;
  approver_name: string;
  created_at?: string;
};

export type Setting = {
  id: string;
  key: string;
  value: string;
  category: string;
  created_at: string;
  updated_at: string;
};

export type Requester = {
  id: number;
  name: string;
  email: string;
  department?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Approver = {
  id: number;
  name: string;
  email: string;
  department?: string;
  position?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

// API Service Class
export class ApiService {
  // Generic fetch wrapper with Firebase ID Token
  private static async fetchApi(endpoint: string, options: RequestInit = {}) {
    try {
      const firebaseToken = auth.getToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      // Merge custom headers properly
      if (options.headers) {
        Object.assign(headers, options.headers);
      }

      // Use Firebase ID Token for authentication
      if (firebaseToken) {
        headers['Authorization'] = `Bearer ${firebaseToken}`;
        console.log(`🔐 Using Firebase ID Token for API call: ${endpoint}`);
        console.log(`🔐 Token preview: ${firebaseToken.substring(0, 20)}...`);
      } else {
        console.warn(`⚠️ No Firebase ID Token available for API call: ${endpoint}`);
        console.warn(`⚠️ localStorage token: ${localStorage.getItem('firebaseIdToken') ? 'exists' : 'not found'}`);
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      // If 401 Unauthorized, try to refresh token
      if (response.status === 401 && firebaseToken) {
        console.log('🔄 Token expired, attempting to refresh...');
        try {
          // Import Firebase auth to refresh token
          const { getAuth } = await import('firebase/auth');
          const { auth: firebaseAuth } = await import('../lib/firebase');
          const currentUser = firebaseAuth.currentUser;
          
          if (currentUser) {
            const newToken = await currentUser.getIdToken(true); // Force refresh
            console.log('✅ Token refreshed successfully');
            apiAuth.setFirebaseIdToken(newToken);
            
            // Retry the request with new token
            headers['Authorization'] = `Bearer ${newToken}`;
            const retryResponse = await fetch(`${API_BASE_URL}${endpoint}`, {
              ...options,
              headers,
            });
            return await handleApiResponse(retryResponse, endpoint);
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError);
        }
      }

      return await handleApiResponse(response, endpoint);
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }


  // Account Codes
  static async getAccountCodes(): Promise<AccountCode[]> {
    return this.fetchApi('/account-codes');
  }

  static async createAccountCode(accountCode: Omit<AccountCode, 'id' | 'created_at' | 'updated_at'>): Promise<AccountCode> {
    return this.fetchApi('/account-codes', {
      method: 'POST',
      body: JSON.stringify(accountCode),
    });
  }

  static async updateAccountCode(id: string, accountCode: Partial<AccountCode>): Promise<AccountCode> {
    return this.fetchApi(`/account-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(accountCode),
    });
  }

  static async deleteAccountCode(id: string): Promise<void> {
    return this.fetchApi(`/account-codes/${id}`, {
      method: 'DELETE',
    });
  }

  // Categories
  static async getCategories(): Promise<Category[]> {
    const response = await this.fetchApi('/categories');
    return response.categories || response;
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    return this.fetchApi('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
  }

  static async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    return this.fetchApi(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
  }

  static async deleteCategory(id: string): Promise<void> {
    return this.fetchApi(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  // Suppliers
  static async getSuppliers(): Promise<Supplier[]> {
    const response = await this.fetchApi('/suppliers');
    return response.suppliers || response;
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    return this.fetchApi('/suppliers', {
      method: 'POST',
      body: JSON.stringify(supplier),
    });
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    return this.fetchApi(`/suppliers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(supplier),
    });
  }

  static async deleteSupplier(id: string): Promise<void> {
    return this.fetchApi(`/suppliers/${id}`, {
      method: 'DELETE',
    });
  }

  // Products
  static async getProducts(): Promise<Product[]> {
    const response = await this.fetchApi('/products');
    return response.products || response;
  }

  static async getProductById(id: string): Promise<Product> {
    return this.fetchApi(`/products/${id}`);
  }

  static async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      return await this.fetchApi(`/products/barcode/${encodeURIComponent(barcode)}`);
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    return this.fetchApi('/products', {
      method: 'POST',
      body: JSON.stringify(product),
    });
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    return this.fetchApi(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(product),
    });
  }

  static async deleteProduct(id: string): Promise<void> {
    return this.fetchApi(`/products/${id}`, {
      method: 'DELETE',
    });
  }

  // Movements
  static async getMovements(): Promise<Movement[]> {
    const response = await this.fetchApi('/stock-movements');
    return response.movements || response;
  }

  static async createMovement(movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement> {
    return this.fetchApi('/stock-movements', {
      method: 'POST',
      body: JSON.stringify(movement),
    });
  }

  static async updateMovement(id: string, movement: Partial<Omit<Movement, 'id' | 'created_at' | 'updated_at'>>): Promise<Movement> {
    return this.fetchApi(`/movements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movement),
    });
  }

  static async deleteMovement(id: string): Promise<void> {
    return this.fetchApi(`/movements/${id}`, {
      method: 'DELETE',
    });
  }

  // Budget Requests (Protected endpoints)
  static async getBudgetRequests(): Promise<BudgetRequest[]> {
    const response = await this.fetchApi('/budget-requests');
    // Handle different response formats
    if (response.budgetRequests && Array.isArray(response.budgetRequests)) {
      return response.budgetRequests;
    }
    if (Array.isArray(response)) {
      return response;
    }
    // Return empty array if response is not in expected format
    console.warn('⚠️ Unexpected response format for budget requests:', response);
    return [];
  }

  static async getBudgetRequestById(id: string): Promise<BudgetRequest> {
    return this.fetchApi(`/budget-requests/${id}`);
  }

  static async createBudgetRequest(request: Omit<BudgetRequest, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetRequest> {
    return this.fetchApi('/budget-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  static async updateBudgetRequest(id: string, request: Partial<BudgetRequest>): Promise<BudgetRequest> {
    return this.fetchApi(`/budget-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  static async deleteBudgetRequest(id: string): Promise<void> {
    return this.fetchApi(`/budget-requests/${id}`, {
      method: 'DELETE',
    });
  }

  // Approval methods (Protected endpoints)
  static async getApprovals(): Promise<Approval[]> {
    return this.fetchApi('/approvals');
  }

  static async getApprovalByRequestId(requestId: string): Promise<Approval> {
    return this.fetchApi(`/approvals/request/${requestId}`);
  }

  static async createApproval(approval: Omit<Approval, 'id' | 'created_at'>): Promise<Approval> {
    return this.fetchApi('/approvals', {
      method: 'POST',
      body: JSON.stringify(approval),
    });
  }

  static async getApprovalById(id: string): Promise<Approval> {
    return this.fetchApi(`/approvals/${id}`);
  }


  static async updateApproval(id: string, approval: Partial<Approval>): Promise<Approval> {
    return this.fetchApi(`/approvals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(approval),
    });
  }

  static async deleteApproval(id: string): Promise<void> {
    return this.fetchApi(`/approvals/${id}`, {
      method: 'DELETE',
    });
  }

  // Statistics
  static async getStats(): Promise<{
    totalProducts: number;
    totalValue: number;
    lowStockItems: number;
    outOfStockItems: number;
    recentMovements: number;
  }> {
    return this.fetchApi('/stats');
  }

  // Search
  static async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts();
    const searchTerm = query.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      product.sku.toLowerCase().includes(searchTerm) ||
      (product.barcode && product.barcode.toLowerCase().includes(searchTerm))
    );
  }

  // Health check
  static async healthCheck(): Promise<{ status: string; timestamp: string; database: string }> {
    return this.fetchApi('/health');
  }

  // Settings
  static async getSettings(): Promise<Setting[]> {
    return this.fetchApi('/settings');
  }

  static async updateSetting(key: string, setting: Partial<Setting>): Promise<Setting> {
    return this.fetchApi(`/settings/${key}`, {
      method: 'PUT',
      body: JSON.stringify(setting),
    });
  }

  // Requesters
  static async getRequesters(): Promise<Requester[]> {
    return this.fetchApi('/requesters');
  }

  static async createRequester(requester: Omit<Requester, 'id' | 'created_at' | 'updated_at'>): Promise<Requester> {
    return this.fetchApi('/requesters', {
      method: 'POST',
      body: JSON.stringify(requester),
    });
  }

  static async deactivateAllRequesters(): Promise<void> {
    return this.fetchApi('/requesters/deactivate-all', {
      method: 'PUT',
    });
  }

  // Approvers
  static async getApprovers(): Promise<Approver[]> {
    return this.fetchApi('/approvers');
  }

  static async createApprover(approver: Omit<Approver, 'id' | 'created_at' | 'updated_at'>): Promise<Approver> {
    return this.fetchApi('/approvers', {
      method: 'POST',
      body: JSON.stringify(approver),
    });
  }

  static async deactivateAllApprovers(): Promise<void> {
    return this.fetchApi('/approvers/deactivate-all', {
      method: 'PUT',
    });
  }

  // Bulk delete operations

  static async deleteAllMovements(): Promise<void> {
    return this.fetchApi('/movements/delete-all', {
      method: 'DELETE',
    });
  }

  static async deleteAllProducts(): Promise<void> {
    return this.fetchApi('/products/delete-all', {
      method: 'DELETE',
    });
  }

  static async deleteAllCategories(): Promise<void> {
    return this.fetchApi('/categories/delete-all', {
      method: 'DELETE',
    });
  }

  static async deleteAllSuppliers(): Promise<void> {
    return this.fetchApi('/suppliers/delete-all', {
      method: 'DELETE',
    });
  }


  static async updateSettings(settings: any): Promise<any> {
    return this.fetchApi('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }


  static async saveSettings(settings: any): Promise<void> {
    return this.fetchApi('/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  static async testConnection(): Promise<boolean> {
    try {
      await this.fetchApi('/test', {
        method: 'GET',
      });
      return true;
    } catch (error) {
      console.error('❌ Server connection test failed:', error);
      throw error;
    }
  }

  static async testDatabase(): Promise<boolean> {
    try {
      await this.fetchApi('/test-db', {
        method: 'GET',
      });
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      throw error;
    }
  }

  static async exportData(): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/export`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(firebaseIdToken && { 'Authorization': `Bearer ${firebaseIdToken}` })
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `material-management-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('❌ Failed to export data:', error);
      throw error;
    }
  }

  static async importData(file: File): Promise<void> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE_URL}/import`, {
        method: 'POST',
        headers: {
          ...(firebaseIdToken && { 'Authorization': `Bearer ${firebaseIdToken}` })
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Failed to import data:', error);
      throw error;
    }
  }

  static async deleteAllData(): Promise<void> {
    return this.fetchApi('/delete-all', {
      method: 'DELETE',
    });
  }
}

// Export instance
export const api = ApiService;
