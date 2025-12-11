/**
 * Professional Transport Component
 * 
 * Studio-grade transport controls with glass aesthetic.
 * Replaces toy-like buttons with precise, tactile controls.
 */

import React from 'react';
import { PlayIcon, PauseIcon, RewindIcon, FastForwardIcon, LoopIcon } from '../icons';

interface ProfessionalTransportProps {
  isPlaying: boolean;
  isLooping: boolean;
  currentTime: number;
  onPlayPause: () => void;
  onSeek: (direction: 'back' | 'forward') => void;
  onToggleLoop: () => void;
  className?: string;
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
  onToggleLoop,
  className = '',
}) => {
  return (
    <div
      className={`transport-slab ${className}`}
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px 16px',
        borderRadius: '12px',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.82), rgba(240,238,255,0.6))',
        boxShadow: '0 6px 18px rgba(68,54,120,0.08), inset 0 1px 0 rgba(255,255,255,0.5)',
        border: '1px solid var(--glass-border)',
        backdropFilter: 'blur(10px) saturate(120%)',
        WebkitBackdropFilter: 'blur(10px) saturate(120%)',
      }}
    >
      {/* Cue backward */}
      <button
        type="button"
        aria-label="Cue backward"
        onClick={() => onSeek('back')}
        className="btn-transport-secondary"
        style={{
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
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
      >
        <RewindIcon className="w-[18px] h-[18px]" />
      </button>

      {/* Play/Pause */}
      <button
        type="button"
        aria-label={isPlaying ? 'Pause' : 'Play'}
        onClick={onPlayPause}
        className="btn-play"
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(180deg, var(--accent), var(--accent-strong))`,
          boxShadow: '0 6px 18px rgba(110,86,255,0.18)',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          transformOrigin: 'center',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(110,86,255,0.25)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 18px rgba(110,86,255,0.18)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px) scale(0.995)';
          e.currentTarget.style.boxShadow = '0 3px 8px rgba(110,86,255,0.12)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(110,86,255,0.25)';
        }}
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
        onClick={() => onSeek('forward')}
        className="btn-transport-secondary"
        style={{
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
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.6)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.4)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
      >
        <FastForwardIcon className="w-[18px] h-[18px]" />
      </button>

      {/* Timecode */}
      <div
        style={{
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
        }}
      >
        {formatTime(currentTime)}
      </div>

      {/* Loop toggle */}
      <button
        type="button"
        aria-pressed={isLooping}
        aria-label="Toggle loop"
        onClick={onToggleLoop}
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isLooping
            ? 'rgba(139,123,255,0.2)'
            : 'rgba(255,255,255,0.4)',
          border: `1px solid ${isLooping ? 'var(--accent)' : 'var(--glass-border)'}`,
          color: isLooping ? 'var(--accent-strong)' : 'var(--muted)',
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isLooping
            ? 'rgba(139,123,255,0.3)'
            : 'rgba(255,255,255,0.6)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isLooping
            ? 'rgba(139,123,255,0.2)'
            : 'rgba(255,255,255,0.4)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onMouseDown={(e) => {
          e.currentTarget.style.transform = 'translateY(2px)';
        }}
        onMouseUp={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)';
        }}
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
              background: 'var(--accent)',
              boxShadow: '0 0 8px var(--accent)',
            }}
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  );
};

export default ProfessionalTransport;
