/**
 * MixxGlass Meter Component
 * 
 * DAW-specific meter component with glass aesthetic and ALS integration.
 * Visualizes audio levels with color/temperature feedback (no raw numbers by default).
 */

import React from 'react';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { getGlassSurface } from '../utils/glassStyles';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { valueToTemperature, valueToEnergy } from '../utils/alsHelpers';
import { layout, effects, transitions, spacing, typography, composeStyles } from '../../../design-system';

export interface MixxGlassMeterProps {
  level: number; // 0-1
  peak?: number; // 0-1
  transient?: boolean;
  alsChannel?: ALSChannel;
  color?: string;
  glowColor?: string;
  width?: number;
  height?: number;
  orientation?: 'vertical' | 'horizontal';
  /** Show numeric values (default: false - shows temperature/energy) */
  showNumbers?: boolean;
}

/**
 * MixxGlass Meter
 * 
 * Audio level meter with glass aesthetic and ALS integration.
 * Shows temperature/energy by default (no raw numbers).
 */
export const MixxGlassMeter: React.FC<MixxGlassMeterProps> = ({
  level,
  peak,
  transient = false,
  alsChannel = 'pressure',
  color,
  glowColor,
  width = 8,
  height = 100,
  orientation = 'vertical',
  showNumbers = false,
}) => {
  // Clamp values
  const clampedLevel = Math.max(0, Math.min(1, level));
  const clampedPeak = peak !== undefined ? Math.max(0, Math.min(1, peak)) : clampedLevel;

  // ALS feedback
  const alsFeedback = useALSFeedback({
    channel: alsChannel,
    value: clampedLevel,
    enabled: true,
  });

  // Temperature/energy representation
  const temperature = valueToTemperature(clampedLevel);
  const energy = valueToEnergy(clampedLevel);

  // Animated level using useFlowMotion
  const animatedLevel = useFlowMotion(
    { level: clampedLevel },
    { duration: 50, easing: 'ease-out' }
  );

  const animatedPeak = useFlowMotion(
    { peak: clampedPeak },
    { duration: 100, easing: 'ease-out' }
  );

  // Glass surface
  const glassSurface = getGlassSurface({
    intensity: 'soft',
    border: true,
    glow: alsFeedback?.pulse ?? false,
    glowColor: alsFeedback?.glowColor || glowColor || color,
  });

  const meterStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.relative,
    layout.overflow.hidden,
    effects.border.radius.md,
    {
      width: orientation === 'vertical' ? `${width}px` : `${width}px`,
      height: orientation === 'vertical' ? `${height}px` : `${height}px`,
    }
  );

  // Level fill
  const fillStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    transitions.transition.standard(orientation === 'vertical' ? 'height' : 'width', 50, 'ease-out'),
    {
      ...(orientation === 'vertical'
        ? {
            bottom: 0,
            left: 0,
            right: 0,
            height: `${animatedLevel.level * 100}%`,
          }
        : {
            left: 0,
            top: 0,
            bottom: 0,
            width: `${animatedLevel.level * 100}%`,
          }),
      background: color
        ? `linear-gradient(${orientation === 'vertical' ? '180deg' : '90deg'}, ${color}80, ${glowColor || color}40)`
        : `linear-gradient(${orientation === 'vertical' ? '180deg' : '90deg'}, ${alsFeedback?.color || temperature.color}80, ${alsFeedback?.glowColor || temperature.color}40)`,
      boxShadow: `0 0 ${8 + (alsFeedback?.intensity || 0) * 12}px ${alsFeedback?.glowColor || temperature.color}50`,
    }
  );

  // Peak indicator
  const peakStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    {
      ...(orientation === 'vertical'
        ? {
            bottom: `${animatedPeak.peak * 100}%`,
            left: 0,
            right: 0,
            height: '2px',
          }
        : {
            left: `${animatedPeak.peak * 100}%`,
            top: 0,
            bottom: 0,
            width: '2px',
          }),
      background: alsFeedback?.color || temperature.color,
      boxShadow: `0 0 4px ${alsFeedback?.glowColor || temperature.color}`,
      opacity: transient ? 1 : 0.7,
    }
  );

  return (
    <div style={meterStyle}>
      {/* Level fill */}
      <div style={fillStyle} />

      {/* Peak indicator */}
      <div style={peakStyle} />

      {/* Transient flash */}
      {transient && (
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            {
              pointerEvents: 'none',
              background: `radial-gradient(circle, ${alsFeedback?.glowColor || temperature.color}60, transparent)`,
              opacity: 0.6,
              animation: 'flash 0.3s ease-out',
            }
          )}
        />
      )}

      {/* ALS pulse overlay */}
      {alsFeedback?.pulse && (
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            {
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% ${orientation === 'vertical' ? '20%' : '50%'}, ${alsFeedback.glowColor} 0%, transparent 60%)`,
              opacity: 0.15,
              animation: 'pulse 2s ease-in-out infinite',
            }
          )}
        />
      )}

      {/* Value display (optional) */}
      {showNumbers && (
        <div
          style={composeStyles(
            layout.position.absolute,
            spacing.mt(1),
            spacing.ml(1),
            typography.size('xs'),
            { fontFamily: 'monospace', color: temperature.color, textShadow: `0 0 4px ${alsFeedback?.glowColor || temperature.color}` }
          )}
        >
          {(clampedLevel * 100).toFixed(0)}%
        </div>
      )}
    </div>
  );
};

export default MixxGlassMeter;


