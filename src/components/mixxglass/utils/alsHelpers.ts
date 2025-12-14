/**
 * ALS (Advanced Leveling System) Helpers
 * 
 * Utilities for integrating ALS feedback into MixxGlass components
 */

export type ALSChannel = 'temperature' | 'momentum' | 'pressure' | 'harmony';

export interface ALSFeedback {
  intensity: number; // 0-1
  color: string;
  glowColor: string;
  flow: number; // 0-1
  pulse: boolean;
}

/**
 * Convert ALS channel to color
 */
export function alsChannelToColor(channel: ALSChannel, intensity: number = 0.5): string {
  const colors = {
    temperature: intensity > 0.7 ? '#ff6b6b' : intensity > 0.4 ? '#ffa94d' : '#4ecdc4',
    momentum: '#60c8ff',
    pressure: '#a57cff',
    harmony: '#ff67c7',
  };

  return colors[channel];
}

/**
 * Convert numeric value to temperature/energy representation
 * (No raw numbers - only color/temperature/energy)
 */
export function valueToTemperature(value: number): {
  color: string;
  intensity: number;
  label: string;
} {
  if (value < 0.2) {
    return { color: '#4ecdc4', intensity: 0.3, label: 'cool' };
  } else if (value < 0.4) {
    return { color: '#60c8ff', intensity: 0.5, label: 'warm' };
  } else if (value < 0.6) {
    return { color: '#ffa94d', intensity: 0.7, label: 'hot' };
  } else if (value < 0.8) {
    return { color: '#ff6b6b', intensity: 0.85, label: 'very hot' };
  } else {
    return { color: '#ff4757', intensity: 1.0, label: 'critical' };
  }
}

/**
 * Convert numeric value to energy representation
 */
export function valueToEnergy(value: number): {
  color: string;
  intensity: number;
  label: string;
} {
  if (value < 0.2) {
    return { color: '#4ecdc4', intensity: 0.2, label: 'low' };
  } else if (value < 0.4) {
    return { color: '#60c8ff', intensity: 0.4, label: 'moderate' };
  } else if (value < 0.6) {
    return { color: '#a57cff', intensity: 0.6, label: 'high' };
  } else if (value < 0.8) {
    return { color: '#ff67c7', intensity: 0.8, label: 'very high' };
  } else {
    return { color: '#ff4757', intensity: 1.0, label: 'maximum' };
  }
}

/**
 * Generate ALS feedback object
 */
export function generateALSFeedback(
  channel: ALSChannel,
  value: number,
  flow: number = 0.5
): ALSFeedback {
  const color = alsChannelToColor(channel, value);
  const glowColor = `${color}80`;

  return {
    intensity: value,
    color,
    glowColor,
    flow,
    pulse: value > 0.7,
  };
}

/**
 * Get ALS pulse animation style
 */
export function getALSPulseStyle(feedback: ALSFeedback): React.CSSProperties {
  if (!feedback.pulse) {
    return {};
  }

  return {
    boxShadow: `0 0 ${10 + feedback.intensity * 20}px ${feedback.glowColor}`,
    transition: 'box-shadow 0.3s ease',
  };
}



