/**
 * Mixer Channel Component
 * Complete channel strip for one track/bus
 */

import { Track } from '@/audio/Track';
import { Bus } from '@/audio/Bus';
import { EQParams, CompressorParams, PeakLevel, AutomationMode } from '@/types/audio';
import { Fader } from './Fader';
import { PeakMeter } from './PeakMeter';
import { SendKnob } from './SendKnob';
import { EQMini } from './EQMini';
import { CompressorMini } from './CompressorMini';
import { cn } from '@/lib/utils';
import { Volume2, VolumeX, Radio, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MixerChannelProps {
  track: Track | Bus;
  buses: Bus[];
  peakLevel: PeakLevel;
  onEQChange: (params: Partial<EQParams>) => void;
  onCompressorChange: (params: Partial<CompressorParams>) => void;
  onSendChange: (busId: string, amount: number, preFader: boolean) => void;
  onPanChange: (pan: number) => void;
  onVolumeChange: (volume: number) => void;
  onSoloToggle: () => void;
  onMuteToggle: () => void;
  width?: 'narrow' | 'normal' | 'wide';
}

export function MixerChannel({
  track,
  buses,
  peakLevel,
  onEQChange,
  onCompressorChange,
  onSendChange,
  onPanChange,
  onVolumeChange,
  onSoloToggle,
  onMuteToggle,
  width = 'normal',
}: MixerChannelProps) {
  const isNarrow = width === 'narrow';
  const isWide = width === 'wide';
  
  const trackColor = `hsl(${track.color.hue}, ${track.color.saturation}%, ${track.color.lightness}%)`;
  
  const currentEQ = track.channelStrip.getEQ();
  const currentComp = track.channelStrip.getCompressor();
  const isSolo = track.channelStrip.isSolo();
  const isMuted = track.channelStrip.isMuted();
  
  return (
    <div
      className={cn(
        "flex flex-col h-full glass-glow border-t-2 transition-all",
        isNarrow && "w-16",
        !isNarrow && !isWide && "w-32",
        isWide && "w-48"
      )}
      style={{ borderTopColor: trackColor }}
    >
      {/* Header */}
      <div className="p-2 border-b border-border">
        <div
          className="text-xs font-medium truncate text-center"
          title={track.name}
        >
          {track.name}
        </div>
        <div
          className="w-full h-1 rounded-full mt-1"
          style={{ background: trackColor }}
        />
      </div>
      
      {/* Main controls - only show if not narrow */}
      {!isNarrow && (
        <div className="flex-1 overflow-y-auto p-2 space-y-3">
          {/* EQ Section */}
          {isWide && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1 text-center">EQ</div>
              <EQMini params={currentEQ} onChange={onEQChange} />
            </div>
          )}
          
          {/* Compressor Section */}
          {isWide && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1 text-center">COMP</div>
              <CompressorMini params={currentComp} onChange={onCompressorChange} />
            </div>
          )}
          
          {/* Sends Section */}
          {buses.length > 0 && (
            <div>
              <div className="text-[10px] text-muted-foreground mb-1 text-center">SENDS</div>
              <div className={cn("grid gap-2", isWide ? "grid-cols-2" : "grid-cols-1")}>
                {buses.slice(0, isWide ? 4 : 2).map((bus) => (
                  <SendKnob
                    key={bus.id}
                    label={bus.name.substring(0, 1)}
                    value={track.channelStrip.getSendAmount(bus.id)}
                    preFader={track.channelStrip.sends.get(bus.id)?.preFader || false}
                    onValueChange={(amount) => onSendChange(bus.id, amount, false)}
                    onPreFaderToggle={(pre) => onSendChange(bus.id, track.channelStrip.getSendAmount(bus.id), pre)}
                    color={`hsl(${bus.color.hue}, ${bus.color.saturation}%, ${bus.color.lightness}%)`}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Pan Control */}
          <div className="flex flex-col items-center gap-1">
            <div className="text-[10px] text-muted-foreground">PAN</div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={track.channelStrip.getPan()}
              onChange={(e) => onPanChange(parseFloat(e.target.value))}
              className="w-full h-1 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right, hsl(var(--neon-blue)), hsl(var(--foreground)), hsl(var(--neon-pink)))`,
              }}
            />
            <div className="text-[9px] font-mono text-foreground/70">
              {track.channelStrip.getPan() === 0 ? 'C' : track.channelStrip.getPan() < 0 ? `L${Math.abs(track.channelStrip.getPan() * 100).toFixed(0)}` : `R${(track.channelStrip.getPan() * 100).toFixed(0)}`}
            </div>
          </div>
        </div>
      )}
      
      {/* Meter + Fader Section */}
      <div className="flex gap-2 justify-center p-2 border-t border-border">
        <PeakMeter level={peakLevel} height={150} stereo={!isNarrow} />
        <Fader
          value={track.channelStrip.getVolume()}
          onChange={onVolumeChange}
          color={trackColor}
          height={150}
        />
      </div>
      
      {/* Transport Buttons */}
      <div className="p-2 border-t border-border space-y-1">
        <div className="flex gap-1 justify-center">
          <Button
            size="sm"
            variant={isSolo ? "default" : "outline"}
            className={cn(
              "h-6 px-2 text-xs font-bold",
              isSolo && "bg-accent text-accent-foreground"
            )}
            onClick={onSoloToggle}
          >
            <Radio className="w-3 h-3" />
            {!isNarrow && <span className="ml-1">S</span>}
          </Button>
          
          <Button
            size="sm"
            variant={isMuted ? "destructive" : "outline"}
            className="h-6 px-2 text-xs font-bold"
            onClick={onMuteToggle}
          >
            {isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
            {!isNarrow && <span className="ml-1">M</span>}
          </Button>
        </div>
        
        {/* Automation mode indicator */}
        {!isNarrow && (
          <div className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
            <Circle className="w-2 h-2" />
            <span>{(track as Track).automationMode || 'off'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
