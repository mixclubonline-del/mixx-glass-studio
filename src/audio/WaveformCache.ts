/**
 * Waveform cache - generates and caches waveform peaks for efficient rendering
 */

export class WaveformCache {
  private cache: Map<string, Float32Array> = new Map();
  
  /**
   * Generate waveform peaks from audio buffer
   * @param buffer - AudioBuffer to process
   * @param samplesPerPixel - How many audio samples per visual pixel
   * @returns Float32Array of peak values (min/max pairs)
   */
  generatePeaks(buffer: AudioBuffer, samplesPerPixel: number = 512): Float32Array {
    const channelData = buffer.getChannelData(0); // Use first channel
    const totalSamples = channelData.length;
    const numPeaks = Math.ceil(totalSamples / samplesPerPixel);
    const peaks = new Float32Array(numPeaks * 2); // min/max pairs
    
    for (let i = 0; i < numPeaks; i++) {
      const start = i * samplesPerPixel;
      const end = Math.min(start + samplesPerPixel, totalSamples);
      
      let min = 1.0;
      let max = -1.0;
      
      for (let j = start; j < end; j++) {
        const sample = channelData[j];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }
    
    return peaks;
  }
  
  /**
   * Get or generate cached peaks for a region
   * Phase 3: Enhanced with adaptive quality based on zoom
   */
  getPeaks(regionId: string, buffer: AudioBuffer, zoom: number): Float32Array {
    const cacheKey = `${regionId}-${Math.round(zoom)}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    
    // Generate peaks based on zoom level with adaptive quality
    // High zoom (zoomed in) = more detail, low zoom (zoomed out) = less detail
    const samplesPerPixel = Math.max(128, Math.floor(buffer.sampleRate / zoom));
    const peaks = this.generatePeaks(buffer, samplesPerPixel);
    
    this.cache.set(cacheKey, peaks);
    
    // Auto-cleanup if cache gets too large (> 100 entries)
    if (this.cache.size > 100) {
      const keysToDelete = Array.from(this.cache.keys()).slice(0, 20);
      keysToDelete.forEach(key => this.cache.delete(key));
    }
    
    return peaks;
  }
  
  /**
   * Clear cache for a specific region or all regions
   */
  clear(regionId?: string) {
    if (regionId) {
      // Clear all zoom levels for this region
      for (const key of this.cache.keys()) {
        if (key.startsWith(regionId)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * Get cache size
   */
  getSize(): number {
    return this.cache.size;
  }
}

// Global singleton instance
export const waveformCache = new WaveformCache();
