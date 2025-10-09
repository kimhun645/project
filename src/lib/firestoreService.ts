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
  request_number: string;
  title: string;
  description?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string;
  requested_at: string;
  created_at: string;
  updated_at: string;
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
          created_at: toISOString(data.created_at),
          updated_at: toISOString(data.updated_at)
        } as Category;
      });
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    try {
      const categoriesRef = collection(db, 'categories');
      const docRef = await addDoc(categoriesRef, {
        ...category,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      const newCategory = {
        id: docRef.id,
        ...category,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
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
      await updateDoc(docRef, {
        ...category,
        updated_at: serverTimestamp()
      });
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
      const querySnapshot = await getDocs(collection(db, 'budget_requests'));
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        created_at: toISOString(doc.data().created_at),
        updated_at: toISOString(doc.data().updated_at),
        requested_at: toISOString(doc.data().requested_at)
      } as BudgetRequest));
    } catch (error) {
      console.error('Error fetching budget requests:', error);
      throw error;
    }
  }

  static async updateBudgetRequest(id: string, updates: Partial<BudgetRequest>): Promise<void> {
    try {
      const docRef = doc(db, 'budget_requests', id);
      await updateDoc(docRef, {
        ...updates,
        updated_at: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating budget request:', error);
      throw error;
    }
  }

  static async deleteBudgetRequest(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'budget_requests', id));
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
}

export const firestoreService = FirestoreService;