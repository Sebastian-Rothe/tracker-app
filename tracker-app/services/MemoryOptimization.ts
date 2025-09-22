/**
 * MEMORY OPTIMIZATION UTILITIES
 * Lightweight performance improvements that can be integrated anywhere
 * Focus: Memory management, component memoization, lazy rendering
 */

import React, { memo, useMemo, useCallback, useRef, useEffect } from 'react';
import { ViewToken, TouchableOpacity } from 'react-native';

// ===== COMPONENT MEMOIZATION UTILITIES =====

/**
 * Enhanced memo with deep comparison for complex objects
 */
export function deepMemo<T extends object>(
  Component: React.ComponentType<T>,
  compareFunction?: (prevProps: T, nextProps: T) => boolean
) {
  return memo(Component, compareFunction || ((prevProps, nextProps) => {
    // Deep comparison for arrays and objects
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  }));
}

/**
 * Memoized routine item component factory
 * Returns a function that creates a memoized wrapper for any component
 */
export const createMemoizedRoutineItem = <T extends { routine: any; isCompleted: boolean; onPress: (routine: any) => void }>(
  Component: React.ComponentType<T>
) => {
  return memo(Component, (prevProps: T, nextProps: T) => {
    return (
      prevProps.routine.id === nextProps.routine.id &&
      prevProps.isCompleted === nextProps.isCompleted &&
      prevProps.routine.streak === nextProps.routine.streak &&
      prevProps.routine.lastConfirmed === nextProps.routine.lastConfirmed
    );
  });
};

// ===== LAZY RENDERING HOOKS =====

/**
 * Hook for lazy rendering based on visibility
 */
export function useLazyRender(shouldRender: boolean, delay: number = 100) {
  const [isRendered, setIsRendered] = React.useState(false);
  const timeoutRef = useRef<any>(undefined);

  useEffect(() => {
    if (shouldRender && !isRendered) {
      timeoutRef.current = setTimeout(() => {
        setIsRendered(true);
      }, delay);
    } else if (!shouldRender && isRendered) {
      setIsRendered(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [shouldRender, isRendered, delay]);

  return isRendered;
}

/**
 * Hook for batched state updates to reduce re-renders
 */
export function useBatchedState<T>(initialState: T) {
  const [state, setState] = React.useState(initialState);
  const batchRef = useRef<Partial<T>>({});
  const timeoutRef = useRef<any>(undefined);

  const batchUpdate = useCallback((updates: Partial<T>) => {
    batchRef.current = { ...batchRef.current, ...updates };

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setState(prevState => ({ ...prevState, ...batchRef.current }));
      batchRef.current = {};
    }, 16); // ~60fps
  }, []);

  return [state, batchUpdate] as const;
}

// ===== MEMORY MANAGEMENT =====

/**
 * Hook to track and cleanup memory usage
 */
export function useMemoryTracker(componentName: string) {
  const mountTime = useRef(Date.now());
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    if (__DEV__) {
      const memoryUsage = (performance as any).memory;
      if (memoryUsage) {
        console.log(`${componentName} Memory:`, {
          renders: renderCount.current,
          heapUsed: Math.round(memoryUsage.usedJSHeapSize / 1024 / 1024) + 'MB',
          heapTotal: Math.round(memoryUsage.totalJSHeapSize / 1024 / 1024) + 'MB'
        });
      }
    }
  });

  useEffect(() => {
    return () => {
      if (__DEV__) {
        const lifetime = Date.now() - mountTime.current;
        console.log(`${componentName} unmounted after ${lifetime}ms with ${renderCount.current} renders`);
      }
    };
  }, [componentName]);
}

/**
 * Optimized array chunking for large datasets
 */
export function useChunkedArray<T>(array: T[], chunkSize: number = 20) {
  return useMemo(() => {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }, [array, chunkSize]);
}

// ===== SCROLL OPTIMIZATION =====

/**
 * Hook for optimized scroll handling
 */
export function useOptimizedScroll(onScroll?: (event: any) => void) {
  const lastScrollTime = useRef(0);
  const animationFrame = useRef<number | undefined>(undefined);

  const handleScroll = useCallback((event: any) => {
    const now = Date.now();
    
    if (animationFrame.current) {
      cancelAnimationFrame(animationFrame.current);
    }

    animationFrame.current = requestAnimationFrame(() => {
      if (now - lastScrollTime.current > 16) { // ~60fps throttling
        onScroll?.(event);
        lastScrollTime.current = now;
      }
    });
  }, [onScroll]);

  useEffect(() => {
    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, []);

  return handleScroll;
}

// ===== IMAGE/ASSET OPTIMIZATION =====

/**
 * Hook for lazy loading images and assets
 */
export function useLazyAssets(shouldLoad: boolean) {
  const [loaded, setLoaded] = React.useState(false);

  useEffect(() => {
    if (shouldLoad && !loaded) {
      // Delay loading to prioritize main content
      const timer = setTimeout(() => {
        setLoaded(true);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [shouldLoad, loaded]);

  return loaded;
}

// ===== PERFORMANCE MONITORING =====

/**
 * Hook to measure component performance
 */
export function usePerformanceMeasure(componentName: string, dependencies: any[] = []) {
  const startTime = useRef<number | undefined>(undefined);

  useEffect(() => {
    startTime.current = performance.now();
  });

  useEffect(() => {
    if (startTime.current) {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (__DEV__ && duration > 16) { // Warn if over 16ms (60fps threshold)
        console.warn(`${componentName} slow render: ${duration.toFixed(2)}ms`);
      }
    }
  }, dependencies);
}

// ===== CACHE UTILITIES =====

/**
 * Simple LRU cache implementation for expensive calculations
 */
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used (first item)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }
}

/**
 * Hook for memoizing expensive calculations with LRU cache
 */
export function useLRUMemo<T>(
  factory: () => T,
  deps: any[],
  cacheSize: number = 50
): T {
  const cache = useRef(new LRUCache<string, T>(cacheSize));
  
  return useMemo(() => {
    const key = JSON.stringify(deps);
    const cached = cache.current.get(key);
    
    if (cached !== undefined) {
      return cached;
    }
    
    const result = factory();
    cache.current.set(key, result);
    return result;
  }, deps);
}

// ===== EXPORT ALL UTILITIES =====

export const MemoryOptimization = {
  // Components
  createMemoizedRoutineItem,
  deepMemo,
  
  // Hooks
  useLazyRender,
  useBatchedState,
  useMemoryTracker,
  useChunkedArray,
  useOptimizedScroll,
  useLazyAssets,
  usePerformanceMeasure,
  useLRUMemo,
  
  // Utilities
  LRUCache
};

export default MemoryOptimization;