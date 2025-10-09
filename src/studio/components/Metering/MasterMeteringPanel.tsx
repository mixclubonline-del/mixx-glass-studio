/**
 * Master Metering Panel - Comprehensive metering for master output
 * Right-side panel with all professional meters
 */

import React from 'react';
import { ProfessionalPeakMeter } from './ProfessionalPeakMeter';
import { LUFSMeter } from './LUFSMeter';
import { PhaseCorrelationMeter } from './PhaseCorrelationMeter';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { useMeteringStore } from '@/store/meteringStore';
import { useMixerStore } from '@/store/mixerStore';

export const MasterMeteringPanel: React.FC = () => {
  const { masterPeakLevel } = useMixerStore();
  const { 
    truePeak, 
    dynamicRange, 
    crestFactor, 
    stereoWidth,
    resetClipCount 
  } = useMeteringStore();
  
  return (
    <div className="h-full w-80 glass border-l border-border/30 p-4 overflow-y-auto flex flex-col gap-4">
      <h2 className="text-lg font-bold text-foreground">Master Metering</h2>
      
      {/* Main peak meters */}
      <div className="glass-glow rounded-lg p-3">
        <h3 className="text-xs font-semibold text-foreground mb-3">Peak Meters</h3>
        <div className="flex justify-center">
          <ProfessionalPeakMeter
            level={masterPeakLevel}
            height={300}
            width={20}
            stereo={true}
            showRMS={true}
            rmsLevel={{ left: masterPeakLevel.left - 6, right: masterPeakLevel.right - 6 }}
            clipIndicator={true}
            onResetClip={() => resetClipCount('master')}
          />
        </div>
        
        {/* True Peak display */}
        <div className="mt-3 text-center">
          <div className="text-[10px] text-muted-foreground mb-1">True Peak</div>
          <div className={`text-xl font-bold font-mono ${
            truePeak >= -1 ? 'text-destructive' : 'text-foreground'
          }`}>
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
          <div className="text-2xl font-bold font-mono text-foreground">
            DR{dynamicRange}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">
            Crest: {crestFactor.toFixed(1)} dB
          </div>
        </div>
        
        <div className="glass-glow rounded-lg p-3">
          <h3 className="text-[10px] text-muted-foreground mb-2">Stereo Width</h3>
          <div className="text-2xl font-bold font-mono text-foreground">
            {(stereoWidth * 200).toFixed(0)}%
          </div>
          <div className="h-2 bg-muted/30 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${stereoWidth * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
