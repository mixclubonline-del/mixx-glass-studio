// REPLACE ENTIRE PAGE WITH THIS
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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

/* ------------------------------
   Small UI helpers (DAW style)
-------------------------------*/
function dbToLinear(db: number) {
  // -60..0 dB -> 0..1
  const clamped = Math.max(-60, Math.min(0, db));
  return Math.pow(10, clamped / 20);
}

function Knob({
  value,
  min = -1,
  max = 1,
  step = 0.01,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  label?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-14 h-5 accent-[hsl(var(--prime-500))]"
      />
      {label && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}

function MiniFader({ value, onChange, label }: { value: number; onChange: (v: number) => void; label?: string }) {
  return (
    <div className="flex flex-col items-center">
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="h-24 w-4 accent-[hsl(var(--prime-500))] rotate-[-90deg]"
        style={{ transformOrigin: "center" }}
        aria-label={label || "Volume"}
      />
      {label && <span className="mt-1 text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}

/* -------------------------------------------
   INLINE: DAW TrackHeader (left track bar)
-------------------------------------------- */
function TrackHeader({
  index,
  id,
  name,
  color,
  height,
  selected,
  muted,
  solo,
  recordArmed,
  peakL = -60,
  peakR = -60,
  volume = 0.75,
  pan = 0,
  inputId,
  outputId,
  onSelect,
  onDropFiles,
  onToggleMute,
  onToggleSolo,
  onToggleRecord,
  onSetVolume,
  onSetPan,
  onSetInput,
  onSetOutput,
  onToggleMonitor,
}: {
  index: number;
  id: string;
  name: string;
  color: string;
  height: number;
  selected: boolean;
  muted?: boolean;
  solo?: boolean;
  recordArmed?: boolean;
  peakL?: number;
  peakR?: number;
  volume?: number;
  pan?: number;
  inputId?: string;
  outputId?: string;
  onSelect: (id: string) => void;
  onDropFiles: (files: FileList, targetTrackId: string) => void;
  onToggleMute: (id: string) => void;
  onToggleSolo: (id: string) => void;
  onToggleRecord: (id: string) => void;
  onSetVolume: (id: string, v: number) => void;
  onSetPan: (id: string, v: number) => void;
  onSetInput: (id: string, inputId: string) => void;
  onSetOutput: (id: string, outputId: string) => void;
  onToggleMonitor: (id: string) => void;
}) {
  const linL = dbToLinear(peakL ?? -60);
  const linR = dbToLinear(peakR ?? -60);

  return (
    <div
      role="button"
      onClick={() => onSelect(id)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer?.files?.length) onDropFiles(e.dataTransfer.files, id);
      }}
      className={[
        "relative mb-2 glass border border-border/30 rounded-xl overflow-hidden",
        selected ? "ring-2 ring-[hsl(var(--prime-500))]" : "",
      ].join(" ")}
      style={{ height }}
    >
      {/* color spine */}
      <div className="absolute left-0 top-0 h-full w-1.5" style={{ background: color }} />

      <div className="h-full pl-2 pr-2 py-2 flex gap-2">
        {/* 1) index + name + quick M/S/R/Mon */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[10px] px-1.5 py-0.5 rounded bg-foreground/10">{index}</div>
            <div className="truncate text-xs font-semibold">{name}</div>
          </div>
          <div className="flex items-center gap-1 pt-1">
            <Button
              size="xs"
              variant={muted ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute(id);
              }}
            >
              M
            </Button>
            <Button
              size="xs"
              variant={solo ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleSolo(id);
              }}
            >
              S
            </Button>
            <Button
              size="xs"
              variant={recordArmed ? "default" : "outline"}
              onClick={(e) => {
                e.stopPropagation();
                onToggleRecord(id);
              }}
            >
              R
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onToggleMonitor(id);
              }}
            >
              👂
            </Button>
          </div>

          {/* I/O row (typical DAW) */}
          <div className="mt-1 grid grid-cols-2 gap-1">
            <select
              className="bg-background/60 border border-border/30 rounded px-1 py-0.5 text-[11px] truncate"
              value={inputId || ""}
              onChange={(e) => onSetInput(id, e.target.value)}
              title="Input"
            >
              <option value="">Input</option>
              {/* Options are populated from parent (we call setters only) */}
              {/* The actual list is handled in parent using audioEngine */}
            </select>
            <select
              className="bg-background/60 border border-border/30 rounded px-1 py-0.5 text-[11px] truncate"
              value={outputId || ""}
              onChange={(e) => onSetOutput(id, e.target.value)}
              title="Output"
            >
              <option value="">Output</option>
            </select>
          </div>
        </div>

        {/* 2) meter */}
        <div className="w-3 flex flex-col justify-end items-center gap-1">
          <div className="relative h-16 w-1.5 rounded bg-foreground/10 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--prime-500))]/80"
              style={{ height: `${linL * 100}%` }}
            />
          </div>
          <div className="relative h-16 w-1.5 rounded bg-foreground/10 overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-[hsl(var(--prime-500))]/60"
              style={{ height: `${linR * 100}%` }}
            />
          </div>
        </div>

        {/* 3) pan + mini fader */}
        <div className="flex flex-col items-center justify-between">
          <Knob value={pan ?? 0} min={-1} max={1} step={0.01} onChange={(v) => onSetPan(id, v)} label="Pan" />
          <MiniFader value={volume ?? 0.75} onChange={(v) => onSetVolume(id, v)} label="Vol" />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------
   INLINE: TrackLanesLayout (headers + sync scroll)
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
  const { channels } = useMixerStore();
  const headerRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const TRACK_HEADER_W = 260;
  const LANE_GAP = 8;

  const totalHeight = useMemo(() => tracks.reduce((sum, t) => sum + (t.height ?? 96) + LANE_GAP, 0), [tracks]);

  // Build a quick map: channel peak/vol/pan by id
  const chan = useMixerStore.getState().channels;

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
      {/* Left: track headers */}
      <div
        className="shrink-0 border-r border-border/30 bg-background/60 backdrop-blur-sm"
        style={{ width: TRACK_HEADER_W }}
      >
        <div ref={headerRef} className="h-full overflow-y-auto px-3 py-2">
          <div style={{ height: totalHeight, position: "relative" }}>
            {
              tracks.reduce<{ top: number; nodes: JSX.Element[] }>(
                (acc, t, i) => {
                  const h = t.height ?? 96;
                  const ch = chan.get(t.id);
                  acc.nodes.push(
                    <div key={t.id} style={{ position: "absolute", left: 0, right: 0, top: acc.top }}>
                      <TrackHeader
                        index={i + 1}
                        id={t.id}
                        name={t.name}
                        color={t.color}
                        height={h}
                        selected={selectedTrackId === t.id}
                        muted={t.muted}
                        solo={t.solo}
                        recordArmed={t.recordArmed}
                        peakL={ch?.peakLevel?.left ?? -60}
                        peakR={ch?.peakLevel?.right ?? -60}
                        volume={ch?.volume ?? 0.75}
                        pan={ch?.pan ?? 0}
                        onSelect={onSelectTrack}
                        onDropFiles={onDropFilesOnTrack}
                        onToggleMute={(id) => useTracksStore.getState().updateTrack(id, { muted: !t.muted })}
                        onToggleSolo={(id) => useTracksStore.getState().updateTrack(id, { solo: !t.solo })}
                        onToggleRecord={(id) =>
                          useTracksStore.getState().updateTrack(id, { recordArmed: !t.recordArmed })
                        }
                        onSetVolume={(id, v) => useMixerStore.getState().updateChannel(id, { volume: v })}
                        onSetPan={(id, v) => useMixerStore.getState().updateChannel(id, { pan: v })}
                        onSetInput={(id, input) => {
                          /* wired in parent via audioEngine if needed */
                        }}
                        onSetOutput={(id, output) => {
                          /* wired in parent via audioEngine if needed */
                        }}
                        onToggleMonitor={(id) => {
                          /* optionally: audioEngine.setTrackMonitor?.(id, true/false) */
                        }}
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

      {/* Right: timeline (arrange) */}
      <div className="grow relative">
        <div ref={lanesRef} className="absolute inset-0 overflow-auto">
          <div className="relative" style={{ height: totalHeight, minWidth: 1200 }}>
            {/* lane backgrounds */}
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

            {/* timeline renderer */}
            <div className="absolute inset-0">
              <EnhancedTimelineView
                bpm={bpm}
                onBPMChange={onBPMChange}
                // @ts-expect-error optional hooks if your renderer supports them
                scrollTop={scrollTop}
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
   PAGE: Arrange + DAW left track bar
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

  // Import → to selected lane OR new lane; drag-drop handled in headers via callback
  const handleLoadTrack = useCallback(
    async (file: File, targetTrackId?: string) => {
      if (!audioEngine) return;
      try {
        const newCandidateId = `track-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const trackId = targetTrackId || newCandidateId;

        await audioEngine.loadTrack(trackId, file.name, file);
        const engineTracks = audioEngine.getTracks();
        const loadedTrack = engineTracks.find((t) => t.id === trackId);
        if (!loadedTrack?.buffer) {
          toast({ title: "Load failed", description: `No buffer for ${file.name}`, variant: "destructive" });
          return;
        }

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

          // Mixer channel
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
          // @ts-expect-error keep precise fields in meta to avoid type breakage
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

        // Optional: quick analysis (non-blocking)
        setTimeout(() => {
          try {
            const nbpm = AudioAnalyzer.detectBPM(loadedTrack.buffer!);
            const { key, scale } = AudioAnalyzer.detectKey(loadedTrack.buffer!);
            const ts = AudioAnalyzer.inferTimeSignature(nbpm, loadedTrack.buffer!);
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
      for (const file of Array.from(files)) await handleLoadTrack(file, targetTrackId);
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

  // Essentials only
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

      {/* Import pill */}
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

      {/* Arrange-only: DAW left bar + lanes */}
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
