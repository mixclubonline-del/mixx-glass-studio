/**
 * MIXX PARALLEL ENGINE
 * 
 * Implements "NY Compression" architecture for AURA.
 * Splits signal into Dry and Smash (highly compressed) paths,
 * then blends them back together for maximum energy and punch.
 */

export interface ParallelSmashConfig {
  threshold: number; // dB
  knee: number;      // dB
  ratio: number;
  attack: number;    // seconds
  release: number;   // seconds
  blend: number;     // 0-1 (0 = Dry, 1 = Wet)
}

export const DEFAULT_NY_SMASH: ParallelSmashConfig = {
  threshold: -45,
  knee: 8,
  ratio: 12,
  attack: 0.003,
  release: 0.1,
  blend: 0.35, // 35% smashed signal by default
};

export class MixxParallelEngine {
  private ctx: AudioContext | OfflineAudioContext;
  public input: GainNode;
  public output: GainNode;
  
  private dryGain: GainNode;
  private wetGain: GainNode;
  private compressor: DynamicsCompressorNode;
  private makeup: GainNode;
  
  private currentBlend: number = 0;

  constructor(ctx: AudioContext | OfflineAudioContext, config: ParallelSmashConfig = DEFAULT_NY_SMASH) {
    this.ctx = ctx;
    
    // Core Nodes
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    
    // Splitter Paths
    this.dryGain = ctx.createGain();
    this.wetGain = ctx.createGain();
    
    // Processor Chain
    this.compressor = ctx.createDynamicsCompressor();
    this.makeup = ctx.createGain(); // For post-compression normalization if needed
    this.makeup.gain.value = 1.0; 

    // Routing: Input -> Split
    this.input.connect(this.dryGain);
    this.input.connect(this.compressor);
    
    // Routing: Wet Path Processor -> Mixer
    this.compressor.connect(this.makeup);
    this.makeup.connect(this.wetGain);
    
    // Routing: Mixer -> Output
    this.dryGain.connect(this.output);
    this.wetGain.connect(this.output);
    
    this.updateConfig(config);
    this.setBlend(config.blend);
  }

  /**
   * Updates the compression parameters
   */
  public updateConfig(config: Partial<ParallelSmashConfig>) {
    const time = this.ctx.currentTime;
    if (config.threshold !== undefined) this.compressor.threshold.setTargetAtTime(config.threshold, time, 0.01);
    if (config.knee !== undefined) this.compressor.knee.setTargetAtTime(config.knee, time, 0.01);
    if (config.ratio !== undefined) this.compressor.ratio.setTargetAtTime(config.ratio, time, 0.01);
    if (config.attack !== undefined) this.compressor.attack.setTargetAtTime(config.attack, time, 0.01);
    if (config.release !== undefined) this.compressor.release.setTargetAtTime(config.release, time, 0.01);
    if (config.blend !== undefined) this.setBlend(config.blend);
  }

  /**
   * Sets the Dry/Wet blend (0-1)
   * We use an equal-power crossfade or simple linear blend.
   * For NY compression, we usually maintain full Dry and add the Smash.
   */
  public setBlend(value: number) {
    this.currentBlend = Math.min(Math.max(value, 0), 1);
    const time = this.ctx.currentTime;
    
    // NY Compression Style: 
    // Dry signal typically stays at unity, and we "dial in" the smash signal.
    // However, to keep overall gain stable, we can balance them slightly.
    this.dryGain.gain.setTargetAtTime(1.0, time, 0.01); 
    this.wetGain.gain.setTargetAtTime(this.currentBlend, time, 0.01);
  }

  /**
   * Gets the current reduction amount in dB
   */
  public get reduction(): number {
    return this.compressor.reduction;
  }

  /**
   * Set the bypass state
   */
  public setBypass(bypass: boolean) {
    const time = this.ctx.currentTime;
    if (bypass) {
      this.dryGain.gain.setTargetAtTime(1.0, time, 0.01);
      this.wetGain.gain.setTargetAtTime(0.0, time, 0.01);
    } else {
      this.dryGain.gain.setTargetAtTime(1.0, time, 0.01);
      this.wetGain.gain.setTargetAtTime(this.currentBlend, time, 0.01);
    }
  }
}
