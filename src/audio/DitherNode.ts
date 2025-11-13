export async function createDitherNode(
  context: AudioContext | OfflineAudioContext
): Promise<AudioWorkletNode | GainNode> {
  if ('audioWorklet' in context) {
    try {
      await (context as AudioContext).audioWorklet.addModule(
        new URL('../worklets/velvet-dither-processor.js', import.meta.url)
      );
      return new AudioWorkletNode(
        context as AudioContext,
        'velvet-dither-processor',
        {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
        }
      );
    } catch (error) {
      console.warn('[VELVET DITHER] Falling back to noise generator', error);
    }
  }

  const gain = context.createGain();
  gain.gain.value = 1;
  return gain;
}



