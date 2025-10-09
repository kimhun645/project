import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDB extends DBSchema {
  products: {
    key: string;
    value: any;
  };
  categories: {
    key: string;
    value: any;
  };
  suppliers: {
    key: string;
    value: any;
  };
  movements: {
    key: string;
    value: any;
  };
  pendingActions: {
    key: string;
    value: {
      id: string;
      type: 'create' | 'update' | 'delete';
      table: string;
      data: any;
      timestamp: number;
    };
  };
}

class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: Array<{ id: string; type: string; table: string; data: any }> = [];

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    try {
      this.db = await openDB<OfflineDB>('stock-scribe-offline', 1, {
        upgrade(db) {
          // Create object stores
          if (!db.objectStoreNames.contains('products')) {
            db.createObjectStore('products', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('categories')) {
            db.createObjectStore('categories', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('suppliers')) {
            db.createObjectStore('suppliers', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('movements')) {
            db.createObjectStore('movements', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('pendingActions')) {
            db.createObjectStore('pendingActions', { keyPath: 'id' });
          }
        },
      });
      console.log('✅ Offline database initialized');
    } catch (error) {
      console.error('❌ Failed to initialize offline database:', error);
    }
  }

  private setupEventListeners() {
    // Online/Offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingActions();
      console.log('🌐 Back online - syncing pending actions');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('📴 Gone offline - using cached data');
    });

    // Service Worker events
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data.type === 'CACHE_UPDATED') {
          this.handleCacheUpdate(event.data);
        }
      });
    }
  }

  // Cache data for offline use
  async cacheData(table: string, data: any[]) {
    if (!this.db) return;

    try {
      const tx = this.db.transaction(table, 'readwrite');
      const store = tx.objectStore(table);
      
      // Clear existing data
      await store.clear();
      
      // Add new data
      for (const item of data) {
        await store.add(item);
      }
      
      console.log(`✅ Cached ${data.length} items to ${table}`);
    } catch (error) {
      console.error(`❌ Failed to cache data to ${table}:`, error);
    }
  }

  // Get cached data
  async getCachedData(table: string): Promise<any[]> {
    if (!this.db) return [];

    try {
      const tx = this.db.transaction(table, 'readonly');
      const store = tx.objectStore(table);
      const data = await store.getAll();
      return data;
    } catch (error) {
      console.error(`❌ Failed to get cached data from ${table}:`, error);
      return [];
    }
  }

  // Add pending action for sync
  async addPendingAction(type: 'create' | 'update' | 'delete', table: string, data: any) {
    if (!this.db) return;

    const action = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      table,
      data,
      timestamp: Date.now()
    };

    try {
      const tx = this.db.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      await store.add(action);
      
      console.log(`📝 Added pending action: ${type} ${table}`);
      
      // Try to sync immediately if online
      if (this.isOnline) {
        this.syncPendingActions();
      }
    } catch (error) {
      console.error('❌ Failed to add pending action:', error);
    }
  }

  // Sync pending actions when back online
  async syncPendingActions() {
    if (!this.db || !this.isOnline) return;

    try {
      const tx = this.db.transaction('pendingActions', 'readwrite');
      const store = tx.objectStore('pendingActions');
      const pendingActions = await store.getAll();

      console.log(`🔄 Syncing ${pendingActions.length} pending actions`);

      for (const action of pendingActions) {
        try {
          await this.syncAction(action);
          
          // Remove from pending actions after successful sync
          await store.delete(action.id);
          console.log(`✅ Synced action: ${action.type} ${action.table}`);
        } catch (error) {
          console.error(`❌ Failed to sync action ${action.id}:`, error);
        }
      }
    } catch (error) {
      console.error('❌ Failed to sync pending actions:', error);
    }
  }

  // Sync individual action
  private async syncAction(action: any) {
    // This would make actual API calls
    // For now, just simulate the sync
    console.log(`Syncing ${action.type} to ${action.table}:`, action.data);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Handle cache updates from service worker
  private handleCacheUpdate(data: any) {
    console.log('📦 Cache updated:', data);
    // Handle cache updates
  }

  // Check if data is available offline
  async isDataAvailableOffline(table: string): Promise<boolean> {
    if (!this.db) return false;

    try {
      const tx = this.db.transaction(table, 'readonly');
      const store = tx.objectStore(table);
      const count = await store.count();
      return count > 0;
    } catch (error) {
      return false;
    }
  }

  // Get offline status
  getOfflineStatus() {
    return {
      isOnline: this.isOnline,
      hasPendingActions: this.syncQueue.length > 0
    };
  }

  // Clear all cached data
  async clearCache() {
    if (!this.db) return;

    try {
      const tables = ['products', 'categories', 'suppliers', 'movements', 'pendingActions'];
      
      for (const table of tables) {
        const tx = this.db.transaction(table, 'readwrite');
        const store = tx.objectStore(table);
        await store.clear();
      }
      
      console.log('🗑️ Cleared all cached data');
    } catch (error) {
      console.error('❌ Failed to clear cache:', error);
    }
  }
}

// Create singleton instance
export const offlineManager = new OfflineManager();

// Export types
export type { OfflineDB };
