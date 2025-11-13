// src/components/ArrangeClip.tsx
import React, { useMemo, useRef, useState } from "react";
import { ArrangeClip as ArrangeClipModel } from '../hooks/useArrange';
import { TrackALSFeedback, hexToRgba } from "../utils/ALS";
import { WaveformRenderer } from "./WaveformRenderer";

type DragKind = "move" | "resize-left" | "resize-right" | "fade-in" | "fade-out" | "gain";

type Props = {
  clip: ArrangeClipModel;
  laneTop: number;       // px
  laneHeight: number;    // px
  pps: number;           // pixelsPerSecond
  audioBuffer?: AudioBuffer;
  onBeginDrag: (
    kind: DragKind,
    startClientX: number,
    startClientY: number,
    modifiers?: { altKey?: boolean; shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean }
  ) => void;
  onSelect: (append: boolean) => void;
  feedback?: TrackALSFeedback;
  isRecallTarget?: boolean;
  onOpenPianoRoll?: () => void;
};

const HANDLE_W = 12;
const FADE_HANDLE_H = 16;

export const ArrangeClip: React.FC<Props> = ({
  clip,
  laneTop,
  laneHeight,
  pps,
  audioBuffer,
  onBeginDrag,
  onSelect,
  feedback,
  isRecallTarget,
  onOpenPianoRoll,
}) => {
  const {
    id,
    name,
    color,
    start: startSec,
    duration: durationSec,
    selected,
    fadeIn = 0,
    fadeOut = 0,
    gain = 1.0,
    groupId,
    warpAnchors = [],
  } = clip;
  const { zeroStart = false, zeroEnd = false, autoFade = false } = clip;
  const x = startSec * pps;
  const w = Math.max(pps * durationSec, 8);
  const ref = useRef<HTMLDivElement>(null);
  const [hoverRegion, setHoverRegion] = useState<DragKind | null>(null);

  const style = useMemo(() => ({
    transform: `translateX(${x}px)`,
    top: laneTop,
    height: laneHeight,
    width: w,
  } as React.CSSProperties), [x, laneTop, laneHeight, w]);

  const onLocalMouseDown = (e: React.MouseEvent) => {
    const modifiers = { altKey: e.altKey, shiftKey: e.shiftKey, metaKey: e.metaKey || e.ctrlKey };
    if (hoverRegion) {
      onBeginDrag(hoverRegion, e.clientX, e.clientY, modifiers);
    } else {
      onBeginDrag("move", e.clientX, e.clientY, modifiers);
    }
    e.stopPropagation();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const node = ref.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;
    
    let region: DragKind | null = "move"; // Default to move
    if (localY < FADE_HANDLE_H) {
        if (localX < HANDLE_W + 10) region = 'fade-in';
        else if (localX > w - (HANDLE_W + 10)) region = 'fade-out';
    } else if (Math.abs(localY - (laneHeight - (laneHeight * (gain / 2.0)))) < 8) {
        region = 'gain';
    } else {
        if (localX < HANDLE_W) region = "resize-left";
        else if (w > HANDLE_W * 2 && localX > w - HANDLE_W) region = "resize-right";
    }
    setHoverRegion(region);
  };
  
  const getCursorStyle = () => {
    switch(hoverRegion) {
        case 'resize-left':
        case 'resize-right':
        case 'fade-in':
        case 'fade-out':
            return 'ew-resize';
        case 'gain':
            return 'ns-resize';
        case 'move':
        default:
            return 'grab';
    }
  }
  
  const gainY = laneHeight - (laneHeight * (gain / 2.0)); // Map gain [0, 2] to y pos
  const playbackRate = clip.timeStretchRate ?? 1;
  const sourceStartSec = Math.max(0, clip.sourceStart ?? 0);
  const sourceDurationSec = Math.max(
    0.01,
    clip.originalDuration ?? durationSec * playbackRate
  );
  const waveformWidth = Math.max(4, w - 6);
  const waveformHeight = Math.max(24, laneHeight - 12);
  const waveformColor = feedback?.glowColor ?? color;

  return (
    <div
      ref={ref}
      className={`absolute rounded-md border group ${selected ? 'border-white/80 ring-2 ring-white/50 z-10' : 'border-white/20'} 
      bg-black/40 backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-150`}
      style={{...style, cursor: getCursorStyle()}}
      onMouseDown={onLocalMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoverRegion(null)}
      onDoubleClick={(e) => {
        e.stopPropagation();
        if (!selected) {
          onSelect(false);
        }
        onOpenPianoRoll?.();
      }}
      onClick={(e) => { onSelect(e.shiftKey); e.stopPropagation(); }}
    >
      {/* ALS Glow */}
      {feedback && (
        <div className="absolute inset-0 pointer-events-none opacity-70 transition-opacity duration-200" style={{ mixBlendMode: 'screen' }}>
          <div
            className="absolute inset-[12%] rounded-xl blur-2xl"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${hexToRgba(feedback.glowColor, 0.55)} 0%, transparent 65%)`,
              opacity: 0.7 + feedback.intensity * 0.45,
            }}
          />
        </div>
      )}

      {/* Recall Beacon */}
      {isRecallTarget && (
        <div className="absolute inset-0 pointer-events-none rounded-md ring-2 ring-cyan-400/60 animate-pulse" style={{ mixBlendMode: 'screen' }} />
      )}

      {/* Plasma Background */}
      <div className="absolute inset-0 opacity-40" style={{
        background: `linear-gradient(135deg, ${color}99, #03040B 70%), linear-gradient(225deg, ${color}33, #03040B 70%)`,
        backgroundSize: '400% 400%',
        animation: 'plasma 15s ease infinite',
      }} />
      {audioBuffer && waveformWidth > 6 && (
        <div className="absolute inset-x-3 top-3 bottom-3 pointer-events-none opacity-90">
          <WaveformRenderer
            audioBuffer={audioBuffer}
            width={waveformWidth}
            height={Math.max(18, waveformHeight)}
            color={waveformColor}
            startTime={Math.min(sourceStartSec, Math.max(0, audioBuffer.duration - 0.01))}
            duration={Math.min(
              sourceDurationSec,
              Math.max(0.01, audioBuffer.duration - sourceStartSec)
            )}
            zoom={pps}
          />
        </div>
      )}

      {/* Gain Line */}
      <div className="absolute left-0 right-0 h-0.5 bg-white/50 transition-all duration-100 ease-out pointer-events-none" 
           style={{ top: `${gainY}px`, opacity: hoverRegion === 'gain' ? 1 : 0.6, transform: hoverRegion === 'gain' ? 'scaleY(2)' : 'scaleY(1)' }}/>

      {/* Warp Anchors */}
      {warpAnchors.map((anchor, index) => {
        if (anchor < 0 || anchor > durationSec) return null;
        const anchorX = (anchor * pps);
        if (anchorX < 4 || anchorX > w - 4) return null;
        return (
          <div
            key={`${id}-anchor-${index}`}
            className="absolute top-0 bottom-0 pointer-events-none"
            style={{ left: anchorX }}
          >
            <div
              className="absolute top-0 bottom-0 w-[1px]"
              style={{
                background: `linear-gradient(180deg, ${hexToRgba(waveformColor, 0.9)} 0%, transparent 82%)`,
                boxShadow: `0 0 12px ${hexToRgba(waveformColor, 0.6)}`,
              }}
            />
            <div
              className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] uppercase tracking-[0.38em] text-white/70"
              style={{ textTransform: 'none' }}
            >
              warp
            </div>
          </div>
        );
      })}

      {/* Fade In */}
      <div className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-black/80 to-transparent pointer-events-none" 
           style={{ width: `${Math.min(w / 2, fadeIn * pps)}px` }}/>
      <div className="absolute top-0 left-0 w-2 h-2 rounded-full bg-white transition-all" style={{ opacity: hoverRegion === 'fade-in' ? 1 : 0, transform: `translateX(${Math.min(w/2 - 8, fadeIn * pps)}px) translateY(4px)`}}/>
      
      {/* Fade Out */}
      <div className="absolute top-0 right-0 bottom-0 bg-gradient-to-l from-black/80 to-transparent pointer-events-none"
           style={{ width: `${Math.min(w / 2, fadeOut * pps)}px` }}/>
      <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-white transition-all" style={{ opacity: hoverRegion === 'fade-out' ? 1 : 0, transform: `translateX(-${Math.min(w/2 - 8, fadeOut * pps)}px) translateY(4px)`}}/>

      <div className="absolute left-2.5 top-1.5 text-xs font-bold tracking-wider text-white/90 select-none pointer-events-none">
        {name.toUpperCase()}
      </div>
      
      {/* Selection/Hover Overlay */}
      <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ opacity: selected ? 0.2 : undefined }}/>

      {/* Group Badge */}
      {groupId && (
        <div className="absolute right-2 top-2 text-[10px] uppercase tracking-[0.35em] px-2 py-0.5 rounded-full bg-black/60 border border-white/10 text-white/70 pointer-events-none">
          {groupId.replace('group-', 'grp-')}
        </div>
      )}

      {/* ALS Temperature */}
      {feedback && (
        <div className="absolute left-2 bottom-2 flex items-center space-x-2 text-[10px] uppercase tracking-[0.35em] text-white/70 pointer-events-none">
          <span
            className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_rgba(255,255,255,0.4)]"
            style={{ backgroundColor: feedback.glowColor }}
          />
          <span>{feedback.temperature}</span>
        </div>
      )}

      {zeroStart && (
        <div className="absolute top-1 left-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.65)] pointer-events-none" />
      )}

      {zeroEnd && (
        <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(56,189,248,0.65)] pointer-events-none" />
      )}

      {autoFade && (
        <div className="absolute inset-x-3 top-2 text-[9px] uppercase tracking-[0.45em] text-white/50 text-center pointer-events-none">
          XF
        </div>
      )}
    </div>
  );
};