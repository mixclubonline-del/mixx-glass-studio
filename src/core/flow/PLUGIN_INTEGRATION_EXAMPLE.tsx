/**
 * Plugin Integration Example
 * 
 * This file demonstrates how plugins should integrate with Flow.
 * Use this as a reference when adding Flow support to plugins.
 */

import React from 'react';
import { useFlowComponent } from './useFlowComponent';
import { PrimeBrainStub } from '../../plugins/suite/lib/PrimeBrainStub';

/**
 * Example: Plugin with Flow Integration
 * 
 * This shows how a plugin should:
 * 1. Register with Flow
 * 2. Broadcast parameter changes
 * 3. Listen to Prime Brain guidance
 * 4. Maintain compatibility with PrimeBrainStub
 */
export function ExamplePluginWithFlow({ pluginId }: { pluginId: string }) {
  // Register plugin with Flow
  const { broadcast, isRegistered } = useFlowComponent({
    id: `plugin-${pluginId}`,
    type: 'plugin',
    name: 'Example Plugin',
    version: '1.0.0',
    broadcasts: [
      'parameter_change',
      'state_change',
      'audio_event',
    ],
    listens: [
      {
        signal: 'prime_brain_guidance',
        callback: (payload: any) => {
          // React to Prime Brain guidance
          // Example: Adjust behavior based on flow mode
          if (payload.mode === 'flow' && payload.flow > 0.7) {
            // High flow - maybe adjust processing
            console.log('[Plugin] High flow detected, adjusting behavior');
          }
          
          if (payload.mode === 'edit' && payload.tension > 0.6) {
            // Precision editing - maybe reduce latency
            console.log('[Plugin] Precision mode, optimizing for low latency');
          }
        },
      },
    ],
  });

  // Handle parameter change
  const handleParameterChange = (param: string, value: number) => {
    // Broadcast to Flow system
    broadcast('parameter_change', {
      pluginId,
      param,
      value,
      timestamp: Date.now(),
    });

    // Also send to PrimeBrainStub for plugin system compatibility
    PrimeBrainStub.sendEvent('parameter_change', {
      pluginId,
      param,
      value,
    });
  };

  // Handle state change
  const handleStateChange = (state: Record<string, unknown>) => {
    broadcast('state_change', {
      pluginId,
      state,
      timestamp: Date.now(),
    });
  };

  // Handle audio event
  const handleAudioEvent = (event: string, data: unknown) => {
    broadcast('audio_event', {
      pluginId,
      event,
      data,
      timestamp: Date.now(),
    });
  };

  return (
    <div>
      {isRegistered ? (
        <div>Plugin registered with Flow ✓</div>
      ) : (
        <div>Registering with Flow...</div>
      )}
      {/* Plugin UI here */}
    </div>
  );
}

/**
 * Example: Manual Registration (if not using hook)
 * 
 * Use this pattern if you need more control over registration
 */
export function useManualFlowRegistration(pluginId: string) {
  React.useEffect(() => {
    const { registerFlowComponent, broadcastFlowSignal } = require('./FlowComponentRegistry');
    
    const unregister = registerFlowComponent({
      id: `plugin-${pluginId}`,
      type: 'plugin',
      name: 'Manual Plugin',
      broadcasts: ['parameter_change'],
    });

    // Send heartbeat periodically
    const heartbeatInterval = setInterval(() => {
      const { flowComponentRegistry } = require('./FlowComponentRegistry');
      flowComponentRegistry.heartbeat(`plugin-${pluginId}`);
    }, 2000);

    return () => {
      unregister();
      clearInterval(heartbeatInterval);
    };
  }, [pluginId]);
}

/**
 * Example: Listening to Prime Brain Guidance
 * 
 * Components can listen to Prime Brain guidance to adapt behavior
 */
export function usePrimeBrainGuidance() {
  const [guidance, setGuidance] = React.useState<any>(null);

  React.useEffect(() => {
    const { subscribeToFlowComponent } = require('./FlowComponentRegistry');
    
    const unsubscribe = subscribeToFlowComponent(
      'prime_brain_guidance',
      (componentSignal: any) => {
        setGuidance(componentSignal.payload);
      }
    );

    return unsubscribe;
  }, []);

  return guidance;
}

