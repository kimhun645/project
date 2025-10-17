import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
  writeBatch,
  getCountFromServer,
  runTransaction
} from 'firebase/firestore';
import { db } from './firebase';
import { LogService } from './logService';
import { notificationService } from './notificationService';
import { SecurityService } from './securityService';
import { PerformanceService } from './performanceService';

export interface Product {
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
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  is_medicine?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AccountCode {
  id: string;
  code?: string;
  name: string;
  type?: string;
  created_at?: any;
  updated_at?: any;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  createdBy?: string;
}

export interface AccountCode {
  id: string;
  code: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  contact_person?: string;
  created_at: string;
  updated_at: string;
}

export interface Movement {
  id: string;
  product_id: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  reference?: string;
  notes?: string;
  person_name?: string; // ผู้เบิก/ผู้รับ
  person_role?: string; // บทบาท (เบิก/รับ)
  product_name?: string;
  sku?: string;
  created_at: string;
  updated_at: string;
}

export interface WithdrawalItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit: string;
  reason: string;
}

export interface Withdrawal {
  id: string;
  withdrawal_no: string;
  withdrawal_date: string;
  requester_name: string;
  department: string;
  purpose: string;
  notes: string;
  items: WithdrawalItem[];
  status: 'pending' | 'approved' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
}

export interface ReceiptItem {
  id: string;
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit: string;
  unit_price: number;
  total_price: number;
  supplier: string;
  batch_no?: string;
  expiry_date?: string;
}

export interface Receipt {
  id: string;
  receipt_no: string;
  receipt_date: string;
  receiver_name: string;
  department: string;
  supplier: string;
  invoice_no: string;
  notes: string;
  items: ReceiptItem[];
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  created_by: string;
}

export interface BudgetRequest {
  id: string;
  request_no: string;
  requester: string;
  request_date: string;
  account_code: string;
  account_name?: string;
  amount: number;
  note?: string;
  material_list?: any[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approver_name?: string;
  approver_id?: string;
  approver_email?: string;
}

export interface Approval {
  id: string;
  request_id: string;
  approver_id: string;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  approved_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Settings {
  id?: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  currency: 'THB' | 'USD' | 'EUR';
  lowStockAlert: boolean;
  emailNotifications: boolean;
  autoBackup: boolean;
  approverName: string;
  approverEmail: string;
  ccEmails?: string;
  sessionTimeout: number;
  maxLoginAttempts: number;
  requireTwoFactor: boolean;
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  fontSize: 'small' | 'medium' | 'large';
  created_at?: string;
  updated_at?: string;
}

const toISOString = (timestamp: any): string => {
  if (!timestamp) return new Date().toISOString();
  if (timestamp.toDate) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return new Date().toISOString();
};

export class FirestoreService {
  // Cache for frequently accessed data
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private static getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private static setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  static async getProducts(retryCount = 0, limitCount: number = 100): Promise<Product[]> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      // Check cache first
      const cacheKey = 'products';
      const cachedProducts = this.getCachedData<Product[]>(cacheKey);
      if (cachedProducts) {
        console.log('📦 ใช้ข้อมูลจาก cache');
        return cachedProducts;
      }

      console.log('🔍 กำลังโหลดข้อมูลสินค้า...');
      
      // Load all data in parallel with optimized queries
      const [productsSnapshot, categoriesSnapshot, suppliersSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'products'), orderBy('created_at', 'desc'), limit(limitCount))),
        getDocs(query(collection(db, 'categories'), orderBy('created_at', 'desc'), limit(50))),
        getDocs(query(collection(db, 'suppliers'), orderBy('created_at', 'desc'), limit(50)))
      ]);

      // Build lookup maps
      const categoriesMap = new Map();
      categoriesSnapshot.docs.forEach(doc => {
        categoriesMap.set(doc.id, doc.data().name);
      });

      const suppliersMap = new Map();
      suppliersSnapshot.docs.forEach(doc => {
        suppliersMap.set(doc.id, doc.data().name);
      });

      const products = productsSnapshot.docs.map(doc => {
        const data = doc.data();
        const categoryName = categoriesMap.get(data.category_id) || data.category_name;
        const supplierName = suppliersMap.get(data.supplier_id) || data.supplier_name;
        
        console.log(`📦 สินค้า: ${data.name}, หมวดหมู่ ID: ${data.category_id}, หมวดหมู่ชื่อ: ${categoryName}`);
        console.log(`📦 สินค้า: ${data.name}, ผู้จำหน่าย ID: ${data.supplier_id}, ผู้จำหน่ายชื่อ: ${supplierName}`);
        
        return {
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          description: data.description,
          category_id: data.category_id || '',
          supplier_id: data.supplier_id || '',
          unit_price: data.unit_price || 0,
          current_stock: data.current_stock || 0,
          min_stock: data.min_stock || 0,
          max_stock: data.max_stock,
          unit: data.unit,
          location: data.location,
          barcode: data.barcode,
          category_name: categoryName,
          supplier_name: supplierName,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Product;
      });

      // Cache the results
      this.setCachedData(cacheKey, products);
      return products;
    } catch (error: any) {
      console.error('❌ Error getting products:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Handle network errors with retry
      if ((error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message?.includes('network')) && retryCount < maxRetries) {
        console.log(`🔄 Retrying get products (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return this.getProducts(retryCount + 1);
      }
      
      // Handle specific Firestore errors
      if (error.code === 'permission-denied') {
        console.error('ไม่มีสิทธิ์ในการเข้าถึงข้อมูลสินค้า');
        return [];
      } else if (error.code === 'unavailable') {
        console.error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง');
        return [];
      } else if (error.code === 'deadline-exceeded') {
        console.error('การดำเนินการใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
        return [];
      } else {
        console.error(`เกิดข้อผิดพลาดในการโหลดข้อมูลสินค้า: ${error.message}`);
        return [];
      }
    }
  }

  static async getProduct(id: string): Promise<Product | null> {
    try {
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          sku: data.sku || '',
          description: data.description,
          category_id: data.category_id || '',
          supplier_id: data.supplier_id || '',
          unit_price: data.unit_price || 0,
          current_stock: data.current_stock || 0,
          min_stock: data.min_stock || 0,
          max_stock: data.max_stock,
          unit: data.unit,
          location: data.location,
          barcode: data.barcode,
          category_name: data.category_name,
          supplier_name: data.supplier_name,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Product;
      }

      return null;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  static async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const productsRef = collection(db, 'products');
      const q = query(productsRef, where('barcode', '==', barcode));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          sku: data.sku || '',
          description: data.description,
          category_id: data.category_id || '',
          supplier_id: data.supplier_id || '',
          unit_price: data.unit_price || 0,
          current_stock: data.current_stock || 0,
          min_stock: data.min_stock || 0,
          max_stock: data.max_stock,
          unit: data.unit,
          location: data.location,
          barcode: data.barcode,
          category_name: data.category_name,
          supplier_name: data.supplier_name,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Product;
      }

      return null;
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<Product> {
    try {
      // กรองค่า undefined ออก
      const cleanProduct = Object.fromEntries(
        Object.entries(product).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, {
        ...cleanProduct,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const newProduct = await this.getProduct(docRef.id);
      if (!newProduct) throw new Error('Failed to create product');

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'CREATE_PRODUCT',
            `เพิ่มสินค้าใหม่: ${cleanProduct.name}`,
            'Products',
            {
              resourceId: docRef.id,
              severity: 'success',
              metadata: {
                productName: cleanProduct.name,
                productSku: cleanProduct.sku,
                productPrice: cleanProduct.unit_price,
                productStock: cleanProduct.current_stock
              }
            }
          );
          console.log('📝 Product creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log product creation:', logError);
        }
      }

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, product: Partial<Product>, retryCount = 0, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    const maxRetries = 3;
    const retryDelay = 1000; // 1 second
    
    try {
      const docRef = doc(db, 'products', id);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanProduct: any = {};
      Object.keys(product).forEach(key => {
        const value = (product as any)[key];
        if (value !== undefined && value !== null) {
          cleanProduct[key] = value;
        }
      });
      
      // Always add updated_at
      cleanProduct.updated_at = serverTimestamp();
      
      console.log('🔄 Updating product with clean data:', id, cleanProduct);
      await updateDoc(docRef, cleanProduct);
      console.log('✅ Product updated successfully:', id);

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          // ดึงข้อมูลสินค้าเพื่อบันทึกชื่อใน logs
          const productSnap = await getDoc(docRef);
          const productData = productSnap.data();
          const productName = productData?.name || 'Unknown Product';

          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'UPDATE_PRODUCT',
            `แก้ไขสินค้า: ${productName}`,
            'Products',
            {
              resourceId: id,
              severity: 'info',
              metadata: {
                productName: productName,
                updatedFields: Object.keys(cleanProduct).filter(key => key !== 'updated_at')
              }
            }
          );
          console.log('📝 Product update logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log product update:', logError);
        }
      }
    } catch (error: any) {
      console.error('❌ Error updating product:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      
      // Handle network errors with retry
      if ((error.code === 'unavailable' || error.code === 'deadline-exceeded' || error.message?.includes('network')) && retryCount < maxRetries) {
        console.log(`🔄 Retrying update product (attempt ${retryCount + 1}/${maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount + 1)));
        return this.updateProduct(id, product, retryCount + 1);
      }
      
      // Handle specific Firestore errors
      if (error.code === 'permission-denied') {
        throw new Error('ไม่มีสิทธิ์ในการแก้ไขสินค้า');
      } else if (error.code === 'not-found') {
        throw new Error('ไม่พบสินค้าที่ต้องการแก้ไข');
      } else if (error.code === 'unavailable') {
        throw new Error('เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง');
      } else if (error.code === 'deadline-exceeded') {
        throw new Error('การดำเนินการใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง');
      } else {
        throw new Error(`เกิดข้อผิดพลาดในการแก้ไขสินค้า: ${error.message}`);
      }
    }
  }

  static async deleteProduct(id: string, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }
      
      // ดึงข้อมูลสินค้าก่อนลบเพื่อบันทึก logs
      const productRef = doc(db, 'products', id);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) {
        throw new Error('Product not found');
      }
      
      const productData = productSnap.data();
      const productName = productData.name || 'Unknown Product';
      
      // ลบสินค้า
      await deleteDoc(productRef);
      
      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'DELETE_PRODUCT',
            `ลบสินค้า: ${productName}`,
            'Products',
            {
              resourceId: id,
              severity: 'info',
              metadata: {
                productName: productName,
                productSku: productData.sku,
                productPrice: productData.unit_price,
                productStock: productData.current_stock
              }
            }
          );
          console.log('📝 Product deletion logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log product deletion:', logError);
          // ไม่ throw error เพื่อไม่ให้การลบสินค้าล้มเหลว
        }
      }
      
      console.log(`✅ Product deleted successfully: ${productName}`);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async getCategories(): Promise<Category[]> {
    try {
      // Check cache first
      const cacheKey = 'categories';
      const cachedCategories = this.getCachedData<Category[]>(cacheKey);
      if (cachedCategories) {
        console.log('📂 ใช้ข้อมูลหมวดหมู่จาก cache');
        return cachedCategories;
      }

      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);

      const categories = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.title || `หมวดหมู่ ${doc.id}`,
          description: data.description || data.desc || '',
          is_medicine: data.is_medicine || false,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Category;
      });

      // Cache the results
      this.setCachedData(cacheKey, categories);
      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  static async getUsers(): Promise<User[]> {
    try {
      console.log('🔍 กำลังดึงข้อมูลผู้ใช้จาก Firestore...');
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);

      console.log('📄 จำนวนผู้ใช้ที่พบ:', snapshot.docs.length);

      const users = snapshot.docs.map(doc => {
        const data = doc.data();
        const user = {
          id: doc.id,
          email: data.email || '',
          displayName: data.displayName || '',
          role: data.role || 'user',
          isActive: data.isActive !== false,
          createdAt: toISOString(data.createdAt),
          updatedAt: toISOString(data.updatedAt),
          lastLoginAt: data.lastLoginAt ? toISOString(data.lastLoginAt) : undefined,
          createdBy: data.createdBy
        } as User;
        
        console.log('👤 ผู้ใช้:', user);
        return user;
      });

      console.log('✅ ส่งคืนข้อมูลผู้ใช้:', users);
      return users;
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการดึงข้อมูลผู้ใช้:', error);
      return [];
    }
  }

  static async updateUser(userId: string, userData: Partial<User>, adminInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      console.log('🔄 กำลังอัปเดตผู้ใช้ใน Firestore:', userId, userData);
      
      const userDocRef = doc(db, 'users', userId);
      const updateData = {
        ...userData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(userDocRef, updateData);
      console.log('✅ อัปเดตผู้ใช้ใน Firestore สำเร็จ');

      // บันทึก logs ถ้ามี adminInfo
      if (adminInfo) {
        try {
          // ดึงข้อมูลผู้ใช้เพื่อบันทึกชื่อใน logs
          const userSnap = await getDoc(userDocRef);
          const userData = userSnap.data();
          const userName = userData?.displayName || userData?.email || 'Unknown User';

          await LogService.log(
            adminInfo.userId,
            adminInfo.userName,
            adminInfo.userRole,
            'UPDATE_USER',
            `แก้ไขผู้ใช้: ${userName}`,
            'Users',
            {
              resourceId: userId,
              severity: 'info',
              metadata: {
                userName: userName,
                updatedFields: Object.keys(userData),
                targetUserId: userId
              }
            }
          );
          console.log('📝 User update logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log user update:', logError);
        }
      }
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการอัปเดตผู้ใช้:', error);
      throw new Error(`ไม่สามารถอัปเดตผู้ใช้ได้: ${error.message}`);
    }
  }

  static async addUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>, adminInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มผู้ใช้ใหม่ใน Firestore:', userData);
      
      const usersRef = collection(db, 'users');
      const now = new Date().toISOString();
      
      const docRef = await addDoc(usersRef, {
        ...userData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มผู้ใช้ใหม่ใน Firestore สำเร็จ');

      // บันทึก logs ถ้ามี adminInfo
      if (adminInfo) {
        try {
          await LogService.log(
            adminInfo.userId,
            adminInfo.userName,
            adminInfo.userRole,
            'CREATE_USER',
            `เพิ่มผู้ใช้ใหม่: ${userData.displayName || userData.email}`,
            'Users',
            {
              resourceId: docRef.id,
              severity: 'success',
              metadata: {
                userName: userData.displayName || userData.email,
                userEmail: userData.email,
                userRole: userData.role,
                targetUserId: docRef.id
              }
            }
          );
          console.log('📝 User creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log user creation:', logError);
        }
      }
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มผู้ใช้:', error);
      throw new Error(`ไม่สามารถเพิ่มผู้ใช้ได้: ${error.message}`);
    }
  }

  static async deleteUser(userId: string, adminInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      console.log('🗑️ กำลังลบผู้ใช้จาก Firestore ด้วย firestoreService:', userId);
      console.log('🔍 ตรวจสอบ userId:', userId);
      console.log('🔍 ตรวจสอบ db instance:', db);
      
      const userDocRef = doc(db, 'users', userId);
      console.log('🔍 ตรวจสอบ userDocRef:', userDocRef);
      
      // ดึงข้อมูลผู้ใช้ก่อนลบเพื่อบันทึก logs
      const userSnap = await getDoc(userDocRef);
      const userData = userSnap.data();
      const userName = userData?.displayName || userData?.email || 'Unknown User';

      await deleteDoc(userDocRef);
      console.log('✅ ลบผู้ใช้จาก Firestore สำเร็จ');

      // บันทึก logs ถ้ามี adminInfo
      if (adminInfo) {
        try {
          await LogService.log(
            adminInfo.userId,
            adminInfo.userName,
            adminInfo.userRole,
            'DELETE_USER',
            `ลบผู้ใช้: ${userName}`,
            'Users',
            {
              resourceId: userId,
              severity: 'warning',
              metadata: {
                userName: userName,
                userEmail: userData?.email,
                userRole: userData?.role,
                targetUserId: userId
              }
            }
          );
          console.log('📝 User deletion logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log user deletion:', logError);
        }
      }
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการลบผู้ใช้จาก Firestore:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      throw new Error(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`);
    }
  }


  static async createBudgetRequest(requestData: any, userInfo?: { userId: string; userName: string; userRole: string }): Promise<any> {
    try {
      console.log('🔍 กำลังสร้างคำขอใช้งบประมาณใน Firestore...');
      const budgetRequestsRef = collection(db, 'budgetRequests');
      const now = new Date().toISOString();
      
      const requestDoc = {
        ...requestData,
        status: 'PENDING',
        created_at: now,
        updated_at: now
      };
      
      const docRef = await addDoc(budgetRequestsRef, requestDoc);
      console.log('✅ สร้างคำขอใช้งบประมาณสำเร็จ:', docRef.id);
      
      const newRequest = {
        id: docRef.id,
        ...requestDoc
      };

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'CREATE_BUDGET_REQUEST',
            `สร้างคำขอใช้งบประมาณ: ${requestData.request_no}`,
            'Budget Requests',
            {
              resourceId: docRef.id,
              severity: 'info',
              metadata: {
                requestNo: requestData.request_no,
                requester: requestData.requester,
                amount: requestData.amount,
                accountCode: requestData.account_code,
                accountName: requestData.account_name
              }
            }
          );
          console.log('📝 Budget request creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log budget request creation:', logError);
        }
      }

      return newRequest;
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการสร้างคำขอใช้งบประมาณ:', error);
      throw error;
    }
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<Category> {
    try {
      const categoriesRef = collection(db, 'categories');
      const now = new Date().toISOString();
      
      // Filter out undefined values
      const categoryData = {
        name: category.name,
        description: category.description,
        is_medicine: category.is_medicine || false,
        created_at: now,
        updated_at: now
      };
      
      const docRef = await addDoc(categoriesRef, categoryData);

      const newCategory = {
        id: docRef.id,
        name: categoryData.name,
        description: categoryData.description,
        is_medicine: categoryData.is_medicine,
        created_at: now,
        updated_at: now
      };

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'CREATE_CATEGORY',
            `เพิ่มหมวดหมู่ใหม่: ${categoryData.name}`,
            'Categories',
            {
              resourceId: docRef.id,
              severity: 'success',
              metadata: {
                categoryName: categoryData.name,
                categoryDescription: categoryData.description,
                isMedicine: categoryData.is_medicine
              }
            }
          );
          console.log('📝 Category creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log category creation:', logError);
        }
      }

      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, category: Partial<Category>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      const docRef = doc(db, 'categories', id);
      
      // Filter out undefined values
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (category.name !== undefined) updateData.name = category.name;
      if (category.description !== undefined) updateData.description = category.description;
      if (category.is_medicine !== undefined) updateData.is_medicine = category.is_medicine;
      
      await updateDoc(docRef, updateData);

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          // ดึงข้อมูลหมวดหมู่เพื่อบันทึกชื่อใน logs
          const categorySnap = await getDoc(docRef);
          const categoryData = categorySnap.data();
          const categoryName = categoryData?.name || 'Unknown Category';

          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'UPDATE_CATEGORY',
            `แก้ไขหมวดหมู่: ${categoryName}`,
            'Categories',
            {
              resourceId: id,
              severity: 'info',
              metadata: {
                categoryName: categoryName,
                updatedFields: Object.keys(updateData)
              }
            }
          );
          console.log('📝 Category update logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log category update:', logError);
        }
      }
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'categories', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const snapshot = await getDocs(suppliersRef);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          email: data.email || '',
          phone: data.phone,
          address: data.address,
          contact_person: data.contact_person,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Supplier;
      });
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<Supplier> {
    try {
      console.log('🔍 FirestoreService.createSupplier - เริ่มต้น:', supplier);
      console.log('🔗 FirestoreService.createSupplier - db instance:', db);
      
      const suppliersRef = collection(db, 'suppliers');
      console.log('📝 FirestoreService.createSupplier - collection reference:', suppliersRef);
      
      // กรองค่า undefined ออก
      const cleanSupplier = Object.fromEntries(
        Object.entries(supplier).filter(([_, value]) => value !== undefined && value !== null && value !== '')
      );
      
      const dataToSave = {
        ...cleanSupplier,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      };
      console.log('💾 FirestoreService.createSupplier - ข้อมูลที่จะบันทึก:', dataToSave);
      
      const docRef = await addDoc(suppliersRef, dataToSave);
      console.log('✅ FirestoreService.createSupplier - บันทึกสำเร็จ, docRef:', docRef);

      const newSupplier = {
        id: docRef.id,
        ...supplier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('📋 FirestoreService.createSupplier - ส่งคืนข้อมูล:', newSupplier);

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'CREATE_SUPPLIER',
            `เพิ่มผู้จำหน่ายใหม่: ${supplier.name}`,
            'Suppliers',
            {
              resourceId: docRef.id,
              severity: 'success',
              metadata: {
                supplierName: supplier.name,
                supplierEmail: supplier.email,
                supplierPhone: supplier.phone,
                supplierAddress: supplier.address
              }
            }
          );
          console.log('📝 Supplier creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log supplier creation:', logError);
        }
      }

      return newSupplier;
    } catch (error) {
      console.error('❌ FirestoreService.createSupplier - ข้อผิดพลาด:', error);
      throw error;
    }
  }

  // ฟังก์ชันสำหรับสร้างข้อมูลเริ่มต้น
  static async initializeSuppliersCollection(): Promise<void> {
    try {
      console.log('🔧 กำลังสร้างข้อมูลเริ่มต้นใน suppliers collection...');
      
      const suppliersRef = collection(db, 'suppliers');
      const snapshot = await getDocs(suppliersRef);
      
      if (snapshot.empty) {
        console.log('📝 suppliers collection ว่างเปล่า กำลังสร้างข้อมูลเริ่มต้น...');
        
        const initialSuppliers = [
          {
            name: 'บริษัท ABC จำกัด',
            email: 'contact@abc.com',
            phone: '02-123-4567',
            address: '123 ถนนสุขุมวิท กรุงเทพฯ 10110',
            contact_person: 'คุณสมชาย ใจดี',
            notes: 'ผู้จำหน่ายอุปกรณ์สำนักงาน'
          },
          {
            name: 'บริษัท XYZ จำกัด',
            email: 'info@xyz.com',
            phone: '02-987-6543',
            address: '456 ถนนรัชดาภิเษก กรุงเทพฯ 10400',
            contact_person: 'คุณสมหญิง รักดี',
            notes: 'ผู้จำหน่ายวัสดุก่อสร้าง'
          }
        ];
        
        for (const supplier of initialSuppliers) {
          await addDoc(suppliersRef, {
            ...supplier,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp()
          });
          console.log(`✅ สร้างผู้จำหน่าย: ${supplier.name}`);
        }
        
        console.log('🎉 สร้างข้อมูลเริ่มต้นใน suppliers collection สำเร็จ');
      } else {
        console.log('ℹ️ suppliers collection มีข้อมูลอยู่แล้ว');
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการสร้างข้อมูลเริ่มต้น:', error);
      throw error;
    }
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
        ...supplier,
        updated_at: serverTimestamp()
      });

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          // ดึงข้อมูลผู้จำหน่ายเพื่อบันทึกชื่อใน logs
          const supplierSnap = await getDoc(docRef);
          const supplierData = supplierSnap.data();
          const supplierName = supplierData?.name || 'Unknown Supplier';

          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'UPDATE_SUPPLIER',
            `แก้ไขผู้จำหน่าย: ${supplierName}`,
            'Suppliers',
            {
              resourceId: id,
              severity: 'info',
              metadata: {
                supplierName: supplierName,
                updatedFields: Object.keys(supplier)
              }
            }
          );
          console.log('📝 Supplier update logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log supplier update:', logError);
        }
      }
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  static async deleteSupplier(id: string, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      
      // ดึงข้อมูลผู้จำหน่ายก่อนลบเพื่อบันทึก logs
      const supplierSnap = await getDoc(docRef);
      const supplierData = supplierSnap.data();
      const supplierName = supplierData?.name || 'Unknown Supplier';
      
      await deleteDoc(docRef);

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'DELETE_SUPPLIER',
            `ลบผู้จำหน่าย: ${supplierName}`,
            'Suppliers',
            {
              resourceId: id,
              severity: 'info',
              metadata: {
                supplierName: supplierName,
                supplierEmail: supplierData?.email,
                supplierPhone: supplierData?.phone
              }
            }
          );
          console.log('📝 Supplier deletion logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log supplier deletion:', logError);
        }
      }
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  static async getMovements(limitCount: number = 50): Promise<Movement[]> {
    try {
      const movementsRef = collection(db, 'stock_movements');
      const q = query(
        movementsRef, 
        orderBy('created_at', 'desc'), 
        limit(limitCount)
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          product_id: data.product_id || '',
          type: data.type || 'in',
          quantity: data.quantity || 0,
          reason: data.reason || '',
          reference: data.reference,
          notes: data.notes,
          product_name: data.product_name,
          sku: data.sku,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Movement;
      });
    } catch (error) {
      console.error('Error getting movements:', error);
      return [];
    }
  }

  static async createMovement(movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>, userInfo?: { userId: string; userName: string; userRole: string }): Promise<Movement> {
    try {
      const movementsRef = collection(db, 'stock_movements');
      const docRef = await addDoc(movementsRef, {
        ...movement,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const newMovement = {
        id: docRef.id,
        ...movement,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'CREATE_MOVEMENT',
            `เพิ่มการเคลื่อนไหวสต็อก: ${movement.type} - ${movement.quantity} ชิ้น`,
            'Stock Movements',
            {
              resourceId: docRef.id,
              severity: 'info',
              metadata: {
                movementType: movement.type,
                quantity: movement.quantity,
                productId: movement.product_id,
                reason: movement.reason,
                reference: movement.reference
              }
            }
          );
          console.log('📝 Movement creation logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log movement creation:', logError);
        }
      }

      return newMovement;
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error;
    }
  }

  static async deleteMovement(movementId: string, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      const movementRef = doc(db, 'stock_movements', movementId);
      
      // ดึงข้อมูลการเคลื่อนไหวก่อนลบเพื่อบันทึก logs
      const movementSnap = await getDoc(movementRef);
      const movementData = movementSnap.data();
      const movementType = movementData?.type || 'Unknown Type';
      const quantity = movementData?.quantity || 0;
      
      await deleteDoc(movementRef);
      console.log('✅ Movement deleted successfully:', movementId);
      
      // Clear cache to ensure fresh data
      this.cache.delete('movements');

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            'DELETE_MOVEMENT',
            `ลบการเคลื่อนไหวสต็อก: ${movementType} - ${quantity} ชิ้น`,
            'Stock Movements',
            {
              resourceId: movementId,
              severity: 'warning',
              metadata: {
                movementType: movementType,
                quantity: quantity,
                productId: movementData?.product_id,
                reason: movementData?.reason
              }
            }
          );
          console.log('📝 Movement deletion logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log movement deletion:', logError);
        }
      }
    } catch (error) {
      console.error('Error deleting movement:', error);
      throw error;
    }
  }

  // Transactional stock update to avoid race conditions
  static async updateProductStockTransactional(productId: string, deltaQuantity: number): Promise<void> {
    try {
      const productRef = doc(db, 'products', productId);
      await runTransaction(db, async (transaction) => {
        const productSnap = await transaction.get(productRef);
        if (!productSnap.exists()) {
          throw new Error('ไม่พบสินค้าเพื่อปรับสต็อก');
        }
        const current = (productSnap.data().current_stock || 0) as number;
        const next = current + deltaQuantity;
        if (next < 0) {
          throw new Error('สต็อกไม่เพียงพอสำหรับการเบิก');
        }
        transaction.update(productRef, {
          current_stock: next,
          updated_at: serverTimestamp()
        });
      });
    } catch (error) {
      console.error('❌ Transactional stock update failed:', error);
      throw error;
    }
  }

  // Batch operations for better performance
  static async batchUpdateProducts(updates: Array<{ id: string; data: Partial<Product> }>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      updates.forEach(({ id, data }) => {
        const productRef = doc(db, 'products', id);
        batch.update(productRef, {
          ...data,
          updated_at: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Clear cache to ensure fresh data
      this.cache.delete('products');
      
      console.log(`✅ Batch updated ${updates.length} products successfully`);
    } catch (error) {
      console.error('Error batch updating products:', error);
      throw error;
    }
  }

  static async batchCreateMovements(movements: Array<Omit<Movement, 'id'>>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      movements.forEach(movement => {
        const movementRef = doc(collection(db, 'stock_movements'));
        batch.set(movementRef, {
          ...movement,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      });
      
      await batch.commit();
      
      // Clear cache to ensure fresh data
      this.cache.delete('movements');
      
      console.log(`✅ Batch created ${movements.length} movements successfully`);
    } catch (error) {
      console.error('Error batch creating movements:', error);
      throw error;
    }
  }

  static async getBudgetRequests(): Promise<BudgetRequest[]> {
    try {
      console.log('🔍 กำลังดึงข้อมูลคำขอใช้งบประมาณจาก Firestore...');
      
      // ตรวจสอบว่า db connection ทำงานหรือไม่
      if (!db) {
        throw new Error('Firestore database not initialized');
      }
      
      const querySnapshot = await getDocs(collection(db, 'budgetRequests'));
      console.log('📄 จำนวนคำขอที่พบ:', querySnapshot.docs.length);
      
      const requests = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log('🔍 ข้อมูลดิบจาก Firestore:', data);
        console.log('🔍 request_no:', data.request_no);
        console.log('🔍 requester:', data.requester);
        console.log('🔍 amount:', data.amount);
        console.log('🔍 status:', data.status);
        
        const request = {
          id: doc.id,
          ...data,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at),
          requested_at: data.requested_at ? toISOString(data.requested_at) : undefined
        } as BudgetRequest;
        
        console.log('💰 คำขอใช้งบประมาณที่ประมวลผลแล้ว:', request);
        console.log('💰 request.request_no:', request.request_no);
        return request;
      });
      
      console.log('✅ ส่งคืนข้อมูลคำขอใช้งบประมาณ:', requests);
      return requests;
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการดึงข้อมูลคำขอใช้งบประมาณ:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error');
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      // Return empty array instead of throwing to prevent 400 errors
      return [];
    }
  }

  static async getBudgetRequest(id: string): Promise<BudgetRequest | null> {
    try {
      console.log('🔍 กำลังดึงข้อมูลคำขอใช้งบประมาณ ID:', id);
      
      if (!db) {
        throw new Error('Firestore database not initialized');
      }
      
      const docRef = doc(db, 'budgetRequests', id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        const request = {
          id: docSnap.id,
          ...data,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at),
          requested_at: data.requested_at ? toISOString(data.requested_at) : undefined
        } as BudgetRequest;
        
        console.log('✅ พบข้อมูลคำขอใช้งบประมาณ:', request);
        return request;
      } else {
        console.warn('⚠️ ไม่พบข้อมูลคำขอใช้งบประมาณ ID:', id);
        return null;
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการดึงข้อมูลคำขอใช้งบประมาณ:', error);
      throw error;
    }
  }

  static async updateBudgetRequestStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', approverName?: string, userInfo?: { userId: string; userName: string; userRole: string }): Promise<void> {
    try {
      console.log('🔍 กำลังอัพเดทสถานะคำขอใช้งบประมาณ ID:', id, 'สถานะ:', status);
      
      if (!db) {
        throw new Error('Firestore database not initialized');
      }
      
      const docRef = doc(db, 'budgetRequests', id);
      const updateData: any = {
        status: status,
        updated_at: new Date().toISOString()
      };
      
      if (status === 'APPROVED' || status === 'REJECTED') {
        updateData.approved_at = new Date().toISOString();
        updateData.approver_name = approverName || 'ผู้อนุมัติ';
      }
      
      await updateDoc(docRef, updateData);
      
      console.log('✅ อัพเดทสถานะคำขอใช้งบประมาณสำเร็จ:', id, 'สถานะ:', status);

      // บันทึก logs ถ้ามี userInfo
      if (userInfo) {
        try {
          // ดึงข้อมูลคำขอเพื่อบันทึกใน logs
          const requestSnap = await getDoc(docRef);
          const requestData = requestSnap.data();
          const requestNo = requestData?.request_no || 'Unknown Request';
          const requester = requestData?.requester || 'Unknown Requester';
          const amount = requestData?.amount || 0;

          const action = status === 'APPROVED' ? 'APPROVE_BUDGET_REQUEST' : 'REJECT_BUDGET_REQUEST';
          const description = status === 'APPROVED' 
            ? `อนุมัติคำขอใช้งบประมาณ: ${requestNo}` 
            : `ปฏิเสธคำขอใช้งบประมาณ: ${requestNo}`;
          const severity = status === 'APPROVED' ? 'success' : 'warning';

          await LogService.log(
            userInfo.userId,
            userInfo.userName,
            userInfo.userRole,
            action,
            description,
            'Budget Requests',
            {
              resourceId: id,
              severity: severity,
              metadata: {
                requestNo: requestNo,
                requester: requester,
                amount: amount,
                approverName: approverName || 'ผู้อนุมัติ',
                previousStatus: requestData?.status,
                newStatus: status
              }
            }
          );
          console.log('📝 Budget request status change logged successfully');
        } catch (logError) {
          console.error('❌ Failed to log budget request status change:', logError);
        }
      }
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการอัพเดทสถานะคำขอใช้งบประมาณ:', error);
      throw error;
    }
  }

  static async updateBudgetRequest(id: string, updates: Partial<BudgetRequest>): Promise<void> {
    try {
      const docRef = doc(db, 'budgetRequests', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating budget request:', error);
      throw error;
    }
  }

  static async deleteBudgetRequest(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budgetRequests', id));
    } catch (error) {
      console.error('Error deleting budget request:', error);
      throw error;
    }
  }

  static async getApprovalByRequestId(requestId: string): Promise<Approval | null> {
    try {
      const q = query(
        collection(db, 'approvals'),
        where('request_id', '==', requestId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        created_at: toISOString(doc.data().created_at),
        updated_at: toISOString(doc.data().updated_at),
        approved_at: doc.data().approved_at ? toISOString(doc.data().approved_at) : undefined
      } as Approval;
    } catch (error) {
      console.error('Error fetching approval:', error);
      throw error;
    }
  }

  static async getSettings(): Promise<Settings | null> {
    try {
      const querySnapshot = await getDocs(collection(db, 'appSettings'));
      if (querySnapshot.empty) {
        return null;
      }
      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        created_at: toISOString(doc.data().created_at),
        updated_at: toISOString(doc.data().updated_at)
      } as Settings;
    } catch (error) {
      console.error('Error fetching settings:', error);
      throw error;
    }
  }

  static async saveSettings(settings: Partial<Settings>): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, 'appSettings'));

      if (querySnapshot.empty) {
        await addDoc(collection(db, 'appSettings'), {
          ...settings,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp()
        });
      } else {
        const docRef = doc(db, 'appSettings', querySnapshot.docs[0].id);
        await updateDoc(docRef, {
          ...settings,
          updated_at: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  // Account Codes Management
  static async getAccountCodes(): Promise<AccountCode[]> {
    try {
      const accountCodesRef = collection(db, 'accountCodes');
      const querySnapshot = await getDocs(accountCodesRef);
      
      if (querySnapshot.empty) {
        return [];
      }
      
      const accountCodes = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        } as AccountCode;
      });
      
      return accountCodes;
    } catch (error) {
      console.error('Error getting account codes:', error);
      throw error;
    }
  }





  // Role Management
  static async getRoles(): Promise<any[]> {
    try {
      const rolesRef = collection(db, 'roles');
      const querySnapshot = await getDocs(rolesRef);
      
      if (querySnapshot.empty) {
        return [];
      }
      
      const roles = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data
        };
      });
      
      return roles;
    } catch (error) {
      console.error('Error getting roles:', error);
      throw error;
    }
  }

  static async addRole(roleData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มบทบาทใหม่ใน Firestore:', roleData);
      
      const rolesRef = collection(db, 'roles');
      const now = new Date().toISOString();
      
      await addDoc(rolesRef, {
        ...roleData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มบทบาทใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มบทบาท:', error);
      throw new Error(`ไม่สามารถเพิ่มบทบาทได้: ${error.message}`);
    }
  }

  static async updateRole(roleId: string, roleData: any): Promise<void> {
    try {
      console.log('🔄 กำลังอัปเดตบทบาทใน Firestore:', roleId, roleData);
      
      const roleDocRef = doc(db, 'roles', roleId);
      const updateData = {
        ...roleData,
        updatedAt: new Date().toISOString()
      };
      
      await updateDoc(roleDocRef, updateData);
      console.log('✅ อัปเดตบทบาทใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการอัปเดตบทบาท:', error);
      throw new Error(`ไม่สามารถอัปเดตบทบาทได้: ${error.message}`);
    }
  }

  static async deleteRole(roleId: string): Promise<void> {
    try {
      console.log('🗑️ กำลังลบบทบาทจาก Firestore:', roleId);
      
      const roleDocRef = doc(db, 'roles', roleId);
      await deleteDoc(roleDocRef);
      
      console.log('✅ ลบบทบาทจาก Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการลบบทบาท:', error);
      throw new Error(`ไม่สามารถลบบทบาทได้: ${error.message}`);
    }
  }

  // Add methods for backup/restore functionality
  static async addProduct(productData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มสินค้าใหม่ใน Firestore:', productData);
      
      const productsRef = collection(db, 'products');
      const now = new Date().toISOString();
      
      await addDoc(productsRef, {
        ...productData,
        createdAt: now,
        updatedAt: now
      });
      
      // Check for low stock alert
      if (productData.current_stock <= productData.min_stock) {
        notificationService.showLowStockAlert(
          productData.name,
          productData.current_stock,
          productData.min_stock
        );
      }
      
      // Log security event
      SecurityService.logAuditEvent(
        'system',
        'System',
        'system',
        'create',
        'product',
        undefined,
        `เพิ่มสินค้าใหม่: ${productData.name}`,
        'unknown',
        'unknown'
      );
      
      console.log('✅ เพิ่มสินค้าใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มสินค้า:', error);
      SecurityService.logSecurityEvent('data_modification', 'system', `Failed to add product: ${error.message}`, 'high');
      throw new Error(`ไม่สามารถเพิ่มสินค้าได้: ${error.message}`);
    }
  }

  static async addCategory(categoryData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มหมวดหมู่ใหม่ใน Firestore:', categoryData);
      
      const categoriesRef = collection(db, 'categories');
      const now = new Date().toISOString();
      
      await addDoc(categoriesRef, {
        ...categoryData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มหมวดหมู่ใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มหมวดหมู่:', error);
      throw new Error(`ไม่สามารถเพิ่มหมวดหมู่ได้: ${error.message}`);
    }
  }

  static async addSupplier(supplierData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มผู้จำหน่ายใหม่ใน Firestore:', supplierData);
      
      const suppliersRef = collection(db, 'suppliers');
      const now = new Date().toISOString();
      
      await addDoc(suppliersRef, {
        ...supplierData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มผู้จำหน่ายใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มผู้จำหน่าย:', error);
      throw new Error(`ไม่สามารถเพิ่มผู้จำหน่ายได้: ${error.message}`);
    }
  }

  static async addMovement(movementData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มการเคลื่อนไหวใหม่ใน Firestore:', movementData);
      
      const movementsRef = collection(db, 'movements');
      const now = new Date().toISOString();
      
      await addDoc(movementsRef, {
        ...movementData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มการเคลื่อนไหวใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มการเคลื่อนไหว:', error);
      throw new Error(`ไม่สามารถเพิ่มการเคลื่อนไหวได้: ${error.message}`);
    }
  }

  static async addReceipt(receiptData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มใบรับใหม่ใน Firestore:', receiptData);
      
      const receiptsRef = collection(db, 'receipts');
      const now = new Date().toISOString();
      
      await addDoc(receiptsRef, {
        ...receiptData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มใบรับใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มใบรับ:', error);
      throw new Error(`ไม่สามารถเพิ่มใบรับได้: ${error.message}`);
    }
  }

  static async addWithdrawal(withdrawalData: any): Promise<void> {
    try {
      console.log('➕ กำลังเพิ่มใบเบิกใหม่ใน Firestore:', withdrawalData);
      
      const withdrawalsRef = collection(db, 'withdrawals');
      const now = new Date().toISOString();
      
      await addDoc(withdrawalsRef, {
        ...withdrawalData,
        createdAt: now,
        updatedAt: now
      });
      
      console.log('✅ เพิ่มใบเบิกใหม่ใน Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการเพิ่มใบเบิก:', error);
      throw new Error(`ไม่สามารถเพิ่มใบเบิกได้: ${error.message}`);
    }
  }

  // Create sample account codes for testing
  static async createSampleAccountCodes(): Promise<void> {
    try {
      const sampleAccountCodes = [
        {
          code: '1001',
          name: 'เงินสด',
          description: 'เงินสดในมือ',
          category: 'asset',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          code: '1002',
          name: 'เงินฝากธนาคาร',
          description: 'เงินฝากธนาคารออมทรัพย์',
          category: 'asset',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          code: '2001',
          name: 'เจ้าหนี้การค้า',
          description: 'หนี้สินจากการซื้อสินค้า',
          category: 'liability',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          code: '3001',
          name: 'ทุนจดทะเบียน',
          description: 'ทุนจดทะเบียนบริษัท',
          category: 'equity',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          code: '4001',
          name: 'รายได้จากการขาย',
          description: 'รายได้จากการขายสินค้า',
          category: 'revenue',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        },
        {
          code: '5001',
          name: 'ต้นทุนขาย',
          description: 'ต้นทุนสินค้าที่ขาย',
          category: 'expense',
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system'
        }
      ];

      const accountCodesRef = collection(db, 'accountCodes');
      for (const accountCode of sampleAccountCodes) {
        await addDoc(accountCodesRef, accountCode);
      }
    } catch (error) {
      console.error('Error creating sample account codes:', error);
      throw error;
    }
  }

  static async addAccountCode(accountCode: Omit<AccountCode, 'id'>): Promise<string> {
    try {
      const accountCodesRef = collection(db, 'accountCodes');
      const docRef = await addDoc(accountCodesRef, {
        ...accountCode,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding account code:', error);
      throw error;
    }
  }

  static async updateAccountCode(id: string, accountCode: Partial<AccountCode>): Promise<void> {
    try {
      const accountCodeRef = doc(db, 'accountCodes', id);
      await updateDoc(accountCodeRef, {
        ...accountCode,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating account code:', error);
      throw error;
    }
  }

  static async deleteAccountCode(id: string): Promise<void> {
    try {
      const accountCodeRef = doc(db, 'accountCodes', id);
      await deleteDoc(accountCodeRef);
    } catch (error) {
      console.error('Error deleting account code:', error);
      throw error;
    }
  }

  static async bulkAddAccountCodes(accountCodes: Omit<AccountCode, 'id'>[]): Promise<void> {
    try {
      const batch = writeBatch(db);
      const accountCodesRef = collection(db, 'accountCodes');
      
      accountCodes.forEach(accountCode => {
        const docRef = doc(accountCodesRef);
        batch.set(docRef, accountCode);
      });
      
      await batch.commit();
      console.log(`✅ Bulk added ${accountCodes.length} account codes successfully`);
    } catch (error) {
      console.error('Error bulk adding account codes:', error);
      throw error;
    }
  }

  // Withdrawals
  static async getWithdrawals(limitCount: number = 50): Promise<Withdrawal[]> {
    try {
      const q = query(
        collection(db, 'withdrawals'), 
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const withdrawals = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Withdrawal));
      
      
      return withdrawals;
    } catch (error) {
      console.error('Error getting withdrawals:', error);
      throw error;
    }
  }

  static async createWithdrawal(withdrawal: Omit<Withdrawal, 'id'>): Promise<void> {
    try {
      await addDoc(collection(db, 'withdrawals'), {
        ...withdrawal,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      throw error;
    }
  }

  static async deleteWithdrawal(withdrawalId: string): Promise<void> {
    try {
      const withdrawalRef = doc(db, 'withdrawals', withdrawalId);
      await deleteDoc(withdrawalRef);
      console.log('✅ Withdrawal deleted successfully:', withdrawalId);
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      throw error;
    }
  }

  // Receipts
  static async getReceipts(limitCount: number = 50): Promise<Receipt[]> {
    try {
      const q = query(
        collection(db, 'receipts'), 
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
      const querySnapshot = await getDocs(q);
      const receipts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Receipt));
      
      console.log('📥 getReceipts result:', {
        count: receipts.length,
        receipts: receipts.map(r => ({
          id: r.id,
          receipt_no: r.receipt_no,
          receipt_date: r.receipt_date,
          created_at: r.created_at,
          items_count: r.items?.length || 0
        }))
      });
      
      return receipts;
    } catch (error) {
      console.error('Error getting receipts:', error);
      throw error;
    }
  }

  static async createReceipt(receipt: Omit<Receipt, 'id'>): Promise<void> {
    try {
      const now = new Date().toISOString();
      await addDoc(collection(db, 'receipts'), {
        ...receipt,
        created_at: now,
        updated_at: now
      });
      console.log('✅ Receipt created successfully with timestamp:', now);
    } catch (error) {
      console.error('Error creating receipt:', error);
      throw error;
    }
  }

  static async deleteReceipt(receiptId: string): Promise<void> {
    try {
      const receiptRef = doc(db, 'receipts', receiptId);
      await deleteDoc(receiptRef);
      console.log('✅ Receipt deleted successfully:', receiptId);
    } catch (error) {
      console.error('Error deleting receipt:', error);
      throw error;
    }
  }

  // Logging methods
  static async logProductAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    productId: string,
    productName: string,
    userInfo: { userId: string; userName: string; userRole: string }
  ): Promise<void> {
    try {
      if (action === 'CREATE') {
        await LogService.logCreate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'PRODUCT',
          productId,
          `เพิ่มสินค้าใหม่: ${productName}`
        );
      } else if (action === 'UPDATE') {
        await LogService.logUpdate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'PRODUCT',
          productId,
          `แก้ไขสินค้า: ${productName}`
        );
      } else if (action === 'DELETE') {
        await LogService.logDelete(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'PRODUCT',
          productId,
          `ลบสินค้า: ${productName}`
        );
      }
    } catch (error) {
      console.error('Failed to log product action:', error);
    }
  }

  static async logCategoryAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    categoryId: string,
    categoryName: string,
    userInfo: { userId: string; userName: string; userRole: string }
  ): Promise<void> {
    try {
      if (action === 'CREATE') {
        await LogService.logCreate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'CATEGORY',
          categoryId,
          `เพิ่มหมวดหมู่ใหม่: ${categoryName}`
        );
      } else if (action === 'UPDATE') {
        await LogService.logUpdate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'CATEGORY',
          categoryId,
          `แก้ไขหมวดหมู่: ${categoryName}`
        );
      } else if (action === 'DELETE') {
        await LogService.logDelete(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'CATEGORY',
          categoryId,
          `ลบหมวดหมู่: ${categoryName}`
        );
      }
    } catch (error) {
      console.error('Failed to log category action:', error);
    }
  }

  static async logSupplierAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    supplierId: string,
    supplierName: string,
    userInfo: { userId: string; userName: string; userRole: string }
  ): Promise<void> {
    try {
      if (action === 'CREATE') {
        await LogService.logCreate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'SUPPLIER',
          supplierId,
          `เพิ่มผู้จำหน่ายใหม่: ${supplierName}`
        );
      } else if (action === 'UPDATE') {
        await LogService.logUpdate(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'SUPPLIER',
          supplierId,
          `แก้ไขผู้จำหน่าย: ${supplierName}`
        );
      } else if (action === 'DELETE') {
        await LogService.logDelete(
          userInfo.userId,
          userInfo.userName,
          userInfo.userRole,
          'SUPPLIER',
          supplierId,
          `ลบผู้จำหน่าย: ${supplierName}`
        );
      }
    } catch (error) {
      console.error('Failed to log supplier action:', error);
    }
  }

  static async logUserAction(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    userId: string,
    userName: string,
    adminInfo: { userId: string; userName: string; userRole: string }
  ): Promise<void> {
    try {
      if (action === 'CREATE') {
        await LogService.logCreate(
          adminInfo.userId,
          adminInfo.userName,
          adminInfo.userRole,
          'USER',
          userId,
          `เพิ่มผู้ใช้ใหม่: ${userName}`
        );
      } else if (action === 'UPDATE') {
        await LogService.logUpdate(
          adminInfo.userId,
          adminInfo.userName,
          adminInfo.userRole,
          'USER',
          userId,
          `แก้ไขผู้ใช้: ${userName}`
        );
      } else if (action === 'DELETE') {
        await LogService.logDelete(
          adminInfo.userId,
          adminInfo.userName,
          adminInfo.userRole,
          'USER',
          userId,
          `ลบผู้ใช้: ${userName}`
        );
      }
    } catch (error) {
      console.error('Failed to log user action:', error);
    }
  }
}

export const firestoreService = new FirestoreService();