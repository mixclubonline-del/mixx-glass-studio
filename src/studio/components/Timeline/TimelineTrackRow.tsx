/**
 * Timeline Track Row - Single track with regions
 */

import React from 'react';
import { TimelineTrack, Region } from '@/types/timeline';
import { TimelineRegion } from './TimelineRegion';
import { Mic, Volume2, Lock, Eye, EyeOff } from 'lucide-react';

interface TimelineTrackRowProps {
  track: TimelineTrack;
  regions: Region[];
  audioBuffers: Map<string, AudioBuffer>;
  zoom: number;
  isSelected: boolean;
  onSelectTrack: (id: string) => void;
  onUpdateRegion: (id: string, updates: Partial<Region>) => void;
  onSelectRegion: (id: string) => void;
  onSplitRegion: (id: string, splitTime: number) => void;
  selectedRegionIds: Set<string>;
}

export const TimelineTrackRow: React.FC<TimelineTrackRowProps> = ({
  track,
  regions,
  audioBuffers,
  zoom,
  isSelected,
  onSelectTrack,
  onUpdateRegion,
  onSelectRegion,
  onSplitRegion,
  selectedRegionIds
}) => {
  return (
    <div 
      className={`relative border-b border-border/30 transition-colors ${
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/5'
      }`}
      style={{ height: `${track.height}px` }}
      onClick={() => onSelectTrack(track.id)}
    >
      {/* Regions - now aligned to left edge */}
      <div className="absolute left-0 right-0 top-0 bottom-0">
        {regions.map((region) => (
          <TimelineRegion
            key={region.id}
            region={region}
            audioBuffer={audioBuffers.get(region.id) || null}
            zoom={zoom}
            onUpdate={onUpdateRegion}
            onSelect={onSelectRegion}
            onSplit={onSplitRegion}
            isSelected={selectedRegionIds.has(region.id)}
          />
        ))}
      </div>
    </div>
  );
};
