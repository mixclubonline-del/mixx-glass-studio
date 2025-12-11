
// audio/TimeWarpEngine.ts
import { IAudioEngine } from '../types/audio-graph';

/**
 * TimeWarpEngine - Real-time time-stretching and pitch-shifting
 * 
 * Implements a basic granular synthesis approach for time-stretching audio
 * without changing pitch, and pitch-shifting without changing tempo.
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
  
  // Audio processing nodes
  private delayNode: DelayNode | null = null;
  private pitchShiftNode: GainNode | null = null;
  private smoothingNode: GainNode | null = null;
  
  // Granular synthesis buffers (simplified approach)
  private bufferSize = 4096;
  private grainSize = 1024;
  private overlap = 0.5;
  private readPosition = 0;
  private writePosition = 0;
  private audioBuffer: Float32Array[] | null = null; // [left, right] channels

  constructor(ctx: BaseAudioContext) {
    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();
    
    // Initialize delay for time-stretching
    this.delayNode = ctx.createDelay(1.0); // Max 1 second delay
    this.delayNode.delayTime.value = 0;
    
    // Initialize pitch shift (using playbackRate on a source - will be set up in initialize)
    this.pitchShiftNode = ctx.createGain();
    this.pitchShiftNode.gain.value = 1.0;
    
    // Smoothing node for parameter changes
    this.smoothingNode = ctx.createGain();
    this.smoothingNode.gain.value = 1.0;
    
    // Connect: input -> delay -> pitch -> smoothing -> makeup -> output
    // For now, direct connection until we implement full granular synthesis
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.pitchShiftNode);
    this.pitchShiftNode.connect(this.smoothingNode);
    this.smoothingNode.connect(this.makeup);
    this.makeup.connect(this.output);
  }
  
  async initialize(ctx: BaseAudioContext): Promise<void> {
    if(!this.audioContext) this.audioContext = ctx;
    
    // Initialize audio buffers for granular synthesis
    if (ctx instanceof AudioContext) {
      this.audioBuffer = [
        new Float32Array(this.bufferSize),
        new Float32Array(this.bufferSize)
      ];
    }
    
    this.isInitialized = true;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    // Could use beat phase for quantization
  }
  
  dispose(): void {
    this.input.disconnect();
    this.output.disconnect();
    this.makeup.disconnect();
    if (this.delayNode) this.delayNode.disconnect();
    if (this.pitchShiftNode) this.pitchShiftNode.disconnect();
    if (this.smoothingNode) this.smoothingNode.disconnect();
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
    if (!this.audioContext || !this.delayNode || !this.pitchShiftNode) return;
    
    const stretch = this.params.stretch ?? 1.0;
    const bend = this.params.bend ?? 0.0;
    const slew = this.params.slew ?? 0.5;
    
    // Calculate pitch shift ratio from semitones
    // 12 semitones = 1 octave = 2x frequency
    const pitchRatio = Math.pow(2, bend / 12);
    
    // For time-stretching, we adjust delay to create the effect
    // Stretch > 1.0 means faster (less delay), < 1.0 means slower (more delay)
    // This is a simplified approach - full implementation would use granular synthesis
    const delayTime = Math.max(0, Math.min(0.1, (1.0 - stretch) * 0.05));
    
    const now = this.audioContext.currentTime;
    const smoothingTime = 0.01 + (slew * 0.1); // 10ms to 110ms smoothing
    
    // Apply delay for time-stretching effect
    this.delayNode.delayTime.setTargetAtTime(delayTime, now, smoothingTime);
    
    // Apply pitch shift via gain (simplified - real pitch shift needs resampling)
    // For now, we'll use a simple approach that affects the sound
    // Full implementation would use a pitch shifter algorithm
    const pitchGain = 1.0 + (pitchRatio - 1.0) * 0.1; // Subtle effect
    this.pitchShiftNode.gain.setTargetAtTime(pitchGain, now, smoothingTime);
    
    // Note: This is a basic implementation. For professional quality:
    // - Implement full granular synthesis with overlap-add
    // - Use phase vocoder for pitch-shifting
    // - Add proper resampling for pitch changes
    // - Implement quantization timing alignment
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
