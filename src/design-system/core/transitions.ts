import React from 'react';

export type Easing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'smooth' | 'bounce' | 'elastic' | 'snappy';
export type TransitionProperty = 'all' | 'colors' | 'opacity' | 'transform' | 'shadow' | 'filter' | 'color' | 'background-color' | 'border-color' | 'outline' | 'width' | 'height' | 'box-shadow';

/**
 * Transition duration presets (ms)
 */
/**
 * Transition duration presets (ms)
 * Aligned with AuraTokens.AuraMotion
 */
export const duration = {
  instant: 0,
  fast: 150,
  normal: 300,
  slow: 500,
  slower: 800,
  slowest: 1200,
  pulse: 2000,
};

/**
 * Easing functions
 * Aligned with AuraTokens.AuraMotion
 */
export const easing = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  snappy: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
};

/**
 * Transition utilities
 */
export const transition = {
  /**
   * Standard transition
   */
  standard: (
    properties: TransitionProperty | TransitionProperty[] = 'all',
    durationMs: number = duration.normal,
    easingFn: Easing = 'ease-out'
  ): React.CSSProperties => {
    const props = Array.isArray(properties) ? properties.join(', ') : properties;
    const easingValue = easingFn === 'spring' ? easing.spring : easing[easingFn];
    
    return {
      transition: `${props} ${durationMs}ms ${easingValue}`,
    };
  },
  
  /**
   * Color transitions
   */
  colors: (durationMs: number = duration.normal): React.CSSProperties => ({
    transition: `color ${durationMs}ms ${easing['ease-out']}, background-color ${durationMs}ms ${easing['ease-out']}, border-color ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Transform transitions
   */
  transform: (durationMs: number = duration.normal, easingFn: Easing = 'ease-out'): React.CSSProperties => ({
    transition: `transform ${durationMs}ms ${easing[easingFn]}`,
  }),
  
  /**
   * Opacity transitions
   */
  opacity: (durationMs: number = duration.normal): React.CSSProperties => ({
    transition: `opacity ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Shadow transitions
   */
  shadow: (durationMs: number = duration.normal): React.CSSProperties => ({
    transition: `box-shadow ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Filter transitions
   */
  filter: (durationMs: number = duration.normal): React.CSSProperties => ({
    transition: `filter ${durationMs}ms ${easing['ease-out']}, backdrop-filter ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Flow-conscious transitions (optimized for DAW interactions)
   */
  flow: {
    /**
     * Quick tap feedback
     */
    tap: (): React.CSSProperties => ({
      transition: 'transform 100ms ease-out',
    }),
    
    /**
     * Hover feedback
     */
    hover: (): React.CSSProperties => ({
      transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
    }),
    
    /**
     * Focus feedback
     */
    focus: (): React.CSSProperties => ({
      transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out',
    }),
    
    /**
     * ALS pulse
     */
    alsPulse: (): React.CSSProperties => ({
      transition: 'box-shadow 300ms ease-in-out, opacity 300ms ease-in-out',
    }),
  },
};

/**
 * Transform utilities
 */
export const transform = {
  /**
   * Scale
   */
  scale: (value: number): React.CSSProperties => ({
    transform: `scale(${value})`,
  }),
  
  /**
   * Translate
   */
  translate: {
    x: (value: string | number): React.CSSProperties => ({
      transform: `translateX(${typeof value === 'number' ? `${value}px` : value})`,
    }),
    y: (value: string | number): React.CSSProperties => ({
      transform: `translateY(${typeof value === 'number' ? `${value}px` : value})`,
    }),
    xy: (x: string | number, y: string | number): React.CSSProperties => ({
      transform: `translate(${typeof x === 'number' ? `${x}px` : x}, ${typeof y === 'number' ? `${y}px` : y})`,
    }),
  },
  
  /**
   * Rotate
   */
  rotate: (degrees: number): React.CSSProperties => ({
    transform: `rotate(${degrees}deg)`,
  }),
  
  /**
   * 3D transforms
   */
  '3d': {
    translateZ: (depth: number): React.CSSProperties => ({
      transform: `translateZ(${depth}px)`,
      transformStyle: 'preserve-3d',
    }),
    perspective: (value: number): React.CSSProperties => ({
      perspective: `${value}px`,
    }),
  },
  
  /**
   * Combined transforms
   */
  combine: (...transforms: string[]): React.CSSProperties => ({
    transform: transforms.join(' '),
  }),
};

/**
 * Transitions object with all utilities
 */
export const transitions = {
  transition,
  transform,
  duration,
  easing,
};


