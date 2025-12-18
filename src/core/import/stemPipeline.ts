/**
 * Flow Stem Pipeline
 * 
 * The complete orchestration function that runs the entire Flow import brain.
 * Single entry point from FileInput.tsx.
 * 
 * This is Prime Fabric → Flow runtime pattern:
 * - filePrep
 * - classifier
 * - stemEngine
 * - analysis
 * - metadata
 * - trackBuilder hydration
 */

import { prepFileForImport } from './filePrep';
import { classifyAudio, type AudioClassification } from './classifier';
import { stemSplitEngine, determineOptimalMode, type StemResult } from './stemEngine';
import { analyzeTiming, type TimingAnalysis } from './analysis';
import { assembleMetadata, type StemMetadata } from './metadata';
import { ensureStemTrackLayout, STEM_ORDER, stemTrackIdFor } from '../tracks/stemLayout';
import { STEM_PRIORITY_ORDER } from '../audio/ai/stemTrackMap';
import { useTimelineStore } from '../../state/timelineStore';
import {
  buildAndHydrateFromStem,
  type StemImportPayload,
} from './trackBuilder';
import { buildStemSeparationSnapshot } from './stemSeparationSnapshot';
import { als } from '../../utils/alsFeedback';

/**
 * Sanitize stems to avoid discarding very quiet content.
 * Keeps low-level stems instead of nulling them out.
 */
function sanitizeStem(name: string, buffer: AudioBuffer | null): AudioBuffer | null {
  if (!buffer) {
    // Empty stem buffer - expected in some cases (no ALS needed)
    return null;
  }
  if (buffer.length === 0) {
    // Zero-length stem buffer - expected in some cases (no ALS needed)
    return null;
  }
  // Compute peak on first channel (fast heuristic)
  const channelData = buffer.getChannelData(0);
  let peak = 0;
  for (let i = 0; i < channelData.length; i += 1) {
    const v = Math.abs(channelData[i]);
    if (v > peak) peak = v;
  }
  // Old thresholds may have been too high; keep quiet stems
  const MIN_PEAK = 0.00001;
  if (peak < MIN_PEAK) {
    // Stem too quiet but keeping - expected behavior (no ALS needed)
    return buffer;
  }
  return buffer;
}

export interface FlowImportResult {
  classification: AudioClassification;
  timing: TimingAnalysis;
  metadata: StemMetadata;
  stems: Record<string, AudioBuffer | null>;
  trackIds: string[]; // Track IDs that have clips placed (for state initialization)
}

/**
 * Full Flow import + stem pipeline.
 * Single entry point from FileInput.tsx.
 * 
 * @param file - File object from input
 * @param audioContext - AudioContext instance (reuse existing)
 * @returns Complete import result with classification, timing, metadata, and stems
 */
export async function runFlowStemPipeline(
  file: File,
  audioContext: AudioContext,
  onSnapshot?: (snapshot: any) => void
): Promise<FlowImportResult> {
  // 1) file prep
  const prep = await prepFileForImport(file, audioContext);
  
  // 2) classify main audio
  const classification = await classifyAudio(prep.audioBuffer);
  
  // Track processing time for snapshot export
  const processingStartTime = performance.now();
  
  // 3) run stem separation
  // Try revolutionary system first, fall back to standard engine if needed
  const optimalMode = determineOptimalMode(classification);
  let stemResult: FlowImportResult['stems'];
  let quantumFeatures: any = null;
  let musicalContext: any = null;
  
  // Check if revolutionary system should be used
  const useRevolutionary = 
    classification.type === 'twotrack' || 
    classification.type === 'full' ||
    (typeof window !== 'undefined' && (window as any).__mixx_use_revolutionary_stems);
  
  if (useRevolutionary) {
    try {
      // Try revolutionary proprietary system
      const { getRevolutionaryStemEngine } = await import('./revolutionaryStemEngine');
      const revolutionaryEngine = getRevolutionaryStemEngine();
      
      // Extract features and context for snapshot
      const { getQuantumStemFeatureExtractor } = await import('./quantumStemEngine');
      const { getMusicalContextStemEngine } = await import('./musicalContextStemEngine');
      const featureExtractor = getQuantumStemFeatureExtractor();
      const contextEngine = getMusicalContextStemEngine();
      
      // Get features and context from revolutionary engine
      // The engine extracts these internally, so we extract them here for snapshot export
      quantumFeatures = await featureExtractor.extractFeatures(prep.audioBuffer, {
        sampleRate: prep.audioBuffer.sampleRate,
      });
      
      musicalContext = await contextEngine.analyzeMusicalContext(prep.audioBuffer);
      
      stemResult = await revolutionaryEngine.separateStems(prep.audioBuffer, classification, {
        useTransformer: false, // Transformer requires training - use musical context for now
        useMusicalContext: true,
        useFivePillars: true,
        preferQuality: true,
      }) as unknown as Record<string, AudioBuffer | null>;
    } catch (revolutionaryError) {
      // Revolutionary separation failed - AI model fallback will be used (expected)
      
      // Fallback to AI model for two-track files
      if (classification.type === 'twotrack') {
        try {
          const { default: StemSeparationIntegration } = await import('../../audio/StemSeparationIntegration');
          const integration = new StemSeparationIntegration(audioContext, {
            autoSeparate: true,
            model: 'htdemucs_6stems',
          });
          
          const aiStems = await (integration as any).engine.separateStems(prep.audioBuffer, {
            model: 'htdemucs_6stems',
            output_format: 'wav',
            normalize: true,
          });
          
          // Map AI stems to our format
          stemResult = {
            vocals: aiStems.vocals || null,
            drums: aiStems.drums || null,
            bass: aiStems.bass || null,
            music: aiStems.other || null,
            perc: aiStems.drums || null,
            harmonic: aiStems.other || aiStems.guitar || aiStems.piano || null,
            sub: null,
          };
          
          // Extract sub-bass
          if (stemResult.bass) {
            try {
              const { extractSubBass } = await import('./extractSubBass');
              const subBuffer = await extractSubBass(stemResult.bass);
              if (subBuffer) {
                stemResult.sub = subBuffer;
              }
            } catch (e) {
              // Sub extraction is optional
            }
          }
        } catch (aiError) {
          // AI model fallback failed - standard engine will be used (expected)
          stemResult = await stemSplitEngine(prep.audioBuffer, optimalMode, classification) as unknown as Record<string, AudioBuffer | null>;
        }
      } else {
        // Use standard engine for other file types
        stemResult = await stemSplitEngine(prep.audioBuffer, optimalMode, classification) as unknown as Record<string, AudioBuffer | null>;
      }
    }
  } else {
    // Use standard engine for simple file types
    stemResult = await stemSplitEngine(prep.audioBuffer, optimalMode, classification) as unknown as Record<string, AudioBuffer | null>;
  }
  
  // Export snapshot for training (if enabled and features available)
  const processingTime = performance.now() - processingStartTime;
  if (onSnapshot && quantumFeatures) {
    try {
      const snapshot = buildStemSeparationSnapshot({
        audioBuffer: prep.audioBuffer,
        quantumFeatures,
        musicalContext: musicalContext || null,
        stemResult: stemResult as any,
        classification,
        processingTime,
      });
      onSnapshot(snapshot);
    } catch (snapshotError) {
      // Snapshot build failed - non-critical for import (no ALS needed)
    }
  }
  
  // Convert StemResult to Record<string, AudioBuffer | null>
  const stems: Record<string, AudioBuffer | null> = {
    vocals: sanitizeStem('vocals', stemResult.vocals),
    drums: sanitizeStem('drums', stemResult.drums),
    bass: sanitizeStem('bass', stemResult.bass),
    perc: sanitizeStem('perc', stemResult.perc),
    harmonic: sanitizeStem('harmonic', stemResult.harmonic),
    sub: sanitizeStem('sub', stemResult.sub),
  };
  // Treat "music" as harmonic if provided
  if (!stems.harmonic && stemResult.music) {
    stems.harmonic = sanitizeStem('harmonic', stemResult.music);
  }

  // Normalize, filter and order stems using MixxClub priority
  const normalizeStemSet = (input: Record<string, AudioBuffer | null>) => {
    const ordered: Record<string, AudioBuffer> = {} as any;
    (STEM_PRIORITY_ORDER as unknown as string[]).forEach((stem) => {
      const buf = input[stem];
      if (buf && buf.length > 0) ordered[stem] = buf;
    });
    return ordered;
  };
  const normalizedStems = normalizeStemSet(stems);

  // Debug: compute quick peaks for each stem to verify content presence
  try {
    const peakOf = (buf: AudioBuffer | null) => {
      if (!buf || buf.length === 0) return 0;
      const chan = buf.getChannelData(0);
      const limit = Math.min(5000, chan.length);
      let peak = 0;
      for (let i = 0; i < limit; i += 1) {
        const v = Math.abs(chan[i]);
        if (v > peak) peak = v;
      }
      return Number(peak.toFixed(6));
    };
    const debugPeaks = Object.fromEntries(
      Object.entries(stems).map(([k, v]) => [k, peakOf(v)])
    );
    if (typeof window !== 'undefined') {
      (window as any).__flow_debug_last_stems = {
        ...(window as any).__flow_debug_last_stems,
        source: 'pipeline',
        peaks: debugPeaks,
        keys: Object.keys(stems),
      };
    }
  } catch {
    // ignore debug failures
  }
  
  // 4) timing / BPM / key / phrasing
  // Auto-detect BPM/key from audio buffer if not provided
  const timing = await analyzeTiming({
    bpm: null, // Auto-detect if not provided
    key: 'C', // Auto-detect if not provided
    confidence: classification.confidence,
    audioBuffer: prep.audioBuffer, // Pass buffer for auto-detection
  });
  
  // 5) Layer 4 metadata fusion
  const metadata = assembleMetadata(
    stems,
    timing,
    classification,
    prep.sampleRate,
    prep.durationMs,
    prep.channels,
    prep.format,
    prep.audioBuffer
  );
  
  // 6) Ensure deterministic stem lanes exist, then place clips on their lanes
  ensureStemTrackLayout();
  const { setAudioBuffer, addClip, getTracks } = useTimelineStore.getState();
  const tracks = getTracks();
  const validKeys = new Set<string>(STEM_ORDER as unknown as string[]);
  let placed = 0;
  const usedTrackIds = new Set<string>();
  
  (Object.entries(normalizedStems) as Array<[string, AudioBuffer]>).forEach(([stemName, buffer]) => {
    if (!buffer) return;
    if (!validKeys.has(stemName)) return;
    const targetId = stemTrackIdFor(stemName as any);
    const duration = buffer.duration;
    const bufferId = `buffer-stem-${stemName}-${Date.now()}-${placed}`;
    const clipId = `clip-stem-${stemName}-${Date.now()}-${placed}`;
    placed += 1;
    usedTrackIds.add(targetId);
    
    // Register buffer
    setAudioBuffer(bufferId, buffer);
    // Place clip aligned at start on target track
    addClip(targetId, {
      id: clipId,
      trackId: targetId,
      name: stemName.toUpperCase(),
      color: '#ffffff',
      start: 0,
      duration,
      originalDuration: duration,
      timeStretchRate: 1.0,
      sourceStart: 0,
      fadeIn: 0,
      fadeOut: 0,
      gain: 1.0,
      selected: false,
      bufferId,
    } as any);
  });
  
  return {
    classification,
    timing,
    metadata,
    stems,
    trackIds: Array.from(usedTrackIds), // Return track IDs for state initialization
  };
}
