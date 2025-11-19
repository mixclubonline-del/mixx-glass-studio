import {
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
  VelvetFloorSettings,
} from '../types/sonic-architecture';

export interface PillarStage<TSettings> {
  input: GainNode;
  output: GainNode;
  setSettings: (settings: TSettings) => void;
}

/**
 * Shared saturation curve creator used by multiple pillars.
 * QUANTUM OPTIMIZATION: Uses cache to avoid recomputation
 */
import { saturationCache } from '../core/performance/saturationCache';

export function createSaturationCurve(amount: number): Float32Array {
  return saturationCache.getCurve(amount, 1024);
}

export function createVelvetFloorStage(
  ctx: BaseAudioContext,
  settings: VelvetFloorSettings
): PillarStage<VelvetFloorSettings> {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const lowPass = ctx.createBiquadFilter();
  lowPass.type = 'lowpass';

  const exciter = ctx.createWaveShaper();
  const makeup = ctx.createGain();

  input.connect(lowPass);
  lowPass.connect(exciter);
  exciter.connect(makeup);
  makeup.connect(output);

  input.connect(output); // dry path for coherence

  const setSettings = (next: VelvetFloorSettings) => {
    lowPass.frequency.setTargetAtTime(150, ctx.currentTime, 0.01);
    lowPass.Q.setTargetAtTime(0.7, ctx.currentTime, 0.01);

    const warmthAmount = next.warmth / 100;
    exciter.curve = createSaturationCurve(warmthAmount);

    const depthGain = 1 + next.depth / 200;
    makeup.gain.setTargetAtTime(depthGain, ctx.currentTime, 0.01);
  };

  setSettings(settings);

  return { input, output, setSettings };
}

export function createHarmonicLatticeStage(
  ctx: BaseAudioContext,
  settings: HarmonicLatticeSettings
): PillarStage<HarmonicLatticeSettings> {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const midBoost = ctx.createBiquadFilter();
  midBoost.type = 'peaking';

  const highShelf = ctx.createBiquadFilter();
  highShelf.type = 'highshelf';

  const saturation = ctx.createWaveShaper();

  input.connect(midBoost);
  midBoost.connect(highShelf);
  highShelf.connect(saturation);
  saturation.connect(output);

  const setSettings = (next: HarmonicLatticeSettings) => {
    midBoost.frequency.setTargetAtTime(1000, ctx.currentTime, 0.01);
    midBoost.Q.setTargetAtTime(1.0, ctx.currentTime, 0.01);
    midBoost.gain.setTargetAtTime((next.presence - 65) / 5, ctx.currentTime, 0.01);

    highShelf.frequency.setTargetAtTime(8000, ctx.currentTime, 0.01);
    highShelf.gain.setTargetAtTime((next.airiness - 60) / 10, ctx.currentTime, 0.01);

    const saturationAmount = getCharacterSaturation(next.character);
    saturation.curve = createSaturationCurve(saturationAmount);
  };

  setSettings(settings);

  return { input, output, setSettings };
}

export function createPhaseWeaveStage(
  ctx: BaseAudioContext,
  settings: PhaseWeaveSettings
): PillarStage<PhaseWeaveSettings> {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // Proper mid/side encoding/decoding for stereo width control
  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  // Mid/Side encoding: Mid = (L+R)/2, Side = (L-R)/2
  const leftMid = ctx.createGain();
  const rightMid = ctx.createGain();
  const leftSide = ctx.createGain();
  const rightSide = ctx.createGain();
  
  leftMid.gain.value = Math.SQRT1_2; // 1/√2 ≈ 0.707
  rightMid.gain.value = Math.SQRT1_2;
  leftSide.gain.value = Math.SQRT1_2;
  rightSide.gain.value = -Math.SQRT1_2; // Negative for right channel in side

  // Mid and Side processing nodes
  const midGain = ctx.createGain();
  const sideGain = ctx.createGain();
  
  // Mid/Side decoding: L = Mid + Side, R = Mid - Side
  const midToLeft = ctx.createGain();
  const midToRight = ctx.createGain();
  const sideToLeft = ctx.createGain();
  const sideToRight = ctx.createGain();
  
  midToLeft.gain.value = Math.SQRT1_2;
  midToRight.gain.value = Math.SQRT1_2;
  sideToLeft.gain.value = Math.SQRT1_2;
  sideToRight.gain.value = -Math.SQRT1_2;

  // Wire up encoding
  input.connect(splitter);
  splitter.connect(leftMid, 0);
  splitter.connect(rightMid, 1);
  splitter.connect(leftSide, 0);
  splitter.connect(rightSide, 1);
  
  leftMid.connect(midGain);
  rightMid.connect(midGain);
  leftSide.connect(sideGain);
  rightSide.connect(sideGain);
  
  // Wire up decoding
  midGain.connect(midToLeft);
  midGain.connect(midToRight);
  sideGain.connect(sideToLeft);
  sideGain.connect(sideToRight);
  
  midToLeft.connect(merger, 0, 0);
  sideToLeft.connect(merger, 0, 0);
  midToRight.connect(merger, 0, 1);
  sideToRight.connect(merger, 0, 1);
  
  merger.connect(output);

  const setSettings = (next: PhaseWeaveSettings) => {
    // Mid stays at unity (preserves mono compatibility)
    midGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);
    
    // Side width control: 0-100% maps to 0-1.5x side gain
    // Higher width = more stereo spread, lower = more mono
    const widthFactor = next.width / 100;
    const sideGainValue = widthFactor * 1.5;
    
    // Mono compatibility: reduce side when monoCompatibility is high
    const monoFactor = next.monoCompatibility / 100;
    const adjustedSideGain = sideGainValue * (1 - monoFactor * 0.3); // Reduce up to 30% for mono safety
    
    sideGain.gain.setTargetAtTime(adjustedSideGain, ctx.currentTime, 0.01);
  };

  setSettings(settings);

  return { input, output, setSettings };
}

export function createVelvetCurveStage(ctx: BaseAudioContext) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  // FIXED: Removed conflicting filters that were creating a narrow band/hum
  // The real VelvetCurveEngine handles processing in the master chain
  // This is just a pass-through for offline processing compatibility
  // NOTE: For proper Velvet Curve processing, use the real-time VelvetCurveEngine in master chain
  
  // Simple pass-through with gentle warmth enhancement
  const warmthFilter = ctx.createBiquadFilter();
  warmthFilter.type = 'peaking';
  warmthFilter.frequency.value = 250;
  warmthFilter.Q.value = 0.7;
  warmthFilter.gain.value = 1.5; // Gentle warmth boost

  input.connect(warmthFilter);
  warmthFilter.connect(output);

  return { input, output };
}

function getCharacterSaturation(character: string): number {
  switch (character) {
    case 'vintage':
      return 0.6;
    case 'warm':
      return 0.4;
    case 'bright':
      return 0.2;
    case 'neutral':
      return 0.1;
    default:
      return 0.1;
  }
}






