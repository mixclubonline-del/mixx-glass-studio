/**
 * Mixx Club Signal Matrix (Hybrid Canon)
 * - Defines core buses and routing for Flow runtime
 * - TWO TRACK, VOCALS, DRUMS, BASS, MUSIC → STEM MIX → MASTER
 * - AIR bus returns to MASTER (FX returns)
 */

export type MixxBuses = {
  twoTrack: GainNode;
  vocals: GainNode;
  drums: GainNode;
  bass: GainNode;
  music: GainNode;
  stemMix: GainNode;
  masterTap: GainNode;
  air: GainNode;
};

export type MixxBusAnalysers = {
  twoTrack: AnalyserNode;
  vocals: AnalyserNode;
  drums: AnalyserNode;
  bass: AnalyserNode;
  music: AnalyserNode;
  stemMix: AnalyserNode;
  masterTap: AnalyserNode;
  air: AnalyserNode;
};

export function createSignalMatrix(ctx: AudioContext, masterInput: AudioNode) {
  const buses: MixxBuses = {
    twoTrack: ctx.createGain(),
    vocals: ctx.createGain(),
    drums: ctx.createGain(),
    bass: ctx.createGain(),
    music: ctx.createGain(),
    stemMix: ctx.createGain(),
    masterTap: ctx.createGain(),
    air: ctx.createGain(),
  };

  // Create analysers for each bus to enable metering
  const analysers: MixxBusAnalysers = {
    twoTrack: ctx.createAnalyser(),
    vocals: ctx.createAnalyser(),
    drums: ctx.createAnalyser(),
    bass: ctx.createAnalyser(),
    music: ctx.createAnalyser(),
    stemMix: ctx.createAnalyser(),
    masterTap: ctx.createAnalyser(),
    air: ctx.createAnalyser(),
  };

  // Configure analysers for bus metering
  Object.values(analysers).forEach(analyser => {
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8; // Smooth meter readings
  });

  // Connect each bus to its analyser (tap before routing to next stage)
  buses.twoTrack.connect(analysers.twoTrack);
  buses.vocals.connect(analysers.vocals);
  buses.drums.connect(analysers.drums);
  buses.bass.connect(analysers.bass);
  buses.music.connect(analysers.music);
  buses.stemMix.connect(analysers.stemMix);
  buses.masterTap.connect(analysers.masterTap);
  buses.air.connect(analysers.air);

  // Default Mixx gain staging
  buses.twoTrack.gain.value = 0.65; // ~ -3.5 dB
  buses.vocals.gain.value = 1.15;   // ~ +1.5 dB
  buses.drums.gain.value = 1.0;
  buses.bass.gain.value = 0.85;     // ~ -1.5 dB
  buses.music.gain.value = 0.9;
  buses.stemMix.gain.value = 1.0;
  buses.masterTap.gain.value = 1.0;
  buses.air.gain.value = 0.5;

  // Buses → Stem Mix
  buses.twoTrack.connect(buses.stemMix);
  buses.vocals.connect(buses.stemMix);
  buses.drums.connect(buses.stemMix);
  buses.bass.connect(buses.stemMix);
  buses.music.connect(buses.stemMix);

  // Air (FX returns) → Master tap
  buses.air.connect(buses.masterTap);

  // Stem Mix → Master tap → Master input
  buses.stemMix.connect(buses.masterTap);
  buses.masterTap.connect(masterInput);

  const routeTrack = (trackId: string, role?: string): GainNode => {
    const id = (trackId || '').toLowerCase();
    const r = (role || '').toLowerCase();
    if (id === 'track-two-track' || r.includes('two-track') || r.includes('twotrack')) return buses.twoTrack;
    if (id === 'track-stem-vocals' || r.includes('vocal')) return buses.vocals;
    if (id === 'track-stem-drums' || r.includes('drum')) return buses.drums;
    if (id === 'track-stem-bass' || r.includes('bass')) return buses.bass;
    if (id === 'track-stem-harmonic' || id === 'track-stem-perc' || id === 'track-stem-sub' || r.includes('harmonic') || r.includes('perc') || r === 'sub') {
      return buses.music;
    }
    // Hush record lane: treat as vocals bus by default
    if (id === 'track-hush-record') return buses.vocals;
    // Fallback
    return buses.stemMix;
  };

  return { buses, routeTrack, analysers };
}


