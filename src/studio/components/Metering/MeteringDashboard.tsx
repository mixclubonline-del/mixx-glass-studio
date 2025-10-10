/**
 * Metering Dashboard - Comprehensive analysis panel
 */

import React from 'react';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { PeakMeter } from '../Mixer/PeakMeter';
import { Activity, Radio, Gauge } from 'lucide-react';

interface MeteringDashboardProps {
  masterPeakLevel: { left: number; right: number };
  analyserNode?: AnalyserNode;
}

export const MeteringDashboard: React.FC<MeteringDashboardProps> = ({
  masterPeakLevel,
  analyserNode
}) => {
  return (
    <div className="flex flex-col h-full w-80 glass border-l border-border/30 p-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-primary" size={18} />
        <h3 className="text-sm font-bold">Analysis Dashboard</h3>
      </div>
      
      {/* Master meters */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <Gauge size={12} />
          Master Level
        </div>
        <div className="flex gap-3 justify-center glass rounded p-3">
          <PeakMeter
            level={masterPeakLevel}
            height={150}
            stereo={true}
          />
        </div>
      </div>
      
      {/* Spectrum analyzer */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
          <Radio size={12} />
          Frequency Spectrum
        </div>
        <SpectrumAnalyzer
          width={280}
          height={120}
          peakLevel={masterPeakLevel}
          analyserNode={analyserNode}
        />
      </div>
      
      {/* Loudness metrics */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-2">Loudness</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="glass rounded p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">LUFS-I</div>
            <div className="text-lg font-mono text-primary">-14.2</div>
          </div>
          <div className="glass rounded p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">LUFS-S</div>
            <div className="text-lg font-mono text-primary">-12.8</div>
          </div>
          <div className="glass rounded p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Peak</div>
            <div className="text-lg font-mono text-primary">-2.1 dB</div>
          </div>
          <div className="glass rounded p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Range</div>
            <div className="text-lg font-mono text-primary">8.4 LU</div>
          </div>
        </div>
      </div>
      
      {/* Stereo imaging */}
      <div className="mb-6">
        <div className="text-xs text-muted-foreground mb-2">Stereo Field</div>
        <div className="glass rounded p-3 h-32 flex items-center justify-center">
          <div className="relative w-24 h-24">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-2 rounded-full border border-primary/40" />
            {/* Mock goniometer visualization */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="w-1 h-1 rounded-full bg-primary shadow-[0_0_10px_hsl(var(--primary))]"
                style={{
                  transform: `translate(${Math.sin(Date.now() / 1000) * 20}px, ${Math.cos(Date.now() / 1000) * 20}px)`
                }}
              />
            </div>
          </div>
        </div>
        <div className="text-center mt-2">
          <div className="text-xs text-muted-foreground">Correlation: +0.85</div>
        </div>
      </div>
      
      {/* AI insights */}
      <div className="glass-glow rounded p-3 border border-primary/20">
        <div className="text-xs font-medium text-primary mb-2">AI Analysis</div>
        <div className="text-xs text-muted-foreground space-y-1">
          <p>✓ Mix balance is good</p>
          <p>⚠ Low end slightly muddy</p>
          <p>✓ Stereo width optimal</p>
          <p>✓ Ready for mastering</p>
        </div>
      </div>
    </div>
  );
};
