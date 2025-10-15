import { 
  collection, 
  doc, 
  writeBatch, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit,
  startAfter,
  DocumentSnapshot,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { db } from './firebase';

export interface BatchOperation<T> {
  type: 'create' | 'update' | 'delete';
  data: T;
  id?: string;
}

export class BatchOperations {
  private batch = writeBatch(db);
  private operations: BatchOperation<any>[] = [];
  private maxBatchSize = 500; // Firestore limit

  /**
   * Add operation to batch
   */
  addOperation<T>(operation: BatchOperation<T>): void {
    this.operations.push(operation);
    
    // Auto-commit if batch is full
    if (this.operations.length >= this.maxBatchSize) {
      this.commit();
    }
  }

  /**
   * Add multiple operations at once
   */
  addOperations<T>(operations: BatchOperation<T>[]): void {
    this.operations.push(...operations);
    
    // Auto-commit if batch is full
    if (this.operations.length >= this.maxBatchSize) {
      this.commit();
    }
  }

  /**
   * Commit all operations in batch
   */
  async commit(): Promise<void> {
    if (this.operations.length === 0) {
      return;
    }

    try {
      // Group operations by type for better performance
      const createOps = this.operations.filter(op => op.type === 'create');
      const updateOps = this.operations.filter(op => op.type === 'update');
      const deleteOps = this.operations.filter(op => op.type === 'delete');

      // Process creates
      for (const op of createOps) {
        const docRef = doc(collection(db, this.getCollectionName(op.data)));
        this.batch.set(docRef, op.data);
      }

      // Process updates
      for (const op of updateOps) {
        if (op.id) {
          const docRef = doc(db, this.getCollectionName(op.data), op.id);
          this.batch.update(docRef, op.data);
        }
      }

      // Process deletes
      for (const op of deleteOps) {
        if (op.id) {
          const docRef = doc(db, this.getCollectionName(op.data), op.id);
          this.batch.delete(docRef);
        }
      }

      await this.batch.commit();
      
      // Reset for next batch
      this.operations = [];
      this.batch = writeBatch(db);
      
    } catch (error) {
      console.error('Batch operation failed:', error);
      throw error;
    }
  }

  /**
   * Get collection name based on data type
   */
  private getCollectionName(data: any): string {
    // This is a simplified approach - in real app, you'd have better type detection
    if (data.productName || data.sku) return 'products';
    if (data.categoryName) return 'categories';
    if (data.supplierName) return 'suppliers';
    if (data.movementType) return 'stock_movements';
    if (data.receiptNo) return 'receipts';
    if (data.withdrawalNo) return 'withdrawals';
    return 'documents';
  }

  /**
   * Get current operation count
   */
  getOperationCount(): number {
    return this.operations.length;
  }

  /**
   * Clear all pending operations
   */
  clear(): void {
    this.operations = [];
    this.batch = writeBatch(db);
  }
}

/**
 * Optimized query with pagination
 */
export class OptimizedQueries {
  /**
   * Get products with pagination and filtering
   */
  static async getProductsPaginated(
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
    filters?: {
      categoryId?: string;
      supplierId?: string;
      minStock?: number;
      maxStock?: number;
    }
  ) {
    let q = query(
      collection(db, 'products'),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );

    // Apply filters
    if (filters?.categoryId) {
      q = query(q, where('categoryId', '==', filters.categoryId));
    }
    if (filters?.supplierId) {
      q = query(q, where('supplierId', '==', filters.supplierId));
    }
    if (filters?.minStock !== undefined) {
      q = query(q, where('currentStock', '>=', filters.minStock));
    }
    if (filters?.maxStock !== undefined) {
      q = query(q, where('currentStock', '<=', filters.maxStock));
    }

    // Apply pagination
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    return {
      docs: snapshot.docs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }

  /**
   * Get movements with pagination
   */
  static async getMovementsPaginated(
    pageSize: number = 20,
    lastDoc?: DocumentSnapshot,
    type?: 'in' | 'out'
  ) {
    let q = query(
      collection(db, 'stock_movements'),
      orderBy('created_at', 'desc'),
      limit(pageSize)
    );

    if (type) {
      q = query(q, where('type', '==', type));
    }

    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const snapshot = await getDocs(q);
    return {
      docs: snapshot.docs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };
  }

  /**
   * Get low stock products efficiently
   */
  static async getLowStockProducts(threshold: number = 10) {
    const q = query(
      collection(db, 'products'),
      where('currentStock', '<=', threshold),
      where('currentStock', '>', 0),
      orderBy('currentStock', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }

  /**
   * Get out of stock products
   */
  static async getOutOfStockProducts() {
    const q = query(
      collection(db, 'products'),
      where('currentStock', '==', 0),
      orderBy('created_at', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  }
}

/**
 * Cache management for frequently accessed data
 */
export class DataCache {
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static defaultTTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get data from cache
   */
  static get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   */
  static set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Clear cache
   */
  static clear(): void {
    this.cache.clear();
  }

  /**
   * Clear expired entries
   */
  static clearExpired(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Optimized data fetching with caching
 */
export class OptimizedDataFetcher {
  /**
   * Get products with caching
   */
  static async getProducts(useCache: boolean = true): Promise<any[]> {
    const cacheKey = 'products';
    
    if (useCache) {
      const cached = DataCache.get<any[]>(cacheKey);
      if (cached) {
        console.log('📦 Using cached products data');
        return cached;
      }
    }

    console.log('🔍 Fetching products from Firestore...');
    const { docs } = await OptimizedQueries.getProductsPaginated(100);
    const products = docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Cache the result
    DataCache.set(cacheKey, products, 10 * 60 * 1000); // 10 minutes

    return products;
  }

  /**
   * Get categories with caching
   */
  static async getCategories(useCache: boolean = true): Promise<any[]> {
    const cacheKey = 'categories';
    
    if (useCache) {
      const cached = DataCache.get<any[]>(cacheKey);
      if (cached) {
        console.log('📂 Using cached categories data');
        return cached;
      }
    }

    console.log('🔍 Fetching categories from Firestore...');
    const q = query(collection(db, 'categories'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const categories = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Cache the result
    DataCache.set(cacheKey, categories, 15 * 60 * 1000); // 15 minutes

    return categories;
  }

  /**
   * Get suppliers with caching
   */
  static async getSuppliers(useCache: boolean = true): Promise<any[]> {
    const cacheKey = 'suppliers';
    
    if (useCache) {
      const cached = DataCache.get<any[]>(cacheKey);
      if (cached) {
        console.log('🏢 Using cached suppliers data');
        return cached;
      }
    }

    console.log('🔍 Fetching suppliers from Firestore...');
    const q = query(collection(db, 'suppliers'), orderBy('created_at', 'desc'));
    const snapshot = await getDocs(q);
    const suppliers = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Cache the result
    DataCache.set(cacheKey, suppliers, 15 * 60 * 1000); // 15 minutes

    return suppliers;
  }
}
