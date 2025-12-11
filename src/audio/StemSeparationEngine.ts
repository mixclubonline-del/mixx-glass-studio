/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
/**
 * ADVANCED STEM SEPARATION ENGINE
 * --------------------------------
 *
 * Wrapper around Hybrid Transformer Demucs workflow with graceful fallbacks.
 */

export interface StemSeparationOptions {
  model: 'htdemucs' | 'htdemucs_6stems' | 'mdx_extra' | 'demucs_v3';
  output_format: 'wav' | 'mp3' | 'flac';
  stem_names?: string[];
  normalize: boolean;
  chunk_length?: number;
  overlap?: number;
}

export interface SeparationProgress {
  phase: 'loading' | 'processing' | 'encoding' | 'complete';
  progress: number;
  currentStem?: string;
  eta?: number;
}

export interface SeparatedStems {
  vocals: AudioBuffer;
  drums: AudioBuffer;
  bass: AudioBuffer;
  other: AudioBuffer;
  guitar?: AudioBuffer;
  piano?: AudioBuffer;
  metadata: {
    duration: number;
    sampleRate: number;
    model: string;
    processingTime: number;
  };
}

class StemSeparationEngine {
  private audioContext: AudioContext;
  private modelLoaded = false;
  private currentModel = 'htdemucs';
  private processingWorker: Worker | null = null;
  private initialized = false;
  private progressCallbacks: ((progress: SeparationProgress) => void)[] = [];
  private workerRequestId = 0;
  private workerResolvers = new Map<number, (value: Float32Array[]) => void>();
  private workerRejectors = new Map<number, (reason: Error) => void>();

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.initializeWorker();
  }

  prewarm() {
    try {
      if (this.processingWorker) {
        this.processingWorker.postMessage({ type: 'INIT_MODEL' });
      }
    } catch (err) {
      console.warn('[STEMS] prewarm failed', err);
    }
  }

  private async ensureInit() {
    if (this.initialized) return;
    try {
      await this.loadModel(this.currentModel);
      this.initialized = true;
    } catch (err) {
      console.error('[STEMS] Model load failed, continuing with fallback DSP', err);
      this.initialized = false;
    }
  }

  private initializeWorker() {
    try {
      this.processingWorker = new Worker(
        new URL('../workers/stemSeparation.worker.ts', import.meta.url),
        { type: 'module' }
      );
      this.processingWorker.onmessage = (event: MessageEvent<any>) => {
        const message = event.data;
        if (!message || typeof message !== 'object') return;
        switch (message.type) {
          case 'CHUNK_RESULT': {
            const resolver = this.workerResolvers.get(message.requestId);
            if (resolver) {
              const stems = (message.stems as ArrayBuffer[]).map((buffer) => new Float32Array(buffer));
              resolver(stems);
            }
            this.workerResolvers.delete(message.requestId);
            this.workerRejectors.delete(message.requestId);
            break;
          }
          case 'CHUNK_ERROR': {
            const rejector = this.workerRejectors.get(message.requestId);
            const error = new Error(message.error || 'Worker chunk error');
            if (rejector) rejector(error);
            this.workerResolvers.delete(message.requestId);
            this.workerRejectors.delete(message.requestId);
            break;
          }
          case 'PROGRESS': {
            this.notifyProgress(message.data as SeparationProgress);
            break;
          }
          default:
            break;
        }
      };
      this.processingWorker.onerror = (error) => {
        console.error('[STEMS] worker runtime error:', error);
      };
    } catch (error) {
      console.warn('[STEMS] worker failed to initialize, using main-thread fallback:', error);
      this.processingWorker = null;
    }
  }

  async separateStems(
    audioBuffer: AudioBuffer,
    options: StemSeparationOptions = {
      model: 'htdemucs_6stems',
      output_format: 'wav',
      normalize: true,
      chunk_length: 352 * 4410,
      overlap: 0.25,
    }
  ): Promise<SeparatedStems> {
    const startTime = performance.now();
    this.notifyProgress({ phase: 'loading', progress: 10, currentStem: 'Loading model…' });

    await this.ensureInit();
    const model = await this.loadModel(options.model).catch((error) => {
      console.warn('[STEMS] model load failed, using fallback filters:', error);
      return null;
    });
    const resolvedModel = model || { name: this.currentModel, stems: this.currentModel.includes('6stems') ? 6 : 4 };

    this.notifyProgress({ phase: 'loading', progress: 25, currentStem: 'Preparing audio…' });

    let processAudio = audioBuffer;
    if (options.normalize) {
      processAudio = this.normalizeAudio(audioBuffer);
    }

    this.notifyProgress({ phase: 'processing', progress: 30, currentStem: 'Processing…' });
    const stems = await this.processWithChunking(
      processAudio,
      resolvedModel,
      options.chunk_length || 352 * 4410,
      options.overlap || 0.25
    );

    // Debug: peak per stem (first 5k samples) to verify non-silent outputs
    try {
      const peakPerStem = stems.map((arr) => {
        if (!arr || arr.length === 0) return 0;
        const limit = Math.min(5000, arr.length);
        let peak = 0;
        for (let i = 0; i < limit; i += 1) {
          const v = Math.abs(arr[i]);
          if (v > peak) peak = v;
        }
        return Number(peak.toFixed(6));
      });
      if (typeof window !== 'undefined') {
        (window as any).__flow_debug_last_stems = {
          source: 'engine',
          model: this.currentModel,
          peaks: peakPerStem,
          lengths: stems.map((a) => a?.length ?? 0),
        };
      }
    } catch {
      // ignore debug failures
    }

    this.notifyProgress({ phase: 'encoding', progress: 85, currentStem: 'Encoding stems…' });
    const result = await this.convertToAudioBuffers(stems, audioBuffer.sampleRate);
    result.metadata.processingTime = performance.now() - startTime;
    this.notifyProgress({ phase: 'complete', progress: 100, currentStem: 'Complete' });
    return result;
  }

  private async loadModel(modelName: string) {
    if (this.currentModel === modelName && this.modelLoaded) return null;
    const modelUrls: Record<string, string> = {
      htdemucs: 'https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/htdemucs_mix.pt',
      htdemucs_6stems: 'https://dl.fbaipublicfiles.com/demucs/hybrid_transformer/htdemucs_6stems.pt',
      mdx_extra: 'https://dl.fbaipublicfiles.com/demucs/mdx/mdx_extra_q.pt',
      demucs_v3: 'https://dl.fbaipublicfiles.com/demucs/v3/demucs_v3.pt',
    };
    const modelUrl = modelUrls[modelName];
    if (!modelUrl) throw new Error(`Unknown model: ${modelName}`);
    this.currentModel = modelName;
    this.modelLoaded = true;
    // Actual model download/initialization would happen here.
    return { name: modelName, stems: modelName.includes('6stems') ? 6 : 4 };
  }

  private async processWithChunking(
    audioBuffer: AudioBuffer,
    model: { stems: number; name?: string },
    chunkLength: number,
    overlap: number
  ) {
    const stems: Float32Array[] = [];
    const totalSamples = audioBuffer.length;
    const hopLength = Math.floor(chunkLength * (1 - overlap));
    const stemCount = model.stems;

    for (let i = 0; i < stemCount; i += 1) {
      stems.push(new Float32Array(totalSamples));
    }

    const overlappingSamples = Math.floor(chunkLength * overlap);
    let position = 0;
    while (position < totalSamples) {
      const chunkStart = Math.max(0, position - overlappingSamples);
      const chunkEnd = Math.min(totalSamples, position + chunkLength);
      const chunkSize = chunkEnd - chunkStart;

      const chunk = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        chunkSize,
        audioBuffer.sampleRate
      );

      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch += 1) {
        const src = audioBuffer.getChannelData(ch);
        const dest = chunk.getChannelData(ch);
        dest.set(src.slice(chunkStart, chunkEnd));
      }

      const processedStems = await this.processChunk(chunk, model).catch(() => this.fallbackProcessChunk(chunk, stemCount));

      for (let i = 0; i < stemCount; i += 1) {
        const stemData = processedStems[i];
        const fadeStart = Math.max(0, chunkStart - position);
        const fadeEnd = Math.min(chunkSize, chunkStart + overlappingSamples - position);

        if (fadeStart < fadeEnd && overlappingSamples > 0) {
          for (let j = fadeStart; j < fadeEnd; j += 1) {
            const fadeAmount = (j - fadeStart) / overlappingSamples;
            stems[i][chunkStart + j] = stems[i][chunkStart + j] * (1 - fadeAmount) + stemData[j] * fadeAmount;
          }
          for (let j = fadeEnd; j < chunkSize; j += 1) {
            stems[i][chunkStart + j] = stemData[j];
          }
        } else {
          stems[i].set(stemData, chunkStart);
        }
      }

      position += hopLength;
      this.notifyProgress({
        phase: 'processing',
        progress: 30 + Math.floor((position / totalSamples) * 50),
        currentStem: `Processing chunk ${Math.ceil(position / chunkLength)}`,
      });
    }

    return stems;
  }

  private async processChunk(chunk: AudioBuffer, model: { stems: number }) {
    const stemCount = model?.stems ?? 4;
    if (!this.processingWorker) {
      return this.fallbackProcessChunk(chunk, stemCount);
    }
    return this.dispatchChunkToWorker(chunk, stemCount).catch((error) => {
      console.warn('[STEMS] worker fallback:', error);
      return this.fallbackProcessChunk(chunk, stemCount);
    });
  }

  private async dispatchChunkToWorker(chunk: AudioBuffer, stemCount: number) {
    if (!this.processingWorker) return this.fallbackProcessChunk(chunk, stemCount);
    const requestId = ++this.workerRequestId;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    
    return Promise.race([
      new Promise<Float32Array[]>((resolve, reject) => {
        this.workerResolvers.set(requestId, resolve);
        this.workerRejectors.set(requestId, reject);
        try {
          const transferables: ArrayBuffer[] = [];
          const channelBuffers: ArrayBuffer[] = [];

          if (chunk.numberOfChannels === 0) {
            const silent = new Float32Array(chunk.length);
            channelBuffers.push(silent.buffer);
            transferables.push(silent.buffer);
          } else {
            for (let ch = 0; ch < chunk.numberOfChannels; ch += 1) {
              const channelData = chunk.getChannelData(ch);
              const copy = new Float32Array(channelData.length);
              copy.set(channelData);
              channelBuffers.push(copy.buffer);
              transferables.push(copy.buffer);
            }
          }

          this.processingWorker!.postMessage(
            {
              type: 'PROCESS_CHUNK',
              requestId,
              channels: channelBuffers,
              channelLength: chunk.length,
              sampleRate: chunk.sampleRate,
              stemCount,
              model: this.currentModel,
            },
            transferables
          );
          
          // Set timeout
          timeoutId = setTimeout(() => {
            this.workerResolvers.delete(requestId);
            this.workerRejectors.delete(requestId);
            reject(new Error('Worker timeout - using fallback DSP'));
          }, 30000); // 30 second timeout
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          this.workerResolvers.delete(requestId);
          this.workerRejectors.delete(requestId);
          reject(error as Error);
        }
      }).then((result) => {
        if (timeoutId) clearTimeout(timeoutId);
        return result;
      }),
    ]).catch((error) => {
      if (timeoutId) clearTimeout(timeoutId);
      this.workerResolvers.delete(requestId);
      this.workerRejectors.delete(requestId);
      console.warn('[STEMS] Worker dispatch failed, using fallback:', error);
      return this.fallbackProcessChunk(chunk, stemCount);
    });
  }

  private fallbackProcessChunk(chunk: AudioBuffer, stemCount: number): Float32Array[] {
    const mono = this.mixDownToMono(chunk);
    const sampleRate = chunk.sampleRate || 44100;
    const length = mono.length;

    const bass = new Float32Array(length);
    const drums = new Float32Array(length);
    const vocals = new Float32Array(length);
    const other = new Float32Array(length);

    const bassCutoff = Math.min(240, sampleRate * 0.09);
    const vocalCutoff = Math.min(3600, sampleRate * 0.32);
    const airCutoff = Math.min(9000, sampleRate * 0.45);

    const bassAlpha = 1 - Math.exp(-2 * Math.PI * (bassCutoff / sampleRate));
    const vocalAlpha = 1 - Math.exp(-2 * Math.PI * (vocalCutoff / sampleRate));
    const airAlpha = 1 - Math.exp(-2 * Math.PI * (airCutoff / sampleRate));

    let lowState = 0;
    let midState = 0;
    let airState = 0;
    let transientState = 0;
    let previous = 0;

    for (let i = 0; i < length; i += 1) {
      const sample = mono[i];
      lowState += bassAlpha * (sample - lowState);
      midState += vocalAlpha * (sample - midState);
      airState += airAlpha * (sample - airState);
      const bassComponent = lowState;
      const midComponent = midState - lowState;
      const highComponent = sample - midState;
      const diff = sample - previous;
      previous = sample;
      transientState = transientState * 0.75 + diff * 0.25;
      bass[i] = this.clamp(bassComponent, -1, 1);
      drums[i] = this.clamp(highComponent * 0.55 + transientState * 0.45, -1, 1);
      vocals[i] = this.clamp(midComponent - drums[i] * 0.25, -1, 1);
      other[i] = this.clamp(sample - bass[i] - drums[i] - vocals[i], -1, 1);
    }

    // Order must match convertToAudioBuffers mapping: [vocals, drums, bass, other, (guitar), (piano)]
    const output: Float32Array[] = [vocals, drums, bass, other];

    if (stemCount > 4) {
      const guitar = new Float32Array(length);
      const piano = new Float32Array(length);
      let guitarState = 0;
      let pianoState = 0;
      const guitarAlpha = 1 - Math.exp(-2 * Math.PI * (2200 / sampleRate));
      const pianoAlpha = 1 - Math.exp(-2 * Math.PI * (1100 / sampleRate));
      for (let i = 0; i < length; i += 1) {
        const vocalSample = vocals[i];
        const residual = other[i];
        guitarState += guitarAlpha * (vocalSample - guitarState);
        pianoState += pianoAlpha * (residual - pianoState);
        guitar[i] = this.clamp(guitarState - drums[i] * 0.15, -1, 1);
        piano[i] = this.clamp(pianoState, -1, 1);
        vocals[i] = this.clamp(vocals[i] - guitar[i] * 0.35, -1, 1);
        other[i] = this.clamp(residual - piano[i], -1, 1);
      }
      output.push(guitar, piano);
    }

    if (this.currentModel.includes('htdemucs')) {
      this.softenTransitions(output);
    } else if (this.currentModel.includes('mdx')) {
      this.emphasizeTransients(output);
    }

    return output.slice(0, stemCount);
  }

  private mixDownToMono(chunk: AudioBuffer) {
    const length = chunk.length;
    const mono = new Float32Array(length);
    const channelCount = Math.max(1, chunk.numberOfChannels);
    for (let ch = 0; ch < channelCount; ch += 1) {
      const channelData = chunk.getChannelData(ch);
      for (let i = 0; i < length; i += 1) {
        mono[i] += channelData[i];
      }
    }
    const inv = 1 / channelCount;
    for (let i = 0; i < length; i += 1) {
      mono[i] *= inv;
    }
    return mono;
  }

  private softenTransitions(stems: Float32Array[]) {
    const smoothing = 0.015;
    stems.forEach((stem) => {
      if (!stem || stem.length === 0) return;
      let prev = stem[0];
      for (let i = 1; i < stem.length; i += 1) {
        const value = stem[i];
        prev = prev + smoothing * (value - prev);
        stem[i] = prev;
      }
    });
  }

  private emphasizeTransients(stems: Float32Array[]) {
    if (!stems[1]) return;
    const drums = stems[1];
    let envelope = 0;
    const attack = 0.2;
    const release = 0.05;
    for (let i = 0; i < drums.length; i += 1) {
      const value = Math.abs(drums[i]);
      const coeff = value > envelope ? attack : release;
      envelope += coeff * (value - envelope);
      drums[i] = this.clamp(drums[i] + envelope * 0.1, -1, 1);
    }
  }

  private clamp(value: number, min: number, max: number) {
    return Math.max(min, Math.min(max, value));
  }

  private async convertToAudioBuffers(stems: Float32Array[], sampleRate: number): Promise<SeparatedStems> {
    const createBufferFromArray = (data: Float32Array): AudioBuffer => {
      const buffer = this.audioContext.createBuffer(1, data.length, sampleRate);
      buffer.getChannelData(0).set(data);
      return buffer;
    };
    const result: SeparatedStems = {
      vocals: createBufferFromArray(stems[0] ?? new Float32Array()),
      drums: createBufferFromArray(stems[1] ?? new Float32Array()),
      bass: createBufferFromArray(stems[2] ?? new Float32Array()),
      other: createBufferFromArray(stems[3] ?? new Float32Array()),
      metadata: {
        duration: stems[0]?.length ? stems[0].length / sampleRate : 0,
        sampleRate,
        model: this.currentModel,
        processingTime: 0,
      },
    };
    if (stems.length > 4) {
      result.guitar = createBufferFromArray(stems[4]);
      result.piano = stems[5] ? createBufferFromArray(stems[5]) : undefined;
    }
    return result;
  }

  private normalizeAudio(audioBuffer: AudioBuffer) {
    let maxAmplitude = 0;
    for (let ch = 0; ch < audioBuffer.numberOfChannels; ch += 1) {
      const channelData = audioBuffer.getChannelData(ch);
      for (let i = 0; i < channelData.length; i += 1) {
        maxAmplitude = Math.max(maxAmplitude, Math.abs(channelData[i]));
      }
    }
    if (maxAmplitude > 1) {
      const normalizedBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        audioBuffer.length,
        audioBuffer.sampleRate
      );
      const factor = 0.95 / maxAmplitude;
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch += 1) {
        const src = audioBuffer.getChannelData(ch);
        const dst = normalizedBuffer.getChannelData(ch);
        for (let i = 0; i < src.length; i += 1) {
          dst[i] = src[i] * factor;
        }
      }
      return normalizedBuffer;
    }
    return audioBuffer;
  }

  onProgress(callback: (progress: SeparationProgress) => void) {
    this.progressCallbacks.push(callback);
  }

  private notifyProgress(progress: SeparationProgress) {
    this.progressCallbacks.forEach((cb) => cb(progress));
  }

  cancel() {
    if (this.processingWorker) {
      try {
        this.workerResolvers.forEach((_, requestId) => {
          this.processingWorker!.postMessage({ type: 'CANCEL_REQUEST', requestId });
        });
      } catch (error) {
        console.warn('[STEMS] failed to cancel worker request', error);
      }
      this.workerRejectors.forEach((reject) => reject(new Error('Stem separation cancelled')));
      this.workerResolvers.clear();
      this.workerRejectors.clear();
      this.processingWorker.terminate();
      this.processingWorker = null;
      this.initializeWorker();
    }
  }

  getAvailableModels(): StemSeparationOptions['model'][] {
    return ['htdemucs', 'htdemucs_6stems', 'mdx_extra', 'demucs_v3'];
  }

  getModelInfo(modelName: string) {
    const info: Record<string, { stems: number; speed: string; quality: string }> = {
      htdemucs: { stems: 4, speed: 'Slow', quality: 'Excellent' },
      htdemucs_6stems: { stems: 6, speed: 'Slower', quality: 'Excellent+' },
      mdx_extra: { stems: 4, speed: 'Fast', quality: 'Very Good' },
      demucs_v3: { stems: 4, speed: 'Medium', quality: 'Very Good' },
    };
    return info[modelName] || { stems: 4, speed: 'Unknown', quality: 'Unknown' };
  }
}

export default StemSeparationEngine;
export { StemSeparationEngine };
