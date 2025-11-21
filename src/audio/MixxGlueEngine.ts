import { IAudioEngine } from "../types/audio-graph";

type MixxGlueParams = {
  threshold: number;
  ratio: number;
  release: number;
  mix: number;
};

/**
 * MixxGlueEngine
 * what: Bus compressor / cohesion stage.
 * why: Restore the core tier glue compressor into Studio Flow.
 * how: Wrap DynamicsCompressorNode with mix control and parameter mapping. (Flow / Recall)
 */
export class MixxGlueEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;
  sidechainInput?: GainNode;

  private compressor: DynamicsCompressorNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private sidechainSource: AudioNode | null = null;
  private sidechainAnalyser: AnalyserNode | null = null;
  private sidechainGain: GainNode | null = null;

  private params: MixxGlueParams = {
    threshold: -20,
    ratio: 4,
    release: 100,
    mix: 100,
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
    this.sidechainInput = ctx.createGain();
    this.sidechainInput.gain.value = 1.0;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.attack.value = 0.01;
    this.compressor.knee.value = 4;
    this.compressor.threshold.value = this.params.threshold;
    this.compressor.ratio.value = this.params.ratio;
    this.compressor.release.value = this.params.release / 1000;

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.sidechainGain = ctx.createGain();
    this.sidechainAnalyser = ctx.createAnalyser();
    this.sidechainAnalyser.fftSize = 256;
    this.sidechainAnalyser.smoothingTimeConstant = 0.8;

    this.input.connect(this.compressor);
    this.compressor.connect(this.wetGain);

    this.input.connect(this.dryGain);

    this.dryGain.connect(this.makeup);
    this.wetGain.connect(this.makeup);
    this.makeup.connect(this.output);

    // Sidechain routing
    if (this.sidechainInput) {
      this.sidechainInput.connect(this.sidechainGain!);
      this.sidechainGain!.connect(this.sidechainAnalyser!);
    }

    this.updateParameters();
    this.isInitialized = true;
    console.log("🧵 MixxGlueEngine initialized");
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(): void {
    // Could sync release to tempo; not implemented yet.
  }

  dispose(): void {
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.compressor?.disconnect();
    this.makeup?.disconnect();
    this.output?.disconnect();
    this.input?.disconnect();
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
      console.log('[MixxGlue] Sidechain source connected');
    } else {
      console.log('[MixxGlue] Sidechain source disconnected');
    }
  }

  getSidechainSource(): AudioNode | null {
    return this.sidechainSource;
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case "threshold":
        this.params.threshold = this.clamp(value, -48, 0);
        break;
      case "ratio":
        this.params.ratio = this.clamp(value, 1, 20);
        break;
      case "release":
        this.params.release = this.clamp(value, 20, 1000);
        break;
      case "mix":
        this.params.mix = this.clamp(value, 0, 100);
        break;
      default:
        break;
    }
    this.updateParameters();
  }

  getParameter(name: string): number {
    return this.params[name as keyof MixxGlueParams];
  }

  getParameterNames(): string[] {
    return ["threshold", "ratio", "release", "mix"];
  }

  getParameterMin(name: string): number {
    switch (name) {
      case "threshold":
        return -48;
      case "ratio":
        return 1;
      case "release":
        return 20;
      case "mix":
        return 0;
      default:
        return 0;
    }
  }

  getParameterMax(name: string): number {
    switch (name) {
      case "threshold":
        return 0;
      case "ratio":
        return 20;
      case "release":
        return 1000;
      case "mix":
        return 100;
      default:
        return 1;
    }
  }

  private updateParameters() {
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;

    if (this.compressor) {
      this.compressor.threshold.setTargetAtTime(this.params.threshold, now, 0.05);
      this.compressor.ratio.setTargetAtTime(this.params.ratio, now, 0.05);
      this.compressor.release.setTargetAtTime(
        this.params.release / 1000,
        now,
        0.05
      );
    }

    if (this.dryGain && this.wetGain) {
      const mix = this.params.mix / 100;
      this.dryGain.gain.setTargetAtTime(1 - mix, now, 0.05);
      this.wetGain.gain.setTargetAtTime(mix, now, 0.05);
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }
}

let instance: MixxGlueEngine | null = null;

export function getMixxGlueEngine(context: BaseAudioContext | null = null): MixxGlueEngine {
  if (!instance) {
    instance = new MixxGlueEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializeMixxGlueEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxGlueEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

