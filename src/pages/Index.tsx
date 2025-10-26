// REPLACE ENTIRE FILE WITH THIS CONTENT
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { MixxAmbientOverlay } from "@/components/MixxAmbientOverlay";
import { EnhancedTimelineView, TransportControls } from "@/studio/components";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { useProject, useTransport, useAudioEngine } from "@/contexts/ProjectContext";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";

import { AudioAnalyzer } from "@/audio/analysis/AudioAnalyzer";
import type { TimelineTrack, Region } from "@/types/timeline";

/* -------------------------------------------
   INLINE: TrackHeader (left lane menu / gutter)
-------------------------------------------- */
function TrackHeader({
  id,
  name,
  color,
  height,
  selected,
  onSelect,
  onDropFiles,
  muted,
  solo,
  recordArmed,
  onToggleMute,
  onToggleSolo,
  onToggleRecord,
}: {
  id: string;
  name: string;
  color: string;
  height: number;
  selected: boolean;
  onSelect: (id: string) => void;
  onDropFiles: (files: FileList, targetTrackId: string) => void;
  muted?: boolean;
  solo?: boolean;
  recordArmed?: boolean;
  onToggleMute?: (id: string) => void;
  onToggleSolo?: (id: string) => void;
  onToggleRecord?: (id: string) => void;
}) {
  return (
    <div
      role="button"
      onClick={() => onSelect(id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.length) {
          onDropFiles(e.dataTransfer.files, id);
        }
      }}
      className={[
        "relative rounded-xl mb-2 glass border border-border/30",
        selected ? "ring-2 ring-[hsl(var(--prime-500))]" : "",
      ].join(" ")}
      style={{ height }}
    >
      <div className="absolute left-0 top-0 h-full w-1.5 rounded-l-xl" style={{ background: color }} />
      <div className="flex h-full flex-col justify-between px-3 py-2">
        <div className="text-xs font-semibold truncate">{name}</div>
        <div className="flex items-center gap-2">
          <Button
            size="xs"
            variant={muted ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleMute?.(id);
            }}
          >
            M
          </Button>
          <Button
            size="xs"
            variant={solo ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleSolo?.(id);
            }}
          >
            S
          </Button>
          <Button
            size="xs"
            variant={recordArmed ? "default" : "outline"}
            onClick={(e) => {
              e.stopPropagation();
              onToggleRecord?.(id);
            }}
          >
            R
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   INLINE: TrackLanesLayout (headers + sync-scrolling)
----------------------------------------------------- */
function TrackLanesLayout({
  selectedTrackId,
  onSelectTrack,
  onDropFilesOnTrack,
  bpm,
  onBPMChange,
}: {
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  onDropFilesOnTrack: (files: FileList, targetTrackId: string) => void;
  bpm: number;
  onBPMChange: (v: number) => void;
}) {
  const { tracks } = useTracksStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const TRACK_HEADER_W = 240;
  const LANE_GAP = 8;

  const totalHeight = tracks.reduce((sum, t) => sum + (t.height ?? 96) + LANE_GAP, 0);

  // sync vertical scroll
  useEffect(() => {
    const a = headerRef.current,
      b = lanesRef.current;
    if (!a || !b) return;
    const onScrollA = () => {
      if (Math.abs(b.scrollTop - a.scrollTop) > 1) b.scrollTop = a.scrollTop;
      setScrollTop(a.scrollTop);
    };
    const onScrollB = () => {
      if (Math.abs(a.scrollTop - b.scrollTop) > 1) a.scrollTop = b.scrollTop;
      setScrollTop(b.scrollTop);
    };
    a.addEventListener("scroll", onScrollA);
    b.addEventListener("scroll", onScrollB);
    return () => {
      a.removeEventListener("scroll", onScrollA);
      b.removeEventListener("scroll", onScrollB);
    };
  }, []);

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left gutter: track headers */}
      <div
        className="shrink-0 border-r border-border/30 bg-background/60 backdrop-blur-sm"
        style={{ width: TRACK_HEADER_W }}
      >
        <div ref={headerRef} className="h-full overflow-y-auto px-3 py-2">
          <div style={{ height: totalHeight, position: "relative" }}>
            {
              tracks.reduce<{ top: number; nodes: JSX.Element[] }>(
                (acc, t) => {
                  const h = t.height ?? 96;
                  acc.nodes.push(
                    <div key={t.id} style={{ position: "absolute", left: 0, right: 0, top: acc.top }}>
                      <TrackHeader
                        id={t.id}
                        name={t.name}
                        color={t.color}
                        height={h}
                        selected={selectedTrackId === t.id}
                        onSelect={onSelectTrack}
                        onDropFiles={onDropFilesOnTrack}
                        muted={t.muted}
                        solo={t.solo}
                        recordArmed={t.recordArmed}
                      />
                    </div>,
                  );
                  acc.top += h + LANE_GAP;
                  return acc;
                },
                { top: 0, nodes: [] },
              ).nodes
            }
          </div>
        </div>
      </div>

      {/* Right: timeline surface */}
      <div className="grow relative">
        <div ref={lanesRef} className="absolute inset-0 overflow-auto">
          {/* Lanes background */}
          <div className="relative" style={{ height: totalHeight, minWidth: 1200 }}>
            {
              tracks.reduce<{ top: number; nodes: JSX.Element[] }>(
                (acc, t) => {
                  const h = t.height ?? 96;
                  acc.nodes.push(
                    <div
                      key={`lane-${t.id}`}
                      className="border-b border-border/20 bg-background/30"
                      style={{ position: "absolute", left: 0, right: 0, top: acc.top, height: h }}
                    />,
                  );
                  acc.top += h + LANE_GAP;
                  return acc;
                },
                { top: 0, nodes: [] },
              ).nodes
            }

            {/* Timeline renderer - can accept scrollTop/lane metrics when ready */}
            <div className="absolute inset-0">
              <EnhancedTimelineView
                bpm={bpm}
                onBPMChange={onBPMChange}
                // @ts-expect-error: optional extension hooks for your renderer
                scrollTop={scrollTop}
                // @ts-expect-error header width can be used to offset region drawing
                laneMetrics={{ headerWidth: TRACK_HEADER_W, laneGap: LANE_GAP }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------
   PAGE: Clean arrange view + targeted import
-------------------------------------------- */
export default function Index() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const { toast } = useToast();

  // Core contexts
  const { bpm, setBpm, masterVolume, setMasterVolume } = useProject();
  const audioEngine = useAudioEngine();
  const { transport, play, pause, stop, seek: seekTransport, toggleLoop, prevBar, nextBar } = useTransport();

  // Stores
  const { setCurrentTime, setDuration } = useTimelineStore();
  const { addTrack, addRegion } = useTracksStore();
  const mixerStore = useMixerStore();
  const { channels, addChannel, updatePeakLevel } = mixerStore;
  const setMixerMasterPeak = mixerStore.setMasterPeakLevel;

  // Drive timeline current time from transport
  useEffect(() => {
    if (!transport.isPlaying) return;
    const id = setInterval(() => setCurrentTime(transport.currentTime), 50);
    return () => clearInterval(id);
  }, [transport.isPlaying, transport.currentTime, setCurrentTime]);

  // Peak meters @30Hz
  useEffect(() => {
    const id = setInterval(() => {
      const master = audioEngine.getMasterPeakLevel();
      setMixerMasterPeak(master);
      channels.forEach((_, id) => updatePeakLevel(id, audioEngine.getTrackPeakLevel(id)));
    }, 33);
    return () => clearInterval(id);
  }, [channels, setMixerMasterPeak, updatePeakLevel, audioEngine]);

  // Import triggers
  const handleImport = () => fileInputRef.current?.click();
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      (async () => {
        for (const file of Array.from(files)) {
          await handleLoadTrack(file, selectedTrackId ?? undefined);
        }
        toast({ title: "Audio files imported", description: `${files.length} file(s) loaded` });
      })();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Allow explicit target track id (selected lane or drop)
  const handleLoadTrack = useCallback(
    async (file: File, targetTrackId?: string) => {
      if (!audioEngine) return;
      try {
        const newCandidateId = `track-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const trackId = targetTrackId || newCandidateId;

        // Load into engine channel identified by trackId (shared AudioContext inside engine)
        await audioEngine.loadTrack(trackId, file.name, file);
        const engineTracks = audioEngine.getTracks();
        const loadedTrack = engineTracks.find((t) => t.id === trackId);
        if (!loadedTrack?.buffer) {
          toast({ title: "Load failed", description: `No buffer for ${file.name}`, variant: "destructive" });
          return;
        }

        // Create track if it didn't exist
        const existing = useTracksStore.getState().tracks.find((t) => t.id === trackId);
        if (!existing) {
          const hue = Math.floor(Math.random() * 360);
          const color = `hsl(${hue}, 70%, 50%)`;
          const timelineTrack: TimelineTrack = {
            id: trackId,
            name: file.name,
            color,
            height: 96,
            regions: [],
            muted: false,
            solo: false,
            recordArmed: false,
          };
          addTrack(timelineTrack);

          // Mixer channel (sync)
          addChannel({
            id: trackId,
            name: file.name,
            volume: 0.75,
            pan: 0,
            muted: false,
            solo: false,
            color,
            peakLevel: { left: -60, right: -60 },
          });
          audioEngine.setTrackVolume(trackId, 0.75);
        }

        // Create region on that track (start at 0); attach precise meta
        const sr =
          (audioEngine.getSampleRate && audioEngine.getSampleRate()) ||
          (audioEngine.audioContext && audioEngine.audioContext.sampleRate) ||
          48000;

        const duration = loadedTrack.buffer.duration;
        const regionId = `region-${trackId}-${Date.now()}`;
        const region: Region = {
          id: regionId,
          trackId,
          name: file.name,
          startTime: 0,
          duration,
          bufferOffset: 0,
          bufferDuration: duration,
          color: useTracksStore.getState().tracks.find((t) => t.id === trackId)?.color ?? "#8b5cf6",
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
          locked: false,
          muted: false,
          // @ts-expect-error: stash precise fields in meta without breaking Region type
          meta: {
            audioBuffer: loadedTrack.buffer,
            startTimeSamples: 0,
            lengthSamples: Math.round(duration * sr),
            sampleRate: sr,
          },
        };
        addRegion(region);
        setSelectedTrackId(trackId);

        setDuration(Math.max(duration, transport.currentTime));
        toast({ title: existing ? "Track updated" : "Track created", description: `${file.name} → ${trackId}` });

        // Optional: lightweight analysis (non-blocking)
        setTimeout(() => {
          try {
            const nbpm = AudioAnalyzer.detectBPM(loadedTrack.buffer!);
            const { key, scale } = AudioAnalyzer.detectKey(loadedTrack.buffer!);
            const ts = AudioAnalyzer.inferTimeSignature(nbpm, loadedTrack.buffer!);
            // setBpm here only if you want global tempo to follow import:
            // setBpm(nbpm);
            (audioEngine as any).timeSignature = ts;
          } catch {}
        }, 50);
      } catch (err) {
        console.error("Failed to load track:", err);
        toast({ title: "Error", description: "Failed to load audio file", variant: "destructive" });
      }
    },
    [audioEngine, addTrack, addRegion, addChannel, setDuration, toast, transport.currentTime],
  );

  const handleDropFilesOnTrack = (files: FileList, targetTrackId: string) => {
    (async () => {
      for (const file of Array.from(files)) {
        await handleLoadTrack(file, targetTrackId);
      }
    })();
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const blob = await audioEngine.exportMix();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mixx-export-${Date.now()}.wav`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleSeek = (time: number) => seekTransport(time);

  // Keep only essential shortcuts
  useKeyboardShortcuts({
    onPlay: play,
    onPause: pause,
    onStop: stop,
    onExport: handleExport,
    onLoop: toggleLoop,
    onPrevBar: prevBar,
    onNextBar: nextBar,
  });

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileSelect} />

      {/* ALS / Ambient */}
      <MixxAmbientOverlay />

      {/* Minimal top-left import pill */}
      <div className="absolute top-4 left-4 z-40">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2 neon-glow-prime"
        >
          <Upload className="w-4 h-4" />
          Import
        </Button>
      </div>

      {/* Arrange-only: headers + timeline lanes */}
      <div className="flex-1 flex flex-col">
        <TrackLanesLayout
          selectedTrackId={selectedTrackId}
          onSelectTrack={setSelectedTrackId}
          onDropFilesOnTrack={handleDropFilesOnTrack}
          bpm={bpm}
          onBPMChange={setBpm}
        />
      </div>

      {/* Transport centered */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40">
        <TransportControls
          isPlaying={transport.isPlaying}
          onPlay={play}
          onPause={pause}
          onStop={stop}
          onExport={handleExport}
          isExporting={isExporting}
          bpm={bpm}
          timeSignature={{ numerator: 4, denominator: 4 }}
          onBpmChange={setBpm}
          onTimeSignatureChange={() => {}}
          isRecording={transport.isRecording}
          isLooping={transport.loopEnabled}
          onRecord={() => {}}
          onLoopToggle={toggleLoop}
          onPrevBar={prevBar}
          onNextBar={nextBar}
          currentTime={transport.currentTime}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
        />
      </div>
    </div>
  );
}
