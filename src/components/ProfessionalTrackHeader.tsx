/**
 * Professional Track Header Component
 * 
 * Comprehensive track header for all track types with type-specific controls.
 * Follows Flow doctrine: Reductionist Engineering, Flow-conscious design, Mixx Recall.
 */

import React, { useMemo, useState, useCallback } from 'react';
import { TrackData, MixerSettings } from '../App';
import { TrackUIState } from '../types/tracks';
import { AuraColors, auraAlpha } from '../theme/aura-tokens';
import { MuteIcon, SoloIcon, ArmIcon } from './icons';
import { InputMonitorIcon } from './flowdock/glyphs/InputMonitorIcon';
import './ProfessionalTrackHeader.css';
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
    <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
    <rect x="5" y="11" width="14" height="10" rx="2" />
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

  // Computed styles moved to CSS variables
  const dynamicStyles = {
    '--track-base-color': baseColor,
    '--track-glow-color': glowColor,
    '--track-intensity': intensity,
    '--track-volume': `${Math.round(volume * 100)}%`,
    '--track-record-level': `${Math.min(100, (recordInputLevel ?? 0) * 100)}%`,
  } as React.CSSProperties;

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
      className={`track-header ${isSelected ? 'track-header--selected' : ''} ${isArmed ? 'track-header--armed' : ''} ${isDragOver ? 'track-header--drag-over' : ''}`}
      style={dynamicStyles}
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
      <div className="track-header__hover-glow">
        <div className="track-header__glow-pill" />
      </div>

      {/* Main content - Two-row layout with explicit spacing */}
      <div className="track-header__container">
        {/* Row 1: Track info on left, primary controls on right */}
        <div className="track-header__row track-header__row--top">
          {/* Left: Track info - Fixed max width to prevent squishing */}
          <div className="track-header__info-col">
            {/* Group label */}
            <div className="track-header__meta-row">
              <span className="track-header__group-label">
                {track.group?.toUpperCase() ?? 'FLOW LANES'}
              </span>
              {settings.locked && (
                <LockIcon className="track-header__lock-icon" />
              )}
              {resolvedTrackType !== 'audio' && (
                <span className="track-header__type-badge">
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
                className="track-header__name-input"
                autoFocus
                onClick={(e) => e.stopPropagation()}
                title="Rename track"
                aria-label="Rename track"
              />
            ) : (
              <span 
                className="track-header__name-display"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                {track.trackName}
              </span>
            )}

            {/* Context mode */}
            <span className="track-header__context-mode">
              {uiState.context?.toUpperCase() ?? 'PLAYBACK'}
            </span>
          </div>

          {/* Right: Primary controls - Mute, Solo, Arm, Collapse */}
          <div className="track-header__controls-col">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.(track.id);
              }}
              className={`track-header__btn track-header__btn--lg ${
                isMuted ? 'track-header__btn--mute-active' : 'track-header__btn--default'
              }`}
              title={isMuted ? 'Unmute track' : 'Mute track'}
            >
              <MuteIcon className="track-header__icon" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSolo?.(track.id);
              }}
              className={`track-header__btn track-header__btn--lg ${
                isSoloed ? 'track-header__btn--solo-active' : 'track-header__btn--default'
              }`}
              title={isSoloed ? 'Unsolo track' : 'Solo track'}
            >
              <SoloIcon className="track-header__icon" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleArm?.(track.id);
              }}
              className={`track-header__btn track-header__btn--lg ${
                isArmed ? 'track-header__btn--arm-active' : 'track-header__btn--default'
              }`}
              title={isArmed ? 'Disarm track' : 'Arm track for recording'}
            >
              <ArmIcon className="track-header__icon" />
            </button>
            {onToggleCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.(track.id);
                }}
                className="track-header__btn track-header__btn--lg track-header__btn--collapse"
                title={collapsed ? 'Expand track' : 'Collapse track'}
              >
                <CollapseIcon className="track-header__icon--collapse" collapsed={collapsed} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary controls on left, Volume/Pan on right */}
        <div className="track-header__row track-header__row--bottom">
          {/* Left: Secondary controls */}
          <div className="track-header__controls-col">
            {showInputMonitoring && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleInputMonitor?.(track.id);
                }}
                className={`track-header__btn track-header__btn--md ${
                  settings.inputMonitoring ? 'track-header__btn--monitor-active' : 'track-header__btn--monitor'
                }`}
                title={settings.inputMonitoring ? 'Disable input monitoring' : 'Enable input monitoring'}
              >
                <InputMonitorIcon className="track-header__icon--sm" />
              </button>
            )}
            {showPhaseInvert && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePhaseInvert?.(track.id);
                }}
                className={`track-header__btn track-header__btn--md ${
                  settings.phaseInvert ? 'track-header__btn--phase-active' : 'track-header__btn--phase'
                }`}
                title={settings.phaseInvert ? 'Phase normal' : 'Phase invert (180°)'}
              >
                <PhaseInvertIcon className="track-header__icon--sm" />
              </button>
            )}
            {insertCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open insert browser
                }}
                className="track-header__btn track-header__btn--md track-header__btn--text track-header__btn--insert"
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
                className="track-header__btn track-header__btn--md track-header__btn--text track-header__btn--send"
                title={`${sendCount} send${sendCount > 1 ? 's' : ''} active`}
              >
                {sendCount}
              </button>
            )}
          </div>

          {/* Right: Volume & Pan display */}
          <div className="track-header__vol-pan-group">
            <div className="track-header__vol-pan-group">
              <div
                className="track-header__vol-track"
                title={pan === 0 ? 'Volume Center' : `Volume ${pan > 0 ? 'Right' : 'Left'}`}
              >
                <div
                  className="track-header__vol-fill"
                />
              </div>
              <div
                className="track-header__pan-display"
                title={pan === 0 ? 'Centered' : Math.abs(pan) >= 0.8 ? (pan > 0 ? 'Hard Right' : 'Hard Left') : Math.abs(pan) >= 0.4 ? (pan > 0 ? 'Right' : 'Left') : (pan > 0 ? 'Slight Right' : 'Slight Left')}
              >
                {pan === 0 ? 'CENTER' : Math.abs(pan) >= 0.8 ? (pan > 0 ? 'HARD R' : 'HARD L') : Math.abs(pan) >= 0.4 ? (pan > 0 ? 'RIGHT' : 'LEFT') : (pan > 0 ? 'R' : 'L')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status chips */}
      {statusChips.length > 0 && (
        <div className="track-header__chips-row">
          {statusChips.map((chip, i) => (
            <span
              key={i}
              className="track-header__chip"
              style={{ '--chip-accent': chip.accent } as React.CSSProperties}
              title={chip.description}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* Divider if no chips */}
      {statusChips.length === 0 && (
        <div className="track-header__divider" />
      )}

      {/* Record input level meter (for recording tracks) */}
      {recordInputLevel !== undefined && recordInputLevel > 0 && (
        <div className="track-header__record-meter">
          <div
            className="track-header__record-meter-fill"
          />
        </div>
      )}
    </div>
  );
};

export default ProfessionalTrackHeader;

