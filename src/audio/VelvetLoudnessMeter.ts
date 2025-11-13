export interface VelvetLoudnessMetrics {
  momentaryLUFS: number;
  shortTermLUFS: number;
  integratedLUFS: number;
  truePeakDb: number;
}

export type VelvetLoudnessEvents = 'metrics';

export const DEFAULT_VELVET_LOUDNESS_METRICS: VelvetLoudnessMetrics = {
  momentaryLUFS: -Infinity,
  shortTermLUFS: -Infinity,
  integratedLUFS: -Infinity,
  truePeakDb: -Infinity,
};

export class VelvetLoudnessMeter extends EventTarget {
  private node: AudioNode | null = null;
  private latest: VelvetLoudnessMetrics = { ...DEFAULT_VELVET_LOUDNESS_METRICS };
  private initialized = false;

  async attach(
    context: AudioContext | OfflineAudioContext,
    source: AudioNode,
    destination?: AudioNode
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize(context);
    }

    if (!this.node) {
      throw new Error('Velvet loudness meter failed to initialize');
    }

    source.disconnect();
    source.connect(this.node);
    if (destination) {
      this.node.connect(destination);
    }
  }

  async initialize(context: AudioContext | OfflineAudioContext): Promise<void> {
    if (this.initialized) return;

    try {
      if ('audioWorklet' in context) {
        await (context as AudioContext).audioWorklet.addModule(
          new URL('../worklets/true-peak-processor.js', import.meta.url)
        );

        const worklet = new AudioWorkletNode(
          context as AudioContext,
          'velvet-loudness-processor',
          {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [2],
          }
        );

        worklet.port.onmessage = (event) => {
          const data = event.data as VelvetLoudnessMetrics;
          this.latest = data;
          this.dispatchEvent(new CustomEvent('metrics', { detail: data }));
        };

        this.node = worklet;
        this.initialized = true;
        return;
      }
    } catch (error) {
      console.warn('[VELVET LOUDNESS] Falling back to analyser meter', error);
    }

    // Fallback to analyser-based estimation
    const analyser = context.createAnalyser();
    analyser.fftSize = 2048;
    const buffer = new Float32Array(analyser.fftSize);
    const frame = () => {
      analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      const mean = sum / buffer.length;
      const fallbackLUFS = mean <= 0 ? -Infinity : -0.691 + 10 * Math.log10(mean);
      const fallbackTruePeak = buffer.reduce(
        (peak, sample) => Math.max(peak, Math.abs(sample)),
        0
      );
      const metrics: VelvetLoudnessMetrics = {
        momentaryLUFS: fallbackLUFS,
        shortTermLUFS: fallbackLUFS,
        integratedLUFS: fallbackLUFS,
        truePeakDb: fallbackTruePeak > 0 ? 20 * Math.log10(fallbackTruePeak) : -Infinity,
      };
      this.latest = metrics;
      this.dispatchEvent(new CustomEvent('metrics', { detail: metrics }));
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(frame);
      }
    };
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(frame);
    }
    this.node = analyser;
    this.initialized = true;
  }

  getNode(): AudioNode | null {
    return this.node;
  }

  getLatestMetrics(): VelvetLoudnessMetrics {
    return this.latest;
  }

  reset(): void {
    if (this.node instanceof AudioWorkletNode) {
      this.node.port.postMessage('reset');
    }
    this.latest = { ...DEFAULT_VELVET_LOUDNESS_METRICS };
  }
}

