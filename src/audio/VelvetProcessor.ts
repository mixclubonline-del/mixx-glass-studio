import { 
  MasteringProfile, 
  VelvetFloorSettings, 
  HarmonicLatticeSettings, 
  PhaseWeaveSettings 
} from '../types/sonic-architecture';

export interface VelvetProcessorOptions {
  profile: MasteringProfile;
  targetLUFS?: number;
  applyLimiter?: boolean;
}

export class VelvetProcessor {
  private audioContext: BaseAudioContext;

  constructor(audioContext: BaseAudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Process audio buffer through the complete Velvet chain
   */
  async processAudioBuffer(
    inputBuffer: AudioBuffer,
    options: VelvetProcessorOptions
  ): Promise<AudioBuffer> {
    const { profile, targetLUFS = profile.targetLUFS, applyLimiter = true } = options;

    // Create offline context for processing
    const offlineContext = new OfflineAudioContext(
      inputBuffer.numberOfChannels,
      inputBuffer.length,
      inputBuffer.sampleRate
    );

    // Create source from input buffer
    const source = offlineContext.createBufferSource();
    source.buffer = inputBuffer;

    // 🎵 VELVET FLOOR - Sub-harmonic foundation
    const velvetFloor = this.createVelvetFloor(offlineContext, profile.velvetFloor);
    
    // 🎶 HARMONIC LATTICE - Upper harmonic warmth
    const harmonicLattice = this.createHarmonicLattice(offlineContext, profile.harmonicLattice);
    
    // 🌀 PHASE WEAVE - Stereo imaging
    const phaseWeave = this.createPhaseWeave(offlineContext, profile.phaseWeave);
    
    // 👑 VELVET CURVE - MixxClub signature
    const velvetCurve = this.createVelvetCurve(offlineContext);
    
    // Master gain for LUFS targeting
    const masterGain = offlineContext.createGain();
    const targetGain = this.calculateGainForLUFS(inputBuffer, targetLUFS);
    masterGain.gain.value = targetGain;
    
    // Safety limiter
    const limiter = applyLimiter ? this.createLimiter(offlineContext) : null;

    // 🔗 CONNECT THE CHAIN
    let currentNode: AudioNode = source;
    
    currentNode.connect(velvetFloor.input);
    currentNode = velvetFloor.output;
    
    currentNode.connect(harmonicLattice.input);
    currentNode = harmonicLattice.output;
    
    currentNode.connect(phaseWeave.input);
    currentNode = phaseWeave.output;
    
    currentNode.connect(velvetCurve.input);
    currentNode = velvetCurve.output;
    
    currentNode.connect(masterGain);
    currentNode = masterGain;
    
    if (limiter) {
      currentNode.connect(limiter.input);
      currentNode = limiter.output;
    }
    
    currentNode.connect(offlineContext.destination);

    // Start processing
    source.start(0);
    
    // Render the processed audio
    const processedBuffer = await offlineContext.startRendering();
    
    console.log('🎼 VELVET PROCESSING COMPLETE');
    console.log(`   🎵 Velvet Floor: ${profile.velvetFloor.depth}% depth, ${profile.velvetFloor.translation} translation`);
    console.log(`   🎶 Harmonic Lattice: ${profile.harmonicLattice.character} character, ${profile.harmonicLattice.presence}% presence`);
    console.log(`   🌀 Phase Weave: ${profile.phaseWeave.width}% width, ${profile.phaseWeave.monoCompatibility}% mono safe`);
    console.log(`   👑 Velvet Curve: Applied`);
    console.log(`   🎯 Target LUFS: ${targetLUFS}`);
    
    return processedBuffer;
  }

  /**
   * 🎵 VELVET FLOOR - Sub-harmonic foundation
   */
  private createVelvetFloor(ctx: BaseAudioContext, settings: VelvetFloorSettings) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    // Low-pass filter for sub isolation
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 150; // Sub range
    lowPass.Q.value = 0.7;
    
    // Harmonic exciter for warmth
    const exciter = ctx.createWaveShaper();
    const saturationCurve = this.createSaturationCurve(settings.warmth / 100);
    exciter.curve = saturationCurve;
    
    // Makeup gain based on depth
    const makeup = ctx.createGain();
    makeup.gain.value = 1 + (settings.depth / 200); // Boost bass based on depth
    
    // Connect: input → lowPass → exciter → makeup → output
    input.connect(lowPass);
    lowPass.connect(exciter);
    exciter.connect(makeup);
    makeup.connect(output);
    
    // Also pass dry signal (simplified, could be mixed)
    input.connect(output);
    
    return { input, output };
  }

  /**
   * 🎶 HARMONIC LATTICE - Upper harmonic warmth
   */
  private createHarmonicLattice(ctx: BaseAudioContext, settings: HarmonicLatticeSettings) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    // Mid-range presence boost
    const midBoost = ctx.createBiquadFilter();
    midBoost.type = 'peaking';
    midBoost.frequency.value = 1000; // Mid range
    midBoost.Q.value = 1.0;
    midBoost.gain.value = (settings.presence - 65) / 5; // Subtle boost/cut
    
    // High-frequency air
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 8000;
    highShelf.gain.value = (settings.airiness - 60) / 10; // Subtle air
    
    // Character saturation
    const saturation = ctx.createWaveShaper();
    const saturationAmount = this.getCharacterSaturation(settings.character);
    const saturationCurve = this.createSaturationCurve(saturationAmount);
    saturation.curve = saturationCurve;
    
    // Connect: input → midBoost → highShelf → saturation → output
    input.connect(midBoost);
    midBoost.connect(highShelf);
    highShelf.connect(saturation);
    saturation.connect(output);
    
    return { input, output };
  }

  /**
   * 🌀 PHASE WEAVE - Stereo imaging
   */
  private createPhaseWeave(ctx: BaseAudioContext, settings: PhaseWeaveSettings) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    // Stereo width control (simplified)
    const widthGain = (settings.width / 100) * 1.5; // Scale to usable range
    
    // Mid/side processing simulation
    const midGain = ctx.createGain();
    midGain.gain.value = 1.0; // Mono component
    
    const sideGain = ctx.createGain();
    sideGain.gain.value = widthGain; // Stereo component
    
    // Simple stereo widening
    input.connect(midGain);
    midGain.connect(output);
    
    input.connect(sideGain);
    sideGain.connect(output);
    
    return { input, output };
  }

  /**
   * 👑 VELVET CURVE - MixxClub signature
   */
  private createVelvetCurve(ctx: BaseAudioContext) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    // Gentle multi-band compression simulation
    const lowComp = ctx.createDynamicsCompressor();
    lowComp.threshold.value = -24;
    lowComp.ratio.value = 3;
    lowComp.attack.value = 0.01;
    lowComp.release.value = 0.25;
    
    // Low-pass for low band
    const lowPass = ctx.createBiquadFilter();
    lowPass.type = 'lowpass';
    lowPass.frequency.value = 200;
    
    // High-pass for high band
    const highPass = ctx.createBiquadFilter();
    highPass.type = 'highpass';
    highPass.frequency.value = 200;
    
    // Split signal and process
    input.connect(lowPass);
    lowPass.connect(lowComp);
    lowComp.connect(output);
    
    input.connect(highPass);
    highPass.connect(output);
    
    return { input, output };
  }

  /**
   * Create safety limiter (-1dB ceiling)
   */
  private createLimiter(ctx: BaseAudioContext) {
    const input = ctx.createGain();
    const output = ctx.createGain();
    
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.ratio.value = 20; // Hard limiting
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    limiter.knee.value = 0;
    
    input.connect(limiter);
    limiter.connect(output);
    
    return { input, output };
  }

  /**
   * Create saturation curve for harmonic excitement
   */
  private createSaturationCurve(amount: number) {
    const samples = 1024;
    const curve = new Float32Array(samples);
    const deg = Math.PI / 180;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      const y = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
      curve[i] = y;
    }
    
    return curve;
  }

  /**
   * Get saturation amount based on character
   */
  private getCharacterSaturation(character: string): number {
    switch (character) {
      case 'vintage': return 0.6;
      case 'warm': return 0.4;
      case 'bright': return 0.2;
      case 'neutral': return 0.1;
      default: return 0.1;
    }
  }

  /**
   * Calculate gain adjustment to hit target LUFS
   */
  private calculateGainForLUFS(buffer: AudioBuffer, targetLUFS: number): number {
    // Simplified LUFS calculation
    const channelData = buffer.getChannelData(0);
    let sum = 0;
    
    for (let i = 0; i < channelData.length; i++) {
      sum += channelData[i] * channelData[i];
    }
    
    const rms = Math.sqrt(sum / channelData.length);
    const currentLUFS = 20 * Math.log10(rms || 1e-10); // Avoid log of zero
    
    // Calculate gain adjustment
    const lufsDifference = targetLUFS - currentLUFS;
    const gainAdjustment = Math.pow(10, lufsDifference / 20);
    
    // Limit adjustment to reasonable range
    return Math.min(Math.max(gainAdjustment, 0.1), 10);
  }

  /**
   * Export processed buffer as WAV blob
   */
  exportWAV(buffer: AudioBuffer): Blob {
    const numberOfChannels = buffer.numberOfChannels;
    const length = buffer.length * numberOfChannels * 2;
    const arrayBuffer = new ArrayBuffer(44 + length);
    const view = new DataView(arrayBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + length, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // PCM format
    view.setUint16(20, 1, true); // Format
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, buffer.sampleRate, true);
    view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true); // Bits per sample
    this.writeString(view, 36, 'data');
    view.setUint32(40, length, true);
    
    // Write audio data
    const offset = 44;
    for (let i = 0; i < buffer.length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = buffer.getChannelData(channel)[i];
        const int16 = Math.max(-1, Math.min(1, sample)) * 0x7FFF;
        view.setInt16(offset + (i * numberOfChannels + channel) * 2, int16, true);
      }
    }
    
    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  private writeString(view: DataView, offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
}