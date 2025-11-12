import { IAudioEngine } from "../types/audio-graph";

type MixxAuraParams = {
  tone: number;
  width: number;
  shine: number;
  moodLock: number;
};

/**
 * MixxAuraEngine
 * what: Psychoacoustic widener & tonal shimmer.
 * why: Reintroduce the neural tier width enhancer.
 * how: Mid/side gain, high-shelf glow, wet/dry mix. (Flow / Recall)
 */
export class MixxAuraEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private midGain: GainNode | null = null;
  private sideGain: GainNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;
  private shineFilter: BiquadFilterNode | null = null;

  private params: MixxAuraParams = {
    tone: 50,
    width: 50,
    shine: 50,
    moodLock: 0,
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

    this.splitter = ctx.createChannelSplitter(2);
    this.merger = ctx.createChannelMerger(2);
    this.midGain = ctx.createGain();
    this.sideGain = ctx.createGain();
    this.shineFilter = ctx.createBiquadFilter();
    this.shineFilter.type = "highshelf";
    this.shineFilter.frequency.value = 8000;

    this.input.connect(this.splitter);
    const left = ctx.createGain();
    const right = ctx.createGain();
    this.splitter.connect(left, 0);
    this.splitter.connect(right, 1);

    const mid = ctx.createGain();
    const side = ctx.createGain();

    left.connect(mid);
    right.connect(mid);

    left.connect(side);
    right.connect(side);
    side.gain.value = -1;

    mid.connect(this.midGain);
    side.connect(this.sideGain);

    const midOut = ctx.createGain();
    const sideOut = ctx.createGain();

    this.midGain.connect(midOut);
    this.sideGain.connect(sideOut);
    sideOut.connect(this.shineFilter);
    this.shineFilter.connect(sideOut);

    const leftOut = ctx.createGain();
    const rightOut = ctx.createGain();

    midOut.connect(leftOut);
    sideOut.connect(leftOut);
    midOut.connect(rightOut);
    sideOut.connect(rightOut);
    sideOut.gain.value = 1;

    leftOut.connect(this.merger, 0, 0);
    rightOut.connect(this.merger, 0, 1);
    this.merger.connect(this.makeup);
    this.makeup.connect(this.output);

    this.updateParameters();
    this.isInitialized = true;
    console.log("🌌 MixxAuraEngine online");
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(): void {
    // Future: sync width modulation to mood/meter.
  }

  dispose(): void {
    this.input?.disconnect();
    this.output?.disconnect();
    this.makeup?.disconnect();
    this.splitter?.disconnect();
    this.merger?.disconnect();
    this.midGain?.disconnect();
    this.sideGain?.disconnect();
    this.shineFilter?.disconnect();
    this.isInitialized = false;
  }

  setParameter(name: string, value: number): void {
    this.params[name as keyof MixxAuraParams] = this.clamp(value);
    this.updateParameters();
  }

  getParameter(name: string): number {
    return this.params[name as keyof MixxAuraParams];
  }

  getParameterNames(): string[] {
    return ["tone", "width", "shine", "moodLock"];
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

    if (this.midGain && this.sideGain) {
      const width = this.params.width / 100;
      const lock = this.params.moodLock / 100;
      const mixAmount = width * (1 - lock * 0.65);
      this.midGain.gain.setTargetAtTime(0.7 + (1 - width) * 0.3, now, 0.05);
      this.sideGain.gain.setTargetAtTime(0.7 + mixAmount * 0.5, now, 0.05);
    }

    if (this.shineFilter) {
      const shine = this.params.shine / 100;
      this.shineFilter.gain.setTargetAtTime(shine * 6, now, 0.05);
      const tone = this.params.tone / 100;
      this.shineFilter.frequency.setTargetAtTime(6000 + tone * 6000, now, 0.05);
    }

    if (this.makeup) {
      const tone = this.params.tone / 100;
      this.makeup.gain.setTargetAtTime(1 + (tone - 0.5) * 0.2, now, 0.1);
    }
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}

let instance: MixxAuraEngine | null = null;

export function getMixxAuraEngine(context: BaseAudioContext | null = null): MixxAuraEngine {
  if (!instance) {
    instance = new MixxAuraEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializeMixxAuraEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxAuraEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

