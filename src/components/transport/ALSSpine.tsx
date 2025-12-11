/**
 * ALS Spine Component
 * 
 * Professional ALS meter strip along the top edge.
 * Shows LUFS/peak on hover with color-coded zones.
 */

import React, { useState, useRef, useEffect } from 'react';

interface ALSSpineProps {
  level: number; // 0-1
  peak?: number; // 0-1
  lufs?: number; // Optional LUFS value
  isClipping?: boolean;
  className?: string;
}

const ALSSpine: React.FC<ALSSpineProps> = ({
  level,
  peak,
  lufs,
  isClipping = false,
  className = '',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const clampedLevel = Math.max(0, Math.min(1, level));
  const clampedPeak = peak !== undefined ? Math.max(0, Math.min(1, peak)) : clampedLevel;

  // Determine zone color
  const getZoneColor = (value: number): string => {
    if (value >= 0.95) return 'rgba(255, 100, 150, 0.9)'; // Clip - soft magenta
    if (value >= 0.8) return 'rgba(255, 200, 100, 0.85)'; // Caution - amber-tinted purple
    return 'rgba(169, 142, 255, 0.9)'; // Safe - muted lilac
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percent = (x / rect.width) * 100;
      setTooltipPosition({ x: e.clientX, y: rect.bottom + 8 });
    }
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <>
      <div
        ref={containerRef}
        className={`als-spine ${className} ${isClipping || clampedLevel >= 0.8 ? 'peak' : ''}`}
        style={{
          height: '8px',
          width: '100%',
          borderRadius: '999px',
          background: 'linear-gradient(90deg, rgba(220,216,255,0.6), rgba(162,140,255,0.9))',
          boxShadow: isClipping || clampedLevel >= 0.8
            ? '0 8px 38px rgba(138,115,255,0.22)'
            : '0 6px 30px rgba(139,123,255,0.12)',
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s linear',
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="progressbar"
        aria-valuenow={clampedLevel * 100}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="ALS level meter"
      >
        {/* Level fill */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: `${clampedLevel * 100}%`,
            background: `linear-gradient(90deg, ${getZoneColor(clampedLevel)}, ${getZoneColor(clampedLevel * 0.9)})`,
            borderRadius: '999px',
            transition: 'width 0.15s linear',
          }}
        />

        {/* Peak indicator */}
        {clampedPeak > clampedLevel && (
          <div
            style={{
              position: 'absolute',
              left: `${clampedPeak * 100}%`,
              top: 0,
              bottom: 0,
              width: '2px',
              background: 'rgba(255,255,255,0.9)',
              borderRadius: '1px',
            }}
          />
        )}

        {/* Animated pulse overlay when high */}
        {(isClipping || clampedLevel >= 0.8) && (
          <div
            className="als-pulse-overlay"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: `${clampedLevel * 100}%`,
              background: 'linear-gradient(90deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
              transition: 'width 0.15s linear',
              animation: clampedLevel >= 0.95 ? 'pulse 1s ease-in-out infinite' : 'none',
            }}
          />
        )}
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div
          style={{
            position: 'fixed',
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y}px`,
            transform: 'translateX(-50%)',
            padding: '6px 10px',
            borderRadius: '6px',
            background: 'rgba(26,21,44,0.95)',
            border: '1px solid var(--glass-border)',
            backdropFilter: 'blur(10px)',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: 'var(--ink-foreground)',
            whiteSpace: 'nowrap',
            zIndex: 10000,
            pointerEvents: 'none',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          }}
        >
          <div style={{ marginBottom: '2px' }}>
            Level: {(clampedLevel * 100).toFixed(1)}%
          </div>
          {lufs !== undefined && (
            <div style={{ marginBottom: '2px' }}>
              LUFS: {lufs.toFixed(1)}
            </div>
          )}
          {clampedPeak > 0 && (
            <div>
              Peak: {(clampedPeak * 100).toFixed(1)}%
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
      `}</style>
    </>
  );
};

export default ALSSpine;
