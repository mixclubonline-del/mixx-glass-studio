/**
 * React Hook for Quantum Scheduler
 * 
 * Provides access to quantum scheduler statistics and traces
 * for monitoring and debugging.
 */

import { useEffect, useState } from 'react';
import { getQuantumScheduler, type QuantumSchedulerStats, type QuantumSchedulerTrace } from './QuantumScheduler';

export interface UseQuantumSchedulerReturn {
  stats: QuantumSchedulerStats;
  traces: QuantumSchedulerTrace[];
  refresh: () => void;
}

/**
 * Hook to access quantum scheduler statistics and traces
 */
export function useQuantumScheduler(updateInterval: number = 1000): UseQuantumSchedulerReturn {
  const [stats, setStats] = useState<QuantumSchedulerStats>(() => getQuantumScheduler().getStats());
  const [traces, setTraces] = useState<QuantumSchedulerTrace[]>(() => getQuantumScheduler().getTraces(100));
  
  const refresh = () => {
    const scheduler = getQuantumScheduler();
    setStats(scheduler.getStats());
    setTraces(scheduler.getTraces(100));
  };
  
  useEffect(() => {
    refresh();
    
    const interval = setInterval(refresh, updateInterval);
    return () => clearInterval(interval);
  }, [updateInterval]);
  
  return { stats, traces, refresh };
}

