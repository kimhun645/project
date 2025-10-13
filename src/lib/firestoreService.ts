import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

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
  product_name?: string;
  sku?: string;
  created_at: string;
  updated_at: string;
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
  static async getProducts(): Promise<Product[]> {
    try {
      const productsRef = collection(db, 'products');
      const snapshot = await getDocs(productsRef);

      const products = snapshot.docs.map(doc => {
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
      });

      return products;
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
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

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const productsRef = collection(db, 'products');
      const docRef = await addDoc(productsRef, {
        ...product,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const newProduct = await this.getProduct(docRef.id);
      if (!newProduct) throw new Error('Failed to create product');

      return newProduct;
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<void> {
    try {
      const docRef = doc(db, 'products', id);
      await updateDoc(docRef, {
        ...product,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      if (!id) {
        throw new Error('Product ID is required');
      }
      const docRef = doc(db, 'products', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  static async getCategories(): Promise<Category[]> {
    try {
      const categoriesRef = collection(db, 'categories');
      const snapshot = await getDocs(categoriesRef);

      return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description,
          is_medicine: data.is_medicine || false,
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Category;
      });
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

  static async deleteUser(userId: string): Promise<void> {
    try {
      console.log('🗑️ กำลังลบผู้ใช้จาก Firestore ด้วย firestoreService:', userId);
      console.log('🔍 ตรวจสอบ userId:', userId);
      console.log('🔍 ตรวจสอบ db instance:', db);
      
      const userDocRef = doc(db, 'users', userId);
      console.log('🔍 ตรวจสอบ userDocRef:', userDocRef);
      
      await deleteDoc(userDocRef);
      console.log('✅ ลบผู้ใช้จาก Firestore สำเร็จ');
    } catch (error: any) {
      console.error('❌ ข้อผิดพลาดในการลบผู้ใช้จาก Firestore:', error);
      console.error('❌ Error code:', error.code);
      console.error('❌ Error message:', error.message);
      throw new Error(`ไม่สามารถลบผู้ใช้ได้: ${error.message}`);
    }
  }


  static async createBudgetRequest(requestData: any): Promise<any> {
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
      
      return {
        id: docRef.id,
        ...requestDoc
      };
    } catch (error) {
      console.error('❌ ข้อผิดพลาดในการสร้างคำขอใช้งบประมาณ:', error);
      throw error;
    }
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
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

      return newCategory;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, category: Partial<Category>): Promise<void> {
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

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    try {
      const suppliersRef = collection(db, 'suppliers');
      const docRef = await addDoc(suppliersRef, {
        ...supplier,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const newSupplier = {
        id: docRef.id,
        ...supplier,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      return newSupplier;
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      await updateDoc(docRef, {
        ...supplier,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  static async deleteSupplier(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'suppliers', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  static async getMovements(): Promise<Movement[]> {
    try {
      const movementsRef = collection(db, 'stock_movements');
      const q = query(movementsRef, orderBy('created_at', 'desc'), limit(100));
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

  static async createMovement(movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement> {
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

      return newMovement;
    } catch (error) {
      console.error('Error creating movement:', error);
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

  static async updateBudgetRequestStatus(id: string, status: 'PENDING' | 'APPROVED' | 'REJECTED', approverName?: string): Promise<void> {
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
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AccountCode));
    } catch (error) {
      console.error('Error getting account codes:', error);
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
}

export const firestoreService = FirestoreService;