/**
 * File Reader & Prep Layer
 * 
 * Layer 1 of the Stem Separation Engine.
 * Normalizes input, detects sample rate, mono/stereo, etc.
 * Prepares raw audio buffer for stem separation pipeline.
 */

export interface AudioFileInfo {
  name?: string;
  size?: number;
  type?: string;
  sampleRate: number;
  channels: number;
  duration: number; // milliseconds
  length: number; // samples
  format?: string; // 'mp3', 'wav', 'm4a', etc.
}

export interface PreparedAudio {
  audioBuffer: AudioBuffer;
  info: AudioFileInfo;
}

/**
 * Prepare audio file for stem separation.
 * 
 * Flow-safe version: Uses AudioContext for decoding (never OfflineAudioContext).
 * This prevents "OfflineAudioContext stopped state" errors.
 * 
 * @param file - File object from input
 * @returns Prepared audio buffer and metadata
 */
export async function prepAudioFile(file: File): Promise<PreparedAudio> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Use normal AudioContext for decoding (never offline)
  // This is safe and restartable under HMR
  const ctx = new AudioContext();
  
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
  
  // Extract file format from extension
  const format = file.name.split('.').pop()?.toLowerCase() || 'unknown';
  
  const info: AudioFileInfo = {
    name: file.name,
    size: file.size,
    type: file.type,
    sampleRate: audioBuffer.sampleRate,
    channels: audioBuffer.numberOfChannels,
    duration: audioBuffer.duration * 1000, // Convert to milliseconds
    length: audioBuffer.length,
    format,
  };
  
  return { audioBuffer, info };
}

/**
 * Convert AudioBuffer to mono if needed.
 * Many stem separation algorithms work better with mono input.
 */
export async function toMono(audioBuffer: AudioBuffer): Promise<AudioBuffer> {
  if (audioBuffer.numberOfChannels === 1) {
    return audioBuffer;
  }
  
  const ctx = new OfflineAudioContext(
    1,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Ensure context is in valid state before rendering
  if (ctx.state === 'closed') {
    console.warn('[FLOW IMPORT] OfflineAudioContext was closed in toMono, returning original buffer');
    return audioBuffer;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Sum all channels into mono
  const merger = ctx.createChannelMerger(1);
  source.connect(merger);
  merger.connect(ctx.destination);
  
  source.start();
  
  try {
    return await ctx.startRendering();
  } catch (error) {
    // If context is stopped/closed, return original buffer
    if (ctx.state === 'closed' || ctx.state === 'suspended') {
      console.warn('[FLOW IMPORT] OfflineAudioContext in invalid state in toMono:', ctx.state);
      return audioBuffer;
    }
    throw error;
  }
}

/**
 * Normalize audio buffer to target peak level.
 * 
 * Flow-safe with timeout protection to prevent hanging.
 * 
 * @param audioBuffer - Input buffer
 * @param targetPeak - Target peak level (0-1, default 0.95)
 * @returns Normalized buffer
 */
export async function normalizeBuffer(
  audioBuffer: AudioBuffer,
  targetPeak: number = 0.95
): Promise<AudioBuffer> {
  // Find peak level
  let peak = 0;
  const sampleCount = Math.min(audioBuffer.length, 44100 * 10); // Sample first 10 seconds for speed
  for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
    const channelData = audioBuffer.getChannelData(channel);
    for (let i = 0; i < sampleCount; i++) {
      peak = Math.max(peak, Math.abs(channelData[i]));
    }
  }
  
  if (peak === 0 || peak >= targetPeak) {
    return audioBuffer; // Already normalized or silent
  }
  
  const gain = targetPeak / peak;
  
  // Estimate processing time (rough: 1 second of audio = ~100ms processing)
  const estimatedMs = Math.max(5000, (audioBuffer.duration * 100) * 2); // 2x safety margin
  const timeoutMs = Math.min(30000, estimatedMs); // Cap at 30 seconds
  
  const ctx = new OfflineAudioContext(
    audioBuffer.numberOfChannels,
    audioBuffer.length,
    audioBuffer.sampleRate
  );
  
  // Ensure context is in 'suspended' state before rendering
  if (ctx.state === 'closed') {
    console.warn('[FLOW IMPORT] OfflineAudioContext was closed, returning original buffer');
    return audioBuffer;
  }
  
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  const gainNode = ctx.createGain();
  gainNode.gain.value = gain;
  
  source.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  source.start();
  
  // Add timeout protection with cancellation
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const renderPromise = ctx.startRendering().catch((error) => {
    // If context is stopped/closed, return original buffer
    if (ctx.state === 'closed' || ctx.state === 'suspended') {
      console.warn('[FLOW IMPORT] OfflineAudioContext in invalid state for rendering:', ctx.state);
      return audioBuffer;
    }
    throw error;
  });
  const timeoutPromise = new Promise<AudioBuffer>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Normalization timeout after ${timeoutMs}ms (file may be too large)`));
    }, timeoutMs);
  });
  
  try {
    const result = await Promise.race([renderPromise, timeoutPromise]);
    // Cancel timeout if render completed
    if (timeoutId) clearTimeout(timeoutId);
    return result;
  } catch (error) {
    // Cancel timeout on error
    if (timeoutId) clearTimeout(timeoutId);
    console.error('[FLOW IMPORT] Normalization error:', error);
    // Return original buffer if normalization fails
    return audioBuffer;
  }
}

