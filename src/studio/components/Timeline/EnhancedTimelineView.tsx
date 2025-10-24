/**
 * Enhanced Timeline View - Complete canvas-based DAW timeline
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { WaveformGenerator, AudioFileData } from '@/audio/WaveformGenerator';
import { CanvasTimelineRenderer } from './CanvasTimelineRenderer';
import { TimelineRuler } from './TimelineRuler';
import { CollapsibleTimelineToolbar } from './CollapsibleTimelineToolbar';
import { Button } from '@/components/ui/button';
import { Upload, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface EnhancedTimelineViewProps {
  bpm: number;
  onBPMChange?: (bpm: number) => void;
}

export const EnhancedTimelineView: React.FC<EnhancedTimelineViewProps> = ({
  bpm,
  onBPMChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { toast } = useToast();

  const {
    currentTime,
    setCurrentTime,
    isPlaying,
    zoom,
    setZoom,
    scrollX,
    setScrollX,
    duration,
    setDuration,
  } = useTimelineStore();

  const { tracks, regions, addTrack, addRegion } = useTracksStore();

  const trackHeight = 72; // Fixed track height
  const rulerHeight = 32;
  const toolbarHeight = 48;
  const contentHeight = dimensions.height - rulerHeight - toolbarHeight;

  // Measure container
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    const resizeObserver = new ResizeObserver(updateDimensions);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  // Transport tick (RAF)
  useEffect(() => {
    if (!isPlaying) return;

    let lastTime = performance.now();
    let rafId: number;

    const tick = (time: number) => {
      const deltaMs = time - lastTime;
      lastTime = time;
      const deltaSec = deltaMs / 1000;

      setCurrentTime(currentTime + deltaSec);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, currentTime, setCurrentTime]);

  // Handle file upload
  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const waveformGen = new WaveformGenerator();
    
    for (const file of Array.from(files)) {
      try {
        const audioData: AudioFileData = await waveformGen.loadAudioFile(file);
        const trackId = `track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const regionId = `region-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        const color = getTrackColor(tracks.length);

        // Add track
        addTrack({
          id: trackId,
          name: baseName,
          type: 'audio',
          height: trackHeight,
          volume: 0.8,
          pan: 0,
          muted: false,
          solo: false,
          recordArmed: false,
          color,
          inserts: Array(8).fill(null).map((_, i) => ({
            slotNumber: i + 1,
            pluginId: null,
            instanceId: null,
            bypass: false,
          })),
          sends: [],
        });

        // Add region
        addRegion({
          id: regionId,
          trackId,
          name: baseName,
          startTime: 0,
          duration: audioData.duration,
          bufferOffset: 0,
          bufferDuration: audioData.duration,
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
          locked: false,
          muted: false,
          color,
          audioBuffer: audioData.buffer,
          peaks: audioData.peaks,
          bins: audioData.bins,
        });

        // Update duration if needed
        if (audioData.duration > duration) {
          setDuration(audioData.duration);
        }

        toast({
          title: 'Audio loaded',
          description: `${baseName} added to timeline`,
        });
      } catch (error) {
        console.error('Error loading audio file:', error);
        toast({
          title: 'Error loading audio',
          description: `Failed to load ${file.name}`,
          variant: 'destructive',
        });
      }
    }

    waveformGen.dispose();
  }, [tracks, duration, addTrack, addRegion, setDuration, toast]);

  // Handle zoom (ctrl+wheel)
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      } else {
        // Horizontal scroll
        setScrollX(Math.max(0, scrollX + e.deltaY));
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false });
      return () => container.removeEventListener('wheel', handleWheel);
    }
  }, [zoom, scrollX, setZoom, setScrollX]);

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  const handleRegionClick = (regionId: string) => {
    console.log('Region clicked:', regionId);
    // TODO: Select region
  };

  const timelineWidth = Math.max(dimensions.width, duration * zoom);

  return (
    <div ref={containerRef} className="relative w-full h-full flex flex-col glass rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b border-border/50" style={{ height: toolbarHeight }}>
        <div className="h-full flex items-center justify-between px-3">
          <CollapsibleTimelineToolbar />
        </div>
      </div>

      {/* Ruler */}
      <div className="border-b border-border/50" style={{ height: rulerHeight }}>
        <TimelineRuler
          width={dimensions.width}
          height={rulerHeight}
          bpm={bpm}
          onSeek={handleSeek}
        />
      </div>

      {/* Timeline content */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            width: dimensions.width,
            height: contentHeight,
          }}
        >
            {/* Canvas timeline always rendered; empty state moved to toolbar */}
            <CanvasTimelineRenderer
              width={dimensions.width}
              height={contentHeight}
              trackHeight={trackHeight}
              onRegionClick={handleRegionClick}
              onSeek={handleSeek}
            />
        </div>
      </div>


      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*"
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  );
};

/**
 * Get track color based on index
 */
function getTrackColor(index: number): string {
  const colors = [
    '#9B5EFF', // Purple
    '#30E1C6', // Teal
    '#FF6B6B', // Red
    '#FFD166', // Yellow
    '#06D6A0', // Green
    '#118AB2', // Blue
    '#EF476F', // Pink
    '#FCA311', // Orange
  ];
  return colors[index % colors.length];
}
