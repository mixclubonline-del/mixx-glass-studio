/**
 * Region Playback Engine
 * Handles region-based audio playback synchronized with Prime Brain
 */

import { useTracksStore } from '@/store/tracksStore';
import { Region } from '@/types/timeline';
import { primeBrain } from '@/ai/primeBrain';

interface ActiveSource {
  source: AudioBufferSourceNode;
  gain: GainNode;
  regionId: string;
  startedAt: number;
}

export class RegionPlaybackEngine {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private activeSources: Map<string, ActiveSource> = new Map();
  private lastTime: number = 0;
  private isInitialized: boolean = false;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.75;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Initialize and start listening to Prime Brain
   */
  initialize() {
    if (this.isInitialized) return;
    
    primeBrain.subscribe((time, deltaTime) => {
      this.update(time);
    });
    
    this.isInitialized = true;
  }

  /**
   * Update playback state based on current time
   */
  private update(currentTime: number) {
    if (!primeBrain.getIsRunning()) {
      this.stopAll();
      return;
    }

    const { regions, tracks } = useTracksStore.getState();

    // Check each region
    regions.forEach(region => {
      if (!region.audioBuffer || region.muted) return;

      const track = tracks.find(t => t.id === region.trackId);
      if (!track || track.muted) return;

      const regionStart = region.startTime;
      const regionEnd = region.startTime + region.duration;

      const shouldBePlaying = currentTime >= regionStart && currentTime < regionEnd;
      const isPlaying = this.activeSources.has(region.id);

      // Start region if we crossed its start point
      if (shouldBePlaying && !isPlaying && (currentTime > this.lastTime || Math.abs(currentTime - regionStart) < 0.05)) {
        this.startRegion(region, track, currentTime);
      }

      // Stop region if we passed its end
      if (!shouldBePlaying && isPlaying) {
        this.stopRegion(region.id);
      }
    });

    this.lastTime = currentTime;
  }

  /**
   * Start playing a region
   */
  private startRegion(region: Region, track: any, currentTime: number) {
    try {
      // Resume audio context if suspended
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const source = this.audioContext.createBufferSource();
      source.buffer = region.audioBuffer;

      // Apply region gain and track volume
      const gainNode = this.audioContext.createGain();
      const trackVolume = track.volume ?? 0.8;
      const regionGain = region.gain ?? 1;
      gainNode.gain.value = regionGain * trackVolume;

      // Apply fade-in
      if (region.fadeIn > 0) {
        const fadeInDuration = Math.min(region.fadeIn, region.duration);
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
          regionGain * trackVolume,
          this.audioContext.currentTime + fadeInDuration
        );
      }

      // Apply fade-out
      if (region.fadeOut > 0) {
        const fadeOutStart = this.audioContext.currentTime + (region.duration - (currentTime - region.startTime)) - region.fadeOut;
        if (fadeOutStart > this.audioContext.currentTime) {
          gainNode.gain.setValueAtTime(regionGain * trackVolume, fadeOutStart);
          gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + region.fadeOut);
        }
      }

      // Connect: source -> gain -> master
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Calculate offset into buffer
      const offsetIntoRegion = Math.max(0, currentTime - region.startTime);
      const bufferStartTime = (region.bufferOffset ?? 0) + offsetIntoRegion;
      const duration = Math.min(region.duration - offsetIntoRegion, region.audioBuffer.duration - bufferStartTime);

      // Validate timing
      if (bufferStartTime >= region.audioBuffer.duration || duration <= 0) {
        console.warn('Invalid region timing:', { bufferStartTime, duration, regionId: region.id });
        return;
      }

      // Start playback
      const when = this.audioContext.currentTime;
      source.start(when, bufferStartTime, duration);

      // Store active source
      this.activeSources.set(region.id, {
        source,
        gain: gainNode,
        regionId: region.id,
        startedAt: currentTime
      });

      // Clean up when done
      source.onended = () => {
        this.stopRegion(region.id);
      };

      console.log(`🎵 Started region: ${region.name} at ${currentTime.toFixed(2)}s (offset: ${bufferStartTime.toFixed(2)}s, duration: ${duration.toFixed(2)}s)`);
    } catch (error) {
      console.error('Failed to start region:', region.id, error);
    }
  }

  /**
   * Stop a specific region
   */
  private stopRegion(regionId: string) {
    const activeSource = this.activeSources.get(regionId);
    if (activeSource) {
      try {
        activeSource.source.stop();
        activeSource.source.disconnect();
        activeSource.gain.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.activeSources.delete(regionId);
    }
  }

  /**
   * Stop all playing regions
   */
  stopAll() {
    this.activeSources.forEach((source, id) => {
      this.stopRegion(id);
    });
  }

  /**
   * Seek to a new time (stop all and restart on next update)
   */
  seek(time: number) {
    this.stopAll();
    this.lastTime = time;
  }

  /**
   * Set master volume
   */
  setMasterVolume(volume: number) {
    this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get master volume
   */
  getMasterVolume(): number {
    return this.masterGain.gain.value;
  }

  /**
   * Dispose engine
   */
  dispose() {
    this.stopAll();
    this.masterGain.disconnect();
    this.audioContext.close();
  }
}

// Singleton instance
export const regionPlaybackEngine = new RegionPlaybackEngine();
