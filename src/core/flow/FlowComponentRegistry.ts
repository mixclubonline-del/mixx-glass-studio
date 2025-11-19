/**
 * Flow Component Registry
 * 
 * The central nervous system of Mixx Club Studio.
 * Components auto-register in the background - users never see this.
 * 
 * Flow Doctrine:
 * - Flow is the body (orchestration layer)
 * - Prime Brain + MNB are the central nervous system
 * - Components auto-register when they mount (silent background operation)
 * - System is resilient: if not registered, auto-registers on first broadcast
 * - Components can listen (passive) and broadcast (active)
 * - All communication flows through Flow signals
 * - This is a closed ecosystem - by the time we're done, everything will be registered
 * - Flow is felt and heard, not seen
 */

export type FlowComponentType = 
  | 'plugin'
  | 'mixer'
  | 'arrange'
  | 'piano-roll'
  | 'sampler'
  | 'bloom'
  | 'als'
  | 'transport'
  | 'system'
  | 'ai';

export interface FlowComponent {
  id: string;
  type: FlowComponentType;
  name: string;
  version?: string;
  
  // Active capabilities (what this component broadcasts)
  broadcasts?: string[];
  
  // Passive capabilities (what this component listens to)
  listens?: string[];
  
  // Registration metadata
  registeredAt: number;
  lastSeen: number;
  active: boolean;
}

export interface FlowComponentSignal {
  componentId: string;
  componentType: FlowComponentType;
  signal: string;
  payload: unknown;
  timestamp: number;
}

class FlowComponentRegistry {
  private components: Map<string, FlowComponent> = new Map();
  private listeners: Map<string, Set<(signal: FlowComponentSignal) => void>> = new Map();
  private broadcasters: Map<string, Set<string>> = new Map(); // signal -> componentIds

  /**
   * Register a component with Flow
   * Components must register to participate in Flow orchestration
   */
  register(component: Omit<FlowComponent, 'registeredAt' | 'lastSeen' | 'active'>): () => void {
    const now = Date.now();
    const fullComponent: FlowComponent = {
      ...component,
      registeredAt: now,
      lastSeen: now,
      active: true,
    };

    this.components.set(component.id, fullComponent);

    // Track what this component broadcasts
    if (component.broadcasts) {
      component.broadcasts.forEach(signal => {
        if (!this.broadcasters.has(signal)) {
          this.broadcasters.set(signal, new Set());
        }
        this.broadcasters.get(signal)!.add(component.id);
      });
    }

    // Return unregister function
    return () => {
      this.unregister(component.id);
    };
  }

  /**
   * Unregister a component
   */
  unregister(componentId: string): void {
    const component = this.components.get(componentId);
    if (!component) return;

    // Remove from broadcasters
    if (component.broadcasts) {
      component.broadcasts.forEach(signal => {
        this.broadcasters.get(signal)?.delete(componentId);
      });
    }

    this.components.delete(componentId);
  }

  /**
   * Update component heartbeat (lastSeen)
   */
  heartbeat(componentId: string): void {
    const component = this.components.get(componentId);
    if (component) {
      component.lastSeen = Date.now();
      component.active = true;
    }
  }

  /**
   * Mark component as inactive (stale heartbeat)
   */
  markInactive(componentId: string): void {
    const component = this.components.get(componentId);
    if (component) {
      component.active = false;
    }
  }

  /**
   * Subscribe to signals from a specific component type or all components
   */
  subscribe(
    signal: string,
    callback: (signal: FlowComponentSignal) => void,
    componentType?: FlowComponentType
  ): () => void {
    if (!this.listeners.has(signal)) {
      this.listeners.set(signal, new Set());
    }
    
    const wrappedCallback = (flowSignal: FlowComponentSignal) => {
      if (!componentType || flowSignal.componentType === componentType) {
        callback(flowSignal);
      }
    };

    this.listeners.get(signal)!.add(wrappedCallback);

    // Return unsubscribe
    return () => {
      this.listeners.get(signal)?.delete(wrappedCallback);
    };
  }

  /**
   * Broadcast a signal from a component
   * This is the active communication path
   * 
   * System is resilient: if component isn't registered, we auto-register it
   * This ensures the system never breaks down due to missing registration
   */
  broadcast(componentId: string, signal: string, payload: unknown): void {
    let component = this.components.get(componentId);
    
    // Auto-register if not found (resilient system)
    if (!component) {
      // Auto-register with minimal info - system should never break
      component = {
        id: componentId,
        type: 'system', // Default type
        name: componentId,
        registeredAt: Date.now(),
        lastSeen: Date.now(),
        active: true,
        broadcasts: [signal], // Auto-add this signal
      };
      this.components.set(componentId, component);
      
      // Track broadcaster
      if (!this.broadcasters.has(signal)) {
        this.broadcasters.set(signal, new Set());
      }
      this.broadcasters.get(signal)!.add(componentId);
    }

    // Update heartbeat
    this.heartbeat(componentId);

    // Don't block broadcasts - system is permissive, not restrictive
    // Components can broadcast any signal (we trust the ecosystem)

    const flowSignal: FlowComponentSignal = {
      componentId,
      componentType: component.type,
      signal,
      payload,
      timestamp: Date.now(),
    };

    // Notify listeners
    const signalListeners = this.listeners.get(signal);
    if (signalListeners) {
      signalListeners.forEach(callback => {
        try {
          callback(flowSignal);
        } catch (error) {
          console.error(`[FlowRegistry] Error in listener for ${signal}:`, error);
        }
      });
    }
  }

  /**
   * Get all registered components
   */
  getComponents(): FlowComponent[] {
    return Array.from(this.components.values());
  }

  /**
   * Get components by type
   */
  getComponentsByType(type: FlowComponentType): FlowComponent[] {
    return Array.from(this.components.values()).filter(c => c.type === type);
  }

  /**
   * Get component by ID
   */
  getComponent(componentId: string): FlowComponent | undefined {
    return this.components.get(componentId);
  }

  /**
   * Check if a component is registered and active
   */
  isActive(componentId: string): boolean {
    const component = this.components.get(componentId);
    return component?.active ?? false;
  }

  /**
   * Get health status of Flow system
   */
  getHealthStatus(): {
    totalComponents: number;
    activeComponents: number;
    byType: Record<FlowComponentType, number>;
    staleComponents: string[];
  } {
    const now = Date.now();
    const STALE_THRESHOLD_MS = 10000; // 10 seconds

    const components = Array.from(this.components.values());
    const active = components.filter(c => c.active);
    const stale = components
      .filter(c => now - c.lastSeen > STALE_THRESHOLD_MS)
      .map(c => c.id);

    const byType: Record<FlowComponentType, number> = {
      plugin: 0,
      mixer: 0,
      arrange: 0,
      'piano-roll': 0,
      sampler: 0,
      bloom: 0,
      als: 0,
      transport: 0,
      system: 0,
    };

    components.forEach(c => {
      byType[c.type]++;
    });

    return {
      totalComponents: components.length,
      activeComponents: active.length,
      byType,
      staleComponents: stale,
    };
  }
}

// Singleton instance
export const flowComponentRegistry = new FlowComponentRegistry();

// Convenience exports
export const registerFlowComponent = flowComponentRegistry.register.bind(flowComponentRegistry);
export const broadcastFlowSignal = flowComponentRegistry.broadcast.bind(flowComponentRegistry);
export const subscribeToFlowComponent = flowComponentRegistry.subscribe.bind(flowComponentRegistry);

