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
 */
export function createSaturationCurve(amount: number): Float32Array {
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

  const midGain = ctx.createGain();
  const sideGain = ctx.createGain();

  input.connect(midGain);
  input.connect(sideGain);

  midGain.connect(output);
  sideGain.connect(output);

  const setSettings = (next: PhaseWeaveSettings) => {
    midGain.gain.setTargetAtTime(1.0, ctx.currentTime, 0.01);
    const widthGain = (next.width / 100) * 1.5;
    sideGain.gain.setTargetAtTime(widthGain, ctx.currentTime, 0.01);
  };

  setSettings(settings);

  return { input, output, setSettings };
}

export function createVelvetCurveStage(ctx: BaseAudioContext) {
  const input = ctx.createGain();
  const output = ctx.createGain();

  const lowPass = ctx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.value = 200;

  const lowComp = ctx.createDynamicsCompressor();
  lowComp.threshold.value = -24;
  lowComp.ratio.value = 3;
  lowComp.attack.value = 0.01;
  lowComp.release.value = 0.25;

  const highPass = ctx.createBiquadFilter();
  highPass.type = 'highpass';
  highPass.frequency.value = 200;

  input.connect(lowPass);
  lowPass.connect(lowComp);
  lowComp.connect(output);

  input.connect(highPass);
  highPass.connect(output);

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

