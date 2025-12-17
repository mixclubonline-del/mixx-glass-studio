/**
 * Professional Transport Component
 * 
 * Studio-grade transport controls with AURA glass aesthetic.
 * Uses the AURA Design System for consistent styling.
 * ALS-integrated: play button pulses when playing.
 */

import React from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon } from '../icons';
import { 
  AuraPalette, 
  AuraEffects, 
  AuraKeyframes,
  AuraColors,
  auraAlpha 
} from '../../theme/aura-tokens';

// Extract palette colors
const { violet, cyan, magenta, indigo } = AuraPalette;

interface ProfessionalTransportProps {
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek?: (direction: 'back' | 'forward') => void;
  onSeekPointerDown?: (direction: 'back' | 'forward') => (event: React.PointerEvent<HTMLButtonElement>) => void;
  onSeekPointerUp?: (direction: 'back' | 'forward') => (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPlayPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPlayPointerUp?: () => void;
  onToggleLoop: () => void;
  className?: string;
  /** Dark mode (for in-DAW use) vs light mode (for dock) */
  variant?: 'dark' | 'light';
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // 30 fps
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
};

export const ProfessionalTransport: React.FC<ProfessionalTransportProps> = ({
  isPlaying,
  isLooping,
  currentTime,
  onPlayPause,
  onSeek,
  onSeekPointerDown,
  onSeekPointerUp,
  onPlayPointerDown,
  onPlayPointerUp,
  onToggleLoop,
  className = '',
  variant = 'light',
}) => {
  const isDark = variant === 'dark';
  
  // AURA-themed styles based on variant
  const slabStyle: React.CSSProperties = isDark ? {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '14px',
    background: `linear-gradient(180deg, 
      ${auraAlpha(indigo[900], 0.9)}, 
      ${AuraColors.night}
    )`,
    boxShadow: AuraEffects.auraGlow.subtle,
    border: AuraEffects.glass.borderGlow,
    backdropFilter: AuraEffects.glass.backdropFilterHeavy,
  } : {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '10px 16px',
    borderRadius: '12px',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(240,238,255,0.6))',
    boxShadow: '0 6px 18px rgba(68,54,120,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
    border: '1px solid var(--glass-border)',
    backdropFilter: AuraEffects.glass.backdropFilter,
  };

  const secondaryButtonStyle: React.CSSProperties = isDark ? {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: auraAlpha(violet[900], 0.4),
    border: `1px solid ${auraAlpha(violet.DEFAULT, 0.2)}`,
    color: auraAlpha(cyan[200], 0.8),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  } : {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255,255,255,0.4)',
    border: '1px solid var(--glass-border)',
    color: 'var(--muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  };

  const playButtonStyle: React.CSSProperties = isDark ? {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(180deg, ${violet.DEFAULT}, ${indigo.DEFAULT})`,
    boxShadow: isPlaying 
      ? AuraEffects.neon.violet
      : AuraEffects.glow.md,
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transformOrigin: 'center',
    transition: 'all 0.15s ease',
    animation: isPlaying ? 'aura-glow-pulse 1.5s ease-in-out infinite' : 'none',
  } : {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: `linear-gradient(180deg, ${violet.DEFAULT}, ${indigo.DEFAULT})`,
    boxShadow: isPlaying 
      ? `0 6px 24px ${auraAlpha(violet.DEFAULT, 0.35)}, 0 0 12px ${auraAlpha(violet.DEFAULT, 0.3)}`
      : `0 6px 18px ${auraAlpha(violet.DEFAULT, 0.18)}`,
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    transformOrigin: 'center',
    transition: 'all 0.15s ease',
    animation: isPlaying ? 'aura-glow-pulse 1.5s ease-in-out infinite' : 'none',
  };

  const timecodeStyle: React.CSSProperties = isDark ? {
    minWidth: '120px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: auraAlpha(indigo[900], 0.6),
    border: `1px solid ${auraAlpha(violet.DEFAULT, 0.2)}`,
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: '13px',
    fontWeight: 500,
    color: auraAlpha(cyan[100], 0.9),
    textAlign: 'center',
    letterSpacing: '0.05em',
  } : {
    minWidth: '120px',
    padding: '6px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.3)',
    border: '1px solid var(--glass-border)',
    fontFamily: 'monospace',
    fontSize: '13px',
    fontWeight: 500,
    color: 'var(--ink-foreground)',
    textAlign: 'center',
    letterSpacing: '0.05em',
  };

  const loopButtonStyle: React.CSSProperties = isDark ? {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isLooping
      ? auraAlpha(violet.DEFAULT, 0.25)
      : auraAlpha(violet[900], 0.4),
    border: `1px solid ${isLooping ? violet.DEFAULT : auraAlpha(violet.DEFAULT, 0.2)}`,
    color: isLooping ? violet[300] : auraAlpha(cyan[200], 0.6),
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    animation: isLooping ? 'aura-glow-pulse 2s ease-in-out infinite' : 'none',
  } : {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: isLooping
      ? `${auraAlpha(violet.DEFAULT, 0.2)}`
      : 'rgba(255,255,255,0.4)',
    border: `1px solid ${isLooping ? violet.DEFAULT : 'var(--glass-border)'}`,
    color: isLooping ? indigo.DEFAULT : 'var(--muted)',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    position: 'relative',
    animation: isLooping ? 'aura-glow-pulse 2s ease-in-out infinite' : 'none',
  };

  return (
    <>
      {/* Inject AURA keyframe animations */}
      <style>{AuraKeyframes}</style>
      <div
        className={`transport-slab ${className}`}
        style={slabStyle}
      >
      {/* Cue backward */}
      <button
        type="button"
        aria-label="Cue backward"
        onClick={() => onSeek?.('back')}
        onPointerDown={onSeekPointerDown?.('back')}
        onPointerUp={onSeekPointerUp?.('back')}
        onPointerLeave={onSeekPointerUp?.('back')}
        onPointerCancel={onSeekPointerUp?.('back')}
        className="btn-transport-secondary"
        style={secondaryButtonStyle}
      >
        <RewindIcon className="w-[18px] h-[18px]" />
      </button>

      {/* Play/Pause */}
      <button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={onPlayPause}
        onPointerDown={onPlayPointerDown}
        onPointerUp={onPlayPointerUp}
        className="btn-play"
        style={playButtonStyle}
      >
        {isPlaying ? (
          <PauseIcon className="w-5 h-5" />
        ) : (
          <PlayIcon className="w-5 h-5" />
        )}
      </button>

      {/* Cue forward */}
      <button
        type="button"
        aria-label="Cue forward"
        onClick={() => onSeek?.('forward')}
        onPointerDown={onSeekPointerDown?.('forward')}
        onPointerUp={onSeekPointerUp?.('forward')}
        onPointerLeave={onSeekPointerUp?.('forward')}
        onPointerCancel={onSeekPointerUp?.('forward')}
        className="btn-transport-secondary"
        style={secondaryButtonStyle}
      >
        <FastForwardIcon className="w-[18px] h-[18px]" />
      </button>

      {/* Timecode */}
      <div style={timecodeStyle}>
        {formatTime(currentTime)}
      </div>

      {/* Loop toggle */}
      <button
        type="button"
        aria-pressed={isLooping}
        aria-label="Toggle loop"
        onClick={onToggleLoop}
        style={loopButtonStyle}
      >
        <LoopIcon className="w-[18px] h-[18px]" />
        {isLooping && (
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: violet.DEFAULT,
              boxShadow: `0 0 8px ${violet.DEFAULT}`,
            }}
            aria-hidden="true"
          />
        )}
      </button>
      </div>
    </>
  );
};

export default ProfessionalTransport;
