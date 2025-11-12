// src/components/ArrangeClip.tsx
import React, { useMemo, useRef, useState } from "react";
import { ArrangeClip as ArrangeClipModel } from '../hooks/useArrange';

type DragKind = "move" | "resize-left" | "resize-right" | "fade-in" | "fade-out" | "gain";

type Props = {
  clip: ArrangeClipModel;
  laneTop: number;       // px
  laneHeight: number;    // px
  pps: number;           // pixelsPerSecond
  onBeginDrag: (kind: DragKind, startClientX: number, startClientY: number) => void;
  onSelect: (append: boolean) => void;
};

const HANDLE_W = 12;
const FADE_HANDLE_H = 16;

const KineticWaveform: React.FC<{ durationSec: number, pps: number, color: string }> = React.memo(({ durationSec, pps, color }) => {
    const width = durationSec * pps;
    const d = useMemo(() => {
      let path = `M 0 40`;
      const step = 5;
      for (let x = 0; x < width; x += step) {
        const phase1 = x / (width) * Math.PI * 4; // Overall shape
        const phase2 = x / (width) * Math.PI * 18; // Detail
        const y = 40 + Math.sin(phase1) * 20 + Math.cos(phase2) * 10;
        path += ` L ${x} ${y}`;
      }
      return path;
    }, [width]);
  
    return (
      <svg width={width} height={80} className="absolute top-1/2 -translate-y-1/2 left-0" preserveAspectRatio="none">
        <defs>
          <filter id={`glow-${color.replace("#", "")}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={d} stroke={color} strokeWidth="1.5" fill="none" style={{ filter: `url(#glow-${color.replace("#", "")})` }}/>
      </svg>
    );
});

export const ArrangeClip: React.FC<Props> = ({
  clip, laneTop, laneHeight, pps, onBeginDrag, onSelect
}) => {
  const { id, name, color, start: startSec, duration: durationSec, selected, fadeIn = 0, fadeOut = 0, gain = 1.0 } = clip;
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
    if (hoverRegion) {
        onBeginDrag(hoverRegion, e.clientX, e.clientY);
    } else {
        onBeginDrag("move", e.clientX, e.clientY);
    }
    e.stopPropagation();
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect();
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

  return (
    <div
      ref={ref}
      className={`absolute rounded-md border group ${selected ? 'border-white/80 ring-2 ring-white/50 z-10' : 'border-white/20'} 
      bg-black/40 backdrop-blur-sm overflow-hidden shadow-lg transition-all duration-100`}
      style={{...style, cursor: getCursorStyle()}}
      onMouseDown={onLocalMouseDown}
      onMouseMove={onMouseMove}
      onMouseLeave={() => setHoverRegion(null)}
      onClick={(e) => { onSelect(e.shiftKey); e.stopPropagation(); }}
    >
      {/* Plasma Background */}
      <div className="absolute inset-0 opacity-40" style={{
        background: `linear-gradient(135deg, ${color}99, #03040B 70%), linear-gradient(225deg, ${color}33, #03040B 70%)`,
        backgroundSize: '400% 400%',
        animation: 'plasma 15s ease infinite',
      }} />

      <KineticWaveform durationSec={durationSec} pps={pps} color={color} />

      {/* Gain Line */}
      <div className="absolute left-0 right-0 h-0.5 bg-white/50 transition-all duration-100 ease-out pointer-events-none" 
           style={{ top: `${gainY}px`, opacity: hoverRegion === 'gain' ? 1 : 0.6, transform: hoverRegion === 'gain' ? 'scaleY(2)' : 'scaleY(1)' }}/>

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
    </div>
  );
};