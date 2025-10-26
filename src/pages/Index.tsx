import { useState, useEffect, useRef, useCallback } from "react";
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

import { MixxAmbientOverlay } from "@/components/MixxAmbientOverlay";
import { TransportControls } from "@/studio/components";
import { EnhancedTimelineView } from "@/studio/components";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";

import { useProject, useTransport, useAudioEngine } from "@/contexts/ProjectContext";
import { useTimelineStore } from "@/store/timelineStore";
import { useTracksStore } from "@/store/tracksStore";
import { useMixerStore } from "@/store/mixerStore";

import { AudioAnalyzer } from "@/audio/analysis/AudioAnalyzer";
import type { TimelineTrack, Region } from "@/types/timeline";

// ---------- Minimal Bloom (Quick Actions) ----------
function QuickBloom({
  open,
  onClose,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  actions: { label: string; onClick: () => void; hotkey?: string }[];
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass border border-border/30 rounded-2xl p-4 w-[520px] max-w-[92vw]">
        <div className="text-sm text-muted-foreground mb-2">Bloom Menu</div>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a, i) => (
            <Button
              key={i}
              variant="outline"
              className="justify-between"
              onClick={() => {
                a.onClick();
                onClose();
              }}
            >
              <span>{a.label}</span>
              {a.hotkey && <span className="opacity-60 text-xs font-mono">{a.hotkey}</span>}
            </Button>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Press <span className="font-mono">B</span> to toggle • <span className="font-mono">Esc</span> to close
        </div>
      </div>
    </div>
  );
}

const Index = () => {
  // ---------- Refs / UI state ----------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [focusMode, setFocusMode] = useState(true); // Focus by default
  const [bloomOpen, setBloomOpen] = useState(false);
  const [detectedBPM, setDetectedBPM] = useState<number | null>(null);
  const [detectedKey, setDetectedKey] = useState<string | null>(null);
  const { toast } = useToast();

  // ---------- Core contexts ----------
  const { bpm, setBpm, masterVolume, setMasterVolume } = useProject();
  const audioEngine = useAudioEngine();
  const { transport, play, pause, stop, seek: seekTransport, toggleLoop, prevBar, nextBar } = useTransport();

  // ---------- Stores ----------
  const { setCurrentTime, setDuration } = useTimelineStore();
  const { addTrack, addRegion } = useTracksStore();

  const mixerStore = useMixerStore();
  const { channels, addChannel, updatePeakLevel } = mixerStore;
  const setMixerMasterPeak = mixerStore.setMasterPeakLevel;

  // ---------- Playback time driver ----------
  useEffect(() => {
    if (!transport.isPlaying) return;
    const id = setInterval(() => setCurrentTime(transport.currentTime), 50);
    return () => clearInterval(id);
  }, [transport.isPlaying, transport.currentTime, setCurrentTime]);

  // ---------- Peak meters @30Hz ----------
  useEffect(() => {
    const id = setInterval(() => {
      const master = audioEngine.getMasterPeakLevel();
      setMixerMasterPeak(master);
      channels.forEach((_, id) => {
        updatePeakLevel(id, audioEngine.getTrackPeakLevel(id));
      });
    }, 33);
    return () => clearInterval(id);
  }, [channels, setMixerMasterPeak, updatePeakLevel, audioEngine]);

  // ---------- Import ----------
  const handleImport = () => fileInputRef.current?.click();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length) {
      (async () => {
        for (const file of Array.from(files)) {
          await handleLoadTrack(file);
        }
        toast({ title: "Audio files imported", description: `${files.length} file(s) loaded` });
      })();
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleLoadTrack = useCallback(
    async (file: File) => {
      if (!audioEngine) return;
      try {
        // 1) Load into engine (shared AudioContext inside audioEngine)
        const id = `track-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await audioEngine.loadTrack(id, file.name, file);

        const engineTracks = audioEngine.getTracks();
        const loadedTrack = engineTracks.find((t) => t.id === id);

        if (!loadedTrack || !loadedTrack.buffer) {
          toast({ title: "Load failed", description: `No buffer for ${file.name}`, variant: "destructive" });
          return;
        }

        // 2) Timeline + Region (sample-accurate fields via meta to avoid type breaks)
        const hue = Math.floor(Math.random() * 360);
        const color = `hsl(${hue}, 70%, 50%)`;

        const timelineTrack: TimelineTrack = {
          id,
          name: file.name,
          color,
          height: 96,
          regions: [],
          muted: false,
          solo: false,
          recordArmed: false,
        };
        addTrack(timelineTrack);

        const sr =
          (audioEngine.getSampleRate && audioEngine.getSampleRate()) ||
          (audioEngine.audioContext && audioEngine.audioContext.sampleRate) ||
          48000;

        const duration = loadedTrack.buffer.duration;
        const regionId = `region-${id}`;
        const region: Region = {
          id: regionId,
          trackId: id,
          name: file.name,
          startTime: 0,
          duration,
          bufferOffset: 0,
          bufferDuration: duration,
          color,
          fadeIn: 0,
          fadeOut: 0,
          gain: 1,
          locked: false,
          muted: false,
          // @ts-expect-error: stash internal precise fields in meta to avoid breaking types
          meta: {
            startTimeSamples: 0,
            lengthSamples: Math.round(duration * sr),
            sampleRate: sr,
          },
        };
        addRegion(region);

        // 3) Mixer channel (sync volume/pan to engine)
        addChannel({
          id,
          name: file.name,
          volume: 0.75,
          pan: 0,
          muted: false,
          solo: false,
          color,
          peakLevel: { left: -60, right: -60 },
        });
        audioEngine.setTrackVolume(id, 0.75);

        // 4) Update timeline duration + make visible (basic zoom/scroll handled by timeline impl)
        setDuration(Math.max(duration, transport.currentTime));

        // 5) Lightweight client-side analysis (non-blocking)
        setTimeout(() => {
          try {
            const nbpm = AudioAnalyzer.detectBPM(loadedTrack.buffer!);
            const { key, scale } = AudioAnalyzer.detectKey(loadedTrack.buffer!);
            const ts = AudioAnalyzer.inferTimeSignature(nbpm, loadedTrack.buffer!);
            setDetectedBPM(nbpm);
            setDetectedKey(`${key} ${scale}`);
            setBpm(nbpm);
            (audioEngine as any).timeSignature = ts; // keep for compatibility
            toast({
              title: "Analysis complete",
              description: `BPM ${nbpm} • Key ${key} ${scale} • ${ts.numerator}/${ts.denominator}`,
            });
          } catch (err) {
            console.warn("Analysis failed:", err);
          }
        }, 60);

        toast({ title: "Track loaded", description: `${file.name} to arrange + mixer` });
      } catch (err) {
        console.error("Failed to load track:", err);
        toast({ title: "Error", description: "Failed to load audio file", variant: "destructive" });
      }
    },
    [addTrack, addRegion, addChannel, audioEngine, setBpm, setDuration, toast, transport.currentTime],
  );

  // ---------- Transport helpers ----------
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

  // ---------- Keyboard: keep only essentials + Focus/Bloom ----------
  useKeyboardShortcuts({
    onPlay: play,
    onPause: pause,
    onStop: stop,
    onExport: handleExport,
    onLoop: toggleLoop,
    onPrevBar: prevBar,
    onNextBar: nextBar,
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Toggle Bloom
      if ((e.key === "b" || e.key === "B") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setBloomOpen((v) => !v);
      }
      // Toggle Focus
      if ((e.key === "f" || e.key === "F") && !e.metaKey && !e.ctrlKey && !e.altKey) {
        setFocusMode((v) => !v);
      }
      // Spacebar play/pause (only if not focused on input)
      if (e.code === "Space" && (e.target as HTMLElement).tagName !== "INPUT") {
        e.preventDefault();
        transport.isPlaying ? pause() : play();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pause, play, transport.isPlaying]);

  // ---------- Minimal UI (Focus-first) ----------
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Hidden file input */}
      <input ref={fileInputRef} type="file" accept="audio/*" multiple className="hidden" onChange={handleFileSelect} />

      {/* ALS / Ambient */}
      <MixxAmbientOverlay />
      {/* Subtle background gradient (kept, but very light) */}
      <div className="fixed inset-0 gradient-animate opacity-10 pointer-events-none" />

      {/* Top strip (only when NOT in focus mode) */}
      {!focusMode && (
        <div className="flex items-center justify-between px-4 py-3 glass border-b border-border/30">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-2">
              <Upload className="w-4 h-4" />
              Import Audio
            </Button>
            {(detectedBPM || detectedKey) && (
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {detectedBPM && <span className="font-mono">BPM: {detectedBPM}</span>}
                {detectedKey && <span className="font-mono">Key: {detectedKey}</span>}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBloomOpen(true)}>
              Bloom
            </Button>
            <Button variant="outline" size="sm" onClick={() => setFocusMode(true)}>
              Enter Focus
            </Button>
          </div>
        </div>
      )}

      {/* Arrange view only (no extra panels, no view switcher) */}
      <div className="flex-1 flex flex-col">
        {/* In Focus mode we float a tiny import pill so you can still add audio */}
        {focusMode && (
          <div className="absolute top-4 left-4 z-40">
            <Button variant="outline" size="sm" onClick={handleImport} className="gap-2 neon-glow-prime">
              <Upload className="w-4 h-4" />
              Import
            </Button>
          </div>
        )}

        <div className="flex-1">
          <EnhancedTimelineView bpm={bpm} onBPMChange={setBpm} />
        </div>
      </div>

      {/* Transport (always visible) */}
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
          onRecord={() => {
            // minimal placeholder
          }}
          onLoopToggle={toggleLoop}
          onPrevBar={prevBar}
          onNextBar={nextBar}
          currentTime={transport.currentTime}
          masterVolume={masterVolume}
          onMasterVolumeChange={setMasterVolume}
        />
      </div>

      {/* Focus toggle + Bloom pill (bottom-left) */}
      <div className="fixed bottom-4 left-4 flex gap-2 z-40">
        <Button variant="outline" size="sm" onClick={() => setFocusMode((v) => !v)}>
          {focusMode ? "Exit Focus" : "Enter Focus"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setBloomOpen((v) => !v)}>
          {bloomOpen ? "Hide Bloom" : "Bloom"}
        </Button>
      </div>

      {/* Bloom overlay */}
      <QuickBloom
        open={bloomOpen}
        onClose={() => setBloomOpen(false)}
        actions={[
          { label: "Import Audio", onClick: handleImport, hotkey: "I" },
          {
            label: transport.isPlaying ? "Pause" : "Play",
            onClick: () => (transport.isPlaying ? pause() : play()),
            hotkey: "Space",
          },
          { label: "Stop", onClick: stop },
          { label: "Export Mix", onClick: handleExport },
          { label: transport.loopEnabled ? "Loop: On" : "Loop: Off", onClick: toggleLoop },
          { label: "Prev Bar", onClick: prevBar },
          { label: "Next Bar", onClick: nextBar },
          { label: focusMode ? "Exit Focus" : "Enter Focus", onClick: () => setFocusMode((v) => !v), hotkey: "F" },
        ]}
      />
    </div>
  );
};

export default Index;
