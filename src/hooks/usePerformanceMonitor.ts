import { useEffect, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
}

export const usePerformanceMonitor = (componentName: string) => {
  const startTime = performance.now();

  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Log slow renders (> 16ms for 60fps)
    if (renderTime > 16) {
      console.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`);
    }

    // Optional: Send to analytics
    if (process.env.NODE_ENV === 'production' && renderTime > 100) {
      // Send performance data to monitoring service
      console.log('Performance metric:', { componentName, renderTime });
    }
  });

  const measureFunction = useCallback((fn: Function, functionName: string) => {
    return (...args: any[]) => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();
      
      if (end - start > 10) {
        console.warn(`Slow function ${functionName} in ${componentName}: ${(end - start).toFixed(2)}ms`);
      }
      
      return result;
    };
  }, [componentName]);

  return { measureFunction };
};