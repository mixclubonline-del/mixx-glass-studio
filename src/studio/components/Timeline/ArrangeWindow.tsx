/**
 * ArrangeWindow - Main DAW arrangement view integrating timeline
 */

import { useTracksStore } from '@/store/tracksStore';
import { Button } from '@/components/ui/button';
import { EnhancedTimelineView } from '@/studio/components/Timeline/EnhancedTimelineView';

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
  const { tracks, addTrack } = useTracksStore();

  const handleCreateTracks = () => {
    const trackNames = ['Vocals', 'Guitar', 'Bass', 'Drums', 'Keys', 'Synth', 'FX', 'Master'];
    const colors = [
      '#9B5EFF', '#30E1C6', '#FF6B6B', '#FFD166',
      '#06D6A0', '#118AB2', '#EF476F', '#FCA311'
    ];

    trackNames.forEach((name, i) => {
      addTrack({
        id: undefined as any,
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
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar - shows empty state or track info */}
      <div className="border-b border-border/50 px-4 py-3 bg-secondary/20 backdrop-blur-sm flex-none">
        {tracks.length === 0 ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">No tracks yet</span>
              <Button 
                size="sm" 
                onClick={handleCreateTracks}
                className="h-8"
              >
                Create 8 Tracks
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {tracks.length} tracks
            </span>
          </div>
        )}
      </div>

      {/* Main Timeline View */}
      <div className="flex-1 overflow-hidden">
        <EnhancedTimelineView bpm={bpm} onBPMChange={onBpmChange} />
      </div>
    </div>
  );
}
