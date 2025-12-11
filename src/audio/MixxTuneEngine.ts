/**
 * MixxTuneEngine
 * what: Vocal tuning engine with formant preservation and humanize controls.
 * why: Reinstate the Mixx Tune flagship module inside the Studio runtime.
 * how: Blend a lightweight pitch/formant shaper with wet/dry mixing and output gain. (Flow / Recall)
 */
import { IAudioEngine } from "../types/audio-graph";
import { als } from "../utils/alsFeedback";

type MixxTuneParams = {
  retuneSpeed: number;
  formant: number;
  humanize: number;
  emotiveLock: boolean;
  mix: number;
  output: number;
};

export class MixxTuneEngine implements IAudioEngine {
  input: GainNode;
  output: GainNode;
  makeup: GainNode;
  audioContext: BaseAudioContext | null;

  private formantFilter: BiquadFilterNode | null = null;
  private modulationOsc: OscillatorNode | null = null;
  private modulationGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private outputGain: GainNode | null = null;

  private params: MixxTuneParams = {
    retuneSpeed: 50,
    formant: 50,
    humanize: 50,
    emotiveLock: false,
    mix: 100,
    output: 0,
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
    if ((ctx.state as string) === "closed") {
      als.warning("[MIXX TUNE] Cannot initialize engine on closed AudioContext");
      return;
    }

    this.audioContext = ctx;

    this.input = ctx.createGain();
    this.makeup = ctx.createGain();
    this.output = ctx.createGain();

    this.formantFilter = ctx.createBiquadFilter();
    this.formantFilter.type = "peaking";
    this.formantFilter.Q.value = 1.2;
    this.formantFilter.frequency.value = 2000;

    this.modulationGain = ctx.createGain();
    this.modulationGain.gain.value = 0;
    this.modulationOsc = ctx.createOscillator();
    this.modulationOsc.type = "sine";
    this.modulationOsc.frequency.value = 0.25;
    this.modulationOsc.connect(this.modulationGain);

    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    this.outputGain = ctx.createGain();

    const pitchBendDelay = ctx.createDelay(0.05);
    this.modulationGain.connect(pitchBendDelay.delayTime);

    // Routing: input -> pitchBendDelay -> formantFilter -> wet
    this.input.connect(pitchBendDelay);
    pitchBendDelay.connect(this.formantFilter);
    this.formantFilter.connect(this.wetGain);

    // Dry path
    this.input.connect(this.dryGain);

    this.dryGain.connect(this.makeup);
    this.wetGain.connect(this.makeup);
    this.makeup.connect(this.outputGain);
    this.outputGain.connect(this.output);

    if (typeof this.modulationOsc.start === "function") {
      this.modulationOsc.start();
    }

    this.updateParameters();
    this.isInitialized = true;
  }

  isActive(): boolean {
    return this.isInitialized;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  setClock(getBeatPhase: () => number): void {
    if (!this.modulationOsc) return;
    const phase = getBeatPhase();
    if (this.audioContext) {
      const now = this.audioContext.currentTime;
      const frequency = 0.25 + (this.params.retuneSpeed / 100) * 2;
      this.modulationOsc.frequency.setTargetAtTime(frequency, now, 0.05);
      this.modulationGain?.gain.setTargetAtTime(
        (this.params.humanize / 100) * 0.01 * (this.params.emotiveLock ? 0.5 : 1),
        now,
        0.1
      );
      (this.modulationOsc as any).phase = phase;
    }
  }

  dispose(): void {
    this.modulationOsc?.disconnect();
    this.modulationGain?.disconnect();
    this.formantFilter?.disconnect();
    this.dryGain?.disconnect();
    this.wetGain?.disconnect();
    this.outputGain?.disconnect();
    this.input?.disconnect();
    this.output?.disconnect();
    this.makeup?.disconnect();
    this.isInitialized = false;
  }

  setParameter(name: string, value: number): void {
    switch (name) {
      case "retuneSpeed":
        this.params.retuneSpeed = this.clamp(value);
        break;
      case "formant":
        this.params.formant = this.clamp(value);
        break;
      case "humanize":
        this.params.humanize = this.clamp(value);
        break;
      case "emotiveLock":
        this.params.emotiveLock = value >= 0.5;
        break;
      case "mix":
        this.params.mix = this.clamp(value);
        break;
      case "output":
        this.params.output = this.clamp(value, -60, 60);
        break;
      default:
        break;
    }
    this.updateParameters();
  }

  getParameter(name: string): number {
    if (name === "emotiveLock") {
      return this.params.emotiveLock ? 1 : 0;
    }
    return this.params[name as keyof MixxTuneParams] as number;
  }

  getParameterNames(): string[] {
    return ["retuneSpeed", "formant", "humanize", "emotiveLock", "mix", "output"];
  }

  getParameterMin(name: string): number {
    if (name === "output") return -60;
    return 0;
  }

  getParameterMax(name: string): number {
    if (name === "output") return 60;
    return 100;
  }

  private updateParameters(): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;

    if (this.formantFilter) {
      const preserve = this.params.formant / 100;
      this.formantFilter.Q.setTargetAtTime(0.6 + preserve * 2.4, now, 0.1);
      const retuneDepth = (this.params.retuneSpeed / 100) * 0.12;
      this.formantFilter.frequency.setTargetAtTime(2000 * (1 + retuneDepth), now, 0.1);
      const gainBoost = this.params.emotiveLock ? 4 : 0;
      this.formantFilter.gain.setTargetAtTime(gainBoost, now, 0.1);
    }

    if (this.dryGain && this.wetGain) {
      const mix = this.params.mix / 100;
      this.dryGain.gain.setTargetAtTime(1 - mix, now, 0.02);
      const humanizeJitter = (this.params.humanize / 100) * 0.05;
      const jitter = 1 + (Math.random() - 0.5) * humanizeJitter;
      this.wetGain.gain.setTargetAtTime(mix * jitter, now, 0.02);
    }

    if (this.outputGain) {
      const gain = Math.pow(10, this.params.output / 20);
      this.outputGain.gain.setTargetAtTime(gain, now, 0.05);
    }

    if (this.modulationOsc && this.modulationGain) {
      const frequency = 0.5 + (this.params.retuneSpeed / 100) * 3;
      this.modulationOsc.frequency.setTargetAtTime(frequency, now, 0.1);
      const modulationDepth = (this.params.humanize / 100) * 0.015;
      const lockAttenuation = this.params.emotiveLock ? 0.25 : 1;
      this.modulationGain.gain.setTargetAtTime(modulationDepth * lockAttenuation, now, 0.1);
    }
  }

  private clamp(value: number, min = 0, max = 100): number {
    return Math.min(max, Math.max(min, value));
  }
}

let singleton: MixxTuneEngine | null = null;

export function getMixxTuneEngine(context: BaseAudioContext | null = null): MixxTuneEngine {
  // If instance exists but context is closed or different, dispose and recreate
  if (singleton) {
    const existingContext = singleton.audioContext;
    const contextClosed = existingContext && 'state' in existingContext && existingContext.state === 'closed';
    const contextChanged = context && existingContext && existingContext !== context;
    
    if (contextClosed || contextChanged) {
      singleton.dispose();
      singleton = null;
    }
  }
  
  if (!singleton) {
    singleton = new MixxTuneEngine(context);
  }
  if (context && !singleton.audioContext) {
    singleton.audioContext = context;
  }
  return singleton;
}

export async function initializeMixxTuneEngine(context: BaseAudioContext): Promise<void> {
  const engine = getMixxTuneEngine(context);
  if (!engine.isActive()) {
    await engine.initialize(context);
  }
}

