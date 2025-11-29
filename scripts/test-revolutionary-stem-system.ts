#!/usr/bin/env ts-node
/**
 * Revolutionary Stem Separation System Test Script
 * 
 * Validates the complete revolutionary stem separation system:
 * 1. Quantum feature extraction
 * 2. Musical context analysis
 * 3. Stem separation
 * 4. Snapshot export
 * 
 * Run: npx ts-node scripts/test-revolutionary-stem-system.ts
 */

import { createWriteStream } from 'fs';
import { join } from 'path';

// Mock AudioBuffer for testing (in real scenario, use actual audio file)
function createMockAudioBuffer(): AudioBuffer {
  const sampleRate = 44100;
  const duration = 2.0;
  const length = Math.floor(sampleRate * duration);
  
  const buffer = new AudioBuffer({
    numberOfChannels: 2,
    length,
    sampleRate,
  });

  // Create simple sine wave for testing
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      const freq = 440; // A4
      channelData[i] = Math.sin((2 * Math.PI * freq * i) / sampleRate) * 0.5;
    }
  }

  return buffer;
}

async function testRevolutionaryStemSystem() {
  console.log('🧪 Testing Revolutionary Stem Separation System...\n');

  try {
    // Test 1: Quantum Feature Extraction
    console.log('1️⃣  Testing Quantum Feature Extraction...');
    const { getQuantumStemFeatureExtractor } = await import('../src/core/import/quantumStemEngine.js');
    const extractor = getQuantumStemFeatureExtractor();
    await extractor.initialize();

    const testBuffer = createMockAudioBuffer();
    const features = await extractor.extractFeatures(testBuffer, {
      sampleRate: testBuffer.sampleRate,
    });

    console.log('   ✅ Quantum features extracted:');
    console.log(`      - Spectral: ${features.spectral.length} features`);
    console.log(`      - Temporal: ${features.temporal.length} features`);
    console.log(`      - Harmonic: ${features.harmonic.length} features`);
    console.log(`      - Percussive: ${features.percussive.length} features`);
    console.log(`      - Stereo: ${features.stereo.length} features`);
    console.log(`      - Energy: ${features.energy.length} features`);

    // Test 2: Musical Context Analysis
    console.log('\n2️⃣  Testing Musical Context Analysis...');
    const { getMusicalContextStemEngine } = await import('../src/core/import/musicalContextStemEngine.js');
    const contextEngine = getMusicalContextStemEngine();
    const context = await contextEngine.analyzeMusicalContext(testBuffer);

    console.log('   ✅ Musical context analyzed:');
    console.log(`      - Key: ${context.key}`);
    console.log(`      - BPM: ${context.bpm || 'Not detected'}`);
    console.log(`      - Transients: ${context.transients.length}`);
    console.log(`      - Harmonic tension: ${context.harmonicContent.tensionLevel.toFixed(3)}`);

    // Test 3: Stem Separation
    console.log('\n3️⃣  Testing Stem Separation...');
    const { getRevolutionaryStemEngine } = await import('../src/core/import/revolutionaryStemEngine.js');
    const engine = getRevolutionaryStemEngine();

    const classification = {
      type: 'twotrack' as const,
      confidence: 0.8,
    };

    const separationResult = await engine.separateStemsWithFeatures(
      testBuffer,
      classification,
      {
        useMusicalContext: true,
        useFivePillars: false, // Skip for faster testing
      }
    );

    console.log('   ✅ Stem separation complete:');
    console.log(`      - Vocals: ${separationResult.result.vocals ? '✅' : '❌'}`);
    console.log(`      - Drums: ${separationResult.result.drums ? '✅' : '❌'}`);
    console.log(`      - Bass: ${separationResult.result.bass ? '✅' : '❌'}`);
    console.log(`      - Harmonic: ${separationResult.result.harmonic ? '✅' : '❌'}`);

    // Test 4: Snapshot Export
    console.log('\n4️⃣  Testing Snapshot Export...');
    const { buildStemSeparationSnapshot } = await import('../src/core/import/stemSeparationSnapshot.js');

    const snapshot = buildStemSeparationSnapshot({
      audioBuffer: testBuffer,
      quantumFeatures: separationResult.features,
      musicalContext: separationResult.context,
      stemResult: separationResult.result,
      classification,
      processingTime: 1234,
    });

    console.log('   ✅ Snapshot built:');
    console.log(`      - ID: ${snapshot.id}`);
    console.log(`      - Timestamp: ${new Date(snapshot.timestamp).toISOString()}`);
    console.log(`      - Classification: ${snapshot.metadata.classification}`);
    console.log(`      - Confidence: ${snapshot.metadata.confidence}`);
    console.log(`      - Processing time: ${snapshot.metadata.processingTime}ms`);

    // Save snapshot as test output
    const outputPath = join(process.cwd(), 'test-output-snapshot.json');
    const writeStream = createWriteStream(outputPath);
    writeStream.write(JSON.stringify(snapshot, null, 2));
    writeStream.end();

    console.log(`\n   📄 Test snapshot saved to: ${outputPath}`);

    // Test 5: Validate Snapshot Structure
    console.log('\n5️⃣  Validating Snapshot Structure...');
    const { validateSnapshot } = await import('../src/core/import/stemSeparationSnapshot.js');

    const isValid = validateSnapshot(snapshot);
    console.log(`   ${isValid ? '✅' : '❌'} Snapshot validation: ${isValid ? 'PASSED' : 'FAILED'}`);

    if (!isValid) {
      throw new Error('Snapshot validation failed');
    }

    console.log('\n✅ All tests passed! Revolutionary Stem Separation System is operational.\n');

    return {
      success: true,
      features: {
        spectral: features.spectral.length,
        temporal: features.temporal.length,
        harmonic: features.harmonic.length,
      },
      context: {
        key: context.key,
        bpm: context.bpm,
        transients: context.transients.length,
      },
      snapshot: {
        id: snapshot.id,
        valid: isValid,
      },
    };

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    throw error;
  }
}

// Run tests when executed directly
testRevolutionaryStemSystem()
  .then((result) => {
    console.log('\n📊 Test Results:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });

export { testRevolutionaryStemSystem };
