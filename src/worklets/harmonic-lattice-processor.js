/**
 * HARMONIC LATTICE PROCESSOR - AudioWorklet
 * 
 * Optimized AudioWorklet processor for Harmonic Lattice stage.
 * Provides mid-frequency presence boost, high-shelf air, and character saturation.
 * 
 * Phase 34: Full stereo support with isolated L/R EQ states.
 * 
 * @author Prime (Mixx Club)
 * @version 2.0.0 - Phase 34 Stereo Migration
 */

class HarmonicLatticeProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'presence',
        defaultValue: 65,
        minValue: 0,
        maxValue: 100,
        automationRate: 'k-rate',
      },
      {
        name: 'airiness',
        defaultValue: 60,
        minValue: 0,
        maxValue: 100,
        automationRate: 'k-rate',
      },
      {
        name: 'character',
        defaultValue: 0.1, // 0=neutral, 0.2=bright, 0.4=warm, 0.6=vintage
        minValue: 0,
        maxValue: 1,
        automationRate: 'k-rate',
      },
    ];
  }

  constructor() {
    super();
    
    this.sampleRate = sampleRate;
    
    // Stereo mid peaking EQ states (1kHz) - isolated L/R
    this.midPeakStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.midPeakStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Stereo high shelf EQ states (8kHz) - isolated L/R
    this.highShelfStateL = { x1: 0, x2: 0, y1: 0, y2: 0 };
    this.highShelfStateR = { x1: 0, x2: 0, y1: 0, y2: 0 };
    
    // Saturation curve cache
    this.saturationCurve = null;
    this.lastCharacter = -1;
  }

  /**
   * Create saturation curve based on character
   */
  createSaturationCurve(character) {
    if (this.saturationCurve && this.lastCharacter === character) {
      return this.saturationCurve;
    }
    
    const samples = 1024;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    const amount = character;

    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const y = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      curve[i] = y;
    }
    
    this.saturationCurve = curve;
    this.lastCharacter = character;
    return curve;
  }

  /**
   * Apply peaking EQ filter with channel-isolated state
   */
  applyPeakingEQ(input, frequency, q, gainDb, state) {
    const omega = 2 * Math.PI * frequency / this.sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const alpha = sinOmega / (2 * q);
    const A = Math.pow(10, gainDb / 40);
    
    const b0 = 1 + alpha * A;
    const b1 = -2 * cosOmega;
    const b2 = 1 - alpha * A;
    const a0 = 1 + alpha / A;
    const a1 = -2 * cosOmega;
    const a2 = 1 - alpha / A;
    
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const y = (b0 / a0) * x + (b1 / a0) * state.x1 + 
                (b2 / a0) * state.x2 - 
                (a1 / a0) * state.y1 - 
                (a2 / a0) * state.y2;
      
      state.x2 = state.x1;
      state.x1 = x;
      state.y2 = state.y1;
      state.y1 = y;
      
      output[i] = y;
    }
    
    return output;
  }

  /**
   * Apply high shelf EQ filter with channel-isolated state
   */
  applyHighShelf(input, frequency, gainDb, state) {
    const omega = 2 * Math.PI * frequency / this.sampleRate;
    const cosOmega = Math.cos(omega);
    const sinOmega = Math.sin(omega);
    const A = Math.pow(10, gainDb / 40);
    const alpha = sinOmega / 2 * Math.sqrt((A + 1 / A) * (1 / 0.9 - 1) + 2);
    
    const b0 = A * ((A + 1) + (A - 1) * cosOmega + 2 * Math.sqrt(A) * alpha);
    const b1 = -2 * A * ((A - 1) + (A + 1) * cosOmega);
    const b2 = A * ((A + 1) + (A - 1) * cosOmega - 2 * Math.sqrt(A) * alpha);
    const a0 = (A + 1) - (A - 1) * cosOmega + 2 * Math.sqrt(A) * alpha;
    const a1 = 2 * ((A - 1) - (A + 1) * cosOmega);
    const a2 = (A + 1) - (A - 1) * cosOmega - 2 * Math.sqrt(A) * alpha;
    
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const y = (b0 / a0) * x + (b1 / a0) * state.x1 + 
                (b2 / a0) * state.x2 - 
                (a1 / a0) * state.y1 - 
                (a2 / a0) * state.y2;
      
      state.x2 = state.x1;
      state.x1 = x;
      state.y2 = state.y1;
      state.y1 = y;
      
      output[i] = y;
    }
    
    return output;
  }

  /**
   * Apply saturation (waveshaper)
   */
  applySaturation(input, character) {
    const curve = this.createSaturationCurve(character);
    const output = new Float32Array(input.length);
    
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const index = Math.floor((x + 1) * (curve.length / 2));
      const clampedIndex = Math.max(0, Math.min(curve.length - 1, index));
      output[i] = curve[clampedIndex];
    }
    
    return output;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input.length || !output || !output.length) {
      return true;
    }
    
    const presence = parameters.presence[0] || 65;
    const airiness = parameters.airiness[0] || 60;
    const character = parameters.character[0] || 0.1;
    
    // Calculate gains from presence/airiness
    const midGainDb = (presence - 65) / 5; // -13 to +7 dB
    const highGainDb = (airiness - 60) / 10; // -6 to +4 dB
    
    // Process all channels (stereo support)
    const numChannels = Math.min(input.length, output.length);
    
    for (let channel = 0; channel < numChannels; channel++) {
      const inputChannel = input[channel];
      const outputChannel = output[channel];
      
      if (!inputChannel || !outputChannel) continue;
      
      // Select channel-specific filter states
      const midPeakState = channel === 0 ? this.midPeakStateL : this.midPeakStateR;
      const highShelfState = channel === 0 ? this.highShelfStateL : this.highShelfStateR;
      
      // Process: Mid Peak EQ → High Shelf EQ → Saturation
      const midBoosted = this.applyPeakingEQ(inputChannel, 1000, 1.0, midGainDb, midPeakState);
      const airEnhanced = this.applyHighShelf(midBoosted, 8000, highGainDb, highShelfState);
      const saturated = this.applySaturation(airEnhanced, character);
      
      // Copy to output
      for (let i = 0; i < outputChannel.length; i++) {
        outputChannel[i] = saturated[i];
      }
    }
    
    return true;
  }
}

registerProcessor('harmonic-lattice-processor', HarmonicLatticeProcessor);
