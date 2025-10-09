// Performance optimization utilities
export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private cache = new Map<string, any>();
  private debounceTimers = new Map<string, NodeJS.Timeout>();
  private throttleTimers = new Map<string, boolean>();

  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      if (this.throttleTimers.get(key)) {
        return;
      }

      this.throttleTimers.set(key, true);
      func(...args);

      setTimeout(() => {
        this.throttleTimers.set(key, false);
      }, delay);
    };
  }

  // Memoize function results
  memoize<T extends (...args: any[]) => any>(
    func: T,
    keyGenerator?: (...args: Parameters<T>) => string
  ): T {
    return ((...args: Parameters<T>) => {
      const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
      
      if (this.cache.has(key)) {
        return this.cache.get(key);
      }

      const result = func(...args);
      this.cache.set(key, result);
      return result;
    }) as T;
  }

  // Lazy load components
  lazyLoad<T>(
    importFunc: () => Promise<{ default: T }>,
    fallback?: T
  ): Promise<T> {
    return importFunc().then(module => module.default).catch(() => {
      if (fallback) return fallback;
      throw new Error('Failed to load component');
    });
  }

  // Virtual scrolling for large lists
  virtualScroll<T>(
    items: T[],
    containerHeight: number,
    itemHeight: number,
    scrollTop: number
  ): { visibleItems: T[]; startIndex: number; endIndex: number } {
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleCount, items.length);
    
    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      endIndex
    };
  }

  // Image lazy loading
  lazyLoadImage(src: string, placeholder?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => resolve(src);
      img.onerror = () => {
        if (placeholder) {
          resolve(placeholder);
        } else {
          reject(new Error('Failed to load image'));
        }
      };
      
      img.src = src;
    });
  }

  // Preload resources
  preloadResources(urls: string[]): Promise<void[]> {
    return Promise.all(
      urls.map(url => {
        return new Promise<void>((resolve, reject) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.href = url;
          link.onload = () => resolve();
          link.onerror = () => reject(new Error(`Failed to preload ${url}`));
          document.head.appendChild(link);
        });
      })
    );
  }

  // Batch API calls
  batchApiCalls<T>(
    calls: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    const processBatch = async (batch: Array<() => Promise<T>>) => {
      const batchResults = await Promise.all(batch.map(call => call()));
      results.push(...batchResults);
    };

    const batches = [];
    for (let i = 0; i < calls.length; i += batchSize) {
      batches.push(calls.slice(i, i + batchSize));
    }

    return Promise.all(batches.map(processBatch)).then(() => results);
  }

  // Optimize images
  optimizeImage(
    src: string,
    width?: number,
    height?: number,
    quality: number = 0.8
  ): string {
    // This would integrate with an image optimization service
    // For now, return the original src
    return src;
  }

  // Clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Export singleton instance
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Utility functions
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  key: string
) => performanceOptimizer.debounce(func, delay, key);

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  key: string
) => performanceOptimizer.throttle(func, delay, key);

export const memoize = <T extends (...args: any[]) => any>(
  func: T,
  keyGenerator?: (...args: Parameters<T>) => string
) => performanceOptimizer.memoize(func, keyGenerator);
