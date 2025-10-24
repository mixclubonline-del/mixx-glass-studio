/**
 * Mixx Club Studio - Audio Analysis Web Worker
 * Offloads FFT and spectrum analysis to background thread
 * Prevents main thread blocking during heavy computation
 */

interface AnalysisMessage {
  type: 'analyze' | 'init' | 'configure';
  data?: {
    audioBuffer?: Float32Array;
    fftSize?: number;
    sampleRate?: number;
    analysisType?: 'spectrum' | 'harmonic' | 'dynamics' | 'all';
  };
}

interface AnalysisResult {
  type: 'spectrum' | 'harmonic' | 'dynamics';
  timestamp: number;
  data: {
    spectrum?: number[];
    fundamentalFrequency?: number;
    harmonics?: Array<{ frequency: number; magnitude: number; harmonic: number }>;
    rms?: number;
    peakLevel?: number;
    crestFactor?: number;
  };
  processingTime: number;
}

class AudioAnalysisWorker {
  private fftSize: number = 4096;
  private sampleRate: number = 48000;

  constructor() {
    this.initializeWorker();
  }

  /**
   * Initialize worker message handlers
   */
  private initializeWorker(): void {
    self.onmessage = (event: MessageEvent<AnalysisMessage>) => {
      const { type, data } = event.data;

      switch (type) {
        case 'init':
          this.initialize(data?.sampleRate || 48000, data?.fftSize || 4096);
          break;
        case 'configure':
          this.configure(data);
          break;
        case 'analyze':
          this.performAnalysis(data?.audioBuffer || new Float32Array(), data?.analysisType || 'all');
          break;
      }
    };
  }

  /**
   * Initialize worker with sample rate and FFT size
   */
  private initialize(sampleRate: number, fftSize: number): void {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;

    // Verify FFT size is power of 2
    const isPowerOf2 = (n: number) => n > 0 && (n & (n - 1)) === 0;
    if (!isPowerOf2(fftSize)) {
      this.postMessage({
        type: 'error',
        error: `FFT size must be power of 2, got ${fftSize}`
      });
      return;
    }

    this.postMessage({
      type: 'initialized',
      fftSize,
      sampleRate
    });
  }

  /**
   * Configure analysis parameters
   */
  private configure(data?: { fftSize?: number; sampleRate?: number }): void {
    if (data?.fftSize) this.fftSize = data.fftSize;
    if (data?.sampleRate) this.sampleRate = data.sampleRate;

    this.postMessage({
      type: 'configured',
      config: { fftSize: this.fftSize, sampleRate: this.sampleRate }
    });
  }

  /**
   * Perform spectrum analysis on audio buffer
   */
  private performAnalysis(audioBuffer: Float32Array, analysisType: string): void {
    const startTime = performance.now();
    const results: AnalysisResult[] = [];

    try {
      if (analysisType === 'spectrum' || analysisType === 'all') {
        results.push(this.analyzeSpectrum(audioBuffer));
      }

      if (analysisType === 'harmonic' || analysisType === 'all') {
        results.push(this.analyzeHarmonics(audioBuffer));
      }

      if (analysisType === 'dynamics' || analysisType === 'all') {
        results.push(this.analyzeDynamics(audioBuffer));
      }

      const processingTime = performance.now() - startTime;

      // Send all results back
      for (const result of results) {
        this.postMessage({
          type: 'result',
          result: {
            ...result,
            processingTime
          }
        });
      }

      this.postMessage({
        type: 'analysisComplete',
        totalTime: processingTime,
        resultCount: results.length
      });
    } catch (error) {
      this.postMessage({
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  /**
   * Perform FFT-based spectrum analysis
   */
  private analyzeSpectrum(audioBuffer: Float32Array): AnalysisResult {
    const fftSize = this.fftSize;
    const spectrum = this.performFFT(audioBuffer, fftSize);

    return {
      type: 'spectrum',
      timestamp: Date.now(),
      data: {
        spectrum
      },
      processingTime: 0
    };
  }

  /**
   * Perform FFT computation
   */
  private performFFT(audioBuffer: Float32Array, size: number): number[] {
    // Simple FFT implementation using Cooley-Tukey algorithm
    const N = size;
    const real = new Float32Array(N);
    const imag = new Float32Array(N);

    // Copy audio data (windowed)
    const window = this.hannWindow(Math.min(audioBuffer.length, N));
    for (let i = 0; i < Math.min(audioBuffer.length, N); i++) {
      real[i] = audioBuffer[i] * window[i];
    }

    // Bit-reversal
    for (let i = 0; i < N; i++) {
      let j = 0;
      let k = i;
      for (let n = 0; n < Math.log2(N); n++) {
        j = (j << 1) | (k & 1);
        k >>= 1;
      }
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }

    // FFT computation
    for (let stage = 1; stage <= Math.log2(N); stage++) {
      const M = 1 << stage;
      const Mh = M >> 1;

      for (let k = 0; k < N; k += M) {
        for (let j = 0; j < Mh; j++) {
          const angle = (-2 * Math.PI * j) / M;
          const wr = Math.cos(angle);
          const wi = Math.sin(angle);

          const idx1 = k + j;
          const idx2 = k + j + Mh;

          const tr = wr * real[idx2] - wi * imag[idx2];
          const ti = wr * imag[idx2] + wi * real[idx2];

          real[idx2] = real[idx1] - tr;
          imag[idx2] = imag[idx1] - ti;
          real[idx1] = real[idx1] + tr;
          imag[idx1] = imag[idx1] + ti;
        }
      }
    }

    // Calculate magnitude spectrum
    const spectrum = new Array(N / 2);
    for (let i = 0; i < N / 2; i++) {
      const mag = Math.sqrt(real[i] * real[i] + imag[i] * imag[i]);
      spectrum[i] = mag / (N / 2); // Normalize
    }

    return spectrum;
  }

  /**
   * Hann window function
   */
  private hannWindow(size: number): Float32Array {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
    }
    return window;
  }

  /**
   * Analyze harmonic content
   */
  private analyzeHarmonics(audioBuffer: Float32Array): AnalysisResult {
    const fundamentalFreq = this.estimateFundamental(audioBuffer);

    return {
      type: 'harmonic',
      timestamp: Date.now(),
      data: {
        fundamentalFrequency: fundamentalFreq,
        harmonics: []
      },
      processingTime: 0
    };
  }

  /**
   * Calculate RMS level
   */
  private calculateRMS(buffer: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    return Math.sqrt(sum / buffer.length);
  }

  /**
   * Estimate fundamental frequency using autocorrelation
   */
  private estimateFundamental(buffer: Float32Array): number {
    const minFreq = 50; // Hz
    const maxFreq = 2000; // Hz
    const minLag = Math.floor(this.sampleRate / maxFreq);
    const maxLag = Math.floor(this.sampleRate / minFreq);

    let bestLag = minLag;
    let bestCorr = -1;

    for (let lag = minLag; lag < maxLag; lag++) {
      let corr = 0;
      for (let i = 0; i < buffer.length - lag; i++) {
        corr += buffer[i] * buffer[i + lag];
      }

      if (corr > bestCorr) {
        bestCorr = corr;
        bestLag = lag;
      }
    }

    return this.sampleRate / bestLag;
  }

  /**
   * Analyze dynamic properties
   */
  private analyzeDynamics(audioBuffer: Float32Array): AnalysisResult {
    const rms = this.calculateRMS(audioBuffer);
    let peakLevel = 0;
    for (let i = 0; i < audioBuffer.length; i++) {
      peakLevel = Math.max(peakLevel, Math.abs(audioBuffer[i]));
    }

    const crestFactor = peakLevel / rms;

    return {
      type: 'dynamics',
      timestamp: Date.now(),
      data: {
        rms: 20 * Math.log10(rms + 1e-9),
        peakLevel: 20 * Math.log10(peakLevel + 1e-9),
        crestFactor
      },
      processingTime: 0
    };
  }

  /**
   * Post message back to main thread
   */
  private postMessage(message: any): void {
    self.postMessage(message);
  }
}

// Initialize worker
new AudioAnalysisWorker();
