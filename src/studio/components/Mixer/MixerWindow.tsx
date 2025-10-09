/**
 * Mixer Window Component
 * Main mixer container with all channels
 */

import { Track } from '@/audio/Track';
import { Bus } from '@/audio/Bus';
import { PeakLevel, EQParams, CompressorParams } from '@/types/audio';
import { MixerChannel } from './MixerChannel';
import { MasterChannel } from './MasterChannel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Maximize2, Minimize2 } from 'lucide-react';
import { useState } from 'react';

interface MixerWindowProps {
  tracks: Track[];
  buses: Bus[];
  masterBus: Bus;
  peakLevels: Map<string, PeakLevel>;
  masterPeakLevel: PeakLevel;
  onTrackEQChange: (trackId: string, params: Partial<EQParams>) => void;
  onTrackCompressorChange: (trackId: string, params: Partial<CompressorParams>) => void;
  onTrackSendChange: (trackId: string, busId: string, amount: number, preFader: boolean) => void;
  onTrackPanChange: (trackId: string, pan: number) => void;
  onTrackVolumeChange: (trackId: string, volume: number) => void;
  onTrackSoloToggle: (trackId: string) => void;
  onTrackMuteToggle: (trackId: string) => void;
  onMasterVolumeChange: (volume: number) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function MixerWindow({
  tracks,
  buses,
  masterBus,
  peakLevels,
  masterPeakLevel,
  onTrackEQChange,
  onTrackCompressorChange,
  onTrackSendChange,
  onTrackPanChange,
  onTrackVolumeChange,
  onTrackSoloToggle,
  onTrackMuteToggle,
  onMasterVolumeChange,
  onExport,
  isExporting,
}: MixerWindowProps) {
  const [channelWidth, setChannelWidth] = useState<'narrow' | 'normal' | 'wide'>('normal');
  
  const toggleWidth = () => {
    setChannelWidth((prev) => {
      if (prev === 'narrow') return 'normal';
      if (prev === 'normal') return 'wide';
      return 'narrow';
    });
  };
  
  return (
    <div className="h-full flex flex-col glass-glow">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-xl font-bold neon-text">Mixer</h2>
        
        <Button
          size="sm"
          variant="outline"
          onClick={toggleWidth}
          className="gap-2"
        >
          {channelWidth === 'wide' ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {channelWidth === 'narrow' && 'Narrow'}
          {channelWidth === 'normal' && 'Normal'}
          {channelWidth === 'wide' && 'Wide'}
        </Button>
      </div>
      
      {/* Mixer Channels */}
      <div className="flex-1 flex overflow-hidden">
        {/* Master Channel - Fixed on left */}
        <div className="border-r border-border">
          <MasterChannel
            masterBus={masterBus}
            peakLevel={masterPeakLevel}
            onVolumeChange={onMasterVolumeChange}
            onExport={onExport}
            isExporting={isExporting}
          />
        </div>
        
        {/* Scrollable Track Channels */}
        <ScrollArea className="flex-1">
          <div className="flex h-full">
            {/* Track Channels */}
            {tracks.map((track) => (
              <div key={track.id} className="border-r border-border">
                <MixerChannel
                  track={track}
                  buses={buses}
                  peakLevel={peakLevels.get(track.id) || { left: -60, right: -60 }}
                  onEQChange={(params) => onTrackEQChange(track.id, params)}
                  onCompressorChange={(params) => onTrackCompressorChange(track.id, params)}
                  onSendChange={(busId, amount, preFader) => onTrackSendChange(track.id, busId, amount, preFader)}
                  onPanChange={(pan) => onTrackPanChange(track.id, pan)}
                  onVolumeChange={(volume) => onTrackVolumeChange(track.id, volume)}
                  onSoloToggle={() => onTrackSoloToggle(track.id)}
                  onMuteToggle={() => onTrackMuteToggle(track.id)}
                  width={channelWidth}
                />
              </div>
            ))}
            
            {/* Bus Channels */}
            {buses.map((bus) => (
              <div key={bus.id} className="border-r border-border">
                <MixerChannel
                  track={bus}
                  buses={[]}
                  peakLevel={peakLevels.get(bus.id) || { left: -60, right: -60 }}
                  onEQChange={() => {}}
                  onCompressorChange={() => {}}
                  onSendChange={() => {}}
                  onPanChange={(pan) => bus.channelStrip.setPan(pan)}
                  onVolumeChange={(volume) => bus.channelStrip.setVolume(volume)}
                  onSoloToggle={() => {}}
                  onMuteToggle={() => bus.channelStrip.setMute(!bus.channelStrip.isMuted())}
                  width={channelWidth}
                />
              </div>
            ))}
            
            {/* Empty state */}
            {tracks.length === 0 && (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center text-muted-foreground">
                  <p className="text-lg font-medium">No tracks loaded</p>
                  <p className="text-sm mt-2">Load audio files to see them in the mixer</p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
