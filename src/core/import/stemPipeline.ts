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
import {
  buildAndHydrateFromStem,
  type StemImportPayload,
} from './trackBuilder';

/**
 * Sanitize stems to avoid discarding very quiet content.
 * Keeps low-level stems instead of nulling them out.
 */
function sanitizeStem(name: string, buffer: AudioBuffer | null): AudioBuffer | null {
  if (!buffer) {
    console.warn('[FLOW IMPORT] Empty stem buffer:', name);
    return null;
  }
  if (buffer.length === 0) {
    console.warn('[FLOW IMPORT] Zero-length stem buffer:', name);
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
    console.warn('[FLOW IMPORT] Stem too quiet, but keeping:', name, 'peak=', peak.toExponential(2));
    return buffer;
  }
  return buffer;
}

export interface FlowImportResult {
  classification: AudioClassification;
  timing: TimingAnalysis;
  metadata: StemMetadata;
  stems: Record<string, AudioBuffer | null>;
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
  audioContext: AudioContext
): Promise<FlowImportResult> {
  // 1) file prep
  const prep = await prepFileForImport(file, audioContext);
  
  // 2) classify main audio
  const classification = await classifyAudio(prep.audioBuffer);
  
  // 3) run stem separation
  const optimalMode = determineOptimalMode(classification);
  const stemResult = await stemSplitEngine(prep.audioBuffer, optimalMode, classification);
  
  // Convert StemResult to Record<string, AudioBuffer | null>
  const stems: Record<string, AudioBuffer | null> = {
    vocals: sanitizeStem('vocals', stemResult.vocals),
    drums: sanitizeStem('drums', stemResult.drums),
    bass: sanitizeStem('bass', stemResult.bass),
    music: sanitizeStem('music', stemResult.music),
    perc: sanitizeStem('perc', stemResult.perc),
    harmonic: sanitizeStem('harmonic', stemResult.harmonic),
    sub: sanitizeStem('sub', stemResult.sub),
  };
  
  console.log('[FLOW IMPORT] Stem separation result:', {
    stemsCreated: Object.entries(stems).filter(([_, buf]) => buf !== null).length,
    stemNames: Object.entries(stems).filter(([_, buf]) => buf !== null).map(([name]) => name),
  });
  
  // 4) timing / BPM / key / phrasing
  const timing = analyzeTiming({
    bpm: null, // you can pre-seed if something upstream knows it
    key: 'C',
    confidence: classification.confidence,
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
  
  // 6) hydrate tracks + clips into timeline
  Object.entries(stems).forEach(([stemName, buffer], index) => {
    if (!buffer) {
      console.log(`[FLOW IMPORT] Skipping empty stem: ${stemName}`);
      return;
    }
    
    console.log(`[FLOW IMPORT] Hydrating stem: ${stemName} (${buffer.duration.toFixed(2)}s)`);
    
    const payload: StemImportPayload = {
      name: stemName,
      role: classification.type,
      color: undefined,
      audioBuffer: buffer,
      durationMs: prep.durationMs,
      sampleRate: prep.sampleRate,
      channels: prep.channels,
      format: prep.format,
      metadata,
      index,
    };
    
    buildAndHydrateFromStem(payload);
  });
  
  return {
    classification,
    timing,
    metadata,
    stems,
  };
}
