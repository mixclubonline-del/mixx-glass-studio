import { IAudioEngine } from "../types/audio-graph";

type MixxDelayParams = {
  time: number;
  feedback: number;
  mix: number;
  tone: number;
};

/**
 * MixxDelayEngine
 * what: Stereo feedback delay with tone shaping.
 * why: Restore the suite's rhythmic echo and wideners.
 * how: Build feedback loop with low-pass tilt, expose normalized controls. (Flow / Recall)
 */
export class MixxDelayEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private delayNode: DelayNode | null = null;
  private feedbackGain: GainNode | null = null;
  private toneFilter: BiquadFilterNode | null = null;
  private isInitialized = false;

  private params: MixxDelayParams = {
    time: 0.28,
    feedback: 0.35,
    mix: 0.24,
    tone: 0.55,
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
    this.delayNode = ctx.createDelay(3.0);
    this.feedbackGain = ctx.createGain();
    this.toneFilter = ctx.createBiquadFilter();
    this.toneFilter.type = "lowpass";

    this.delayNode.delayTime.value = this.params.time;
    this.feedbackGain.gain.value = this.params.feedback;
    this.updateTone();

    // Routing: input -> dry
    this.input.connect(this.dryGain);
    this.dryGain.connect(this.makeup);

    // Wet path: input -> delay -> tone -> feedback/wet
    this.input.connect(this.delayNode);
    this.delayNode.connect(this.toneFilter);
    this.toneFilter.connect(this.wetGain);
    this.toneFilter.connect(this.feedbackGain);
    this.feedbackGain.connect(this.delayNode);

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
    this.delayNode?.disconnect();
    this.feedbackGain?.disconnect();
    this.toneFilter?.disconnect();
    this.isInitialized = false;
  }

  setClock(): void {
    // Delay is free-running; no grid sync yet.
  }

  private applyMix() {
    if (!this.dryGain || !this.wetGain || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const dry = 1 - this.params.mix;
    const wet = this.params.mix;
    this.dryGain.gain.setTargetAtTime(dry, now, 0.02);
    this.wetGain.gain.setTargetAtTime(wet, now, 0.02);
  }

  private updateTone() {
    if (!this.toneFilter || !this.audioContext) return;
    const minFreq = 800;
    const maxFreq = 12000;
    const freq = minFreq + (maxFreq - minFreq) * this.params.tone;
    this.toneFilter.frequency.value = freq;
    this.toneFilter.Q.value = 0.6 + this.params.tone * 1.4;
  }

  setParameter(name: keyof MixxDelayParams, value: number): void {
    (this.params as any)[name] = value;
    if (!this.audioContext) return;
    const now = this.audioContext.currentTime;
    switch (name) {
      case "time":
        this.delayNode?.delayTime.setTargetAtTime(value, now, 0.01);
        break;
      case "feedback":
        this.feedbackGain?.gain.setTargetAtTime(value, now, 0.01);
        break;
      case "mix":
        this.applyMix();
        break;
      case "tone":
        this.updateTone();
        break;
      default:
        break;
    }
  }

  getParameter(name: keyof MixxDelayParams): number {
    return this.params[name];
  }

  getParameterNames(): string[] {
    return ["time", "feedback", "mix", "tone"];
  }

  getParameterMin(name: keyof MixxDelayParams): number {
    switch (name) {
      case "time":
        return 0.02;
      case "feedback":
        return 0;
      case "mix":
        return 0;
      case "tone":
        return 0;
      default:
        return 0;
    }
  }

  getParameterMax(name: keyof MixxDelayParams): number {
    switch (name) {
      case "time":
        return 1.2;
      case "feedback":
        return 0.92;
      case "mix":
        return 1;
      case "tone":
        return 1;
      default:
        return 1;
    }
  }
}

let delayInstance: MixxDelayEngine | null = null;

export function getMixxDelayEngine(context: BaseAudioContext | null = null): MixxDelayEngine {
  if (!delayInstance) {
    delayInstance = new MixxDelayEngine(context);
  }
  if (context && !delayInstance.audioContext) {
    delayInstance.audioContext = context;
  }
  return delayInstance;
}

export async function initializeMixxDelayEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxDelayEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}


