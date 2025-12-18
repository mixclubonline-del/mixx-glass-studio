/**
 * MIXX SIDECHAIN ENGINE
 * 
 * Implements "Ducking" orchestration between stem buses.
 * Primarily used to duck Music when Vocals are active, 
 * or Bass when Drums (Kick) are active.
 */

export interface SidechainConfig {
  threshold: number; // dB
  knee: number;      // dB
  ratio: number;
  attack: number;    // seconds
  release: number;   // seconds
}

export const DEFAULT_VOCAL_SIDECHAIN: SidechainConfig = {
  threshold: -24,
  knee: 12,
  ratio: 4,
  attack: 0.1,
  release: 0.4,
};

export const DEFAULT_KICK_SIDECHAIN: SidechainConfig = {
  threshold: -18,
  knee: 6,
  ratio: 6,
  attack: 0.005,
  release: 0.15,
};

export class MixxSidechainEngine {
  private ctx: AudioContext | OfflineAudioContext;
  public input: GainNode;
  public output: GainNode;
  public sidechainInput: GainNode;
  
  private compressor: DynamicsCompressorNode;
  private makeup: GainNode;

  constructor(ctx: AudioContext | OfflineAudioContext, config: SidechainConfig = DEFAULT_VOCAL_SIDECHAIN) {
    this.ctx = ctx;
    
    // Nodes
    this.input = ctx.createGain();
    this.output = ctx.createGain();
    this.sidechainInput = ctx.createGain();
    this.compressor = ctx.createDynamicsCompressor();
    this.makeup = ctx.createGain();

    // Setup Sidechain Routing
    // In standard Web Audio, a DynamicsCompressorNode uses its input as the trigger.
    // To create a "true" sidechain (Source A ducks Target B):
    // 1. We silent-sum the Target (B) into the compressor.
    // 2. We sum the Source (A) into the same compressor.
    // 3. We take the reduction value? No, Web Audio doesn't expose reduction to nodes.
    
    // INSTEAD: High-Performance Implementation
    // We use the DynamicsCompressorNode on the Target stream.
    // We connect the Source signal to the Compressor's input as well, 
    // but at a much higher level so it dominates the threshold detection.
    
    this.input.connect(this.compressor);
    this.compressor.connect(this.makeup);
    this.makeup.connect(this.output);
    
    this.updateConfig(config);
  }

  /**
   * Updates the sidechain parameters
   */
  public updateConfig(config: Partial<SidechainConfig>) {
    if (config.threshold !== undefined) this.compressor.threshold.setTargetAtTime(config.threshold, this.ctx.currentTime, 0.01);
    if (config.knee !== undefined) this.compressor.knee.setTargetAtTime(config.knee, this.ctx.currentTime, 0.01);
    if (config.ratio !== undefined) this.compressor.ratio.setTargetAtTime(config.ratio, this.ctx.currentTime, 0.01);
    if (config.attack !== undefined) this.compressor.attack.setTargetAtTime(config.attack, this.ctx.currentTime, 0.01);
    if (config.release !== undefined) this.compressor.release.setTargetAtTime(config.release, this.ctx.currentTime, 0.01);
  }

  /**
   * Connects a trigger source to the sidechain
   * This signal should be the "Vocals" or "Kick"
   */
  public connectTrigger(source: AudioNode) {
    // We connect the trigger to the compressor's input
    // Note: The compressor will now react to both the music AND the trigger.
    // Since we want the trigger to be more prominent, we boost it.
    const boost = this.ctx.createGain();
    boost.gain.value = 4.0; // +12dB trigger emphasis
    source.connect(boost);
    boost.connect(this.compressor);
  }

  /**
   * Set the bypass state
   */
  public setBypass(bypass: boolean) {
    if (bypass) {
      this.input.disconnect();
      this.input.connect(this.output);
    } else {
      this.input.disconnect();
      this.input.connect(this.compressor);
    }
  }
}
