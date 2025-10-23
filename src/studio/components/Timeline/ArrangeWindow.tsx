/**
 * ArrangeWindow - Cinematic DAW arrangement view with adaptive color zones
 */

import { useEffect, useMemo } from 'react';
import { useTracksStore } from '@/store/tracksStore';
import { useTimelineStore } from '@/store/timelineStore';
import { useAmbientLighting } from '@/hooks/useAmbientLighting';
import { Button } from '@/components/ui/button';
import { Mic, Square, CircleDot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TransportControls } from '@/studio/components/TransportControls';

interface ArrangeWindowProps {
  bpm: number;
  onBpmChange?: (bpm: number) => void;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onRecord?: () => void;
  currentTime: number;
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
}

export function ArrangeWindow({
  bpm,
  onBpmChange,
  isPlaying,
  onPlay,
  onPause,
  onStop,
  onRecord,
  currentTime,
  masterVolume,
  onMasterVolumeChange,
}: ArrangeWindowProps) {
  const { tracks, addTrack, updateTrack } = useTracksStore();
  const { zoom } = useTimelineStore();
  const { energy, primaryColor, secondaryColor } = useAmbientLighting();

  // Initialize 8 default tracks if none exist
  useEffect(() => {
    if (tracks.length === 0) {
      const trackNames = ['Vocals', 'Guitar', 'Bass', 'Drums', 'Keys', 'Synth', 'FX', 'Master'];
      const colors = [
        '#9B5EFF', '#30E1C6', '#FF6B6B', '#FFD166',
        '#06D6A0', '#118AB2', '#EF476F', '#FCA311'
      ];

      trackNames.forEach((name, i) => {
        addTrack({
          id: `track-${i + 1}`,
          name,
          type: i === 7 ? 'aux' : 'audio',
          color: colors[i],
          height: 72,
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          recordArmed: false,
          inserts: Array(8).fill(null).map((_, idx) => ({
            slotNumber: idx + 1,
            pluginId: null,
            instanceId: null,
            bypass: false,
          })),
          sends: [],
        });
      });
    }
  }, [tracks.length, addTrack]);

  // Calculate adaptive gradient based on energy
  const backgroundGradient = useMemo(() => {
    const intensity = Math.min(energy * 100, 100);
    const coolColor = 'hsl(191, 100%, 65%)'; // Flow-blue
    const warmColor = 'hsl(25, 95%, 53%)'; // Burnt orange
    
    return `linear-gradient(135deg, 
      ${coolColor} 0%, 
      color-mix(in hsl, ${coolColor} ${100 - intensity}%, ${warmColor} ${intensity}%) 50%,
      ${warmColor} 100%)`;
  }, [energy]);

  const handleMuteToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { muted: !track.muted });
    }
  };

  const handleSoloToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { solo: !track.solo });
    }
  };

  const handleRecordArmToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { recordArmed: !track.recordArmed });
    }
  };

  const trackHeight = 72;

  return (
    <div className="h-full flex flex-col bg-background/95 backdrop-blur-xl">
      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left control strip - 200px fixed width */}
        <div className="w-[200px] border-r border-border/50 flex flex-col">
          {/* Header */}
          <div 
            className="h-[72px] border-b border-border/50 flex items-center justify-center bg-secondary/30 backdrop-blur-sm"
          >
            <span className="text-sm font-bold tracking-wider text-muted-foreground">TRACKS</span>
          </div>

          {/* Track controls - NO AUTO SCROLL */}
          <div className="flex-1 overflow-hidden">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-[72px] border-b border-border/30 px-3 py-2 hover:bg-accent/5 transition-colors"
                style={{ minHeight: trackHeight }}
              >
                <div className="flex flex-col h-full justify-between">
                  {/* Track name and color indicator */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: track.color }}
                    />
                    <span className="text-xs font-medium truncate">{track.name}</span>
                  </div>

                  {/* Transport buttons */}
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-6 w-6 rounded',
                        track.muted && 'bg-destructive/20 text-destructive hover:bg-destructive/30'
                      )}
                      onClick={() => handleMuteToggle(track.id)}
                      title="Mute"
                    >
                      <span className="text-[10px] font-bold">M</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-6 w-6 rounded',
                        track.solo && 'bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30'
                      )}
                      onClick={() => handleSoloToggle(track.id)}
                      title="Solo"
                    >
                      <span className="text-[10px] font-bold">S</span>
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className={cn(
                        'h-6 w-6 rounded',
                        track.recordArmed && 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                      )}
                      onClick={() => handleRecordArmToggle(track.id)}
                      title="Record Arm"
                    >
                      <CircleDot className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Track lanes - adaptive gradient background */}
        <div 
          className="flex-1 relative overflow-hidden"
          style={{
            background: backgroundGradient,
            opacity: 0.15 + (energy * 0.35), // Subtle energy-reactive opacity
          }}
        >
          {/* Overlay glass effect */}
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
          
          {/* Track lanes content - NO AUTO SCROLL */}
          <div className="relative h-full overflow-hidden">
            <div className="absolute inset-0">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className="border-b border-border/20"
                  style={{ height: trackHeight }}
                >
                  {/* Track lane - waveform/regions would go here */}
                  <div className="h-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground/50 italic">
                      {track.name} Lane
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Energy visualization overlay */}
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay transition-opacity duration-700"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${primaryColor}40, transparent 70%)`,
              opacity: energy * 0.4,
            }}
          />
        </div>
      </div>

      {/* Bottom transport bar */}
      <div className="border-t border-border/50 p-4 bg-background/95 backdrop-blur-xl">
        <TransportControls
          isPlaying={isPlaying}
          onPlay={onPlay}
          onPause={onPause}
          onStop={onStop}
          onRecord={onRecord}
          onExport={() => console.log('Export')}
          bpm={bpm}
          onBpmChange={onBpmChange}
          currentTime={currentTime}
          masterVolume={masterVolume}
          onMasterVolumeChange={onMasterVolumeChange}
        />
      </div>
    </div>
  );
}
