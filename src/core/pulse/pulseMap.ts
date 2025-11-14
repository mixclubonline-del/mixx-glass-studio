/**
 * Pulse Map Builder
 * 
 * Layer 5.2 of Flow Pulse Engine.
 * Combines transients with energy profile to build pulse map.
 * 
 * Transients tell us where the "hits" live - the rhythmic peaks.
 */

export interface TransientMarker {
  sample: number; // Sample index where transient occurs
  time: number; // Time in seconds
  strength: number; // Transient strength (0-1)
}

/**
 * Build pulse map from energy profile and transients.
 * 
 * @param energy - Energy profile array (from computeEnergyProfile)
 * @param transients - Array of transient markers
 * @param blockSize - Size of each energy block in samples (default 1024)
 * @returns Pulse map array (one value per energy block)
 */
export function buildPulseMap(
  energy: number[],
  transients: TransientMarker[],
  blockSize: number = 1024
): number[] {
  const pulse = new Array(energy.length).fill(0);
  
  // Map transients to energy blocks
  transients.forEach(transient => {
    const block = Math.floor(transient.sample / blockSize);
    
    // Ensure block is within bounds
    if (block >= 0 && block < pulse.length) {
      // Add transient strength to pulse map
      // Stronger transients contribute more to pulse
      pulse[block] += transient.strength;
    }
  });
  
  return pulse;
}

/**
 * Build pulse map with decay (transients fade over time).
 * 
 * @param energy - Energy profile array
 * @param transients - Array of transient markers
 * @param blockSize - Size of each energy block in samples (default 1024)
 * @param decayRate - How fast transients decay (0-1, default 0.9)
 * @returns Pulse map array with decay applied
 */
export function buildPulseMapWithDecay(
  energy: number[],
  transients: TransientMarker[],
  blockSize: number = 1024,
  decayRate: number = 0.9
): number[] {
  const pulse = buildPulseMap(energy, transients, blockSize);
  
  // Apply decay to pulse map
  for (let i = 1; i < pulse.length; i++) {
    pulse[i] = Math.max(pulse[i], pulse[i - 1] * decayRate);
  }
  
  return pulse;
}

