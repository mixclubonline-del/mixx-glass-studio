/**
 * Headroom Model (Auto Gain Stage)
 * 
 * Layer 4.5 of the Flow Import Core.
 * Flow must auto-level imports so every song starts at the same engineering baseline.
 * 
 * Flow Impact:
 * - Sets track levels
 * - Avoids clipping
 * - Preps Velvet Curve better
 * - Warms ALS Dynamics
 */

export interface HeadroomAnalysis {
  peakDB: number; // Peak level in dBFS
  rmsDB: number; // RMS level in dBFS
  targetGain: number; // Gain multiplier to reach target headroom
  peakSample: number; // Peak sample value (0-1)
  needsGainReduction: boolean; // True if audio is too hot
  needsGainBoost: boolean; // True if audio is too quiet
}

/**
 * Compute headroom analysis and target gain for auto-leveling.
 * 
 * @param buffer - Audio buffer to analyze
 * @param targetPeakDB - Target peak level in dBFS (default -12)
 * @returns Headroom analysis with target gain
 */
export function computeHeadroom(
  buffer: AudioBuffer,
  targetPeakDB: number = -12
): HeadroomAnalysis {
  const channel = buffer.getChannelData(0);
  
  // Find peak level
  let peak = 0;
  let sumSquares = 0;
  
  for (let i = 0; i < channel.length; i++) {
    const abs = Math.abs(channel[i]);
    peak = Math.max(peak, abs);
    sumSquares += channel[i] * channel[i];
  }
  
  // Calculate RMS
  const rms = Math.sqrt(sumSquares / channel.length);
  
  // Convert to dBFS
  const peakDB = 20 * Math.log10(peak || 0.0001);
  const rmsDB = 20 * Math.log10(rms || 0.0001);
  
  // Calculate target gain to reach target peak level
  const neededDB = targetPeakDB - peakDB;
  const gain = Math.pow(10, neededDB / 20);
  
  // Clamp gain to reasonable range (0.1x to 10x)
  const clampedGain = Math.max(0.1, Math.min(10, gain));
  
  return {
    peakDB,
    rmsDB,
    targetGain: clampedGain,
    peakSample: peak,
    needsGainReduction: peakDB > targetPeakDB,
    needsGainBoost: peakDB < targetPeakDB - 6, // More than 6dB below target
  };
}

/**
 * Apply headroom gain to audio buffer.
 * 
 * @param buffer - Audio buffer to process
 * @param gain - Gain multiplier (from computeHeadroom)
 * @returns New audio buffer with gain applied
 */
export async function applyHeadroomGain(
  buffer: AudioBuffer,
  gain: number
): Promise<AudioBuffer> {
  // If gain is close to 1.0, return original buffer
  if (Math.abs(gain - 1.0) < 0.01) {
    return buffer;
  }
  
  // Create new buffer with same properties
  const newBuffer = new AudioBuffer({
    length: buffer.length,
    numberOfChannels: buffer.numberOfChannels,
    sampleRate: buffer.sampleRate,
  });
  
  // Apply gain to each channel
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const inputData = buffer.getChannelData(channel);
    const outputData = newBuffer.getChannelData(channel);
    
    for (let i = 0; i < inputData.length; i++) {
      outputData[i] = inputData[i] * gain;
    }
  }
  
  return newBuffer;
}

