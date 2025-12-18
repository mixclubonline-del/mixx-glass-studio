import React, { useMemo } from "react";
import { AudioBlob as AudioBlobType } from "../../types/spectral";
import { AuraColors, auraAlpha } from "../../theme/aura-tokens";
import "./AudioBlob.css";

interface AudioBlobProps {
  blob: AudioBlobType;
  pixelsPerSecond: number;
  pixelsPerNote: number;
  canvasHeight: number;
  onClick?: (id: string) => void;
}

export const AudioBlob: React.FC<AudioBlobProps> = ({
  blob,
  pixelsPerSecond,
  pixelsPerNote,
  canvasHeight,
  onClick,
}) => {
  const styles = useMemo(() => {
    const x = blob.startTime * pixelsPerSecond;
    const width = blob.duration * pixelsPerSecond;
    
    // Note 127 is at top (y=0), Note 0 is at bottom (y = canvasHeight)
    // gridHeight is 127 * pixelsPerNote
    const y = (127 - blob.note) * pixelsPerNote;

    // Create SVG path for drift
    // The drift is relative to the blob's center note frequency
    const driftPath = blob.drift.map((p, i) => {
      const dx = (p.time - blob.startTime) * pixelsPerSecond;
      // semitoneDiff is 12 * log2(f/f0)
      const dy = -(Math.log2(p.frequency / blob.pitch) * 12) * pixelsPerNote;
      return `${i === 0 ? "M" : "L"} ${dx} ${dy}`;
    }).join(" ");

    return {
      left: x,
      top: y,
      width,
      height: pixelsPerNote,
      driftPath,
    };
  }, [blob, pixelsPerSecond, pixelsPerNote, canvasHeight]);

  return (
    <div 
      className="audio-blob" 
      style={{
        left: styles.left,
        top: styles.top,
        width: styles.width,
        height: styles.height,
      } as React.CSSProperties}
      onClick={() => onClick?.(blob.id)}
    >
      <svg className="audio-blob__svg" width="100%" height="100%" viewBox={`0 -${pixelsPerNote} ${styles.width} ${pixelsPerNote * 2}`}>
        <defs>
          <linearGradient id={`grad-${blob.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={auraAlpha(AuraColors.cyan, 0.8)} />
            <stop offset="50%" stopColor={AuraColors.cyan} />
            <stop offset="100%" stopColor={auraAlpha(AuraColors.cyan, 0.8)} />
          </linearGradient>
          <filter id={`glow-${blob.id}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* The Blob Body */}
        <rect 
          className="audio-blob__body"
          width="100%" 
          height="80%" 
          rx={pixelsPerNote / 2}
          y="-40%"
          fill={`url(#grad-${blob.id})`}
        />
        
        {/* The Pitch Drift Line */}
        <path 
          className="audio-blob__drift-line"
          d={styles.driftPath}
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          filter={`url(#glow-${blob.id})`}
        />
      </svg>
      <div className="audio-blob__label-container">
        <span className="audio-blob__label">{blob.note}</span>
      </div>
    </div>
  );
};
