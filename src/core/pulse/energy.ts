/**
 * Energy Profile Extraction
 * 
 * Layer 5.1 of Flow Pulse Engine.
 * Computes RMS (root-mean-square) energy in blocks.
 * 
 * Fast, pure math, no audio context, 100% Flow-safe.
 */

/**
 * Compute energy profile from audio buffer.
 * 
 * @param buffer - Audio buffer to analyze
 * @param blockSize - Size of each energy block in samples (default 1024)
 * @returns Array of RMS energy values (one per block)
 */
export function computeEnergyProfile(
  buffer: AudioBuffer,
  blockSize: number = 1024
): number[] {
  const channel = buffer.getChannelData(0);
  const energy: number[] = [];
  
  // Process buffer in blocks
  for (let i = 0; i < channel.length; i += blockSize) {
    let sum = 0;
    let count = 0;
    
    // Compute RMS for this block
    for (let j = 0; j < blockSize && (i + j) < channel.length; j++) {
      const s = channel[i + j] || 0;
      sum += s * s;
      count++;
    }
    
    // RMS = sqrt(mean of squares)
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    energy.push(rms);
  }
  
  return energy;
}

/**
 * Compute energy profile with multi-channel support.
 * 
 * @param buffer - Audio buffer to analyze
 * @param blockSize - Size of each energy block in samples (default 1024)
 * @returns Array of RMS energy values (averaged across channels)
 */
export function computeEnergyProfileMultiChannel(
  buffer: AudioBuffer,
  blockSize: number = 1024
): number[] {
  const numChannels = buffer.numberOfChannels;
  const length = buffer.length;
  const energy: number[] = [];
  
  // Process buffer in blocks
  for (let i = 0; i < length; i += blockSize) {
    let sum = 0;
    let count = 0;
    
    // Compute RMS across all channels for this block
    for (let j = 0; j < blockSize && (i + j) < length; j++) {
      let channelSum = 0;
      
      // Sum across all channels
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer.getChannelData(ch);
        const s = channelData[i + j] || 0;
        channelSum += s * s;
      }
      
      // Average across channels
      sum += channelSum / numChannels;
      count++;
    }
    
    // RMS = sqrt(mean of squares)
    const rms = count > 0 ? Math.sqrt(sum / count) : 0;
    energy.push(rms);
  }
  
  return energy;
}

