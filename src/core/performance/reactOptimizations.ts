/**
 * QUANTUM REACT OPTIMIZATIONS - Memoization Utilities
 * 
 * Utilities for optimizing React component rendering:
 * - Deep equality checks
 * - Memoized selectors
 * - Stable callback creators
 * 
 * Flow Doctrine: Minimize unnecessary re-renders
 * Reductionist Engineering: Only render when needed
 * 
 * @author Prime (Mixx Club)
 */

import React, { useMemo, useCallback, useRef, useState, useEffect } from 'react';

/**
 * Deep equality check (for object/array comparisons)
 */
export function deepEqual(a: any, b: any): boolean {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!deepEqual(a[key], b[key])) return false;
    }
    return true;
  }

  return false;
}

/**
 * Hook for stable object references (prevents unnecessary re-renders)
 */
export function useStableObject<T extends Record<string, any>>(obj: T): T {
  const ref = useRef<T>(obj);
  const prevObj = ref.current;

  if (!deepEqual(obj, prevObj)) {
    ref.current = obj;
  }

  return ref.current;
}

/**
 * Hook for stable array references
 */
export function useStableArray<T>(arr: T[]): T[] {
  const ref = useRef<T[]>(arr);
  const prevArr = ref.current;

  if (arr.length !== prevArr.length) {
    ref.current = arr;
    return arr;
  }

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] !== prevArr[i]) {
      ref.current = arr;
      return arr;
    }
  }

  return ref.current;
}

/**
 * Memoized selector hook (for derived state)
 */
export function useMemoizedSelector<T, R>(
  value: T,
  selector: (value: T) => R,
  deps?: React.DependencyList
): R {
  return useMemo(() => selector(value), [value, ...(deps || [])]);
}

/**
 * Stable callback creator (prevents callback recreation)
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return useCallback(callback, deps) as T;
}

/**
 * Debounced value hook (for expensive computations)
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

