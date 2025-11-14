/**
 * Prime Brain Debug Overlay
 * 
 * Dev-only overlay to inspect Prime Brain state, mode, momentum, ALS channels, and active hints.
 * Controlled by VITE_PRIME_BRAIN_DEBUG=1 env flag.
 */

import React from 'react';
import type { PrimeBrainStatus } from '../../types/primeBrainStatus';
import type { FlowContextSnapshot } from '../../state/flowContextService';
import type { PrimeBrainSnapshotInputs } from '../../ai/PrimeBrainSnapshot';

interface PrimeBrainDebugOverlayProps {
  primeBrainStatus: PrimeBrainStatus;
  flowContext: FlowContextSnapshot;
  snapshotInputs: PrimeBrainSnapshotInputs | null;
}

const resolveDebugFlag = (): boolean => {
  if (typeof import.meta === 'undefined') return false;
  try {
    const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env;
    return env?.VITE_PRIME_BRAIN_DEBUG === '1';
  } catch {
    return false;
  }
};

export const PrimeBrainDebugOverlay: React.FC<PrimeBrainDebugOverlayProps> = ({
  primeBrainStatus,
  flowContext,
  snapshotInputs,
}) => {
  const debugEnabled = resolveDebugFlag();
  
  if (!debugEnabled || !import.meta.env.DEV) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 max-w-md rounded-xl border border-white/20 bg-[rgba(6,9,20,0.95)] p-4 text-xs text-white shadow-2xl backdrop-blur-xl"
      style={{ fontFamily: 'monospace' }}
    >
      <div className="mb-3 border-b border-white/10 pb-2 text-sm font-semibold uppercase tracking-wider">
        Prime Brain Debug
      </div>
      
      <div className="space-y-2">
        <div>
          <span className="text-white/50">Mode:</span>{' '}
          <span className="font-semibold">{primeBrainStatus.mode}</span>
          <span className="ml-2 text-white/40">({primeBrainStatus.modeCaption})</span>
        </div>
        
        <div>
          <span className="text-white/50">Health:</span>{' '}
          <span style={{ color: primeBrainStatus.health.color }}>
            {primeBrainStatus.health.caption}
          </span>
        </div>
        
        <div>
          <span className="text-white/50">Momentum:</span>{' '}
          <span className="font-semibold">{flowContext.momentum.toFixed(2)}</span>
          <span className="ml-2 text-white/40">
            ({flowContext.intensity}, trend: {flowContext.momentumTrend.toFixed(2)})
          </span>
        </div>
        
        <div>
          <span className="text-white/50">Activity:</span>{' '}
          <span className="font-semibold">
            {flowContext.sessionContext?.activityLevel ?? 'unknown'}
          </span>
        </div>
        
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-white/50">ALS Channels:</div>
          <div className="ml-2 space-y-1">
            {primeBrainStatus.alsChannels.map((channel) => (
              <div key={channel.channel}>
                <span className="text-white/60">{channel.channel}:</span>{' '}
                <span>{channel.value.toFixed(2)}</span>
                <span className="ml-2 text-white/40">({channel.descriptor})</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mt-3 border-t border-white/10 pt-2">
          <div className="text-white/50">Adaptive Suggestions:</div>
          <div className="ml-2 space-y-1">
            <div>
              <span className="text-white/60">Show Bloom:</span>{' '}
              <span>{flowContext.adaptiveSuggestions.showBloomMenu ? 'yes' : 'no'}</span>
            </div>
            <div>
              <span className="text-white/60">Suggest View:</span>{' '}
              <span>{flowContext.adaptiveSuggestions.suggestViewSwitch ?? 'none'}</span>
            </div>
            <div>
              <span className="text-white/60">UI Density:</span>{' '}
              <span>{flowContext.adaptiveSuggestions.uiDensity}</span>
            </div>
            <div>
              <span className="text-white/60">Highlight Tools:</span>{' '}
              <span>{flowContext.adaptiveSuggestions.highlightTools.join(', ') || 'none'}</span>
            </div>
          </div>
        </div>
        
        {snapshotInputs && (
          <div className="mt-3 border-t border-white/10 pt-2">
            <div className="text-white/50">Snapshot:</div>
            <div className="ml-2 space-y-1">
              <div>
                <span className="text-white/60">Recent Actions:</span>{' '}
                <span>{snapshotInputs.userMemory.recentActions.length}</span>
              </div>
              <div>
                <span className="text-white/60">Bloom Trace:</span>{' '}
                <span>{snapshotInputs.bloomTrace.length}</span>
              </div>
              <div>
                <span className="text-white/60">AI Flags:</span>{' '}
                <span>{snapshotInputs.aiAnalysisFlags.length}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

