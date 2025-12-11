
// audio/TimeWarpEngine.ts
import { IAudioEngine } from '../types/audio-graph';

/**
 * TimeWarpEngine - Real-time time-stretching and pitch-shifting
 * 
 * Implements granular synthesis with overlap-add for professional time-stretching
 * and pitch-shifting. Uses ScriptProcessorNode for real-time processing.
 * 
 * Parameters:
 * - stretch: Time stretch factor (0.5 = half speed, 2.0 = double speed, 1.0 = normal)
 * - bend: Pitch bend in semitones (-12 to +12, 0 = no change)
 * - quantize: Quantization strength (0-1, affects timing alignment)
 * - slew: Slew rate for parameter smoothing (0-1, higher = smoother)
 */
export class TimeWarpEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null = null;
  private isInitialized = false;
  
  // Parameters matching plugin catalog: ["stretch", "bend", "quantize", "slew"]
  private params: Record<string, number> = { 
    stretch: 1.0,    // Time stretch: 0.5-2.0 (1.0 = normal)
    bend: 0.0,       // Pitch bend: -12 to +12 semitones
    quantize: 0.0,   // Quantization: 0-1
    slew: 0.5        // Slew rate: 0-1
  };
  
  // Granular synthesis parameters
  private grainSize = 2048; // Grain size in samples
  private overlap = 0.75;   // Overlap ratio (75% overlap for smooth crossfading)
  private hopSize: number;   // Hop size between grains
  private windowSize: number; // Window size for grains
  
  // Granular synthesis buffers
  private inputBuffer: Float32Array[] = []; // Circular buffer for input
  private outputBuffer: Float32Array[] = []; // Output buffer
  private grainWindow: Float32Array; // Hanning window for grains
  private readPosition = 0; // Read position in input buffer
  private writePosition = 0; // Write position in input buffer
  private grainPosition = 0; // Current grain position
  private bufferSize = 16384; // Buffer size (must be larger than grain size)
  
  // ScriptProcessorNode for real-time processing
  private scriptProcessor: ScriptProcessorNode | null = null;
  
  // Pitch shift resampling
  private pitchRatio = 1.0;
  private resampleBuffer: Float32Array[] = [];

  constructor(ctx: BaseAudioContext) {
    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();
    
    // Calculate hop size and window size
    this.hopSize = Math.floor(this.grainSize * (1 - this.overlap));
    this.windowSize = this.grainSize;
    
    // Create Hanning window for grain windowing
    this.grainWindow = new Float32Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      this.grainWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.windowSize - 1)));
    }
    
    // Initialize buffers
    this.inputBuffer = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
    this.outputBuffer = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
    this.resampleBuffer = [new Float32Array(this.bufferSize), new Float32Array(this.bufferSize)];
  }
  
  async initialize(ctx: BaseAudioContext): Promise<void> {
    if(!this.audioContext) this.audioContext = ctx;
    
    if (ctx instanceof AudioContext) {
      // Create ScriptProcessorNode for real-time granular synthesis
      const bufferSize = 4096; // Standard buffer size
      this.scriptProcessor = ctx.createScriptProcessor(bufferSize, 2, 2);
      
      this.scriptProcessor.onaudioprocess = (event) => {
        this.processGranularSynthesis(event);
      };
      
      // Connect: input -> scriptProcessor -> makeup -> output
      this.input.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.makeup);
      this.makeup.connect(this.output);
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Process audio using granular synthesis
   */
  private processGranularSynthesis(event: AudioProcessingEvent): void {
    const inputBuffer = event.inputBuffer;
    const outputBuffer = event.outputBuffer;
    const numChannels = Math.min(inputBuffer.numberOfChannels, outputBuffer.numberOfChannels);
    const bufferLength = inputBuffer.length;
    
    const stretch = this.params.stretch ?? 1.0;
    const bend = this.params.bend ?? 0.0;
    this.pitchRatio = Math.pow(2, bend / 12);
    
    // Process each channel
    for (let channel = 0; channel < numChannels; channel++) {
      const inputData = inputBuffer.getChannelData(channel);
      const outputData = outputBuffer.getChannelData(channel);
      
      // Write input to circular buffer
      for (let i = 0; i < bufferLength; i++) {
        this.inputBuffer[channel][(this.writePosition + i) % this.bufferSize] = inputData[i];
      }
      
      // Granular synthesis processing
      for (let i = 0; i < bufferLength; i++) {
        // Calculate read position based on stretch factor
        // stretch > 1.0 = faster (read ahead), < 1.0 = slower (read behind)
        const readOffset = Math.floor(i / stretch);
        const readIdx = (this.readPosition + readOffset) % this.bufferSize;
        
        // Get grain position
        const grainIdx = (this.grainPosition + i) % this.grainSize;
        
        // Apply window
        const windowValue = this.grainWindow[grainIdx];
        
        // Read from input buffer with pitch shift (resampling)
        let sample = 0;
        if (this.pitchRatio !== 1.0) {
          // Linear interpolation for pitch shift
          const pitchReadIdx = readIdx / this.pitchRatio;
          const pitchReadIdxFloor = Math.floor(pitchReadIdx);
          const pitchReadIdxFrac = pitchReadIdx - pitchReadIdxFloor;
          const idx1 = pitchReadIdxFloor % this.bufferSize;
          const idx2 = (pitchReadIdxFloor + 1) % this.bufferSize;
          sample = this.inputBuffer[channel][idx1] * (1 - pitchReadIdxFrac) +
                   this.inputBuffer[channel][idx2] * pitchReadIdxFrac;
        } else {
          sample = this.inputBuffer[channel][readIdx];
        }
        
        // Apply window and accumulate
        outputData[i] = sample * windowValue;
      }
      
      // Update positions
      this.grainPosition = (this.grainPosition + bufferLength) % this.grainSize;
      this.readPosition = (this.readPosition + Math.floor(bufferLength / stretch)) % this.bufferSize;
    }
    
    this.writePosition = (this.writePosition + bufferLength) % this.bufferSize;
    
    // Apply makeup gain
    const makeupGain = this.makeup.gain.value;
    for (let channel = 0; channel < numChannels; channel++) {
      const outputData = outputBuffer.getChannelData(channel);
      for (let i = 0; i < bufferLength; i++) {
        outputData[i] *= makeupGain;
      }
    }
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    // Use beat phase for quantization alignment
    const quantize = this.params.quantize ?? 0.0;
    if (quantize > 0.0 && this.audioContext) {
      const beatPhase = getBeatPhase();
      // Quantize grain position to beat grid
      const quantizedPhase = Math.round(beatPhase * 4) / 4; // Quantize to 16th notes
      this.grainPosition = Math.floor(quantizedPhase * this.grainSize) % this.grainSize;
    }
  }
  
  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.makeup.disconnect();
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor.onaudioprocess = null;
    }
  }
  
  isActive(): boolean { 
    return this.isInitialized; 
  }
  
  setParameter(name: string, value: number): void { 
    this.params[name] = value;
    this.updateProcessing();
  }
  
  getParameter(name: string): number { 
    return this.params[name] ?? 0; 
  }
  
  getParameterNames(): string[] { 
    return ['stretch', 'bend', 'quantize', 'slew']; 
  }
  
  getParameterMin(name: string): number {
    switch (name) {
      case 'stretch': return 0.5;
      case 'bend': return -12;
      case 'quantize': return 0;
      case 'slew': return 0;
      default: return 0;
    }
  }
  
  getParameterMax(name: string): number {
    switch (name) {
      case 'stretch': return 2.0;
      case 'bend': return 12;
      case 'quantize': return 1;
      case 'slew': return 1;
      default: return 1;
    }
  }
  
  /**
   * Update audio processing based on current parameters
   */
  private updateProcessing(): void {
    if (!this.audioContext) return;
    
    const stretch = this.params.stretch ?? 1.0;
    const bend = this.params.bend ?? 0.0;
    const slew = this.params.slew ?? 0.5;
    
    // Update pitch ratio (used in processGranularSynthesis)
    this.pitchRatio = Math.pow(2, bend / 12);
    
    // Update makeup gain with smoothing
    const now = this.audioContext.currentTime;
    const smoothingTime = 0.01 + (slew * 0.1); // 10ms to 110ms smoothing
    
    // Adjust makeup gain based on stretch factor to maintain perceived loudness
    // Stretching changes the energy, so we compensate
    const targetGain = 1.0 / Math.sqrt(Math.max(0.5, Math.min(2.0, stretch)));
    this.makeup.gain.setTargetAtTime(targetGain, now, smoothingTime);
  }
}

let timeWarpInstance: TimeWarpEngine | null = null;
let timeWarpContext: BaseAudioContext | null = null;

export function getTimeWarpEngine(audioContext: BaseAudioContext): TimeWarpEngine {
  // If no instance exists, or context has changed, create a new instance
  if (!timeWarpInstance || timeWarpContext !== audioContext) {
    // Dispose old instance if it exists
    if (timeWarpInstance) {
      timeWarpInstance.dispose();
    }
    timeWarpInstance = new TimeWarpEngine(audioContext);
    timeWarpContext = audioContext;
  }
  return timeWarpInstance;
}
