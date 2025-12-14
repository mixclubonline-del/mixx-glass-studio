import { IAudioEngine } from "../types/audio-graph";

type MixxVerbParams = {
  mix: number;
  time: number;
  preDelay: number;
};

/**
 * MixxVerbEngine
 * what: Convolution reverb with animated impulse generation and pre-delay trim.
 * why: Restore the MixxClub plug-in suite's ambience stage inside Studio Flow.
 * how: Split wet/dry paths, regenerate IR on time changes, expose normalized params. (Flow / Recall)
 */
export class MixxVerbEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private preDelayNode: DelayNode | null = null;
  private convolver: ConvolverNode | null = null;
  private impulseDuration = 2.5;
  private impulseDecay = 3.2;

  private isInitialized = false;

  private params: MixxVerbParams = {
    mix: 0.28,
    time: 2.8,
    preDelay: 0.028,
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
    this.preDelayNode = ctx.createDelay(1.0);
    this.convolver = ctx.createConvolver();

    this.preDelayNode.delayTime.value = this.params.preDelay;
    this.convolver.buffer = this.generateImpulse(ctx, this.params.time, this.impulseDecay);

    // Routing
    this.input.connect(this.dryGain);
    this.input.connect(this.preDelayNode);
    this.preDelayNode.connect(this.convolver);
    this.convolver.connect(this.wetGain);

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
    this.preDelayNode?.disconnect();
    this.convolver?.disconnect();
    this.isInitialized = false;
  }

  setClock(): void {
    // Verb is not beat-synced; no-op.
  }

  private applyMix() {
    if (!this.dryGain || !this.wetGain || !this.audioContext) return;
    const now = this.audioContext.currentTime;
    const dry = 1 - this.params.mix;
    const wet = this.params.mix;
    this.dryGain.gain.setTargetAtTime(dry, now, 0.02);
    this.wetGain.gain.setTargetAtTime(wet, now, 0.02);
  }

  private updateImpulse() {
    if (!this.convolver || !this.audioContext) return;
    this.convolver.buffer = this.generateImpulse(
      this.audioContext,
      this.params.time,
      this.impulseDecay
    );
  }

  private updatePreDelay() {
    if (!this.preDelayNode || !this.audioContext) return;
    this.preDelayNode.delayTime.setTargetAtTime(this.params.preDelay, this.audioContext.currentTime, 0.01);
  }

  private generateImpulse(context: BaseAudioContext, duration: number, decay: number) {
    const rate = context.sampleRate;
    const length = Math.max(1, Math.floor(rate * duration));
    const impulse = context.createBuffer(2, length, rate);
    for (let channel = 0; channel < 2; channel++) {
      const channelData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const rand = Math.random() * 2 - 1;
        channelData[i] = rand * Math.pow(1 - i / length, decay);
      }
    }
    return impulse;
  }

  setParameter(name: keyof MixxVerbParams, value: number): void {
    (this.params as any)[name] = value;
    if (name === "mix") {
      this.applyMix();
    } else if (name === "time") {
      this.updateImpulse();
    } else if (name === "preDelay") {
      this.updatePreDelay();
    }
  }

  getParameter(name: keyof MixxVerbParams): number {
    return this.params[name];
  }

  getParameterNames(): string[] {
    return ["mix", "time", "preDelay"];
  }

  getParameterMin(name: keyof MixxVerbParams): number {
    switch (name) {
      case "mix":
        return 0;
      case "time":
        return 0.4;
      case "preDelay":
        return 0;
      default:
        return 0;
    }
  }

  getParameterMax(name: keyof MixxVerbParams): number {
    switch (name) {
      case "mix":
        return 1;
      case "time":
        return 8;
      case "preDelay":
        return 0.12;
      default:
        return 1;
    }
  }
}

let instance: MixxVerbEngine | null = null;

export function getMixxVerbEngine(context: BaseAudioContext | null = null): MixxVerbEngine {
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
    instance = new MixxVerbEngine(context);
  }
  if (context && !instance.audioContext) {
    instance.audioContext = context;
  }
  return instance;
}

export async function initializeMixxVerbEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxVerbEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}


