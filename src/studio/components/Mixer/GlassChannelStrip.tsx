/**
 * Glass Channel Strip - Next-gen mixer channel with glass morphism
 */

import React from 'react';
import { ChannelState } from '@/store/mixerStore';
import { Volume2, Mic, Lock } from 'lucide-react';
import { PeakMeter } from './PeakMeter';
import { Fader } from './Fader';

interface GlassChannelStripProps {
  channel: ChannelState;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onVolumeChange: (id: string, volume: number) => void;
  onPanChange: (id: string, pan: number) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle: (id: string) => void;
}

export const GlassChannelStrip: React.FC<GlassChannelStripProps> = ({
  channel,
  isSelected,
  onSelect,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle
}) => {
  return (
    <div 
      className={`relative flex flex-col h-full w-24 glass-glow rounded-lg p-3 transition-all cursor-pointer ${
        isSelected 
          ? 'ring-2 ring-primary shadow-[0_0_30px_hsl(var(--primary)/0.4)]' 
          : 'hover:ring-1 hover:ring-primary/30'
      }`}
      onClick={() => onSelect(channel.id)}
      style={{
        borderLeft: `3px solid ${channel.color}`,
      }}
    >
      {/* Channel name */}
      <div className="text-xs font-medium text-foreground mb-3 truncate text-center">
        {channel.name}
      </div>
      
      {/* Peak meter */}
      <div className="mb-3">
        <PeakMeter
          level={channel.peakLevel}
          height={120}
          stereo={true}
        />
      </div>
      
      {/* Fader */}
      <div className="flex-1 flex items-center justify-center mb-3">
        <Fader
          value={channel.volume}
          onChange={(value) => onVolumeChange(channel.id, value)}
          color={channel.color}
          height={200}
        />
      </div>
      
      {/* Pan control */}
      <div className="mb-3">
        <div className="text-[10px] text-muted-foreground text-center mb-1">PAN</div>
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={channel.pan}
          onChange={(e) => onPanChange(channel.id, parseFloat(e.target.value))}
          className="w-full h-1 bg-muted rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, 
              hsl(var(--primary)) 0%, 
              hsl(var(--muted)) 50%, 
              hsl(var(--primary)) 100%)`
          }}
        />
        <div className="text-[10px] text-center text-muted-foreground mt-1">
          {channel.pan === 0 ? 'C' : channel.pan < 0 ? `L${Math.abs(channel.pan * 100).toFixed(0)}` : `R${(channel.pan * 100).toFixed(0)}`}
        </div>
      </div>
      
      {/* Transport buttons */}
      <div className="flex gap-1 justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onMuteToggle(channel.id);
          }}
          className={`p-1.5 rounded transition-all ${
            channel.muted 
              ? 'bg-destructive/20 text-destructive shadow-[0_0_10px_hsl(var(--destructive)/0.3)]' 
              : 'hover:bg-muted/50 text-muted-foreground'
          }`}
          title="Mute"
        >
          <Volume2 size={14} />
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSoloToggle(channel.id);
          }}
          className={`p-1.5 rounded transition-all ${
            channel.solo 
              ? 'bg-primary/20 text-primary shadow-[0_0_10px_hsl(var(--primary)/0.3)]' 
              : 'hover:bg-muted/50 text-muted-foreground'
          }`}
          title="Solo"
        >
          <Mic size={14} />
        </button>
      </div>
      
      {/* Volume readout */}
      <div className="text-[10px] text-center text-muted-foreground mt-2">
        {(channel.volume * 100).toFixed(0)}%
      </div>
    </div>
  );
};
