/**
 * Master Channel Strip - Large master bus with spectrum analyzer
 */

import React from 'react';
import { IceFireFader } from '../Controls/IceFireFader';
import { ProfessionalPeakMeter } from '../Metering/ProfessionalPeakMeter';
import { SpectrumAnalyzer } from '../Metering/SpectrumAnalyzer';
import { LUFSMeter } from '../Metering/LUFSMeter';
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
    <div className="relative flex flex-col h-full w-28 glass-glow rounded-lg p-3 border-l-4 border-primary">
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
      <div className="mb-3 flex justify-center">
        <ProfessionalPeakMeter
          level={peakLevel}
          height={220}
          width={6}
          stereo={true}
          showRMS={true}
          clipIndicator={true}
        />
      </div>
      
      {/* Master fader */}
      <div className="flex-1 flex items-center justify-center mb-3">
        <IceFireFader
          value={volume}
          onChange={onVolumeChange}
          height={240}
          width={14}
          showScale={true}
        />
      </div>
      
      {/* Export button */}
      <Button
        onClick={onExport}
        disabled={isExporting}
        className="w-full shadow-[0_0_15px_hsl(var(--primary)/0.4)]"
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
    </div>
  );
};
