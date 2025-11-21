import { IAudioEngine } from "../types/audio-graph";

type MixxLimiterParams = {
  threshold: number;
  release: number;
  makeupGain: number;
};

/**
 * MixxLimiterEngine
 * what: Hybrid dynamics stage with controllable threshold, release, and makeup gain.
 * why: Bring back the F.L.O.W. suite's master safety net.
 * Created by Ravenis Prime (F.L.O.W)
 * how: Wrap a DynamicsCompressorNode with make-up gain and normalized param mapping. (Flow / Recall)
 */
export class MixxLimiterEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;
  sidechainInput?: GainNode;
  private dyn: DynamicsCompressorNode | null = null;
  private isInitialized = false;
  private sidechainSource: AudioNode | null = null;
  private sidechainAnalyser: AnalyserNode | null = null;
  private sidechainGain: GainNode | null = null;

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
    this.sidechainInput = ctx.createGain();
    this.sidechainInput.gain.value = 1.0;
    this.dyn = ctx.createDynamicsCompressor();

    this.dyn.threshold.value = this.params.threshold;
    this.dyn.knee.value = 12;
    this.dyn.ratio.value = 20;
    this.dyn.attack.value = 0.0025;
    this.dyn.release.value = this.params.release;
    this.makeup.gain.value = this.params.makeupGain;

    this.sidechainGain = ctx.createGain();
    this.sidechainAnalyser = ctx.createAnalyser();
    this.sidechainAnalyser.fftSize = 256;
    this.sidechainAnalyser.smoothingTimeConstant = 0.8;

    this.input.connect(this.dyn);
    this.dyn.connect(this.makeup);
    this.makeup.connect(this.output);

    // Sidechain routing
    if (this.sidechainInput) {
      this.sidechainInput.connect(this.sidechainGain);
      this.sidechainGain.connect(this.sidechainAnalyser);
    }

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
    this.sidechainInput?.disconnect();
    this.sidechainGain?.disconnect();
    this.sidechainAnalyser?.disconnect();
    this.sidechainSource = null;
    this.isInitialized = false;
  }

  setSidechainSource(source: AudioNode | null): void {
    if (!this.audioContext || !this.sidechainInput) return;

    // Disconnect existing source
    if (this.sidechainSource) {
      try {
        this.sidechainSource.disconnect();
      } catch (e) {
        // Already disconnected
      }
    }

    this.sidechainSource = source;

    // Connect new source
    if (source && this.sidechainInput) {
      source.connect(this.sidechainInput);
      console.log('[MixxLimiter] Sidechain source connected');
    } else {
      console.log('[MixxLimiter] Sidechain source disconnected');
    }
  }

  getSidechainSource(): AudioNode | null {
    return this.sidechainSource;
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


