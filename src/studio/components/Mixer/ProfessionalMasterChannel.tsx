/**
 * Professional Master Channel - Master bus with advanced metering
 */

import React from 'react';
import { Download, Power } from 'lucide-react';
import { ProfessionalPeakMeter } from '../Metering/ProfessionalPeakMeter';
import { IceFireFader } from '../Controls/IceFireFader';
import { normalizedToDb } from '@/studio/utils/TemperatureGradient';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ProfessionalMasterChannelProps {
  volume: number;
  peakLevel: { left: number; right: number };
  lufs?: number;
  truePeak?: number;
  viewMode?: 'narrow' | 'medium' | 'wide';
  onVolumeChange: (volume: number) => void;
  onExport?: () => void;
  isExporting?: boolean;
}

export const ProfessionalMasterChannel: React.FC<ProfessionalMasterChannelProps> = ({
  volume,
  peakLevel,
  lufs,
  truePeak,
  viewMode = 'medium',
  onVolumeChange,
  onExport,
  isExporting = false,
}) => {
  const widthClass = {
    narrow: 'w-[90px]',
    medium: 'w-[150px]',
    wide: 'w-[220px]'
  }[viewMode];

  return (
    <div 
      className={cn(
        "relative flex flex-col h-full glass rounded-lg overflow-hidden",
        widthClass,
        "ring-2 ring-primary/50 shadow-[0_0_40px_hsl(var(--primary)/0.3)]"
      )}
      style={{
        borderLeft: '4px solid hsl(var(--primary))',
      }}
    >
      {/* Header */}
      <div className="p-2 border-b border-border/30 bg-primary/5">
        <div className="flex items-center justify-between mb-1">
          <div className="text-[9px] text-primary font-mono font-bold">
            MASTER
          </div>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="text-[11px] font-bold text-foreground text-center gradient-flow">
          Main Output
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {/* Peak Meters */}
        <div className="p-3 flex justify-center border-b border-border/20 bg-muted/5">
          <ProfessionalPeakMeter
            level={peakLevel}
            height={viewMode === 'narrow' ? 160 : viewMode === 'medium' ? 240 : 280}
            width={viewMode === 'narrow' ? 4 : 6}
            stereo={true}
            showRMS={true}
            clipIndicator={true}
          />
        </div>

        {/* LUFS Display */}
        {viewMode !== 'narrow' && (
          <div className="p-2 border-b border-border/20 space-y-1">
            <div className="text-[9px] text-muted-foreground font-medium mb-1">
              LOUDNESS
            </div>
            <div className="flex justify-between items-center bg-muted/20 rounded px-2 py-1">
              <span className="text-[9px] text-muted-foreground">LUFS:</span>
              <span className="text-[11px] font-mono font-bold text-primary">
                {lufs?.toFixed(1) ?? '-14.0'}
              </span>
            </div>
            <div className="flex justify-between items-center bg-muted/20 rounded px-2 py-1">
              <span className="text-[9px] text-muted-foreground">True Peak:</span>
              <span className={cn(
                "text-[11px] font-mono font-bold",
                (truePeak ?? -6) > -1 ? 'text-destructive' : 'text-accent'
              )}>
                {truePeak?.toFixed(1) ?? '-6.0'}
              </span>
            </div>
          </div>
        )}

        {/* Export Section */}
        {viewMode !== 'narrow' && onExport && (
          <div className="p-2">
            <Button
              onClick={onExport}
              disabled={isExporting}
              size="sm"
              className="w-full gap-1 text-[10px] shadow-[0_0_15px_hsl(var(--primary)/0.3)]"
            >
              <Download size={12} />
              {isExporting ? 'Exporting...' : 'Export Mix'}
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Fixed Section - Fader & Controls */}
      <div className="border-t border-border/30 bg-primary/5">
        {/* Fader */}
        <div className="flex items-center justify-center py-3">
          <IceFireFader
            value={volume}
            onChange={onVolumeChange}
            height={viewMode === 'narrow' ? 200 : viewMode === 'medium' ? 280 : 320}
            width={viewMode === 'narrow' ? 14 : 18}
            showScale={viewMode !== 'narrow'}
          />
        </div>

        {/* dB Readout */}
        <div className="text-center text-[11px] font-mono font-bold text-primary mb-2">
          {normalizedToDb(volume).toFixed(1)} dB
        </div>

        {/* Master Button */}
        <div className="flex justify-center pb-2 px-2">
          <button
            className="w-full py-1.5 rounded text-[9px] font-bold bg-primary/20 text-primary hover:bg-primary/30 transition-colors shadow-[0_0_10px_hsl(var(--primary)/0.2)]"
            title="Master Channel"
          >
            MASTER OUT
          </button>
        </div>
      </div>
    </div>
  );
};