/**
 * Velvet Metering Processor
 * Phase 34: AudioWorklet Migration
 * 
 * AudioWorklet processor for real-time audio metering.
 * Computes peak, RMS, transient detection, and spectral analysis
 * off the main thread for smoother UI performance.
 */

class VelvetMeteringProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // State for metering calculations
    this.lastPeak = 0;
    this.smoothedLevel = 0;
    this.lastTransientPeak = 0;
    
    // FFT state (simplified for worklet - no actual FFT, just band estimation)
    this.lowBandAccumulator = 0;
    this.lowBandCount = 0;
    
    // Sample counter for periodic message sending (every ~50ms at 44.1kHz)
    this.sampleCounter = 0;
    this.samplesPerMessage = 2205; // ~50ms at 44.1kHz
    
    // Accumulator for per-block calculations
    this.blockPeak = 0;
    this.blockSumSquares = 0;
    this.blockSampleCount = 0;
  }

  /**
   * Process audio samples and compute metering data
   * Called for each audio block (~128 samples)
   */
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!input || input.length === 0) {
      return true;
    }
    
    // Process first channel (mono meter for simplicity, or mix stereo)
    const channel = input[0];
    if (!channel || channel.length === 0) {
      return true;
    }
    
    // Mix stereo if available
    const channel2 = input[1];
    const hasStereo = channel2 && channel2.length > 0;
    
    // Calculate peak and sum of squares for this block
    for (let i = 0; i < channel.length; i++) {
      // Get sample (average L/R if stereo)
      let sample = channel[i];
      if (hasStereo) {
        sample = (sample + channel2[i]) * 0.5;
      }
      
      const absolute = Math.abs(sample);
      
      // Track peak
      if (absolute > this.blockPeak) {
        this.blockPeak = absolute;
      }
      
      // Sum of squares for RMS
      this.blockSumSquares += sample * sample;
      this.blockSampleCount++;
      
      // Low band estimation (samples from beginning of buffer are lower freq)
      if (i < 16) {
        this.lowBandAccumulator += absolute;
        this.lowBandCount++;
      }
    }
    
    // Increment sample counter
    this.sampleCounter += channel.length;
    
    // Send metering data periodically
    if (this.sampleCounter >= this.samplesPerMessage) {
      this.sendMeterData();
      this.sampleCounter = 0;
    }
    
    return true;
  }
  
  /**
   * Calculate and send metering data to main thread
   */
  sendMeterData() {
    if (this.blockSampleCount === 0) {
      return;
    }
    
    // Calculate RMS
    const rms = Math.sqrt(this.blockSumSquares / this.blockSampleCount);
    const normalizedRms = Math.min(1, rms * 2.35);
    
    // Smooth the level
    this.smoothedLevel = this.smoothedLevel * 0.68 + normalizedRms * 0.32;
    
    // Normalize peak
    const normalizedPeak = Math.min(1, this.blockPeak);
    
    // Crest factor
    const crestFactor = normalizedPeak / Math.max(rms, 1e-5);
    
    // Transient detection
    const transient = 
      normalizedPeak > this.lastPeak * 1.12 && 
      normalizedPeak - this.smoothedLevel > 0.12;
    
    // Low band energy (simplified)
    const lowBandEnergy = this.lowBandCount > 0 
      ? Math.min(1, (this.lowBandAccumulator / this.lowBandCount) * 4)
      : 0;
    
    // Update state for next calculation
    this.lastPeak = normalizedPeak * 0.6 + this.lastPeak * 0.4;
    if (transient) {
      this.lastTransientPeak = normalizedPeak;
    }
    this.lastTransientPeak *= 0.92;
    
    // Send data to main thread
    this.port.postMessage({
      type: 'meter',
      rms: normalizedRms,
      level: this.smoothedLevel,
      peak: normalizedPeak,
      crestFactor,
      transient,
      lowBandEnergy,
      spectralTilt: 0, // Would need FFT for real spectral tilt
    });
    
    // Reset accumulators
    this.blockPeak = 0;
    this.blockSumSquares = 0;
    this.blockSampleCount = 0;
    this.lowBandAccumulator = 0;
    this.lowBandCount = 0;
  }
}

registerProcessor('velvet-metering-processor', VelvetMeteringProcessor);
