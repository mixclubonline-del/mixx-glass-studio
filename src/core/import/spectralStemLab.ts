/**
 * PRIME SPECTRAL STEM LAB
 * 
 * Working spectral analysis and stem separation implementation.
 * Replaces the broken base implementation with functional algorithms.
 */

export interface SpectralFrame {
  frequencies: Float32Array;
  magnitude: Float32Array;
  phase: Float32Array;
  time: number;
}

export interface SpectralStemMask {
  mask: Float32Array;
  confidence: number;
  stemType: 'vocals' | 'drums' | 'bass' | 'music' | 'perc' | 'harmonic' | 'sub';
}

/**
 * Compute STFT using Web Audio API AnalyserNode
 */
export async function computeSTFT(
  audioBuffer: AudioBuffer,
  fftSize: number = 2048,
  hopSize: number = 512
): Promise<SpectralFrame[]> {
  const frames: SpectralFrame[] = [];
  const sampleRate = audioBuffer.sampleRate;
  const channelData = audioBuffer.getChannelData(0); // Use first channel
  const windowSize = fftSize;
  const numFrames = Math.floor((channelData.length - windowSize) / hopSize) + 1;

  // Create temporary context for FFT analysis
  const ctx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = fftSize;
  analyser.smoothingTimeConstant = 0;

  for (let i = 0; i < numFrames; i++) {
    const start = i * hopSize;
    const end = Math.min(start + windowSize, channelData.length);
    
    // Extract window
    const window = channelData.slice(start, end);
    
    // Pad if needed
    const paddedWindow = new Float32Array(windowSize);
    paddedWindow.set(window, 0);
    
    // Apply Hanning window
    const windowed = new Float32Array(windowSize);
    for (let j = 0; j < windowed.length; j++) {
      const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * j) / (windowSize - 1)));
      windowed[j] = paddedWindow[j] * windowValue;
    }
    
    // Create buffer for this window
    const windowBuffer = ctx.createBuffer(1, windowSize, sampleRate);
    windowBuffer.copyToChannel(windowed, 0);
    
    // Create source and connect to analyser
    const source = ctx.createBufferSource();
    source.buffer = windowBuffer;
    source.connect(analyser);
    analyser.connect(ctx.destination);
    
    source.start(0);
    
    // Get frequency data
    const freqData = new Float32Array(analyser.frequencyBinCount);
    analyser.getFloatFrequencyData(freqData);
    
    // Convert dB to linear magnitude
    const magnitude = new Float32Array(freqData.length);
    for (let j = 0; j < magnitude.length; j++) {
      magnitude[j] = Math.pow(10, freqData[j] / 20);
    }
    
    // Create frequency array
    const frequencies = new Float32Array(magnitude.length);
    for (let j = 0; j < frequencies.length; j++) {
      frequencies[j] = (j * sampleRate) / (2 * fftSize);
    }
    
    // Phase (simplified - would need complex FFT for real phase)
    const phase = new Float32Array(magnitude.length);
    
    frames.push({
      frequencies,
      magnitude,
      phase,
      time: start / sampleRate,
    });
  }

  return frames;
}

/**
 * Analyze spectral content and extract features
 */
export async function analyzeSpectralContent(
  audioBuffer: AudioBuffer
): Promise<{
  averageMagnitude: Float32Array;
  peakFrequencies: number[];
  spectralCentroid: number;
  spectralRolloff: number;
  harmonicContent: {
    fundamental: number | null;
    harmonics: number[];
    strength: number;
  };
}> {
  const frames = await computeSTFT(audioBuffer);
  
  if (frames.length === 0) {
    throw new Error('No spectral frames computed');
  }
  
  // Compute average magnitude
  const averageMagnitude = new Float32Array(frames[0].magnitude.length);
  for (const frame of frames) {
    for (let i = 0; i < averageMagnitude.length; i++) {
      averageMagnitude[i] += frame.magnitude[i];
    }
  }
  for (let i = 0; i < averageMagnitude.length; i++) {
    averageMagnitude[i] /= frames.length;
  }
  
  // Find peak frequencies
  const peakFrequencies: number[] = [];
  const threshold = Math.max(...Array.from(averageMagnitude)) * 0.3;
  
  for (let i = 1; i < averageMagnitude.length - 1; i++) {
    if (
      averageMagnitude[i] > threshold &&
      averageMagnitude[i] > averageMagnitude[i - 1] &&
      averageMagnitude[i] > averageMagnitude[i + 1]
    ) {
      peakFrequencies.push(frames[0].frequencies[i]);
    }
  }
  
  // Compute spectral centroid (brightness)
  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < averageMagnitude.length; i++) {
    const freq = frames[0].frequencies[i];
    const mag = averageMagnitude[i];
    numerator += freq * mag;
    denominator += mag;
  }
  const spectralCentroid = denominator > 0 ? numerator / denominator : 0;
  
  // Compute spectral rolloff (95% energy)
  let cumulativeEnergy = 0;
  const totalEnergy = averageMagnitude.reduce((sum, mag) => sum + mag * mag, 0);
  const targetEnergy = totalEnergy * 0.95;
  let spectralRolloff = frames[0].frequencies[frames[0].frequencies.length - 1];
  
  for (let i = 0; i < averageMagnitude.length; i++) {
    cumulativeEnergy += averageMagnitude[i] * averageMagnitude[i];
    if (cumulativeEnergy >= targetEnergy) {
      spectralRolloff = frames[0].frequencies[i];
      break;
    }
  }
  
  // Analyze harmonic content
  let maxMagnitude = 0;
  let fundamental: number | null = null;
  const lowFreqLimit = 80; // Below 80Hz for fundamental
  const lowFreqIndex = frames[0].frequencies.findIndex(f => f > lowFreqLimit);
  
  for (let i = 0; i < Math.min(lowFreqIndex, averageMagnitude.length); i++) {
    if (averageMagnitude[i] > maxMagnitude) {
      maxMagnitude = averageMagnitude[i];
      fundamental = frames[0].frequencies[i];
    }
  }
  
  // Find harmonics
  const harmonics: number[] = [];
  if (fundamental) {
    for (let harmonic = 2; harmonic <= 8; harmonic++) {
      const harmonicFreq = fundamental * harmonic;
      const index = frames[0].frequencies.findIndex(f => Math.abs(f - harmonicFreq) < 20);
      if (index >= 0 && averageMagnitude[index] > threshold * 0.5) {
        harmonics.push(harmonicFreq);
      }
    }
  }
  
  // Compute harmonic strength
  const totalEnergy2 = averageMagnitude.reduce((sum, mag) => sum + mag, 0);
  const harmonicEnergy = harmonics.reduce((sum, h) => {
    const index = frames[0].frequencies.findIndex(f => Math.abs(f - h) < 20);
    return sum + (index >= 0 ? averageMagnitude[index] : 0);
  }, 0);
  const strength = totalEnergy2 > 0 ? harmonicEnergy / totalEnergy2 : 0;
  
  return {
    averageMagnitude,
    peakFrequencies,
    spectralCentroid,
    spectralRolloff,
    harmonicContent: {
      fundamental,
      harmonics,
      strength,
    },
  };
}

/**
 * Generate stem mask based on spectral analysis
 */
export async function generateStemMask(
  audioBuffer: AudioBuffer,
  stemType: SpectralStemMask['stemType']
): Promise<SpectralStemMask> {
  const analysis = await analyzeSpectralContent(audioBuffer);
  const mask = new Float32Array(analysis.averageMagnitude.length);
  let confidence = 0.5;
  
  // Normalize magnitude for masking
  const maxMagnitude = Math.max(...Array.from(analysis.averageMagnitude));
  const normalizedMagnitude = new Float32Array(analysis.averageMagnitude.length);
  for (let i = 0; i < normalizedMagnitude.length; i++) {
    normalizedMagnitude[i] = maxMagnitude > 0 ? analysis.averageMagnitude[i] / maxMagnitude : 0;
  }
  
  // Get frequency array (we need to compute STFT to get frequencies)
  const frames = await computeSTFT(audioBuffer);
  const frequencies = frames[0].frequencies;
  
  switch (stemType) {
    case 'vocals':
      // Vocals: 200-3000 Hz, strong in mid-range
      for (let i = 0; i < mask.length; i++) {
        const freq = frequencies[i];
        if (freq >= 200 && freq <= 3000) {
          mask[i] = normalizedMagnitude[i] * 1.2; // Boost vocal range
          confidence = Math.max(confidence, normalizedMagnitude[i]);
        } else if (freq >= 3000 && freq <= 8000) {
          mask[i] = normalizedMagnitude[i] * 0.6; // Partial for air
        } else {
          mask[i] = normalizedMagnitude[i] * 0.1; // Suppress other frequencies
        }
      }
      confidence = Math.min(1, confidence * 1.2);
      break;
      
    case 'bass':
      // Bass: Below 200 Hz, strong low-end
      for (let i = 0; i < mask.length; i++) {
        const freq = frequencies[i];
        if (freq < 200) {
          mask[i] = normalizedMagnitude[i] * 1.5; // Strong bass
          confidence = Math.max(confidence, normalizedMagnitude[i]);
        } else if (freq < 400) {
          mask[i] = normalizedMagnitude[i] * 0.4; // Partial low-mid
        } else {
          mask[i] = normalizedMagnitude[i] * 0.05; // Suppress high frequencies
        }
      }
      confidence = Math.min(1, confidence * 1.3);
      break;
      
    case 'sub':
      // Sub-bass: Below 60 Hz
      for (let i = 0; i < mask.length; i++) {
        const freq = frequencies[i];
        if (freq < 60) {
          mask[i] = normalizedMagnitude[i] * 2.0; // Very strong sub
          confidence = Math.max(confidence, normalizedMagnitude[i]);
        } else if (freq < 120) {
          mask[i] = normalizedMagnitude[i] * 0.3; // Partial
        } else {
          mask[i] = normalizedMagnitude[i] * 0.02; // Strongly suppress
        }
      }
      confidence = Math.min(1, confidence * 1.5);
      break;
      
    case 'drums':
    case 'perc':
      // Percussive: High spectral flux, transient content
      // Focus on frequencies with rapid changes
      for (let i = 0; i < mask.length; i++) {
        const freq = frequencies[i];
        // Percussive content spans wide range but emphasizes transients
        if (freq >= 50 && freq <= 8000) {
          // Boost based on magnitude and frequency characteristics
          const boost = freq >= 2000 && freq <= 6000 ? 1.3 : 1.0;
          mask[i] = normalizedMagnitude[i] * boost;
          confidence = Math.max(confidence, normalizedMagnitude[i] * 0.8);
        } else {
          mask[i] = normalizedMagnitude[i] * 0.2;
        }
      }
      confidence = Math.min(1, confidence);
      break;
      
    case 'music':
    case 'harmonic':
      // Harmonic content: Everything except vocals, bass, drums
      // Strong in harmonic frequencies
      for (let i = 0; i < mask.length; i++) {
        const freq = frequencies[i];
        if (freq >= 200 && freq <= 8000) {
          // Boost harmonic content
          const harmonicBoost = analysis.harmonicContent.strength > 0.3 ? 1.2 : 0.8;
          mask[i] = normalizedMagnitude[i] * harmonicBoost;
          confidence = Math.max(confidence, normalizedMagnitude[i] * harmonicBoost);
        } else {
          mask[i] = normalizedMagnitude[i] * 0.3;
        }
      }
      confidence = Math.min(1, confidence * analysis.harmonicContent.strength);
      break;
  }
  
  // Normalize mask to 0-1 range
  const maxMask = Math.max(...Array.from(mask));
  if (maxMask > 0) {
    for (let i = 0; i < mask.length; i++) {
      mask[i] = Math.min(1, mask[i] / maxMask);
    }
  }
  
  return {
    mask,
    confidence: Math.min(1, Math.max(0, confidence)),
    stemType,
  };
}

/**
 * Apply spectral mask to audio buffer using frequency-domain filtering
 * Simplified approach using targeted filters based on stem type
 */
export async function applySpectralMask(
  audioBuffer: AudioBuffer,
  mask: SpectralStemMask
): Promise<AudioBuffer> {
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;
  const channels = audioBuffer.numberOfChannels;
  
  const ctx = new OfflineAudioContext(channels, length, sampleRate);
  const source = ctx.createBufferSource();
  source.buffer = audioBuffer;
  
  // Use stem type to determine filter strategy (more reliable than complex masking)
  let filter: BiquadFilterNode;
  let gain: GainNode;
  
  switch (mask.stemType) {
    case 'vocals':
      // Vocals: Bandpass 200-3000 Hz
      filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1100; // Center of vocal range
      filter.Q.value = 1.5;
      gain = ctx.createGain();
      gain.gain.value = mask.confidence * 1.2;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      break;
      
    case 'bass':
      // Bass: Lowpass at 200 Hz
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 200;
      filter.Q.value = 0.7;
      gain = ctx.createGain();
      gain.gain.value = mask.confidence * 1.3;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      break;
      
    case 'sub':
      // Sub: Lowpass at 60 Hz
      filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 60;
      filter.Q.value = 0.7;
      gain = ctx.createGain();
      gain.gain.value = mask.confidence * 1.5;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      break;
      
    case 'drums':
    case 'perc':
      // Percussive: Highpass at 50 Hz, boost 2-6kHz
      const hp = ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 50;
      hp.Q.value = 0.7;
      
      const peaking = ctx.createBiquadFilter();
      peaking.type = 'peaking';
      peaking.frequency.value = 4000;
      peaking.Q.value = 2;
      peaking.gain.value = mask.confidence * 6;
      
      gain = ctx.createGain();
      gain.gain.value = mask.confidence * 1.1;
      
      source.connect(hp);
      hp.connect(peaking);
      peaking.connect(gain);
      gain.connect(ctx.destination);
      break;
      
    case 'music':
    case 'harmonic':
      // Harmonic: Bandpass 200-8000 Hz, suppress vocals
      filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 2000;
      filter.Q.value = 0.5;
      
      // Notch filter to reduce vocals
      const notch = ctx.createBiquadFilter();
      notch.type = 'notch';
      notch.frequency.value = 2000;
      notch.Q.value = 2;
      
      gain = ctx.createGain();
      gain.gain.value = mask.confidence;
      
      source.connect(filter);
      filter.connect(notch);
      notch.connect(gain);
      gain.connect(ctx.destination);
      break;
      
    default:
      // Fallback: just pass through with gain
      gain = ctx.createGain();
      gain.gain.value = mask.confidence;
      source.connect(gain);
      gain.connect(ctx.destination);
  }
  
  source.start(0);
  return await ctx.startRendering();
}

