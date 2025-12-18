import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SpectralAnalysisResult, AudioBlob as AudioBlobType } from "../../types/spectral";
import { MelodyneEngine } from "../../audio/MelodyneEngine";
import { AudioBlob } from "./AudioBlob";
import { AuraColors, AuraEffects, AuraGradients, AuraMotion, auraAlpha } from "../../theme/aura-tokens";
import { XIcon, SparklesIcon, SaveIcon } from "../icons";
import { TRACK_COLOR_SWATCH, hexToRgba } from "../../utils/ALS";
import { useMusicalContext, getAvailableScales, getNoteNames, type ScaleType } from "../../hooks/useMusicalContext";
import { analyzeAndSuggestHarmonies, type HarmonizeResult } from "../../ai/SpectralIntelligence";
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
  audioBuffer?: AudioBuffer; // Optional buffer for key detection
}

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const midiNoteName = (pitch: number) => {
  const octave = Math.floor(pitch / 12) - 1;
  const name = NOTE_NAMES[((pitch % 12) + 12) % 12];
  return `${name}${octave}`;
};

// Lock icon for toggle button
const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const SpectralEditorPanel: React.FC<SpectralEditorPanelProps> = ({
  isOpen,
  clip,
  track,
  onClose,
  onCommit,
  currentTime,
  audioBuffer,
}) => {
  const [analysis, setAnalysis] = useState<SpectralAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lockToScale, setLockToScale] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);
  const [harmonyResult, setHarmonyResult] = useState<HarmonizeResult | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const [zoomX, setZoomX] = useState(100); // pixels per second
  const [zoomY, setZoomY] = useState(20);  // pixels per note
  const [scrollY, setScrollY] = useState(60); // middle C

  // Musical context hook for key/scale awareness
  const {
    context: musicalContext,
    setKey,
    setScale,
    isInScale,
    nearestInScale,
    getScaleNotes,
  } = useMusicalContext(audioBuffer);

  // Analyze clip on mount or when clip changes
  useEffect(() => {
    if (isOpen && clip && !analysis && !isAnalyzing) {
      setIsAnalyzing(true);
      const engine = MelodyneEngine.getInstance();
      engine.analyzeClip(parseInt(clip.id.split('-')[1]) || 0)
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

  const noteBaseColor = track ? TRACK_COLOR_SWATCH[track.trackColor].base : "#ff7800";
  const noteGlowColor = track ? TRACK_COLOR_SWATCH[track.trackColor].glow : "#ffcc00";

  const gridDuration = clip?.duration ?? 4;
  const gridWidth = gridDuration * zoomX + 100;
  const gridHeight = 127 * zoomY;

  const playheadX = Math.max(0, (currentTime - (clip?.start ?? 0)) * zoomX);

  // Handle harmonize button click - calls Prime Brain for AI harmony suggestions
  const handleHarmonize = useCallback(async () => {
    if (!analysis?.blobs.length) {
      console.warn('[SpectralEditor] No blobs to analyze');
      return;
    }
    
    setIsHarmonizing(true);
    setHarmonyResult(null);
    
    try {
      console.log('[SpectralEditor] Requesting AI harmony analysis - Key:', musicalContext.key, 'Scale:', musicalContext.scale);
      
      const result = await analyzeAndSuggestHarmonies({
        key: musicalContext.key,
        scale: musicalContext.scale,
        blobs: analysis.blobs,
        clipName: clip?.name,
      });
      
      setHarmonyResult(result);
      console.log('[SpectralEditor] Harmony suggestions received:', result.suggestions.length);
    } catch (error) {
      console.error('[SpectralEditor] Harmony analysis failed:', error);
    } finally {
      setIsHarmonizing(false);
    }
  }, [musicalContext, analysis, clip]);

  // Get scale notes for visual highlighting
  const scaleNotes = useMemo(() => getScaleNotes(), [getScaleNotes]);

  const panelClasses = [
    "spectral-editor",
    isOpen ? "spectral-editor--open" : "spectral-editor--closed",
  ].join(" ");

  const availableScales = getAvailableScales();
  const availableNotes = getNoteNames();

  return (
    <aside className={panelClasses}>
      <div className="spectral-editor__container">
        <header className="spectral-editor__header">
          <div className="spectral-editor__header-info">
            <p className="spectral-editor__label-eyebrow">Spectral Analysis</p>
            <div className="spectral-editor__title-row">
              <span className="spectral-editor__clip-name">{clip?.name ?? "No Clip"}</span>
              {track && (
                <span 
                  className="spectral-editor__track-badge"
                  style={{ 
                    backgroundColor: auraAlpha(noteBaseColor, 0.15), 
                    color: noteBaseColor, 
                    borderColor: auraAlpha(noteBaseColor, 0.3) 
                  } as React.CSSProperties}
                >
                  {track.trackName}
                </span>
              )}
              {/* Musical Context Badge */}
              <span 
                className="spectral-editor__key-badge"
                title={`Detected: ${musicalContext.key} ${musicalContext.scale}${musicalContext.isAutoDetected ? ' (auto)' : ''}`}
              >
                🎵 {musicalContext.key} {musicalContext.scale}
              </span>
            </div>
          </div>
          <div className="spectral-editor__header-actions">
            {/* Lock to Scale Toggle */}
            <button
              onClick={() => setLockToScale(!lockToScale)}
              className={`spectral-editor__lock-btn ${lockToScale ? 'spectral-editor__lock-btn--active' : ''}`}
              title={lockToScale ? 'Unlock from Scale' : 'Lock to Scale'}
              aria-pressed={lockToScale}
            >
              <LockIcon className="spectral-editor__icon-sm" />
              {lockToScale ? 'Locked' : 'Lock'}
            </button>
            {isAnalyzing && (
              <div className="spectral-editor__analyzing">
                <div className="spectral-editor__progress-track">
                  <div className="spectral-editor__progress-fill" />
                </div>
                <span className="spectral-editor__status-text">Analyzing...</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="spectral-editor__close-btn"
              aria-label="Close spectral analysis"
            >
              <XIcon className="spectral-editor__icon-sm" />
            </button>
          </div>
        </header>

        <div className="spectral-editor__content">
          <div className="spectral-editor__grid-layout">
             {/* Note Labels Sidebar */}
             <div className="spectral-editor__sidebar">
                <div className="spectral-editor__sidebar-scroller" style={{ transform: `translateY(-${scrollY * zoomY}px)` }}>
                  {Array.from({ length: 128 }, (_, i) => 127 - i).map((pitch) => {
                    const inScale = isInScale(pitch);
                    return (
                      <div 
                        key={pitch}
                        className={`spectral-editor__note-label ${inScale && lockToScale ? 'spectral-editor__note-label--in-scale' : ''}`}
                        style={{ height: zoomY }}
                      >
                        {pitch % 12 === 0 ? midiNoteName(pitch) : ""}
                      </div>
                    );
                  })}
                </div>
             </div>

             {/* Main Editing Grid */}
             <div className="spectral-editor__viewport" ref={viewportRef}>
                <div 
                  className="spectral-editor__grid-canvas" 
                  style={{ 
                    width: gridWidth, 
                    height: gridHeight,
                    transform: `translateY(-${scrollY * zoomY}px)` 
                  }}
                >
                  {/* Grid Lines */}
                  {Array.from({ length: 128 }).map((_, i) => {
                    const pitch = 127 - i;
                    const inScale = isInScale(pitch);
                    return (
                      <div 
                        key={i}
                        className={`spectral-editor__grid-line ${pitch % 12 === 0 ? 'spectral-editor__grid-line--octave' : ''} ${inScale && lockToScale ? 'spectral-editor__grid-line--in-scale' : ''}`}
                        style={{ top: i * zoomY, height: zoomY }}
                      />
                    );
                  })}

                  {/* Blobs Container */}
                  <div className="spectral-editor__blobs-container">
                    {analysis?.blobs.map((blob) => (
                      <AudioBlob 
                        key={blob.id}
                        blob={blob}
                        pixelsPerSecond={zoomX}
                        pixelsPerNote={zoomY}
                        canvasHeight={gridHeight}
                      />
                    ))}
                  </div>

                  {/* Playhead */}
                  <div 
                    className="spectral-editor__playhead"
                    style={{ left: playheadX }}
                  >
                    <div className="spectral-editor__playhead-glow" />
                  </div>
                </div>
             </div>
          </div>
        </div>
        
        {/* Harmony Results Panel */}
        {harmonyResult && (
          <div className="spectral-editor__harmony-panel">
            <div className="spectral-editor__harmony-header">
              <span className="spectral-editor__harmony-title">✨ AI Harmony Suggestions</span>
              <button 
                className="spectral-editor__harmony-close"
                onClick={() => setHarmonyResult(null)}
              >
                ×
              </button>
            </div>
            <div className="spectral-editor__harmony-analysis">
              <span className="spectral-editor__harmony-chord">{harmonyResult.detectedChord}</span>
              <span className="spectral-editor__harmony-scale">{harmonyResult.scaleAnalysis}</span>
            </div>
            <div className="spectral-editor__harmony-suggestions">
              {harmonyResult.suggestions.slice(0, 5).map((s, i) => (
                <div key={i} className="spectral-editor__harmony-suggestion">
                  <span className="spectral-editor__harmony-note">
                    {midiNoteName(s.originalPitch)} → {midiNoteName(s.suggestedPitch)}
                  </span>
                  <span className="spectral-editor__harmony-shift">
                    {s.pitchShift > 0 ? '+' : ''}{s.pitchShift} st
                  </span>
                  <span className="spectral-editor__harmony-type">{s.harmonyType}</span>
                </div>
              ))}
            </div>
            {harmonyResult.overallAdvice && (
              <p className="spectral-editor__harmony-advice">{harmonyResult.overallAdvice}</p>
            )}
          </div>
        )}
        
        <footer className="spectral-editor__footer">
            <div className="spectral-editor__controls">
              {/* Key Selector */}
              <div className="spectral-editor__control-group">
                <span className="spectral-editor__control-label">Key</span>
                <select 
                  value={musicalContext.key}
                  onChange={(e) => setKey(e.target.value)}
                  className="spectral-editor__select"
                  title="Select key"
                >
                  {availableNotes.map(note => (
                    <option key={note} value={note}>{note}</option>
                  ))}
                </select>
              </div>
              {/* Scale Selector */}
              <div className="spectral-editor__control-group">
                <span className="spectral-editor__control-label">Scale</span>
                <select 
                  value={musicalContext.scale}
                  onChange={(e) => setScale(e.target.value as ScaleType)}
                  className="spectral-editor__select"
                  title="Select scale"
                >
                  {availableScales.map(scale => (
                    <option key={scale.id} value={scale.id}>{scale.name}</option>
                  ))}
                </select>
              </div>
              <div className="spectral-editor__control-group">
                <span className="spectral-editor__control-label">Temporal Zoom</span>
                <input 
                  type="range" min="50" max="500" value={zoomX} 
                  onChange={(e) => setZoomX(parseInt(e.target.value))}
                  className="spectral-editor__range spectral-editor__range--cyan"
                />
              </div>
              <div className="spectral-editor__control-group">
                <span className="spectral-editor__control-label">Pitch Focus</span>
                <input 
                  type="range" min="0" max="120" value={scrollY} 
                  onChange={(e) => setScrollY(parseInt(e.target.value))}
                  className="spectral-editor__range spectral-editor__range--violet"
                />
              </div>
            </div>
            
            <button 
              className="spectral-editor__harmonize-btn"
              onClick={handleHarmonize}
              disabled={isHarmonizing}
            >
              <SparklesIcon className="spectral-editor__icon-sm" />
              {isHarmonizing ? 'Analyzing...' : 'Harmonize'}
            </button>
        </footer>
      </div>
    </aside>
  );
};
