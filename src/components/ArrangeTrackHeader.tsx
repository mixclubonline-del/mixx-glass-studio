

import React, { useMemo } from 'react';
import { TrackData, MixerSettings } from '../App';
import { hexToRgba, TrackALSFeedback } from '../utils/ALS';
import { TrackUIState } from '../types/tracks';
import { MuteIcon, SoloIcon, ArmIcon } from './icons';
import { useFlowContext } from '../state/flowContextService';

type ArrangeTrackHeaderProps = {
  track: TrackData;
  uiState: TrackUIState;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  mixerSettings: MixerSettings | undefined;
  isArmed: boolean;
  isSoloed: boolean;
  alsIntensity?: number;
  alsFeedback?: TrackALSFeedback; // Full ALS feedback for richer context
  isPlaying?: boolean;
  isSidechainSource?: boolean; // Track is being used as sidechain source
  receivingSends?: number; // Number of tracks sending to this track
  pluginCount?: number; // Number of plugins/inserts on this track
  clipCount?: number; // Number of clips on this track
  hasAutomation?: boolean; // Whether track has automation lanes visible
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
  alsFeedback,
  isPlaying = false,
  isSidechainSource = false,
  receivingSends = 0,
  pluginCount = 0,
  clipCount = 0,
  hasAutomation = false,
  onInvokeBloom,
  onToggleMute,
  onToggleSolo,
  onToggleArm,
}) => {
  const globalFlowContext = useFlowContext();
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

  // Use full ALS feedback if available, otherwise fall back to intensity
  const intensity = alsFeedback?.intensity ?? Math.min(1, Math.max(0, alsIntensity ?? 0));
  const pulse = alsFeedback?.pulse ?? intensity * 0.6;
  const flow = alsFeedback?.flow ?? (mixerSettings?.volume ?? 0.75);
  const temperature = alsFeedback?.temperature ?? (intensity > 0.75 ? 'hot' : intensity > 0.5 ? 'warm' : intensity > 0.25 ? 'cool' : 'cold');
  const baseColor = alsFeedback?.color ?? fallbackSwatch.base;
  const glowColor = alsFeedback?.glowColor ?? fallbackSwatch.glow;
  const haloColor = hexToRgba(glowColor, 0.35 + intensity * 0.25);

  const isSelected = selectedTrackId === track.id;
  const collapsed = uiState.collapsed;
  const flowContext = uiState.context || 'playback';
  
  // Safe access to mixerSettings with fallback defaults
  const volume = mixerSettings?.volume ?? 0.75;
  const pan = mixerSettings?.pan ?? 0;
  const isMuted = mixerSettings?.isMuted ?? false;

  // Flow-adaptive energy temperature (hip-hop native: vibe over numbers)
  const energyTemperature = useMemo(() => {
    if (intensity < 0.2) return { label: 'COOL', color: '#60a5fa', pulse: false };
    if (intensity < 0.5) return { label: 'WARM', color: '#fbbf24', pulse: false };
    if (intensity < 0.8) return { label: 'HOT', color: '#f87171', pulse: true };
    return { label: 'FIRE', color: '#ef4444', pulse: true };
  }, [intensity]);

  // Flow state visualization
  const flowState = useMemo(() => {
    if (isArmed && flowContext === 'record') {
      return { pulse: true, glow: '#ef4444', label: 'REC' };
    }
    if (isPlaying && flowContext === 'playback') {
      return { pulse: true, glow: glowColor, label: 'PLAY' };
    }
    if (flowContext === 'edit') {
      return { pulse: false, glow: '#a78bfa', label: 'EDIT' };
    }
    if (flowContext === 'performance') {
      return { pulse: true, glow: '#fbbf24', label: 'LIVE' };
    }
    return { pulse: false, glow: glowColor, label: 'IDLE' };
  }, [isArmed, isPlaying, flowContext, glowColor]);

  // Flow-adaptive root styling with smooth transitions
  const rootStyle: React.CSSProperties = {
    borderLeft: `4px solid ${hexToRgba(flowState.glow, isArmed ? 0.95 : 0.85)}`,
    background: `linear-gradient(135deg, ${hexToRgba(
      baseColor,
      0.12 + intensity * 0.24 + (isPlaying ? 0.08 : 0)
    )} 0%, rgba(6,10,22,0.92) 70%)`,
    boxShadow: isSelected
      ? `0 0 ${28 + intensity * 12}px ${hexToRgba(glowColor, 0.18 + intensity * 0.32)}`
      : flowState.pulse
      ? `0 0 ${16 + intensity * 8}px ${hexToRgba(flowState.glow, 0.25 + intensity * 0.15)}`
      : undefined,
    opacity: collapsed ? 0.72 : 1,
    filter: collapsed ? 'saturate(0.8)' : isMuted ? 'saturate(0.6) grayscale(0.3)' : 'none',
    transition: 'all 320ms cubic-bezier(0.4, 0, 0.2, 1)',
  };

  if (isArmed) {
    rootStyle.borderLeft = `4px solid rgba(248, 113, 113, 0.95)`;
    rootStyle.boxShadow = `0 0 ${32 + (flowState.pulse ? 8 : 0)}px ${hexToRgba('#ef4444', 0.45 + (flowState.pulse ? 0.15 : 0))}`;
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
    <>
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.9; transform: scaleY(1); }
          50% { opacity: 1; transform: scaleY(1.05); }
        }
        @keyframes pulse-subtle {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px currentColor; }
          50% { opacity: 0.85; box-shadow: 0 0 12px currentColor; }
        }
      `}</style>
      <div
        className="group relative flex h-full w-full flex-col justify-between overflow-hidden border-b border-white/10 p-3 text-left transition-all duration-200 cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-cyan-400/70"
        style={rootStyle}
        onClick={handleSelectTrack}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelectTrack();
          }
        }}
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
      {/* Flow state pulse indicator */}
      {flowState.pulse && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 transition-opacity duration-300"
          style={{
            background: `linear-gradient(to bottom, ${hexToRgba(flowState.glow, 0.8)}, ${hexToRgba(flowState.glow, 0.4)})`,
            opacity: flowState.pulse ? 0.9 : 0,
            animation: flowState.pulse ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
          }}
        />
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex flex-col flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.32em] text-ink/60">
              {track.group?.toUpperCase() ?? 'FLOW LANES'}
            </span>
            {/* Energy temperature indicator (hip-hop native: vibe over numbers) */}
            {intensity > 0.1 && !collapsed && (
              <span
                className="text-[10px] uppercase tracking-[0.24em] px-2 py-0.5 rounded-full transition-all duration-300"
                style={{
                  background: hexToRgba(energyTemperature.color, 0.15),
                  border: `1px solid ${hexToRgba(energyTemperature.color, 0.4)}`,
                  color: energyTemperature.color,
                  boxShadow: energyTemperature.pulse
                    ? `0 0 8px ${hexToRgba(energyTemperature.color, 0.5)}`
                    : undefined,
                  animation: energyTemperature.pulse ? 'pulse-subtle 2s ease-in-out infinite' : 'none',
                }}
              >
                {energyTemperature.label}
              </span>
            )}
            {/* Contextual indicators row */}
            {!collapsed && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Routing indicators */}
                {(isSidechainSource || receivingSends > 0) && (
                  <>
                    {isSidechainSource && (
                      <span
                        className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full transition-all"
                        style={{
                          background: hexToRgba('#67e8f9', 0.15 + (pulse > 0.5 ? 0.1 : 0)),
                          border: `1px solid ${hexToRgba('#67e8f9', 0.4 + (pulse > 0.5 ? 0.2 : 0))}`,
                          color: '#67e8f9',
                          boxShadow: pulse > 0.5 ? `0 0 6px ${hexToRgba('#67e8f9', 0.5)}` : undefined,
                        }}
                        title="Sidechain source"
                      >
                        SC
                      </span>
                    )}
                    {receivingSends > 0 && (
                      <span
                        className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full transition-all"
                        style={{
                          background: hexToRgba('#a78bfa', 0.15 + (pulse > 0.5 ? 0.1 : 0)),
                          border: `1px solid ${hexToRgba('#a78bfa', 0.4 + (pulse > 0.5 ? 0.2 : 0))}`,
                          color: '#a78bfa',
                          boxShadow: pulse > 0.5 ? `0 0 6px ${hexToRgba('#a78bfa', 0.5)}` : undefined,
                        }}
                        title={`Receiving ${receivingSends} send${receivingSends > 1 ? 's' : ''}`}
                      >
                        {receivingSends}→
                      </span>
                    )}
                  </>
                )}
                {/* Plugin count indicator */}
                {pluginCount > 0 && (
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: hexToRgba(glowColor, 0.15),
                      border: `1px solid ${hexToRgba(glowColor, 0.4)}`,
                      color: glowColor,
                    }}
                    title={`${pluginCount} plugin${pluginCount > 1 ? 's' : ''} active`}
                  >
                    {pluginCount}FX
                  </span>
                )}
                {/* Clip count indicator */}
                {clipCount > 0 && (
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: hexToRgba(baseColor, 0.15),
                      border: `1px solid ${hexToRgba(baseColor, 0.4)}`,
                      color: baseColor,
                    }}
                    title={`${clipCount} clip${clipCount > 1 ? 's' : ''} on track`}
                  >
                    {clipCount}CL
                  </span>
                )}
                {/* Automation indicator */}
                {hasAutomation && (
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full"
                    style={{
                      background: hexToRgba('#fbbf24', 0.15),
                      border: `1px solid ${hexToRgba('#fbbf24', 0.4)}`,
                      color: '#fbbf24',
                    }}
                    title="Automation lanes active"
                  >
                    AUTO
                  </span>
                )}
                {/* Flow momentum indicator (when track is active) */}
                {intensity > 0.3 && globalFlowContext.momentum > 0.4 && (
                  <span
                    className="text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-full transition-all"
                    style={{
                      background: hexToRgba('#38bdf8', 0.15 + globalFlowContext.momentum * 0.1),
                      border: `1px solid ${hexToRgba('#38bdf8', 0.4 + globalFlowContext.momentum * 0.2)}`,
                      color: '#38bdf8',
                      boxShadow: globalFlowContext.momentum > 0.7 ? `0 0 6px ${hexToRgba('#38bdf8', 0.5)}` : undefined,
                    }}
                    title={`Flow momentum: ${Math.round(globalFlowContext.momentum * 100)}%`}
                  >
                    FLOW
                  </span>
                )}
              </div>
            )}
          </div>
          <span className="mt-1 line-clamp-1 text-lg font-semibold text-slate-100 transition-colors duration-200">
            {track.trackName}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-[11px] uppercase tracking-[0.28em] transition-colors duration-200"
              style={{
                color: flowState.pulse
                  ? hexToRgba(flowState.glow, 0.9)
                  : 'rgba(148, 163, 184, 0.5)',
              }}
            >
              {flowState.label}
            </span>
            {/* Flow context indicator */}
            {flowContext !== 'playback' && (
              <span className="text-[10px] uppercase tracking-[0.2em] text-ink/40">
                {flowContext}
              </span>
            )}
            {/* ALS Temperature indicator (more detailed) */}
            {!collapsed && intensity > 0.1 && (
              <span
                className="text-[10px] uppercase tracking-[0.18em] px-1.5 py-0.5 rounded-full transition-all"
                style={{
                  background: hexToRgba(energyTemperature.color, 0.12),
                  border: `1px solid ${hexToRgba(energyTemperature.color, 0.3)}`,
                  color: energyTemperature.color,
                  opacity: 0.8,
                }}
                title={`Temperature: ${temperature.toUpperCase()}, Pulse: ${Math.round(pulse * 100)}%, Flow: ${Math.round(flow * 100)}%`}
              >
                {temperature.toUpperCase().slice(0, 4)}
              </span>
            )}
          </div>
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
          <div className="flex flex-col items-end gap-1.5">
            {/* Volume energy bar (color/temperature, no numbers) */}
            <div
              className="h-1.5 w-20 overflow-hidden rounded-full bg-white/10 shadow-inner relative"
              title="Volume level"
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${Math.round(volume * 100)}%`,
                  background: volume > 0.85
                    ? `linear-gradient(to right, ${energyTemperature.color}, ${glowColor})`
                    : volume > 0.5
                    ? `linear-gradient(to right, ${glowColor}, ${baseColor})`
                    : `linear-gradient(to right, ${baseColor}, ${hexToRgba(baseColor, 0.6)})`,
                  boxShadow:
                    volume > 0.85 && intensity > 0.5
                      ? `0 0 6px ${hexToRgba(energyTemperature.color, 0.6)}`
                      : undefined,
                }}
              />
            </div>
            {/* Pan indicator (hip-hop native: spatial awareness) */}
            <div
              className="flex h-5 w-20 items-center justify-center rounded-full border transition-all duration-200"
              style={{
                borderColor: hexToRgba(glowColor, pan === 0 ? 0.1 : 0.3),
                background: hexToRgba(glowColor, pan === 0 ? 0.05 : 0.1),
                color: pan === 0 ? 'rgba(148, 163, 184, 0.6)' : hexToRgba(glowColor, 0.8),
              }}
              title="Stereo position"
            >
              <span className="text-[10px] uppercase tracking-[0.2em]">
                {pan === 0 ? 'CENTER' : `${pan > 0 ? 'R' : 'L'} ${Math.abs(pan * 100).toFixed(0)}`}
              </span>
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
      
      {/* Flow-adaptive energy visualization (ALS-driven, no numbers) */}
      {!collapsed && intensity > 0.05 && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${intensity * 100}%`,
              background: `linear-gradient(to right, ${baseColor}, ${glowColor}, ${energyTemperature.color})`,
              boxShadow: `0 0 4px ${hexToRgba(glowColor, 0.6)}`,
            }}
          />
        </div>
      )}
    </div>
    </>
  );
};

export default ArrangeTrackHeader;