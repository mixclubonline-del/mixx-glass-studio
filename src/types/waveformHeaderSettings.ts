/**
 * Waveform Header Settings
 * 
 * Configurable parameters for the Adaptive Waveform Header
 * Accessed via Bloom menu for real-time adjustment
 */

export interface WaveformHeaderSettings {
  // Amplitude (height)
  baseAmplitude: number; // 0-1, base vertical amplitude (default: 0.42)
  activeModeBoost: number; // 0-2, multiplier for active mode (default: 1.15)
  energyMultiplier: number; // 0-0.5, how much energy affects amplitude (default: 0.1)
  
  // Thickness (stroke width)
  mainStrokeWidth: { ambient: number; active: number }; // Main waveform line width
  glowStrokeWidth: { ambient: number; active: number }; // Glow layer width multiplier
  highlightStrokeWidth: { ambient: number; active: number }; // Highlight layer width
  
  // Visual effects
  glowIntensity: { ambient: number; active: number }; // 0-1, glow layer opacity
  shadowBlur: { ambient: number; active: number }; // Shadow blur radius
  highlightIntensity: number; // 0-1, highlight layer opacity (default: 0.4)
  
  // Animation
  phaseSpeed: { ambient: number; active: number }; // Phase progression speed
  playbackBoost: number; // 0-1, amplitude boost when playing (default: 0.25)
  
  // Waveform generation
  fundamentalStrength: number; // 0-1, base sine wave strength (default: 0.35)
  harmonyStrength: number; // 0-1, 2nd harmonic strength (default: 0.2)
  pressureStrength: number; // 0-1, 3rd harmonic strength (default: 0.12)
  temperatureModulation: number; // 0-1, temperature wave impact (default: 0.25)
  momentumModulation: number; // 0-1, momentum wave impact (default: 0.28)
  
  // Health pulse
  healthPulseRange: { min: number; max: number }; // Pulse multiplier range (default: 0.7-1.0)
  
  // Energy response
  energyRange: { min: number; max: number }; // Energy multiplier range (default: 0.5-1.0)
}

export const DEFAULT_WAVEFORM_HEADER_SETTINGS: WaveformHeaderSettings = {
  baseAmplitude: 0.42,
  activeModeBoost: 1.15,
  energyMultiplier: 0.1,
  
  mainStrokeWidth: { ambient: 3, active: 4 },
  glowStrokeWidth: { ambient: 4, active: 6 },
  highlightStrokeWidth: { ambient: 1.2, active: 1.8 },
  
  glowIntensity: { ambient: 0.2, active: 0.2 },
  shadowBlur: { ambient: 12, active: 20 },
  highlightIntensity: 0.4,
  
  phaseSpeed: { ambient: 0.35, active: 0.9 },
  playbackBoost: 0.25,
  
  fundamentalStrength: 0.35,
  harmonyStrength: 0.2,
  pressureStrength: 0.12,
  temperatureModulation: 0.25,
  momentumModulation: 0.28,
  
  healthPulseRange: { min: 0.7, max: 1.0 },
  energyRange: { min: 0.5, max: 1.0 },
};

