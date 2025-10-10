/**
 * TrackList - left sidebar showing track names and controls
 */

import { ProfessionalTrackHeader } from './ProfessionalTrackHeader';
import { cn } from '@/lib/utils';

interface Track {
  id: string;
  name: string;
  color: string;
  muted: boolean;
  solo: boolean;
  recordArmed: boolean;
  locked?: boolean;
  frozen?: boolean;
}

interface TrackListProps {
  tracks: Track[];
  trackHeight: number;
  onTrackSelect: (id: string) => void;
  onMuteToggle: (id: string) => void;
  onSoloToggle?: (id: string) => void;
  onRecordArmToggle?: (id: string) => void;
  onLockToggle?: (id: string) => void;
  selectedTrackId?: string;
}

export function TrackList({
  tracks,
  trackHeight,
  onTrackSelect,
  onMuteToggle,
  onSoloToggle,
  onRecordArmToggle,
  onLockToggle,
  selectedTrackId,
}: TrackListProps) {
  return (
    <div className="glass border-r border-border">
      {/* Header */}
      <div 
        className="px-3 py-2 border-b border-border bg-secondary/30 flex items-center justify-between"
        style={{ height: '32px' }}
      >
        <span className="text-xs font-medium text-muted-foreground">TRACKS</span>
      </div>
      
      {/* Track rows */}
      <div className="select-none">
        {tracks.map((track) => (
          <ProfessionalTrackHeader
            key={track.id}
            id={track.id}
            name={track.name}
            color={track.color}
            muted={track.muted}
            solo={track.solo}
            recordArmed={track.recordArmed}
            locked={track.locked}
            frozen={track.frozen}
            isSelected={selectedTrackId === track.id}
            height={trackHeight}
            onSelect={onTrackSelect}
            onMuteToggle={onMuteToggle}
            onSoloToggle={onSoloToggle || (() => {})}
            onRecordArmToggle={onRecordArmToggle || (() => {})}
            onLockToggle={onLockToggle}
          />
        ))}
      </div>
    </div>
  );
}
