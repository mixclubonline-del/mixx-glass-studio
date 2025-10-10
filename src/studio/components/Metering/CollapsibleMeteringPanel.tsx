/**
 * Collapsible Metering Panel - Floating/docked master metering
 * Can be toggled to save mixer real estate
 */

import React from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { ProfessionalPeakMeter } from './ProfessionalPeakMeter';
import { LUFSMeter } from './LUFSMeter';
import { PhaseCorrelationMeter } from './PhaseCorrelationMeter';
import { SpectrumAnalyzer } from './SpectrumAnalyzer';
import { useMeteringStore } from '@/store/meteringStore';
import { useMixerStore } from '@/store/mixerStore';
import { useViewStore } from '@/store/viewStore';
import { Button } from '@/components/ui/button';

export const CollapsibleMeteringPanel: React.FC = () => {
  const { masterPeakLevel } = useMixerStore();
  const { 
    truePeak, 
    dynamicRange, 
    crestFactor, 
    stereoWidth,
    resetClipCount 
  } = useMeteringStore();
  const { isPanelOpen, togglePanel } = useViewStore();
  const [isExpanded, setIsExpanded] = React.useState(false);
  
  if (!isPanelOpen.metering) return null;
  
  return (
    <div 
      className={`fixed top-16 right-4 glass border border-border/30 rounded-lg shadow-2xl z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 h-[calc(100vh-5rem)]' : 'w-80 h-auto max-h-[calc(100vh-5rem)]'
      } overflow-hidden flex flex-col`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/30">
        <h2 className="text-sm font-bold text-foreground">Master Metering</h2>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => togglePanel('metering')}
          >
            <X size={14} />
          </Button>
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main peak meters */}
        <div className="glass-glow rounded-lg p-3">
          <h3 className="text-xs font-semibold text-foreground mb-3">Peak Meters</h3>
          <div className="flex justify-center">
            <ProfessionalPeakMeter
              level={masterPeakLevel}
              height={isExpanded ? 400 : 300}
              width={6}
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
        <LUFSMeter width={isExpanded ? 352 : 288} />
        
        {/* Phase Correlation */}
        <PhaseCorrelationMeter size={isExpanded ? 140 : 120} />
        
        {/* Spectrum Analyzer */}
        <div className="glass-glow rounded-lg p-3">
          <h3 className="text-xs font-semibold text-foreground mb-2">Spectrum</h3>
          <SpectrumAnalyzer width={isExpanded ? 336 : 256} height={isExpanded ? 140 : 120} />
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
    </div>
  );
};
