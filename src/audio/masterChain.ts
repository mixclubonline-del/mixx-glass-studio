import { MasteringProfile, MASTERING_PROFILES } from '../types/sonic-architecture';
import { rustMasterBridge } from './RustMasterBridge';
import {
  createHarmonicLatticeStage,
  createPhaseWeaveStage,
  createVelvetCurveStage,
  createVelvetFloorStage,
  createSaturationCurve,
  PillarStage,
  VelvetFloorSettings,
  HarmonicLatticeSettings,
  PhaseWeaveSettings,
} from './fivePillars';
import {
  registerFivePillarsWorklets,
  createVelvetFloorWorklet,
  createHarmonicLatticeWorklet,
  createPhaseWeaveWorklet,
  createVelvetCurveWorklet,
  areAllPillarsRegistered,
} from './FivePillarsWorklet';
import { createDcBlocker } from './utils';
import { createTruePeakLimiterNode } from './VelvetTruePeakLimiter';
import { createDitherNode } from './DitherNode';

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

// Flexible pillar stage type that works with both GainNode and AudioWorkletNode
interface FlexiblePillarStage {
  input: AudioNode;
  output: AudioNode;
  setSettings?: (settings: any) => void;
}

export interface VelvetMasterChain {
  input: AudioNode;
  output: GainNode;
  analyser: AnalyserNode;
  complianceTap: GainNode;
  midSideStage: MidSideStage;
  multiBandStage: MultiBandStage;
  velvetFloor: FlexiblePillarStage;
  harmonicLattice: FlexiblePillarStage;
  phaseWeave: FlexiblePillarStage;
  velvetCurve: FlexiblePillarStage;
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
  meters: MasterMeterStack;
  setProfile: (profile: MasteringProfile | MasterProfileKey) => void;
  getProfile: () => MasteringProfile;
  setOutputCeiling: (ceilingDb: number) => void;
  setMasterTrim: (gain: number) => void;
  readonly master: {
    targetLUFS: number;
    profile: string;
    calibrated: boolean;
    masterVolume: number;
  };
}

export interface BuildMasterChainOptions {
  /** Use AudioWorklet-based pillar stages (default: true for AudioContext) */
  useWorklets?: boolean;
}

export async function buildMasterChain(
  ctx: AudioContext | OfflineAudioContext,
  options: BuildMasterChainOptions = {}
): Promise<VelvetMasterChain> {
  const profile = MASTERING_PROFILES[DEFAULT_PROFILE_KEY];
  const { useWorklets = true } = options;

  const dc = createDcBlocker(ctx);
  
  // Attempt to use AudioWorklet-based pillars for AudioContext
  let usingWorklets = false;
  let velvetFloor!: FlexiblePillarStage;
  let harmonicLattice!: FlexiblePillarStage;
  let phaseWeave!: FlexiblePillarStage;
  let velvetCurve!: FlexiblePillarStage;


  if (useWorklets && ctx instanceof AudioContext) {
    try {
      await registerFivePillarsWorklets(ctx);
      
      if (areAllPillarsRegistered()) {
        const vfWorklet = await createVelvetFloorWorklet(ctx, profile.velvetFloor);
        const hlWorklet = await createHarmonicLatticeWorklet(ctx, profile.harmonicLattice);
        const pwWorklet = await createPhaseWeaveWorklet(ctx, profile.phaseWeave);
        const vcWorklet = await createVelvetCurveWorklet(ctx, {});

        if (vfWorklet && hlWorklet && pwWorklet && vcWorklet) {
          // Wrap worklet nodes to match PillarStage interface
          velvetFloor = {
            input: vfWorklet.node,
            output: vfWorklet.node,
            setSettings: vfWorklet.setSettings,
          };
          harmonicLattice = {
            input: hlWorklet.node,
            output: hlWorklet.node,
            setSettings: hlWorklet.setSettings,
          };
          phaseWeave = {
            input: pwWorklet.node,
            output: pwWorklet.node,
            setSettings: pwWorklet.setSettings,
          };
          velvetCurve = {
            input: vcWorklet.node,
            output: vcWorklet.node,
          };
          
          usingWorklets = true;
          console.log('[masterChain] ✅ Using AudioWorklet-based Five Pillars');
        }
      }
    } catch (error) {
      console.warn('[masterChain] Worklet init failed, using Web Audio nodes:', error);
    }
  }

  // Fallback to Web Audio nodes
  if (!usingWorklets) {
    velvetFloor = createVelvetFloorStage(ctx, profile.velvetFloor);
    harmonicLattice = createHarmonicLatticeStage(ctx, profile.harmonicLattice);
    phaseWeave = createPhaseWeaveStage(ctx, profile.phaseWeave);
    velvetCurve = createVelvetCurveStage(ctx);
    console.log('[masterChain] Using Web Audio node-based Five Pillars');
  }

  const midSideStage = createMidSideStage(ctx);
  const multiBandStage = createMultiBandStage(ctx);


  const glue = createGlueCompressor(ctx);
  const { drive: colorDrive, shaper: colorShaper } = createVelvetSaturator(ctx);

  const preLimiterTap = ctx.createGain();
  preLimiterTap.gain.value = 1;
  const complianceTap = ctx.createGain();
  complianceTap.gain.value = 1;

  const preLimiterAnalyser = createAnalyser(ctx, 512, 0.6);
  const softLimiter = createLimiter(ctx, {
    threshold: -6,
    ratio: 6,
    attack: 0.01,
    release: 0.1,
    knee: 4,
  });

  const truePeakLimiter = await createTruePeakLimiterNode(ctx, -1);
  const dither = await createDitherNode(ctx);

  const postLimiterAnalyser = createAnalyser(ctx, 2048, 0.75);
  const panner = ctx.createStereoPanner();
  const masterGain = ctx.createGain();

  // Flow Meter Stack - Master Multi-Band Meters (STEP 2)
  const masterAnalyzerFull = ctx.createAnalyser();
  masterAnalyzerFull.fftSize = 4096;
  masterAnalyzerFull.smoothingTimeConstant = 0.85;

  // Body (Low-end) - < 200Hz
  const masterBody = ctx.createBiquadFilter();
  masterBody.type = "lowshelf";
  masterBody.frequency.value = 200;
  masterBody.gain.value = 0;
  const bodyMeter = ctx.createAnalyser();
  bodyMeter.fftSize = 2048;
  bodyMeter.smoothingTimeConstant = 0.85;

  // Soul (Mid-range) - ~800Hz
  const masterSoul = ctx.createBiquadFilter();
  masterSoul.type = "peaking";
  masterSoul.frequency.value = 800;
  masterSoul.Q.value = 1;
  masterSoul.gain.value = 0;
  const soulMeter = ctx.createAnalyser();
  soulMeter.fftSize = 2048;
  soulMeter.smoothingTimeConstant = 0.85;

  // Air (High-mid) - ~6kHz
  const masterAir = ctx.createBiquadFilter();
  masterAir.type = "highshelf";
  masterAir.frequency.value = 6000;
  masterAir.gain.value = 0;
  const airMeter = ctx.createAnalyser();
  airMeter.fftSize = 2048;
  airMeter.smoothingTimeConstant = 0.85;

  // Silk (High-end) - > 12kHz
  const masterSilk = ctx.createBiquadFilter();
  masterSilk.type = "highshelf";
  masterSilk.frequency.value = 12000;
  masterSilk.gain.value = 0;
  const silkMeter = ctx.createAnalyser();
  silkMeter.fftSize = 2048;
  silkMeter.smoothingTimeConstant = 0.85;

  // Route master input to multi-band meters
  dc.connect(masterAnalyzerFull);
  dc.connect(masterBody);
  dc.connect(masterSoul);
  dc.connect(masterAir);
  dc.connect(masterSilk);

  // Each band gets its own analyser
  masterBody.connect(bodyMeter);
  masterSoul.connect(soulMeter);
  masterAir.connect(airMeter);
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

  dc.connect(velvetFloor.input);
  velvetFloor.output.connect(harmonicLattice.input);
  harmonicLattice.output.connect(phaseWeave.input);
  phaseWeave.output.connect(velvetCurve.input);
  velvetCurve.output.connect(midSideStage.input);
  midSideStage.output.connect(multiBandStage.input);
  multiBandStage.output.connect(glue);
  glue.connect(colorDrive);
  colorDrive.connect(colorShaper);
  colorShaper.connect(preLimiterTap);

  preLimiterTap.connect(preLimiterAnalyser);
  preLimiterTap.connect(complianceTap);
  complianceTap.connect(softLimiter);

  softLimiter.connect(truePeakLimiter);
  truePeakLimiter.connect(postLimiterAnalyser);
  postLimiterAnalyser.connect(dither);
  dither.connect(panner);
  panner.connect(masterGain);

  const setProfile = (next: MasteringProfile | MasterProfileKey) => {
    const resolved =
      typeof next === 'string' ? MASTERING_PROFILES[next] : next;

    currentProfile.value = resolved;
    
    // Sync to Rust Backend
    rustMasterBridge.setProfile(resolved.name);

    velvetFloor.setSettings?.(resolved.velvetFloor);
    harmonicLattice.setSettings?.(resolved.harmonicLattice);
    phaseWeave.setSettings?.(resolved.phaseWeave);

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
    // Master trim is applied on top of calibrated LUFS gain
    // gain is 0-1 range from UI slider
    // Calibrated gain is already set based on targetLUFS
    // Final gain = calibrated gain * trim
    const calibratedGain = gainForLUFS(currentProfile.value.targetLUFS);
    const finalGain = calibratedGain * gain;
    masterGain.gain.setTargetAtTime(finalGain, ctx.currentTime, 0.01);
  };

  const getProfile = () => currentProfile.value;

  setOutputCeiling(profile.truePeakCeiling);

  let currentMasterTrim = 0.8; // Default trim

  const chain: VelvetMasterChain = {
    input: dc,
    output: masterGain,
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
    preLimiterTap,
    preLimiterAnalyser,
    postLimiterAnalyser,
    panner,
    masterGain,
    meters: masterMeters,
    setProfile,
    getProfile,
    setOutputCeiling,
    setMasterTrim: (gain: number) => {
      currentMasterTrim = gain;
      setMasterTrim(gain);
    },
    get master() {
      const p = currentProfile.value;
      return {
        targetLUFS: p.targetLUFS,
        profile: p.name.toLowerCase().replace(/\s+/g, '-'),
        calibrated: true,
        masterVolume: currentMasterTrim,
      };
    },
  };

  return chain;
}

function createGlueCompressor(
  ctx: AudioContext | OfflineAudioContext
): DynamicsCompressorNode {
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -18;
  glue.ratio.value = 2.2;
  glue.attack.value = 0.015;
  glue.release.value = 0.25;
  glue.knee.value = 2;
  return glue;
}

function createVelvetSaturator(ctx: AudioContext | OfflineAudioContext) {
  const drive = ctx.createGain();
  drive.gain.value = 1.0;

  const shaper = ctx.createWaveShaper();
  shaper.curve = createSaturationCurve(0.45);

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
  const threshold = isClub ? -14 : -18;
  const ratio = isClub ? 2.5 : 2.2;

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