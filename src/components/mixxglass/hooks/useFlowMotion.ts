/**
 * useFlowMotion Hook
 * 
 * Lightweight animation hook for MixxGlass components
 * Replaces Framer Motion with Flow-conscious animations
 */

import React, { useState, useEffect, useRef } from 'react';

export interface FlowMotionConfig {
  duration?: number;
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  delay?: number;
  onComplete?: () => void;
}

/**
 * Lightweight animation hook
 * Optimized for glass aesthetic and ALS integration
 */
export function useFlowMotion<T extends Record<string, number | string>>(
  target: T,
  config: FlowMotionConfig = {}
): T {
  const { duration = 300, easing = 'ease-out', delay = 0, onComplete } = config;
  const [current, setCurrent] = useState<T>(target);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const startValuesRef = useRef<T>(target);
  const currentRef = useRef<T>(current);

  // Update current ref when current state changes
  useEffect(() => {
    currentRef.current = current;
  }, [current]);

  useEffect(() => {
    // Cancel any existing animation
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
    }

    startValuesRef.current = { ...currentRef.current };
    startTimeRef.current = performance.now() + delay;

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Apply easing
      const eased = applyEasing(progress, easing);

      // Interpolate values
      const interpolated: T = {} as T;
      for (const key in target) {
        const start = startValuesRef.current[key];
        const end = target[key];

        if (typeof start === 'number' && typeof end === 'number') {
          interpolated[key] = (start + (end - start) * eased) as T[Extract<keyof T, string>];
        } else {
          // For non-numeric values, switch at 50%
          interpolated[key] = (progress > 0.5 ? end : start) as T[Extract<keyof T, string>];
        }
      }

      setCurrent(interpolated);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        animationRef.current = null;
        if (onComplete) {
          onComplete();
        }
      }
    };

    if (delay > 0) {
      setTimeout(() => {
        animationRef.current = requestAnimationFrame(animate);
      }, delay);
    } else {
      animationRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [target, duration, easing, delay, onComplete]);

  return current;
}

/**
 * Apply easing function
 */
function applyEasing(t: number, easing: FlowMotionConfig['easing']): number {
  switch (easing) {
    case 'ease-in':
      return t * t;
    case 'ease-out':
      return t * (2 - t);
    case 'ease-in-out':
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    case 'linear':
      return t;
    default:
      return t * (2 - t); // ease-out default
  }
}

/**
 * Glass transform animation
 */
export function useGlassTransform(
  depth: number,
  config: FlowMotionConfig = {}
): React.CSSProperties {
  const animatedDepth = useFlowMotion({ depth }, config);

  return {
    transform: `translateZ(${animatedDepth.depth}px)`,
    transformStyle: 'preserve-3d',
  };
}

/**
 * Animated value for repeating animations (like pulsing)
 */
export function usePulseAnimation(
  min: number,
  max: number,
  duration: number = 2000,
  easing: FlowMotionConfig['easing'] = 'ease-in-out'
): number {
  const [value, setValue] = useState(min);
  const directionRef = useRef<'up' | 'down'>('up');

  useEffect(() => {
    let animationFrame: number;
    let startTime = performance.now();

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = (elapsed % duration) / duration;

      // Apply easing
      const eased = applyEasing(progress < 0.5 ? progress * 2 : 2 - progress * 2, easing);

      const currentValue = min + (max - min) * eased;
      setValue(currentValue);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [min, max, duration, easing]);

  return value;
}

