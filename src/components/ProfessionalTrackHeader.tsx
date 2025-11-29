/**
 * Professional Track Header Component
 * 
 * Comprehensive track header for all track types with type-specific controls.
 * Follows Flow doctrine: Reductionist Engineering, Flow-conscious design, Mixx Recall.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { TrackData, MixerSettings } from '../App';
import { TrackUIState } from '../types/tracks';
import { hexToRgba } from '../utils/ALS';
import { MuteIcon, SoloIcon, ArmIcon } from './icons';
import { InputMonitorIcon } from './flowdock/glyphs/InputMonitorIcon';
import { PanIcon } from './flowdock/glyphs/PanIcon';
import { RoutingIcon } from './flowdock/glyphs/RoutingIcon';
import { AutomationIcon } from './flowdock/glyphs/AutomationIcon';
import { SendsIcon } from './flowdock/glyphs/SendsIcon';
import { InsertsIcon } from './flowdock/glyphs/InsertsIcon';
import type { TrackType, TrackHeaderSettings } from '../types/trackHeader';

// Additional icons for track headers
const PhaseInvertIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M12 2v20M2 12h20" strokeLinecap="round" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const StereoWidthIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d="M3 12h18M6 8l-3 4 3 4M18 8l3 4-3 4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const LockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <rect x="5" y="11" width="14" height="10" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
  </svg>
);

const CollapseIcon: React.FC<{ className?: string; collapsed: boolean }> = ({ className, collapsed }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className={className}>
    <path d={collapsed ? "M9 18l6-6-6-6" : "M18 15l-6-6-6 6"} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

interface ProfessionalTrackHeaderProps {
  track: TrackData;
  uiState: TrackUIState;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  mixerSettings: MixerSettings | undefined;
  isArmed: boolean;
  isSoloed: boolean;
  alsIntensity?: number;
  trackType?: TrackType;
  headerSettings?: Partial<TrackHeaderSettings>;
  
  // Callbacks
  onInvokeBloom?: (trackId: string) => void;
  onToggleMute?: (trackId: string) => void;
  onToggleSolo?: (trackId: string) => void;
  onToggleArm?: (trackId: string) => void;
  onToggleInputMonitor?: (trackId: string) => void;
  onTogglePhaseInvert?: (trackId: string) => void;
  onStereoWidthChange?: (trackId: string, width: number) => void;
  onInputSourceChange?: (trackId: string, source: string) => void;
  onOutputRoutingChange?: (trackId: string, routing: string) => void;
  onAutomationModeChange?: (trackId: string, mode: string) => void;
  onToggleCollapse?: (trackId: string) => void;
  onToggleLock?: (trackId: string) => void;
  onRename?: (trackId: string, newName: string) => void;
  
  // Additional data
  insertCount?: number;
  sendCount?: number;
  recordInputLevel?: number;
  
  // Plugin drag and drop
  onAddPlugin?: (trackId: string, pluginId: string) => void;
}

const ProfessionalTrackHeader: React.FC<ProfessionalTrackHeaderProps> = ({
  track,
  uiState,
  selectedTrackId,
  onSelectTrack,
  mixerSettings,
  isArmed,
  isSoloed,
  alsIntensity,
  trackType = 'audio',
  headerSettings = {},
  
  onInvokeBloom,
  onToggleMute,
  onToggleSolo,
  onToggleArm,
  onToggleInputMonitor,
  onTogglePhaseInvert,
  onStereoWidthChange,
  onInputSourceChange,
  onOutputRoutingChange,
  onAutomationModeChange,
  onToggleCollapse,
  onToggleLock,
  onRename,
  
  insertCount = 0,
  sendCount = 0,
  recordInputLevel,
  onAddPlugin,
}) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(track.trackName);
  
  // Determine track type from role if not explicitly provided
  const resolvedTrackType: TrackType = useMemo(() => {
    if (trackType) return trackType;
    if (track.role === 'twoTrack') return 'two-track';
    if (track.role === 'hushRecord') return 'hush-record';
    return 'audio';
  }, [trackType, track.role]);

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

  const isSelected = selectedTrackId === track.id;
  const collapsed = uiState.collapsed;
  const volume = mixerSettings?.volume ?? 0.75;
  const pan = mixerSettings?.pan ?? 0;
  const isMuted = mixerSettings?.isMuted ?? false;
  
  // Header settings with defaults
  const settings: TrackHeaderSettings = {
    volume,
    pan,
    mute: isMuted,
    solo: isSoloed,
    arm: isArmed,
    inputMonitoring: headerSettings.inputMonitoring ?? false,
    phaseInvert: headerSettings.phaseInvert ?? false,
    stereoWidth: headerSettings.stereoWidth ?? 1.0,
    inputSource: headerSettings.inputSource,
    outputRouting: headerSettings.outputRouting,
    automationMode: headerSettings.automationMode ?? 'read',
    locked: headerSettings.locked ?? track.locked ?? false,
    insertCount,
    sendCount,
    recordInputLevel,
  };

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

  const handleSelectTrack = useCallback(() => {
    const wasSelected = isSelected;
    onSelectTrack(track.id);
    if (!wasSelected) {
      onInvokeBloom?.(track.id);
    }
  }, [isSelected, onSelectTrack, track.id, onInvokeBloom]);

  const handleRename = useCallback(() => {
    if (isRenaming && renameValue !== track.trackName && renameValue.trim()) {
      onRename?.(track.id, renameValue.trim());
    }
    setIsRenaming(false);
  }, [isRenaming, renameValue, track.trackName, track.id, onRename]);

  const statusChips = useMemo(() => {
    const chips: Array<{ label: string; accent: string; description: string }> = [];
    
    if (isMuted) chips.push({ label: 'Mute', accent: '#f87171', description: 'Track is muted from mix bus.' });
    if (isSoloed) chips.push({ label: 'Solo', accent: '#fde047', description: 'Solo isolating this lane.' });
    if (isArmed) chips.push({ label: 'Arm', accent: '#fb7185', description: 'Armed for recording.' });
    if (collapsed) chips.push({ label: 'Capsule', accent: '#a5b4fc', description: 'Track lane condensed.' });
    if (settings.locked) chips.push({ label: 'Lock', accent: '#94a3b8', description: 'Track is locked from editing.' });
    if (settings.inputMonitoring) chips.push({ label: 'Monitor', accent: '#60a5fa', description: 'Input monitoring active.' });
    if (settings.phaseInvert) chips.push({ label: 'Phase', accent: '#f59e0b', description: 'Phase inverted (180°).' });
    if (insertCount > 0) chips.push({ label: `${insertCount} Ins`, accent: '#8b5cf6', description: `${insertCount} insert${insertCount > 1 ? 's' : ''} active.` });
    if (sendCount > 0) chips.push({ label: `${sendCount} Send`, accent: '#06b6d4', description: `${sendCount} send${sendCount > 1 ? 's' : ''} active.` });
    
    return chips;
  }, [isMuted, isSoloed, isArmed, collapsed, settings.locked, settings.inputMonitoring, settings.phaseInvert, insertCount, sendCount]);

  // Determine which controls to show based on track type
  const showInputMonitoring = ['audio', 'hush-record'].includes(resolvedTrackType);
  const showPhaseInvert = ['audio', 'hush-record'].includes(resolvedTrackType);
  const showStereoWidth = ['audio', 'instrument', 'hush-record', 'two-track'].includes(resolvedTrackType);
  const showMidiControls = ['midi', 'instrument'].includes(resolvedTrackType);
  const showBusControls = resolvedTrackType === 'bus';

  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const pluginId = e.dataTransfer.getData("application/plugin-id") || 
                     e.dataTransfer.getData("text/plain");
    
    if (pluginId && onAddPlugin) {
      onAddPlugin(track.id, pluginId);
    }
  }, [track.id, onAddPlugin]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`group relative flex w-full flex-col overflow-hidden border-b border-white/10 px-3 py-3.5 text-left transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 cursor-pointer ${
        isDragOver ? 'ring-2 ring-cyan-400/60 bg-cyan-400/10' : ''
      }`}
      style={{ ...rootStyle, height: '100%' }}
      onClick={handleSelectTrack}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectTrack();
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hover glow effect */}
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

      {/* Main content - Two-row layout with explicit spacing */}
      <div className="flex flex-col gap-2.5 h-full justify-between">
        {/* Row 1: Track info on left, primary controls on right */}
        <div className="flex items-start justify-between gap-3 w-full">
          {/* Left: Track info - Fixed max width to prevent squishing */}
          <div className="flex flex-col flex-1 min-w-[120px] max-w-[65%]">
            {/* Group label */}
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs uppercase tracking-[0.32em] text-ink/60 whitespace-nowrap">
                {track.group?.toUpperCase() ?? 'FLOW LANES'}
              </span>
              {settings.locked && (
                <LockIcon className="w-3 h-3 text-ink/40 flex-shrink-0" />
              )}
              {resolvedTrackType !== 'audio' && (
                <span className="text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-white/5 text-ink/50 border border-white/10 whitespace-nowrap">
                  {resolvedTrackType.toUpperCase()}
                </span>
              )}
            </div>

            {/* Track name - editable */}
            {isRenaming ? (
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={handleRename}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') {
                    setRenameValue(track.trackName);
                    setIsRenaming(false);
                  }
                }}
                className="mt-0.5 text-lg font-semibold text-slate-100 bg-transparent border-b border-cyan-400/50 focus:outline-none focus:border-cyan-400 w-full"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                className="mt-0.5 line-clamp-1 text-lg font-semibold text-slate-100 cursor-text break-words"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                {track.trackName}
              </span>
            )}

            {/* Context mode */}
            <span className="text-[11px] uppercase tracking-[0.28em] text-ink/50 mt-0.5 whitespace-nowrap">
              {uiState.context?.toUpperCase() ?? 'PLAYBACK'}
            </span>
          </div>

          {/* Right: Primary controls - Mute, Solo, Arm, Collapse */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.(track.id);
              }}
              className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                isMuted
                  ? 'bg-red-500/30 border-red-400/60 text-red-200 shadow-[0_0_12px_rgba(248,113,113,0.3)]'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink hover:border-white/20'
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
              className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                isSoloed
                  ? 'bg-yellow-500/30 border-yellow-400/60 text-yellow-200 shadow-[0_0_12px_rgba(250,204,21,0.3)]'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink hover:border-white/20'
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
              className={`w-7 h-7 rounded-lg border transition-all flex items-center justify-center flex-shrink-0 ${
                isArmed
                  ? 'bg-pink-500/30 border-pink-400/60 text-pink-200 shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                  : 'bg-white/5 border-white/10 text-ink/60 hover:bg-white/10 hover:text-ink hover:border-white/20'
              }`}
              title={isArmed ? 'Disarm track' : 'Arm track for recording'}
            >
              <ArmIcon className="w-3.5 h-3.5" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.(track.id);
                }}
                className="w-7 h-7 rounded-lg border border-white/8 bg-white/3 text-ink/50 hover:bg-white/8 hover:text-ink/70 flex items-center justify-center transition-all flex-shrink-0"
                title={collapsed ? 'Expand track' : 'Collapse track'}
              >
                <CollapseIcon className="w-3 h-3" collapsed={collapsed} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary controls on left, Volume/Pan on right */}
        <div className="flex items-center justify-between gap-3 w-full mt-0.5">
          {/* Left: Secondary controls */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {showInputMonitoring && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleInputMonitor?.(track.id);
                }}
                className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center flex-shrink-0 ${
                  settings.inputMonitoring
                    ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
                    : 'bg-white/3 border-white/8 text-ink/50 hover:bg-white/8 hover:text-ink/70'
                }`}
                title={settings.inputMonitoring ? 'Disable input monitoring' : 'Enable input monitoring'}
              >
                <InputMonitorIcon className="w-3 h-3" />
              </button>
            )}
            {showPhaseInvert && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePhaseInvert?.(track.id);
                }}
                className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center flex-shrink-0 ${
                  settings.phaseInvert
                    ? 'bg-orange-500/25 border-orange-400/50 text-orange-200'
                    : 'bg-white/3 border-white/8 text-ink/50 hover:bg-white/8 hover:text-ink/70'
                }`}
                title={settings.phaseInvert ? 'Phase normal' : 'Phase invert (180°)'}
              >
                <PhaseInvertIcon className="w-3 h-3" />
              </button>
            )}
            {insertCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open insert browser
                }}
                className="w-6 h-6 rounded-md border border-purple-400/35 bg-purple-500/15 text-purple-200 flex items-center justify-center text-[9px] font-semibold hover:bg-purple-500/25 transition-all flex-shrink-0"
                title={`${insertCount} insert${insertCount > 1 ? 's' : ''} active`}
              >
                {insertCount}
              </button>
            )}
            {sendCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open sends panel
                }}
                className="w-6 h-6 rounded-md border border-cyan-400/35 bg-cyan-500/15 text-cyan-200 flex items-center justify-center text-[9px] font-semibold hover:bg-cyan-500/25 transition-all flex-shrink-0"
                title={`${sendCount} send${sendCount > 1 ? 's' : ''} active`}
              >
                {sendCount}
              </button>
            )}
          </div>

          {/* Right: Volume & Pan display */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-end gap-1">
              <div
                className="h-1.5 w-20 overflow-hidden rounded-full bg-white/8 shadow-inner border border-white/5"
                title={`Volume ${Math.round(volume * 100)}%`}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 transition-all duration-200"
                  style={{ width: `${Math.round(volume * 100)}%` }}
                />
              </div>
              <div
                className="flex h-5 w-20 items-center justify-center rounded-md border border-white/10 bg-white/5 text-[10px] uppercase tracking-[0.2em] text-ink/60"
                title={`Pan ${pan >= 0 ? 'R' : 'L'}${Math.abs(pan * 100).toFixed(0)}%`}
              >
                {pan === 0 ? 'CENTER' : `${pan > 0 ? 'R' : 'L'} ${Math.abs(pan * 100).toFixed(0)}%`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status chips */}
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

      {/* Divider if no chips */}
      {statusChips.length === 0 && (
        <div className="mt-4 h-[1px] w-full rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      )}

      {/* Record input level meter (for recording tracks) */}
      {recordInputLevel !== undefined && recordInputLevel > 0 && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-green-400 to-red-400 transition-all duration-100"
            style={{ width: `${Math.min(100, recordInputLevel * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ProfessionalTrackHeader;

