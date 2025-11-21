/**
 * Flow Loop Wrapper
 * 
 * Wraps the flow loop with all necessary providers and connects it to Studio state.
 * This is the integration point between the canonical loop and the existing Studio architecture.
 */

import React, { useEffect } from 'react';
import { PrimeBrainProvider } from './PrimeBrainContext';
import { ALSProvider } from './ALSContext';
import { BloomProvider } from './BloomContext';
import { SessionCoreProvider } from './SessionCoreContext';
import { useFlowLoop } from './useFlowLoop';
import { getQuantumScheduler } from '../quantum';
import { initializeWebGPUBackend } from '../quantum/WebGPUBackend';
import { getQuantumNeuralNetwork } from '../../ai/QuantumNeuralNetwork';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';

interface FlowLoopWrapperProps {
  children: React.ReactNode;
  primeBrainStatus: PrimeBrainStatus | null;
}

function FlowLoopInner({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize Quantum infrastructure on mount
  useEffect(() => {
    // Initialize Quantum Scheduler
    const scheduler = getQuantumScheduler();
    console.log('🔮 Quantum Scheduler active in Flow Loop - Protecting audio, enabling AI, batching UI');
    
    // Initialize WebGPU Backend (with CPU fallback)
    initializeWebGPUBackend().then((status) => {
      if (status.type === 'webgpu') {
        console.log('🔮 WebGPU Backend: Active - Quantum speed unlocked');
      } else {
        console.log('🔮 WebGPU Backend: CPU fallback active');
      }
      
      // Pre-initialize and prefetch Quantum Neural Network (Phase 4 optimization)
      getQuantumNeuralNetwork().initialize().then(() => {
        // Prefetch models for faster inference
        return getQuantumNeuralNetwork().prefetch();
      }).catch((error) => {
        console.warn('[Flow Loop] Quantum Neural Network initialization deferred:', error);
      });
    }).catch((error) => {
      console.warn('[Flow Loop] WebGPU Backend initialization failed:', error);
    });
    
    // Expose to window for debugging
    if (typeof window !== 'undefined') {
      (window as any).__quantum_scheduler = scheduler;
      (window as any).__quantum_neural_network = getQuantumNeuralNetwork();
    }
  }, []);
  
  // The flow loop reads from window.__mixx_* globals, no params needed
  useFlowLoop();
  
  return <>{children}</>;
}

export function FlowLoopWrapper(props: FlowLoopWrapperProps) {
  const { children, primeBrainStatus } = props;
  
  return (
    <PrimeBrainProvider primeBrainStatus={primeBrainStatus}>
      <ALSProvider>
        <BloomProvider>
          <SessionCoreProvider>
            <FlowLoopInner>
              {children}
            </FlowLoopInner>
          </SessionCoreProvider>
        </BloomProvider>
      </ALSProvider>
    </PrimeBrainProvider>
  );
}
