/**
 * Advanced Timeline View - Revolutionary 2027 timeline with intelligent features
 * ALIGNED: Using standard header height and panel widths
 */

import React, { useRef, useEffect, useState } from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { useTracksStore } from '@/store/tracksStore';
import { usePatternStore } from '@/store/patternStore';
import { Region } from '@/types/timeline';
import { TimelineRuler } from './TimelineRuler';
import { TimelineTrackRow } from './TimelineTrackRow';
import { ProfessionalTrackHeader } from './ProfessionalTrackHeader';
import { ContextualBloomWrapper, EdgeBloomTrigger } from '@/components/Bloom';
import { Playhead } from './Playhead';
import { GridOverlay } from './GridOverlay';
import { SnapGuide } from './SnapGuide';
import { TimelineToolbar } from './TimelineToolbar';
import { AddTrackDialog, TrackConfig } from './AddTrackDialog';
import { CrossfadeRenderer } from './CrossfadeRenderer';
import { ArrangeBrowserPanel } from './ArrangeBrowserPanel';
import { RippleEditIndicator } from './RippleEditIndicator';
import { KeyboardShortcutsHelper } from './KeyboardShortcutsHelper';
import { PatternBrowser } from './PatternBrowser';
import { PatternInstance } from './PatternInstance';
import { PianoRollOverlay } from './PianoRollOverlay';
import { SampleChopMode } from './SampleChopMode';
import { useRegionClipboard } from '@/hooks/useRegionClipboard';
import { useTimelineKeyboardShortcuts } from '@/hooks/useTimelineKeyboardShortcuts';
import { ZoomIn, ZoomOut, Grid3x3, Plus, Folders, Settings2, ChevronLeft, ChevronRight, Layers, Music2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { HEADER_HEIGHT, RULER_HEIGHT, TRACK_HEIGHT, TRACK_LIST_WIDTH, TRACK_LIST_COLLAPSED, PANEL_WIDTH_SM, SPACING } from '@/lib/layout-constants';
import { useViewStore } from '@/store/viewStore';

// Dynamic hip-hop encouragement messages based on session time
const getHipHopEncouragement = (minutes: number): string => {
  if (minutes < 5) return "Let's Get It Started 🔥";
  if (minutes < 15) return "Keep Cookin' 🎵";
  if (minutes < 30) return "Heat Rising! 🌡️";
  if (minutes < 45) return "You're In The Zone! ⚡";
  if (minutes < 60) return "This Beat Is Fire! 🔥";
  if (minutes < 90) return "Legendary Session! 👑";
  if (minutes < 120) return "You're On Fire! 💯";
  return "Classic In The Making! 🏆";
};

interface AdvancedTimelineViewProps {
  audioBuffers: Map<string, AudioBuffer>;
  onSeek: (time: number) => void;
  onFileSelect?: (file: File) => void;
  onPluginSelect?: (pluginId: string) => void;
  selectedTrackId?: string | null;
  onTrackSelect?: (trackId: string | null) => void;
}

export const AdvancedTimelineView: React.FC<AdvancedTimelineViewProps> = ({
  audioBuffers,
  onSeek,
  onFileSelect,
  onPluginSelect,
  selectedTrackId: externalSelectedTrackId,
  onTrackSelect
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [browserCollapsed, setBrowserCollapsed] = useState(false); // Default to expanded
  
  const { showTimelineRuler } = useViewStore();
  
  const [trackListCollapsed, setTrackListCollapsed] = useState(() => {
    const saved = localStorage.getItem('trackListCollapsed');
    return saved === 'true'; // Default to collapsed
  });
  
  // Track session time for dynamic encouragement
  const [sessionMinutes, setSessionMinutes] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());
  const [snapGuidePositions, setSnapGuidePositions] = useState<number[]>([]);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 60000);
      setSessionMinutes(elapsed);
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, [sessionStartTime]);
  
  const { 
    currentTime, 
    zoom, 
    scrollX,
    gridSnap,
    currentTool,
    snapMode,
    rippleEdit,
    setZoom,
    setScrollX,
    setSnapMode,
    clearSelection,
  } = useTimelineStore();
  
  // Clipboard functionality
  const { handleCopy, handlePaste, handleDuplicate, hasClipboard } = useRegionClipboard();
  
  // Timeline keyboard shortcuts
  useTimelineKeyboardShortcuts(
    onSeek,
    undefined, // play/pause handled by parent
    undefined, // stop handled by parent
    undefined  // record handled by parent
  );
  
  const { 
    tracks, 
    regions, 
    selectedTrackId,
    selectedRegionIds,
    selectTrack,
    selectRegion,
    updateTrack,
    getTrackRegions,
    addRegion,
    removeRegion,
    updateRegion,
    setAddTrackDialogOpen,
    addTrackDialogOpen,
  } = useTracksStore();
  
  // Pattern store
  const {
    patterns,
    patternInstances,
    timelineMode,
    setTimelineMode,
    addPatternInstance,
    createPatternFromSelection,
  } = usePatternStore();
  
  const [patternBrowserCollapsed, setPatternBrowserCollapsed] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ trackId: string; time: number } | null>(null);
  const [pianoRollRegionId, setPianoRollRegionId] = useState<string | null>(null);
  const [chopModeRegion, setChopModeRegion] = useState<{ regionId: string; buffer: AudioBuffer } | null>(null);
  
  // Track control handlers
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
  
  const handleLockToggle = (trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    if (track) {
      updateTrack(trackId, { locked: !track.locked });
    }
  };
  
  // Handler for creating new tracks
  const handleCreateTrack = (config: TrackConfig) => {
    console.log('Creating track:', config);
    // Will be implemented later
  };

  // Sync selected track with external prop
  const handleSelectTrack = (trackId: string) => {
    selectTrack(trackId);
    onTrackSelect?.(trackId);
  };
  
  // Sync external track selection with internal store
  useEffect(() => {
    if (externalSelectedTrackId !== undefined && externalSelectedTrackId !== selectedTrackId) {
      selectTrack(externalSelectedTrackId);
    }
  }, [externalSelectedTrackId, selectedTrackId, selectTrack]);
  
  const handleSelectRegion = (id: string, multi?: boolean) => {
    const region = regions.find(r => r.id === id);
    if (region && !multi) {
      selectTrack(region.trackId);
    }
    selectRegion(id, multi);
  };
  
  const handleSplitRegion = (regionId: string, splitTime: number) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    const splitDuration = splitTime - region.startTime;
    
    // Create two new regions
    const region1 = {
      ...region,
      id: `${region.id}-1`,
      duration: splitDuration,
      bufferDuration: splitDuration,
      fadeOut: 0
    };
    
    const region2 = {
      ...region,
      id: `${region.id}-2`,
      startTime: splitTime,
      duration: region.duration - splitDuration,
      bufferOffset: region.bufferOffset + splitDuration,
      bufferDuration: region.bufferDuration - splitDuration,
      fadeIn: 0
    };
    
    // Remove original and add two new regions
    removeRegion(regionId);
    addRegion(region1);
    addRegion(region2);
  };
  
  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollX(e.currentTarget.scrollLeft);
  };
  
  // Handle zoom with mouse wheel
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(zoom * delta);
      }
    };
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [zoom, setZoom]);
  
  // Handle timeline click for seeking
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (e.target === contentRef.current || (e.target as HTMLElement).classList.contains('grid-overlay')) {
      const rect = contentRef.current?.getBoundingClientRect();
      if (rect) {
        const x = e.clientX - rect.left + scrollX;
        const time = x / zoom;
        onSeek(time);
        clearSelection();
      }
    }
  };
  
  // Handle pattern drop on timeline
  const handleTimelineDrop = (e: React.DragEvent) => {
    e.preventDefault();
    
    const patternId = e.dataTransfer.getData('patternId');
    if (!patternId) return;
    
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;
    
    const rect = contentRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left + scrollX;
    const time = x / zoom;
    
    const y = e.clientY - rect.top;
    const trackIndex = Math.floor(y / TRACK_HEIGHT);
    const track = tracks[trackIndex];
    
    if (!track) return;
    
    // Create pattern instance
    const instance = {
      id: `instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      patternId: pattern.id,
      trackId: track.id,
      startTime: time,
      duration: pattern.duration,
      unique: false,
      muted: false,
    };
    
    addPatternInstance(instance);
    toast.success(`Pattern "${pattern.name}" added to ${track.name}`);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };
  
  // Handle sample chop mode
  const handleChopSample = (regionId: string) => {
    const region = regions.find(r => r.id === regionId);
    if (!region) return;
    
    const buffer = audioBuffers.get(region.trackId);
    if (!buffer) {
      toast.error('Audio buffer not loaded');
      return;
    }
    
    setChopModeRegion({ regionId, buffer });
  };
  
  const handleCreateSlices = (slicePoints: number[], velocities?: number[]) => {
    if (!chopModeRegion) return;
    
    const region = regions.find(r => r.id === chopModeRegion.regionId);
    if (!region) return;
    
    // Remove original region
    removeRegion(region.id);
    
    // Create new regions for each slice
    slicePoints.forEach((sliceTime, index) => {
      const nextSliceTime = slicePoints[index + 1] || region.duration;
      const sliceDuration = nextSliceTime - sliceTime;
      
      if (sliceDuration > 0.01) { // Minimum 10ms slice
        const newRegion: Region = {
          ...region,
          id: `${region.id}-slice-${index}`,
          name: `${region.name} [${index + 1}]`,
          startTime: region.startTime + sliceTime,
          duration: sliceDuration,
          bufferOffset: region.bufferOffset + sliceTime,
          bufferDuration: sliceDuration,
          velocity: velocities?.[index] || 1.0, // Store velocity
        };
        
        addRegion(newRegion);
      }
    });
    
    toast.success(`Created ${slicePoints.length} slices with velocity`);
  };
  
  const handleConvertSlicesToPattern = (slicePoints: number[], velocities?: number[]) => {
    if (!chopModeRegion) return;
    
    const region = regions.find(r => r.id === chopModeRegion.regionId);
    if (!region) return;
    
    // Create slices as regions first
    const sliceRegionIds: string[] = [];
    
    slicePoints.forEach((sliceTime, index) => {
      const nextSliceTime = slicePoints[index + 1] || region.duration;
      const sliceDuration = nextSliceTime - sliceTime;
      
      if (sliceDuration > 0.01) {
        const newRegion: Region = {
          ...region,
          id: `${region.id}-slice-${index}`,
          name: `${region.name} [${index + 1}]`,
          startTime: region.startTime + sliceTime,
          duration: sliceDuration,
          bufferOffset: region.bufferOffset + sliceTime,
          bufferDuration: sliceDuration,
          velocity: velocities?.[index] || 1.0, // Store velocity
        };
        
        addRegion(newRegion);
        sliceRegionIds.push(newRegion.id);
      }
    });
    
    // Remove original region
    removeRegion(region.id);
    
    // Create pattern from slices
    const pattern = createPatternFromSelection(
      `${region.name} Chops`,
      'drums',
      sliceRegionIds
    );
    
    if (pattern) {
      toast.success(`Created pattern with ${slicePoints.length} slices and velocity`);
    }
  };
  
  const totalWidth = Math.max(3000, currentTime * zoom + 1000);

  // Save browser collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('browserCollapsed', browserCollapsed.toString());
  }, [browserCollapsed]);
  
  // Save track list collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem('trackListCollapsed', trackListCollapsed.toString());
  }, [trackListCollapsed]);
  
  // Browser panel keyboard shortcut (B key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input fields
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'b' || e.key === 'B') {
        setBrowserCollapsed(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Auto-scroll follow playhead when enabled
  const { autoScrollEnabled } = useTimelineStore();
  useEffect(() => {
    if (!autoScrollEnabled || !containerRef.current) return;
    
    const playheadX = currentTime * zoom;
    const containerWidth = containerRef.current.clientWidth;
    const scrollLeft = containerRef.current.scrollLeft;
    const scrollRight = scrollLeft + containerWidth;
    
    // If playhead is outside visible area, scroll to center it
    if (playheadX < scrollLeft + containerWidth * 0.2 || playheadX > scrollRight - containerWidth * 0.2) {
      containerRef.current.scrollLeft = playheadX - containerWidth * 0.4;
    }
  }, [currentTime, zoom, autoScrollEnabled]);
  
  return (
    <div className="h-full flex flex-col relative bg-background">
      {/* Ripple Edit Indicator */}
      <RippleEditIndicator active={rippleEdit} />
      
      {/* Background ambience */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/3 left-1/4 w-[500px] h-[500px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(275 100% 65% / 0.08) 0%, transparent 70%)',
            filter: 'blur(120px)',
            animation: 'float 25s ease-in-out infinite'
          }}
        />
        <div 
          className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(191 100% 50% / 0.06) 0%, transparent 70%)',
            filter: 'blur(100px)',
            animation: 'float 30s ease-in-out infinite reverse'
          }}
        />
      </div>
      
      {/* Main background with gradient mesh */}
      <div 
        className="absolute inset-0 -z-20"
        style={{
          background: `
            var(--gradient-mesh),
            linear-gradient(180deg, 
              hsl(240 15% 4%) 0%, 
              hsl(240 10% 2%) 100%
            )
          `
        }}
      />
      
      {/* Timeline Toolbar - COMPACT professional style - SPANS FULL WIDTH */}
      <div 
        className="flex-none flex items-center justify-between px-4 border-b border-border/30 bg-background/80"
        style={{ height: '48px' }}
      >
        {/* Left section - Tools */}
        <div className="flex items-center gap-2">
          {/* Timeline Mode Toggle */}
          <div className="flex gap-1 p-1 rounded glass-medium border border-border/30">
            <Button
              size="sm"
              variant={timelineMode === 'audio' ? 'secondary' : 'ghost'}
              onClick={() => setTimelineMode('audio')}
              className="h-7 px-3"
            >
              <Music2 className="h-3 w-3 mr-1" />
              Audio
            </Button>
            <Button
              size="sm"
              variant={timelineMode === 'pattern' ? 'secondary' : 'ghost'}
              onClick={() => setTimelineMode('pattern')}
              className="h-7 px-3"
            >
              <Layers className="h-3 w-3 mr-1" />
              Pattern
            </Button>
          </div>
          
          <div className="w-px h-6 bg-border/50" />
          
          <TimelineToolbar />
        </div>
        
        {/* Right section - Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setZoom(zoom * 0.8)} title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <span className="text-xs text-muted-foreground min-w-[60px] text-center">
            {zoom.toFixed(0)}px/s
          </span>
          
          <Button size="sm" variant="ghost" onClick={() => setZoom(zoom * 1.2)} title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-6 bg-border/50 mx-1" />
          
          <Button
            size="sm"
            variant={snapMode !== 'off' ? 'secondary' : 'ghost'}
            onClick={() => setSnapMode(snapMode === 'off' ? 'grid' : 'off')}
            title={`Snap: ${snapMode}`}
          >
            <Grid3x3 className="h-4 w-4" />
          </Button>
          
          <KeyboardShortcutsHelper />
          
          <div className="w-px h-6 bg-border/50 mx-1" />
          
          <Button size="sm" variant="default" onClick={() => setAddTrackDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Track
          </Button>
        </div>
      </div>
        
      {/* Main Timeline Area - Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Pattern Browser - Left side in pattern mode */}
        {timelineMode === 'pattern' && !patternBrowserCollapsed && (
          <div 
            className="flex-shrink-0"
            style={{ width: `${PANEL_WIDTH_SM}px` }}
          >
            <PatternBrowser />
          </div>
        )}
        
        {timelineMode === 'pattern' && patternBrowserCollapsed && (
          <div 
            className="flex-shrink-0 glass-light border-r border-gradient flex items-start justify-center pt-2"
            style={{ width: `${TRACK_LIST_COLLAPSED}px` }}
          >
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setPatternBrowserCollapsed(false)}
              className="h-8 w-8 p-0"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        )}
        
        {/* Timeline area */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            {/* Timeline ruler - OPTIONAL */}
            {showTimelineRuler && (
              <div 
                className="relative glass-light border-b border-gradient"
                style={{ 
                  height: `${RULER_HEIGHT}px`,
                  backdropFilter: 'blur(40px) saturate(180%)'
                }}
              >
                <TimelineRuler
                  width={containerRef.current?.clientWidth || 800}
                  height={RULER_HEIGHT}
                  bpm={120}
                  onSeek={onSeek}
                />
              </div>
            )}
            
            {/* Scrollable timeline content */}
            <div 
              ref={containerRef}
              className="flex-1 overflow-auto relative"
              onScroll={handleScroll}
              style={{
                background: 'linear-gradient(180deg, hsl(240 15% 4% / 0.8) 0%, hsl(240 10% 2% / 0.6) 100%)',
                backdropFilter: 'blur(20px)',
                minHeight: 0
              }}
            >
              <div 
                ref={contentRef}
                className="relative"
                style={{ width: `${totalWidth}px` }}
                onClick={handleTimelineClick}
                onDrop={handleTimelineDrop}
                onDragOver={handleDragOver}
              >
                {/* Grid overlay */}
                <GridOverlay
                  width={totalWidth}
                  height={tracks.length * TRACK_HEIGHT}
                  bpm={120}
                />
                
                {/* Snap guides */}
                <SnapGuide
                  snapPositions={snapGuidePositions}
                  zoom={zoom}
                  height={tracks.length * TRACK_HEIGHT}
                />
                
                {/* Playhead */}
                <Playhead
                  containerWidth={containerRef.current?.clientWidth || 800}
                  containerHeight={tracks.length * TRACK_HEIGHT}
                />

                {/* Crossfade Renderer */}
                <CrossfadeRenderer
                  regions={regions}
                  zoom={zoom}
                  trackHeight={100}
                />
                
                {/* Tracks */}
                {tracks.map((track) => (
                  <TimelineTrackRow
                    key={track.id}
                    track={track}
                    regions={getTrackRegions(track.id)}
                    audioBuffers={audioBuffers}
                    zoom={zoom}
                    isSelected={selectedTrackId === track.id}
                    onSelectTrack={handleSelectTrack}
                    onUpdateRegion={updateRegion}
                    onSelectRegion={handleSelectRegion}
                    onSplitRegion={handleSplitRegion}
                    selectedRegionIds={new Set(selectedRegionIds)}
                    onChopSample={handleChopSample}
                  />
                ))}
                
                {/* Pattern Instances - Only in pattern mode */}
                {timelineMode === 'pattern' && tracks.map((track, trackIndex) => {
                  const trackPatterns = patternInstances.filter(p => p.trackId === track.id);
                  
                  return trackPatterns.map((instance) => (
                    <div
                      key={instance.id}
                      className="absolute"
                      style={{
                        top: trackIndex * TRACK_HEIGHT,
                        left: 0,
                        right: 0,
                        height: TRACK_HEIGHT,
                        pointerEvents: 'none',
                      }}
                    >
                      <PatternInstance
                        instance={instance}
                        zoom={zoom}
                        scrollX={scrollX}
                        trackHeight={TRACK_HEIGHT}
                        isSelected={selectedRegionIds.includes(instance.id)}
                        onSelect={handleSelectRegion}
                      />
                    </div>
                  ));
                })}
                
                {tracks.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="text-lg mb-2">No tracks loaded</p>
                      <p className="text-sm">Load audio files to get started</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Track List Sidebar - STANDARD WIDTH */}
          {!trackListCollapsed && (
            <div 
              className="flex-shrink-0 border-l border-gradient flex flex-col"
              style={{ 
                width: `${TRACK_LIST_WIDTH}px`,
                background: `
                  radial-gradient(circle at 80% 50%, hsl(275 100% 65% / 0.03) 0%, transparent 50%),
                  var(--gradient-mesh),
                  linear-gradient(135deg, hsl(var(--glass-medium)), hsl(var(--glass-ultra)))
                `,
                backdropFilter: 'blur(80px) saturate(220%)',
                boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.1)'
              }}
            >
              {/* Sidebar Header - MATCHES RULER HEIGHT OR HIDDEN */}
              {showTimelineRuler ? (
                <div 
                  className="flex items-center justify-start px-4 glass-ultra border-b border-gradient"
                  style={{ height: `${RULER_HEIGHT}px` }}
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTrackListCollapsed(true)}
                    className="h-8 w-8 p-0 micro-interact chromatic-hover"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-start px-4 glass-ultra border-b border-gradient py-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setTrackListCollapsed(true)}
                    className="h-8 w-8 p-0 micro-interact chromatic-hover"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
              )}
              
              {/* Track List */}
              <div className="flex-1 overflow-y-auto">
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
                    isSelected={selectedTrackId === track.id}
                    height={TRACK_HEIGHT}
                    onSelect={handleSelectTrack}
                    onMuteToggle={handleMuteToggle}
                    onSoloToggle={handleSoloToggle}
                    onRecordArmToggle={handleRecordArmToggle}
                    onLockToggle={handleLockToggle}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* Collapsed Track List Toggle Button - STANDARD COLLAPSED WIDTH */}
          {trackListCollapsed && (
            <div 
              className="flex-shrink-0 glass-light border-l border-gradient flex items-start justify-center pt-2"
              style={{ 
                width: `${TRACK_LIST_COLLAPSED}px`,
                backdropFilter: 'blur(60px) saturate(200%)'
              }}
            >
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTrackListCollapsed(false)}
                className="h-8 w-8 p-0 micro-interact chromatic-hover"
              >
                <ChevronLeft size={16} />
              </Button>
            </div>
          )}

          {/* Right Browser Panel */}
          <ArrangeBrowserPanel
            selectedTrackId={selectedTrackId}
            onFileSelect={onFileSelect}
            onPluginSelect={onPluginSelect}
            isCollapsed={browserCollapsed}
            onToggleCollapse={() => setBrowserCollapsed(!browserCollapsed)}
            onOpenPianoRoll={setPianoRollRegionId}
          />
        </div>

      {/* Piano Roll Overlay */}
      {pianoRollRegionId && (
        <PianoRollOverlay
          regionId={pianoRollRegionId}
          onClose={() => setPianoRollRegionId(null)}
        />
      )}

      {/* Sample Chop Mode Overlay */}
      {chopModeRegion && (() => {
        const region = regions.find(r => r.id === chopModeRegion.regionId);
        if (!region) return null;
        
        return (
          <SampleChopMode
            region={region}
            audioBuffer={chopModeRegion.buffer}
            zoom={zoom}
            scrollX={scrollX}
            onClose={() => setChopModeRegion(null)}
            onCreateSlices={handleCreateSlices}
            onConvertToPattern={handleConvertSlicesToPattern}
          />
        );
      })()}

      {/* Add Track Dialog */}
      <AddTrackDialog
        open={addTrackDialogOpen}
        onOpenChange={setAddTrackDialogOpen}
        onCreateTrack={handleCreateTrack}
      />
    </div>
  );
};
