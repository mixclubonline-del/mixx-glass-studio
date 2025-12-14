/**
 * Revolutionary Proprietary Stem Separation Engine
 * 
 * The complete orchestration of all revolutionary stem separation layers:
 * 1. Quantum Feature Extraction
 * 2. Musical Context Analysis
 * 3. Quantum Transformer Separation
 * 4. Five Pillars Post-Processing
 * 
 * This is the main entry point for the revolutionary stem separation system.
 */

import { getQuantumStemFeatureExtractor, type QuantumStemFeatures } from './quantumStemEngine';
import {
  getMusicalContextStemEngine,
  type MusicalContext,
  type ContextAwareSeparationOptions,
} from './musicalContextStemEngine';
import { getQuantumTransformerStemModel } from './quantumTransformerStemEngine';
import { applyFivePillarsToStems, type FivePillarsPostProcessOptions } from './fivePillarsPostProcess';
import type { StemResult } from './stemEngine';
import type { AudioClassification } from './classifier';

export interface RevolutionaryStemOptions {
  useTransformer?: boolean; // Use transformer model (requires training)
  useMusicalContext?: boolean; // Use musical context awareness
  useFivePillars?: boolean; // Apply Five Pillars post-processing
  preferQuality?: boolean; // Prioritize quality over speed
}

/**
 * Revolutionary Stem Separation Engine
 * 
 * Orchestrates all layers of the revolutionary stem separation system.
 */
export class RevolutionaryStemEngine {
  private featureExtractor = getQuantumStemFeatureExtractor();
  private contextEngine = getMusicalContextStemEngine();
  private transformer = getQuantumTransformerStemModel();

  /**
   * Separate stems using revolutionary multi-layer approach
   */
  async separateStems(
    audioBuffer: AudioBuffer,
    classification: AudioClassification,
    options: RevolutionaryStemOptions = {}
  ): Promise<StemResult> {
    const useTransformer = options.useTransformer ?? false; // Default false until trained
    const useMusicalContext = options.useMusicalContext ?? true;
    const useFivePillars = options.useFivePillars ?? true;

    // Layer 1: Extract quantum features
    const features = await this.featureExtractor.extractFeatures(audioBuffer, {
      sampleRate: audioBuffer.sampleRate,
    });

    // Layer 2: Analyze musical context
    let context: MusicalContext | null = null;
    if (useMusicalContext) {
      context = await this.contextEngine.analyzeMusicalContext(audioBuffer);
    }

    // Layer 3: Separate stems
    let result: StemResult;
    
    if (useTransformer) {
      // Use transformer model (requires trained weights)
      const transformerStems = await this.transformer.separate(features, audioBuffer);
      
      // Convert transformer output to StemResult format
      result = {
        vocals: transformerStems.vocals ? this.float32ArrayToAudioBuffer(
          transformerStems.vocals,
          audioBuffer.sampleRate
        ) : null,
        drums: transformerStems.drums ? this.float32ArrayToAudioBuffer(
          transformerStems.drums,
          audioBuffer.sampleRate
        ) : null,
        bass: transformerStems.bass ? this.float32ArrayToAudioBuffer(
          transformerStems.bass,
          audioBuffer.sampleRate
        ) : null,
        harmonic: transformerStems.harmonic ? this.float32ArrayToAudioBuffer(
          transformerStems.harmonic,
          audioBuffer.sampleRate
        ) : null,
        perc: transformerStems.perc ? this.float32ArrayToAudioBuffer(
          transformerStems.perc,
          audioBuffer.sampleRate
        ) : null,
        sub: transformerStems.sub ? this.float32ArrayToAudioBuffer(
          transformerStems.sub,
          audioBuffer.sampleRate
        ) : null,
        music: transformerStems.harmonic ? this.float32ArrayToAudioBuffer(
          transformerStems.harmonic,
          audioBuffer.sampleRate
        ) : null,
      };
    } else if (context && useMusicalContext) {
      // Use musical context-aware separation
      const contextOptions: ContextAwareSeparationOptions = {
        classification,
        preferCleanSeparation: options.preferQuality,
      };
      
      const contextStems = await this.contextEngine.separateWithContext(
        audioBuffer,
        features,
        context,
        contextOptions
      );
      
      result = {
        vocals: contextStems.vocals || null,
        drums: contextStems.drums || null,
        bass: contextStems.bass || null,
        harmonic: contextStems.harmonic || null,
        perc: contextStems.perc || null,
        sub: null, // Will be extracted separately if needed
        music: contextStems.music || contextStems.harmonic || null,
      };
    } else {
      // Fallback: use quantum features for basic separation
      result = await this.separateWithQuantumFeatures(audioBuffer, features);
    }

    // Layer 4: Apply Five Pillars post-processing
    if (useFivePillars && result) {
      const fivePillarsOptions: FivePillarsPostProcessOptions = {
        applyToBass: true,
        applyToHarmonic: true,
        applyToAll: true,
        applyVelvetCurve: false, // Optional, more CPU intensive
      };
      
      result = await applyFivePillarsToStems(result, fivePillarsOptions);
    }

    return result;
  }

  /**
   * Separate stems with feature extraction (for snapshot export)
   */
  async separateStemsWithFeatures(
    audioBuffer: AudioBuffer,
    classification: AudioClassification,
    options: RevolutionaryStemOptions = {}
  ): Promise<{
    result: StemResult;
    features: QuantumStemFeatures;
    context: MusicalContext | null;
  }> {
    const useTransformer = options.useTransformer ?? false;
    const useMusicalContext = options.useMusicalContext ?? true;
    const useFivePillars = options.useFivePillars ?? true;

    // Extract features
    const features = await this.featureExtractor.extractFeatures(audioBuffer, {
      sampleRate: audioBuffer.sampleRate,
    });

    // Analyze context
    let context: MusicalContext | null = null;
    if (useMusicalContext) {
      context = await this.contextEngine.analyzeMusicalContext(audioBuffer);
    }

    // Layer 3: Separate stems
    let result: StemResult;
    
    if (useTransformer) {
      // Use transformer model (requires trained weights)
      const transformerStems = await this.transformer.separate(features, audioBuffer);
      
      // Convert transformer output to StemResult format
      result = {
        vocals: transformerStems.vocals ? this.float32ArrayToAudioBuffer(
          transformerStems.vocals,
          audioBuffer.sampleRate
        ) : null,
        drums: transformerStems.drums ? this.float32ArrayToAudioBuffer(
          transformerStems.drums,
          audioBuffer.sampleRate
        ) : null,
        bass: transformerStems.bass ? this.float32ArrayToAudioBuffer(
          transformerStems.bass,
          audioBuffer.sampleRate
        ) : null,
        harmonic: transformerStems.harmonic ? this.float32ArrayToAudioBuffer(
          transformerStems.harmonic,
          audioBuffer.sampleRate
        ) : null,
        perc: transformerStems.perc ? this.float32ArrayToAudioBuffer(
          transformerStems.perc,
          audioBuffer.sampleRate
        ) : null,
        sub: transformerStems.sub ? this.float32ArrayToAudioBuffer(
          transformerStems.sub,
          audioBuffer.sampleRate
        ) : null,
        music: transformerStems.harmonic ? this.float32ArrayToAudioBuffer(
          transformerStems.harmonic,
          audioBuffer.sampleRate
        ) : null,
      };
    } else if (context && useMusicalContext) {
      // Use musical context-aware separation
      const contextOptions: ContextAwareSeparationOptions = {
        classification,
        preferCleanSeparation: options.preferQuality,
      };
      
      const contextStems = await this.contextEngine.separateWithContext(
        audioBuffer,
        features,
        context,
        contextOptions
      );
      
      result = {
        vocals: contextStems.vocals || null,
        drums: contextStems.drums || null,
        bass: contextStems.bass || null,
        harmonic: contextStems.harmonic || null,
        perc: contextStems.perc || null,
        sub: null,
        music: contextStems.music || contextStems.harmonic || null,
      };
    } else {
      // Fallback: use quantum features for basic separation
      result = await this.separateWithQuantumFeatures(audioBuffer, features);
    }

    // Layer 4: Apply Five Pillars post-processing
    if (useFivePillars && result) {
      const { applyFivePillarsToStems } = await import('./fivePillarsPostProcess');
      result = await applyFivePillarsToStems(result, {
        applyToBass: true,
        applyToHarmonic: true,
        applyToAll: true,
        applyVelvetCurve: false,
      });
    }

    return { result, features, context };
  }

  /**
   * Fallback separation using quantum features only
   */
  private async separateWithQuantumFeatures(
    audioBuffer: AudioBuffer,
    features: QuantumStemFeatures
  ): Promise<StemResult> {
    // Basic frequency-domain separation using quantum features
    // This is a simplified fallback - real implementation would be more sophisticated
    
    const ctx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;

    // Use quantum features to guide separation
    // For now, use basic frequency filtering as fallback
    const result: StemResult = {
      vocals: null,
      drums: null,
      bass: null,
      harmonic: null,
      perc: null,
      sub: null,
      music: null,
    };

    // This is a placeholder - full implementation would use quantum features
    // to intelligently separate stems

    return result;
  }

  /**
   * Convert Float32Array to AudioBuffer (helper)
   */
  private float32ArrayToAudioBuffer(
    data: Float32Array,
    sampleRate: number
  ): AudioBuffer | null {
    try {
      const ctx = new OfflineAudioContext(1, data.length, sampleRate);
      const buffer = ctx.createBuffer(1, data.length, sampleRate);
      buffer.getChannelData(0).set(data);
      return buffer;
    } catch (error) {
      // Conversion failed - return null (expected fallback, no ALS needed)
      return null;
    }
  }
}

// Singleton instance
let globalRevolutionaryEngine: RevolutionaryStemEngine | null = null;

export function getRevolutionaryStemEngine(): RevolutionaryStemEngine {
  if (!globalRevolutionaryEngine) {
    globalRevolutionaryEngine = new RevolutionaryStemEngine();
  }
  return globalRevolutionaryEngine;
}
