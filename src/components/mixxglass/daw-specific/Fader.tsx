/**
 * MixxGlass Fader Component
 * 
 * DAW-specific fader component with glass aesthetic and ALS integration.
 * Replaces FlowFader (which uses Framer Motion).
 * 
 * Professional fader with:
 * - Glass aesthetic
 * - ALS feedback integration
 * - Keyboard control
 * - Optional dB display (for professional workflows)
 * - Smooth animations (using useFlowMotion instead of Framer Motion)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { getGlassSurface } from '../utils/glassStyles';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { valueToTemperature } from '../utils/alsHelpers';
import { layout, effects, transitions, spacing, typography, composeStyles } from '../../../design-system';

export interface MixxGlassFaderProps {
  value: number; // 0-1.2 (allows +2dB headroom)
  onChange: (value: number) => void;
  alsChannel?: ALSChannel;
  alsIntensity?: number;
  trackColor?: string;
  glowColor?: string;
  name?: string;
  height?: number;
  /** Show dB bubble on drag (professional mode) */
  showDB?: boolean;
  /** Show temperature/energy instead of dB (Flow mode) */
  showTemperature?: boolean;
  disabled?: boolean;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

/**
 * MixxGlass Fader
 * 
 * Professional fader with glass aesthetic and ALS integration.
 * Uses useFlowMotion instead of Framer Motion.
 */
export const MixxGlassFader: React.FC<MixxGlassFaderProps> = ({
  value,
  onChange,
  alsChannel = 'momentum',
  alsIntensity,
  trackColor,
  glowColor,
  name = 'fader',
  height = 200,
  showDB = true,
  showTemperature = false,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showValueBubble, setShowValueBubble] = useState(false);

  // ALS feedback
  const normalizedValue = clamp(value / 1.2, 0, 1);
  const alsFeedback = useALSFeedback({
    channel: alsChannel,
    value: alsIntensity ?? normalizedValue,
    enabled: true,
  });

  // Temperature representation (no raw numbers)
  const temperature = valueToTemperature(normalizedValue);

  // Animated position using useFlowMotion
  const sliderRatio = clamp(value / 1.2, 0, 1);
  const animatedPosition = useFlowMotion(
    { position: sliderRatio },
    { duration: 150, easing: 'ease-out' }
  );

  const handlePointerValue = useCallback(
    (clientY: number) => {
      if (!containerRef.current || disabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relative = 1 - (clientY - rect.top) / rect.height;
      const scaled = clamp(relative * 1.2, 0, 1.2);
      onChange(Number(scaled.toFixed(3)));
    },
    [onChange, disabled]
  );

  const valueToDB = (v: number) =>
    v === 0 ? '-∞' : `${(20 * Math.log10(v)).toFixed(1)} dB`;

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      if (showDB || showTemperature) {
        setShowValueBubble(true);
      }
      handlePointerValue(event.clientY);
    },
    [handlePointerValue, showDB, showTemperature, disabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      handlePointerValue(event.clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      if (showDB || showTemperature) {
        setTimeout(() => setShowValueBubble(false), 400);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerValue, isDragging, showDB, showTemperature]);

  // Keyboard control
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      let delta = 0;
      if (e.key === 'ArrowUp') delta = 0.005;
      if (e.key === 'ArrowDown') delta = -0.005;
      if (e.shiftKey) delta *= 0.25; // Fine control
      if (e.altKey) delta *= 6; // Coarse control
      if (delta !== 0) {
        e.preventDefault();
        onChange(clamp(value + delta, 0, 1.2));
        if (showDB || showTemperature) {
          setShowValueBubble(true);
          setTimeout(() => setShowValueBubble(false), 600);
        }
      }
    },
    [value, onChange, showDB, showTemperature, disabled]
  );

  // Glass surface styling
  const glassSurface = getGlassSurface({
    intensity: 'soft',
    border: true,
    glow: alsFeedback?.pulse ?? false,
    glowColor: alsFeedback?.glowColor || glowColor || trackColor,
  });

  // Fader track style
  const trackStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.relative,
    layout.overflow.hidden,
    {
      height: `${height}px`,
      width: '24px',
      borderRadius: '12px',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }
  );

  // Fader fill (shows level)
  const fillHeight = animatedPosition.position * 100;
  const fillStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    {
      bottom: 0,
      left: 0,
      right: 0,
      height: `${fillHeight}%`,
      background: trackColor
        ? `linear-gradient(180deg, ${trackColor}80, ${glowColor || trackColor}40)`
        : `linear-gradient(180deg, ${alsFeedback?.color || temperature.color}80, ${alsFeedback?.glowColor || temperature.color}40)`,
      boxShadow: `0 0 ${10 + (alsFeedback?.intensity || 0) * 15}px ${alsFeedback?.glowColor || temperature.color}50`,
      borderRadius: '12px',
    },
    transitions.transition.standard('height', 150, 'ease-out')
  );

  // Fader cap (thumb)
  const capStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    effects.border.radius.full,
    transitions.transition.standard('all', 150, 'ease-out'),
    {
      left: '50%',
      bottom: `${fillHeight}%`,
      transform: 'translate(-50%, 50%)',
      width: '20px',
      height: '20px',
      background: trackColor
        ? `radial-gradient(circle, ${trackColor}, ${glowColor || trackColor}80)`
        : `radial-gradient(circle, ${alsFeedback?.color || temperature.color}, ${alsFeedback?.glowColor || temperature.color}80)`,
      border: '2px solid rgba(255, 255, 255, 0.4)',
      boxShadow: `0 0 ${8 + (alsFeedback?.intensity || 0) * 12}px ${alsFeedback?.glowColor || temperature.color}60, inset 0 0 0.5px rgba(255, 255, 255, 0.3)`,
      cursor: disabled ? 'not-allowed' : 'grab',
    }
  );

  // Value bubble style
  const bubbleStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    layout.zIndex[10],
    spacing.px(2),
    spacing.py(1),
    effects.border.radius.md,
    transitions.transition.opacity(200),
    {
      bottom: `${fillHeight}%`,
      left: '50%',
      transform: 'translate(-50%, -120%)',
      background: 'rgba(9, 18, 36, 0.95)',
      backdropFilter: 'blur(12px)',
      border: '1px solid rgba(102, 140, 198, 0.4)',
      color: '#e6f0ff',
      fontSize: '11px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      opacity: showValueBubble ? 1 : 0,
    }
  );

  return (
    <div
      ref={containerRef}
      style={trackStyle}
      onPointerDown={handlePointerDown}
      onKeyDown={handleKeyDown}
      tabIndex={disabled ? -1 : 0}
      role="slider"
      aria-label={name}
      aria-valuemin={0}
      aria-valuemax={1.2}
      aria-valuenow={value}
    >
      {/* Fill (level indicator) */}
      <div className="mixxglass-fader-fill" style={fillStyle} />

      {/* Cap (thumb) */}
      <div className="mixxglass-fader-cap" style={capStyle} />

      {/* Value bubble */}
      {(showDB || showTemperature) && (
        <div className="mixxglass-fader-bubble" style={bubbleStyle}>
          {showTemperature ? (
            <span style={{ color: temperature.color }}>
              {temperature.label} ({temperature.intensity > 0.7 ? 'high' : 'moderate'} energy)
            </span>
          ) : (
            valueToDB(value)
          )}
        </div>
      )}

      {/* ALS pulse overlay */}
      {alsFeedback?.pulse && (
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            effects.border.radius.full,
            {
              pointerEvents: 'none',
              background: `radial-gradient(circle at 50% ${100 - fillHeight}%, ${alsFeedback.glowColor} 0%, transparent 50%)`,
              opacity: 0.2,
              animation: 'pulse 2s ease-in-out infinite',
            }
          )}
        />
      )}
    </div>
  );
};

export default MixxGlassFader;


