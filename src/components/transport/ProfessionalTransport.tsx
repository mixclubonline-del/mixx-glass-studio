/**
 * Professional Transport Component
 * 
 * Studio-grade transport controls with AURA glass aesthetic.
 * Uses the AURA Design System for consistent styling.
 * ALS-integrated: play button pulses when playing.
 */

import React from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon } from '../icons';
import './ProfessionalTransport.css';

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
  


  return (
    <>
      <div
        className={`transport-slab ${isDark ? 'transport-slab--dark' : ''} ${className}`}
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
        className="transport-btn-secondary"
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
        className={`transport-btn-play ${isPlaying ? 'transport-btn-play--playing' : ''}`}
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
        className="transport-btn-secondary"
      >
        <FastForwardIcon className="w-[18px] h-[18px]" />
      </button>

      {/* Timecode */}
      <div className="transport-timecode">
        {formatTime(currentTime)}
      </div>

      {/* Loop toggle */}
      <button
        type="button"
        aria-pressed={isLooping ? 'true' : 'false'}
        aria-label="Toggle loop"
        onClick={onToggleLoop}
        className={`transport-btn-loop ${isLooping ? 'transport-btn-loop--active' : ''}`}
      >
        <LoopIcon className="w-[18px] h-[18px]" />
        {isLooping && (
          <span
            className="transport-loop-dot"
            aria-hidden="true"
          />
        )}
      </button>
      </div>
    </>
  );
};

export default ProfessionalTransport;
