/**
 * PSOLA (Pitch Synchronous Overlap-Add) Algorithm
 * Fast, low-latency pitch shifting for real-time monitoring
 */

export class PSolaShifter {
  private sampleRate: number;
  
  constructor(sampleRate: number) {
    this.sampleRate = sampleRate;
  }
  
  /**
   * Shift pitch of audio buffer
   * @param input Input audio buffer
   * @param pitchRatio Target pitch / current pitch (e.g., 1.0594631 for +1 semitone)
   * @returns Pitch-shifted audio buffer
   */
  shift(input: Float32Array, pitchRatio: number): Float32Array {
    if (pitchRatio === 1.0 || input.length === 0) {
      return input;
    }
    
    const windowSize = Math.floor(this.sampleRate * 0.02); // 20ms window
    const hopSize = Math.floor(windowSize / 4);
    const outputLength = Math.floor(input.length / pitchRatio);
    const output = new Float32Array(outputLength);
    
    // Hann window
    const window = this.createHannWindow(windowSize);
    
    let inputPos = 0;
    let outputPos = 0;
    
    while (inputPos + windowSize < input.length && outputPos + windowSize < outputLength) {
      // Extract windowed frame
      const frame = new Float32Array(windowSize);
      for (let i = 0; i < windowSize; i++) {
        frame[i] = input[Math.floor(inputPos) + i] * window[i];
      }
      
      // Overlap-add to output
      for (let i = 0; i < windowSize; i++) {
        if (outputPos + i < outputLength) {
          output[outputPos + i] += frame[i];
        }
      }
      
      inputPos += hopSize * pitchRatio;
      outputPos += hopSize;
    }
    
    // Normalize
    const maxVal = Math.max(...Array.from(output).map(Math.abs));
    if (maxVal > 0) {
      for (let i = 0; i < output.length; i++) {
        output[i] /= maxVal;
      }
    }
    
    return output;
  }
  
  /**
   * Create Hann window
   */
  private createHannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }
  
  /**
   * Calculate pitch ratio from semitone shift
   */
  static semitonesToRatio(semitones: number): number {
    return Math.pow(2, semitones / 12);
  }
  
  /**
   * Calculate pitch ratio to correct cents offset
   */
  static centsToRatio(cents: number): number {
    return Math.pow(2, cents / 1200);
  }
}
