export async function createTruePeakLimiterNode(
  context: AudioContext | OfflineAudioContext,
  thresholdDb = -1
): Promise<AudioNode> {
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

  const fallbackCompressor = context.createDynamicsCompressor();
  fallbackCompressor.threshold.value = thresholdDb;
  fallbackCompressor.ratio.value = 20;
  fallbackCompressor.attack.value = 0.001;
  fallbackCompressor.release.value = 0.05;
  fallbackCompressor.knee.value = 0;
  return fallbackCompressor;
}


