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
  audioContext: AudioContext;
  private masterGain: GainNode;
  private activeSources: Map<string, ActiveSource> = new Map();
  private scheduledRegions: Set<string> = new Set();
  private scheduleAheadTime = 0.1; // 100ms look-ahead
  private lastTime: number = 0;

  constructor() {
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0.75;
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Update playback state - called by ProjectContext with sample-accurate time
   */
  update(currentTimeSamples: number) {
    if (!primeBrain.getIsRunning()) {
      this.stopAll();
      return;
    }

    const sr = this.audioContext.sampleRate;
    const currentTimeSeconds = currentTimeSamples / sr;
    const scheduleUntil = currentTimeSeconds + this.scheduleAheadTime;

    const { regions, tracks } = useTracksStore.getState();

    regions.forEach(region => {
      if (!region.audioBuffer || region.muted) return;
      
      const track = tracks.find(t => t.id === region.trackId);
      if (!track || track.muted) return;

      const regionStartSec = region.startTime;
      const regionEndSec = regionStartSec + region.duration;

      // Schedule if region starts in look-ahead window
      const inWindow = regionStartSec >= currentTimeSeconds && regionStartSec < scheduleUntil;
      const notScheduled = !this.scheduledRegions.has(region.id);
      
      if (inWindow && notScheduled) {
        this.scheduleRegion(region, track, currentTimeSamples);
        this.scheduledRegions.add(region.id);
      }

      // Clean up if region ended
      if (currentTimeSeconds >= regionEndSec && this.activeSources.has(region.id)) {
        this.stopRegion(region.id);
        this.scheduledRegions.delete(region.id);
      }
    });

    this.lastTime = currentTimeSeconds;
  }

  /**
   * Schedule a region to play in the future (sample-accurate)
   */
  private scheduleRegion(region: Region, track: any, nowSamples: number) {
    try {
      const sr = this.audioContext.sampleRate;
      const nowSeconds = nowSamples / sr;
      
      const source = this.audioContext.createBufferSource();
      source.buffer = region.audioBuffer;

      // Apply region gain and track volume
      const gainNode = this.audioContext.createGain();
      const trackVolume = track.volume ?? 0.8;
      const regionGain = region.gain ?? 1;
      gainNode.gain.value = regionGain * trackVolume;

      // Connect: source -> gain -> master
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Calculate EXACT start time
      const regionStartSeconds = region.startTime;
      const deltaSeconds = regionStartSeconds - nowSeconds;
      const whenToStart = this.audioContext.currentTime + deltaSeconds;

      // Buffer offset
      const bufferOffset = region.bufferOffset ?? 0;
      const duration = Math.min(region.duration, region.audioBuffer.duration - bufferOffset);

      // Validate timing
      if (bufferOffset >= region.audioBuffer.duration || duration <= 0) {
        console.warn('Invalid region timing:', { bufferOffset, duration, regionId: region.id });
        return;
      }

      // START IN THE FUTURE (sample-accurate)
      source.start(whenToStart, bufferOffset, duration);

      // Store active source
      this.activeSources.set(region.id, {
        source,
        gain: gainNode,
        regionId: region.id,
        startedAt: regionStartSeconds
      });

      // Clean up when done
      source.onended = () => {
        this.stopRegion(region.id);
        this.scheduledRegions.delete(region.id);
      };

      console.log(`🎵 Scheduled: ${region.name} at +${(deltaSeconds * 1000).toFixed(1)}ms`);
    } catch (error) {
      console.error('Schedule failed:', region.id, error);
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
    this.scheduledRegions.clear();
  }

  /**
   * Seek to a new time (stop all and restart on next update)
   */
  seek(time: number) {
    this.stopAll();
    this.scheduledRegions.clear();
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
