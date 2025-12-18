import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpectralAnalysisResult, AudioBlob as AudioBlobType } from "../../types/spectral";
import { MelodyneEngine } from "../../audio/MelodyneEngine";
import { AudioBlob } from "./AudioBlob";
import { XIcon, SparklesIcon, SaveIcon } from "../icons";
import { TRACK_COLOR_SWATCH, hexToRgba } from "../../utils/ALS";
import type { TrackData, TrackAnalysisData } from "../../App";
import type { ArrangeClip as ArrangeClipModel } from "../../hooks/useArrange";
import "./SpectralEditorPanel.css";

interface SpectralEditorPanelProps {
  isOpen: boolean;
  clip: ArrangeClipModel | null;
  track: TrackData | null;
  onClose: () => void;
  onCommit?: () => void;
  currentTime: number;
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const midiNoteName = (pitch: number) => {
  const octave = Math.floor(pitch / 12) - 1;
  const name = NOTE_NAMES[((pitch % 12) + 12) % 12];
  return `${name}${octave}`;
};

export const SpectralEditorPanel: React.FC<SpectralEditorPanelProps> = ({
  isOpen,
  clip,
  track,
  onClose,
  onCommit,
  currentTime,
}) => {
  const [analysis, setAnalysis] = useState<SpectralAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [tempEdits, setTempEdits] = useState<Record<string, { deltaPitch: number, deltaTime: number, deltaDuration: number }>>({});
  const viewportRef = useRef<HTMLDivElement>(null);

  const [zoomX, setZoomX] = useState(100); // pixels per second
  const [zoomY, setZoomY] = useState(20);  // pixels per note
  const [scrollY, setScrollY] = useState(60); // middle C

  // Analyze clip on mount or when clip changes
  useEffect(() => {
    if (isOpen && clip && !analysis && !isAnalyzing) {
      setIsAnalyzing(true);
      const engine = MelodyneEngine.getInstance();
      engine.analyzeClip(parseInt(clip.id.split('-')[1]) || 0) // Basic ID extraction
        .then((result) => {
          setAnalysis(result);
          setIsAnalyzing(false);
        })
        .catch((err) => {
          console.error("Analysis failed:", err);
          setIsAnalyzing(false);
        });
    }
  }, [isOpen, clip, analysis, isAnalyzing]);

  const handleBlobEdit = useCallback((id: string, deltaPitch: number, deltaTime: number, deltaDuration: number) => {
    setTempEdits(prev => ({
      ...prev,
      [id]: { deltaPitch, deltaTime, deltaDuration }
    }));
  }, []);

  const handleBlobEditCommitted = useCallback(async (id: string) => {
    const edit = tempEdits[id];
    if (!edit || !analysis || !clip) return;

    const blob = analysis.blobs.find(b => b.id === id);
    if (!blob) return;

    // Apply edit to engine
    const engine = MelodyneEngine.getInstance();
    const clipId = parseInt(clip.id.split('-')[1]) || 0;
    
    // Snapping pitch to nearest semitone for the commit
    const snappedDeltaPitch = Math.round(edit.deltaPitch);
    const timeStretchFactor = 1.0 + edit.deltaDuration / blob.duration;

    try {
      await engine.applySpectralEdit(clipId, blob, snappedDeltaPitch, timeStretchFactor);
      
      // Update local state
      const newBlobs = analysis.blobs.map(b => {
        if (b.id === id) {
          const newPitch = b.pitch * Math.pow(2, snappedDeltaPitch / 12);
          const newNote = Math.round(12 * Math.log2(newPitch / 440) + 69);
          return {
            ...b,
            startTime: b.startTime + edit.deltaTime,
            duration: b.duration + edit.deltaDuration,
            pitch: newPitch,
            note: newNote,
            isManuallyEdited: true,
          };
        }
        return b;
      });

      setAnalysis({ ...analysis, blobs: newBlobs });
      setTempEdits(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      console.error("Edit failed:", err);
    }
  }, [analysis, clip, tempEdits]);

  const editedBlobs = useMemo(() => {
    if (!analysis) return [];
    return analysis.blobs.map(blob => {
      const edit = tempEdits[blob.id];
      if (!edit) return blob;
      
      const newPitch = blob.pitch * Math.pow(2, edit.deltaPitch / 12);
      const newNote = Math.round(12 * Math.log2(newPitch / 440) + 69);
      
      return {
        ...blob,
        startTime: blob.startTime + edit.deltaTime,
        duration: Math.max(0.01, blob.duration + edit.deltaDuration),
        pitch: newPitch,
        note: newNote,
      };
    });
  }, [analysis, tempEdits]);

  const noteBaseColor = track ? TRACK_COLOR_SWATCH[track.trackColor].base : "#ff7800";
  const noteGlowColor = track ? TRACK_COLOR_SWATCH[track.trackColor].glow : "#ffcc00";

  const gridDuration = clip?.duration ?? 4;
  const gridWidth = gridDuration * zoomX + 100;
  const gridHeight = 127 * zoomY;

  const playheadX = Math.max(0, (currentTime - (clip?.start ?? 0)) * zoomX);

  const panelClasses = [
    "spectral-editor-panel relative h-full w-[640px] transition-all duration-400 ease-out",
    isOpen ? "translate-x-0 opacity-100 pointer-events-auto" : "translate-x-[660px] opacity-0 pointer-events-none",
  ].join(" ");

  return (
    <aside className={panelClasses}>
      <div className="flex h-full w-full flex-col border-l border-white/10 bg-[#050510]/95 backdrop-blur-3xl shadow-2xl">
        <header className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Spectral Analysis</p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold tracking-wide text-white/90">{clip?.name ?? "No Clip"}</span>
              {track && (
                <span 
                  className="rounded-full px-3 py-0.5 text-[9px] uppercase tracking-[0.2em] font-bold"
                  style={{ backgroundColor: hexToRgba(noteBaseColor, 0.2), color: noteBaseColor, border: `1px solid ${hexToRgba(noteBaseColor, 0.3)}` }}
                >
                  {track.trackName}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <div className="flex items-center gap-2 mr-4">
                <div className="h-1.5 w-12 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full bg-cyan-400 animate-pulse w-full" />
                </div>
                <span className="text-[9px] uppercase tracking-widest text-cyan-400">Analyzing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-white/5 text-white/40 transition hover:bg-white/10"
              aria-label="Close spectral analysis"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex overflow-hidden">
             {/* Note Labels Sidebar */}
             <div className="w-12 border-r border-white/5 bg-white/[0.02] overflow-hidden relative">
                <div className="absolute inset-0" style={{ transform: `translateY(-${scrollY * zoomY}px)` }}>
                  {Array.from({ length: 128 }, (_, i) => 127 - i).map((pitch) => (
                    <div 
                      key={pitch}
                      className="flex items-center justify-center border-b border-white/[0.03] text-[9px] text-white/30"
                      style={{ height: zoomY }}
                    >
                      {pitch % 12 === 0 ? midiNoteName(pitch) : ""}
                    </div>
                  ))}
                </div>
             </div>

             {/* Main Editing Grid */}
             <div className="flex-1 overflow-auto relative bg-[#080815]" ref={viewportRef}>
                <div 
                  className="relative" 
                  style={{ 
                    width: gridWidth, 
                    height: gridHeight,
                    transform: `translateY(-${scrollY * zoomY}px)` 
                  }}
                >
                  {/* Grid Lines */}
                  {Array.from({ length: 128 }).map((_, i) => (
                    <div 
                      key={i}
                      className={`absolute left-0 right-0 border-b ${i % 12 === 0 ? 'border-white/10' : 'border-white/[0.03]'}`}
                      style={{ top: i * zoomY, height: zoomY }}
                    />
                  ))}

                  {/* Blobs Container */}
                  <div className="absolute inset-0">
                    {editedBlobs.map((blob) => (
                      <AudioBlob 
                        key={blob.id}
                        blob={blob}
                        pixelsPerSecond={zoomX}
                        pixelsPerNote={zoomY}
                        canvasHeight={gridHeight}
                        onEdit={handleBlobEdit}
                        onEditCommitted={handleBlobEditCommitted}
                      />
                    ))}
                  </div>

                  {/* Playhead */}
                  <div 
                    className="absolute top-0 bottom-0 w-px bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.8)] z-20"
                    style={{ left: playheadX }}
                  />
                </div>
             </div>
          </div>
        </div>
        
        <footer className="border-t border-white/10 bg-[#080815] px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-white/30">Temporal Zoom</span>
                <input 
                  type="range" min="50" max="500" value={zoomX} 
                  onChange={(e) => setZoomX(parseInt(e.target.value))}
                  className="w-32 accent-cyan-500"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] uppercase tracking-widest text-white/30">Pitch Focus</span>
                <input 
                  type="range" min="0" max="120" value={scrollY} 
                  onChange={(e) => setScrollY(parseInt(e.target.value))}
                  className="w-32 accent-violet-500"
                />
              </div>
            </div>
            
            <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-[11px] uppercase tracking-[0.2em] font-bold text-white shadow-lg hover:brightness-110 active:scale-95 transition-all">
              <SparklesIcon className="h-4 w-4" />
              Harmonize
            </button>
        </footer>
      </div>
    </aside>
  );
};
