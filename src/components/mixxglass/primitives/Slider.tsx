/**
 * MixxGlass Slider Component
 * 
 * Proprietary slider component with glass aesthetic and ALS integration.
 * Replaces Radix UI slider components.
 * 
 * No raw numbers - uses color/temperature/energy for value representation.
 */

import React, { useRef, useState, useCallback } from 'react';
import { getGlassSurface } from '../utils/glassStyles';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { valueToTemperature, valueToEnergy } from '../utils/alsHelpers';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassSliderProps {
  value: number; // 0-1 normalized
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  alsChannel?: ALSChannel;
  showValue?: boolean; // If false, only shows color/temperature (default: false)
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  // Precision features
  enableFineTuning?: boolean; // Enable Shift/Ctrl fine-tuning
  enableKeyboard?: boolean; // Enable keyboard control
  enableWheel?: boolean; // Enable mouse wheel
  enableDoubleClickReset?: boolean; // Enable double-click to reset
  defaultValue?: number; // Default value for reset
}

/**
 * MixxGlass Slider
 * 
 * Glass aesthetic slider with ALS feedback.
 * By default, shows color/temperature instead of raw numbers.
 */
const FINE_TUNE_MULTIPLIER = 4; // 4x finer with Shift
const SUPER_FINE_TUNE_MULTIPLIER = 16; // 16x finer with Ctrl/Cmd

export const MixxGlassSlider: React.FC<MixxGlassSliderProps> = ({
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
  alsChannel = 'momentum',
  showValue = false, // Default: no raw numbers
  orientation = 'horizontal',
  size = 'md',
  className = '',
  disabled = false,
  enableFineTuning = false,
  enableKeyboard = false,
  enableWheel = false,
  enableDoubleClickReset = false,
  defaultValue,
}) => {
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [isSuperFineTuning, setIsSuperFineTuning] = useState(false);
  const dragStartInfo = useRef({ x: 0, y: 0, value: 0 });

  // Normalize value: if min/max are provided and value is outside 0-1, normalize it
  // Otherwise, assume value is already normalized (0-1)
  const normalizedValue = (min !== 0 || max !== 1) && (value < 0 || value > 1)
    ? (value - min) / (max - min)
    : value;
  const temperature = valueToTemperature(normalizedValue);
  const energy = valueToEnergy(normalizedValue);

  // ALS feedback
  const alsFeedback = useALSFeedback({
    channel: alsChannel,
    value: normalizedValue,
    enabled: true,
  });

  // Animated value for smooth updates
  const animatedValue = useFlowMotion(
    { value: normalizedValue },
    { duration: 150, easing: 'ease-out' }
  );

  // Apply step and precision
  const applyStepAndPrecision = useCallback((val: number) => {
    let finalValue = val;
    if (step > 0) {
      finalValue = Math.round(val / step) * step;
    }
    const decimalPlaces = step ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
    return parseFloat(finalValue.toFixed(decimalPlaces));
  }, [step]);

  // Handle mouse/touch events
  const handleInteraction = useCallback(
    (clientX: number, clientY: number, usePrecision = false) => {
      if (!sliderRef.current || disabled) return;

      const rect = sliderRef.current.getBoundingClientRect();
      const isHorizontal = orientation === 'horizontal';
      
      let pos: number;
      if (usePrecision && isDragging) {
        // Use pixel-based precision for dragging
        const delta = isHorizontal
          ? (clientX - dragStartInfo.current.x) / rect.width
          : -(clientY - dragStartInfo.current.y) / rect.height;
        
        const multiplier = isSuperFineTuning 
          ? SUPER_FINE_TUNE_MULTIPLIER 
          : isFineTuning 
          ? FINE_TUNE_MULTIPLIER 
          : 1;
        
        const normalizedStep = step / (max - min);
        const deltaValue = (delta / multiplier) * normalizedStep;
        pos = (dragStartInfo.current.value - min) / (max - min) + deltaValue;
      } else {
        // Direct click position
        pos = isHorizontal
          ? (clientX - rect.left) / rect.width
          : 1 - (clientY - rect.top) / rect.height;
      }

      const clampedPos = Math.max(0, Math.min(1, pos));
      const steppedValue = applyStepAndPrecision(clampedPos);
      const finalValue = min + steppedValue * (max - min);

      onChange(finalValue);
    },
    [min, max, step, onChange, orientation, disabled, isDragging, isFineTuning, isSuperFineTuning, applyStepAndPrecision]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      
      const currentIsSuperFineTuning = enableFineTuning && (e.metaKey || e.ctrlKey);
      const currentIsFineTuning = enableFineTuning && e.shiftKey && !currentIsSuperFineTuning;
      setIsFineTuning(currentIsFineTuning);
      setIsSuperFineTuning(currentIsSuperFineTuning);
      
      if (sliderRef.current) {
        const rect = sliderRef.current.getBoundingClientRect();
        dragStartInfo.current = {
          x: e.clientX,
          y: e.clientY,
          value: value,
        };
      }
      
      setIsDragging(true);
      handleInteraction(e.clientX, e.clientY, false); // Initial click
    },
    [handleInteraction, disabled, enableFineTuning, value]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      
      if (enableFineTuning) {
        const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
        const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
        setIsFineTuning(currentIsFineTuning);
        setIsSuperFineTuning(currentIsSuperFineTuning);
      }
      
      handleInteraction(e.clientX, e.clientY, true); // Use precision for dragging
    },
    [isDragging, handleInteraction, enableFineTuning]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Mouse wheel support
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!enableWheel || disabled || !sliderRef.current) return;
      if (document.activeElement !== sliderRef.current && !sliderRef.current.contains(document.activeElement)) return;
      
      e.preventDefault();
      e.stopPropagation();
      
      if (enableFineTuning) {
        const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
        const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
        setIsFineTuning(currentIsFineTuning);
        setIsSuperFineTuning(currentIsSuperFineTuning);
        
        const multiplier = currentIsSuperFineTuning 
          ? SUPER_FINE_TUNE_MULTIPLIER 
          : currentIsFineTuning 
          ? FINE_TUNE_MULTIPLIER 
          : 1;
        
        const normalizedStep = step / (max - min);
        const adjustAmount = normalizedStep / multiplier;
        
        const newValue = e.deltaY < 0 
          ? Math.min(1, normalizedValue + adjustAmount)
          : Math.max(0, normalizedValue - adjustAmount);
        
        const finalValue = applyStepAndPrecision(newValue);
        onChange(min + finalValue * (max - min));
      }
    },
    [enableWheel, disabled, enableFineTuning, step, min, max, value, onChange, applyStepAndPrecision]
  );

  // Keyboard support
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enableKeyboard || disabled || !sliderRef.current) return;
      if (document.activeElement !== sliderRef.current) return;
      
      if (enableFineTuning) {
        const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
        const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
        setIsFineTuning(currentIsFineTuning);
        setIsSuperFineTuning(currentIsSuperFineTuning);
        
        const multiplier = currentIsSuperFineTuning 
          ? SUPER_FINE_TUNE_MULTIPLIER 
          : currentIsFineTuning 
          ? FINE_TUNE_MULTIPLIER 
          : 1;
        
        const normalizedStep = step / (max - min);
        const adjustAmount = normalizedStep / multiplier;
        
        let newValue = normalizedValue;
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
          newValue = Math.min(1, normalizedValue + adjustAmount);
        } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
          newValue = Math.max(0, normalizedValue - adjustAmount);
        } else {
          return;
        }
        
        const finalValue = applyStepAndPrecision(newValue);
        onChange(min + finalValue * (max - min));
        e.preventDefault();
        e.stopPropagation();
      }
    },
    [enableKeyboard, disabled, enableFineTuning, step, min, max, value, onChange, applyStepAndPrecision]
  );

  // Double-click reset
  const handleDoubleClick = useCallback(() => {
    if (!enableDoubleClickReset || disabled || defaultValue === undefined) return;
    const normalizedDefault = (defaultValue - min) / (max - min);
    onChange(min + applyStepAndPrecision(normalizedDefault) * (max - min));
  }, [enableDoubleClickReset, disabled, defaultValue, min, max, onChange, applyStepAndPrecision]);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
        setIsFineTuning(false);
        setIsSuperFineTuning(false);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Size styles
  const sizeStyles = {
    sm: orientation === 'horizontal' ? { height: '4px' } : { width: '4px' },
    md: orientation === 'horizontal' ? { height: '8px' } : { width: '8px' },
    lg: orientation === 'horizontal' ? { height: '12px' } : { width: '12px' },
  };

  const glassSurface = getGlassSurface({
    intensity: 'soft',
    border: true,
    glow: alsFeedback?.pulse ?? false,
    glowColor: alsFeedback?.glowColor,
  });

  const trackStyle: React.CSSProperties = composeStyles(
    glassSurface,
    layout.position.relative,
    effects.border.radius.full,
    sizeStyles[size],
    {
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.5 : 1,
    }
  );

  const fillStyle: React.CSSProperties = composeStyles(
    layout.position.absolute,
    effects.border.radius.full,
    transitions.transition.standard(['width', 'height'], 150, 'ease-out'),
    {
      background: `linear-gradient(90deg, ${alsFeedback?.color || temperature.color}, ${alsFeedback?.glowColor || temperature.color}80)`,
      boxShadow: `0 0 10px ${alsFeedback?.glowColor || temperature.color}40`,
      ...(orientation === 'horizontal'
        ? {
            left: 0,
            top: 0,
            height: '100%',
            width: `${animatedValue.value * 100}%`,
          }
        : {
            bottom: 0,
            left: 0,
            width: '100%',
            height: `${animatedValue.value * 100}%`,
          }),
    }
  );

  return (
    <div className={`mixxglass-slider ${className}`}>
      <div
        ref={sliderRef}
        style={trackStyle}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
        tabIndex={enableKeyboard ? 0 : undefined}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={min + value * (max - min)}
      >
        {/* Fill */}
        <div style={fillStyle} />

        {/* Thumb */}
        <div
          style={composeStyles(
            layout.position.absolute,
            effects.border.radius.full,
            transitions.transition.standard('all', 150, 'ease-out'),
            {
            ...(orientation === 'horizontal'
              ? {
                  left: `${animatedValue.value * 100}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }
              : {
                  bottom: `${animatedValue.value * 100}%`,
                  left: '50%',
                  transform: 'translate(-50%, 50%)',
                }),
            width: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px',
            height: size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px',
            background: `radial-gradient(circle, ${
              isSuperFineTuning 
                ? '#a78bfa' 
                : isFineTuning 
                ? '#67e8f9' 
                : alsFeedback?.color || temperature.color
            }, ${
              isSuperFineTuning 
                ? '#c4b5fd' 
                : isFineTuning 
                ? '#a5f3fc' 
                : alsFeedback?.glowColor || temperature.color
            }80)`,
            boxShadow: `0 0 ${8 + (alsFeedback?.intensity || 0) * 12}px ${
              isSuperFineTuning 
                ? '#a78bfa' 
                : isFineTuning 
                ? '#67e8f9' 
                : alsFeedback?.glowColor || temperature.color
            }60`,
              border: '2px solid rgba(255, 255, 255, 0.3)',
              cursor: disabled ? 'not-allowed' : 'grab',
            }
          )}
        />
      </div>

      {/* Value display (optional, shows temperature/energy instead of numbers) */}
      {showValue && (
        <div style={composeStyles(
          spacing.mt(2),
          typography.size('xs'),
          typography.color.ink.muted
        )}>
          <span style={{ color: temperature.color }}>
            {temperature.label} ({energy.label} energy)
          </span>
        </div>
      )}
    </div>
  );
};

export default MixxGlassSlider;


