import React, { useMemo, useState, useRef, useEffect } from "react";
import { AudioBlob as AudioBlobType } from "../../types/spectral";
import "./AudioBlob.css";

interface AudioBlobProps {
  blob: AudioBlobType;
  pixelsPerSecond: number;
  pixelsPerNote: number;
  canvasHeight: number;
  onClick?: (id: string) => void;
  onEdit?: (id: string, deltaPitch: number, deltaTime: number, deltaDuration: number) => void;
  onEditCommitted?: (id: string, deltaPitch: number, deltaTime: number, deltaDuration: number) => void;
}

export const AudioBlob: React.FC<AudioBlobProps> = ({
  blob,
  pixelsPerSecond,
  pixelsPerNote,
  canvasHeight,
  onClick,
  onEdit,
  onEditCommitted,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<"left" | "right" | null>(null);
  const dragStartRef = useRef<{ x: number; y: number; startTime: number; note: number; duration: number } | null>(null);

  const styles = useMemo(() => {
    const x = blob.startTime * pixelsPerSecond;
    const width = blob.duration * pixelsPerSecond;
    
    // Convert MIDI note to Y coordinate (note 60 = middle C)
    const y = canvasHeight - (blob.note * pixelsPerNote);

    // Create SVG path for drift
    const driftPath = blob.drift.map((p, i) => {
      const dx = (p.time - blob.startTime) * pixelsPerSecond;
      const dy = (Math.log2(p.frequency / blob.pitch) * 12) * pixelsPerNote;
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

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "left" | "right") => {
    e.stopPropagation();
    e.preventDefault();
    
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      startTime: blob.startTime,
      note: blob.note,
      duration: blob.duration,
    };

    if (type === "move") {
      setIsDragging(true);
    } else {
      setIsResizing(type);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartRef.current) return;
      if (!isDragging && !isResizing) return;

      const deltaX = (e.clientX - dragStartRef.current.x) / pixelsPerSecond;
      const deltaY = (dragStartRef.current.y - e.clientY) / pixelsPerNote; // Invert Y delta for pitch

      if (isDragging) {
        onEdit?.(blob.id, deltaY, deltaX, 0);
      } else if (isResizing === "right") {
        onEdit?.(blob.id, 0, 0, deltaX);
      } else if (isResizing === "left") {
        onEdit?.(blob.id, 0, deltaX, -deltaX);
      }
    };

    const handleMouseUp = () => {
      if (dragStartRef.current && (isDragging || isResizing)) {
        // Calculate final deltas
        // Note: For move/pitch, we commit the final position
        // For simplicity, we just trigger onEditCommitted with final state in parent
        onEditCommitted?.(blob.id, 0, 0, 0); // Parent should know current temp state
      }
      setIsDragging(false);
      setIsResizing(null);
      dragStartRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, blob.id, pixelsPerSecond, pixelsPerNote, onEdit, onEditCommitted]);

  return (
    <div 
      className={`audio-blob-container ${isDragging ? "dragging" : ""} ${isResizing ? "resizing" : ""}`}
      style={{
        transform: `translate(${styles.left}px, ${styles.top}px)`,
        width: styles.width,
        height: styles.height,
        position: 'absolute',
      }}
      onClick={() => onClick?.(blob.id)}
      onMouseDown={(e) => handleMouseDown(e, "move")}
    >
      {/* Resize handles */}
      <div className="resize-handle left" onMouseDown={(e) => handleMouseDown(e, "left")} />
      <div className="resize-handle right" onMouseDown={(e) => handleMouseDown(e, "right")} />

      <svg 
        className="audio-blob-svg" 
        width="100%" 
        height="100%" 
        viewBox={`0 -${pixelsPerNote/2} ${styles.width} ${pixelsPerNote}`}
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`grad-${blob.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ff4d4d" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffdb4d" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#4dff4d" stopOpacity="0.8" />
          </linearGradient>
        </defs>
        
        <rect 
          className="blob-body"
          width="100%" 
          height="80%" 
          rx={pixelsPerNote / 4}
          y="-40%"
          fill={`url(#grad-${blob.id})`}
        />
        
        <path 
          className="pitch-drift-line"
          d={styles.driftPath}
          fill="none"
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="blob-label-container">
        <span className="blob-label">{blob.note}</span>
      </div>
    </div>
  );
};
