export type StemName = 'Vocals' | 'Drums' | 'Bass' | 'Other';
export type StemGroup = 'Vocals' | 'Harmony' | 'Adlibs' | 'Bass' | 'Drums' | 'Instruments';
export type StemColor = 'cyan' | 'magenta' | 'blue' | 'green' | 'purple';

export interface StemDefinition {
  name: StemName;
  id: string;
  group: StemGroup;
  color: StemColor;
}

const STEM_DEFINITIONS: StemDefinition[] = [
  { name: 'Vocals', id: 'vocals', group: 'Vocals', color: 'magenta' },
  { name: 'Drums', id: 'drums', group: 'Drums', color: 'blue' },
  { name: 'Bass', id: 'bass', group: 'Bass', color: 'green' },
  { name: 'Other', id: 'other', group: 'Instruments', color: 'purple' },
];

interface StemRenderConfig {
  definition: StemDefinition;
  render: (
    context: OfflineAudioContext,
    source: AudioBufferSourceNode
  ) => AudioNode;
}

const createStemRenderConfigs = (): StemRenderConfig[] => {
  return [
    {
      definition: STEM_DEFINITIONS[0], // Vocals
      render: (context, source) => {
        const highPass = context.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 180;
        const lowPass = context.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 6500;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -20;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.01;
        compressor.release.value = 0.3;
        const deEsser = context.createBiquadFilter();
        deEsser.type = 'notch';
        deEsser.frequency.value = 7200;
        deEsser.Q.value = 6;
        const gain = context.createGain();
        gain.gain.value = 1.15;

        source.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(deEsser);
        deEsser.connect(compressor);
        compressor.connect(gain);

        return gain;
      },
    },
    {
      definition: STEM_DEFINITIONS[1], // Drums
      render: (context, source) => {
        const transientBoost = context.createDynamicsCompressor();
        transientBoost.threshold.value = -10;
        transientBoost.ratio.value = 6;
        transientBoost.attack.value = 0.002;
        transientBoost.release.value = 0.08;
        const highPass = context.createBiquadFilter();
        highPass.type = 'highpass';
        highPass.frequency.value = 120;
        const lowPass = context.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 12000;
        const transientShaper = context.createWaveShaper();
        const curve = new Float32Array(1024);
        for (let i = 0; i < curve.length; i += 1) {
          const x = (i / (curve.length - 1)) * 2 - 1;
          curve[i] = Math.sign(x) * Math.pow(Math.abs(x), 0.6);
        }
        transientShaper.curve = curve;
        transientShaper.oversample = '4x';
        const gain = context.createGain();
        gain.gain.value = 1.1;

        source.connect(transientBoost);
        transientBoost.connect(highPass);
        highPass.connect(lowPass);
        lowPass.connect(transientShaper);
        transientShaper.connect(gain);

        return gain;
      },
    },
    {
      definition: STEM_DEFINITIONS[2], // Bass
      render: (context, source) => {
        const lowPass = context.createBiquadFilter();
        lowPass.type = 'lowpass';
        lowPass.frequency.value = 220;
        const resonance = context.createBiquadFilter();
        resonance.type = 'peaking';
        resonance.frequency.value = 90;
        resonance.Q.value = 1.5;
        resonance.gain.value = 6;
        const compressor = context.createDynamicsCompressor();
        compressor.threshold.value = -24;
        compressor.ratio.value = 3;
        compressor.attack.value = 0.02;
        compressor.release.value = 0.25;
        const gain = context.createGain();
        gain.gain.value = 1.25;

        source.connect(lowPass);
        lowPass.connect(resonance);
        resonance.connect(compressor);
        compressor.connect(gain);

        return gain;
      },
    },
    {
      definition: STEM_DEFINITIONS[3], // Other
      render: (context, source) => {
        const midFocus = context.createBiquadFilter();
        midFocus.type = 'bandpass';
        midFocus.frequency.value = 2400;
        midFocus.Q.value = 0.9;
        const shimmer = context.createBiquadFilter();
        shimmer.type = 'peaking';
        shimmer.frequency.value = 6200;
        shimmer.Q.value = 1.2;
        shimmer.gain.value = 3.5;
        const ambience = context.createConvolver();
        ambience.buffer = createShortRoomImpulse(context, source.buffer?.numberOfChannels ?? 2);
        const dryGain = context.createGain();
        dryGain.gain.value = 0.8;
        const wetGain = context.createGain();
        wetGain.gain.value = 0.35;
        const merger = context.createGain();

        source.connect(midFocus);
        midFocus.connect(shimmer);
        shimmer.connect(dryGain);
        dryGain.connect(merger);

        shimmer.connect(ambience);
        ambience.connect(wetGain);
        wetGain.connect(merger);

        return merger;
      },
    },
  ];
};

const createShortRoomImpulse = (
  context: OfflineAudioContext,
  channels: number
): AudioBuffer => {
  const sampleRate = context.sampleRate;
  const length = sampleRate * 0.2;
  const impulse = context.createBuffer(channels, length, sampleRate);
  for (let channel = 0; channel < channels; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 2.5);
    }
  }
  return impulse;
};

export interface StemSeparationOptions {
  enableAmbience?: boolean;
}

export async function performBasicStemSeparation(
  buffer: AudioBuffer,
  options: StemSeparationOptions = {}
): Promise<Record<StemName, AudioBuffer>> {
  const { numberOfChannels, length, sampleRate } = buffer;
  const configs = createStemRenderConfigs();
  const results: Partial<Record<StemName, AudioBuffer>> = {};

  const renderStem = async (config: StemRenderConfig) => {
    const offlineContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;

    const tail = config.render(offlineContext, source);
    tail.connect(offlineContext.destination);
    source.start(0);

    const rendered = await offlineContext.startRendering();

    if (!options.enableAmbience && config.definition.name === 'Other') {
      const dryContext = new OfflineAudioContext(numberOfChannels, length, sampleRate);
      const drySource = dryContext.createBufferSource();
      drySource.buffer = rendered;
      const dryGain = dryContext.createGain();
      dryGain.gain.value = 0.92;
      drySource.connect(dryGain);
      dryGain.connect(dryContext.destination);
      drySource.start(0);
      const flattened = await dryContext.startRendering();
      results[config.definition.name] = flattened;
      return;
    }

    results[config.definition.name] = rendered;
  };

  for (const config of configs) {
    await renderStem(config);
  }

  return results as Record<StemName, AudioBuffer>;
}

export const STEM_PRESETS = STEM_DEFINITIONS;
