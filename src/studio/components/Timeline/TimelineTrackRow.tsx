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
  selectedRegionIds
}) => {
  return (
    <div 
      className={`relative border-b border-border/30 transition-colors ${
        isSelected ? 'bg-primary/5' : 'hover:bg-muted/5'
      }`}
      style={{ height: `${track.height}px` }}
    >
      {/* Track header (left side) */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-48 glass border-r border-border/30 px-3 py-2 cursor-pointer z-10"
        onClick={() => onSelectTrack(track.id)}
      >
        <div className="flex items-center gap-2 mb-1">
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: track.color }}
          />
          <span className="text-sm font-medium text-foreground truncate flex-1">
            {track.name}
          </span>
        </div>
        
        <div className="flex gap-1 mt-2">
          <button 
            className={`p-1 rounded hover:bg-muted/50 transition-colors ${
              track.muted ? 'text-destructive' : 'text-muted-foreground'
            }`}
            title="Mute"
          >
            {track.muted ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
          
          <button 
            className={`p-1 rounded hover:bg-muted/50 transition-colors ${
              track.solo ? 'text-primary' : 'text-muted-foreground'
            }`}
            title="Solo"
          >
            <Volume2 size={14} />
          </button>
          
          <button 
            className={`p-1 rounded hover:bg-muted/50 transition-colors ${
              track.recordArmed ? 'text-destructive' : 'text-muted-foreground'
            }`}
            title="Record Arm"
          >
            <Mic size={14} />
          </button>
        </div>
      </div>
      
      {/* Regions */}
      <div className="absolute left-48 right-0 top-0 bottom-0">
        {regions.map((region) => (
          <TimelineRegion
            key={region.id}
            region={region}
            audioBuffer={audioBuffers.get(region.id) || null}
            zoom={zoom}
            onUpdate={onUpdateRegion}
            onSelect={onSelectRegion}
            isSelected={selectedRegionIds.has(region.id)}
          />
        ))}
      </div>
    </div>
  );
};
