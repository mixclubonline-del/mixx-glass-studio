/**
 * QNN Flow Service
 * 
 * Connects Quantum Neural Network to Flow orchestration layer.
 * Enables AI intelligence to flow through the entire Studio ecosystem.
 * 
 * Responsibilities:
 * - Register QNN with Flow
 * - Listen to audio/parameter signals
 * - Run QNN analysis
 * - Broadcast QNN intelligence
 * - Route to Prime Brain via Flow
 * - Learn from user actions
 */

import { getQuantumNeuralNetwork, type QuantumIntelSnapshot } from './QuantumNeuralNetwork';
import { registerFlowComponent, flowComponentRegistry, type FlowSignalListener } from '../core/flow/FlowComponentRegistry';
import { publishFlowSignal } from '../state/flowSignals';

export interface QNNAnalysisRequest {
  type: 'audio' | 'genre' | 'pattern' | 'mixer';
  data: number[];
  context?: {
    trackId?: string;
    clipId?: string;
    timestamp?: number;
  };
}

export interface QNNIntelligence {
  source: 'qnn';
  timestamp: number;
  analysis: QuantumIntelSnapshot;
  recommendations?: {
    genre?: string;
    anchors?: QuantumIntelSnapshot['anchors'];
    pattern?: string;
    mixerOptimization?: Float32Array;
  };
  confidence: number;
}

class QNNFlowService {
  private isRegistered = false;
  private qnn = getQuantumNeuralNetwork();
  private listeners: FlowSignalListener[] = [];
  private analysisQueue: QNNAnalysisRequest[] = [];
  private isProcessing = false;

  /**
   * Initialize QNN and register with Flow
   */
  async initialize(): Promise<void> {
    if (this.isRegistered) return;

    // Initialize QNN
    await this.qnn.initialize();

    // Register with Flow
    const unregister = registerFlowComponent({
      id: 'qnn-service',
      type: 'ai',
      name: 'Quantum Neural Network',
      version: '1.0.0',
      broadcasts: [
        'qnn_analysis',
        'qnn_genre',
        'qnn_pattern',
        'qnn_anchors',
        'qnn_mixer_recommendation',
        'qnn_intelligence',
      ],
      listens: [
        {
          signal: 'audio_analysis_request',
          callback: (payload: QNNAnalysisRequest) => {
            this.handleAnalysisRequest(payload);
          },
        },
        {
          signal: 'parameter_change',
          callback: (payload: { plugin: string; parameter: string; value: number }) => {
            this.handleParameterChange(payload);
          },
        },
        {
          signal: 'clip_selected',
          callback: (payload: { clipId: string; trackId: string }) => {
            this.handleClipSelection(payload);
          },
        },
        {
          signal: 'track_selected',
          callback: (payload: { trackId: string }) => {
            this.handleTrackSelection(payload);
          },
        },
      ],
    });

    this.isRegistered = true;
    console.log('🧠 QNN Flow Service: Registered with Flow');

    // Start processing queue
    this.processQueue();
  }

  /**
   * Handle analysis requests from Flow
   */
  private async handleAnalysisRequest(request: QNNAnalysisRequest): Promise<void> {
    this.analysisQueue.push(request);
  }

  /**
   * Process analysis queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.analysisQueue.length === 0) {
      setTimeout(() => this.processQueue(), 100);
      return;
    }

    this.isProcessing = true;
    const request = this.analysisQueue.shift();
    if (!request) {
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 100);
      return;
    }

    try {
      let intelligence: QNNIntelligence | null = null;

      switch (request.type) {
        case 'audio':
          intelligence = await this.analyzeAudio(request);
          break;
        case 'genre':
          intelligence = await this.analyzeGenre(request);
          break;
        case 'pattern':
          intelligence = await this.analyzePattern(request);
          break;
        case 'mixer':
          intelligence = await this.analyzeMixer(request);
          break;
      }

      if (intelligence) {
        // Broadcast QNN intelligence through Flow
        this.broadcastIntelligence(intelligence);
      }
    } catch (error) {
      console.error('[QNN Flow] Analysis error:', error);
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.processQueue(), 50);
    }
  }

  /**
   * Analyze audio and extract anchors
   */
  private async analyzeAudio(request: QNNAnalysisRequest): Promise<QNNIntelligence> {
    const anchors = await this.qnn.analyzeAudio(request.data);
    
    return {
      source: 'qnn',
      timestamp: Date.now(),
      analysis: { anchors },
      recommendations: { anchors },
      confidence: 0.8,
    };
  }

  /**
   * Classify genre
   */
  private async analyzeGenre(request: QNNAnalysisRequest): Promise<QNNIntelligence> {
    const genre = await this.qnn.classifyGenre(request.data);
    
    return {
      source: 'qnn',
      timestamp: Date.now(),
      analysis: { genre },
      recommendations: { genre: genre.genre },
      confidence: genre.confidence,
    };
  }

  /**
   * Recognize pattern
   */
  private async analyzePattern(request: QNNAnalysisRequest): Promise<QNNIntelligence> {
    const pattern = await this.qnn.recognizePattern(request.data);
    
    return {
      source: 'qnn',
      timestamp: Date.now(),
      analysis: { pattern },
      recommendations: { pattern: pattern.pattern },
      confidence: pattern.strength,
    };
  }

  /**
   * Optimize mixer settings
   */
  private async analyzeMixer(request: QNNAnalysisRequest): Promise<QNNIntelligence> {
    const optimization = await this.qnn.optimizeMixer(request.data);
    
    return {
      source: 'qnn',
      timestamp: Date.now(),
      analysis: { mixerRecommendation: optimization },
      recommendations: { mixerOptimization: optimization },
      confidence: 0.7,
    };
  }

  /**
   * Broadcast QNN intelligence through Flow
   */
  private broadcastIntelligence(intelligence: QNNIntelligence): void {
    // Broadcast through Flow Component Registry
    flowComponentRegistry.broadcast('qnn-service', 'qnn_intelligence', intelligence);

    // Broadcast specific analysis types
    if (intelligence.analysis.anchors) {
      flowComponentRegistry.broadcast('qnn-service', 'qnn_anchors', {
        anchors: intelligence.analysis.anchors,
        timestamp: intelligence.timestamp,
      });
    }

    if (intelligence.analysis.genre) {
      flowComponentRegistry.broadcast('qnn-service', 'qnn_genre', {
        genre: intelligence.analysis.genre.genre,
        confidence: intelligence.analysis.genre.confidence,
        timestamp: intelligence.timestamp,
      });
    }

    if (intelligence.analysis.pattern) {
      flowComponentRegistry.broadcast('qnn-service', 'qnn_pattern', {
        pattern: intelligence.analysis.pattern.pattern,
        strength: intelligence.analysis.pattern.strength,
        characteristics: intelligence.analysis.pattern.characteristics,
        timestamp: intelligence.timestamp,
      });
    }

    if (intelligence.analysis.mixerRecommendation) {
      flowComponentRegistry.broadcast('qnn-service', 'qnn_mixer_recommendation', {
        optimization: Array.from(intelligence.analysis.mixerRecommendation),
        timestamp: intelligence.timestamp,
      });
    }

    // Also publish to Flow signals for ALS/Prime Brain
    publishFlowSignal({
      channel: 'als',
      timestamp: Date.now(),
      payload: {
        source: 'qnn',
        meta: {
          qnn_intelligence: intelligence,
          signal: 'qnn_intelligence',
        },
      },
    });

    // Route to Prime Brain via Neural Bridge
    this.routeToPrimeBrain(intelligence);
  }

  /**
   * Route QNN intelligence to Prime Brain
   */
  private routeToPrimeBrain(intelligence: QNNIntelligence): void {
    // Broadcast through Flow Neural Bridge
    if (typeof window !== 'undefined' && (window as any).__flowNeuralBridge) {
      (window as any).__flowNeuralBridge.forwardToPrimeBrain({
        source: 'qnn',
        signal: 'qnn_intelligence',
        payload: intelligence,
      });
    }

    // Also broadcast as Prime Brain guidance signal
    broadcastFlowSignal('qnn-service', 'prime_brain_guidance', {
      source: 'qnn',
      intelligence,
      guidance: this.generateGuidance(intelligence),
    });
  }

  /**
   * Generate guidance from QNN intelligence
   */
  private generateGuidance(intelligence: QNNIntelligence): {
    suggestions: string[];
    adjustments?: Record<string, number>;
  } {
    const suggestions: string[] = [];
    const adjustments: Record<string, number> = {};

    if (intelligence.analysis.anchors) {
      const { body, soul, air, silk } = intelligence.analysis.anchors;
      
      if (body < 30) {
        suggestions.push('Consider boosting low-end presence');
        adjustments.body = body;
      }
      if (soul < 30) {
        suggestions.push('Harmonic richness could be enhanced');
        adjustments.soul = soul;
      }
      if (air > 70) {
        suggestions.push('High-frequency content is prominent');
        adjustments.air = air;
      }
      if (silk > 70) {
        suggestions.push('Smooth, polished character detected');
        adjustments.silk = silk;
      }
    }

    if (intelligence.analysis.pattern) {
      const { pattern, strength } = intelligence.analysis.pattern;
      if (strength > 0.7) {
        suggestions.push(`Strong ${pattern} pattern detected`);
      }
    }

    if (intelligence.analysis.genre) {
      const { genre, confidence } = intelligence.analysis.genre;
      if (confidence > 0.8) {
        suggestions.push(`Genre identified: ${genre}`);
      }
    }

    return { suggestions, adjustments };
  }

  /**
   * Handle parameter changes for learning
   */
  private async handleParameterChange(payload: {
    plugin: string;
    parameter: string;
    value: number;
  }): Promise<void> {
    // QNN can learn from user adjustments
    // Store for batch learning later
    // For now, just log
    console.log('[QNN Flow] Parameter change observed:', payload);
  }

  /**
   * Handle clip selection
   */
  private handleClipSelection(payload: { clipId: string; trackId: string }): void {
    // Could trigger audio analysis of selected clip
    console.log('[QNN Flow] Clip selected:', payload);
  }

  /**
   * Handle track selection
   */
  private handleTrackSelection(payload: { trackId: string }): void {
    // Could trigger mixer analysis
    console.log('[QNN Flow] Track selected:', payload);
  }

  /**
   * Request audio analysis
   */
  async requestAudioAnalysis(fftData: number[], context?: QNNAnalysisRequest['context']): Promise<void> {
    this.handleAnalysisRequest({
      type: 'audio',
      data: fftData,
      context,
    });
  }

  /**
   * Request genre classification
   */
  async requestGenreClassification(features: number[], context?: QNNAnalysisRequest['context']): Promise<void> {
    this.handleAnalysisRequest({
      type: 'genre',
      data: features,
      context,
    });
  }

  /**
   * Request pattern recognition
   */
  async requestPatternRecognition(temporalFeatures: number[], context?: QNNAnalysisRequest['context']): Promise<void> {
    this.handleAnalysisRequest({
      type: 'pattern',
      data: temporalFeatures,
      context,
    });
  }

  /**
   * Request mixer optimization
   */
  async requestMixerOptimization(currentSettings: number[], context?: QNNAnalysisRequest['context']): Promise<void> {
    this.handleAnalysisRequest({
      type: 'mixer',
      data: currentSettings,
      context,
    });
  }

  /**
   * Dispose
   */
  dispose(): void {
    this.listeners.forEach(listener => {
      // Unregister listeners if needed
    });
    this.listeners = [];
    this.isRegistered = false;
  }
}

// Singleton instance
let globalQNNFlowService: QNNFlowService | null = null;

export function getQNNFlowService(): QNNFlowService {
  if (!globalQNNFlowService) {
    globalQNNFlowService = new QNNFlowService();
  }
  return globalQNNFlowService;
}

/**
 * Initialize QNN Flow Service
 * Call this early in app initialization
 */
export async function initializeQNNFlow(): Promise<void> {
  const service = getQNNFlowService();
  await service.initialize();
}

