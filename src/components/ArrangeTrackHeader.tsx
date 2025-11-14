

import React, { useMemo } from 'react';
import { TrackData, MixerSettings } from '../App';
import { hexToRgba } from '../utils/ALS';
import { TrackUIState } from '../types/tracks';
import { MuteIcon, SoloIcon, ArmIcon } from './icons';

type ArrangeTrackHeaderProps = {
  track: TrackData;
  uiState: TrackUIState;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  mixerSettings: MixerSettings | undefined;
  isArmed: boolean;
  isSoloed: boolean;
  alsIntensity?: number;
  onInvokeBloom?: (trackId: string) => void;
  onToggleMute?: (trackId: string) => void;
  onToggleSolo?: (trackId: string) => void;
  onToggleArm?: (trackId: string) => void;
};

const ArrangeTrackHeader: React.FC<ArrangeTrackHeaderProps> = ({
  track,
  uiState,
  selectedTrackId,
  onSelectTrack,
  mixerSettings,
  isArmed,
  isSoloed,
  alsIntensity,
  onInvokeBloom,
  onToggleMute,
  onToggleSolo,
  onToggleArm,
}) => {
  const fallbackSwatch = useMemo(() => {
    switch (track.trackColor) {
      case 'cyan':
        return { base: '#06b6d4', glow: '#67e8f9' };
      case 'magenta':
        return { base: '#d946ef', glow: '#f0abfc' };
      case 'blue':
        return { base: '#3b82f6', glow: '#93c5fd' };
      case 'green':
        return { base: '#22c55e', glow: '#86efac' };
      case 'crimson':
        return { base: '#f43f5e', glow: '#fb7185' };
      case 'purple':
      default:
        return { base: '#8b5cf6', glow: '#c4b5fd' };
    }
  }, [track.trackColor]);

  const intensity = Math.min(1, Math.max(0, alsIntensity ?? 0));
  const baseColor = fallbackSwatch.base;
  const glowColor = fallbackSwatch.glow;
  const haloColor = hexToRgba(glowColor, 0.35 + intensity * 0.25);

  const isSelected = selectedTrackId === track.id;
  const collapsed = uiState.collapsed;
  // Safe access to mixerSettings with fallback defaults
  const volume = mixerSettings?.volume ?? 0.75;
  const pan = mixerSettings?.pan ?? 0;
  const isMuted = mixerSettings?.isMuted ?? false;

  const rootStyle: React.CSSProperties = {
    borderLeft: `4px solid ${hexToRgba(glowColor, 0.85)}`,
    background: `linear-gradient(135deg, ${hexToRgba(
      baseColor,
      0.12 + intensity * 0.24
    )} 0%, rgba(6,10,22,0.92) 70%)`,
    boxShadow: isSelected
      ? `0 0 28px ${hexToRgba(glowColor, 0.18 + intensity * 0.32)}`
      : undefined,
    opacity: collapsed ? 0.72 : 1,
    filter: collapsed ? 'saturate(0.8)' : 'none',
    transition: 'all 220ms ease-out',
  };

  if (isArmed) {
    rootStyle.borderLeft = `4px solid rgba(248, 113, 113, 0.95)`;
    rootStyle.boxShadow = `0 0 32px ${hexToRgba('#ef4444', 0.45)}`;
  }

  const statusChips = [
    isMuted
      ? { label: 'Mute', accent: '#f87171', description: 'Track is muted from mix bus.' }
      : null,
    isSoloed ? { label: 'Solo', accent: '#fde047', description: 'Solo isolating this lane.' } : null,
    isArmed ? { label: 'Arm', accent: '#fb7185', description: 'Armed for recording.' } : null,
    collapsed ? { label: 'Capsule', accent: '#a5b4fc', description: 'Track lane condensed.' } : null,
  ].filter(Boolean) as Array<{ label: string; accent: string; description: string }>;

  const handleSelectTrack = () => {
    const wasSelected = isSelected;
    onSelectTrack(track.id);
    if (!wasSelected) {
      onInvokeBloom?.(track.id);
    }
  };

  return (
    <button
      type="button"
      className="group relative flex h-full w-full flex-col justify-between overflow-hidden border-b border-white/10 p-3 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70"
      style={rootStyle}
      onClick={handleSelectTrack}
    >
      <div className="absolute inset-0 z-[-1] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at 12% 18%, ${hexToRgba(
            glowColor,
              0.22
            )}, transparent 65%)`,
            filter: 'blur(28px)',
          }}
        />
      </div>
      <div className="flex items-start justify-between">
        <div className="flex flex-col">
          <span className="text-xs uppercase tracking-[0.32em] text-ink/60">
            {track.group?.toUpperCase() ?? 'FLOW LANES'}
          </span>
          <span className="mt-1 line-clamp-1 text-lg font-semibold text-slate-100">{track.trackName}</span>
          <span className="text-[11px] uppercase tracking-[0.28em] text-ink/50">
            {uiState.context?.toUpperCase() ?? 'PLAYBACK'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {/* Mute/Solo/Arm Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.(track.id);
              }}
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                isMuted
                  ? 'bg-red-500/30 border-red-400/60 text-red-200'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink'
              }`}
              title={isMuted ? 'Unmute track' : 'Mute track'}
            >
              <MuteIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSolo?.(track.id);
              }}
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                isSoloed
                  ? 'bg-yellow-500/30 border-yellow-400/60 text-yellow-200'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink'
              }`}
              title={isSoloed ? 'Unsolo track' : 'Solo track'}
            >
              <SoloIcon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleArm?.(track.id);
              }}
              className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center ${
                isArmed
                  ? 'bg-pink-500/30 border-pink-400/60 text-pink-200'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink'
              }`}
              title={isArmed ? 'Disarm track' : 'Arm track for recording'}
            >
              <ArmIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 shadow-inner"
              title={`Volume ${Math.round(volume * 100)}%`}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 transition-all duration-200"
                style={{ width: `${Math.round(volume * 100)}%` }}
              />
            </div>
            <div
              className="flex h-5 w-20 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-ink/60"
              title={`Pan ${pan >= 0 ? 'R' : 'L'}${Math.abs(pan * 100).toFixed(0)}%`}
            >
              {pan === 0 ? 'CENTER' : `${pan > 0 ? 'R' : 'L'} ${Math.abs(pan * 100).toFixed(0)}%`}
            </div>
          </div>
        </div>
      </div>
      {statusChips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              className="rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-ink/70 backdrop-blur-sm transition-all duration-200"
              style={{
                background: hexToRgba(chip.accent, 0.18),
                border: `1px solid ${hexToRgba(chip.accent, 0.45)}`,
                boxShadow: `0 0 14px ${hexToRgba(chip.accent, 0.35)}`,
              }}
              title={chip.description}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}
      {!statusChips.length && (
        <div className="mt-4 h-[1px] w-full rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}
    </button>
  );
};

export default ArrangeTrackHeader;