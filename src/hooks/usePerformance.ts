import { useState, useEffect, useCallback, useRef } from 'react';

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  errorCount: number;
  userInteractions: number;
}

interface PerformanceThresholds {
  loadTime: number; // ms
  renderTime: number; // ms
  memoryUsage: number; // MB
  networkLatency: number; // ms
  errorCount: number;
  userInteractions: number;
}

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  loadTime: 3000,
  renderTime: 100,
  memoryUsage: 100,
  networkLatency: 1000,
  errorCount: 5,
  userInteractions: 10,
};

export function usePerformance(thresholds: Partial<PerformanceThresholds> = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    errorCount: 0,
    userInteractions: 0,
  });

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([]);
  const startTimeRef = useRef<number>(0);
  const renderStartRef = useRef<number>(0);
  const errorCountRef = useRef<number>(0);
  const interactionCountRef = useRef<number>(0);

  const finalThresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };

  // Measure load time
  const measureLoadTime = useCallback(() => {
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.loadEventStart;
        setMetrics(prev => ({ ...prev, loadTime }));
        
        if (loadTime > finalThresholds.loadTime) {
          setAlerts(prev => [...prev, `Load time ${loadTime}ms exceeds threshold ${finalThresholds.loadTime}ms`]);
        }
      }
    }
  }, [finalThresholds.loadTime]);

  // Measure render time
  const measureRenderTime = useCallback((componentName: string) => {
    const renderTime = performance.now() - renderStartRef.current;
    setMetrics(prev => ({ ...prev, renderTime }));
    
    if (renderTime > finalThresholds.renderTime) {
      setAlerts(prev => [...prev, `${componentName} render time ${renderTime}ms exceeds threshold ${finalThresholds.renderTime}ms`]);
    }
  }, [finalThresholds.renderTime]);

  // Measure memory usage
  const measureMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
      setMetrics(prev => ({ ...prev, memoryUsage }));
      
      if (memoryUsage > finalThresholds.memoryUsage) {
        setAlerts(prev => [...prev, `Memory usage ${memoryUsage.toFixed(2)}MB exceeds threshold ${finalThresholds.memoryUsage}MB`]);
      }
    }
  }, [finalThresholds.memoryUsage]);

  // Measure network latency
  const measureNetworkLatency = useCallback(async (url: string) => {
    const start = performance.now();
    try {
      await fetch(url, { method: 'HEAD' });
      const latency = performance.now() - start;
      setMetrics(prev => ({ ...prev, networkLatency: latency }));
      
      if (latency > finalThresholds.networkLatency) {
        setAlerts(prev => [...prev, `Network latency ${latency}ms exceeds threshold ${finalThresholds.networkLatency}ms`]);
      }
    } catch (error) {
      console.error('Network latency measurement failed:', error);
    }
  }, [finalThresholds.networkLatency]);

  // Track errors
  const trackError = useCallback((error: Error) => {
    errorCountRef.current += 1;
    setMetrics(prev => ({ ...prev, errorCount: errorCountRef.current }));
    
    if (errorCountRef.current > finalThresholds.errorCount) {
      setAlerts(prev => [...prev, `Error count ${errorCountRef.current} exceeds threshold ${finalThresholds.errorCount}`]);
    }
  }, [finalThresholds.errorCount]);

  // Track user interactions
  const trackInteraction = useCallback(() => {
    interactionCountRef.current += 1;
    setMetrics(prev => ({ ...prev, userInteractions: interactionCountRef.current }));
  }, []);

  // Start monitoring
  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    startTimeRef.current = performance.now();
    
    // Set up error tracking
    const originalError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      if (error) {
        trackError(error);
      }
      if (originalError) {
        originalError(message, source, lineno, colno, error);
      }
    };

    // Set up unhandled promise rejection tracking
    window.addEventListener('unhandledrejection', (event) => {
      trackError(new Error(event.reason));
    });

    // Set up user interaction tracking
    const interactionEvents = ['click', 'keydown', 'scroll', 'touchstart'];
    interactionEvents.forEach(event => {
      document.addEventListener(event, trackInteraction, { passive: true });
    });

    return () => {
      // Cleanup
      window.onerror = originalError;
      window.removeEventListener('unhandledrejection', () => {});
      interactionEvents.forEach(event => {
        document.removeEventListener(event, trackInteraction);
      });
    };
  }, [trackError, trackInteraction]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false);
  }, []);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    const report = {
      metrics,
      alerts,
      recommendations: [] as string[],
    };

    // Generate recommendations based on metrics
    if (metrics.loadTime > finalThresholds.loadTime) {
      report.recommendations.push('Consider code splitting and lazy loading to reduce initial load time');
    }

    if (metrics.renderTime > finalThresholds.renderTime) {
      report.recommendations.push('Optimize component rendering with React.memo and useMemo');
    }

    if (metrics.memoryUsage > finalThresholds.memoryUsage) {
      report.recommendations.push('Check for memory leaks and optimize data structures');
    }

    if (metrics.networkLatency > finalThresholds.networkLatency) {
      report.recommendations.push('Implement caching and optimize API calls');
    }

    if (metrics.errorCount > finalThresholds.errorCount) {
      report.recommendations.push('Improve error handling and add more robust validation');
    }

    return report;
  }, [metrics, alerts, finalThresholds]);

  // Clear alerts
  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  // Reset metrics
  const resetMetrics = useCallback(() => {
    setMetrics({
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      networkLatency: 0,
      errorCount: 0,
      userInteractions: 0,
    });
    errorCountRef.current = 0;
    interactionCountRef.current = 0;
    setAlerts([]);
  }, []);

  // Auto-start monitoring on mount
  useEffect(() => {
    const cleanup = startMonitoring();
    measureLoadTime();
    measureMemoryUsage();

    return cleanup;
  }, [startMonitoring, measureLoadTime, measureMemoryUsage]);

  return {
    metrics,
    alerts,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureLoadTime,
    measureRenderTime,
    measureMemoryUsage,
    measureNetworkLatency,
    trackError,
    trackInteraction,
    getPerformanceReport,
    clearAlerts,
    resetMetrics,
  };
}

// Hook for component performance monitoring
export function useComponentPerformance(componentName: string) {
  const renderStartRef = useRef<number>(0);
  const renderCountRef = useRef<number>(0);
  const [renderTime, setRenderTime] = useState<number>(0);
  const [renderCount, setRenderCount] = useState<number>(0);

  const startRender = useCallback(() => {
    renderStartRef.current = performance.now();
  }, []);

  const endRender = useCallback(() => {
    const renderTime = performance.now() - renderStartRef.current;
    setRenderTime(renderTime);
    renderCountRef.current += 1;
    setRenderCount(renderCountRef.current);
  }, []);

  useEffect(() => {
    startRender();
    return () => {
      endRender();
    };
  }, [startRender, endRender]);

  return {
    renderTime,
    renderCount,
    startRender,
    endRender,
  };
}

// Hook for API performance monitoring
export function useApiPerformance() {
  const [apiMetrics, setApiMetrics] = useState<Record<string, { count: number; totalTime: number; avgTime: number }>>({});

  const trackApiCall = useCallback((endpoint: string, startTime: number) => {
    const duration = performance.now() - startTime;
    
    setApiMetrics(prev => {
      const current = prev[endpoint] || { count: 0, totalTime: 0, avgTime: 0 };
      const newCount = current.count + 1;
      const newTotalTime = current.totalTime + duration;
      const newAvgTime = newTotalTime / newCount;
      
      return {
        ...prev,
        [endpoint]: {
          count: newCount,
          totalTime: newTotalTime,
          avgTime: newAvgTime,
        },
      };
    });
  }, []);

  const getApiReport = useCallback(() => {
    return Object.entries(apiMetrics).map(([endpoint, metrics]) => ({
      endpoint,
      ...metrics,
    }));
  }, [apiMetrics]);

  return {
    apiMetrics,
    trackApiCall,
    getApiReport,
  };
}
