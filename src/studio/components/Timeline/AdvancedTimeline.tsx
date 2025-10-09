/**
 * Advanced Timeline - Complete arrange view with tracks, regions, and waveforms
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { TimelineRuler } from './TimelineRuler';
import { GridOverlay } from './GridOverlay';
import { Playhead } from './Playhead';
import { TrackLane } from './TrackLane';
import { TrackList } from './TrackList';
import { Region as RegionType } from '@/types/timeline';
import { waveformCache } from '@/audio/WaveformCache';

interface Track {
  id: string;
  name: string;
  buffer: AudioBuffer | null;
  color: { hue: number; saturation: number; lightness: number };
  muted: boolean;
  solo?: boolean;
}

interface AdvancedTimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  bpm: number;
  onSeek: (time: number) => void;
  onTrackMuteToggle: (id: string) => void;
  onTrackSoloToggle?: (id: string) => void;
}

export function AdvancedTimeline({
  tracks,
  currentTime,
  duration,
  isPlaying,
  bpm,
  onSeek,
  onTrackMuteToggle,
  onTrackSoloToggle,
}: AdvancedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedTrackId, setSelectedTrackId] = useState<string | undefined>();
  
  const { 
    setCurrentTime, 
    setDuration, 
    setIsPlaying,
    scrollX,
    setScrollX,
    zoom,
    setZoom,
  } = useTimelineStore();
  
  // Sync props to store
  useEffect(() => {
    setCurrentTime(currentTime);
  }, [currentTime, setCurrentTime]);
  
  useEffect(() => {
    setDuration(duration);
  }, [duration, setDuration]);
  
  useEffect(() => {
    setIsPlaying(isPlaying);
  }, [isPlaying, setIsPlaying]);
  
  // Convert tracks to regions (one region per track for now)
  const regions = useMemo<RegionType[]>(() => {
    return tracks
      .filter(track => track.buffer)
      .map(track => ({
        id: `region-${track.id}`,
        trackId: track.id,
        name: track.name,
        startTime: 0,
        duration: track.buffer!.duration,
        bufferOffset: 0,
        bufferDuration: track.buffer!.duration,
        color: `hsl(${track.color.hue}, ${track.color.saturation}%, ${track.color.lightness}%)`,
        fadeIn: 0,
        fadeOut: 0,
        gain: 1,
        locked: false,
        muted: track.muted,
      }));
  }, [tracks]);
  
  // Audio buffer map
  const audioBuffers = useMemo(() => {
    const map = new Map<string, AudioBuffer>();
    tracks.forEach(track => {
      if (track.buffer) {
        map.set(track.id, track.buffer);
      }
    });
    return map;
  }, [tracks]);
  
  // Measure container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };
  
  // Handle zoom (ctrl+wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      }
    };
    
    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, setZoom]);
  
  const rulerHeight = 32;
  const trackHeight = 80;
  const trackListWidth = 200;
  const contentHeight = dimensions.height - rulerHeight;
  const timelineWidth = Math.max(dimensions.width - trackListWidth, duration * zoom);
  const totalTracksHeight = tracks.length * trackHeight;
  
  // Prepare track list data
  const trackListData = tracks.map(track => ({
    id: track.id,
    name: track.name,
    color: `hsl(${track.color.hue}, ${track.color.saturation}%, ${track.color.lightness}%)`,
    muted: track.muted,
    solo: track.solo || false,
  }));
  
  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full glass rounded-lg overflow-hidden flex"
    >
      {/* Left: Track list */}
      <div className="flex flex-col" style={{ width: `${trackListWidth}px` }}>
        {/* Empty space above tracks (for ruler alignment) */}
        <div style={{ height: `${rulerHeight}px` }} className="border-b border-border bg-secondary/20" />
        
        {/* Track list */}
        <div className="overflow-y-auto" style={{ height: `${contentHeight}px` }}>
          <TrackList
            tracks={trackListData}
            trackHeight={trackHeight}
            onTrackSelect={setSelectedTrackId}
            onMuteToggle={onTrackMuteToggle}
            onSoloToggle={onTrackSoloToggle}
            selectedTrackId={selectedTrackId}
          />
        </div>
      </div>
      
      {/* Right: Timeline */}
      <div className="flex-1 flex flex-col">
        {/* Ruler */}
        <div className="relative" style={{ height: `${rulerHeight}px` }}>
          <TimelineRuler
            width={dimensions.width - trackListWidth}
            height={rulerHeight}
            bpm={bpm}
            onSeek={onSeek}
          />
        </div>
        
        {/* Scrollable timeline content */}
        <div
          className="relative overflow-auto"
          style={{ height: `${contentHeight}px` }}
          onScroll={handleScroll}
        >
          <div
            className="relative bg-background/20"
            style={{
              width: `${timelineWidth}px`,
              height: `${totalTracksHeight}px`,
            }}
          >
            {/* Grid overlay */}
            <GridOverlay
              width={timelineWidth}
              height={totalTracksHeight}
              bpm={bpm}
            />
            
            {/* Track lanes */}
            {tracks.map((track, index) => {
              const trackRegions = regions.filter(r => r.trackId === track.id);
              
              return (
                <div
                  key={track.id}
                  style={{
                    position: 'absolute',
                    top: `${index * trackHeight}px`,
                    width: '100%',
                    height: `${trackHeight}px`,
                  }}
                >
                  <TrackLane
                    trackId={track.id}
                    trackName={track.name}
                    trackColor={`hsl(${track.color.hue}, ${track.color.saturation}%, ${track.color.lightness}%)`}
                    regions={trackRegions}
                    width={timelineWidth}
                    height={trackHeight}
                    audioBuffers={audioBuffers}
                  />
                </div>
              );
            })}
            
            {/* Playhead */}
            <Playhead
              containerWidth={dimensions.width - trackListWidth}
              containerHeight={totalTracksHeight}
            />
          </div>
        </div>
      </div>
      
      {/* Zoom controls */}
      <div className="absolute bottom-2 right-2 flex gap-2 items-center glass px-3 py-1 rounded text-xs z-40">
        <span className="text-muted-foreground">Zoom:</span>
        <input
          type="range"
          min="10"
          max="500"
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          className="w-24 h-1 bg-secondary rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-foreground font-mono w-16">{Math.round(zoom)}px/s</span>
      </div>
    </div>
  );
}
