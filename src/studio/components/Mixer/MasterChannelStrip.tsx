/**
 * Master Channel Strip - Large master bus with spectrum analyzer
 */

import React from 'react';
import { PeakMeter } from './PeakMeter';
import { Fader } from './Fader';
import { SpectrumAnalyzer } from '../Metering/SpectrumAnalyzer';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterChannelStripProps {
  volume: number;
  peakLevel: { left: number; right: number };
  onVolumeChange: (volume: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

export const MasterChannelStrip: React.FC<MasterChannelStripProps> = ({
  volume,
  peakLevel,
  onVolumeChange,
  onExport,
  isExporting
}) => {
  return (
    <div className="relative flex flex-col h-full w-40 glass-glow rounded-lg p-4 border-l-4 border-primary">
      {/* Master label */}
      <div className="text-sm font-bold text-primary mb-4 text-center neon-text">
        MASTER
      </div>
      
      {/* Spectrum analyzer */}
      <div className="mb-4 h-32">
        <SpectrumAnalyzer
          width={128}
          height={128}
          peakLevel={peakLevel}
        />
      </div>
      
      {/* Peak meters */}
      <div className="mb-4 flex justify-center gap-2">
        <PeakMeter
          level={peakLevel}
          height={200}
          stereo={true}
        />
      </div>
      
      {/* Master fader */}
      <div className="flex-1 flex items-center justify-center mb-4">
        <Fader
          value={volume}
          onChange={onVolumeChange}
          color="hsl(var(--primary))"
          height={250}
          label="MASTER"
        />
      </div>
      
      {/* LUFS display */}
      <div className="text-center mb-4 glass rounded p-2">
        <div className="text-[10px] text-muted-foreground mb-1">LUFS</div>
        <div className="text-lg font-mono text-primary">
          -14.2
        </div>
      </div>
      
      {/* Export button */}
      <Button
        onClick={onExport}
        disabled={isExporting}
        className="w-full neon-glow-prime"
        size="sm"
      >
        {isExporting ? (
          <span className="flex items-center gap-2">
            <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full" />
            Exporting...
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Download size={14} />
            Export
          </span>
        )}
      </Button>
      
      {/* Format info */}
      <div className="text-[10px] text-center text-muted-foreground mt-2">
        WAV • 44.1kHz • 16bit
      </div>
    </div>
  );
};
