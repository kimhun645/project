import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api, type Product, type Category, type Supplier, type Movement } from '@/lib/apiService';

interface SearchState {
  query: string;
  filters: {
    category?: string;
    supplier?: string;
    stockLevel?: 'all' | 'high' | 'medium' | 'low' | 'out';
    dateRange?: {
      start: string;
      end: string;
    };
    type?: 'all' | 'products' | 'movements' | 'categories' | 'suppliers';
  };
  results: {
    products: Product[];
    categories: Category[];
    suppliers: Supplier[];
    movements: Movement[];
  };
  suggestions: string[];
  isSearching: boolean;
  hasSearched: boolean;
  totalResults: number;
}

type SearchAction =
  | { type: 'SET_QUERY'; payload: string }
  | { type: 'SET_FILTER'; payload: { key: string; value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_RESULTS'; payload: any }
  | { type: 'SET_SUGGESTIONS'; payload: string[] }
  | { type: 'SET_SEARCHING'; payload: boolean }
  | { type: 'CLEAR_SEARCH' }
  | { type: 'RESET_SEARCH' };

const initialState: SearchState = {
  query: '',
  filters: {
    category: undefined,
    supplier: undefined,
    stockLevel: 'all',
    dateRange: undefined,
    type: 'all'
  },
  results: {
    products: [],
    categories: [],
    suppliers: [],
    movements: []
  },
  suggestions: [],
  isSearching: false,
  hasSearched: false,
  totalResults: 0
};

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'SET_QUERY':
      return { ...state, query: action.payload };
    
    case 'SET_FILTER':
      return {
        ...state,
        filters: { ...state.filters, [action.payload.key]: action.payload.value }
      };
    
    case 'CLEAR_FILTERS':
      return {
        ...state,
        filters: {
          category: undefined,
          supplier: undefined,
          stockLevel: 'all',
          dateRange: undefined,
          type: 'all'
        }
      };
    
    case 'SET_RESULTS':
      const results = action.payload;
      const totalResults = results.products.length + results.categories.length + 
                          results.suppliers.length + results.movements.length;
      return {
        ...state,
        results,
        totalResults,
        hasSearched: true,
        isSearching: false
      };
    
    case 'SET_SUGGESTIONS':
      return { ...state, suggestions: action.payload };
    
    case 'SET_SEARCHING':
      return { ...state, isSearching: action.payload };
    
    case 'CLEAR_SEARCH':
      return {
        ...state,
        query: '',
        results: { products: [], categories: [], suppliers: [], movements: [] },
        suggestions: [],
        hasSearched: false,
        totalResults: 0
      };
    
    case 'RESET_SEARCH':
      return initialState;
    
    default:
      return state;
  }
}

interface SearchContextType {
  state: SearchState;
  search: (query: string) => Promise<void>;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  clearSearch: () => void;
  resetSearch: () => void;
  getSuggestions: (query: string) => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export function SearchProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(searchReducer, initialState);

  const search = async (query?: string) => {
    const searchQuery = query || state.query;
    if (!searchQuery.trim()) {
      dispatch({ type: 'CLEAR_SEARCH' });
      return;
    }

    dispatch({ type: 'SET_QUERY', payload: searchQuery });
    dispatch({ type: 'SET_SEARCHING', payload: true });

    try {
      const { filters } = state;
      const searchPromises = [];

      // Search products
      if (filters.type === 'all' || filters.type === 'products') {
        searchPromises.push(
          FirestoreService.getProducts().then(products => {
            return products.filter(product => 
              product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
              product.supplier.toLowerCase().includes(searchQuery.toLowerCase())
            );
          })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      // Search categories
      if (filters.type === 'all' || filters.type === 'categories') {
        searchPromises.push(
          FirestoreService.getCategories().then(categories => {
            return categories.filter(category =>
              category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              category.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      // Search suppliers
      if (filters.type === 'all' || filters.type === 'suppliers') {
        searchPromises.push(
          FirestoreService.getSuppliers().then(suppliers => {
            return suppliers.filter(supplier =>
              supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              supplier.contact?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              supplier.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              supplier.phone?.toLowerCase().includes(searchQuery.toLowerCase())
            );
          })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      // Search movements
      if (filters.type === 'all' || filters.type === 'movements') {
        searchPromises.push(
          FirestoreService.getMovements().then(movements => {
            return movements.filter(movement =>
              movement.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
              movement.reference?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              movement.type.toLowerCase().includes(searchQuery.toLowerCase())
            );
          })
        );
      } else {
        searchPromises.push(Promise.resolve([]));
      }

      const [products, categories, suppliers, movements] = await Promise.all(searchPromises);

      // Apply additional filters
      let filteredProducts = products;
      let filteredMovements = movements;

      if (filters.category) {
        filteredProducts = filteredProducts.filter(p => p.category === filters.category);
      }

      if (filters.supplier) {
        filteredProducts = filteredProducts.filter(p => p.supplier === filters.supplier);
      }

      if (filters.stockLevel && filters.stockLevel !== 'all') {
        filteredProducts = filteredProducts.filter(p => {
          const stock = p.current_stock;
          const minStock = p.min_stock;
          
          switch (filters.stockLevel) {
            case 'high':
              return stock > minStock * 2;
            case 'medium':
              return stock > minStock && stock <= minStock * 2;
            case 'low':
              return stock <= minStock && stock > 0;
            case 'out':
              return stock === 0;
            default:
              return true;
          }
        });
      }

      if (filters.dateRange) {
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        filteredMovements = filteredMovements.filter(m => {
          const movementDate = new Date(m.created_at);
          return movementDate >= startDate && movementDate <= endDate;
        });
      }

      dispatch({
        type: 'SET_RESULTS',
        payload: {
          products: filteredProducts,
          categories,
          suppliers,
          movements: filteredMovements
        }
      });

    } catch (error) {
      console.error('Search error:', error);
      dispatch({ type: 'SET_SEARCHING', payload: false });
    }
  };

  const setFilter = (key: string, value: any) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  };

  const clearFilters = () => {
    dispatch({ type: 'CLEAR_FILTERS' });
  };

  const clearSearch = () => {
    dispatch({ type: 'CLEAR_SEARCH' });
  };

  const resetSearch = () => {
    dispatch({ type: 'RESET_SEARCH' });
  };

  const getSuggestions = async (query: string) => {
    if (!query.trim()) {
      dispatch({ type: 'SET_SUGGESTIONS', payload: [] });
      return;
    }

    try {
      const suggestions: string[] = [];
      
      // Get product suggestions
      const { FirestoreService } = await import('@/lib/firestoreService');
      const products = await FirestoreService.getProducts();
      const productSuggestions = products
        .filter(p => p.name.toLowerCase().includes(query.toLowerCase()))
        .map(p => p.name)
        .slice(0, 3);
      suggestions.push(...productSuggestions);

      // Get category suggestions
      const categories = await FirestoreService.getCategories();
      const categorySuggestions = categories
        .filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
        .map(c => c.name)
        .slice(0, 2);
      suggestions.push(...categorySuggestions);

      // Get supplier suggestions
      const suppliers = await FirestoreService.getSuppliers();
      const supplierSuggestions = suppliers
        .filter(s => s.name.toLowerCase().includes(query.toLowerCase()))
        .map(s => s.name)
        .slice(0, 2);
      suggestions.push(...supplierSuggestions);

      dispatch({ type: 'SET_SUGGESTIONS', payload: [...new Set(suggestions)] });
    } catch (error) {
      console.error('Suggestions error:', error);
    }
  };

  return (
    <SearchContext.Provider value={{
      state,
      search,
      setFilter,
      clearFilters,
      clearSearch,
      resetSearch,
      getSuggestions
    }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}
