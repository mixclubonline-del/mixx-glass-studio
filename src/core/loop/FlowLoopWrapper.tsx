/**
 * Flow Loop Wrapper
 * 
 * Wraps the flow loop with all necessary providers and connects it to Studio state.
 * This is the integration point between the canonical loop and the existing Studio architecture.
 */

import React, { useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { PrimeBrainProvider } from './PrimeBrainContext';
import { ALSProvider } from './ALSContext';
import { BloomProvider } from './BloomContext';
import { SessionCoreProvider } from './SessionCoreContext';
import { useFlowLoop } from './useFlowLoop';
import { getQuantumScheduler } from '../quantum';
import { initializeWebGPUBackend } from '../quantum/WebGPUBackend';
import { getQuantumNeuralNetwork } from '../../ai/QuantumNeuralNetwork';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';

// Error boundary for Flow Loop to handle context errors gracefully
class FlowLoopErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Only log in dev mode, and suppress context errors during StrictMode double-render
    if (import.meta.env.DEV && !error.message.includes('usePrimeBrain must be used within PrimeBrainProvider')) {
      console.warn('[Flow Loop] Error boundary caught:', error, errorInfo);
    }
  }

  componentDidUpdate() {
    // Reset error state on next render attempt
    if (this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      // Return null to suppress error UI during recovery
      return null;
    }
    return this.props.children;
  }
}

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
    
    // Initialize WebGPU Backend (with CPU fallback)
    initializeWebGPUBackend().then((status) => {
      // WebGPU backend initialized
      
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
    <FlowLoopErrorBoundary>
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
    </FlowLoopErrorBoundary>
  );
}
