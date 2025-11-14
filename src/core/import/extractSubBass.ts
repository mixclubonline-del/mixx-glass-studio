/**
 * Sub/Bass Extraction Layer
 * 
 * Layer 5 of the Stem Separation Engine.
 * Hip-hop first - bass matters more than anything.
 * 
 * Extracts 808s, subs, and low-frequency content.
 */

/**
 * Extract sub-bass content (typically 20-140Hz).
 * 
 * @param audioBuffer - Input audio buffer
 * @param cutoffFreq - Low-pass cutoff frequency (default 140Hz)
 * @returns Isolated sub-bass buffer
 */
export async function extractSubBass(
  audioBuffer: AudioBuffer,
  cutoffFreq: number = 140
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Low-pass filter to isolate sub-bass
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(cutoffFreq, 0);
  lp.Q.setValueAtTime(1.0, 0); // Moderate resonance
  
  // Optional: Add slight gain boost for 808s
  const gain = ctx.createGain();
  gain.gain.value = 1.1; // 10% boost
  
  source.connect(lp);
  lp.connect(gain);
  gain.connect(ctx.destination);
  
  source.start(0);
  
  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FLOW IMPORT] Sub-bass extraction failed, returning original buffer:', error);
    return audioBuffer;
  }
}

/**
 * Extract bass content (typically 40-250Hz).
 * Wider range than sub-bass, includes bass guitars and synth bass.
 */
export async function extractBass(
  audioBuffer: AudioBuffer,
  cutoffFreq: number = 250
): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Band-pass filter for bass range
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.setValueAtTime(cutoffFreq, 0);
  bp.Q.setValueAtTime(1.0, 0);
  
  source.connect(bp);
  bp.connect(ctx.destination);
  
  source.start(0);
  
  try {
    return await ctx.startRendering();
  } catch (error) {
    console.warn('[FLOW IMPORT] Bass extraction failed, returning original buffer:', error);
    return audioBuffer;
  }
}

/**
 * Extract 808-style sub content (very low, 20-80Hz).
 * Specifically tuned for trap/hip-hop 808s.
 */
export async function extract808(
  audioBuffer: AudioBuffer
): Promise<AudioBuffer> {
  return extractSubBass(audioBuffer, 80);
}

