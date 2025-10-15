// API Service using Firebase Firestore directly
import { Category, Product, Supplier, Movement, BudgetRequest, User, AccountCode } from './types';

console.log('🔗 Using Firebase Firestore directly');

export class ApiService {
  // Categories - Use Firebase Firestore directly
  static async getCategories(): Promise<Category[]> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.getCategories();
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  static async createCategory(category: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.createCategory(category);
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  static async updateCategory(id: string, category: Partial<Category>): Promise<Category> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.updateCategory(id, category);
      return { id, ...category } as Category;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  static async deleteCategory(id: string): Promise<void> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Products - Use Firebase Firestore directly
  static async getProducts(): Promise<Product[]> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.getProducts();
    } catch (error) {
      console.error('Error getting products:', error);
      return [];
    }
  }

  static async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.createProduct(product);
    } catch (error) {
      console.error('Error creating product:', error);
      throw error;
    }
  }

  static async updateProduct(id: string, product: Partial<Product>): Promise<Product> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.updateProduct(id, product);
      return { id, ...product } as Product;
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  }

  static async deleteProduct(id: string): Promise<void> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.deleteProduct(id);
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  }

  // Suppliers - Use Firebase Firestore directly
  static async getSuppliers(): Promise<Supplier[]> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.getSuppliers();
    } catch (error) {
      console.error('Error getting suppliers:', error);
      return [];
    }
  }

  static async createSupplier(supplier: Omit<Supplier, 'id' | 'created_at' | 'updated_at'>): Promise<Supplier> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.createSupplier(supplier);
    } catch (error) {
      console.error('Error creating supplier:', error);
      throw error;
    }
  }

  static async updateSupplier(id: string, supplier: Partial<Supplier>): Promise<Supplier> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.updateSupplier(id, supplier);
      return { id, ...supplier } as Supplier;
    } catch (error) {
      console.error('Error updating supplier:', error);
      throw error;
    }
  }

  static async deleteSupplier(id: string): Promise<void> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      await FirestoreService.deleteSupplier(id);
    } catch (error) {
      console.error('Error deleting supplier:', error);
      throw error;
    }
  }

  // Movements - Use Firebase Firestore directly
  static async getMovements(): Promise<Movement[]> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.getMovements();
    } catch (error) {
      console.error('Error getting movements:', error);
      return [];
    }
  }

  static async createMovement(movement: Omit<Movement, 'id' | 'created_at' | 'updated_at'>): Promise<Movement> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.createMovement(movement);
    } catch (error) {
      console.error('Error creating movement:', error);
      throw error;
    }
  }

  // Budget Requests - Use Firebase Firestore directly
  static async getBudgetRequests(): Promise<BudgetRequest[]> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.getBudgetRequests();
    } catch (error) {
      console.error('Error getting budget requests:', error);
      return [];
    }
  }

  static async createBudgetRequest(budgetRequest: Omit<BudgetRequest, 'id' | 'created_at' | 'updated_at'>): Promise<BudgetRequest> {
    try {
      const { FirestoreService } = await import('./FirestoreService');
      return await FirestoreService.createBudgetRequest(budgetRequest);
    } catch (error) {
      console.error('Error creating budget request:', error);
      throw error;
    }
  }
}

// Export the API service
export const api = ApiService;

// Export auth for compatibility
export const auth = {
  setFirebaseIdToken: (token: string | null) => {
    console.log('Firebase ID Token set:', token ? 'Yes' : 'No');
  }
};
