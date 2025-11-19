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
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';
// Initialize Flow Neural Bridge
import '../../core/flow/FlowNeuralBridge';

interface FlowLoopWrapperProps {
  children: React.ReactNode;
  primeBrainStatus: PrimeBrainStatus | null;
}

function FlowLoopInner({
  children,
}: {
  children: React.ReactNode;
}) {
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
