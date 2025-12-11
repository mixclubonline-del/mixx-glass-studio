/**
 * FLOW CONSOLE MATRIX VIEW
 * 
 * Routing matrix visualization showing all tracks → buses.
 * Flow Doctrine: Visual routing, no numbers, color/energy communication.
 */

import React, { useMemo } from 'react';
import { useFlowMotion, usePulseAnimation } from '../mixxglass';
import type { TrackData, MixerBusId } from '../../App';
import { hexToRgba } from '../../utils/ALS';
import type { TrackALSFeedback } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

// Component for pulsing level indicator
const PulsingLevelIndicator: React.FC<{
  busColor: string;
  busGlow: string;
  level: number;
}> = ({ busColor, busGlow, level }) => {
  const pulseOpacity = usePulseAnimation({
    duration: 2000,
    minOpacity: 0.4 + level * 0.4,
    maxOpacity: 0.5 + level * 0.5,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        effects.border.radius.lg,
        {
          background: `linear-gradient(135deg, ${hexToRgba(busColor, level * 0.5)}, ${hexToRgba(busGlow, level * 0.3)})`,
          opacity: pulseOpacity.opacity,
          boxShadow: `0 0 ${12 * level}px ${hexToRgba(busGlow, level * 0.5)}`,
        }
      )}
    />
  );
};

// Matrix Row Component - uses hook at component level
const MatrixRow: React.FC<{
  row: {
    trackId: string;
    trackName: string;
    trackColor: string;
    trackGlow: string;
    intensity: number;
    pulse: number;
    sends: Array<{
      busId: string;
      level: number;
      busColor: string;
      busGlow: string;
    }>;
  };
  rowIndex: number;
  selectedBusId?: MixerBusId | null;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
}> = ({ row, rowIndex, selectedBusId, onSendLevelChange }) => {
  // Hook is now called at component level, not in callback
  const rowStyle = useFlowMotion(
    { opacity: 1, x: 0 },
    { duration: 300, delay: rowIndex * 20, easing: 'ease-out' }
  );

  return (
    <div
      style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        spacing.gap(2),
        {
          opacity: rowStyle.opacity,
          transform: `translateX(${rowStyle.x}px)`,
        }
      )}
    >
      {/* Track Name */}
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        spacing.gap(2),
        { width: '128px', flexShrink: 0 }
      )}>
        <div
          style={composeStyles(
            effects.border.radius.full,
            {
              width: '4px',
              height: '32px',
              background: `linear-gradient(180deg, ${hexToRgba(row.trackColor, 0.8)}, ${hexToRgba(row.trackGlow, 0.6)})`,
              boxShadow: `0 0 12px ${hexToRgba(row.trackGlow, 0.4 * row.intensity)}`,
              opacity: 0.6 + row.intensity * 0.4,
            }
          )}
        />
        <div style={composeStyles(
          layout.flex.container('col'),
          { flex: 1 }
        )}>
          <span style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.5rem',
              color: 'rgba(230, 240, 255, 0.85)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }
          )}>
            {row.trackName}
          </span>
          <span style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.42rem',
              color: 'rgba(230, 240, 255, 0.5)',
            }
          )}>
            {Math.round(row.intensity * 100)}%
          </span>
        </div>
      </div>

      {/* Send Cells */}
      {row.sends.map((send) => {
        const isSelected = selectedBusId === send.busId;
        const hasSignal = send.level > 0.01;

        return (
          <div
            key={send.busId}
            style={composeStyles(
              { flex: 1 },
              layout.flex.container('row'),
              layout.flex.align.center,
              layout.flex.justify.center
            )}
          >
            <div
              onClick={(e) => {
                e.stopPropagation();
                onSendLevelChange?.(row.trackId, send.busId, send.level > 0.5 ? 0 : 0.75);
              }}
              style={composeStyles(
                layout.position.relative,
                layout.flex.container('row'),
                layout.flex.align.center,
                layout.flex.justify.center,
                layout.width.full,
                effects.border.radius.lg,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  height: '40px',
                  border: isSelected
                    ? '1px solid rgba(103, 232, 249, 0.5)'
                    : '1px solid rgba(102, 140, 198, 0.4)',
                  background: hasSignal
                    ? 'rgba(6,14,28,0.6)'
                    : 'rgba(4,10,20,0.4)',
                  cursor: 'pointer',
                }
              )}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = hasSignal
                  ? 'rgba(8,18,34,0.8)'
                  : 'rgba(6,14,28,0.6)';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = hasSignal
                  ? 'rgba(6,14,28,0.6)'
                  : 'rgba(4,10,20,0.4)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.95)';
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              {/* Level Indicator */}
              {hasSignal && (
                <PulsingLevelIndicator
                  busColor={send.busColor}
                  busGlow={send.busGlow}
                  level={send.level}
                />
              )}

              {/* Level Bar */}
              {hasSignal && (
                <div style={composeStyles(
                  layout.position.relative,
                  layout.overflow.hidden,
                  effects.border.radius.full,
                  {
                    height: '6px',
                    width: '75%',
                    background: 'rgba(0,0,0,0.4)',
                  }
                )}>
                  <div
                    style={composeStyles(
                      layout.height.full,
                      effects.border.radius.full,
                      {
                        background: `linear-gradient(90deg, ${hexToRgba(send.busColor, 0.9)}, ${hexToRgba(send.busGlow, 0.6)})`,
                        width: `${send.level * 100}%`,
                        boxShadow: `0 0 8px ${hexToRgba(send.busGlow, 0.6)}`,
                      }
                    )}
                  />
                </div>
              )}

              {/* Energy Pulse */}
              {hasSignal && row.pulse > 0.3 && (
                <PulsingEnergyIndicator busGlow={send.busGlow} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Component for pulsing energy indicator
const PulsingEnergyIndicator: React.FC<{
  busGlow: string;
}> = ({ busGlow }) => {
  const pulseScale = usePulseAnimation({
    duration: 1000,
    minScale: 1,
    maxScale: 1.1,
    easing: 'ease-in-out',
  });
  const pulseOpacity = usePulseAnimation({
    duration: 1000,
    minOpacity: 0.3,
    maxOpacity: 0.6,
    easing: 'ease-in-out',
  });
  return (
    <div
      style={composeStyles(
        layout.position.absolute,
        { inset: 0 },
        effects.border.radius.lg,
        {
          background: `radial-gradient(circle at center, ${hexToRgba(busGlow, 0.3)}, transparent)`,
          transform: `scale(${pulseScale.scale})`,
          opacity: pulseOpacity.opacity,
        }
      )}
    />
  );
};

interface FlowConsoleMatrixViewProps {
  tracks: TrackData[];
  buses: Array<{
    id: MixerBusId;
    name: string;
    color: string;
    glow: string;
  }>;
  trackSendLevels: Record<string, Record<string, number>>;
  trackFeedbackMap: Record<string, TrackALSFeedback>;
  onSendLevelChange?: (trackId: string, busId: string, value: number) => void;
  selectedBusId?: MixerBusId | null;
  onSelectBus?: (busId: MixerBusId) => void;
}

export const FlowConsoleMatrixView: React.FC<FlowConsoleMatrixViewProps> = ({
  tracks,
  buses,
  trackSendLevels,
  trackFeedbackMap,
  onSendLevelChange,
  selectedBusId,
  onSelectBus,
}) => {
  const matrixData = useMemo(() => {
    return tracks.map((track) => {
      const feedback = trackFeedbackMap[track.id];
      const { base, glow } = TRACK_COLOR_SWATCH[track.trackColor];
      const sends = buses.map((bus) => ({
        busId: bus.id,
        level: trackSendLevels[track.id]?.[bus.id] ?? 0,
        busColor: bus.color,
        busGlow: bus.glow,
      }));

      return {
        trackId: track.id,
        trackName: track.trackName,
        trackColor: base,
        trackGlow: glow,
        intensity: feedback?.intensity ?? 0,
        pulse: feedback?.pulse ?? 0,
        sends,
      };
    });
  }, [tracks, buses, trackSendLevels, trackFeedbackMap]);

  return (
    <div style={composeStyles(
      layout.flex.container('col'),
      { height: '100%' },
      spacing.gap(4),
      layout.overflow.auto,
      spacing.px(6),
      spacing.py(4)
    )}>
      {/* Header */}
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        effects.border.bottom(),
        spacing.pb(3),
        {
          borderBottom: '1px solid rgba(102, 140, 198, 0.6)',
        }
      )}>
        <div>
          <h3 style={composeStyles(
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.65rem',
              color: '#e6f0ff',
            }
          )}>
            Routing Matrix
          </h3>
          <p style={composeStyles(
            spacing.mt(1),
            typography.transform('uppercase'),
            typography.tracking.widest,
            {
              fontSize: '0.42rem',
              color: 'rgba(230, 240, 255, 0.5)',
            }
          )}>
            Track → Bus routing visualization
          </p>
        </div>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(2),
          typography.transform('uppercase'),
          typography.tracking.widest,
          {
            fontSize: '0.42rem',
            color: 'rgba(230, 240, 255, 0.55)',
          }
        )}>
          <span>Active</span>
          <span style={composeStyles(
            spacing.px(2),
            spacing.py(0.5),
            effects.border.radius.full,
            {
              background: 'rgba(16, 185, 129, 0.3)',
              color: 'rgba(110, 231, 183, 1)',
            }
          )}>
            {matrixData.filter((row) => row.sends.some((s) => s.level > 0.01)).length}
          </span>
        </div>
      </div>

      {/* Matrix Grid */}
      <div style={composeStyles(
        { flex: 1 },
        layout.overflow.auto
      )}>
        <div style={composeStyles(
          { display: 'inline-block' },
          { minWidth: '100%' }
        )}>
          {/* Column Headers (Buses) */}
          <div style={composeStyles(
            layout.position.sticky,
            { top: 0, zIndex: 10 },
            spacing.mb(2),
            layout.flex.container('row'),
            spacing.gap(2),
            effects.border.bottom(),
            spacing.pb(2),
            {
              borderBottom: '1px solid rgba(102, 140, 198, 0.4)',
            }
          )}>
            <div style={{ width: '128px', flexShrink: 0 }} /> {/* Track name column */}
            {buses.map((bus) => {
              const isSelected = selectedBusId === bus.id;
              return (
                <button
                  key={bus.id}
                  onClick={() => onSelectBus?.(bus.id)}
                  style={composeStyles(
                    { flex: 1 },
                    layout.flex.container('col'),
                    layout.flex.align.center,
                    spacing.gap(1),
                    spacing.px(3),
                    spacing.py(2),
                    effects.border.radius.xl,
                    transitions.transition.standard('all', 200, 'ease-out'),
                    {
                      border: isSelected
                        ? '1px solid rgba(103, 232, 249, 0.7)'
                        : '1px solid rgba(102, 140, 198, 0.6)',
                      background: isSelected
                        ? 'rgba(16,50,95,0.7)'
                        : 'rgba(6,14,28,0.5)',
                      boxShadow: isSelected
                        ? '0 0 12px rgba(56,189,248,0.3)'
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
                  <span
                    style={composeStyles(
                      typography.transform('uppercase'),
                      typography.tracking.widest,
                      {
                        fontSize: '0.5rem',
                        color: isSelected ? 'rgba(125, 211, 252, 1)' : 'rgba(255, 255, 255, 0.7)',
                      }
                    )}
                  >
                    {bus.name}
                  </span>
                  <div
                    style={composeStyles(
                      layout.width.full,
                      effects.border.radius.full,
                      {
                        height: '4px',
                        background: `linear-gradient(90deg, ${hexToRgba(bus.color, 0.6)}, ${hexToRgba(bus.glow, 0.4)})`,
                        boxShadow: `0 0 8px ${hexToRgba(bus.glow, 0.3)}`,
                      }
                    )}
                  />
                </button>
              );
            })}
          </div>

          {/* Rows (Tracks) */}
          <div style={composeStyles(
            layout.flex.container('col'),
            spacing.gap(2)
          )}>
            {matrixData.map((row, rowIndex) => (
              <MatrixRow 
                key={row.trackId} 
                row={row} 
                rowIndex={rowIndex}
                selectedBusId={selectedBusId}
                onSendLevelChange={onSendLevelChange}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowConsoleMatrixView;




