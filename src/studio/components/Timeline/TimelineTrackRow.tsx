/**
 * Timeline Track Row - Single track with regions
 * ALIGNED: Using standard track height
 */

import React from 'react';
import { TimelineTrack, Region } from '@/types/timeline';
import { TimelineRegion } from './TimelineRegion';
import { AutomationLaneView } from './AutomationLaneView';
import { CrossfadeZone } from './CrossfadeZone';
import { Mic, Volume2, Lock, Eye, EyeOff } from 'lucide-react';
import { TRACK_HEIGHT } from '@/lib/layout-constants';

interface TimelineTrackRowProps {
  track: TimelineTrack;
  regions: Region[];
  audioBuffers: Map<string, AudioBuffer>;
  zoom: number;
  isSelected: boolean;
  onSelectTrack: (id: string) => void;
  onUpdateRegion: (id: string, updates: Partial<Region>) => void;
  onSelectRegion: (id: string, multi?: boolean) => void;
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
  const [isHovered, setIsHovered] = React.useState(false);
  
  // Calculate crossfades between overlapping regions
  const sortedRegions = [...regions].sort((a, b) => a.startTime - b.startTime);
  const crossfades: Array<{ r1: Region; r2: Region }> = [];
  
  for (let i = 0; i < sortedRegions.length - 1; i++) {
    const r1 = sortedRegions[i];
    const r2 = sortedRegions[i + 1];
    if (r1.startTime + r1.duration > r2.startTime) {
      crossfades.push({ r1, r2 });
    }
  }
  
  const trackHeightWithAutomation = track.automationVisible 
    ? TRACK_HEIGHT + (track.automationLanes?.length || 0) * 60
    : TRACK_HEIGHT;
  
  return (
    <div className="relative">
      <div 
        className={`relative border-b border-border/30 transition-all duration-400 group ${
          isSelected ? 'glass-light bloom-visible' : 'bloom-dimmed hover:bloom-visible'
        }`}
        style={{ height: `${TRACK_HEIGHT}px` }}
        onClick={() => onSelectTrack(track.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Regions */}
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
          
          {/* Crossfade zones */}
          {crossfades.map((cf, i) => (
            <CrossfadeZone
              key={i}
              region1EndTime={cf.r1.startTime + cf.r1.duration}
              region2StartTime={cf.r2.startTime}
              duration={cf.r2.duration}
              zoom={zoom}
              trackHeight={TRACK_HEIGHT}
              color1={cf.r1.color}
              color2={cf.r2.color}
            />
          ))}
        </div>
      </div>
      
      {/* Automation lanes */}
      {track.automationVisible && track.automationLanes?.map((lane, i) => (
        <AutomationLaneView
          key={i}
          trackId={track.id}
          type={lane.type}
          points={lane.points}
          zoom={zoom}
          color={track.color}
        />
      ))}
    </div>
  );
};
