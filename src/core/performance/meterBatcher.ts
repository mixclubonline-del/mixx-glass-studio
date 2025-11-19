/**
 * QUANTUM METER BATCHER - Centralized Meter Reading Service
 * 
 * Batches all analyser reads into a single RAF loop for quantum-level performance.
 * Reduces overhead from multiple concurrent requestAnimationFrame loops.
 * 
 * Flow Doctrine: Single source of truth for meter updates
 * Reductionist Engineering: One RAF loop instead of N loops
 * 
 * @author Prime (Mixx Club)
 */

import { fastLinearToDb, fastRMS, fastPeak } from './mathCache';

interface MeterSubscription {
  id: string;
  analyser: AnalyserNode;
  callback: (reading: MeterReading) => void;
  enableTruePeak?: boolean;
  oversampleFactor?: number;
}

interface MeterReading {
  peak: number;
  rms: number;
  crest: number;
  heat: number;
  truePeak?: number;
}

class MeterBatcher {
  private subscriptions = new Map<string, MeterSubscription>();
  private analyserToSubscriptions = new WeakMap<AnalyserNode, Set<string>>(); // Track which subscriptions use which analyser
  private frameId: number | null = null;
  private isRunning = false;
  private bufferCache = new WeakMap<AnalyserNode, { timeDomain: Float32Array; frequency: Uint8Array }>();
  private lastFrameTime = 0;
  private targetFPS = 60;
  private minFrameInterval = 1000 / 60; // 16.67ms for 60fps
  private adaptiveFrameInterval = this.minFrameInterval;

  /**
   * Subscribe to meter updates for an analyser node.
   * Returns unsubscribe function.
   * Prevents duplicate subscriptions to the same analyser.
   */
  subscribe(
    id: string,
    analyser: AnalyserNode,
    callback: (reading: MeterReading) => void,
    options?: { enableTruePeak?: boolean; oversampleFactor?: number }
  ): () => void {
    // Check if this analyser already has subscriptions
    let analyserSubs = this.analyserToSubscriptions.get(analyser);
    if (!analyserSubs) {
      analyserSubs = new Set();
      this.analyserToSubscriptions.set(analyser, analyserSubs);
    }

    // Prevent duplicate subscriptions to the same analyser with the same ID
    if (this.subscriptions.has(id)) {
      console.warn(`[METER BATCHER] Duplicate subscription ID: ${id}, unsubscribing previous`);
      this.subscriptions.delete(id);
      analyserSubs.delete(id);
    }

    this.subscriptions.set(id, {
      id,
      analyser,
      callback,
      enableTruePeak: options?.enableTruePeak ?? false,
      oversampleFactor: options?.oversampleFactor ?? 4,
    });

    analyserSubs.add(id);

    this.start();

    return () => {
      this.subscriptions.delete(id);
      analyserSubs?.delete(id);
      if (analyserSubs && analyserSubs.size === 0) {
        this.analyserToSubscriptions.delete(analyser);
      }
      if (this.subscriptions.size === 0) {
        this.stop();
      }
    };
  }

  private start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.tick();
  }

  private stop() {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    this.isRunning = false;
  }

  private tick = () => {
    if (this.subscriptions.size === 0) {
      this.stop();
      return;
    }

    const now = performance.now();
    const elapsed = now - this.lastFrameTime;

    // Adaptive frame rate: reduce FPS when we have many analysers to prevent overload
    const subscriptionCount = this.subscriptions.size;
    if (subscriptionCount > 30) {
      // More than 30 analysers: reduce to 30fps
      this.adaptiveFrameInterval = 1000 / 30;
    } else if (subscriptionCount > 15) {
      // 15-30 analysers: reduce to 45fps
      this.adaptiveFrameInterval = 1000 / 45;
    } else {
      // Less than 15: full 60fps
      this.adaptiveFrameInterval = this.minFrameInterval;
    }

    // Skip frame if not enough time has passed (throttling)
    if (elapsed < this.adaptiveFrameInterval) {
      this.frameId = requestAnimationFrame(this.tick);
      return;
    }

    this.lastFrameTime = now;

    // Batch all analyser reads in a single frame
    // Use Array.from to avoid iteration issues if subscriptions change during iteration
    const subs = Array.from(this.subscriptions.values());
    
    for (const sub of subs) {
      // Skip if subscription was removed during iteration
      if (!this.subscriptions.has(sub.id)) {
        continue;
      }

      try {
        const reading = this.computeReading(sub);
        sub.callback(reading);
        // Record for performance monitoring
        if (typeof window !== 'undefined' && (window as any).__mixxPerformanceMonitor) {
          (window as any).__mixxPerformanceMonitor.recordMeterReading();
        }
      } catch (err) {
        console.warn(`[METER BATCHER] Error reading ${sub.id}:`, err);
        // Remove failed subscription to prevent repeated errors
        this.subscriptions.delete(sub.id);
      }
    }

    // Only continue if we still have subscriptions
    if (this.subscriptions.size > 0) {
      this.frameId = requestAnimationFrame(this.tick);
    } else {
      this.stop();
    }
  };

  private computeReading(sub: MeterSubscription): MeterReading {
    const analyser = sub.analyser;
    const bufferLength = analyser.frequencyBinCount;

    // Reuse buffers when possible (performance optimization)
    let buffers = this.bufferCache.get(analyser);
    if (!buffers || buffers.timeDomain.length !== bufferLength) {
      buffers = {
        timeDomain: new Float32Array(bufferLength),
        frequency: new Uint8Array(bufferLength),
      };
      this.bufferCache.set(analyser, buffers);
    }

    // Read time domain data
    analyser.getFloatTimeDomainData(buffers.timeDomain);
    const data = buffers.timeDomain;

    // Compute peak and RMS using optimized functions
    const peak = fastPeak(data);
    const rms = fastRMS(data);
    const peakDb = peak > 0 ? fastLinearToDb(Math.max(0.0001, peak)) : -Infinity;
    const rmsDb = rms > 0 ? fastLinearToDb(Math.max(0.0001, rms)) : -Infinity;
    const crest = peakDb !== -Infinity && rmsDb !== -Infinity ? peakDb - rmsDb : 0;
    const heat = rmsDb <= -60 ? 0 : rmsDb >= 0 ? 1 : (rmsDb + 60) / 60;

    const reading: MeterReading = {
      peak: peakDb,
      rms: rmsDb,
      crest,
      heat,
    };

    // Compute true peak if requested (expensive, so optional)
    if (sub.enableTruePeak) {
      reading.truePeak = this.computeTruePeak(data, sub.oversampleFactor ?? 4);
    }

    return reading;
  }

  private computeTruePeak(samples: Float32Array, oversampleFactor: number): number {
    if (samples.length === 0) return -Infinity;

    // Optimized oversampling with pre-allocated buffer
    const oversampledLength = samples.length * oversampleFactor;
    let maxPeak = 0;

    // Inline oversampling for performance
    for (let i = 0; i < samples.length - 1; i++) {
      const a = samples[i];
      const b = samples[i + 1];
      const step = (b - a) / oversampleFactor;

      for (let j = 0; j < oversampleFactor; j++) {
        const interpolated = a + step * j;
        const abs = Math.abs(interpolated);
        if (abs > maxPeak) maxPeak = abs;
      }
    }

    // Handle last sample
    const lastAbs = Math.abs(samples[samples.length - 1]);
    if (lastAbs > maxPeak) maxPeak = lastAbs;

    return maxPeak > 0 ? 20 * Math.log10(Math.max(0.0001, maxPeak)) : -Infinity;
  }

  /**
   * Get current subscription count (for debugging)
   */
  getSubscriptionCount(): number {
    return this.subscriptions.size;
  }
}

// Singleton instance
export const meterBatcher = new MeterBatcher();

