/**
 * Master Channel Strip - Large master bus with spectrum analyzer
 */

import React from 'react';
import { IceFireFader } from '../Controls/IceFireFader';
import { SlimPeakMeter } from '../Metering/SlimPeakMeter';
import { SpectrumAnalyzer } from '../Metering/SpectrumAnalyzer';
import { LUFSMeter } from '../Metering/LUFSMeter';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterChannelStripProps {
  volume: number;
  analysers?: { left: AnalyserNode; right: AnalyserNode } | null;
  onVolumeChange: (volume: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

export const MasterChannelStrip: React.FC<MasterChannelStripProps> = ({
  volume,
  analysers,
  onVolumeChange,
  onExport,
  isExporting
}) => {
  return (
    <div className="relative flex flex-col h-full w-full glass-glow rounded-lg p-2 border-l-4 border-primary overflow-hidden">
      {/* Master label */}
      <div className="text-sm font-bold text-primary mb-2 text-center neon-text">
        MASTER
      </div>
      
      {/* Export button */}
      <Button
        onClick={onExport}
        disabled={isExporting}
        className="w-full mb-2 shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
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
            Export Mix
          </span>
        )}
      </Button>
      
      {/* Spectrum analyzer */}
      <div className="mb-3 h-16 flex justify-center">
        <SpectrumAnalyzer
          width={80}
          height={60}
          analyser={analysers?.left}
        />
      </div>
      
      {/* Peak meters */}
      <div className="mb-2 flex justify-center">
        <SlimPeakMeter
          analysers={analysers}
          height={140}
          barWidth={6}
          gap={2}
        />
      </div>
      
      {/* Master fader */}
      <div className="flex-1 flex items-end justify-center mb-2 min-h-0 py-2">
        <IceFireFader
          value={volume}
          onChange={onVolumeChange}
          height={180}
          width={14}
          showScale={true}
        />
      </div>
    </div>
  );
};
