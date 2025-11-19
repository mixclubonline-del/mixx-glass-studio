/**
 * Generate Test Audio File
 * 
 * Creates a test WAV file with a musical tone for testing audio import and playback.
 * 
 * Usage: node scripts/generateTestAudio.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function generateTestAudio() {
  const sampleRate = 44100;
  const duration = 5; // seconds
  const frequency = 440; // A4 note
  const amplitude = 0.3; // Safe level
  
  const numSamples = sampleRate * duration;
  const numChannels = 2; // Stereo
  
  // Create buffer for 16-bit PCM
  const buffer = Buffer.alloc(44 + numSamples * numChannels * 2); // 44 bytes header + data
  
  // WAV header
  let offset = 0;
  
  // RIFF header
  buffer.write('RIFF', offset); offset += 4;
  buffer.writeUInt32LE(36 + numSamples * numChannels * 2, offset); offset += 4; // File size - 8
  buffer.write('WAVE', offset); offset += 4;
  
  // fmt chunk
  buffer.write('fmt ', offset); offset += 4;
  buffer.writeUInt32LE(16, offset); offset += 4; // fmt chunk size
  buffer.writeUInt16LE(1, offset); offset += 2; // Audio format (1 = PCM)
  buffer.writeUInt16LE(numChannels, offset); offset += 2; // Number of channels
  buffer.writeUInt32LE(sampleRate, offset); offset += 4; // Sample rate
  buffer.writeUInt32LE(sampleRate * numChannels * 2, offset); offset += 4; // Byte rate
  buffer.writeUInt16LE(numChannels * 2, offset); offset += 2; // Block align
  buffer.writeUInt16LE(16, offset); offset += 2; // Bits per sample
  
  // data chunk
  buffer.write('data', offset); offset += 4;
  buffer.writeUInt32LE(numSamples * numChannels * 2, offset); offset += 4; // Data size
  
  // Generate audio data (sine wave with fade in/out)
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    
    // Fade in/out envelope
    const fadeIn = Math.min(1, t * 2); // 0.5 second fade in
    const fadeOut = Math.min(1, (duration - t) * 2); // 0.5 second fade out
    const envelope = Math.min(fadeIn, fadeOut);
    
    // Generate tone with some harmonics for richness
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
    const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.15;
    
    const sample = (fundamental + harmonic2 + harmonic3) * amplitude * envelope;
    
    // Convert to 16-bit PCM and write to both channels
    const int16 = Math.max(-32768, Math.min(32767, Math.round(sample * 32767)));
    
    // Left channel
    buffer.writeInt16LE(int16, offset); offset += 2;
    // Right channel (same signal for mono-compatible stereo)
    buffer.writeInt16LE(int16, offset); offset += 2;
  }
  
  // Write file
  const outputPath = path.join(__dirname, '..', 'public', 'test-audio.wav');
  fs.writeFileSync(outputPath, buffer);
  
  console.log('✅ Test audio file generated!');
  console.log(`📁 Location: ${outputPath}`);
  console.log(`🎵 Duration: ${duration} seconds`);
  console.log(`🎼 Frequency: ${frequency} Hz (A4)`);
  console.log(`📊 Sample Rate: ${sampleRate} Hz`);
  console.log(`🔊 Channels: ${numChannels} (Stereo)`);
  console.log(`\n💡 You can now import this file to test audio playback!`);
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    generateTestAudio();
  } catch (error) {
    console.error('❌ Error generating test audio:', error);
    process.exit(1);
  }
}

export { generateTestAudio };

