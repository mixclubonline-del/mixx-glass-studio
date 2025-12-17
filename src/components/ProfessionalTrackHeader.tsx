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
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

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
    )} 0%, rgba(15, 15, 26, 0.94) 60%, rgba(26, 16, 51, 0.88) 100%)`,
    boxShadow: isSelected
      ? `0 0 32px ${hexToRgba(glowColor, 0.2 + intensity * 0.35)}, inset 0 0 20px ${hexToRgba(baseColor, 0.08)}`
      : `inset 0 0 12px rgba(139, 92, 246, 0.04)`,
    opacity: collapsed ? 0.72 : 1,
    filter: collapsed ? 'saturate(0.8)' : 'none',
    transition: 'all 220ms cubic-bezier(0.4, 0, 0.2, 1)',
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
      style={composeStyles(
        layout.position.relative,
        layout.flex.container('col'),
        layout.width.full,
        layout.overflow.hidden,
        spacing.px(3),
        spacing.py(5),
        effects.border.bottom(),
        transitions.transition.standard('all', 200, 'ease-out'),
        {
          height: '100%',
          minHeight: '72px',
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          outline: 'none',
          ...rootStyle,
          ...(isDragOver ? {
            border: '2px solid rgba(6, 182, 212, 0.6)',
            background: 'rgba(6, 182, 212, 0.1)',
          } : {}),
        }
      )}
      onClick={handleSelectTrack}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelectTrack();
        }
        if (e.key === 'Tab' && !e.shiftKey) {
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(6, 182, 212, 0.7)';
        }
      }}
      onKeyUp={(e) => {
        if (e.key === 'Tab') {
          e.currentTarget.style.boxShadow = rootStyle.boxShadow || 'none';
        }
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onMouseEnter={(e) => {
        const glowEl = e.currentTarget.querySelector('[data-hover-glow]') as HTMLElement;
        if (glowEl) glowEl.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const glowEl = e.currentTarget.querySelector('[data-hover-glow]') as HTMLElement;
        if (glowEl) glowEl.style.opacity = '0';
      }}
    >
      {/* Hover glow effect */}
      <div 
        data-hover-glow
        style={composeStyles(
          layout.position.absolute,
          { inset: 0, zIndex: -1 },
          transitions.transition.standard('opacity', 300, 'ease-out'),
          {
            opacity: 0,
          }
        )}
      >
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            {
              background: `radial-gradient(circle at 12% 18%, ${hexToRgba(
                glowColor,
                0.22
              )}, transparent 65%)`,
              filter: 'blur(28px)',
            }
          )}
        />
      </div>

      {/* Main content - Two-row layout with explicit spacing */}
      <div style={composeStyles(
        layout.flex.container('col'),
        spacing.gap(2.5),
        { height: '100%' },
        layout.flex.justify.between
      )}>
        {/* Row 1: Track info on left, primary controls on right */}
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.start,
          layout.flex.justify.between,
          spacing.gap(3),
          layout.width.full
        )}>
          {/* Left: Track info - Fixed max width to prevent squishing */}
          <div style={composeStyles(
            layout.flex.container('col'),
            { flex: 1, minWidth: '120px', maxWidth: '65%' }
          )}>
            {/* Group label */}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              spacing.gap(2),
              spacing.mb(0.5)
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.75rem',
                  color: 'rgba(230, 240, 255, 0.6)',
                  whiteSpace: 'nowrap',
                }
              )}>
                {track.group?.toUpperCase() ?? 'FLOW LANES'}
              </span>
              {settings.locked && (
                <LockIcon style={{ width: '12px', height: '12px', color: 'rgba(230, 240, 255, 0.4)', flexShrink: 0 }} />
              )}
              {resolvedTrackType !== 'audio' && (
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  spacing.px(2),
                  spacing.py(0.5),
                  effects.border.radius.full,
                  {
                    fontSize: '10px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(230, 240, 255, 0.5)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    whiteSpace: 'nowrap',
                  }
                )}>
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
                style={composeStyles(
                  typography.weight('semibold'),
                  spacing.mt(0.5),
                  layout.width.full,
                  {
                    fontSize: '1.125rem',
                    color: 'rgb(241, 245, 249)',
                    background: 'transparent',
                    border: 'none',
                    borderBottom: '1px solid rgba(6, 182, 212, 0.5)',
                    outline: 'none',
                  }
                )}
                onFocus={(e) => {
                  e.currentTarget.style.borderBottomColor = 'rgba(6, 182, 212, 1)';
                }}
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span 
                style={composeStyles(
                  typography.weight('semibold'),
                  spacing.mt(0.5),
                  {
                    fontSize: '1.125rem',
                    color: 'rgb(241, 245, 249)',
                    cursor: 'text',
                    wordBreak: 'break-word',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }
                )}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsRenaming(true);
                }}
              >
                {track.trackName}
              </span>
            )}

            {/* Context mode */}
            <span style={composeStyles(
              typography.transform('uppercase'),
              typography.tracking.widest,
              spacing.mt(0.5),
              {
                fontSize: '11px',
                color: 'rgba(230, 240, 255, 0.5)',
                whiteSpace: 'nowrap',
              }
            )}>
              {uiState.context?.toUpperCase() ?? 'PLAYBACK'}
            </span>
          </div>

          {/* Right: Primary controls - Mute, Solo, Arm, Collapse */}
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1.5),
            { flexShrink: 0 }
          )}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleMute?.(track.id);
              }}
              style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                effects.border.radius.lg,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '28px',
                  height: '28px',
                  border: isMuted ? '1px solid rgba(248, 113, 113, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isMuted ? 'rgb(254, 202, 202)' : 'rgba(230, 240, 255, 0.6)',
                  boxShadow: isMuted ? '0 0 12px rgba(248,113,113,0.3)' : 'none',
                  flexShrink: 0,
                }
              )}
              onMouseEnter={(e) => {
                if (!isMuted) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMuted) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              title={isMuted ? 'Unmute track' : 'Mute track'}
            >
              <MuteIcon style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSolo?.(track.id);
              }}
              style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                effects.border.radius.lg,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '28px',
                  height: '28px',
                  border: isSoloed ? '1px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isSoloed ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isSoloed ? 'rgb(254, 240, 138)' : 'rgba(230, 240, 255, 0.6)',
                  boxShadow: isSoloed ? '0 0 12px rgba(250,204,21,0.3)' : 'none',
                  flexShrink: 0,
                }
              )}
              onMouseEnter={(e) => {
                if (!isSoloed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSoloed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              title={isSoloed ? 'Unsolo track' : 'Solo track'}
            >
              <SoloIcon style={{ width: '14px', height: '14px' }} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleArm?.(track.id);
              }}
              className={`button-mixx ${isArmed ? 'primary' : 'icon'}`}
              style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                effects.border.radius.lg,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '28px',
                  height: '28px',
                  border: isArmed ? '1px solid rgba(236, 72, 153, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isArmed ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isArmed ? 'rgb(251, 207, 232)' : 'rgba(230, 240, 255, 0.6)',
                  boxShadow: isArmed ? '0 0 12px rgba(236,72,153,0.3)' : 'none',
                  flexShrink: 0,
                }
              )}
              onMouseEnter={(e) => {
                if (!isArmed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isArmed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                }
              }}
              title={isArmed ? 'Disarm track' : 'Arm track for recording'}
            >
              <ArmIcon style={{ width: '14px', height: '14px' }} />
            </button>
            {onToggleCollapse && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse?.(track.id);
                }}
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.lg,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    width: '28px',
                    height: '28px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(230, 240, 255, 0.5)',
                    flexShrink: 0,
                  }
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.7)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.5)';
                }}
                title={collapsed ? 'Expand track' : 'Collapse track'}
              >
                <CollapseIcon style={{ width: '12px', height: '12px' }} collapsed={collapsed} />
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Secondary controls on left, Volume/Pan on right */}
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.between,
          spacing.gap(3),
          spacing.mt(0.5),
          layout.width.full
        )}>
          {/* Left: Secondary controls */}
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1.5),
            { flexShrink: 0 }
          )}>
            {showInputMonitoring && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleInputMonitor?.(track.id);
                }}
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    width: '24px',
                    height: '24px',
                    border: settings.inputMonitoring ? '1px solid rgba(96, 165, 250, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: settings.inputMonitoring ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.03)',
                    color: settings.inputMonitoring ? 'rgb(191, 219, 254)' : 'rgba(230, 240, 255, 0.5)',
                    flexShrink: 0,
                  }
                )}
                onMouseEnter={(e) => {
                  if (!settings.inputMonitoring) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(230, 240, 255, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!settings.inputMonitoring) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'rgba(230, 240, 255, 0.5)';
                  }
                }}
                title={settings.inputMonitoring ? 'Disable input monitoring' : 'Enable input monitoring'}
              >
                <InputMonitorIcon style={{ width: '12px', height: '12px' }} />
              </button>
            )}
            {showPhaseInvert && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePhaseInvert?.(track.id);
                }}
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  {
                    width: '24px',
                    height: '24px',
                    border: settings.phaseInvert ? '1px solid rgba(251, 146, 60, 0.5)' : '1px solid rgba(255,255,255,0.08)',
                    background: settings.phaseInvert ? 'rgba(249, 115, 22, 0.25)' : 'rgba(255,255,255,0.03)',
                    color: settings.phaseInvert ? 'rgb(254, 215, 170)' : 'rgba(230, 240, 255, 0.5)',
                    flexShrink: 0,
                  }
                )}
                onMouseEnter={(e) => {
                  if (!settings.phaseInvert) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.color = 'rgba(230, 240, 255, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!settings.phaseInvert) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.color = 'rgba(230, 240, 255, 0.5)';
                  }
                }}
                title={settings.phaseInvert ? 'Phase normal' : 'Phase invert (180°)'}
              >
                <PhaseInvertIcon style={{ width: '12px', height: '12px' }} />
              </button>
            )}
            {insertCount > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Could open insert browser
                }}
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  typography.weight('semibold'),
                  {
                    width: '24px',
                    height: '24px',
                    border: '1px solid rgba(139, 92, 246, 0.35)',
                    background: 'rgba(139, 92, 246, 0.15)',
                    color: 'rgb(196, 181, 253)',
                    fontSize: '9px',
                    flexShrink: 0,
                  }
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.15)';
                }}
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
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.md,
                  transitions.transition.standard('all', 200, 'ease-out'),
                  typography.weight('semibold'),
                  {
                    width: '24px',
                    height: '24px',
                    border: '1px solid rgba(6, 182, 212, 0.35)',
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: 'rgb(103, 232, 249)',
                    fontSize: '9px',
                    flexShrink: 0,
                  }
                )}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(6, 182, 212, 0.15)';
                }}
                title={`${sendCount} send${sendCount > 1 ? 's' : ''} active`}
              >
                {sendCount}
              </button>
            )}
          </div>

          {/* Right: Volume & Pan display */}
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(2),
            { flexShrink: 0 }
          )}>
            <div style={composeStyles(
              layout.flex.container('col'),
              layout.flex.align.end,
              spacing.gap(1)
            )}>
              <div
                style={composeStyles(
                  layout.overflow.hidden,
                  effects.border.radius.full,
                  {
                    height: '6px',
                    width: '80px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                  }
                )}
                title={pan === 0 ? 'Volume Center' : `Volume ${pan > 0 ? 'Right' : 'Left'}`}
              >
                <div
                  style={composeStyles(
                    layout.height.full,
                    effects.border.radius.full,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      background: 'linear-gradient(to right, rgba(6, 182, 212, 1), rgba(59, 130, 246, 1), rgba(139, 92, 246, 1))',
                      width: `${Math.round(volume * 100)}%`,
                    }
                  )}
                />
              </div>
              <div
                style={composeStyles(
                  layout.flex.container('row'),
                  layout.flex.align.center,
                  layout.flex.justify.center,
                  effects.border.radius.md,
                  {
                    height: '20px',
                    width: '80px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'rgba(255,255,255,0.05)',
                    fontSize: '10px',
                    color: 'rgba(230, 240, 255, 0.6)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                  }
                )}
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
        <div style={composeStyles(
          spacing.mt(3),
          layout.flex.container('row'),
          layout.flex.wrap.wrap,
          spacing.gap(2)
        )}>
          {statusChips.map((chip) => (
            <span
              key={chip.label}
              style={composeStyles(
                effects.border.radius.full,
                spacing.px(3),
                spacing.py(1),
                typography.transform('uppercase'),
                typography.tracking.widest,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  fontSize: '10px',
                  color: 'rgba(230, 240, 255, 0.7)',
                  backdropFilter: 'blur(4px)',
                  background: hexToRgba(chip.accent, 0.18),
                  border: `1px solid ${hexToRgba(chip.accent, 0.45)}`,
                  boxShadow: `0 0 14px ${hexToRgba(chip.accent, 0.35)}`,
                }
              )}
              title={chip.description}
            >
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {/* Divider if no chips */}
      {statusChips.length === 0 && (
        <div style={composeStyles(
          spacing.mt(4),
          effects.border.radius.full,
          layout.width.full,
          {
            height: '1px',
            background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent)',
          }
        )} />
      )}

      {/* Record input level meter (for recording tracks) */}
      {recordInputLevel !== undefined && recordInputLevel > 0 && (
        <div style={composeStyles(
          spacing.mt(2),
          layout.overflow.hidden,
          effects.border.radius.full,
          layout.width.full,
          {
            height: '4px',
            background: 'rgba(255,255,255,0.05)',
          }
        )}>
          <div
            style={composeStyles(
              layout.height.full,
              effects.border.radius.full,
              transitions.transition.standard('all', 100, 'ease-out'),
              {
                background: 'linear-gradient(to right, rgba(34, 197, 94, 1), rgba(239, 68, 68, 1))',
                width: `${Math.min(100, recordInputLevel * 100)}%`,
              }
            )}
          />
        </div>
      )}
    </div>
  );
};

export default ProfessionalTrackHeader;

