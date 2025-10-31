/**
 * VelvetFloor Panel - Real-time sub-harmonic monitoring
 * Displays the Five Pillars Doctrine metrics
 */

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { VelvetFloorState, HarmonicLattice } from '@/audio/engines/VelvetFloorEngine';
import { cn } from '@/lib/utils';

interface VelvetFloorPanelProps {
  getVelvetFloorState: () => VelvetFloorState;
  getHarmonicLattice: () => HarmonicLattice;
  getALSColor: () => string;
  isPlaying?: boolean;
}

export const VelvetFloorPanel: React.FC<VelvetFloorPanelProps> = ({
  getVelvetFloorState,
  getHarmonicLattice,
  getALSColor,
  isPlaying = false
}) => {
  const [state, setState] = useState<VelvetFloorState>({
    physicalFeel: 0.5,
    grooveBody: 0.5,
    tonalDefinition: 0.5,
    transitionBand: 0.5,
    overallWeight: 0.5,
    sonicGravity: 0.5
  });
  const [alsColor, setAlsColor] = useState('#8b5cf6');
  
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setState(getVelvetFloorState());
      setAlsColor(getALSColor());
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPlaying, getVelvetFloorState, getALSColor]);
  
  const renderMeter = (label: string, value: number, range: string, color: string) => (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground font-mono">{range}</span>
      </div>
      <div className="relative h-2 bg-background/50 rounded-full overflow-hidden">
        <div 
          className="h-full transition-all duration-100"
          style={{ 
            width: `${value * 100}%`,
            background: `linear-gradient(to right, ${color}40, ${color})`
          }}
        />
      </div>
      <div className="text-right text-xs text-muted-foreground font-mono">
        {(value * 100).toFixed(0)}%
      </div>
    </div>
  );
  
  const getSonicGravityStatus = (gravity: number) => {
    if (gravity > 0.9) return { label: 'Perfect', color: '#10b981' };
    if (gravity > 0.8) return { label: 'Excellent', color: '#f59e0b' };
    if (gravity > 0.6) return { label: 'Good', color: '#3b82f6' };
    if (gravity > 0.4) return { label: 'Fair', color: '#f59e0b' };
    return { label: 'Poor', color: '#ef4444' };
  };
  
  const gravityStatus = getSonicGravityStatus(state.sonicGravity);
  
  return (
    <Card className="glass p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold gradient-flow uppercase">Velvet Floor</h3>
          <p className="text-xs text-muted-foreground">Sub-Harmonic Analysis</p>
        </div>
        <div 
          className="w-8 h-8 rounded-full transition-all duration-300"
          style={{ 
            backgroundColor: alsColor,
            boxShadow: `0 0 20px ${alsColor}80`
          }}
          title="ALS State Color"
        />
      </div>
      
      {/* Psychoacoustic Bands */}
      <div className="space-y-3">
        {renderMeter('Physical Feel', state.physicalFeel, '20-35Hz', '#dc2626')}
        {renderMeter('Groove Body', state.grooveBody, '36-55Hz', '#f59e0b')}
        {renderMeter('Tonal Definition', state.tonalDefinition, '56-80Hz', '#3b82f6')}
        {renderMeter('Transition Band', state.transitionBand, '81-120Hz', '#8b5cf6')}
      </div>
      
      {/* Overall Weight */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="font-bold text-primary">Overall Weight</span>
          <span className="font-mono">{(state.overallWeight * 100).toFixed(0)}%</span>
        </div>
        <div className="relative h-3 bg-background/50 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-100"
            style={{ 
              width: `${state.overallWeight * 100}%`,
              background: 'linear-gradient(to right, #7c3aed40, #7c3aed, #ec489940)'
            }}
          />
        </div>
      </div>
      
      {/* Sonic Gravity */}
      <div className="pt-3 border-t border-border/50">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-xs font-bold">Sonic Gravity</div>
            <div className="text-xs text-muted-foreground">Phase Alignment</div>
          </div>
          <div 
            className="px-2 py-1 rounded text-xs font-bold"
            style={{ 
              backgroundColor: `${gravityStatus.color}20`,
              color: gravityStatus.color
            }}
          >
            {gravityStatus.label}
          </div>
        </div>
        <div className="relative h-3 bg-background/50 rounded-full overflow-hidden">
          <div 
            className="h-full transition-all duration-100"
            style={{ 
              width: `${state.sonicGravity * 100}%`,
              background: `linear-gradient(to right, ${gravityStatus.color}40, ${gravityStatus.color})`
            }}
          />
        </div>
      </div>
      
      {/* Status Indicator */}
      {!isPlaying && (
        <div className="text-center text-xs text-muted-foreground py-2">
          Press play to monitor sub-harmonics
        </div>
      )}
    </Card>
  );
};