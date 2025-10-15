// Strict type definitions for better type safety

// Base types
export type ID = string;
export type Timestamp = string | Date;
export type Currency = 'THB' | 'USD' | 'EUR';
export type Status = 'active' | 'inactive' | 'pending' | 'approved' | 'rejected';

// User types
export interface User {
  readonly id: ID;
  readonly email: string;
  readonly displayName: string;
  readonly role: UserRole;
  readonly department?: string;
  readonly position?: string;
  readonly phone?: string;
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type UserRole = 'admin' | 'manager' | 'user';

// Product types
export interface Product {
  readonly id: ID;
  readonly name: string;
  readonly sku: string;
  readonly description?: string;
  readonly categoryId: ID;
  readonly supplierId: ID;
  readonly price: number;
  readonly currentStock: number;
  readonly minStock: number;
  readonly maxStock?: number;
  readonly unit: string;
  readonly location?: string;
  readonly expiryDate?: Timestamp;
  readonly batchNo?: string;
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Category types
export interface Category {
  readonly id: ID;
  readonly name: string;
  readonly description?: string;
  readonly color?: string;
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Supplier types
export interface Supplier {
  readonly id: ID;
  readonly name: string;
  readonly contactPerson: string;
  readonly email: string;
  readonly phone: string;
  readonly address: string;
  readonly taxId?: string;
  readonly website?: string;
  readonly isActive: boolean;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

// Movement types
export interface Movement {
  readonly id: ID;
  readonly productId: ID;
  readonly type: MovementType;
  readonly quantity: number;
  readonly reason: string;
  readonly reference?: string;
  readonly notes?: string;
  readonly createdBy: ID;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type MovementType = 'in' | 'out';

// Receipt types
export interface Receipt {
  readonly id: ID;
  readonly receiptNo: string;
  readonly supplier: string;
  readonly receivedBy: string;
  readonly items: readonly ReceiptItem[];
  readonly totalAmount: number;
  readonly notes?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface ReceiptItem {
  readonly id: ID;
  readonly productId: ID;
  readonly productName: string;
  readonly productSku: string;
  readonly quantity: number;
  readonly unit: string;
  readonly unitPrice: number;
  readonly totalPrice: number;
  readonly supplier?: string;
  readonly batchNo?: string;
  readonly expiryDate?: Timestamp;
}

// Withdrawal types
export interface Withdrawal {
  readonly id: ID;
  readonly withdrawalNo: string;
  readonly requestedBy: string;
  readonly approvedBy?: string;
  readonly items: readonly WithdrawalItem[];
  readonly notes?: string;
  readonly status: Status;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export interface WithdrawalItem {
  readonly id: ID;
  readonly productId: ID;
  readonly productName: string;
  readonly productSku: string;
  readonly quantity: number;
  readonly unit: string;
  readonly reason: string;
}

// Budget Request types
export interface BudgetRequest {
  readonly id: ID;
  readonly requestCode: string;
  readonly title: string;
  readonly description: string;
  readonly amount: number;
  readonly category: string;
  readonly priority: Priority;
  readonly requestedBy: ID;
  readonly department: string;
  readonly expectedDate: Timestamp;
  readonly justification: string;
  readonly status: Status;
  readonly approvedBy?: ID;
  readonly approvedAt?: Timestamp;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
}

export type Priority = 'low' | 'medium' | 'high';

// API Response types
export interface ApiResponse<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: string;
  readonly message?: string;
}

export interface PaginatedResponse<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly limit: number;
  readonly hasMore: boolean;
}

// Form types
export interface CreateProductForm {
  readonly name: string;
  readonly sku: string;
  readonly description?: string;
  readonly categoryId: ID;
  readonly supplierId: ID;
  readonly price: number;
  readonly currentStock: number;
  readonly minStock: number;
  readonly maxStock?: number;
  readonly unit: string;
  readonly location?: string;
  readonly expiryDate?: Timestamp;
  readonly batchNo?: string;
}

export interface UpdateProductForm {
  readonly name?: string;
  readonly sku?: string;
  readonly description?: string;
  readonly categoryId?: ID;
  readonly supplierId?: ID;
  readonly price?: number;
  readonly currentStock?: number;
  readonly minStock?: number;
  readonly maxStock?: number;
  readonly unit?: string;
  readonly location?: string;
  readonly expiryDate?: Timestamp;
  readonly batchNo?: string;
}

// Search types
export interface SearchFilters {
  readonly query?: string;
  readonly categoryId?: ID;
  readonly supplierId?: ID;
  readonly minStock?: number;
  readonly maxStock?: number;
  readonly dateFrom?: Timestamp;
  readonly dateTo?: Timestamp;
  readonly type?: MovementType;
}

// Dashboard types
export interface DashboardStats {
  readonly totalProducts: number;
  readonly totalValue: number;
  readonly lowStockProducts: number;
  readonly outOfStockProducts: number;
  readonly recentMovements: number;
  readonly todayMovements: number;
  readonly todayReceipts: number;
  readonly todayWithdrawals: number;
}

// Chart types
export interface ChartData {
  readonly name: string;
  readonly value: number;
  readonly color?: string;
}

export interface TimeSeriesData {
  readonly date: string;
  readonly value: number;
  readonly label?: string;
}

// Error types
export interface AppError {
  readonly code: string;
  readonly message: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: Timestamp;
}

// Validation types
export interface ValidationError {
  readonly field: string;
  readonly message: string;
  readonly code: string;
}

export interface ValidationResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly errors: readonly ValidationError[];
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type NonNullable<T> = T extends null | undefined ? never : T;

// Generic types for API operations
export type CreateData<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateData<T> = Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>;
export type FilterData<T> = Partial<Pick<T, keyof T>>;

// Event types
export interface AppEvent<T = unknown> {
  readonly type: string;
  readonly payload: T;
  readonly timestamp: Timestamp;
  readonly userId?: ID;
}

// Configuration types
export interface AppConfig {
  readonly apiUrl: string;
  readonly firebaseConfig: {
    readonly apiKey: string;
    readonly authDomain: string;
    readonly projectId: string;
    readonly storageBucket: string;
    readonly messagingSenderId: string;
    readonly appId: string;
  };
  readonly features: {
    readonly enableNotifications: boolean;
    readonly enableOfflineMode: boolean;
    readonly enableAnalytics: boolean;
  };
}
