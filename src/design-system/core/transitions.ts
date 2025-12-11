/**
 * MixxGlass Transitions System
 * 
 * Proprietary transition/animation utilities
 */

export type Easing = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring';
export type TransitionProperty = 'all' | 'colors' | 'opacity' | 'transform' | 'shadow' | 'filter';

/**
 * Transition duration presets (ms)
 */
export const duration = {
  instant: 0,
  fast: 100,
  normal: 200,
  slow: 300,
  slower: 500,
  slowest: 1000,
};

/**
 * Easing functions
 */
export const easing = {
  linear: 'linear',
  ease: 'ease',
  'ease-in': 'ease-in',
  'ease-out': 'ease-out',
  'ease-in-out': 'ease-in-out',
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
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
  ) => {
    const props = Array.isArray(properties) ? properties.join(', ') : properties;
    const easingValue = easingFn === 'spring' ? easing.spring : easing[easingFn];
    
    return {
      transition: `${props} ${durationMs}ms ${easingValue}`,
    };
  },
  
  /**
   * Color transitions
   */
  colors: (durationMs: number = duration.normal) => ({
    transition: `color ${durationMs}ms ${easing['ease-out']}, background-color ${durationMs}ms ${easing['ease-out']}, border-color ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Transform transitions
   */
  transform: (durationMs: number = duration.normal, easingFn: Easing = 'ease-out') => ({
    transition: `transform ${durationMs}ms ${easing[easingFn]}`,
  }),
  
  /**
   * Opacity transitions
   */
  opacity: (durationMs: number = duration.normal) => ({
    transition: `opacity ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Shadow transitions
   */
  shadow: (durationMs: number = duration.normal) => ({
    transition: `box-shadow ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Filter transitions
   */
  filter: (durationMs: number = duration.normal) => ({
    transition: `filter ${durationMs}ms ${easing['ease-out']}, backdrop-filter ${durationMs}ms ${easing['ease-out']}`,
  }),
  
  /**
   * Flow-conscious transitions (optimized for DAW interactions)
   */
  flow: {
    /**
     * Quick tap feedback
     */
    tap: () => ({
      transition: 'transform 100ms ease-out',
    }),
    
    /**
     * Hover feedback
     */
    hover: () => ({
      transition: 'transform 150ms ease-out, box-shadow 150ms ease-out',
    }),
    
    /**
     * Focus feedback
     */
    focus: () => ({
      transition: 'box-shadow 200ms ease-out, border-color 200ms ease-out',
    }),
    
    /**
     * ALS pulse
     */
    alsPulse: () => ({
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
  scale: (value: number) => ({
    transform: `scale(${value})`,
  }),
  
  /**
   * Translate
   */
  translate: {
    x: (value: string | number) => ({
      transform: `translateX(${typeof value === 'number' ? `${value}px` : value})`,
    }),
    y: (value: string | number) => ({
      transform: `translateY(${typeof value === 'number' ? `${value}px` : value})`,
    }),
    xy: (x: string | number, y: string | number) => ({
      transform: `translate(${typeof x === 'number' ? `${x}px` : x}, ${typeof y === 'number' ? `${y}px` : y})`,
    }),
  },
  
  /**
   * Rotate
   */
  rotate: (degrees: number) => ({
    transform: `rotate(${degrees}deg)`,
  }),
  
  /**
   * 3D transforms
   */
  '3d': {
    translateZ: (depth: number) => ({
      transform: `translateZ(${depth}px)`,
      transformStyle: 'preserve-3d' as const,
    }),
    perspective: (value: number) => ({
      perspective: `${value}px`,
    }),
  },
  
  /**
   * Combined transforms
   */
  combine: (...transforms: string[]) => ({
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


