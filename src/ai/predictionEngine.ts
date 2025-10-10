/**
 * Emotive Prediction Engine (EPE)
 * Looks ahead 1-4 bars to pre-trigger lighting blooms and plugin pre-arms
 */

import { telemetry } from '@/lib/telemetry';
import type { ControlEvent, AudioMetrics } from './primeBrain';

export interface PredictedEvent {
  type: 'lighting_bloom' | 'plugin_prearm' | 'scene_transition' | 'mood_shift';
  targetBar: number;
  confidence: number; // 0-1
  data: any;
}

class EmotivePredictionEngine {
  private predictions: PredictedEvent[] = [];
  private currentBar = 0;
  private bpm = 120;
  private lookaheadBars = 4;

  /**
   * Process control input to predict future events
   */
  processControlInput(event: ControlEvent) {
    // Predict based on control patterns
    const confidence = Math.random() * 0.3 + 0.5; // 0.5-0.8
    
    if (event.type === 'fader' && event.value > 0.7) {
      this.addPrediction({
        type: 'lighting_bloom',
        targetBar: this.currentBar + 2,
        confidence,
        data: { color: '#FF67C7', intensity: event.value }
      });
    }

    if (event.type === 'knob' && event.previousValue !== undefined) {
      const delta = Math.abs(event.value - event.previousValue);
      if (delta > 0.3) {
        this.addPrediction({
          type: 'mood_shift',
          targetBar: this.currentBar + 1,
          confidence: confidence + 0.1,
          data: { direction: event.value > event.previousValue ? 'up' : 'down' }
        });
      }
    }
  }

  /**
   * Process audio data to predict future events
   */
  processAudioData(metrics: AudioMetrics) {
    // Analyze audio patterns
    if (metrics.rms > 0.7) {
      this.addPrediction({
        type: 'lighting_bloom',
        targetBar: this.currentBar + 1,
        confidence: 0.75,
        data: { color: '#FF4D8D', intensity: metrics.rms }
      });
    }

    // Detect buildups
    if (metrics.peak > 0.85 && metrics.rms > 0.6) {
      this.addPrediction({
        type: 'plugin_prearm',
        targetBar: this.currentBar + 2,
        confidence: 0.8,
        data: { pluginType: 'limiter', reason: 'high_peak' }
      });
    }
  }

  /**
   * Update current playback position
   */
  updatePosition(bar: number, bpm: number) {
    const oldBar = this.currentBar;
    this.currentBar = bar;
    this.bpm = bpm;

    // Trigger predictions for current bar
    const triggeredPredictions = this.predictions.filter(p => p.targetBar === bar);
    
    if (triggeredPredictions.length > 0) {
      triggeredPredictions.forEach(pred => {
        telemetry.log({
          source: 'EPE',
          category: 'prediction',
          action: `Triggered: ${pred.type}`,
          data: { confidence: pred.confidence.toFixed(2), ...pred.data }
        });
      });

      // Remove triggered predictions
      this.predictions = this.predictions.filter(p => p.targetBar > bar);
    }

    // Clean up old predictions
    this.predictions = this.predictions.filter(p => p.targetBar <= bar + this.lookaheadBars);
  }

  /**
   * Add a prediction
   */
  private addPrediction(prediction: PredictedEvent) {
    // Avoid duplicates
    const exists = this.predictions.some(p => 
      p.type === prediction.type && 
      p.targetBar === prediction.targetBar
    );

    if (!exists) {
      this.predictions.push(prediction);
      
      telemetry.log({
        source: 'EPE',
        category: 'predict',
        action: `Predicted ${prediction.type} at bar ${prediction.targetBar}`,
        data: { confidence: prediction.confidence.toFixed(2) }
      });
    }
  }

  /**
   * Get upcoming predictions
   */
  getUpcomingEvents(bars = 4): PredictedEvent[] {
    return this.predictions
      .filter(p => p.targetBar <= this.currentBar + bars)
      .sort((a, b) => a.targetBar - b.targetBar);
  }

  /**
   * Get predictions for specific bar
   */
  getPredictionsForBar(bar: number): PredictedEvent[] {
    return this.predictions.filter(p => p.targetBar === bar);
  }
}

// Singleton instance
export const predictionEngine = new EmotivePredictionEngine();
