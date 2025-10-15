/**
 * Audio Playback Coordinator
 * Handles region-based audio playback synchronized with transport
 */

import { AudioEngine } from './AudioEngine';
import { useTracksStore } from '@/store/tracksStore';
import { useMixerStore } from '@/store/mixerStore';
import { Region } from '@/types/timeline';

export class AudioPlaybackCoordinator {
  private audioEngine: AudioEngine;
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private activeRegions: Map<string, { source: AudioBufferSourceNode; gain: GainNode }> = new Map();
  private lastTime: number = 0;
  private isPlaying: boolean = false;

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.audioContext = new AudioContext();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  /**
   * Update playback state - call this every frame during playback
   */
  update(currentTime: number) {
    if (!this.isPlaying) return;

    const regions = useTracksStore.getState().regions;

    // Check each region to see if we need to start or stop it
    regions.forEach(region => {
      const regionStart = region.startTime;
      const regionEnd = region.startTime + region.duration;

      // Check if region should be playing
      const shouldBePlaying = currentTime >= regionStart && currentTime < regionEnd;
      const wasPlaying = this.activeRegions.has(region.id);

      // Start region if we crossed its start point
      if (shouldBePlaying && !wasPlaying) {
        this.startRegion(region, currentTime);
      }

      // Stop region if we passed its end
      if (!shouldBePlaying && wasPlaying) {
        this.stopRegion(region.id);
      }
    });

    this.lastTime = currentTime;
  }

  /**
   * Start playing a region
   */
  private startRegion(region: Region, currentTime: number) {
    if (!region.audioBuffer || region.muted) return;

    const track = useTracksStore.getState().tracks.find(t => t.id === region.trackId);
    if (!track || track.muted) return;

    try {
      const source = this.audioContext.createBufferSource();
      source.buffer = region.audioBuffer;

      // Apply region gain and track volume
      const gainNode = this.audioContext.createGain();
      gainNode.gain.value = region.gain * (track.volume ?? 1);

      // Connect: source -> gain -> master
      source.connect(gainNode);
      gainNode.connect(this.masterGain);

      // Calculate offset into buffer
      const offsetIntoRegion = currentTime - region.startTime;
      const bufferStartTime = region.bufferOffset + offsetIntoRegion;
      const duration = region.duration - offsetIntoRegion;

      // Start playback
      source.start(this.audioContext.currentTime, bufferStartTime, duration);

      // Store active source
      this.activeRegions.set(region.id, { source, gain: gainNode });

      // Clean up when done
      source.onended = () => {
        this.stopRegion(region.id);
      };
    } catch (error) {
      console.error('Failed to start region:', region.id, error);
    }
  }

  /**
   * Stop a region
   */
  private stopRegion(regionId: string) {
    const nodes = this.activeRegions.get(regionId);
    if (nodes) {
      try {
        nodes.source.stop();
        nodes.source.disconnect();
        nodes.gain.disconnect();
      } catch (e) {
        // Already stopped
      }
      this.activeRegions.delete(regionId);
    }
  }

  /**
   * Start playback
   */
  play(fromTime: number = 0) {
    this.isPlaying = true;
    this.lastTime = fromTime;
  }

  /**
   * Pause playback
   */
  pause() {
    this.isPlaying = false;
    // Stop all active regions
    this.activeRegions.forEach((source, id) => {
      this.stopRegion(id);
    });
  }

  /**
   * Stop playback and reset
   */
  stop() {
    this.pause();
    this.lastTime = 0;
  }

  /**
   * Seek to a new time
   */
  seek(time: number) {
    // Stop all playing regions
    this.activeRegions.forEach((source, id) => {
      this.stopRegion(id);
    });
    this.lastTime = time;

    // If playing, regions will restart on next update
  }

  /**
   * Sync tracks with mixer channels
   */
  syncTracksToMixer() {
    const tracks = useTracksStore.getState().tracks;
    const { addChannel } = useMixerStore.getState();

    tracks.forEach(track => {
      addChannel({
        id: track.id,
        name: track.name,
        volume: track.volume ?? 0.75,
        pan: track.pan ?? 0,
        muted: track.muted,
        solo: track.solo,
        color: track.color || '#8B5CF6',
        peakLevel: { left: -60, right: -60 },
        sends: new Map()
      });
    });
  }

  /**
   * Dispose coordinator
   */
  dispose() {
    this.stop();
    this.activeRegions.clear();
  }
}
