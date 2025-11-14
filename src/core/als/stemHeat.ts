/**
 * Stem Heatmap System
 * 
 * Part B of Flow Physiology Expansion Pack.
 * Thermal readout per lane based on RMS, crest factor, or ALS per-stem metrics.
 * 
 * This is where Flow becomes visually *intelligent*.
 */

/**
 * Get stem heat color based on energy level.
 * 
 * Maps stem energy (0-1) to thermal color.
 * 
 * @param energy - Energy level (0-1, typically RMS or normalized level)
 * @returns Color string (rgba)
 */
export function getStemHeatColor(energy: number): string {
  // Clamp energy to 0-1 range
  const clamped = Math.max(0, Math.min(1, energy));
  
  if (clamped < 0.15) {
    return 'rgba(120, 160, 255, 0.18)'; // cold
  }
  if (clamped < 0.35) {
    return 'rgba(140, 180, 255, 0.22)'; // warming
  }
  if (clamped < 0.55) {
    return 'rgba(255, 200, 140, 0.25)'; // warm
  }
  if (clamped < 0.75) {
    return 'rgba(255, 150, 110, 0.33)'; // hot
  }
  return 'rgba(255, 90, 90, 0.42)'; // blazing
}

/**
 * Get stem heat color with intensity boost.
 * 
 * @param energy - Energy level (0-1)
 * @param intensity - Intensity multiplier (0-2, default 1)
 * @returns Color string (rgba)
 */
export function getStemHeatColorWithIntensity(
  energy: number,
  intensity: number = 1
): string {
  const baseColor = getStemHeatColor(energy);
  
  // Extract rgba values and boost opacity
  const match = baseColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
  if (!match) {
    return baseColor;
  }
  
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  const baseOpacity = match[4] ? parseFloat(match[4]) : 1.0;
  const adjustedOpacity = Math.min(1.0, baseOpacity * intensity);
  
  return `rgba(${r}, ${g}, ${b}, ${adjustedOpacity})`;
}

/**
 * Get stem heat state from energy.
 * 
 * @param energy - Energy level (0-1)
 * @returns Thermal state string
 */
export function getStemHeatState(energy: number): 'cold' | 'warming' | 'warm' | 'hot' | 'blazing' {
  const clamped = Math.max(0, Math.min(1, energy));
  
  if (clamped < 0.15) return 'cold';
  if (clamped < 0.35) return 'warming';
  if (clamped < 0.55) return 'warm';
  if (clamped < 0.75) return 'hot';
  return 'blazing';
}

/**
 * Compute stem energy from audio buffer.
 * 
 * @param buffer - Audio buffer to analyze
 * @returns Energy level (0-1)
 */
export function computeStemEnergy(buffer: AudioBuffer | null): number {
  if (!buffer) {
    return 0;
  }
  
  const channel = buffer.getChannelData(0);
  const len = channel.length;
  
  if (len === 0) {
    return 0;
  }
  
  // Compute RMS
  let sumSquares = 0;
  for (let i = 0; i < len; i += 128) {
    const sample = channel[i] || 0;
    sumSquares += sample * sample;
  }
  
  const rms = Math.sqrt(sumSquares / (len / 128));
  
  // Normalize to 0-1 range (RMS is typically 0-0.5 for normalized audio)
  return Math.min(1.0, rms * 2);
}

