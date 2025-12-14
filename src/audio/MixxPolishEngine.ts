import { IAudioEngine } from "../types/audio-graph";

type MixxPolishParams = {
  clarity: number;
  air: number;
  balance: number;
};

/**
 * MixxPolishEngine
 * what: Spectral sheen enhancer.
 * why: Restore Neural tier sweetener inside Studio Flow.
 * how: Multi-band shelving with wet/dry blend. (Flow / Recall)
 */
export class MixxPolishEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private lowShelf: BiquadFilterNode | null = null;
  private highShelf: BiquadFilterNode | null = null;
  private bandGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  private params: MixxPolishParams = {
    clarity: 50,
    air: 50,
    balance: 50,
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

    this.lowShelf = ctx.createBiquadFilter();
    this.lowShelf.type = "lowshelf";
    this.lowShelf.frequency.value = 220;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = "highshelf";
    this.highShelf.frequency.value = 8000;

    this.bandGain = ctx.createGain();
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();

    this.input.connect(this.lowShelf);
    this.lowShelf.connect(this.highShelf);
    this.highShelf.connect(this.bandGain);
    this.bandGain.connect(this.wetGain);

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
    // No tempo dependency yet.
  }

  dispose(): void {
    this.lowShelf?.disconnect();
    this.highShelf?.disconnect();
    this.bandGain?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.makeup?.disconnect();
    this.output?.disconnect();
    this.input?.disconnect();
    this.isInitialized = false;
  }

  setParameter(name: string, value: number): void {
    this.params[name as keyof MixxPolishParams] = this.clamp(value);
    this.updateParameters();
  }

  getParameter(name: string): number {
    return this.params[name as keyof MixxPolishParams];
  }

  getParameterNames(): string[] {
    return ["clarity", "air", "balance"];
  }

  getParameterMin(): number {
    return 0;
  }

  getParameterMax(): number {
    return 100;
  }

  private updateParameters(): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    const clarity = this.params.clarity / 100;
    const air = this.params.air / 100;
    const balance = this.params.balance / 100;

    if (this.lowShelf) {
      this.lowShelf.gain.setTargetAtTime((balance - 0.5) * 6, now, 0.05);
    }

    if (this.highShelf) {
      this.highShelf.gain.setTargetAtTime(air * 8, now, 0.05);
    }

    if (this.bandGain) {
      this.bandGain.gain.setTargetAtTime(1 + clarity * 0.4, now, 0.05);
    }

    if (this.dryGain && this.wetGain) {
      const mix = 0.5 + clarity * 0.4;
      this.dryGain.gain.setTargetAtTime(1 - mix, now, 0.05);
      this.wetGain.gain.setTargetAtTime(mix, now, 0.05);
    }
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}

let instance: MixxPolishEngine | null = null;

export function getMixxPolishEngine(context: BaseAudioContext | null = null): MixxPolishEngine {
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
    instance = new MixxPolishEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializeMixxPolishEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxPolishEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

