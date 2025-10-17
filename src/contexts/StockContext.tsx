import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { StockStats, StockFilter } from '@/types/stock';
import { api, type Product, type Category, type Supplier, type Movement as StockMovement } from '@/lib/apiService';
import { useAuth } from './AuthContext';

interface StockState {
  products: Product[];
  movements: StockMovement[];
  categories: Category[];
  suppliers: Supplier[];
  receipts: any[];
  withdrawals: any[];
  stats: StockStats;
  filter: StockFilter;
  loading: boolean;
}

type StockAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_SUPPLIERS'; payload: Supplier[] }
  | { type: 'SET_MOVEMENTS'; payload: StockMovement[] }
  | { type: 'SET_RECEIPTS'; payload: any[] }
  | { type: 'SET_WITHDRAWALS'; payload: any[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_MOVEMENT'; payload: StockMovement }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'ADD_SUPPLIER'; payload: Supplier }
  | { type: 'SET_FILTER'; payload: StockFilter }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CALCULATE_STATS' };

const initialState: StockState = {
  products: [],
  movements: [],
  categories: [],
  suppliers: [],
  receipts: [],
  withdrawals: [],
  stats: {
    totalProducts: 0,
    totalValue: 0,
    lowStockItems: 0,
    outOfStockItems: 0,
    recentMovements: 0,
  },
  filter: {},
  loading: false,
};


function calculateStats(products: Product[], movements: StockMovement[]): StockStats {
  const totalProducts = products.length;
  const totalValue = products.reduce((sum, product) => sum + ((product.current_stock || 0) * (product.unit_price || 0)), 0);
  const lowStockItems = products.filter(p => (p.current_stock || 0) <= (p.min_stock || 0) && (p.current_stock || 0) > 0).length;
  const outOfStockItems = products.filter(p => (p.current_stock || 0) === 0).length;
  const recentMovements = movements.filter(m => {
    const movementDate = new Date(m.created_at || '');  // Supabase format
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return movementDate >= oneWeekAgo;
  }).length;

  return {
    totalProducts,
    totalValue,
    lowStockItems,
    outOfStockItems,
    recentMovements,
  };
}

function stockReducer(state: StockState, action: StockAction): StockState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_SUPPLIERS':
      return { ...state, suppliers: action.payload };
    case 'SET_MOVEMENTS':
      return { ...state, movements: action.payload };
    case 'SET_RECEIPTS':
      return { ...state, receipts: action.payload };
    case 'SET_WITHDRAWALS':
      return { ...state, withdrawals: action.payload };
    case 'ADD_PRODUCT':
      return {
        ...state,
        products: [...state.products, action.payload],
      };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'ADD_MOVEMENT': {
      const updatedProducts = state.products.map(product => {
        if (product.id === action.payload.product_id) {
          const newStock = action.payload.type === 'in' 
            ? (product.current_stock || 0) + action.payload.quantity
            : action.payload.type === 'out'
            ? Math.max(0, (product.current_stock || 0) - action.payload.quantity)
            : action.payload.quantity;
          
          return {
            ...product,
            current_stock: newStock,
            updated_at: new Date().toISOString(),
          };
        }
        return product;
      });
      
      return {
        ...state,
        products: updatedProducts,
        movements: [action.payload, ...state.movements],
      };
    }
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'ADD_SUPPLIER':
      return {
        ...state,
        suppliers: [...state.suppliers, action.payload],
      };
    case 'SET_FILTER':
      return {
        ...state,
        filter: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'CALCULATE_STATS':
      return {
        ...state,
        stats: calculateStats(state.products, state.movements),
      };
    default:
      return state;
  }
}

interface StockContextValue extends StockState {
  addProduct: (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addStockMovement: (movement: Omit<StockMovement, 'id' | 'created_at'>) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  setFilter: (filter: StockFilter) => void;
  getFilteredProducts: () => Product[];
  getStockLevel: (product: Product) => 'high' | 'medium' | 'low' | 'out';
  refreshData: () => Promise<void>;
}

const StockContext = createContext<StockContextValue | undefined>(undefined);

export function StockProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(stockReducer, initialState);
  const { currentUser } = useAuth();

  // Load data from database
  const refreshData = async () => {
    if (!currentUser) {
      console.log('User not authenticated, skipping data load');
      return;
    }

    console.log('🔄 เริ่มโหลดข้อมูลจาก Firestore...');
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const { FirestoreService } = await import('@/lib/firestoreService');
      
      // Load products
      console.log('📦 กำลังโหลดข้อมูลสินค้า...');
      const products = await FirestoreService.getProducts();
      console.log('📦 Products loaded:', products.length);
      console.log('📦 Products sample:', products.slice(0, 2)); // แสดงตัวอย่างข้อมูล
      dispatch({ type: 'SET_PRODUCTS', payload: products });

      // Load categories
      console.log('📁 กำลังโหลดข้อมูลหมวดหมู่...');
      const categories = await FirestoreService.getCategories();
      console.log('📁 Categories loaded:', categories.length);
      dispatch({ type: 'SET_CATEGORIES', payload: categories });

      // Load suppliers
      console.log('🏢 กำลังโหลดข้อมูลผู้จัดหา...');
      const suppliers = await FirestoreService.getSuppliers();
      console.log('🏢 Suppliers loaded:', suppliers.length);
      dispatch({ type: 'SET_SUPPLIERS', payload: suppliers });

      // Load movements
      console.log('🔄 กำลังโหลดข้อมูลการเคลื่อนไหว...');
      const movements = await FirestoreService.getMovements();
      console.log('🔄 Movements loaded:', movements.length);

      // Load withdrawals
      console.log('📤 กำลังโหลดข้อมูลการเบิก...');
      const withdrawals = await FirestoreService.getWithdrawals();
      console.log('📤 Withdrawals loaded:', withdrawals.length);

      // Load receipts  
      console.log('📥 กำลังโหลดข้อมูลการรับ...');
      const receipts = await FirestoreService.getReceipts();
      console.log('📥 Receipts loaded:', receipts.length);

      // รวมข้อมูล withdrawals และ receipts เป็น movements
      const withdrawalMovements = withdrawals.flatMap(w => 
        w.items?.map(item => ({
          id: `${w.id}_${item.id}`,
          product_id: item.product_id,
          type: 'out' as const,
          quantity: item.quantity,
          reason: `${w.purpose} - ${item.reason}`,
          created_at: w.created_at || w.withdrawal_date || new Date().toISOString(),
          created_by: w.requester_name || 'ไม่ระบุ'
        })) || []
      );

      const receiptMovements = receipts.flatMap(r => 
        r.items?.map(item => ({
          id: `${r.id}_${item.id}`,
          product_id: item.product_id,
          type: 'in' as const,
          quantity: item.quantity,
          reason: `${r.notes} - ${item.supplier}`,
          created_at: r.created_at || r.receipt_date || new Date().toISOString(),
          created_by: r.receiver_name || 'ไม่ระบุ'
        })) || []
      );

      const combinedMovements = [
        ...movements,
        ...withdrawalMovements,
        ...receiptMovements
      ];

      dispatch({ type: 'SET_MOVEMENTS', payload: combinedMovements });
      dispatch({ type: 'SET_RECEIPTS', payload: receipts });
      dispatch({ type: 'SET_WITHDRAWALS', payload: withdrawals });
      console.log('🔄 Combined movements:', combinedMovements.length);
      
      // สรุปข้อมูลที่โหลดได้
      console.log('✅ สรุปข้อมูลที่โหลดได้:', {
        products: products.length,
        categories: categories.length,
        suppliers: suppliers.length,
        movements: combinedMovements.length,
        withdrawals: withdrawals.length,
        receipts: receipts.length
      });

    } catch (error) {
      console.error('❌ Error loading data:', error);
      
      // แสดงข้อผิดพลาดที่เฉพาะเจาะจง
      if (error.code === 'permission-denied') {
        console.error('🚫 ไม่มีสิทธิ์เข้าถึงข้อมูล Firestore');
      } else if (error.code === 'unavailable') {
        console.error('🌐 ไม่สามารถเชื่อมต่อ Firestore ได้');
      } else if (error.code === 'deadline-exceeded') {
        console.error('⏰ การเชื่อมต่อหมดเวลา');
      } else {
        console.error('💥 ข้อผิดพลาดอื่น:', error.message);
      }
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  useEffect(() => {
    console.log('🔐 Auth state changed:', { currentUser: !!currentUser, email: currentUser?.email });
    if (currentUser) {
      console.log('✅ User authenticated, loading data...');
      refreshData();
    } else {
      console.log('❌ User not authenticated, clearing data...');
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: [] });
      dispatch({ type: 'SET_SUPPLIERS', payload: [] });
      dispatch({ type: 'SET_MOVEMENTS', payload: [] });
    }
  }, [currentUser]);

  useEffect(() => {
    dispatch({ type: 'CALCULATE_STATS' });
  }, [state.products, state.movements]);

  const addProduct = (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
    const product: Product = {
      ...productData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: product });
  };

  const updateProduct = (product: Product) => {
    dispatch({ type: 'UPDATE_PRODUCT', payload: { ...product, updated_at: new Date().toISOString() } });
  };

  const deleteProduct = (id: string) => {
    dispatch({ type: 'DELETE_PRODUCT', payload: id });
  };

  const addStockMovement = (movementData: Omit<StockMovement, 'id' | 'created_at'>) => {
    const movement: StockMovement = {
      ...movementData,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
    };
    dispatch({ type: 'ADD_MOVEMENT', payload: movement });
  };

  const addCategory = (categoryData: Omit<Category, 'id'>) => {
    const category: Category = {
      ...categoryData,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: category });
  };

  const addSupplier = (supplierData: Omit<Supplier, 'id'>) => {
    const supplier: Supplier = {
      ...supplierData,
      id: Date.now().toString(),
    };
    dispatch({ type: 'ADD_SUPPLIER', payload: supplier });
  };

  const setFilter = (filter: StockFilter) => {
    dispatch({ type: 'SET_FILTER', payload: filter });
  };

  const getStockLevel = (product: Product): 'high' | 'medium' | 'low' | 'out' => {
    if ((product.current_stock || 0) === 0) return 'out';
    if ((product.current_stock || 0) <= (product.min_stock || 0)) return 'low';
    if ((product.current_stock || 0) <= (product.min_stock || 0) * 2) return 'medium';
    return 'high';
  };

  const getFilteredProducts = () => {
    let filtered = [...state.products];

    if (state.filter.searchTerm) {
      const searchLower = state.filter.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchLower) ||
        product.sku.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower)
      );
    }

    if (state.filter.category) {
      filtered = filtered.filter(product => product.category_id === state.filter.category);
    }

    if (state.filter.supplier) {
      filtered = filtered.filter(product => product.supplier_id === state.filter.supplier);
    }

    if (state.filter.stockLevel) {
      filtered = filtered.filter(product => getStockLevel(product) === state.filter.stockLevel);
    }

    return filtered;
  };

  return (
    <StockContext.Provider
      value={{
        ...state,
        addProduct,
        updateProduct,
        deleteProduct,
        addStockMovement,
        addCategory,
        addSupplier,
        setFilter,
        getFilteredProducts,
        refreshData,
        getStockLevel,
      }}
    >
      {children}
    </StockContext.Provider>
  );
}

export function useStock() {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
}