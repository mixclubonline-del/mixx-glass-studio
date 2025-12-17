
import React, { useMemo } from 'react';
import { TrackData, MixerSettings } from '../App';
import { hexToRgba } from '../utils/ALS';
import { TrackUIState } from '../types/tracks';
import { MuteIcon, SoloIcon, ArmIcon } from './icons';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../design-system';

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
    <div
      role="button"
      tabIndex={0}
      style={composeStyles(
        layout.position.relative,
        layout.flex.container('col'),
        layout.flex.justify.between,
        layout.overflow.hidden,
        spacing.p(3),
        effects.border.bottom(),
        transitions.transition.standard('all', 200, 'ease-out'),
        {
          height: '100%',
          width: '100%',
          textAlign: 'left',
          cursor: 'pointer',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          outline: 'none',
          ...rootStyle,
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
      onMouseEnter={(e) => {
        const glowEl = e.currentTarget.querySelector('[data-hover-glow]') as HTMLElement;
        if (glowEl) glowEl.style.opacity = '1';
      }}
      onMouseLeave={(e) => {
        const glowEl = e.currentTarget.querySelector('[data-hover-glow]') as HTMLElement;
        if (glowEl) glowEl.style.opacity = '0';
      }}
    >
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
              background: `radial-gradient(circle at 12% 18%, ${hexToRgba(glowColor, 0.22)}, transparent 65%)`,
              filter: 'blur(28px)',
            }
          )}
        />
      </div>
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.start,
        layout.flex.justify.between
      )}>
        <div style={composeStyles(
          layout.flex.container('col')
        )}>
          <span style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.75rem',
              color: 'rgba(230, 240, 255, 0.6)',
            }
          )}>
            {track.group?.toUpperCase() ?? 'FLOW LANES'}
          </span>
          <span style={composeStyles(
            typography.weight('semibold'),
            spacing.mt(1),
            {
              fontSize: '1.125rem',
              color: 'rgb(241, 245, 249)',
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }
          )}>{track.trackName}</span>
          <span style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '11px',
              color: 'rgba(230, 240, 255, 0.5)',
            }
          )}>
            {uiState.context?.toUpperCase() ?? 'PLAYBACK'}
          </span>
        </div>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2)
        )}>
          {/* Mute/Solo/Arm Controls */}
          <div style={composeStyles(
            layout.flex.container('row'),
            layout.flex.align.center,
            spacing.gap(1)
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
                effects.border.radius.full,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '32px',
                  height: '32px',
                  border: isMuted ? '1px solid rgba(248, 113, 113, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isMuted ? 'rgba(239, 68, 68, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isMuted ? 'rgb(254, 202, 202)' : 'rgba(230, 240, 255, 0.6)',
                }
              )}
              onMouseEnter={(e) => {
                if (!isMuted) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMuted) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
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
                effects.border.radius.full,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '32px',
                  height: '32px',
                  border: isSoloed ? '1px solid rgba(250, 204, 21, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isSoloed ? 'rgba(234, 179, 8, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isSoloed ? 'rgb(254, 240, 138)' : 'rgba(230, 240, 255, 0.6)',
                }
              )}
              onMouseEnter={(e) => {
                if (!isSoloed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSoloed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
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
              style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                effects.border.radius.full,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '32px',
                  height: '32px',
                  border: isArmed ? '1px solid rgba(236, 72, 153, 0.6)' : '1px solid rgba(255,255,255,0.1)',
                  background: isArmed ? 'rgba(236, 72, 153, 0.3)' : 'rgba(255,255,255,0.05)',
                  color: isArmed ? 'rgb(251, 207, 232)' : 'rgba(230, 240, 255, 0.6)',
                }
              )}
              onMouseEnter={(e) => {
                if (!isArmed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isArmed) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.color = 'rgba(230, 240, 255, 0.6)';
                }
              }}
              title={isArmed ? 'Disarm track' : 'Arm track for recording'}
            >
              <ArmIcon style={{ width: '14px', height: '14px' }} />
            </button>
          </div>
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
                  background: 'rgba(255,255,255,0.1)',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.2)',
                }
              )}
              title={volume >= 0.8 ? 'Volume Loud' : volume >= 0.5 ? 'Volume Normal' : volume >= 0.2 ? 'Volume Quiet' : 'Volume Silent'}
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
                effects.border.radius.full,
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
      {!statusChips.length && (
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
    </div>
  );
};

export default ArrangeTrackHeader;