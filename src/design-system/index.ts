/**
 * MixxGlass Design System
 * 
 * Proprietary styling system replacing Tailwind CSS
 * 
 * Usage:
 * ```tsx
 * import { glass, spacing, typography, layout, als } from '@/design-system';
 * 
 * <div style={{
 *   ...glass.surface({ intensity: 'medium' }),
 *   ...spacing.p(4),
 *   ...spacing.gap(2),
 *   ...typography.body(),
 *   ...layout.flex.container('row'),
 *   ...layout.flex.justify.center,
 *   ...als.temperature(0.7),
 * }}>
 *   Content
 * </div>
 * ```
 */

// Core utilities
export * from './core/spacing';
export * from './core/typography';
export * from './core/layout';
export * from './core/effects';
export * from './core/transitions';

// Glass primitives (re-export from mixxglass)
export { getGlassSurface, getGlassButtonStyles, getGlassInputStyles, getGlassTransform } from '../components/mixxglass/utils/glassStyles';

// ALS integration (re-export from mixxglass)
export * from '../components/mixxglass/utils/alsHelpers';

// Re-export as convenient namespaces
import * as spacing from './core/spacing';
import * as typography from './core/typography';
import * as layout from './core/layout';
import * as effects from './core/effects';
import * as transitions from './core/transitions';
import { getGlassSurface, getGlassButtonStyles, getGlassInputStyles, getGlassTransform } from '../components/mixxglass/utils/glassStyles';
import * as alsHelpers from '../components/mixxglass/utils/alsHelpers';

/**
 * Glass utilities namespace
 */
export const glass = {
  surface: getGlassSurface,
  button: getGlassButtonStyles,
  input: getGlassInputStyles,
  transform: getGlassTransform,
};

/**
 * ALS utilities namespace
 */
export const als = {
  channelToColor: alsHelpers.alsChannelToColor,
  valueToTemperature: alsHelpers.valueToTemperature,
  valueToEnergy: alsHelpers.valueToEnergy,
  generateFeedback: alsHelpers.generateALSFeedback,
  getPulseStyle: alsHelpers.getALSPulseStyle,
  
  /**
   * Quick temperature styling
   */
  temperature: (value: number) => {
    const temp = alsHelpers.valueToTemperature(value);
    return {
      color: temp.color,
      boxShadow: `0 0 ${10 + temp.intensity * 20}px ${temp.color}40`,
    };
  },
  
  /**
   * Quick energy styling
   */
  energy: (value: number) => {
    const energy = alsHelpers.valueToEnergy(value);
    return {
      color: energy.color,
      boxShadow: `0 0 ${10 + energy.intensity * 20}px ${energy.color}40`,
    };
  },
  
  /**
   * Pulse animation
   */
  pulse: (config: { channel: alsHelpers.ALSChannel; intensity: number }) => {
    const feedback = alsHelpers.generateALSFeedback(config.channel, config.intensity);
    return alsHelpers.getALSPulseStyle(feedback);
  },
};

/**
 * Effects utilities namespace
 */
export const effectsUtils = effects;

/**
 * Transitions utilities namespace
 */
export const transitionsUtils = transitions;

// Utilities
export * from './utils/compose';
export * from './utils/cn';

import { composeStyles, createStyleBuilder } from './utils/compose';
import { cn } from './utils/cn';

/**
 * Main design system export
 */
export const designSystem = {
  spacing,
  typography,
  layout,
  effects,
  transitions,
  glass,
  als,
  // Utilities
  compose: composeStyles,
  builder: createStyleBuilder,
  cn,
};

export default designSystem;

