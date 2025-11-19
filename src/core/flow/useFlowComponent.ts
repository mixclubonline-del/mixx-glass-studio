/**
 * useFlowComponent Hook
 * 
 * React hook for components to register with Flow and participate in orchestration.
 * 
 * Usage:
 * ```tsx
 * const { broadcast, isRegistered } = useFlowComponent({
 *   id: 'my-component',
 *   type: 'plugin',
 *   name: 'My Plugin',
 *   broadcasts: ['parameter_change', 'state_change'],
 *   listens: ['prime_brain_guidance'],
 * });
 * 
 * // Broadcast a signal
 * broadcast('parameter_change', { param: 'gain', value: 0.5 });
 * ```
 */

import { useEffect, useRef, useCallback } from 'react';
import {
  flowComponentRegistry,
  registerFlowComponent,
  broadcastFlowSignal,
  subscribeToFlowComponent,
  type FlowComponentType,
} from './FlowComponentRegistry';

export interface UseFlowComponentOptions {
  id: string;
  type: FlowComponentType;
  name: string;
  version?: string;
  broadcasts?: string[];
  listens?: Array<{
    signal: string;
    callback: (payload: unknown) => void;
  }>;
}

export interface UseFlowComponentReturn {
  broadcast: (signal: string, payload: unknown) => void;
  isRegistered: boolean;
  componentId: string;
}

/**
 * Hook for components to register with Flow
 */
export function useFlowComponent(options: UseFlowComponentOptions): UseFlowComponentReturn {
  const {
    id,
    type,
    name,
    version,
    broadcasts = [],
    listens = [],
  } = options;

  const unregisterRef = useRef<(() => void) | null>(null);
  const unsubscribeRefs = useRef<Array<() => void>>([]);

  // Register component on mount
  // This happens automatically in the background - users never see this
  useEffect(() => {
    // Auto-register component silently in the background
    const unregister = registerFlowComponent({
      id,
      type,
      name,
      version,
      broadcasts,
    });

    unregisterRef.current = unregister;

    // Subscribe to signals this component listens to
    // System is resilient - continues even if subscriptions fail
    const unsubscribes = listens.map(({ signal, callback }) => {
      try {
        return subscribeToFlowComponent(signal, (componentSignal) => {
          try {
            callback(componentSignal.payload);
          } catch (error) {
            // Component callback failed - system continues
            // This is a closed ecosystem, we trust components
          }
        });
      } catch (error) {
        // Subscription failed - return no-op unsubscribe
        return () => {};
      }
    });

    unsubscribeRefs.current = unsubscribes;

    // Send heartbeat periodically (silent background operation)
    const heartbeatInterval = setInterval(() => {
      try {
        flowComponentRegistry.heartbeat(id);
      } catch (error) {
        // Heartbeat failed - system continues
      }
    }, 2000); // Every 2 seconds

    return () => {
      try {
        unregister();
        unsubscribes.forEach(unsub => unsub());
        clearInterval(heartbeatInterval);
      } catch (error) {
        // Cleanup failed - system continues
      }
    };
  }, [id, type, name, version, JSON.stringify(broadcasts)]);

  // Broadcast function
  const broadcast = useCallback(
    (signal: string, payload: unknown) => {
      broadcastFlowSignal(id, signal, payload);
    },
    [id]
  );

  return {
    broadcast,
    isRegistered: unregisterRef.current !== null,
    componentId: id,
  };
}

