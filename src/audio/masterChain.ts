

import { createDcBlocker } from "./utils";

export function buildMasterChain(ctx: AudioContext | OfflineAudioContext) {
  const dc = createDcBlocker(ctx);

  // gentle bus glue
  const glue = ctx.createDynamicsCompressor();
  glue.threshold.value = -18; // dB
  glue.ratio.value = 1.8;
  glue.attack.value = 0.015;
  glue.release.value = 0.15;
  glue.knee.value = 1;

  // soft saturator
  const drive = ctx.createGain(); drive.gain.value = 1.0;
  const shaper = ctx.createWaveShaper();
  const curve = new Float32Array(1024);
  for (let i=0;i<curve.length;i++){
    const x = (i/ (curve.length-1)) * 2 - 1; // -1..1
    curve[i] = Math.tanh(2.2 * x);
  }
  shaper.curve = curve;

  // temp limiter (swap to lookahead worklet in next step)
  const limiter = ctx.createDynamicsCompressor();
  limiter.threshold.value = -1.0;
  limiter.ratio.value = 20;
  limiter.attack.value = 0.001;
  limiter.release.value = 0.08;
  limiter.knee.value = 0;

  // pre-limiter tap (for true-peak meter)
  const preLimiter = ctx.createGain();
  
  // Master panner for balance control
  const panner = ctx.createStereoPanner();

  // Master analyser for HUD visualization
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 256;
  analyser.smoothingTimeConstant = 0.6;

  const masterOutputGain = ctx.createGain();
  masterOutputGain.gain.value = 1.0;

  // wire
  dc.connect(glue);
  glue.connect(drive); drive.connect(shaper);
  shaper.connect(preLimiter);
  preLimiter.connect(analyser);
  analyser.connect(limiter);
  limiter.connect(panner);
  panner.connect(masterOutputGain);

  return {
    input: dc,
    glue,
    shaper,
    preLimiter,
    analyser,
    limiter,
    panner,
    output: masterOutputGain,
  };
}