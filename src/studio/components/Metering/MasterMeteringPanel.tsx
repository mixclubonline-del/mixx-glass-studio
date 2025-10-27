/**
 * Master Metering Panel - Comprehensive metering for master output
 * Right-side panel with all professional meters
 */

import React, { useMemo } from 'react';
import { ProfessionalPeakMeter } from './ProfessionalPeakMeter';
import { LUFSMeter } from './LUFSMeter';
import { PhaseCorrelationMeter } from './PhaseCorrelationMeter';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { useMeteringStore } from '@/store/meteringStore';
import { useMixerStore } from '@/store/mixerStore';

export const MasterMeteringPanel: React.FC = () => {
  // Subscribe to primitives so renders trigger even if the parent object ref doesn't change
  const left  = useMixerStore(s => s.masterPeakLevel?.left ?? 0);
  const right = useMixerStore(s => s.masterPeakLevel?.right ?? 0);

  const truePeak      = useMeteringStore(s => s.truePeak ?? 0);
  const dynamicRange  = useMeteringStore(s => s.dynamicRange ?? 0);
  const crestFactor   = useMeteringStore(s => s.crestFactor ?? 0);
  const stereoWidth   = useMeteringStore(s => s.stereoWidth ?? 0);
  const resetClipCount = useMeteringStore(s => s.resetClipCount);

  // Derive RMS safely
  const rmsLevel = useMemo(() => ({
    left:  Math.max(-60, left  - 6),
    right: Math.max(-60, right - 6),
  }), [left, right]);

  const tpDanger = truePeak >= -1;

  return (
    <div className="h-full w-80 glass border-l border-border/30 p-4 overflow-y-auto flex flex-col gap-4">
      <h2 className="text-lg font-bold text-foreground">Master Metering</h2>

      {/* Main peak meters */}
      <div className="glass-glow rounded-lg p-3">
        <h3 className="text-xs font-semibold text-foreground mb-3">Peak Meters</h3>
        <div className="flex justify-center">
          <ProfessionalPeakMeter
            level={{ left, right }}
            height={300}
            width={6}
            stereo
            showRMS
            rmsLevel={rmsLevel}
            clipIndicator
            onResetClip={() => resetClipCount('master')}
          />
        </div>

        {/* True Peak display */}
        <div className="mt-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">True Peak</div>
          <div className={`text-xl font-bold font-mono ${tpDanger ? 'text-destructive' : 'text-foreground'}`}>
            {truePeak > 0 ? '+' : ''}{truePeak.toFixed(1)} dBTP
          </div>
        </div>
      </div>

      {/* LUFS Metering */}
      <LUFSMeter width={288} />

      {/* Phase Correlation */}
      <PhaseCorrelationMeter size={120} />

      {/* Spectrum Analyzer */}
      <div className="glass-glow rounded-lg p-3">
        <h3 className="text-xs font-semibold text-foreground mb-2">Spectrum</h3>
        <SpectrumAnalyzer width={256} height={120} />
      </div>

      {/* Dynamic Range & Stereo Width */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-glow rounded-lg p-3">
          <h3 className="text-[10px] text-muted-foreground mb-2">Dynamic Range</h3>
          <div className="text-2xl font-bold font-mono text-foreground">DR{dynamicRange}</div>
          <div className="text-[10px] text-muted-foreground mt-1">Crest: {crestFactor.toFixed(1)} dB</div>
        </div>

        <div className="glass-glow rounded-lg p-3">
          <h3 className="text-[10px] text-muted-foreground mb-2">Stereo Width</h3>
          <div className="text-2xl font-bold font-mono text-foreground">
            {(Math.max(0, Math.min(1, stereoWidth)) * 200).toFixed(0)}%
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.max(0, Math.min(1, stereoWidth)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
