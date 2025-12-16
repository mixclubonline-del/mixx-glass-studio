/**
 * usePerformance - React hook for AURA performance optimization
 * Phase 36: Performance Optimization Integration
 * 
 * Provides easy access to performance metrics, optimization profiles,
 * and system capabilities from React components.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getPerformanceOptimizer,
  initializePerformanceOptimization,
  type SystemCapabilities,
  type PerformanceMetrics,
  type OptimizationProfile,
  type PerformanceTier,
} from '../core/inference/AURAPerformanceOptimizer';

export interface UsePerformanceResult {
  // State
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  
  // Data
  capabilities: SystemCapabilities | null;
  profile: OptimizationProfile | null;
  metrics: PerformanceMetrics | null;
  recommendations: string[];
  
  // Actions
  initialize: () => Promise<void>;
  setTier: (tier: PerformanceTier) => void;
  refreshMetrics: () => void;
}

export function usePerformance(autoInit = true): UsePerformanceResult {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [capabilities, setCapabilities] = useState<SystemCapabilities | null>(null);
  const [profile, setProfile] = useState<OptimizationProfile | null>(null);
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  // Initialize
  const initialize = useCallback(async () => {
    if (isInitializing || isInitialized) return;
    
    setIsInitializing(true);
    setError(null);
    
    try {
      const caps = await initializePerformanceOptimization();
      const optimizer = getPerformanceOptimizer();
      
      setCapabilities(caps);
      setProfile(optimizer.getProfile());
      setMetrics(optimizer.getMetrics());
      setRecommendations(optimizer.getRecommendations());
      setIsInitialized(true);
      
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Performance initialization failed';
      setError(msg);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized]);
  
  // Set performance tier
  const setTier = useCallback((tier: PerformanceTier) => {
    const optimizer = getPerformanceOptimizer();
    optimizer.setTier(tier);
    setProfile(optimizer.getProfile());
    setRecommendations(optimizer.getRecommendations());
  }, []);
  
  // Refresh metrics
  const refreshMetrics = useCallback(() => {
    const optimizer = getPerformanceOptimizer();
    optimizer.recordMetrics();
    setMetrics(optimizer.getMetrics());
    setRecommendations(optimizer.getRecommendations());
  }, []);
  
  // Auto-initialize on mount
  useEffect(() => {
    if (autoInit) {
      initialize();
    }
  }, [autoInit, initialize]);
  
  // Auto-refresh metrics every 5 seconds
  useEffect(() => {
    if (isInitialized) {
      metricsIntervalRef.current = setInterval(refreshMetrics, 5000);
    }
    
    return () => {
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    };
  }, [isInitialized, refreshMetrics]);
  
  return {
    isInitialized,
    isInitializing,
    error,
    capabilities,
    profile,
    metrics,
    recommendations,
    initialize,
    setTier,
    refreshMetrics,
  };
}

export default usePerformance;
