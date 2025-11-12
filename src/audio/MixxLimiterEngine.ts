import { IAudioEngine } from "../types/audio-graph";

type MixxLimiterParams = {
  threshold: number;
  release: number;
  makeupGain: number;
};

/**
 * MixxLimiterEngine
 * what: Hybrid dynamics stage with controllable threshold, release, and makeup gain.
 * why: Bring back the MixxClub suite's master safety net.
 * how: Wrap a DynamicsCompressorNode with make-up gain and normalized param mapping. (Flow / Recall)
 */
export class MixxLimiterEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;
  private dyn: DynamicsCompressorNode | null = null;
  private isInitialized = false;

  private params: MixxLimiterParams = {
    threshold: -6,
    release: 0.18,
    makeupGain: 1.0,
  };

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
    this.dyn = ctx.createDynamicsCompressor();

    this.dyn.threshold.value = this.params.threshold;
    this.dyn.knee.value = 12;
    this.dyn.ratio.value = 20;
    this.dyn.attack.value = 0.0025;
    this.dyn.release.value = this.params.release;
    this.makeup.gain.value = this.params.makeupGain;

    this.input.connect(this.dyn);
    this.dyn.connect(this.makeup);
    this.makeup.connect(this.output);

    this.isInitialized = true;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  dispose(): void {
    this.input.disconnect();
    this.dyn?.disconnect();
    this.makeup.disconnect();
    this.output.disconnect();
    this.isInitialized = false;
  }

  setClock(): void {
    // No tempo dependency.
  }

  setParameter(name: keyof MixxLimiterParams, value: number): void {
    (this.params as any)[name] = value;
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    switch (name) {
      case "threshold":
        this.dyn?.threshold.setTargetAtTime(value, now, 0.02);
        break;
      case "release":
        this.dyn?.release.setTargetAtTime(value, now, 0.02);
        break;
      case "makeupGain":
        this.makeup.gain.setTargetAtTime(value, now, 0.02);
        break;
      default:
        break;
    }
  }

  getParameter(name: keyof MixxLimiterParams): number {
    return this.params[name];
  }

  getParameterNames(): string[] {
    return ["threshold", "release", "makeupGain"];
  }

  getParameterMin(name: keyof MixxLimiterParams): number {
    switch (name) {
      case "threshold":
        return -30;
      case "release":
        return 0.05;
      case "makeupGain":
        return 0.5;
      default:
        return 0;
    }
  }

  getParameterMax(name: keyof MixxLimiterParams): number {
    switch (name) {
      case "threshold":
        return 0;
      case "release":
        return 0.6;
      case "makeupGain":
        return 3;
      default:
        return 1;
    }
  }
}

let limiterInstance: MixxLimiterEngine | null = null;

export function getMixxLimiterEngine(context: BaseAudioContext | null = null): MixxLimiterEngine {
  if (!limiterInstance) {
    limiterInstance = new MixxLimiterEngine(context);
  }
  if (context && !limiterInstance.audioContext) {
    limiterInstance.audioContext = context;
  }
  return limiterInstance;
}

export async function initializeMixxLimiterEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxLimiterEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}


