import { IAudioEngine } from "../types/audio-graph";

type PrimeEQParams = {
  lowGain: number;
  midGain: number;
  highGain: number;
  smartFocus: number;
};

/**
 * PrimeEQEngine
 * what: Adaptive EQ module from the neural tier.
 * why: Bring Prime EQ back into the Studio mix flow.
 * how: Three-band shelves/peaking with smart focus tilt. (Flow / Recall)
 */
export class PrimeEQEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private lowShelf: BiquadFilterNode | null = null;
  private midBell: BiquadFilterNode | null = null;
  private highShelf: BiquadFilterNode | null = null;

  private params: PrimeEQParams = {
    lowGain: 0,
    midGain: 0,
    highGain: 0,
    smartFocus: 50,
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
    this.lowShelf.frequency.value = 120;

    this.midBell = ctx.createBiquadFilter();
    this.midBell.type = "peaking";
    this.midBell.frequency.value = 1800;
    this.midBell.Q.value = 0.8;

    this.highShelf = ctx.createBiquadFilter();
    this.highShelf.type = "highshelf";
    this.highShelf.frequency.value = 8000;

    this.input.connect(this.lowShelf);
    this.lowShelf.connect(this.midBell);
    this.midBell.connect(this.highShelf);
    this.highShelf.connect(this.makeup);
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
    // Future: drive smart focus by tempo.
  }

  dispose(): void {
    this.lowShelf?.disconnect();
    this.midBell?.disconnect();
    this.highShelf?.disconnect();
    this.makeup?.disconnect();
    this.output?.disconnect();
    this.input?.disconnect();
    this.isInitialized = false;
  }

  setParameter(name: string, value: number): void {
    this.params[name as keyof PrimeEQParams] = this.clamp(value, -12, 12);
    this.updateParameters();
  }

  getParameter(name: string): number {
    return this.params[name as keyof PrimeEQParams];
  }

  getParameterNames(): string[] {
    return ["lowGain", "midGain", "highGain", "smartFocus"];
  }

  getParameterMin(name: string): number {
    switch (name) {
      case "smartFocus":
        return 0;
      default:
        return -12;
    }
  }

  getParameterMax(name: string): number {
    switch (name) {
      case "smartFocus":
        return 100;
      default:
        return 12;
    }
  }

  private updateParameters(): void {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (this.lowShelf) {
      this.lowShelf.gain.setTargetAtTime(this.params.lowGain, now, 0.05);
    }
    if (this.midBell) {
      this.midBell.gain.setTargetAtTime(this.params.midGain, now, 0.05);
    }
    if (this.highShelf) {
      this.highShelf.gain.setTargetAtTime(this.params.highGain, now, 0.05);
    }

    if (this.makeup) {
      const focus = this.params.smartFocus / 100;
      const tilt = (focus - 0.5) * 0.3;
      this.lowShelf?.gain.setTargetAtTime(
        this.params.lowGain + tilt * -3,
        now,
        0.05
      );
      this.highShelf?.gain.setTargetAtTime(
        this.params.highGain + tilt * 3,
        now,
        0.05
      );
    }
  }

  private clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }
}

let instance: PrimeEQEngine | null = null;

export function getPrimeEQEngine(context: BaseAudioContext | null = null): PrimeEQEngine {
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
    instance = new PrimeEQEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializePrimeEQEngine(context: BaseAudioContext): Promise<void> {
  const engine = getPrimeEQEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

