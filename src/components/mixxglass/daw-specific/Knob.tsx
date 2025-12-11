/**
 * MixxGlass Knob Component
 * 
 * DAW-specific circular knob component with glass aesthetic and ALS integration.
 * Replaces plugin Knob components.
 * 
 * Features:
 * - Glass aesthetic
 * - ALS integration
 * - Fine-tuning (Shift/Ctrl modifiers)
 * - Keyboard control
 * - Mouse wheel support
 * - Double-click reset
 * - MIDI learn support
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useFlowMotion } from '../hooks/useFlowMotion';
import { useALSFeedback, type ALSChannel } from '../hooks/useALSFeedback';
import { getGlassSurface } from '../utils/glassStyles';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../../design-system';

export interface MixxGlassKnobProps {
  size?: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  value: number;
  setValue: (value: number) => void;
  label: string;
  step?: number;
  paramName?: string;
  isLearning?: boolean;
  onMidiLearn?: (paramName: string, min: number, max: number) => void;
  alsChannel?: ALSChannel;
  disabled?: boolean;
}

const MIN_ANGLE = -135;
const MAX_ANGLE = 135;
const ACTIVATION_THRESHOLD = 3; // pixels

const PIXELS_PER_UNIT_NORMAL = 2;
const FINE_TUNE_MULTIPLIER = 5;
const SUPER_FINE_TUNE_MULTIPLIER = 20;

/**
 * MixxGlass Knob
 * 
 * Circular knob control with glass aesthetic and precision features.
 */
export const MixxGlassKnob: React.FC<MixxGlassKnobProps> = ({
  size = 80,
  min = 0,
  max = 100,
  defaultValue,
  value,
  setValue,
  label,
  step,
  paramName,
  isLearning = false,
  onMidiLearn,
  alsChannel = 'momentum',
  disabled = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFineTuning, setIsFineTuning] = useState(false);
  const [isSuperFineTuning, setIsSuperFineTuning] = useState(false);
  const [isThresholdMet, setIsThresholdMet] = useState(false);
  const dragStartInfo = useRef({ y: 0, value: 0 });

  // Normalize value to 0-1 for ALS
  const normalizedValue = (value - min) / (max - min);

  // ALS feedback
  const alsFeedback = useALSFeedback({
    channel: alsChannel,
    value: normalizedValue,
    enabled: true,
  });

  // Convert value to angle
  const valueToAngle = useCallback((val: number) => {
    const percentage = (val - min) / (max - min);
    return MIN_ANGLE + percentage * (MAX_ANGLE - MIN_ANGLE);
  }, [min, max]);

  const angle = valueToAngle(value);

  // Animated angle for smooth rotation
  const animatedAngle = useFlowMotion(
    { angle },
    { duration: 150, easing: 'ease-out' }
  );

  // Apply step and precision
  const applyStepAndPrecision = useCallback((val: number) => {
    let finalValue = val;
    if (step !== undefined && step > 0) {
      finalValue = Math.round(val / step) * step;
    }
    const decimalPlaces = step ? Math.max(0, -Math.floor(Math.log10(step))) : 0;
    return parseFloat(finalValue.toFixed(decimalPlaces));
  }, [step]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || disabled) return;

    const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
    const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
    setIsFineTuning(currentIsFineTuning);
    setIsSuperFineTuning(currentIsSuperFineTuning);

    let currentMultiplier = 1;
    if (currentIsFineTuning) currentMultiplier = FINE_TUNE_MULTIPLIER;
    if (currentIsSuperFineTuning) currentMultiplier = SUPER_FINE_TUNE_MULTIPLIER;

    const startInfo = dragStartInfo.current;
    const deltaY = startInfo.y - e.clientY;

    if (!isThresholdMet) {
      if (Math.abs(deltaY) > ACTIVATION_THRESHOLD) {
        setIsThresholdMet(true);
      } else {
        return;
      }
    }

    const sensitivityDivisor = PIXELS_PER_UNIT_NORMAL * currentMultiplier;
    let newValue = startInfo.value + (deltaY / sensitivityDivisor);
    newValue = Math.max(min, Math.min(max, newValue));
    newValue = applyStepAndPrecision(newValue);

    if (newValue !== value) {
      setValue(newValue);
    }
  }, [isDragging, disabled, min, max, value, setValue, applyStepAndPrecision, isThresholdMet]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    e.stopPropagation();

    const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
    const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
    setIsFineTuning(currentIsFineTuning);
    setIsSuperFineTuning(currentIsSuperFineTuning);

    dragStartInfo.current = {
      y: e.clientY,
      value: value,
    };
    setIsThresholdMet(false);
    setIsDragging(true);
  }, [disabled, value]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsFineTuning(false);
    setIsSuperFineTuning(false);
    setIsThresholdMet(false);
  }, []);

  // Mouse wheel support
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (disabled || !knobRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
    const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
    setIsFineTuning(currentIsFineTuning);
    setIsSuperFineTuning(currentIsSuperFineTuning);

    let currentMultiplier = 1;
    if (currentIsFineTuning) currentMultiplier = FINE_TUNE_MULTIPLIER;
    if (currentIsSuperFineTuning) currentMultiplier = SUPER_FINE_TUNE_MULTIPLIER;

    const adjustAmount = (step || (max - min) / 100) / currentMultiplier;
    let newValue = value;

    if (e.deltaY < 0) {
      newValue = Math.min(max, value + adjustAmount);
    } else {
      newValue = Math.max(min, value - adjustAmount);
    }

    newValue = applyStepAndPrecision(newValue);
    if (newValue !== value) {
      setValue(newValue);
    }
  }, [disabled, step, min, max, value, setValue, applyStepAndPrecision]);

  // Keyboard control
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (disabled || !knobRef.current) return;
    if (document.activeElement !== knobRef.current) return;

    const currentIsSuperFineTuning = e.metaKey || e.ctrlKey;
    const currentIsFineTuning = e.shiftKey && !currentIsSuperFineTuning;
    setIsFineTuning(currentIsFineTuning);
    setIsSuperFineTuning(currentIsSuperFineTuning);

    let currentMultiplier = 1;
    if (currentIsFineTuning) currentMultiplier = FINE_TUNE_MULTIPLIER;
    if (currentIsSuperFineTuning) currentMultiplier = SUPER_FINE_TUNE_MULTIPLIER;

    const adjustAmount = (step || (max - min) / 100) / currentMultiplier;
    let newValue = value;

    if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
      newValue = Math.min(max, value + adjustAmount);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
      newValue = Math.max(min, value - adjustAmount);
    } else {
      return;
    }

    newValue = applyStepAndPrecision(newValue);
    if (newValue !== value) {
      setValue(newValue);
    }
    e.preventDefault();
    e.stopPropagation();
  }, [disabled, step, min, max, value, setValue, applyStepAndPrecision]);

  // Double-click reset
  const handleDoubleClick = useCallback(() => {
    if (disabled || defaultValue === undefined) return;
    const finalResetValue = applyStepAndPrecision(defaultValue);
    setValue(finalResetValue);
  }, [disabled, defaultValue, setValue, applyStepAndPrecision]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const glassSurface = getGlassSurface({
    intensity: 'medium',
    border: true,
    glow: alsFeedback?.pulse ?? false,
    glowColor: alsFeedback?.glowColor,
  });

  const knobColor = isSuperFineTuning
    ? '#a78bfa'
    : isFineTuning
    ? '#67e8f9'
    : alsFeedback?.color || '#f472b6';

  const knobGlow = isSuperFineTuning
    ? '#c4b5fd'
    : isFineTuning
    ? '#a5f3fc'
    : alsFeedback?.glowColor || '#fbbf24';

  return (
    <div style={composeStyles(
      layout.flex.container('col'),
      layout.flex.align.center,
      spacing.gap(2)
    )}>
      <div
        ref={knobRef}
        style={composeStyles(
          layout.position.relative,
          effects.border.radius.full,
          glassSurface,
          {
            width: `${size}px`,
            height: `${size}px`,
            cursor: 'pointer',
            userSelect: 'none',
          }
        )}
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
        onDoubleClick={handleDoubleClick}
        tabIndex={0}
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
      >
        {/* Knob background */}
        <div
          style={composeStyles(
            layout.position.absolute,
            { inset: 0 },
            effects.border.radius.full,
            {
              background: `radial-gradient(circle at 30% 30%, ${knobColor}80, ${knobColor}40, transparent)`,
              boxShadow: `inset 0 0 ${size / 4}px rgba(0, 0, 0, 0.3), 0 0 ${8 + (alsFeedback?.intensity || 0) * 12}px ${knobGlow}60`,
            }
          )}
        />

        {/* Indicator line */}
        <div
          style={composeStyles(
            layout.position.absolute,
            {
              top: 0,
              left: '50%',
              width: '3px',
              height: `${size * 0.35}px`,
              background: `linear-gradient(180deg, ${knobColor}, ${knobGlow})`,
              transform: `translateX(-50%) rotate(${animatedAngle.angle}deg)`,
              transformOrigin: '50% 100%',
              borderRadius: '2px',
              boxShadow: `0 0 4px ${knobGlow}80`,
            }
          )}
        />

        {/* Center dot */}
        <div
          style={composeStyles(
            layout.position.absolute,
            effects.border.radius.full,
            transitions.transform.combine('translate(-50%, -50%)'),
            {
              top: '50%',
              left: '50%',
              width: `${size * 0.15}px`,
              height: `${size * 0.15}px`,
              background: knobColor,
              boxShadow: `0 0 6px ${knobGlow}80`,
            }
          )}
        />

        {/* MIDI Learn indicator */}
        {isLearning && (
          <div
            style={composeStyles(
              layout.position.absolute,
              effects.border.radius.full,
              {
                top: '-4px',
                right: '-4px',
                width: '12px',
                height: '12px',
                background: '#fbbf24',
                boxShadow: '0 0 8px #fbbf24',
                animation: 'pulse 2s ease-in-out infinite',
              }
            )}
          />
        )}
      </div>

      {/* Label */}
      <div style={typography.align('center')}>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          layout.flex.justify.center,
          spacing.gap(2)
        )}>
          <span style={composeStyles(
            typography.size('xs'),
            typography.weight('semibold'),
            { color: 'rgba(230, 240, 255, 0.8)' }
          )}>{label}</span>
          {paramName && onMidiLearn && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMidiLearn(paramName, min, max);
              }}
              style={composeStyles(
                effects.border.radius.full,
                transitions.transition.standard('all', 200, 'ease-out'),
                {
                  width: '12px',
                  height: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  background: isLearning ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)',
                  animation: isLearning ? 'pulse 2s ease-in-out infinite' : undefined,
                  cursor: 'pointer',
                }
              )}
              onMouseEnter={(e) => {
                if (!isLearning) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLearning) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }
              }}
              title={`MIDI Learn: ${label}`}
              aria-label={`MIDI Learn for ${label}`}
            />
          )}
        </div>
        <div style={composeStyles(
          { fontSize: '10px' },
          typography.color.ink.muted,
          { fontFamily: 'monospace' }
        )}>
          {value.toFixed(step ? Math.max(0, -Math.floor(Math.log10(step))) : 0)}
        </div>
      </div>
    </div>
  );
};

export default MixxGlassKnob;

