

import { IAudioEngine } from '../types/audio-graph';

export class MixxFXEngine implements IAudioEngine {
  public input: AudioNode;
  public output: AudioNode;
  public makeup: GainNode;
  private isInitialized = false;
  public audioContext: BaseAudioContext | null = null; // Public for debugging/re-init

  private params = {
    drive: 0.2, // Default to a subtle drive
    tone: 0.5,
    depth: 0.5,
    mix: 1.0,
  };

  // Audio nodes for actual processing
  private preGain: GainNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private postGain: GainNode | null = null;
  private dryGain: GainNode | null = null; // For the wet/dry mix
  private wetGain: GainNode | null = null; // For the wet/dry mix

  constructor(audioContext: BaseAudioContext | null = null) {
    this.audioContext = audioContext;
    this.input = audioContext ? audioContext.createGain() : null as any;
    this.output = audioContext ? audioContext.createGain() : null as any;
    this.makeup = audioContext ? audioContext.createGain() : null as any;
  }

  async initialize(ctx: BaseAudioContext): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = ctx;

    this.input = ctx.createGain(); // Recreate if dummy
    this.makeup = ctx.createGain(); // Recreate if dummy
    this.output = ctx.createGain(); // Recreate if dummy

    this.preGain = ctx.createGain();
    this.waveShaper = ctx.createWaveShaper();
    this.postGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    // Create a saturation curve for the waveshaper
    this.updateDriveCurve();

    // Connect the processing chain for the wet signal
    // Public input -> internal preGain -> waveShaper -> postGain -> wetGain
    this.input.connect(this.preGain);
    this.preGain.connect(this.waveShaper);
    this.waveShaper.connect(this.postGain);
    this.postGain.connect(this.wetGain);

    // Connect the dry signal path from public input
    this.input.connect(this.dryGain);

    // Mix dry and wet signals into makeup gain, then to public output
    this.dryGain.connect(this.makeup);
    this.wetGain.connect(this.makeup);
    this.makeup.connect(this.output);

    this.updateMix(); // Set initial mix level
    this.isInitialized = true;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    // Not used in this placeholder
  }

  dispose(): void {
    this.input?.disconnect();
    this.preGain?.disconnect();
    this.waveShaper?.disconnect();
    this.postGain?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.makeup?.disconnect();
    this.output?.disconnect();
    this.isInitialized = false;
  }

  private updateMix(): void {
    if (!this.dryGain || !this.wetGain || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const dry = 1 - this.params.mix;
    const wet = this.params.mix;
    this.dryGain.gain.setTargetAtTime(dry, now, 0.01);
    this.wetGain.gain.setTargetAtTime(wet, now, 0.01);
  }

  private updateDriveCurve(): void {
    if (!this.waveShaper || !this.audioContext) return;
    const curve = new Float32Array(2048);
    for (let i = 0; i < 2048; i++) {
      const x = (i * 2) / 2048 - 1;
      curve[i] = Math.tanh(x * this.params.drive * 10); // Drive controls the intensity of tanh
    }
    this.waveShaper.curve = curve;
  }

  setParameter(name: string, value: number): void {
    if (name in this.params) {
      (this.params as any)[name] = value;
      if (name === 'mix') {
        this.updateMix();
      } else if (name === 'drive') {
        this.updateDriveCurve();
      }
      // Implement logic for other parameters here (tone, depth)
    }
  }

  getParameter(name: string): number {
    return (this.params as any)[name] || 0;
  }

  getParameterNames(): string[] {
    return Object.keys(this.params);
  }

  getParameterMin(name: string): number {
    // All current parameters are 0-1 range
    return 0;
  }

  getParameterMax(name: string): number {
    // All current parameters are 0-1 range
    return 1;
  }
}

let mixxFXInstance: MixxFXEngine | null = null;

export function getMixxFXEngine(audioContext: BaseAudioContext | null = null): MixxFXEngine {
  // If instance exists but context is closed or different, dispose and recreate
  if (mixxFXInstance) {
    const existingContext = mixxFXInstance.audioContext;
    const contextClosed = existingContext && 'state' in existingContext && existingContext.state === 'closed';
    const contextChanged = audioContext && existingContext && existingContext !== audioContext;
    
    if (contextClosed || contextChanged) {
      mixxFXInstance.dispose();
      mixxFXInstance = null;
    }
  }
  
  if (!mixxFXInstance) {
    mixxFXInstance = new MixxFXEngine(audioContext);
  } else if (audioContext && !mixxFXInstance.audioContext) {
    // If context is provided later, set it
    mixxFXInstance.audioContext = audioContext;
    // Re-create dummy nodes to actual nodes
    mixxFXInstance.input = audioContext.createGain();
    mixxFXInstance.output = audioContext.createGain();
    mixxFXInstance.makeup = audioContext.createGain();
  }
  return mixxFXInstance;
}

export async function initializeMixxFXEngine(audioContext: BaseAudioContext): Promise<void> {
  const engine = getMixxFXEngine(audioContext);
  if (!engine.isActive()) {
    await engine.initialize(audioContext);
  }
}