/**
 * FLOW STEM INTEGRATION
 * 
 * Integration layer for Flow-native stem separation.
 * Matches the interface expected by the import workflow.
 */

import FlowStemSeparation from './flowStemSeparation';
import { classifyAudio, AudioClassification } from './classifier';
import { ArrangeClip } from '../../hooks/useArrange';
import { TrackData, MixerSettings } from '../../App';
import type { StemResult } from './stemEngine';

export interface FlowStemImportResult {
  success: boolean;
  stems: StemResult | null;
  newTracks: TrackData[];
  newClips: ArrangeClip[];
  newBuffers: { [key: string]: AudioBuffer };
  mixerSettings: { [key: string]: MixerSettings };
  error?: string;
}

const STEM_GROUP_MAP: Record<string, TrackData['group']> = {
  vocals: 'Vocals',
  drums: 'Drums',
  bass: 'Bass',
  music: 'Instruments',
  perc: 'Drums',
  harmonic: 'Instruments',
  sub: 'Bass',
};

const STEM_COLOR_MAP: Record<string, TrackData['trackColor']> = {
  vocals: 'magenta',
  drums: 'blue',
  bass: 'green',
  music: 'cyan',
  perc: 'blue',
  harmonic: 'purple',
  sub: 'green',
};

const TRACK_COLOR_SWATCH: Record<TrackData['trackColor'], string> = {
  cyan: '#06b6d4',
  magenta: '#d946ef',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
  crimson: '#f43f5e',
};

export class FlowStemIntegration {
  private flowSeparator: FlowStemSeparation;
  private progressCallbacks: ((message: string, percent: number) => void)[] = [];

  constructor(audioContext: AudioContext) {
    this.flowSeparator = new FlowStemSeparation(audioContext);
  }

  /**
   * Import audio with Flow-native stem separation
   */
  async importAudioWithStemSeparation(
    audioBuffer: AudioBuffer,
    fileName: string,
    startTrackIndex = 0,
    startTime = 0,
    enableStemSeparation: boolean = true,
    allowedStemKeys?: string[]
  ): Promise<FlowStemImportResult> {
    try {
      this.notifyProgress('Flow is analyzing the mix...', 10);

      const result: FlowStemImportResult = {
        success: false,
        stems: null,
        newTracks: [],
        newClips: [],
        newBuffers: {},
        mixerSettings: {},
      };

      if (enableStemSeparation) {
        this.notifyProgress('Separating stems using Five Pillars...', 20);
        
        try {
          // Log filename for debugging classification issues
          console.log('[FLOW STEMS] Processing file:', fileName);
          // Use Flow separation
          const stems = await this.flowSeparator.separate(audioBuffer, 'auto');
          result.stems = stems;
          
          this.notifyProgress('Creating tracks from stems...', 70);
          
          // Create tracks from stems
          const stemCreationResult = this.createStemTracks(
            stems,
            fileName,
            startTrackIndex,
            startTime,
            allowedStemKeys
          );
          
          result.newTracks = stemCreationResult.tracks;
          result.newClips = stemCreationResult.clips;
          result.newBuffers = stemCreationResult.buffers;
          result.mixerSettings = stemCreationResult.mixerSettings;
        } catch (stemError) {
          console.warn('[FLOW STEMS] Separation failed, falling back to single track:', stemError);
          const fallbackResult = this.createSingleTrackImport(
            audioBuffer,
            fileName,
            startTrackIndex,
            startTime
          );
          result.newTracks = fallbackResult.tracks;
          result.newClips = fallbackResult.clips;
          result.newBuffers = fallbackResult.buffers;
          result.mixerSettings = fallbackResult.mixerSettings;
        }
      } else {
        this.notifyProgress('Creating single track...', 30);
        const singleResult = this.createSingleTrackImport(
          audioBuffer,
          fileName,
          startTrackIndex,
          startTime
        );
        result.newTracks = singleResult.tracks;
        result.newClips = singleResult.clips;
        result.newBuffers = singleResult.buffers;
        result.mixerSettings = singleResult.mixerSettings;
      }

      result.success = result.newClips.length > 0;
      this.notifyProgress('Flow separation complete', 100);
      return result;
    } catch (error) {
      console.error('[FLOW STEMS] Integration failed:', error);
      return {
        success: false,
        stems: null,
        newTracks: [],
        newClips: [],
        newBuffers: {},
        mixerSettings: {},
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create tracks from separated stems
   */
  private createStemTracks(
    stems: StemResult,
    fileName: string,
    startTrackIndex: number,
    startTime: number,
    allowedStemKeys?: string[]
  ) {
    const tracks: TrackData[] = [];
    const clips: ArrangeClip[] = [];
    const buffers: { [key: string]: AudioBuffer } = {};
    const mixerSettings: { [key: string]: MixerSettings } = {};

    const allowedSet = allowedStemKeys 
      ? new Set(allowedStemKeys.map((k) => k.toLowerCase())) 
      : null;

    const stemEntries: Array<[string, AudioBuffer | null]> = [
      ['vocals', stems.vocals],
      ['drums', stems.drums],
      ['bass', stems.bass],
      ['music', stems.music],
      ['perc', stems.perc],
      ['harmonic', stems.harmonic],
      ['sub', stems.sub],
    ];

    const baseName = fileName.replace(/\.[^/.]+$/, '').toUpperCase();
    const timestamp = Date.now();
    let index = 0;

    stemEntries.forEach(([stemKey, stemBuffer]) => {
      if (!stemBuffer) return;
      
      const lowerKey = stemKey.toLowerCase();
      
      // Check if this stem is allowed
      if (allowedSet && !allowedSet.has(lowerKey)) {
        return;
      }

      const color = STEM_COLOR_MAP[lowerKey] ?? 'cyan';
      const group = STEM_GROUP_MAP[lowerKey] ?? 'Instruments';

      const trackId = `track-flow-${timestamp}-${stemKey}-${index}`;
      const bufferId = `buffer-flow-${timestamp}-${stemKey}-${index}`;

      const track: TrackData = {
        id: trackId,
        trackName: `${baseName} - ${stemKey.toUpperCase()}`,
        trackColor: color,
        waveformType: 'varied',
        group,
        role: 'standard',
        locked: false,
      };
      tracks.push(track);

      const clip: ArrangeClip = {
        id: `clip-flow-${timestamp}-${stemKey}-${index}`,
        trackId,
        name: stemKey.toUpperCase(),
        color: TRACK_COLOR_SWATCH[color],
        start: startTime,
        duration: stemBuffer.duration,
        originalDuration: stemBuffer.duration,
        timeStretchRate: 1.0,
        sourceStart: 0,
        fadeIn: 0,
        fadeOut: 0,
        gain: 1.0,
        selected: false,
        bufferId,
      };
      clips.push(clip);
      buffers[bufferId] = stemBuffer;
      mixerSettings[trackId] = { volume: 0.75, pan: 0, isMuted: false };
      index += 1;
    });

    return { tracks, clips, buffers, mixerSettings };
  }

  /**
   * Create single track import (fallback)
   */
  private createSingleTrackImport(
    audioBuffer: AudioBuffer,
    fileName: string,
    startTrackIndex: number,
    startTime: number
  ) {
    const tracks: TrackData[] = [];
    const clips: ArrangeClip[] = [];
    const buffers: { [key: string]: AudioBuffer } = {};
    const mixerSettings: { [key: string]: MixerSettings } = {};

    const trackColors: TrackData['trackColor'][] = ['cyan', 'magenta', 'blue', 'green', 'purple', 'crimson'];
    const color = trackColors[startTrackIndex % trackColors.length];
    const baseName = fileName.replace(/\.[^/.]+$/, '').toUpperCase();
    const timestamp = Date.now();
    const trackId = `track-flow-${timestamp}`;
    const bufferId = `buffer-flow-${timestamp}`;

    const track: TrackData = {
      id: trackId,
      trackName: baseName,
      trackColor: color,
      waveformType: 'varied',
      group: 'Instruments',
      role: 'standard',
      locked: false,
    };
    tracks.push(track);

    const clip: ArrangeClip = {
      id: `clip-flow-${timestamp}`,
      trackId,
      name: baseName,
      color: TRACK_COLOR_SWATCH[color],
      start: startTime,
      duration: audioBuffer.duration,
      originalDuration: audioBuffer.duration,
      timeStretchRate: 1.0,
      sourceStart: 0,
      fadeIn: 0,
      fadeOut: 0,
      gain: 1.0,
      selected: false,
      bufferId,
    };
    clips.push(clip);
    buffers[bufferId] = audioBuffer;
    mixerSettings[trackId] = { volume: 0.75, pan: 0, isMuted: false };

    return { tracks, clips, buffers, mixerSettings };
  }

  onProgress(callback: (message: string, percent: number) => void) {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(message: string, percent: number) {
    this.progressCallbacks.forEach((cb) => cb(message, percent));
  }
}

export default FlowStemIntegration;

