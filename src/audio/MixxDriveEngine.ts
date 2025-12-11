import { IAudioEngine } from "../types/audio-graph";

type MixxDriveParams = {
  drive: number;
  warmth: number;
  mix: number;
  color: number;
};

/**
 * MixxDriveEngine
 * what: Harmonic drive / coloration stage.
 * why: Restore the core tier saturator inside Studio Flow.
 * how: Waveshaper with tone/tube blend, wet/dry control. (Flow / Recall)
 */
export class MixxDriveEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private preGain: GainNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  private params: MixxDriveParams = {
    drive: 30,
    warmth: 50,
    mix: 100,
    color: 50,
  };

  private isInitialized = false;

  constructor(context: BaseAudioContext | null = null) {
    this.audioContext = context;
    this.input = context ? context.createGain() : (null as unknown as GainNode);
    this.output = context ? context.createGain() : (null as unknown as GainNode);
    this.makeup = context ? context.createGain() : (null as unknown as GainNode);
  }

  async initialize(ctx: BaseAudioContext): Promise<void> {
    if (this.isInitialized) return;

    this.audioContext = ctx;
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.makeup = ctx.createGain();

    this.preGain = ctx.createGain();
    this.waveShaper = ctx.createWaveShaper();
    this.toneFilter = ctx.createBiquadFilter();
    this.toneFilter.type = "peaking";
    this.toneFilter.Q.value = 1;

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.preGain);
    this.preGain.connect(this.waveShaper);
    this.waveShaper.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);

    this.input.connect(this.dryGain);

    this.dryGain.connect(this.makeup);
    this.wetGain.connect(this.makeup);
    this.makeup.connect(this.output);

    this.updateParameters();
    this.isInitialized = true;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(): void {
    // No tempo coupling currently.
  }

  dispose(): void {
    this.preGain?.disconnect();
    this.waveShaper?.disconnect();
    this.toneFilter?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.makeup?.disconnect();
    this.output?.disconnect();
    this.input?.disconnect();
    this.isInitialized = false;
  }

  setParameter(name: string, value: number): void {
    this.params[name as keyof MixxDriveParams] = this.clamp(value);
    this.updateParameters();
  }

  getParameter(name: string): number {
    return this.params[name as keyof MixxDriveParams];
  }

  getParameterNames(): string[] {
    return ["drive", "warmth", "mix", "color"];
  }

  getParameterMin(): number {
    return 0;
  }

  getParameterMax(name: string): number {
    return name === "mix" ? 100 : 100;
  }

  private updateParameters() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (this.preGain) {
      const gain = 1 + (this.params.drive / 100) * 10;
      this.preGain.gain.setTargetAtTime(gain, now, 0.05);
    }

    if (this.waveShaper) {
      const amount = 1 + (this.params.drive / 100) * 6;
      const curve = new Float32Array(2048);
      for (let i = 0; i < curve.length; i++) {
        const x = (i * 2) / curve.length - 1;
        curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
      }
      this.waveShaper.curve = curve;
    }

    if (this.toneFilter) {
      const warmth = this.params.warmth / 100;
      const color = this.params.color / 100;
      const freq = 800 + warmth * 2600;
      const gain = -3 + color * 8;
      this.toneFilter.frequency.setTargetAtTime(freq, now, 0.05);
      this.toneFilter.gain.setTargetAtTime(gain, now, 0.05);
    }

    if (this.dryGain && this.wetGain) {
      const mix = this.params.mix / 100;
      this.dryGain.gain.setTargetAtTime(1 - mix, now, 0.05);
      this.wetGain.gain.setTargetAtTime(mix, now, 0.05);
    }
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}

let instance: MixxDriveEngine | null = null;

export function getMixxDriveEngine(context: BaseAudioContext | null = null): MixxDriveEngine {
  // If instance exists but context is closed or different, dispose and recreate
  if (instance) {
    const existingContext = instance.audioContext;
    const contextClosed = existingContext && 'state' in existingContext && existingContext.state === 'closed';
    const contextChanged = context && existingContext && existingContext !== context;
    
    if (contextClosed || contextChanged) {
      instance.dispose();
      instance = null;
    }
  }
  
  if (!instance) {
    instance = new MixxDriveEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializeMixxDriveEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxDriveEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

