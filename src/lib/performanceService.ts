export interface PerformanceMetrics {
  pageLoadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  cacheHitRate: number;
  errorRate: number;
  userActions: number;
  apiCalls: number;
  databaseQueries: number;
  bundleSize: number;
}

export interface PerformanceConfig {
  enableMonitoring: boolean;
  enableCaching: boolean;
  enableLazyLoading: boolean;
  enableVirtualScrolling: boolean;
  enableImageOptimization: boolean;
  enableBundleOptimization: boolean;
  cacheSize: number;
  maxConcurrentRequests: number;
  requestTimeout: number;
  retryAttempts: number;
}

export class PerformanceService {
  private static config: PerformanceConfig = {
    enableMonitoring: true,
    enableCaching: true,
    enableLazyLoading: true,
    enableVirtualScrolling: true,
    enableImageOptimization: true,
    enableBundleOptimization: true,
    cacheSize: 50, // MB
    maxConcurrentRequests: 10,
    requestTimeout: 30000, // 30 seconds
    retryAttempts: 3
  };

  private static metrics: PerformanceMetrics = {
    pageLoadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    cacheHitRate: 0,
    errorRate: 0,
    userActions: 0,
    apiCalls: 0,
    databaseQueries: 0,
    bundleSize: 0
  };

  private static cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private static requestQueue: Array<() => Promise<any>> = [];
  private static activeRequests = 0;

  // Initialize performance monitoring
  static initialize(): void {
    if (!this.config.enableMonitoring) return;
    
    // Monitor page load time
    window.addEventListener('load', () => {
      this.metrics.pageLoadTime = performance.now();
    });
    
    // Monitor memory usage
    this.monitorMemoryUsage();
    
    // Monitor network performance
    this.monitorNetworkPerformance();
    
    // Monitor user interactions
    this.monitorUserInteractions();
    
    // Monitor API calls
    this.monitorAPICalls();
    
    // Monitor errors
    this.monitorErrors();
  }

  // Monitor memory usage
  private static monitorMemoryUsage(): void {
    if ('memory' in performance) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
      }, 5000);
    }
  }

  // Monitor network performance
  private static monitorNetworkPerformance(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.metrics.networkLatency = connection.rtt || 0;
    }
  }

  // Monitor user interactions
  private static monitorUserInteractions(): void {
    const events = ['click', 'keydown', 'scroll', 'resize'];
    events.forEach(event => {
      document.addEventListener(event, () => {
        this.metrics.userActions++;
      });
    });
  }

  // Monitor API calls
  private static monitorAPICalls(): void {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      this.metrics.apiCalls++;
      const startTime = performance.now();
      
      try {
        const response = await originalFetch(...args);
        const endTime = performance.now();
        this.metrics.networkLatency = endTime - startTime;
        return response;
      } catch (error) {
        this.metrics.errorRate++;
        throw error;
      }
    };
  }

  // Monitor errors
  private static monitorErrors(): void {
    window.addEventListener('error', (event) => {
      this.metrics.errorRate++;
      console.error('Performance Error:', event.error);
    });
    
    window.addEventListener('unhandledrejection', (event) => {
      this.metrics.errorRate++;
      console.error('Unhandled Promise Rejection:', event.reason);
    });
  }

  // Get performance metrics
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  // Update performance config
  static updateConfig(newConfig: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cache management
  static setCache(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    if (!this.config.enableCaching) return;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    
    // Clean up expired cache
    this.cleanupCache();
  }

  static getCache(key: string): any | null {
    if (!this.config.enableCaching) return null;
    
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }

  static clearCache(): void {
    this.cache.clear();
  }

  private static cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Request queue management
  static async queueRequest<T>(request: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await request();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      this.processQueue();
    });
  }

  private static async processQueue(): Promise<void> {
    if (this.activeRequests >= this.config.maxConcurrentRequests || this.requestQueue.length === 0) {
      return;
    }
    
    this.activeRequests++;
    const request = this.requestQueue.shift();
    
    if (request) {
      try {
        await request();
      } finally {
        this.activeRequests--;
        this.processQueue();
      }
    }
  }

  // Lazy loading
  static async lazyLoad<T>(importFn: () => Promise<T>, cacheKey?: string): Promise<T> {
    if (!this.config.enableLazyLoading) {
      return importFn();
    }
    
    if (cacheKey) {
      const cached = this.getCache(cacheKey);
      if (cached) return cached;
    }
    
    const startTime = performance.now();
    const result = await importFn();
    const endTime = performance.now();
    
    this.metrics.renderTime = endTime - startTime;
    
    if (cacheKey) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }

  // Virtual scrolling
  static calculateVirtualScroll(
    itemHeight: number,
    containerHeight: number,
    scrollTop: number,
    totalItems: number
  ): { startIndex: number; endIndex: number; visibleItems: number } {
    if (!this.config.enableVirtualScrolling) {
      return { startIndex: 0, endIndex: totalItems, visibleItems: totalItems };
    }
    
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(startIndex + visibleItems, totalItems);
    
    return { startIndex, endIndex, visibleItems };
  }

  // Image optimization
  static optimizeImage(src: string, width?: number, height?: number, quality?: number): string {
    if (!this.config.enableImageOptimization) return src;
    
    // This would integrate with an image optimization service
    // For now, return the original src
    return src;
  }

  // Bundle optimization
  static async optimizeBundle(): Promise<void> {
    if (!this.config.enableBundleOptimization) return;
    
    // This would integrate with webpack-bundle-analyzer or similar
    console.log('Bundle optimization would be implemented here');
  }

  // Performance recommendations
  static getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.pageLoadTime > 3000) {
      recommendations.push('เวลาการโหลดหน้าช้า ควรปรับปรุงการโหลดทรัพยากร');
    }
    
    if (this.metrics.memoryUsage > 100) {
      recommendations.push('การใช้หน่วยความจำสูง ควรตรวจสอบ memory leaks');
    }
    
    if (this.metrics.networkLatency > 1000) {
      recommendations.push('ความล่าช้าของเครือข่ายสูง ควรปรับปรุงการเชื่อมต่อ');
    }
    
    if (this.metrics.cacheHitRate < 0.5) {
      recommendations.push('อัตราการใช้ cache ต่ำ ควรปรับปรุงการ cache');
    }
    
    if (this.metrics.errorRate > 0.1) {
      recommendations.push('อัตราข้อผิดพลาดสูง ควรตรวจสอบ error handling');
    }
    
    if (this.metrics.bundleSize > 1000000) { // 1MB
      recommendations.push('ขนาด bundle ใหญ่ ควรปรับปรุงการแบ่งโค้ด');
    }
    
    return recommendations;
  }

  // Performance report
  static generateReport(): {
    metrics: PerformanceMetrics;
    recommendations: string[];
    config: PerformanceConfig;
    cacheStats: {
      size: number;
      hitRate: number;
      missRate: number;
    };
  } {
    const recommendations = this.getRecommendations();
    const cacheStats = {
      size: this.cache.size,
      hitRate: this.metrics.cacheHitRate,
      missRate: 1 - this.metrics.cacheHitRate
    };
    
    return {
      metrics: this.metrics,
      recommendations,
      config: this.config,
      cacheStats
    };
  }

  // Export performance data
  static exportPerformanceData(): void {
    const report = this.generateReport();
    const exportData = {
      timestamp: new Date().toISOString(),
      report
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance_report_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Reset metrics
  static resetMetrics(): void {
    this.metrics = {
      pageLoadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      cacheHitRate: 0,
      errorRate: 0,
      userActions: 0,
      apiCalls: 0,
      databaseQueries: 0,
      bundleSize: 0
    };
  }
}
