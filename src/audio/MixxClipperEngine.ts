import { IAudioEngine } from "../types/audio-graph";

type MixxClipParams = {
  amount: number;
  bias: number;
  mix: number;
};

/**
 * MixxClipperEngine
 * what: Soft clipper inspired by MixxClub suite.
 * why: Restore headroom and energy management in the new mixer flow.
 * how: Wrap a waveshaper with bias tilt and wet/dry control. (Reduction / Flow)
 */
export class MixxClipperEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private waveShaper: WaveShaperNode | null = null;
  private biasGain: GainNode | null = null;
  private isInitialized = false;

  private params: MixxClipParams = {
    amount: 0.82,
    bias: 0.0,
    mix: 1.0,
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
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.waveShaper = ctx.createWaveShaper();
    this.biasGain = ctx.createGain();

    this.updateCurve();
    this.biasGain.gain.value = this.params.bias;

    this.input.connect(this.dryGain);
    this.input.connect(this.biasGain);
    this.biasGain.connect(this.waveShaper);
    this.waveShaper.connect(this.wetGain);

    this.dryGain.connect(this.makeup);
    this.wetGain.connect(this.makeup);
    this.makeup.connect(this.output);

    this.applyMix();
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
    this.output.disconnect();
    this.makeup.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.biasGain?.disconnect();
    this.waveShaper?.disconnect();
    this.isInitialized = false;
  }

  setClock(): void {
    // Static saturation: no tempo coupling.
  }

  private updateCurve() {
    if (!this.waveShaper) return;
    const curve = new Float32Array(2048);
    const amount = Math.max(0.01, this.params.amount);
    const k = amount * 50;
    for (let i = 0; i < curve.length; i++) {
      const x = (i * 2) / curve.length - 1;
      curve[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
    }
    this.waveShaper.curve = curve;
  }

  private applyMix() {
    if (!this.audioContext || !this.dryGain || !this.wetGain) return;
    const now = this.audioContext.currentTime;
    this.dryGain.gain.setTargetAtTime(1 - this.params.mix, now, 0.01);
    this.wetGain.gain.setTargetAtTime(this.params.mix, now, 0.01);
  }

  setParameter(name: keyof MixxClipParams, value: number): void {
    (this.params as any)[name] = value;
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    switch (name) {
      case "amount":
        this.updateCurve();
        break;
      case "bias":
        this.biasGain?.gain.setTargetAtTime(value, now, 0.01);
        break;
      case "mix":
        this.applyMix();
        break;
      default:
        break;
    }
  }

  getParameter(name: keyof MixxClipParams): number {
    return this.params[name];
  }

  getParameterNames(): string[] {
    return ["amount", "bias", "mix"];
  }

  getParameterMin(name: keyof MixxClipParams): number {
    switch (name) {
      case "amount":
        return 0.1;
      case "bias":
        return -0.4;
      case "mix":
        return 0;
      default:
        return 0;
    }
  }

  getParameterMax(name: keyof MixxClipParams): number {
    switch (name) {
      case "amount":
        return 1.4;
      case "bias":
        return 0.4;
      case "mix":
        return 1;
      default:
        return 1;
    }
  }
}

let clipInstance: MixxClipperEngine | null = null;

export function getMixxClipperEngine(context: BaseAudioContext | null = null): MixxClipperEngine {
  if (!clipInstance) {
    clipInstance = new MixxClipperEngine(context);
  }
  if (context && !clipInstance.audioContext) {
    clipInstance.audioContext = context;
  }
  return clipInstance;
}

export async function initializeMixxClipperEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxClipperEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}


