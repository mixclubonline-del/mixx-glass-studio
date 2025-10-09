/**
 * LUFS Meter - ITU-R BS.1770-5 / EBU R128 compliant loudness metering
 */

import React from 'react';
import { useMeteringStore } from '@/store/meteringStore';

interface LUFSMeterProps {
  width?: number;
  height?: number;
}

export const LUFSMeter: React.FC<LUFSMeterProps> = ({
  width = 200,
  height = 120
}) => {
  const {
    lufsIntegrated,
    lufsShortTerm,
    lufsMomentary,
    loudnessRange,
    targetLoudness,
    exportReady
  } = useMeteringStore();
  
  // Target zones for different platforms
  const targets = [
    { name: 'Broadcast', lufs: -23, color: 'hsl(191 100% 50%)' },
    { name: 'Apple Music', lufs: -16, color: 'hsl(275 100% 65%)' },
    { name: 'Streaming', lufs: -14, color: 'hsl(314 100% 65%)' },
    { name: 'Club', lufs: -8, color: 'hsl(0 100% 60%)' }
  ];
  
  const getTargetName = () => {
    return targets.find(t => t.lufs === targetLoudness)?.name || 'Custom';
  };
  
  const isInRange = (value: number, target: number) => {
    return Math.abs(value - target) <= 2; // Within ±2 LU
  };
  
  return (
    <div 
      className="glass-glow rounded-lg p-4"
      style={{ width: `${width}px`, minHeight: `${height}px` }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground">Loudness</h3>
        <div className={`text-xs px-2 py-0.5 rounded ${
          exportReady 
            ? 'bg-primary/20 text-primary' 
            : 'bg-muted text-muted-foreground'
        }`}>
          {getTargetName()}: {targetLoudness} LUFS
        </div>
      </div>
      
      {/* Integrated LUFS (main measurement) */}
      <div className="mb-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs text-muted-foreground">Integrated</span>
          <span className={`text-2xl font-bold font-mono ${
            isInRange(lufsIntegrated, targetLoudness)
              ? 'text-primary'
              : 'text-destructive'
          }`}>
            {lufsIntegrated.toFixed(1)} <span className="text-sm">LUFS</span>
          </span>
        </div>
        
        {/* Target range bar */}
        <div className="relative h-2 bg-muted/30 rounded-full overflow-hidden">
          {/* Target zone indicator */}
          <div
            className="absolute h-full bg-primary/30"
            style={{
              left: `${Math.max(0, ((targetLoudness - 2 + 40) / 50) * 100)}%`,
              width: `${(4 / 50) * 100}%`
            }}
          />
          
          {/* Current level indicator */}
          <div
            className="absolute h-full w-1 bg-primary shadow-[0_0_8px_hsl(var(--primary))]"
            style={{
              left: `${Math.max(0, Math.min(100, ((lufsIntegrated + 40) / 50) * 100))}%`,
              transform: 'translateX(-50%)'
            }}
          />
        </div>
      </div>
      
      {/* Short-term and Momentary */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Short-term (3s)</div>
          <div className="text-lg font-bold font-mono text-foreground">
            {lufsShortTerm.toFixed(1)}
          </div>
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Momentary (400ms)</div>
          <div className="text-lg font-bold font-mono text-foreground">
            {lufsMomentary.toFixed(1)}
          </div>
        </div>
      </div>
      
      {/* Loudness Range */}
      <div>
        <div className="text-[10px] text-muted-foreground mb-1">Loudness Range (LRA)</div>
        <div className="text-sm font-mono text-foreground">
          {loudnessRange.toFixed(1)} LU
        </div>
      </div>
      
      {/* Export readiness indicator */}
      {exportReady && (
        <div className="mt-3 flex items-center gap-2 text-xs text-primary">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
          <span>Ready for export</span>
        </div>
      )}
    </div>
  );
};
