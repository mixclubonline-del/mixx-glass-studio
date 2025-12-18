/**
 * Contextual Transport Component
 * 
 * AURA-styled transport that adapts controls based on BloomContext.
 * Core Philosophy: Functions are contextual in BEHAVIOR, not just name.
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { BloomContext } from '../../types/bloom';
import { BLOOM_CONTEXT_ACCENTS } from '../../types/bloom';
import {
  getSeekBehavior,
  getContextualControls,
  getTransportAccent,
} from './contextualTransportItems';
import {
  AuraPalette,
  AuraEffects,
  AuraKeyframes,
  auraAlpha,
} from '../../theme/aura-tokens';
import { PlayIcon, PauseIcon, LoopIcon } from '../icons';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

interface ContextualTransportProps {
  context: BloomContext;
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleLoop: () => void;
  onSeekAction: (action: string) => void;
  onContinuousSeek?: (direction: 'back' | 'forward' | null) => void;
  className?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

const { violet, cyan, indigo } = AuraPalette;

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export const ContextualTransport: React.FC<ContextualTransportProps> = ({
  context,
  isPlaying,
  isLooping,
  currentTime,
  onPlayPause,
  onStop,
  onToggleLoop,
  onSeekAction,
  onContinuousSeek,
  className = '',
}) => {
  const [isHoldingBack, setIsHoldingBack] = useState(false);
  const [isHoldingForward, setIsHoldingForward] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const accentColor = getTransportAccent(context);
  const backBehavior = getSeekBehavior(context, 'back');
  const forwardBehavior = getSeekBehavior(context, 'forward');

  // Handle hold-to-seek
  const handleSeekPointerDown = useCallback((direction: 'back' | 'forward') => {
    if (direction === 'back') setIsHoldingBack(true);
    else setIsHoldingForward(true);

    // Start continuous seek after 300ms hold
    holdTimerRef.current = setTimeout(() => {
      onContinuousSeek?.(direction);
    }, 300);
  }, [onContinuousSeek]);

  const handleSeekPointerUp = useCallback((direction: 'back' | 'forward') => {
    if (direction === 'back') setIsHoldingBack(false);
    else setIsHoldingForward(false);

    // If released before 300ms, treat as tap (contextual action)
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
      const behavior = getSeekBehavior(context, direction);
      onSeekAction(behavior.action);
    } else {
      // Stop continuous seek
      onContinuousSeek?.(null);
    }
  }, [context, onSeekAction, onContinuousSeek]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  // ═══════════════════════════════════════════════════════════════════════════
  // Styles
  // ═══════════════════════════════════════════════════════════════════════════

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 20px',
    borderRadius: '16px',
    background: `linear-gradient(180deg, 
      ${auraAlpha(indigo[900], 0.85)}, 
      rgba(10, 10, 20, 0.95)
    )`,
    boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 40px ${auraAlpha(accentColor, 0.15)}`,
    border: `1px solid ${auraAlpha(accentColor, 0.25)}`,
    backdropFilter: AuraEffects.glass.backdropFilterHeavy,
  };

  const seekOrbStyle = (isHolding: boolean): React.CSSProperties => ({
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isHolding
      ? `radial-gradient(circle, ${auraAlpha(accentColor, 0.4)}, ${auraAlpha(violet[900], 0.6)})`
      : `radial-gradient(circle, ${auraAlpha(violet[900], 0.6)}, rgba(15,15,30,0.8))`,
    border: `1px solid ${auraAlpha(accentColor, isHolding ? 0.6 : 0.25)}`,
    color: auraAlpha(cyan[100], isHolding ? 1 : 0.7),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    transform: isHolding ? 'scale(1.08)' : 'scale(1)',
    boxShadow: isHolding
      ? `0 0 20px ${auraAlpha(accentColor, 0.5)}`
      : `0 4px 12px rgba(0,0,0,0.3)`,
  });

  const playButtonStyle: React.CSSProperties = {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isPlaying
      ? `radial-gradient(circle, ${auraAlpha(accentColor, 0.5)}, ${auraAlpha(violet[900], 0.7)})`
      : `linear-gradient(180deg, ${auraAlpha(violet.DEFAULT, 0.3)}, ${auraAlpha(indigo[900], 0.8)})`,
    border: `2px solid ${auraAlpha(accentColor, isPlaying ? 0.8 : 0.4)}`,
    color: isPlaying ? '#fff' : auraAlpha(cyan[100], 0.9),
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: isPlaying
      ? `0 0 30px ${auraAlpha(accentColor, 0.6)}, inset 0 0 20px ${auraAlpha(accentColor, 0.3)}`
      : `0 6px 20px rgba(0,0,0,0.4)`,
    animation: isPlaying ? 'aura-glow-pulse 1.5s ease-in-out infinite' : 'none',
  };

  const timecodeStyle: React.CSSProperties = {
    minWidth: '100px',
    padding: '8px 14px',
    borderRadius: '10px',
    background: auraAlpha(indigo[900], 0.5),
    border: `1px solid ${auraAlpha(violet.DEFAULT, 0.2)}`,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '14px',
    fontWeight: 500,
    color: auraAlpha(cyan[100], 0.9),
    textAlign: 'center',
    letterSpacing: '0.08em',
  };

  const contextLabelStyle: React.CSSProperties = {
    fontSize: '9px',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: accentColor,
    opacity: 0.8,
    marginTop: '2px',
  };

  const loopButtonStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isLooping
      ? auraAlpha(accentColor, 0.25)
      : auraAlpha(violet[900], 0.4),
    border: `1px solid ${isLooping ? accentColor : auraAlpha(violet.DEFAULT, 0.2)}`,
    color: isLooping ? accentColor : auraAlpha(cyan[200], 0.6),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <>
      <style>{AuraKeyframes}</style>
      <div className={`contextual-transport ${className}`} style={containerStyle}>
        {/* Back Seek Orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            type="button"
            aria-label={backBehavior.description}
            style={seekOrbStyle(isHoldingBack)}
            onPointerDown={() => handleSeekPointerDown('back')}
            onPointerUp={() => handleSeekPointerUp('back')}
            onPointerLeave={() => handleSeekPointerUp('back')}
            onPointerCancel={() => handleSeekPointerUp('back')}
          >
            <span style={{ fontSize: '18px' }}>◀</span>
          </button>
          <span style={contextLabelStyle}>{backBehavior.label}</span>
        </div>

        {/* Play/Pause */}
        <button
          type="button"
          aria-label={isPlaying ? 'Pause' : 'Play'}
          onClick={onPlayPause}
          style={playButtonStyle}
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
        </button>

        {/* Forward Seek Orb */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <button
            type="button"
            aria-label={forwardBehavior.description}
            style={seekOrbStyle(isHoldingForward)}
            onPointerDown={() => handleSeekPointerDown('forward')}
            onPointerUp={() => handleSeekPointerUp('forward')}
            onPointerLeave={() => handleSeekPointerUp('forward')}
            onPointerCancel={() => handleSeekPointerUp('forward')}
          >
            <span style={{ fontSize: '18px' }}>▶</span>
          </button>
          <span style={contextLabelStyle}>{forwardBehavior.label}</span>
        </div>

        {/* Timecode */}
        <div style={timecodeStyle}>
          {formatTime(currentTime)}
        </div>

        {/* Loop Toggle */}
        <button
          type="button"
          aria-pressed={isLooping}
          aria-label="Toggle loop"
          onClick={onToggleLoop}
          style={loopButtonStyle}
        >
          <LoopIcon className="w-4 h-4" />
        </button>
      </div>
    </>
  );
};

export default ContextualTransport;
