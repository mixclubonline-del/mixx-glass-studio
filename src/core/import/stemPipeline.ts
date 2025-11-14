/**
 * Stem Separation Pipeline
 * 
 * The complete 9-layer pipeline that orchestrates the entire stem separation process.
 * This is the main entry point for importing audio files.
 * 
 * When someone imports a file, the DAW will:
 * - analyze
 * - classify
 * - split
 * - detect BPM/key
 * - detect vocals
 * - detect drums
 * - detect 808/sub
 * - detect percs
 * - generate metadata
 * - create track lanes
 * - tag lanes with roles
 * - prepare punch zones
 * - prepare comp buffers
 * - prep ALS with initial Flow value
 * 
 * ALL before the user even sees the timeline.
 */

import { prepAudioFile, normalizeBuffer, type PreparedAudio } from './filePrep';
import { classifyAudio, type AudioClassification } from './classifier';
import { stemSplitEngine, determineOptimalMode, type StemResult } from './stemEngine';
import { analyzeTiming, type TimingAnalysis } from './analysis';
import { assembleMetadata, createMetadataSummary, type StemMetadata } from './metadata';
import { buildTracks, prepareTracksForFlow, type TrackConfig } from './trackBuilder';

export interface StemSeparationResult {
  tracks: TrackConfig[];
  metadata: StemMetadata;
  classification: AudioClassification;
  analysis: TimingAnalysis;
  preparedAudio: PreparedAudio;
}

/**
 * Complete stem separation pipeline.
 * 
 * @param file - Audio file to process
 * @param mode - Optional stem separation mode (auto-detected if not provided)
 * @returns Complete separation result with tracks, metadata, and analysis
 */
export async function processStemSeparation(
  file: File,
  mode?: 'auto' | '2track' | 'full' | 'vocal' | 'perc'
): Promise<StemSeparationResult> {
  // Layer 1: File Reader & Prep
  const preparedAudio = await prepAudioFile(file);
  
  // Normalize audio for better separation
  const normalizedBuffer = await normalizeBuffer(preparedAudio.audioBuffer);
  
  // Layer 2: Smart Classifier
  const classification = classifyAudio(normalizedBuffer);
  
  // Determine optimal mode if not provided
  const optimalMode = mode || determineOptimalMode(classification);
  
  // Layer 3: Multi-Mode Stem Splitter
  const stems = await stemSplitEngine(normalizedBuffer, optimalMode, classification);
  
  // Layer 7: BPM + Key Detection
  const analysis = await analyzeTiming(normalizedBuffer);
  
  // Layer 8: Metadata Assembler
  const metadata = assembleMetadata(
    stems,
    analysis,
    classification,
    preparedAudio.info.sampleRate,
    preparedAudio.info.duration,
    preparedAudio.info.channels,
    preparedAudio.info.format
  );
  
  // Layer 9: Track Builder (with auto-role detection)
  let tracks = buildTracks(stems, metadata, classification);
  tracks = prepareTracksForFlow(tracks);
  
  return {
    tracks,
    metadata,
    classification,
    analysis,
    preparedAudio: {
      ...preparedAudio,
      audioBuffer: normalizedBuffer,
    },
  };
}

/**
 * Quick import for simple cases (no stem separation).
 * Just prepares file and analyzes timing.
 */
export async function quickImport(file: File): Promise<{
  audioBuffer: AudioBuffer;
  metadata: Partial<StemMetadata>;
  analysis: TimingAnalysis;
}> {
  const preparedAudio = await prepAudioFile(file);
  const normalizedBuffer = await normalizeBuffer(preparedAudio.audioBuffer);
  const analysis = await analyzeTiming(normalizedBuffer);
  
  return {
    audioBuffer: normalizedBuffer,
    metadata: {
      bpm: analysis.bpm,
      key: analysis.key,
      sampleRate: preparedAudio.info.sampleRate,
      duration: preparedAudio.info.duration,
      channels: preparedAudio.info.channels,
      format: preparedAudio.info.format,
    },
    analysis,
  };
}

