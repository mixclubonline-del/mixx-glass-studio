/**
 * Transient Detector - Detects transient peaks in audio for sample chopping
 */

export interface Transient {
  time: number; // Position in seconds
  strength: number; // 0-1 strength of transient
}

export class TransientDetector {
  /**
   * Detect transients in an audio buffer using energy-based detection
   */
  static detect(
    buffer: AudioBuffer,
    options: {
      threshold?: number; // 0-1, higher = fewer transients
      minInterval?: number; // Minimum time between transients in seconds
      sensitivity?: number; // 0-1, higher = more sensitive
    } = {}
  ): Transient[] {
    const {
      threshold = 0.3,
      minInterval = 0.05, // 50ms
      sensitivity = 0.7,
    } = options;

    const channelData = buffer.getChannelData(0); // Use first channel
    const sampleRate = buffer.sampleRate;
    const windowSize = Math.floor(sampleRate * 0.01); // 10ms window
    const hopSize = Math.floor(windowSize / 2);

    const transients: Transient[] = [];
    let lastTransientSample = -minInterval * sampleRate;

    // Calculate energy for each window
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
      // Skip if too close to last transient
      if (i - lastTransientSample < minInterval * sampleRate) {
        continue;
      }

      // Calculate current and previous window energy
      let currentEnergy = 0;
      let prevEnergy = 0;

      for (let j = 0; j < windowSize; j++) {
        const sample = channelData[i + j];
        currentEnergy += sample * sample;

        if (i >= windowSize) {
          const prevSample = channelData[i - windowSize + j];
          prevEnergy += prevSample * prevSample;
        }
      }

      currentEnergy = Math.sqrt(currentEnergy / windowSize);
      prevEnergy = Math.sqrt(prevEnergy / windowSize);

      // Detect sudden increase in energy (transient)
      const energyDiff = currentEnergy - prevEnergy;
      const normalizedDiff = prevEnergy > 0 ? energyDiff / prevEnergy : energyDiff;

      if (normalizedDiff > threshold * (1 / sensitivity)) {
        const time = i / sampleRate;
        const strength = Math.min(1, normalizedDiff * sensitivity);

        transients.push({ time, strength });
        lastTransientSample = i;
      }
    }

    return transients;
  }

  /**
   * Detect transients aligned to grid
   */
  static detectGridAligned(
    buffer: AudioBuffer,
    bpm: number,
    gridDivision: number = 16, // 16th notes
    options?: {
      threshold?: number;
      sensitivity?: number;
    }
  ): Transient[] {
    const transients = this.detect(buffer, options);
    const beatDuration = 60 / bpm;
    const gridInterval = beatDuration / (gridDivision / 4);

    // Snap transients to nearest grid position
    return transients.map((transient) => ({
      ...transient,
      time: Math.round(transient.time / gridInterval) * gridInterval,
    }));
  }

  /**
   * Auto-slice buffer at grid positions
   */
  static sliceToGrid(
    buffer: AudioBuffer,
    bpm: number,
    gridDivision: number = 16
  ): number[] {
    const beatDuration = 60 / bpm;
    const gridInterval = beatDuration / (gridDivision / 4);
    const slices: number[] = [];

    for (let time = 0; time < buffer.duration; time += gridInterval) {
      slices.push(time);
    }

    return slices;
  }

  /**
   * Get strongest transients up to a maximum count
   */
  static getStrongestTransients(
    transients: Transient[],
    maxCount: number
  ): Transient[] {
    return transients
      .sort((a, b) => b.strength - a.strength)
      .slice(0, maxCount);
  }
}
