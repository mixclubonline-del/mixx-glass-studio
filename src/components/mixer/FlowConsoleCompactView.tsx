/**
 * FLOW CONSOLE COMPACT VIEW
 * 
 * Condensed channel strips for overview and quick adjustments.
 * Flow Doctrine: Maximum information density, minimal pixels.
 */

import React from 'react';
import { usePulseAnimation } from '../mixxglass';
import type { TrackData, MixerSettings, TrackAnalysisData } from '../../App';
import type { TrackALSFeedback } from '../../utils/ALS';
import { hexToRgba } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

interface FlowConsoleCompactViewProps {
  tracks: TrackData[];
  mixerSettings: Record<string, MixerSettings>;
  trackAnalysis: Record<string, TrackAnalysisData>;
  trackFeedbackMap: Record<string, TrackALSFeedback>;
  selectedTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  onMixerChange: (
    trackId: string,
    setting: keyof MixerSettings,
    value: number | boolean
  ) => void;
  soloedTracks: Set<string>;
  onToggleSolo: (trackId: string) => void;
}

export const FlowConsoleCompactView: React.FC<FlowConsoleCompactViewProps> = ({
  tracks,
  mixerSettings,
  trackAnalysis,
  trackFeedbackMap,
  selectedTrackId,
  onSelectTrack,
  onMixerChange,
  soloedTracks,
  onToggleSolo,
}) => {
  return (
    <div style={composeStyles(
      layout.flex.container('row'),
      layout.flex.wrap.wrap,
      { height: '100%' },
      spacing.gap(2),
      layout.overflow.auto,
      spacing.px(4),
      spacing.py(4)
    )}>
      {tracks.map((track) => {
        const analysis = trackAnalysis[track.id] ?? { level: 0, transient: false };
        const settings = mixerSettings[track.id] ?? { volume: 0.75, pan: 0, isMuted: false };
        const feedback = trackFeedbackMap[track.id];
        const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
        const isSelected = selectedTrackId === track.id;
        const isSoloed = soloedTracks.has(track.id);

        const intensity = feedback?.intensity ?? 0;
        const pulse = feedback?.pulse ?? 0;
        const temperature = feedback?.temperature ?? 'cold';

        return (
          <div
            key={track.id}
            onClick={() => onSelectTrack(track.id)}
            style={composeStyles(
              layout.position.relative,
              layout.flex.container('col'),
              spacing.gap(1.5),
              spacing.p(2),
              effects.border.radius.xl,
              transitions.transition.standard('all', 200, 'ease-out'),
              {
                width: '128px',
                border: isSelected
                  ? '1px solid rgba(103, 232, 249, 0.7)'
                  : '1px solid rgba(102, 140, 198, 0.6)',
                background: isSelected
                  ? 'rgba(16,50,95,0.6)'
                  : 'rgba(6,14,28,0.5)',
                boxShadow: isSelected
                  ? '0 0 16px rgba(56,189,248,0.4)'
                  : 'none',
                cursor: 'pointer',
              }
            )}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(102, 140, 198, 0.45)';
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.borderColor = 'rgba(102, 140, 198, 0.6)';
                e.currentTarget.style.transform = 'scale(1)';
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = isSelected ? 'scale(1.02)' : 'scale(1)';
            }}
          >
            {/* Track Name */}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between
            )}>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.45rem',
                  color: 'rgba(230, 240, 255, 0.85)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }
              )}>
                {track.trackName}
              </span>
              {isSoloed && (
                <div style={composeStyles(
                  effects.border.radius.full,
                  {
                    width: '6px',
                    height: '6px',
                    background: 'rgba(251, 191, 36, 1)',
                    boxShadow: '0 0 6px rgba(251,191,36,0.8)',
                  }
                )} />
              )}
            </div>

            {/* Meter */}
            <CompactMeter
              level={Math.min(1, analysis.level ?? intensity)}
              base={base}
              glow={glow}
              intensity={intensity}
              hasTransient={analysis.transient}
            />

            {/* Volume Fader (Mini) */}
            <div style={layout.position.relative}>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={settings.volume}
                onChange={(e) => {
                  e.stopPropagation();
                  onMixerChange(track.id, 'volume', parseFloat(e.target.value));
                }}
                style={composeStyles(
                  layout.width.full,
                  effects.border.radius.full,
                  {
                    height: '4px',
                    cursor: 'pointer',
                    appearance: 'none',
                    background: `linear-gradient(to right, ${hexToRgba(base, 0.6)} 0%, ${hexToRgba(base, 0.6)} ${settings.volume * 100}%, rgba(255,255,255,0.1) ${settings.volume * 100}%, rgba(255,255,255,0.1) 100%)`,
                  }
                )}
              />
            </div>

            {/* ALS Temperature Indicator */}
            <div style={composeStyles(
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.between
            )}>
              <div style={composeStyles(
                layout.flex.container('row'),
                layout.flex.align.center,
                spacing.gap(1)
              )}>
                <div
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      width: '6px',
                      height: '6px',
                      background: hexToRgba(glow, 0.8),
                      boxShadow: `0 0 6px ${hexToRgba(glow, 0.6)}`,
                      opacity: 0.5 + intensity * 0.5,
                    }
                  )}
                />
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.38rem',
                    color: 'rgba(230, 240, 255, 0.55)',
                  }
                )}>
                  {temperature}
                </span>
              </div>
              <span style={composeStyles(
                typography.transform('uppercase'),
                typography.tracking.widest,
                {
                  fontSize: '0.38rem',
                  color: 'rgba(230, 240, 255, 0.45)',
                }
              )}>
                {Math.round(settings.volume * 100)}%
              </span>
            </div>

            {/* Selection Indicator */}
            {isSelected && <PulsingSelectionIndicator />}
          </div>
        );
      })}
    </div>
  );
};

// Component for compact meter
const CompactMeter: React.FC<{
  level: number;
  base: string;
  glow: string;
  intensity: number;
  hasTransient: boolean;
}> = ({ level, base, glow, intensity, hasTransient }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 1500,
    minOpacity: 0.7,
    maxOpacity: 1,
    easing: 'ease-in-out',
  });
  const transientScale = usePulseAnimation({
    duration: 300,
    minScale: 1,
    maxScale: 1.2,
    easing: 'ease-in-out',
  });
  const transientOpacity = usePulseAnimation({
    duration: 300,
    minOpacity: 0.6,
    maxOpacity: 0.9,
    easing: 'ease-in-out',
  });
  
  return (
    <div style={composeStyles(
      layout.position.relative,
      layout.width.full,
      layout.overflow.hidden,
      effects.border.radius.default,
      {
        height: '32px',
        border: '1px solid rgba(102, 140, 198, 0.4)',
        background: 'rgba(4,8,18,0.8)',
      }
    )}>
      <div
        style={composeStyles(
          layout.position.absolute,
          { bottom: 0, left: 0 },
          layout.width.full,
          {
            height: `${level * 100}%`,
            background: `linear-gradient(180deg, ${hexToRgba(base, 0.8)}, ${hexToRgba(glow, 0.6)})`,
            boxShadow: `0 0 12px ${hexToRgba(glow, 0.5 * intensity)}`,
            opacity: pulseOpacity.opacity,
          }
        )}
      />
      {hasTransient && (
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            {
              background: `radial-gradient(circle at center, ${hexToRgba(glow, 0.6)}, transparent)`,
              transform: `scale(${transientScale.scale})`,
              opacity: transientOpacity.opacity,
            }
          )}
        />
      )}
    </div>
  );
};

// Component for pulsing selection indicator
const PulsingSelectionIndicator: React.FC = () => {
  const pulseGlow = usePulseAnimation({
    duration: 2000,
    minOpacity: 0.3,
    maxOpacity: 0.5,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        effects.border.radius.xl,
        {
          border: '2px solid rgba(103, 232, 249, 0.6)',
          boxShadow: `0 0 ${8 + pulseGlow.opacity * 8}px rgba(125, 211, 252, ${0.3 + pulseGlow.opacity * 0.2})`,
        }
      )}
    />
  );
};

export default FlowConsoleCompactView;










