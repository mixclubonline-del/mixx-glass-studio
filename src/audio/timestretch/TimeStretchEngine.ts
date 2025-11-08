/**
 * Time Stretch Engine - Real-time time stretching and pitch shifting
 */

export type StretchAlgorithm = 'psola' | 'phase_vocoder' | 'rubber_band';

export interface StretchOptions {
  algorithm: StretchAlgorithm;
  preserveFormants: boolean;
  quality: 'fast' | 'balanced' | 'best';
}

export class TimeStretchEngine {
  private audioContext: AudioContext;

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
  }

  /**
   * Time stretch audio buffer using PSOLA (Pitch Synchronous Overlap-Add)
   * Best for speech and monophonic signals
   */
  async psolaTimeStretch(
    buffer: AudioBuffer,
    stretchFactor: number, // 0.5 = half speed, 2.0 = double speed
    pitchShift: number = 0 // semitones
  ): Promise<AudioBuffer> {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const originalLength = buffer.length;
    const newLength = Math.floor(originalLength * stretchFactor);

    const stretched = this.audioContext.createBuffer(numChannels, newLength, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const input = buffer.getChannelData(channel);
      const output = stretched.getChannelData(channel);

      // Pitch shift ratio
      const pitchRatio = Math.pow(2, pitchShift / 12);

      // Find pitch periods (simplified autocorrelation)
      const periods = this.detectPitchPeriods(input, sampleRate);
      
      // PSOLA synthesis
      let outputPos = 0;
      let inputPos = 0;
      
      while (outputPos < newLength && inputPos < originalLength) {
        const period = periods[Math.floor(inputPos)] || 512;
        const grainSize = Math.floor(period * 2);
        const hop = Math.floor(period / stretchFactor);

        // Extract and window grain
        const grain = new Float32Array(grainSize);
        for (let i = 0; i < grainSize && inputPos + i < originalLength; i++) {
          // Hann window
          const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / grainSize));
          grain[i] = input[inputPos + i] * window;
        }

        // Apply pitch shift by resampling grain
        const resampledGrain = this.resampleGrain(grain, pitchRatio);

        // Overlap-add to output
        for (let i = 0; i < resampledGrain.length && outputPos + i < newLength; i++) {
          output[outputPos + i] += resampledGrain[i];
        }

        inputPos += hop;
        outputPos += Math.floor(hop / pitchRatio);
      }

      // Normalize
      const max = Math.max(...Array.from(output).map(Math.abs));
      if (max > 0) {
        for (let i = 0; i < output.length; i++) {
          output[i] /= max;
        }
      }
    }

    return stretched;
  }

  /**
   * Phase Vocoder time stretch - Best for polyphonic and complex audio
   */
  async phaseVocoderTimeStretch(
    buffer: AudioBuffer,
    stretchFactor: number,
    pitchShift: number = 0
  ): Promise<AudioBuffer> {
    const fftSize = 2048;
    const hopSize = fftSize / 4;
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const originalLength = buffer.length;
    const newLength = Math.floor(originalLength * stretchFactor);

    const stretched = this.audioContext.createBuffer(numChannels, newLength, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const input = buffer.getChannelData(channel);
      const output = stretched.getChannelData(channel);

      // Phase vocoder processing
      const frames = Math.floor((originalLength - fftSize) / hopSize);
      const outputHopSize = Math.floor(hopSize * stretchFactor);
      
      let prevPhase = new Float32Array(fftSize / 2 + 1);
      let outputPhase = new Float32Array(fftSize / 2 + 1);

      for (let frame = 0; frame < frames; frame++) {
        const inputPos = frame * hopSize;
        const outputPos = frame * outputHopSize;

        if (outputPos + fftSize > newLength) break;

        // Extract windowed frame
        const frameData = new Float32Array(fftSize);
        for (let i = 0; i < fftSize && inputPos + i < originalLength; i++) {
          // Hann window
          const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / fftSize));
          frameData[i] = input[inputPos + i] * window;
        }

        // FFT (simplified - in production use a proper FFT library)
        const spectrum = this.simpleFFT(frameData);

        // Phase adjustment
        for (let bin = 0; bin < spectrum.length / 2; bin++) {
          const mag = spectrum[bin * 2];
          const phase = spectrum[bin * 2 + 1];

          // Phase unwrapping and accumulation
          const phaseDelta = phase - prevPhase[bin];
          prevPhase[bin] = phase;

          outputPhase[bin] += phaseDelta * stretchFactor;
          
          // Apply pitch shift
          const targetBin = Math.round(bin * Math.pow(2, pitchShift / 12));
          if (targetBin < spectrum.length / 2) {
            spectrum[targetBin * 2] = mag;
            spectrum[targetBin * 2 + 1] = outputPhase[bin];
          }
        }

        // IFFT and overlap-add
        const synthFrame = this.simpleIFFT(spectrum);
        for (let i = 0; i < fftSize && outputPos + i < newLength; i++) {
          output[outputPos + i] += synthFrame[i];
        }
      }

      // Normalize
      const max = Math.max(...Array.from(output).map(Math.abs));
      if (max > 0) {
        for (let i = 0; i < output.length; i++) {
          output[i] /= max * 0.5; // Scale down to avoid clipping
        }
      }
    }

    return stretched;
  }

  /**
   * Detect pitch periods using simplified autocorrelation
   */
  private detectPitchPeriods(signal: Float32Array, sampleRate: number): Float32Array {
    const periods = new Float32Array(signal.length);
    const minPeriod = Math.floor(sampleRate / 800); // ~800 Hz max
    const maxPeriod = Math.floor(sampleRate / 60);  // ~60 Hz min
    const windowSize = maxPeriod * 4;

    for (let i = 0; i < signal.length; i += 512) {
      const start = Math.max(0, i - windowSize / 2);
      const end = Math.min(signal.length, i + windowSize / 2);
      
      let bestPeriod = 256;
      let bestCorr = 0;

      // Autocorrelation
      for (let lag = minPeriod; lag < maxPeriod; lag++) {
        let corr = 0;
        let count = 0;
        
        for (let j = start; j < end - lag; j++) {
          corr += signal[j] * signal[j + lag];
          count++;
        }
        
        corr /= count;
        
        if (corr > bestCorr) {
          bestCorr = corr;
          bestPeriod = lag;
        }
      }

      // Fill period array
      for (let j = i; j < i + 512 && j < signal.length; j++) {
        periods[j] = bestPeriod;
      }
    }

    return periods;
  }

  /**
   * Resample grain for pitch shifting
   */
  private resampleGrain(grain: Float32Array, ratio: number): Float32Array {
    const newLength = Math.floor(grain.length / ratio);
    const resampled = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const srcPos = i * ratio;
      const srcIndex = Math.floor(srcPos);
      const frac = srcPos - srcIndex;

      if (srcIndex + 1 < grain.length) {
        // Linear interpolation
        resampled[i] = grain[srcIndex] * (1 - frac) + grain[srcIndex + 1] * frac;
      } else if (srcIndex < grain.length) {
        resampled[i] = grain[srcIndex];
      }
    }

    return resampled;
  }

  /**
   * Simplified FFT (real production should use a proper FFT library like fft.js)
   */
  private simpleFFT(input: Float32Array): Float32Array {
    const N = input.length;
    const output = new Float32Array(N * 2); // [mag, phase, mag, phase, ...]

    for (let k = 0; k < N; k++) {
      let real = 0;
      let imag = 0;

      for (let n = 0; n < N; n++) {
        const angle = (-2 * Math.PI * k * n) / N;
        real += input[n] * Math.cos(angle);
        imag += input[n] * Math.sin(angle);
      }

      output[k * 2] = Math.sqrt(real * real + imag * imag); // magnitude
      output[k * 2 + 1] = Math.atan2(imag, real); // phase
    }

    return output;
  }

  /**
   * Simplified IFFT
   */
  private simpleIFFT(spectrum: Float32Array): Float32Array {
    const N = spectrum.length / 2;
    const output = new Float32Array(N);

    for (let n = 0; n < N; n++) {
      let sum = 0;

      for (let k = 0; k < N; k++) {
        const mag = spectrum[k * 2];
        const phase = spectrum[k * 2 + 1];
        const angle = (2 * Math.PI * k * n) / N;
        sum += mag * Math.cos(angle + phase);
      }

      output[n] = sum / N;
    }

    return output;
  }

  /**
   * Quick pitch shift without time stretching
   */
  async pitchShiftOnly(buffer: AudioBuffer, semitones: number): Promise<AudioBuffer> {
    const ratio = Math.pow(2, semitones / 12);
    const newLength = Math.floor(buffer.length / ratio);
    const shifted = this.audioContext.createBuffer(
      buffer.numberOfChannels,
      newLength,
      buffer.sampleRate
    );

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const input = buffer.getChannelData(channel);
      const output = shifted.getChannelData(channel);

      for (let i = 0; i < newLength; i++) {
        const srcPos = i * ratio;
        const srcIndex = Math.floor(srcPos);
        const frac = srcPos - srcIndex;

        if (srcIndex + 1 < input.length) {
          output[i] = input[srcIndex] * (1 - frac) + input[srcIndex + 1] * frac;
        } else if (srcIndex < input.length) {
          output[i] = input[srcIndex];
        }
      }
    }

    return shifted;
  }
}
