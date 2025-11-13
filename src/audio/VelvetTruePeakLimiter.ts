export async function createTruePeakLimiterNode(
  context: AudioContext | OfflineAudioContext,
  thresholdDb = -1
): Promise<AudioWorkletNode | GainNode> {
  if ('audioWorklet' in context) {
    try {
      await (context as AudioContext).audioWorklet.addModule(
        new URL('../worklets/velvet-true-peak-limiter.js', import.meta.url)
      );
      const node = new AudioWorkletNode(
        context as AudioContext,
        'velvet-true-peak-limiter',
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
        }
      );
      node.parameters.get('threshold')?.setValueAtTime(thresholdDb, context.currentTime);
      return node;
    } catch (error) {
      console.warn('[VELVET TRUE PEAK] Failed to load worklet, using fallback limiter.', error);
    }
  }

  const fallback = context.createDynamicsCompressor();
  fallback.threshold.value = thresholdDb;
  fallback.ratio.value = 20;
  fallback.attack.value = 0.001;
  fallback.release.value = 0.05;
  fallback.knee.value = 0;
  return fallback;
}

