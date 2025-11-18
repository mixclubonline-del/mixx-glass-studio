import { MasteringProfile, MASTERING_PROFILES } from '../types/sonic-architecture';
import {
  createHarmonicLatticeStage,
  createPhaseWeaveStage,
  createVelvetFloorStage,
  createSaturationCurve,
} from './fivePillars';
import { createDcBlocker } from './utils';
import { createTruePeakLimiterNode } from './VelvetTruePeakLimiter';
import { createDitherNode } from './DitherNode';
import { getVelvetCurveEngine, initializeVelvetCurveEngine } from './VelvetCurveEngine';

type MasterProfileKey = keyof typeof MASTERING_PROFILES;

const DEFAULT_PROFILE_KEY: MasterProfileKey = 'streaming';
const REFERENCE_LUFS = -14;

interface MidSideStage {
  input: GainNode;
  output: GainNode;
  midFilter: BiquadFilterNode;
  sideShelf: BiquadFilterNode;
  sideCompressor: DynamicsCompressorNode;
}

interface MultiBandStage {
  input: GainNode;
  output: GainNode;
  low: { filter: BiquadFilterNode; compressor: DynamicsCompressorNode; gain: GainNode };
  mid: { filter: BiquadFilterNode; compressor: DynamicsCompressorNode; gain: GainNode };
  high: { filter: BiquadFilterNode; enhancer: WaveShaperNode; gain: GainNode };
}

export interface MasterMeterStack {
  full: AnalyserNode; // Full-band analyser
  body: AnalyserNode; // Low-end (Body) - < 200Hz
  soul: AnalyserNode; // Mid-range (Soul) - ~800Hz
  air: AnalyserNode;  // High-mid (Air) - ~6kHz
  silk: AnalyserNode; // High-end (Silk) - > 12kHz
}

export interface VelvetMasterChain {
  input: AudioNode;
  output: GainNode;
  analyser: AnalyserNode;
  complianceTap: GainNode;
  midSideStage: MidSideStage;
  multiBandStage: MultiBandStage;
  velvetFloor: ReturnType<typeof createVelvetFloorStage>;
  harmonicLattice: ReturnType<typeof createHarmonicLatticeStage>;
  phaseWeave: ReturnType<typeof createPhaseWeaveStage>;
  velvetCurve: ReturnType<typeof getVelvetCurveEngine>; // Real VelvetCurveEngine instance
  glue: DynamicsCompressorNode;
  colorDrive: GainNode;
  colorShaper: WaveShaperNode;
  softLimiter: DynamicsCompressorNode;
  truePeakLimiter: AudioNode;
  dither: AudioNode;
  preLimiterTap: GainNode;
  preLimiterAnalyser: AnalyserNode;
  postLimiterAnalyser: AnalyserNode;
  panner: StereoPannerNode;
  masterGain: GainNode;
  meters: MasterMeterStack; // Flow Meter Stack - Multi-band meters (STEP 2)
  setProfile: (profile: MasteringProfile | MasterProfileKey) => void;
  getProfile: () => MasteringProfile;
  setOutputCeiling: (ceilingDb: number) => void;
  setMasterTrim: (gain: number) => void;
}

export async function buildMasterChain(
  ctx: AudioContext | OfflineAudioContext
): Promise<VelvetMasterChain> {
  const profile = MASTERING_PROFILES[DEFAULT_PROFILE_KEY];

  // 🔹 CREATE MASTER INPUT (tracks connect here)
  // Add headroom to prevent clipping from hot tracks
  const masterInput = ctx.createGain();
  masterInput.gain.value = 0.85; // -1.4 dB headroom to prevent distortion

  // 🔹 CREATE NODES
  const dc = createDcBlocker(ctx);
  const velvetFloor = createVelvetFloorStage(ctx, profile.velvetFloor);
  const harmonicLattice = createHarmonicLatticeStage(ctx, profile.harmonicLattice);
  const phaseWeave = createPhaseWeaveStage(ctx, profile.phaseWeave);
  
  // Initialize and use the real VelvetCurveEngine
  await initializeVelvetCurveEngine(ctx);
  const velvetCurve = getVelvetCurveEngine(ctx);
  velvetCurve.setActive(true); // Enable the engine
  console.log('[MASTER CHAIN] Velvet Curve Engine integrated and active');
  
  const midSideStage = createMidSideStage(ctx);
  const multiBandStage = createMultiBandStage(ctx);

  // Glue with safe defaults (prevent distortion)
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -6; // More headroom to prevent distortion
  glue.ratio.value = 2.0; // Gentler ratio
  glue.attack.value = 0.01;
  glue.release.value = 0.15; // Slightly longer release for smoother sound
  glue.knee.value = 3; // Softer knee

  const { drive: colorDrive, shaper: colorShaper } = createVelvetSaturator(ctx);

  // Soft limiter with safe defaults (prevent crackling)
  const softLimiter = ctx.createDynamicsCompressor();
  softLimiter.threshold.value = 0; // More headroom - only limit peaks
  softLimiter.ratio.value = 3; // Gentler ratio to prevent distortion
  softLimiter.attack.value = 0.005; // Slightly slower attack to prevent clicks
  softLimiter.release.value = 0.1; // Longer release for smoother sound
  softLimiter.knee.value = 6; // Softer knee to prevent harshness

  const truePeakLimiter = await createTruePeakLimiterNode(ctx, -1);
  const dither = await createDitherNode(ctx);

  const postLimiterAnalyser = createAnalyser(ctx, 2048, 0.75);
  const panner = ctx.createStereoPanner();
  panner.pan.value = 0;
  const masterGain = ctx.createGain();

  // Flow Meter Stack - Master Multi-Band Meters (for monitoring only - parallel tap)
  // These are monitoring taps, NOT in the signal path
  const masterAnalyzerFull = ctx.createAnalyser();
  masterAnalyzerFull.fftSize = 4096;
  masterAnalyzerFull.smoothingTimeConstant = 0.85;

  const masterBody = ctx.createBiquadFilter();
  masterBody.type = "lowshelf";
  masterBody.frequency.value = 200;
  masterBody.gain.value = 0;
  const bodyMeter = ctx.createAnalyser();
  bodyMeter.fftSize = 2048;
  bodyMeter.smoothingTimeConstant = 0.85;

  const masterSoul = ctx.createBiquadFilter();
  masterSoul.type = "peaking";
  masterSoul.frequency.value = 800;
  masterSoul.Q.value = 1;
  masterSoul.gain.value = 0;
  const soulMeter = ctx.createAnalyser();
  soulMeter.fftSize = 2048;
  soulMeter.smoothingTimeConstant = 0.85;

  const masterAir = ctx.createBiquadFilter();
  masterAir.type = "highshelf";
  masterAir.frequency.value = 6000;
  masterAir.gain.value = 0;
  const airMeter = ctx.createAnalyser();
  airMeter.fftSize = 2048;
  airMeter.smoothingTimeConstant = 0.85;

  const masterSilk = ctx.createBiquadFilter();
  masterSilk.type = "highshelf";
  masterSilk.frequency.value = 12000;
  masterSilk.gain.value = 0;
  const silkMeter = ctx.createAnalyser();
  silkMeter.fftSize = 2048;
  silkMeter.smoothingTimeConstant = 0.85;

  // Meter taps (parallel monitoring - does not affect signal path)
  masterGain.connect(masterAnalyzerFull);
  masterGain.connect(masterBody);
  masterBody.connect(bodyMeter);
  masterGain.connect(masterSoul);
  masterSoul.connect(soulMeter);
  masterGain.connect(masterAir);
  masterAir.connect(airMeter);
  masterGain.connect(masterSilk);
  masterSilk.connect(silkMeter);

  const masterMeters: MasterMeterStack = {
    full: masterAnalyzerFull,
    body: bodyMeter,
    soul: soulMeter,
    air: airMeter,
    silk: silkMeter,
  };

  masterGain.gain.value = gainForLUFS(profile.targetLUFS);

  const currentProfile = { value: profile };

  // 🔥 HARD RESET: Disconnect everything first (safety)
  // Note: We don't disconnect masterGain here because TranslationMatrix handles that connection
  // Disconnecting masterGain would break the connection to destination
  try {
    masterInput.disconnect();
    dc.disconnect();
    if (velvetFloor.input) (velvetFloor.input as any).disconnect?.();
    if (velvetFloor.output) (velvetFloor.output as any).disconnect?.();
    if (harmonicLattice.input) (harmonicLattice.input as any).disconnect?.();
    if (harmonicLattice.output) (harmonicLattice.output as any).disconnect?.();
    if (phaseWeave.input) (phaseWeave.input as any).disconnect?.();
    if (phaseWeave.output) (phaseWeave.output as any).disconnect?.();
    if (velvetCurve.input) (velvetCurve.input as any).disconnect?.();
    if (velvetCurve.output) (velvetCurve.output as any).disconnect?.();
    if (midSideStage.input) midSideStage.input.disconnect?.();
    if (midSideStage.output) midSideStage.output.disconnect?.();
    if (multiBandStage.input) multiBandStage.input.disconnect?.();
    if (multiBandStage.output) multiBandStage.output.disconnect?.();
    glue.disconnect();
    colorDrive.disconnect();
    colorShaper.disconnect();
    softLimiter.disconnect();
    if (truePeakLimiter) (truePeakLimiter as AudioNode).disconnect?.();
    postLimiterAnalyser.disconnect();
    if (dither) (dither as AudioNode).disconnect?.();
    panner.disconnect();
    // DO NOT disconnect masterGain - TranslationMatrix manages that connection
    // masterGain.disconnect(); // REMOVED - breaks TranslationMatrix connection
  } catch (e) {
    // Ignore disconnect errors on first build
  }

  // ✅ LINEAR MASTER CHAIN — ONE PATH ONLY
  // Tracks → masterInput → dc → velvetFloor → harmonicLattice → phaseWeave → velvetCurve → midSide → multiBand → glue → colorDrive → colorShaper → softLimiter → truePeakLimiter → postLimiterAnalyser → dither → panner → masterGain

  masterInput.connect(dc);
  dc.connect(velvetFloor.input);
  velvetFloor.output.connect(harmonicLattice.input);
  harmonicLattice.output.connect(phaseWeave.input);
  phaseWeave.output.connect(velvetCurve.input); // Connect to real VelvetCurveEngine
  velvetCurve.output.connect(midSideStage.input);
  midSideStage.output.connect(multiBandStage.input);
  multiBandStage.output.connect(glue);
  glue.connect(colorDrive);
  colorDrive.connect(colorShaper);
  colorShaper.connect(softLimiter);
  softLimiter.connect(truePeakLimiter as AudioNode);
  (truePeakLimiter as AudioNode).connect(postLimiterAnalyser);
  postLimiterAnalyser.connect(dither as AudioNode);
  (dither as AudioNode).connect(panner);
  panner.connect(masterGain);
  // Note: masterGain connects to TranslationMatrix in App.tsx (line 4800)

  console.log('[MASTER-CHAIN] Signal path wired (linear):', {
    from: 'masterInput',
    through: 'VelvetCurve → Mid/Side → Multi-Band → Glue → Limiters',
    to: 'masterGain',
  });

  const setProfile = (next: MasteringProfile | MasterProfileKey) => {
    const resolved =
      typeof next === 'string' ? MASTERING_PROFILES[next] : next;

    currentProfile.value = resolved;

    velvetFloor.setSettings(resolved.velvetFloor);
    harmonicLattice.setSettings(resolved.harmonicLattice);
    phaseWeave.setSettings(resolved.phaseWeave);
    masterGain.gain.setTargetAtTime(
      gainForLUFS(resolved.targetLUFS),
      ctx.currentTime,
      0.02
    );

    recalibrateGlue(glue, resolved);
    recalibrateSaturator(colorDrive, resolved);
    setOutputCeiling(resolved.truePeakCeiling);
  };

  const setOutputCeiling = (ceilingDb: number) => {
    if (truePeakLimiter instanceof AudioWorkletNode) {
      truePeakLimiter.parameters
        .get('threshold')
        ?.setValueAtTime(ceilingDb, ctx.currentTime);
    } else if (truePeakLimiter instanceof DynamicsCompressorNode) {
      truePeakLimiter.threshold.setTargetAtTime(
        ceilingDb,
        ctx.currentTime,
        0.002
      );
    }
  };

  const setMasterTrim = (gain: number) => {
    masterGain.gain.setTargetAtTime(gain, ctx.currentTime, 0.01);
  };

  const getProfile = () => currentProfile.value;

  setOutputCeiling(profile.truePeakCeiling);

  // Create compliance tap for monitoring (parallel, doesn't affect signal)
  const complianceTap = ctx.createGain();
  complianceTap.gain.value = 1;
  masterGain.connect(complianceTap);

  return {
    input: masterInput, // Tracks connect here
    output: masterGain, // TranslationMatrix attaches here in App.tsx
    analyser: postLimiterAnalyser,
    complianceTap,
    midSideStage,
    multiBandStage,
    velvetFloor,
    harmonicLattice,
    phaseWeave,
    velvetCurve,
    glue,
    colorDrive,
    colorShaper,
    softLimiter,
    truePeakLimiter,
    dither,
    preLimiterTap: complianceTap, // For compatibility
    preLimiterAnalyser: postLimiterAnalyser, // For compatibility
    postLimiterAnalyser,
    panner,
    masterGain,
    meters: masterMeters, // Flow Meter Stack - Multi-band meters (parallel taps)
    setProfile,
    getProfile,
    setOutputCeiling,
    setMasterTrim,
  };
}

// createGlueCompressor removed - glue is now created inline with sane defaults in buildMasterChain

function createVelvetSaturator(ctx: AudioContext | OfflineAudioContext) {
  const drive = ctx.createGain();
  drive.gain.value = 0.9; // Reduce drive to prevent distortion

  const shaper = ctx.createWaveShaper();
  shaper.curve = createSaturationCurve(0.3); // Less aggressive saturation (was 0.45)

  return { drive, shaper };
}

function createMidSideStage(ctx: AudioContext | OfflineAudioContext): MidSideStage {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const splitter = ctx.createChannelSplitter(2);
  const merger = ctx.createChannelMerger(2);

  const midNode = ctx.createGain();
  const sideNode = ctx.createGain();

  const midFilter = ctx.createBiquadFilter();
  midFilter.type = 'peaking';
  midFilter.frequency.value = 320;
  midFilter.gain.value = -1.5;
  midFilter.Q.value = 1;

  const sideShelf = ctx.createBiquadFilter();
  sideShelf.type = 'highshelf';
  sideShelf.frequency.value = 6500;
  sideShelf.gain.value = 1.5;

  const sideCompressor = ctx.createDynamicsCompressor();
  sideCompressor.threshold.value = -26;
  sideCompressor.ratio.value = 1.8;
  sideCompressor.attack.value = 0.002;
  sideCompressor.release.value = 0.12;
  sideCompressor.knee.value = 6;

  const leftMid = ctx.createGain();
  const rightMid = ctx.createGain();
  const leftSide = ctx.createGain();
  const rightSide = ctx.createGain();
  leftMid.gain.value = Math.SQRT1_2;
  rightMid.gain.value = Math.SQRT1_2;
  leftSide.gain.value = Math.SQRT1_2;
  rightSide.gain.value = -Math.SQRT1_2;

  input.connect(splitter);

  splitter.connect(leftMid, 0);
  splitter.connect(rightMid, 1);
  splitter.connect(leftSide, 0);
  splitter.connect(rightSide, 1);

  leftMid.connect(midNode);
  rightMid.connect(midNode);
  midNode.connect(midFilter);

  leftSide.connect(sideNode);
  rightSide.connect(sideNode);
  sideNode.connect(sideShelf);
  sideShelf.connect(sideCompressor);

  const midToLeft = ctx.createGain();
  midToLeft.gain.value = Math.SQRT1_2;
  const midToRight = ctx.createGain();
  midToRight.gain.value = Math.SQRT1_2;
  const sideToLeft = ctx.createGain();
  sideToLeft.gain.value = Math.SQRT1_2;
  const sideToRight = ctx.createGain();
  sideToRight.gain.value = -Math.SQRT1_2;

  midFilter.connect(midToLeft);
  midFilter.connect(midToRight);
  sideCompressor.connect(sideToLeft);
  sideCompressor.connect(sideToRight);

  midToLeft.connect(merger, 0, 0);
  sideToLeft.connect(merger, 0, 0);
  midToRight.connect(merger, 0, 1);
  sideToRight.connect(merger, 0, 1);

  merger.connect(output);

  return {
    input,
    output,
    midFilter,
    sideShelf,
    sideCompressor,
  };
}

function createMultiBandStage(ctx: AudioContext | OfflineAudioContext): MultiBandStage {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const lowFilter = ctx.createBiquadFilter();
  lowFilter.type = 'lowpass';
  lowFilter.frequency.value = 120;
  lowFilter.Q.value = 0.707;

  const lowComp = ctx.createDynamicsCompressor();
  lowComp.threshold.value = -30;
  lowComp.ratio.value = 2.2;
  lowComp.attack.value = 0.015;
  lowComp.release.value = 0.18;
  lowComp.knee.value = 4;
  const lowGain = ctx.createGain();
  lowGain.gain.value = 1.05;

  const midFilter = ctx.createBiquadFilter();
  midFilter.type = 'bandpass';
  midFilter.frequency.value = 1600;
  midFilter.Q.value = 0.9;
  const midComp = ctx.createDynamicsCompressor();
  midComp.threshold.value = -22;
  midComp.ratio.value = 1.6;
  midComp.attack.value = 0.008;
  midComp.release.value = 0.25;
  midComp.knee.value = 6;
  const midGain = ctx.createGain();
  midGain.gain.value = 1;

  const highFilter = ctx.createBiquadFilter();
  highFilter.type = 'highpass';
  highFilter.frequency.value = 5500;
  highFilter.Q.value = 0.7;

  const highEnhancer = ctx.createWaveShaper();
  const curveSize = 512;
  const curve = new Float32Array(curveSize);
  for (let i = 0; i < curveSize; i++) {
    const x = (i / (curveSize - 1)) * 2 - 1;
    curve[i] = x >= 0 ? Math.pow(x, 0.8) : -Math.pow(-x, 0.8);
  }
  highEnhancer.curve = curve;
  const highGain = ctx.createGain();
  highGain.gain.value = 1.1;

  input.connect(lowFilter);
  input.connect(midFilter);
  input.connect(highFilter);

  lowFilter.connect(lowComp);
  lowComp.connect(lowGain);
  lowGain.connect(output);

  midFilter.connect(midComp);
  midComp.connect(midGain);
  midGain.connect(output);

  highFilter.connect(highEnhancer);
  highEnhancer.connect(highGain);
  highGain.connect(output);

  return {
    input,
    output,
    low: { filter: lowFilter, compressor: lowComp, gain: lowGain },
    mid: { filter: midFilter, compressor: midComp, gain: midGain },
    high: { filter: highFilter, enhancer: highEnhancer, gain: highGain },
  };
}

function createLimiter(
  ctx: AudioContext | OfflineAudioContext,
  config: { threshold: number; ratio: number; attack: number; release: number; knee: number }
): DynamicsCompressorNode {
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = config.threshold;
  limiter.ratio.value = config.ratio;
  limiter.attack.value = config.attack;
  limiter.release.value = config.release;
  limiter.knee.value = config.knee;
  return limiter;
}

function createAnalyser(
  ctx: AudioContext | OfflineAudioContext,
  fftSize: number,
  smoothing: number
): AnalyserNode {
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = smoothing;
  return analyser;
}

function recalibrateGlue(
  glue: DynamicsCompressorNode,
  profile: MasteringProfile
) {
  const isClub = profile.targetLUFS >= -10;
  // Safe defaults - prevent distortion while maintaining glue
  const threshold = isClub ? -8 : -6; // More headroom to prevent distortion
  const ratio = isClub ? 2.2 : 2.0; // Gentler ratios

  glue.threshold.setTargetAtTime(threshold, glue.context.currentTime, 0.02);
  glue.ratio.setTargetAtTime(ratio, glue.context.currentTime, 0.02);
}

function recalibrateSaturator(drive: GainNode, profile: MasteringProfile) {
  const reference = Math.max(-14, Math.min(-8, profile.targetLUFS));
  const extraGain = (REFERENCE_LUFS - reference) / 20;
  drive.gain.setTargetAtTime(
    1 + extraGain,
    drive.context.currentTime,
    0.02
  );
}

function gainForLUFS(targetLUFS: number) {
  const delta = targetLUFS - REFERENCE_LUFS;
  return Math.pow(10, delta / 20);
}