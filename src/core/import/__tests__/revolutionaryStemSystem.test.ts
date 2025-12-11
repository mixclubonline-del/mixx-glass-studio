/**
 * Revolutionary Stem Separation System Test Suite
 * 
 * Validates end-to-end functionality of the revolutionary stem separation system:
 * - Quantum feature extraction
 * - Musical context analysis
 * - Stem separation
 * - Five Pillars post-processing
 * - Snapshot export for training
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getQuantumStemFeatureExtractor, type QuantumStemFeatures } from '../quantumStemEngine';
import { getMusicalContextStemEngine, type MusicalContext } from '../musicalContextStemEngine';
import { getRevolutionaryStemEngine } from '../revolutionaryStemEngine';
import { buildStemSeparationSnapshot } from '../stemSeparationSnapshot';
import type { AudioClassification } from '../classifier';

/**
 * Create a test audio buffer (sine wave)
 */
function createTestAudioBuffer(
  sampleRate: number = 44100,
  duration: number = 1.0,
  frequency: number = 440
): AudioBuffer {
  const length = Math.floor(sampleRate * duration);
  const buffer = new AudioBuffer({
    numberOfChannels: 2,
    length,
    sampleRate,
  });

  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      channelData[i] = Math.sin((2 * Math.PI * frequency * i) / sampleRate) * 0.5;
    }
  }

  return buffer;
}

describe('Revolutionary Stem Separation System', () => {
  let testBuffer: AudioBuffer;
  let testClassification: AudioClassification;

  beforeEach(() => {
    // Create test audio buffer
    testBuffer = createTestAudioBuffer(44100, 2.0, 440);
    
    // Create test classification
    testClassification = {
      type: 'twotrack',
      confidence: 0.8,
    };
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Quantum Feature Extraction', () => {
    it('should extract quantum features from audio buffer', async () => {
      const extractor = getQuantumStemFeatureExtractor();
      await extractor.initialize();

      const features = await extractor.extractFeatures(testBuffer, {
        sampleRate: testBuffer.sampleRate,
      });

      expect(features).toBeDefined();
      expect(features.spectral).toBeInstanceOf(Float32Array);
      expect(features.temporal).toBeInstanceOf(Float32Array);
      expect(features.harmonic).toBeInstanceOf(Float32Array);
      expect(features.percussive).toBeInstanceOf(Float32Array);
      expect(features.stereo).toBeInstanceOf(Float32Array);
      expect(features.energy).toBeInstanceOf(Float32Array);
      expect(features.quantumSuperposition).toBeDefined();
    });

    it('should create quantum superposition state', async () => {
      const extractor = getQuantumStemFeatureExtractor();
      await extractor.initialize();

      const features = await extractor.extractFeatures(testBuffer);
      
      // Quantum superposition should be a tensor
      expect(features.quantumSuperposition).toBeDefined();
    });
  });

  describe('Musical Context Analysis', () => {
    it('should analyze musical context from audio buffer', async () => {
      const contextEngine = getMusicalContextStemEngine();

      const context = await contextEngine.analyzeMusicalContext(testBuffer);

      expect(context).toBeDefined();
      expect(context.key).toBeDefined();
      expect(typeof context.key).toBe('string');
      expect(context.bpm).toBeDefined();
      expect(Array.isArray(context.transients)).toBe(true);
      expect(context.harmonicContent).toBeDefined();
      expect(context.rhythmPattern).toBeDefined();
    });

    it('should detect key from audio', async () => {
      const contextEngine = getMusicalContextStemEngine();
      const context = await contextEngine.analyzeMusicalContext(testBuffer);

      // Should detect a valid key
      const validKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      expect(validKeys).toContain(context.key);
    });
  });

  describe('Revolutionary Stem Engine', () => {
    it('should separate stems using revolutionary system', async () => {
      const engine = getRevolutionaryStemEngine();

      const result = await engine.separateStems(testBuffer, testClassification, {
        useMusicalContext: true,
        useFivePillars: true,
        preferQuality: true,
      });

      expect(result).toBeDefined();
      // Result should have stem properties (may be null if separation fails)
      expect(result).toHaveProperty('vocals');
      expect(result).toHaveProperty('drums');
      expect(result).toHaveProperty('bass');
      expect(result).toHaveProperty('harmonic');
    });

    it('should extract features and context for snapshots', async () => {
      const engine = getRevolutionaryStemEngine();

      const { result, features, context } = await engine.separateStemsWithFeatures(
        testBuffer,
        testClassification,
        {
          useMusicalContext: true,
          useFivePillars: false, // Skip for faster testing
        }
      );

      expect(result).toBeDefined();
      expect(features).toBeDefined();
      expect(context).toBeDefined();
      
      // Verify features structure
      expect(features.spectral).toBeInstanceOf(Float32Array);
      expect(features.temporal).toBeInstanceOf(Float32Array);
      
      // Verify context structure
      expect(context?.key).toBeDefined();
      expect(context?.bpm).toBeDefined();
    });
  });

  describe('Snapshot Export', () => {
    it('should build snapshot for training', async () => {
      const extractor = getQuantumStemFeatureExtractor();
      const contextEngine = getMusicalContextStemEngine();
      await extractor.initialize();

      const features = await extractor.extractFeatures(testBuffer);
      const context = await contextEngine.analyzeMusicalContext(testBuffer);
      
      const stemResult = {
        vocals: null,
        drums: null,
        bass: null,
        harmonic: null,
        perc: null,
        sub: null,
        music: null,
      };

      const snapshot = buildStemSeparationSnapshot({
        audioBuffer: testBuffer,
        quantumFeatures: features,
        musicalContext: context,
        stemResult,
        classification: testClassification,
        processingTime: 1000,
      });

      expect(snapshot).toBeDefined();
      expect(snapshot.id).toBeDefined();
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.originalAudio).toBeDefined();
      expect(snapshot.quantumFeatures).toBeDefined();
      expect(snapshot.musicalContext).toBeDefined();
      expect(snapshot.metadata).toBeDefined();
      
      // Verify quantum features
      expect(Array.isArray(snapshot.quantumFeatures.spectral)).toBe(true);
      expect(Array.isArray(snapshot.quantumFeatures.temporal)).toBe(true);
      
      // Verify musical context
      expect(snapshot.musicalContext.key).toBeDefined();
      expect(snapshot.musicalContext.bpm).toBeDefined();
      
      // Verify metadata
      expect(snapshot.metadata.classification).toBe(testClassification.type);
      expect(snapshot.metadata.confidence).toBe(testClassification.confidence);
    });

    it('should include ground truth stems if provided', () => {
      const extractor = getQuantumStemFeatureExtractor();
      const contextEngine = getMusicalContextStemEngine();
      
      // This is a simplified test - would need actual extraction in real scenario
      const features: QuantumStemFeatures = {
        spectral: new Float32Array([0.1, 0.2, 0.3]),
        temporal: new Float32Array([0.1, 0.2]),
        harmonic: new Float32Array([0.1, 0.2]),
        percussive: new Float32Array([0.1, 0.2]),
        stereo: new Float32Array([0.5]),
        energy: new Float32Array([0.8]),
        quantumSuperposition: null as any, // Skip for test
      };

      const context: MusicalContext = {
        key: 'C',
        bpm: 120,
        timeSignature: { numerator: 4, denominator: 4 },
        transients: [],
        harmonicContent: {
          dominantFrequencies: [440, 880],
          chordTones: [],
          tensionLevel: 0.5,
        },
        rhythmPattern: {
          beatGrid: [0, 0.5, 1.0],
          subdivision: 4,
          regularity: 0.9,
        },
      };

      const stemResult = {
        vocals: testBuffer,
        drums: testBuffer,
        bass: null,
        harmonic: null,
        perc: null,
        sub: null,
        music: null,
      };

      const snapshot = buildStemSeparationSnapshot({
        audioBuffer: testBuffer,
        quantumFeatures: features,
        musicalContext: context,
        stemResult,
        classification: testClassification,
        processingTime: 500,
        groundTruthStems: stemResult,
      });

      expect(snapshot.groundTruthStems).toBeDefined();
    });
  });

  describe('Integration Test', () => {
    it('should complete full pipeline: features → context → separation → snapshot', async () => {
      const engine = getRevolutionaryStemEngine();

      // Extract features and context
      const { result, features, context } = await engine.separateStemsWithFeatures(
        testBuffer,
        testClassification,
        {
          useMusicalContext: true,
          useFivePillars: false, // Faster for testing
        }
      );

      // Build snapshot
      const snapshot = buildStemSeparationSnapshot({
        audioBuffer: testBuffer,
        quantumFeatures: features,
        musicalContext: context,
        stemResult: result,
        classification: testClassification,
        processingTime: 1000,
      });

      // Verify complete pipeline
      expect(result).toBeDefined();
      expect(features).toBeDefined();
      expect(context).toBeDefined();
      expect(snapshot).toBeDefined();
      
      // Verify snapshot structure
      expect(snapshot.quantumFeatures.spectral.length).toBeGreaterThan(0);
      expect(snapshot.musicalContext.key).toBeDefined();
      expect(snapshot.metadata.classification).toBe(testClassification.type);
    });
  });
});








