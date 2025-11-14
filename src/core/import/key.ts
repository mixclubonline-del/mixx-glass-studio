/**
 * Key Detection (Flow-Safe Psychoacoustic Model)
 * 
 * Layer 4.2 of the Flow Import Core.
 * Pure buffer analysis: no AudioContext required.
 * 
 * Flow Impact:
 * - Sets pitch grid
 * - Enables MixxTune smart mode
 * - Tells Velvet Curve how to handle presence frequencies
 * - Enables harmonics view on the Piano Roll
 * - ALS Harmony shifts
 */

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Detect musical key from audio buffer using frequency analysis.
 * 
 * @param buffer - Audio buffer to analyze
 * @returns Detected note name (e.g., "C", "F#", "A")
 */
export function detectKey(buffer: AudioBuffer): string {
  const channel = buffer.getChannelData(0);
  const fftSize = 2048;
  
  // Bin counter for each note (12 notes in octave)
  const bins = new Array(12).fill(0);
  
  // Analyze chunks of audio
  for (let i = 0; i < channel.length - fftSize; i += fftSize) {
    const slice = channel.slice(i, i + fftSize);
    
    // Find peak frequency in this slice
    let max = 0;
    let maxIndex = 0;
    
    for (let j = 0; j < slice.length; j++) {
      const v = Math.abs(slice[j]);
      if (v > max) {
        max = v;
        maxIndex = j;
      }
    }
    
    // Convert sample index to frequency (Hz)
    const freq = (maxIndex * buffer.sampleRate) / fftSize;
    
    // Convert frequency to MIDI note number, then to note index
    // MIDI note 69 = A4 (440 Hz)
    const midiNote = 12 * Math.log2(freq / 440) + 69;
    const noteIndex = Math.round(midiNote) % 12;
    
    // Ensure valid index
    if (!isNaN(noteIndex) && noteIndex >= 0 && noteIndex < 12) {
      bins[(noteIndex + 12) % 12]++;
    }
  }
  
  // Find the most common note (key center)
  const best = bins.indexOf(Math.max(...bins));
  
  return NOTES[best] || "C"; // Default to C if detection fails
}

/**
 * Detect key with mode (major/minor).
 * Simplified version - returns just the root note for now.
 * 
 * @param buffer - Audio buffer to analyze
 * @returns Object with root note and mode
 */
export function detectKeyWithMode(buffer: AudioBuffer): { root: string; mode: 'major' | 'minor' } {
  const root = detectKey(buffer);
  
  // Simplified: assume major for now
  // Full implementation would analyze harmonic intervals
  return {
    root,
    mode: 'major' as const,
  };
}

