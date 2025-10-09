/**
 * Master Channel Component
 * Master bus with prominent metering and export
 */

import { Bus } from '@/audio/Bus';
import { PeakLevel } from '@/types/audio';
import { Fader } from './Fader';
import { PeakMeter } from './PeakMeter';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MasterChannelProps {
  masterBus: Bus;
  peakLevel: PeakLevel;
  onVolumeChange: (volume: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function MasterChannel({
  masterBus,
  peakLevel,
  onVolumeChange,
  onExport,
  isExporting,
}: MasterChannelProps) {
  const masterColor = `hsl(${masterBus.color.hue}, ${masterBus.color.saturation}%, ${masterBus.color.lightness}%)`;
  
  return (
    <div className="flex flex-col h-full w-40 glass-glow border-t-4" style={{ borderTopColor: masterColor }}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="text-sm font-bold text-center" style={{ color: masterColor }}>
          MASTER
        </div>
        <div className="w-full h-1.5 rounded-full mt-2" style={{ background: masterColor }} />
      </div>
      
      {/* Export Button */}
      <div className="p-3 border-b border-border">
        <Button
          onClick={onExport}
          disabled={isExporting}
          className="w-full"
          size="sm"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? 'Exporting...' : 'Export'}
        </Button>
      </div>
      
      {/* Main content - Meters */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="space-y-2">
          <div className="text-[10px] text-muted-foreground text-center">PEAK</div>
          <PeakMeter level={peakLevel} height={200} stereo={true} />
          
          {/* LUFS placeholder */}
          <div className="text-center">
            <div className="text-[9px] text-muted-foreground">LUFS</div>
            <div className="text-xs font-mono text-foreground/80">
              {(Math.max(peakLevel.left, peakLevel.right) * 0.7).toFixed(1)}
            </div>
          </div>
        </div>
      </div>
      
      {/* Fader Section */}
      <div className="flex justify-center p-4 border-t border-border">
        <Fader
          value={masterBus.channelStrip.getVolume()}
          onChange={onVolumeChange}
          color={masterColor}
          label="MASTER"
          height={180}
        />
      </div>
      
      {/* Footer */}
      <div className="p-2 border-t border-border text-center">
        <div className="text-[9px] text-muted-foreground">
          44.1kHz / 24-bit
        </div>
      </div>
    </div>
  );
}
