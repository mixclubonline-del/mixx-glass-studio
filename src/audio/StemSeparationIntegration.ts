/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import StemSeparationEngine, { StemSeparationOptions, SeparatedStems } from './StemSeparationEngine';
import { ArrangeClip } from '../hooks/useArrange';
import { TrackData, MixerSettings } from '../App';
import { als } from '../utils/alsFeedback';

export interface StemSeparationConfig {
  autoSeparate: boolean;
  model: StemSeparationOptions['model'];
  createTracksForStems: boolean;
  applyVelvetProcessing: boolean;
}

export interface StemImportResult {
  success: boolean;
  stems: SeparatedStems | null;
  newTracks: TrackData[];
  newClips: ArrangeClip[];
  newBuffers: { [key: string]: AudioBuffer };
  mixerSettings: { [key: string]: MixerSettings };
  error?: string;
}

const STEM_GROUP_MAP: Record<string, TrackData['group']> = {
  vocals: 'Vocals',
  'lead vocals': 'Vocals',
  'backing vocals': 'Harmony',
  drums: 'Drums',
  bass: 'Bass',
  guitar: 'Harmony',
  piano: 'Harmony',
  synths: 'Instruments',
  strings: 'Instruments',
  'other instruments': 'Instruments',
  'sound fx': 'Adlibs',
  other: 'Instruments',
};

const STEM_COLOR_MAP: Record<string, TrackData['trackColor']> = {
  vocals: 'magenta',
  'lead vocals': 'magenta',
  'backing vocals': 'purple',
  drums: 'blue',
  bass: 'green',
  guitar: 'purple',
  piano: 'purple',
  synths: 'cyan',
  strings: 'cyan',
  'other instruments': 'cyan',
  'sound fx': 'cyan',
  other: 'purple',
};

const STEM_CANONICAL_MAP: Record<string, string> = {
  vocals: 'vocals',
  'lead vocals': 'vocals',
  'backing vocals': 'vocals',
  drums: 'drums',
  bass: 'bass',
  guitar: 'guitar',
  piano: 'piano',
  synths: 'other',
  strings: 'other',
  'other instruments': 'other',
  'sound fx': 'other',
  other: 'other',
};

const TRACK_COLOR_SWATCH: Record<TrackData['trackColor'], string> = {
  cyan: '#06b6d4',
  magenta: '#d946ef',
  blue: '#3b82f6',
  green: '#22c55e',
  purple: '#8b5cf6',
  crimson: '#f43f5e',
};

export class StemSeparationIntegration {
  private engine: StemSeparationEngine;
  private audioContext: AudioContext;
  private config: StemSeparationConfig;
  private progressCallbacks: ((progress: string, percent: number) => void)[] = [];

  constructor(audioContext: AudioContext, config: Partial<StemSeparationConfig> = {}) {
    this.audioContext = audioContext;
    this.engine = new StemSeparationEngine(audioContext);
    this.config = {
      autoSeparate: config.autoSeparate ?? true,
      model: config.model ?? 'htdemucs_6stems',
      createTracksForStems: config.createTracksForStems ?? true,
      applyVelvetProcessing: config.applyVelvetProcessing ?? true,
    };

    this.engine.onProgress((progress) => {
      this.notifyProgress(progress.currentStem || 'Processing…', progress.progress);
    });
  }

  prewarm() {
    try {
      (this.engine as any)?.prewarm?.();
    } catch (err) {
      // Prewarm failure is non-critical - fallback will be used
      if (import.meta.env.DEV) {
        als.warning('[STEMS] Integration prewarm failed, fallback will be used');
      }
    }
  }

  async importAudioWithStemSeparation(
    audioBuffer: AudioBuffer,
    fileName: string,
    startTrackIndex = 0,
    startTime = 0,
    enableStemSeparation: boolean = this.config.autoSeparate,
    allowedStemKeys?: string[]
  ): Promise<StemImportResult> {
    try {
      this.notifyProgress('Preparing audio for import…', 10);

      const result: StemImportResult = {
        success: false,
        stems: null,
        newTracks: [],
        newClips: [],
        newBuffers: {},
        mixerSettings: {},
      };

      if (enableStemSeparation) {
        this.notifyProgress('Separating audio into stems…', 15);
        try {
          const stems = await this.engine.separateStems(audioBuffer, {
            model: this.config.model,
            output_format: 'wav',
            normalize: true,
          });
          
          // Validate stems were created
          if (!stems || (!stems.vocals && !stems.drums && !stems.bass && !stems.other)) {
            throw new Error('Stem separation returned empty or invalid stems');
          }
          
          result.stems = stems;
          this.notifyProgress('Stems separated, generating tracks…', 70);
          const stemCreationResult = this.createStemTracks(
            stems,
            fileName,
            startTrackIndex,
            startTime,
            allowedStemKeys
          );
          
          // Validate tracks were created
          if (stemCreationResult.tracks.length === 0 || stemCreationResult.clips.length === 0) {
            // No tracks created - fallback to single track (expected behavior)
            throw new Error('No tracks created from stems');
          }
          
          result.newTracks = stemCreationResult.tracks;
          result.newClips = stemCreationResult.clips;
          result.newBuffers = stemCreationResult.buffers;
          result.mixerSettings = stemCreationResult.mixerSettings;
        } catch (stemError) {
          // Separation failed - fallback to single track (expected behavior)
          als.warning('[STEMS] Separation failed, using single track import');
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
        this.notifyProgress('Creating single track import…', 30);
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
      this.notifyProgress('Import complete', 100);
      return result;
    } catch (error) {
      als.error('[STEMS] Integration failed', error);
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

  private createStemTracks(
    stems: SeparatedStems,
    fileName: string,
    startTrackIndex: number,
    startTime: number,
    allowedStemKeys?: string[]
  ) {
    const tracks: TrackData[] = [];
    const allowedSet = allowedStemKeys ? new Set(allowedStemKeys.map((stem) => stem.toLowerCase())) : null;
    const clips: ArrangeClip[] = [];
    const buffers: { [key: string]: AudioBuffer } = {};
    const mixerSettings: { [key: string]: MixerSettings } = {};

    const stemEntries: Array<[string, AudioBuffer | undefined]> = [
      ['vocals', stems.vocals],
      ['drums', stems.drums],
      ['bass', stems.bass],
      ['other', stems.other],
      ['guitar', stems.guitar],
      ['piano', stems.piano],
    ];

    const baseName = fileName.replace(/\.[^/.]+$/, '').toUpperCase();
    const timestamp = Date.now();
    let index = 0;

    stemEntries.forEach(([stemKey, stemBuffer]) => {
      if (!stemBuffer) return;
      
      // Validate stem has audio content (not silent)
      try {
        const channelData = stemBuffer.getChannelData(0);
        const hasAudio = channelData.some(sample => Math.abs(sample) > 0.001);
        if (!hasAudio) {
          // Silent stem - skip (expected behavior, no ALS needed)
          return;
        }
      } catch (e) {
        // Stem validation error - skip this stem (expected behavior)
        return;
      }
      
      const lowerKey = stemKey.toLowerCase();
      const canonicalKey = STEM_CANONICAL_MAP[lowerKey] ?? lowerKey;
      if (allowedSet && !allowedSet.has(canonicalKey)) {
        return;
      }
      const color = STEM_COLOR_MAP[lowerKey] ?? STEM_COLOR_MAP[canonicalKey] ?? 'cyan';
      const group = STEM_GROUP_MAP[lowerKey] ?? STEM_GROUP_MAP[canonicalKey] ?? 'Instruments';

      const trackId = `track-stem-${timestamp}-${stemKey}-${index}`;
      const bufferId = `buffer-stem-${timestamp}-${stemKey}-${index}`;

      const track: TrackData = {
        id: trackId,
        trackName: `${baseName} - ${stemKey.toUpperCase()}`,
        trackColor: color,
        waveformType: 'varied',
        group,
      };
      tracks.push(track);

      const clip: ArrangeClip = {
        id: `clip-stem-${timestamp}-${stemKey}-${index}`,
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
    const trackId = `track-import-${timestamp}`;
    const bufferId = `buffer-import-${timestamp}`;

    const track: TrackData = {
      id: trackId,
      trackName: baseName,
      trackColor: color,
      waveformType: 'varied',
      group: 'Instruments',
    };
    tracks.push(track);

    const clip: ArrangeClip = {
      id: `clip-import-${timestamp}`,
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

  getAvailableModels() {
    return this.engine.getAvailableModels();
  }

  getModelInfo(modelName: string) {
    return this.engine.getModelInfo(modelName);
  }

  updateConfig(config: Partial<StemSeparationConfig>) {
    this.config = { ...this.config, ...config };
  }

  cancel() {
    this.engine.cancel();
  }
}

export default StemSeparationIntegration;
