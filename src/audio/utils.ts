// audio/utils.ts
export function createDcBlocker(ctx: AudioContext | OfflineAudioContext) {
  const hpf = ctx.createBiquadFilter();
  hpf.type = "highpass";
  hpf.frequency.value = 15;   // clear DC / infra
  hpf.Q.value = 0.707;
  return hpf;
}

export function buildTrackInputChain(ctx: AudioContext | OfflineAudioContext) {
  const trim = ctx.createGain();           // pre-gain trim for headroom
  trim.gain.value = 0.75;                  // ~-2.5 dB default

  const dc = createDcBlocker(ctx);
  const preSat = ctx.createGain();         // drive into tone/EQ/sat
  preSat.gain.value = 1.0;

  // Input -> Trim -> DC -> preSat -> (Velvet/EQ/Comp) -> Pan -> Fader
  trim.connect(dc);
  dc.connect(preSat);

  return { trim, dc, preSat };
}