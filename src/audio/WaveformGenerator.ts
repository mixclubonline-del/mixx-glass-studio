/**
 * Waveform Generator - Generates peak data for audio files
 */

export interface AudioFileData {
  buffer: AudioBuffer;
  peaks: Float32Array; // interleaved min/max per bin
  bins: number;
  duration: number;
  sampleRate: number;
  channels: number;
}

export class WaveformGenerator {
  private audioContext: AudioContext;

  constructor(audioContext?: AudioContext) {
    this.audioContext = audioContext || new AudioContext();
  }

  /**
   * Load audio file and generate waveform peaks
   */
  async loadAudioFile(file: File): Promise<AudioFileData> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Generate peaks for visualization
      const bins = 2048;
      const peaks = this.computePeaks(buffer.getChannelData(0), buffer.length, bins);

      return {
        buffer,
        peaks,
        bins,
        duration: buffer.duration,
        sampleRate: buffer.sampleRate,
        channels: buffer.numberOfChannels,
      };
    } catch (error) {
      console.error('Error loading audio file:', error);
      throw error;
    }
  }

  /**
   * Compute min/max peaks for a channel
   * Returns interleaved [min, max, min, max, ...]
   */
  private computePeaks(
    channelData: Float32Array,
    totalSamples: number,
    bins: number
  ): Float32Array {
    const samplesPerBin = Math.max(1, Math.floor(totalSamples / bins));
    const peaks = new Float32Array(bins * 2);

    for (let i = 0; i < bins; i++) {
      const start = i * samplesPerBin;
      const end = Math.min(totalSamples, start + samplesPerBin);
      
      let min = 1.0;
      let max = -1.0;

      for (let j = start; j < end; j++) {
        const value = channelData[j];
        if (value < min) min = value;
        if (value > max) max = value;
      }

      peaks[i * 2] = min;
      peaks[i * 2 + 1] = max;
    }

    return peaks;
  }

  /**
   * Generate peaks at different resolutions for zoom levels
   */
  async generateMultiResPeaks(
    buffer: AudioBuffer,
    resolutions: number[] = [256, 512, 1024, 2048, 4096]
  ): Promise<Map<number, Float32Array>> {
    const peakMap = new Map<number, Float32Array>();
    const channelData = buffer.getChannelData(0);
    
    for (const resolution of resolutions) {
      const peaks = this.computePeaks(channelData, buffer.length, resolution);
      peakMap.set(resolution, peaks);
    }

    return peakMap;
  }

  /**
   * Get appropriate peak resolution based on zoom level
   */
  static getOptimalResolution(zoomLevel: number): number {
    if (zoomLevel < 50) return 256;
    if (zoomLevel < 100) return 512;
    if (zoomLevel < 200) return 1024;
    if (zoomLevel < 300) return 2048;
    return 4096;
  }

  dispose() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
