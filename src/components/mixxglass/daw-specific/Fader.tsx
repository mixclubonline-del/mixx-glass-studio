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
import { hexToRgba } from '../../../utils/ALS';
import { layout, effects, transitions, spacing, typography, composeStyles } from '../../../design-system';

export interface MixxGlassFaderProps {
  value: number; // 0-1.2 (allows +2dB headroom)
  onChange: (value: number) => void;
  alsChannel?: ALSChannel;
  alsIntensity?: number;
  alsPulse?: number; // ALS pulse value for immersive feedback
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
  alsPulse,
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
  const [isHovering, setIsHovering] = useState(false);
  const dragStartRef = useRef<{ y: number; value: number } | null>(null);

  // ALS feedback
  const normalizedValue = clamp(value / 1.2, 0, 1);
  const alsFeedback = useALSFeedback({
    channel: alsChannel,
    value: alsIntensity ?? normalizedValue,
    enabled: true,
  });

  // Temperature representation (no raw numbers)
  const temperature = valueToTemperature(normalizedValue);

  // Professional fader position: instant during drag, fast snap after
  // NO animation during drag - instant response is critical for professional DAWs
  const sliderRatio = clamp(value / 1.2, 0, 1);
  // During drag: instant (duration 0). After drag: fast snap (60ms)
  const animatedPosition = useFlowMotion(
    { position: sliderRatio },
    { 
      duration: isDragging ? 0 : 60, // Instant during drag, 60ms snap after (professional standard)
      easing: 'ease-out' 
    }
  );
  // Use animated position (which is instant when duration=0 during drag)
  const displayPosition = animatedPosition.position;

  // Professional fader interaction: click-to-jump (direct), drag with fine/coarse control
  const handlePointerValue = useCallback(
    (clientY: number, isInitialClick: boolean = false, isFineTuning: boolean = false, isCoarseTuning: boolean = false) => {
      if (!containerRef.current || disabled) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relative = 1 - (clientY - rect.top) / rect.height;
      const targetValue = clamp(relative * 1.2, 0, 1.2);
      
      if (isInitialClick) {
        // Click anywhere: jump directly to position (1:1, professional standard)
        onChange(Number(targetValue.toFixed(3)));
        dragStartRef.current = { y: clientY, value: targetValue };
      } else if (dragStartRef.current) {
        // Drag: move relative to start position with fine/coarse control
        const deltaY = dragStartRef.current.y - clientY;
        const pixelsPerUnit = rect.height / 1.2; // Full range in pixels
        
        // Professional sensitivity: 1:1 pixel mapping by default
        // Fine: 0.25x (Shift), Coarse: 4x (Cmd/Ctrl)
        let sensitivity = 1.0;
        if (isFineTuning) sensitivity = 0.25;
        if (isCoarseTuning) sensitivity = 4.0;
        
        const deltaValue = (deltaY / pixelsPerUnit) * sensitivity;
        const newValue = clamp(dragStartRef.current.value + deltaValue, 0, 1.2);
        onChange(Number(newValue.toFixed(3)));
      }
    },
    [onChange, disabled]
  );

  // FLOW Doctrine: Convert value to level description (no raw dB!)
  const valueToLevel = (v: number): string => {
    if (v === 0) return "Silent";
    if (v < 0.1) return "Whisper";
    if (v < 0.25) return "Soft";
    if (v < 0.5) return "Moderate";
    if (v < 0.7) return "Present";
    if (v < 0.85) return "Warm";
    if (v < 0.95) return "Hot";
    if (v < 1.1) return "Peak";
    return "Limit";
  };

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      containerRef.current?.setPointerCapture(event.pointerId);
      setIsDragging(true);
      if (showDB || showTemperature) {
        setShowValueBubble(true);
      }
      // Initial click: jump directly to position (professional standard)
      handlePointerValue(event.clientY, true, false, false);
    },
    [handlePointerValue, showDB, showTemperature, disabled]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      const isFineTuning = event.shiftKey;
      const isCoarseTuning = event.metaKey || event.ctrlKey;
      // Drag: move relative to start with fine/coarse control
      handlePointerValue(event.clientY, false, isFineTuning, isCoarseTuning);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
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

  // Professional fader track style
  const trackStyle: React.CSSProperties = composeStyles(
    layout.position.relative,
    layout.overflow.hidden,
    {
      height: `${height}px`,
      width: '24px', // Wider track for immersive 40px cap (Logic/Pro Tools/Ableton standard)
      borderRadius: '11px',
      background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6))',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }
  );

  // Professional fader fill: instant during drag, fast snap after
  const fillHeight = displayPosition * 100;
  const fillStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    {
      bottom: 0,
      left: 0,
      right: 0,
      height: `${fillHeight}%`,
      background: trackColor
        ? `linear-gradient(180deg, ${trackColor}60, ${glowColor || trackColor}30)`
        : `linear-gradient(180deg, ${alsFeedback?.color || temperature.color}60, ${alsFeedback?.glowColor || temperature.color}30)`,
      boxShadow: `0 0 ${4 + (alsFeedback?.intensity || 0) * 6}px ${alsFeedback?.glowColor || temperature.color}30`,
      borderRadius: '11px',
      // Instant during drag, fast snap after
      transition: isDragging 
        ? 'none' // NO transition during drag - instant response
        : 'height 60ms ease-out, box-shadow 80ms ease-out',
      // Performance optimization
      willChange: isDragging ? 'height' : 'auto',
    }
  );

  // Immersive ALS-integrated fader cap - wider, more interactive, professional
  const capIntensity = alsIntensity ?? alsFeedback?.intensity ?? normalizedValue;
  const capPulse = alsPulse ?? (alsFeedback?.pulse ? 0.8 : 0.3);
  const capColor = trackColor || alsFeedback?.color || temperature.color;
  const capGlow = glowColor || alsFeedback?.glowColor || temperature.color;
  
  // ALS-driven cap color intensity (using rgba for proper alpha)
  const capColorAlpha = 0.78 + capIntensity * 0.22; // 0.78-1.0 based on intensity
  const capGlowAlpha = 0.59 + capIntensity * 0.21; // 0.59-0.8 based on intensity
  
  // ALS pulse-driven glow intensity
  const pulseGlowIntensity = 8 + capPulse * 16; // 8-24px glow based on pulse
  const pulseGlowAlpha = 0.12 + capPulse * 0.20; // 0.12-0.32 alpha based on pulse
  
  // Temperature-driven border
  const temperatureAlpha = 0.10 + capIntensity * 0.20; // 0.10-0.30 based on intensity
  
  // Interactive state multipliers
  const hoverMultiplier = isHovering ? 1.3 : 1.0;
  const dragMultiplier = isDragging ? 1.5 : 1.0;
  const interactiveMultiplier = Math.max(hoverMultiplier, dragMultiplier);
  
  // Professional fader cap: instant position during drag, fast transitions for visual properties only
  const capStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    {
      left: '50%',
      bottom: `${fillHeight}%`,
      // Instant position - NO transition on bottom/transform during drag
      transform: `translate(-50%, 50%) scale(${isHovering && !isDragging ? 1.05 : 1})`,
      width: '40px',  // Wider professional cap (Logic/Pro Tools/Ableton standard)
      height: '12px', // Taller professional cap
      borderRadius: '6px', // Subtle rounding
      // ALS-driven gradient: intensity affects color saturation
      background: `linear-gradient(180deg, 
        ${hexToRgba(capColor, capColorAlpha)}, 
        ${hexToRgba(capGlow, capGlowAlpha)}
      )`,
      // Temperature-driven border with ALS intensity
      border: `1px solid ${hexToRgba(capGlow, temperatureAlpha)}`,
      // ALS pulse-driven glow + professional depth
      boxShadow: `
        0 0 ${pulseGlowIntensity * interactiveMultiplier}px ${hexToRgba(capGlow, pulseGlowAlpha * interactiveMultiplier)},
        0 2px 4px rgba(0, 0, 0, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.15),
        inset 0 -1px 0 rgba(0, 0, 0, 0.2)
      `,
      cursor: disabled ? 'not-allowed' : isDragging ? 'grabbing' : 'grab',
      // Fast transitions for visual properties only (not position)
      transition: isDragging 
        ? 'none' // NO transitions during drag - instant response
        : 'box-shadow 80ms ease-out, border-color 80ms ease-out, background 80ms ease-out, transform 80ms ease-out',
      // Performance optimization
      willChange: isDragging ? 'transform' : 'auto',
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
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      tabIndex={disabled ? -1 : 0}
      role="slider"
      aria-label={name}
      aria-valuemin={0}
      aria-valuemax={1.2}
      aria-valuenow={Math.round(value * 100) / 100}
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
            valueToLevel(value)
          )}
        </div>
      )}

      {/* Immersive ALS energy flow visualization - shows energy around cap */}
      {alsFeedback && (
        <div
          style={composeStyles(
            layout.position.absolute,
            {
              left: '50%',
              bottom: `${fillHeight}%`,
              transform: 'translate(-50%, 50%)',
              width: '44px', // Slightly wider than cap for energy halo
              height: '16px',
              borderRadius: '8px',
              pointerEvents: 'none',
              // ALS pulse-driven energy visualization
              background: `radial-gradient(ellipse, ${hexToRgba(alsFeedback.glowColor, 0.08 + capPulse * 0.12)} 0%, transparent 70%)`,
              opacity: 0.4 + capPulse * 0.3,
              filter: `blur(${2 + capPulse * 2}px)`,
              // Instant position, smooth visual properties
              transition: isDragging 
                ? 'none' 
                : 'bottom 60ms ease-out, opacity 120ms ease-out, filter 120ms ease-out',
              willChange: isDragging ? 'bottom' : 'opacity, filter',
            }
          )}
        />
      )}
    </div>
  );
};

export default MixxGlassFader;


