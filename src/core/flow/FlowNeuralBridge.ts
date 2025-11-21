/**
 * Flow Neural Bridge (MNB)
 * 
 * The bridge between Prime Brain and all Flow components.
 * This is the "central nervous system" that ensures:
 * - Prime Brain receives all component signals
 * - Components receive Prime Brain guidance
 * - Bidirectional communication flows properly
 * 
 * Flow Doctrine:
 * - Prime Brain listens actively (senses everything)
 * - Prime Brain broadcasts passively (guidance, not commands)
 * - Components broadcast actively (state changes, actions)
 * - Components listen passively (receive guidance)
 */

import { flowComponentRegistry, type FlowComponentSignal } from './FlowComponentRegistry';
import { publishAlsSignal, publishBloomSignal, subscribeToFlow, type FlowSignal } from '../../state/flowSignals';
import { PrimeBrainStub } from '../../plugins/suite/lib/PrimeBrainStub';

class FlowNeuralBridge {
  private primeBrainListeners: Map<string, (signal: FlowComponentSignal) => void> = new Map();
  private flowSignalUnsubscribe: (() => void) | null = null;
  private initialized = false;

  /**
   * Initialize the Neural Bridge
   * Connects Prime Brain to Flow system
   */
  initialize(): void {
    if (this.initialized) return;

    // Subscribe to Flow signals and forward to Prime Brain
    this.flowSignalUnsubscribe = subscribeToFlow((flowSignal: FlowSignal) => {
      this.forwardToPrimeBrain(flowSignal);
    });

    // Connect PrimeBrainStub to Flow system
    this.connectPrimeBrainStub();

    // Subscribe to component broadcasts
    this.subscribeToComponentBroadcasts();

    this.initialized = true;
    // Silent initialization - users never see this (background operation)
  }

  /**
   * Forward Flow signals to Prime Brain
   * System is resilient - if PrimeBrainStub isn't available, we continue
   */
  private forwardToPrimeBrain(flowSignal: FlowSignal): void {
    // Prime Brain receives all Flow signals
    // This is the active listening path
    // Gracefully handle if PrimeBrainStub isn't available
    try {
      if (PrimeBrainStub) {
        PrimeBrainStub.sendEvent('flow_signal', {
          channel: flowSignal.channel,
          payload: flowSignal.payload,
          timestamp: flowSignal.timestamp,
        });
      }
    } catch (error) {
      // System continues even if Prime Brain isn't ready
      // This is a closed ecosystem - we trust all components will be ready
    }
  }

  /**
   * Connect PrimeBrainStub events to Flow system
   * This bridges plugin events to Flow
   * System is resilient - if PrimeBrainStub isn't available, we continue
   */
  private connectPrimeBrainStub(): void {
    // Gracefully handle if PrimeBrainStub isn't available
    if (!PrimeBrainStub) {
      return; // System continues without it
    }

    // Listen to PrimeBrainStub events and forward to Flow
    const eventTypes = [
      'parameter_change',
      'plugin_state_change',
      'midi_message',
      'telemetry',
    ];

    eventTypes.forEach(eventType => {
      try {
        PrimeBrainStub.subscribe(eventType, (payload: unknown) => {
          // Forward plugin events to Flow as component broadcasts
          // Auto-register plugin if needed (resilient system)
          const pluginId = (payload as any)?.pluginId || `plugin-${eventType}`;
          flowComponentRegistry.broadcast(pluginId, eventType, payload);
        });
      } catch (error) {
        // System continues even if subscription fails
        // This is a closed ecosystem - we trust all components will be ready
      }
    });
  }

  /**
   * Subscribe to all component broadcasts
   * Prime Brain needs to hear everything
   * System is resilient - continues even if Prime Brain isn't ready
   */
  private subscribeToComponentBroadcasts(): void {
    // Subscribe to common signals from all component types
    const signals = [
      'state_change',
      'user_action',
      'parameter_change',
      'audio_event',
      'transport_event',
      'selection_change',
    ];

    signals.forEach(signal => {
      flowComponentRegistry.subscribe(signal, (componentSignal: FlowComponentSignal) => {
        // Forward to Prime Brain (gracefully handle if not available)
        try {
          if (PrimeBrainStub) {
            PrimeBrainStub.sendEvent('component_signal', {
              componentId: componentSignal.componentId,
              componentType: componentSignal.componentType,
              signal: componentSignal.signal,
              payload: componentSignal.payload,
              timestamp: componentSignal.timestamp,
            });
          }
        } catch (error) {
          // System continues even if Prime Brain isn't ready
          // This is a closed ecosystem - we trust all components will be ready
        }
      });
    });
  }

  /**
   * Broadcast Prime Brain guidance to components
   * This is the passive broadcasting path (guidance, not commands)
   * System is resilient - continues even if components aren't listening
   */
  broadcastPrimeBrainGuidance(guidance: {
    mode?: string;
    flow?: number;
    pulse?: number;
    tension?: number;
    suggestions?: string[];
    warnings?: string[];
  }): void {
    // Broadcast to all components that listen to 'prime_brain_guidance'
    // Auto-registers 'prime-brain' component if needed (resilient)
    flowComponentRegistry.broadcast('prime-brain', 'prime_brain_guidance', guidance);

    // Also publish to Flow signals for ALS/Bloom
    // Gracefully handle if PrimeBrainStub isn't available
    try {
      if (PrimeBrainStub && (guidance.flow !== undefined || guidance.pulse !== undefined || guidance.tension !== undefined)) {
        PrimeBrainStub.sendEvent('guidance_update', guidance);
      }
    } catch (error) {
      // System continues - this is a closed ecosystem
    }
  }

  /**
   * Broadcast ALS display decision
   * Prime Brain decides when Header should show text vs waveform
   */
  broadcastALSDisplayDecision(decision: {
    showText: boolean;
    priority: string;
    reason: string;
    duration?: number;
    information?: any;
  }): void {
    // Broadcast to ALS Header component
    flowComponentRegistry.broadcast('prime-brain', 'als_display_decision', decision);
  }

  /**
   * Get bridge health status
   */
  getHealthStatus(): {
    initialized: boolean;
    componentRegistry: ReturnType<typeof flowComponentRegistry.getHealthStatus>;
  } {
    return {
      initialized: this.initialized,
      componentRegistry: flowComponentRegistry.getHealthStatus(),
    };
  }

  /**
   * Shutdown the bridge
   */
  shutdown(): void {
    if (this.flowSignalUnsubscribe) {
      this.flowSignalUnsubscribe();
      this.flowSignalUnsubscribe = null;
    }
    this.initialized = false;
    // Silent shutdown - users never see this (background operation)
  }
}

// Singleton instance
export const flowNeuralBridge = new FlowNeuralBridge();

// Auto-initialize when module loads and expose globally
if (typeof window !== 'undefined') {
  // Expose globally for Prime Brain Context access
  (window as any).__flowNeuralBridge = flowNeuralBridge;
  
  // Initialize on next tick to ensure other systems are ready
  setTimeout(() => {
    flowNeuralBridge.initialize();
  }, 0);
}

