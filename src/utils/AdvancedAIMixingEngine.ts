/**
 * Mixx Club Studio - Advanced AI Mixing Engine
 * Intelligent automatic mixing with frequency-based recommendations
 * Hip-hop production specialized with cultural context adaptation
 */

import type { FrequencyAnalysis } from './RealTimeAudioAnalyzer';

export interface EQBand {
  frequency: number;
  gain: number; // dB (-12 to +12)
  Q: number;   // 0.5 to 4.0
  type: 'peak' | 'shelf' | 'highpass' | 'lowpass';
}

export interface CompressionSettings {
  threshold: number;  // dB (-40 to 0)
  ratio: number;      // 1:1 to ∞:1
  attack: number;     // ms (0.5 to 100)
  release: number;    // ms (10 to 1000)
  makeup: number;     // dB (0 to +24)
  softKnee: boolean;
}

export interface GainStagingRecommendation {
  trackName: string;
  currentLevel: number;
  recommendedGain: number; // dB
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number; // 0-1
}

export interface EQRecommendation {
  trackName: string;
  issue: string;
  bands: EQBand[];
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  beforeAfterDb: number; // Expected change in dB
}

export interface CompressionRecommendation {
  trackName: string;
  issue: string;
  settings: CompressionSettings;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface MixingMasterplan {
  timestamp: number;
  globalLUFS: number;
  headroom: number; // dB above -0.3dB true peak
  balanceScore: number; // 0-1
  energyDistribution: {
    subBass: number;
    bass: number;
    midrange: number;
    presence: number;
    brilliance: number;
  };
  recommendations: {
    gainStagingRecommendations: GainStagingRecommendation[];
    eqRecommendations: EQRecommendation[];
    compressionRecommendations: CompressionRecommendation[];
    overallMixHealth: 'excellent' | 'good' | 'fair' | 'poor';
  };
}

export interface TrackAnalysis {
  name: string;
  level: number;
  peak: number;
  lufs: number;
  frequency: FrequencyAnalysis;
  dynamics: {
    rms: number;
    crestFactor: number;
    transientDensity: number;
  };
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * AdvancedAIMixingEngine
 * 
 * Professional-grade mixing AI with:
 * - Spectral balancing across frequency ranges
 * - Automatic gain staging with headroom management
 * - Intelligent EQ recommendations
 * - Dynamic compression suggestions
 * - Hip-hop genre specialization
 * - Cultural context adaptation
 */
class AdvancedAIMixingEngine {
  private genreProfile: Map<string, number> = new Map();
  private culturalContext: 'artist' | 'engineer' | 'producer' = 'producer';

  constructor(culturalContext?: 'artist' | 'engineer' | 'producer') {
    if (culturalContext) {
      this.culturalContext = culturalContext;
    }
    this.initializeHipHopProfile();
  }

  /**
   * Initialize Hip-Hop specific frequency targets
   * Hip-hop emphasizes bass, sub-bass, and clear midrange for lyrics
   */
  private initializeHipHopProfile(): void {
    this.genreProfile.set('subBass', 0.15);    // 20-60Hz: Strong kick foundation
    this.genreProfile.set('bass', 0.20);       // 60-250Hz: Punchy bass
    this.genreProfile.set('lowMids', 0.12);    // 250-500Hz: Bass definition
    this.genreProfile.set('mids', 0.18);       // 500-2kHz: Vocal clarity
    this.genreProfile.set('highMids', 0.15);   // 2-4kHz: Presence
    this.genreProfile.set('presence', 0.12);   // 4-6kHz: Detail
    this.genreProfile.set('brilliance', 0.08); // 6-20kHz: Air/Shine
  }

  /**
   * Analyze mix health across all tracks
   */
  analyzeMix(tracks: TrackAnalysis[]): MixingMasterplan {
    const timestamp = Date.now();
    
    // Calculate global metrics
    const globalLUFS = this.calculateIntegratedLUFS(tracks);
    const headroom = this.calculateHeadroom(tracks);
    const balanceScore = this.calculateBalanceScore(tracks);
    const energyDistribution = this.analyzeEnergyDistribution(tracks);

    // Generate recommendations
    const gainStagingRecommendations = this.generateGainStagingRecommendations(tracks, globalLUFS);
    const eqRecommendations = this.generateEQRecommendations(tracks, energyDistribution);
    const compressionRecommendations = this.generateCompressionRecommendations(tracks);

    // Determine overall mix health
    const overallMixHealth = this.assessMixHealth(
      globalLUFS,
      headroom,
      balanceScore,
      tracks
    );

    return {
      timestamp,
      globalLUFS,
      headroom,
      balanceScore,
      energyDistribution,
      recommendations: {
        gainStagingRecommendations,
        eqRecommendations,
        compressionRecommendations,
        overallMixHealth
      }
    };
  }

  /**
   * Generate automatic gain staging recommendations
   * Hip-hop: Each element at appropriate relative level
   */
  private generateGainStagingRecommendations(
    tracks: TrackAnalysis[],
    globalLUFS: number
  ): GainStagingRecommendation[] {
    const recommendations: GainStagingRecommendation[] = [];
    const targetHeadroom = 1.0; // -1dB from 0dB FS true peak

    for (const track of tracks) {
      const recommendation = this.analyzeTrackLevel(track, globalLUFS, targetHeadroom);
      if (recommendation) {
        recommendations.push(recommendation);
      }
    }

    // Sort by priority
    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Analyze individual track levels and gain needs
   */
  private analyzeTrackLevel(
    track: TrackAnalysis,
    _globalLUFS: number,
    _targetHeadroom: number
  ): GainStagingRecommendation | null {
    const trackDb = 20 * Math.log10(track.level + 1e-10);
    let recommendedGain = 0;
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let reasoning = '';
    let confidence = 0;

    // Hip-hop kick drum should dominate
    if (track.name.toLowerCase().includes('kick') || track.name.toLowerCase().includes('drum')) {
      const kickTarget = -6; // Kick at -6dB LUFS
      recommendedGain = kickTarget - trackDb;
      if (Math.abs(recommendedGain) > 2) {
        priority = 'high';
        confidence = 0.9;
        reasoning = 'Kick drum needs adjustment for hip-hop presence';
      }
    }
    // Vocals should be clear and present
    else if (track.name.toLowerCase().includes('vocal') || track.name.toLowerCase().includes('rap')) {
      const vocalTarget = -8; // Vocals at -8dB LUFS
      recommendedGain = vocalTarget - trackDb;
      if (Math.abs(recommendedGain) > 2) {
        priority = 'high';
        confidence = 0.85;
        reasoning = 'Vocal level needs adjustment for clarity and presence';
      }
    }
    // Bass
    else if (track.name.toLowerCase().includes('bass')) {
      const bassTarget = -10; // Bass at -10dB LUFS
      recommendedGain = bassTarget - trackDb;
      if (Math.abs(recommendedGain) > 1.5) {
        priority = 'medium';
        confidence = 0.8;
        reasoning = 'Bass level needs fine-tuning';
      }
    }
    // General tracks
    else {
      // Check if level is too hot
      if (track.peak > 0.95) {
        recommendedGain = -3;
        priority = 'critical';
        confidence = 1.0;
        reasoning = 'Track is too close to clipping - reduce immediately';
      } else if (track.peak > 0.9) {
        recommendedGain = -2;
        priority = 'high';
        confidence = 0.95;
        reasoning = 'Track has insufficient headroom';
      } else if (track.level < 0.3) {
        recommendedGain = 3;
        priority = 'medium';
        confidence = 0.7;
        reasoning = 'Track is too quiet - bring up for mix balance';
      }
    }

    if (Math.abs(recommendedGain) < 0.5) {
      return null; // No significant adjustment needed
    }

    return {
      trackName: track.name,
      currentLevel: track.level,
      recommendedGain,
      reasoning,
      priority,
      confidence
    };
  }

  /**
   * Generate intelligent EQ recommendations
   * Hip-hop: Clear midrange for lyrics, powerful bass, bright highs
   */
  private generateEQRecommendations(
    tracks: TrackAnalysis[],
    _energyDistribution: MixingMasterplan['energyDistribution']
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];

    for (const track of tracks) {
      const eqRecs = this.analyzeTrackFrequency(track);
      recommendations.push(...eqRecs);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * Analyze track frequency content and suggest EQ
   */
  private analyzeTrackFrequency(
    track: TrackAnalysis,
    _energyDistribution?: MixingMasterplan['energyDistribution']
  ): EQRecommendation[] {
    const recommendations: EQRecommendation[] = [];
    const freq = track.frequency;

    // Check for muddy low-end (200-400Hz buildup)
    if (freq.energyByBand.lowMids > 0.25) {
      recommendations.push({
        trackName: track.name,
        issue: 'Muddy low-midrange buildup',
        bands: [
          {
            frequency: 300,
            gain: -2,
            Q: 1.2,
            type: 'peak'
          }
        ],
        reasoning: 'Low-midrange excessive - reduce for clarity',
        priority: 'medium',
        confidence: 0.8,
        beforeAfterDb: -2
      });
    }

    // Check for harsh mids (2-4kHz)
    if (freq.energyByBand.highMids > 0.22) {
      recommendations.push({
        trackName: track.name,
        issue: 'Harsh mid-range presence',
        bands: [
          {
            frequency: 3000,
            gain: -1.5,
            Q: 1.5,
            type: 'peak'
          }
        ],
        reasoning: 'Mid-range too aggressive - smooth for easier listening',
        priority: 'low',
        confidence: 0.7,
        beforeAfterDb: -1.5
      });
    }

    // Hip-hop: Ensure bass presence
    if (track.name.toLowerCase().includes('kick') && freq.energyByBand.bass < 0.18) {
      recommendations.push({
        trackName: track.name,
        issue: 'Weak bass - needs low-end punch',
        bands: [
          {
            frequency: 80,
            gain: 2,
            Q: 0.8,
            type: 'shelf'
          }
        ],
        reasoning: 'Hip-hop kick needs powerful low-end - boost bass region',
        priority: 'high',
        confidence: 0.9,
        beforeAfterDb: 2
      });
    }

    // Vocal clarity boost (hip-hop)
    if ((track.name.toLowerCase().includes('vocal') || track.name.toLowerCase().includes('rap')) &&
        freq.energyByBand.presence < 0.12) {
      recommendations.push({
        trackName: track.name,
        issue: 'Lacking presence for vocal clarity',
        bands: [
          {
            frequency: 4000,
            gain: 1.5,
            Q: 1.0,
            type: 'peak'
          }
        ],
        reasoning: 'Hip-hop vocals need presence peak for intelligibility',
        priority: 'medium',
        confidence: 0.85,
        beforeAfterDb: 1.5
      });
    }

    return recommendations;
  }

  /**
   * Generate automatic compression recommendations
   */
  private generateCompressionRecommendations(
    tracks: TrackAnalysis[]
  ): CompressionRecommendation[] {
    const recommendations: CompressionRecommendation[] = [];

    for (const track of tracks) {
      // Drums/Kick need compression for cohesion
      if (track.name.toLowerCase().includes('kick') || track.name.toLowerCase().includes('drum')) {
        if (track.dynamics.crestFactor > 6) {
          recommendations.push({
            trackName: track.name,
            issue: 'High dynamic range - dynamic control needed',
            settings: {
              threshold: -15,
              ratio: 4,
              attack: 3,
              release: 100,
              makeup: 8,
              softKnee: true
            },
            reasoning: 'Hip-hop drums need gentle compression for control and punch',
            priority: 'high',
            confidence: 0.9
          });
        }
      }
      // Vocals need compression for consistency
      else if (track.name.toLowerCase().includes('vocal') || track.name.toLowerCase().includes('rap')) {
        if (track.dynamics.crestFactor > 8) {
          recommendations.push({
            trackName: track.name,
            issue: 'Vocal dynamics too wide',
            settings: {
              threshold: -18,
              ratio: 3,
              attack: 5,
              release: 150,
              makeup: 6,
              softKnee: true
            },
            reasoning: 'Vocals need smooth compression for consistent presence',
            priority: 'high',
            confidence: 0.85
          });
        }
      }
      // Bass
      else if (track.name.toLowerCase().includes('bass')) {
        recommendations.push({
          trackName: track.name,
          issue: 'Bass level control',
          settings: {
            threshold: -12,
            ratio: 2,
            attack: 8,
            release: 200,
            makeup: 4,
            softKnee: false
          },
          reasoning: 'Light compression for bass consistency',
          priority: 'medium',
          confidence: 0.8
        });
      }
    }

    return recommendations;
  }

  /**
   * Calculate integrated LUFS across all tracks
   */
  private calculateIntegratedLUFS(tracks: TrackAnalysis[]): number {
    if (tracks.length === 0) return -100;
    
    let totalLoudness = 0;
    for (const track of tracks) {
      totalLoudness += track.lufs;
    }
    return totalLoudness / tracks.length;
  }

  /**
   * Calculate headroom above true peak
   */
  private calculateHeadroom(tracks: TrackAnalysis[]): number {
    let maxPeak = 0;
    for (const track of tracks) {
      maxPeak = Math.max(maxPeak, track.peak);
    }
    return -0.3 - (20 * Math.log10(maxPeak + 1e-10)); // -0.3 dB is broadcast standard
  }

  /**
   * Score overall mix balance (0-1)
   */
  private calculateBalanceScore(tracks: TrackAnalysis[]): number {
    if (tracks.length === 0) return 0;

    // Check if all tracks are at reasonable levels
    const levels = tracks.map(t => t.level);
    const avgLevel = levels.reduce((a, b) => a + b, 0) / levels.length;
    
    // Calculate deviation from average
    const variance = levels.reduce((sum, level) => {
      return sum + Math.pow(level - avgLevel, 2);
    }, 0) / levels.length;
    
    const stdDev = Math.sqrt(variance);
    
    // Score: Lower stdDev = better balance (1.0 for stdDev < 0.1, decreasing)
    const balanceScore = Math.max(0, 1 - (stdDev * 5));
    return Math.min(1, balanceScore);
  }

  /**
   * Analyze energy distribution across frequency spectrum
   */
  private analyzeEnergyDistribution(tracks: TrackAnalysis[]): MixingMasterplan['energyDistribution'] {
    const distribution = {
      subBass: 0,
      bass: 0,
      midrange: 0,
      presence: 0,
      brilliance: 0
    };

    if (tracks.length === 0) return distribution;

    for (const track of tracks) {
      distribution.subBass += track.frequency.energyByBand.subBass;
      distribution.bass += track.frequency.energyByBand.bass;
      distribution.midrange += (track.frequency.energyByBand.lowMids + track.frequency.energyByBand.mids) / 2;
      distribution.presence += track.frequency.energyByBand.presence;
      distribution.brilliance += track.frequency.energyByBand.brilliance;
    }

    // Normalize
    const total = distribution.subBass + distribution.bass + distribution.midrange + 
                  distribution.presence + distribution.brilliance;
    if (total > 0) {
      Object.keys(distribution).forEach(key => {
        (distribution as any)[key] /= total;
      });
    }

    return distribution;
  }

  /**
   * Assess overall mix health
   */
  private assessMixHealth(
    globalLUFS: number,
    headroom: number,
    balanceScore: number,
    tracks: TrackAnalysis[]
  ): 'excellent' | 'good' | 'fair' | 'poor' {
    let score = 100;

    // LUFS assessment (hip-hop target: -14 to -10 LUFS)
    const lufsOptimal = globalLUFS > -15 && globalLUFS < -9;
    if (!lufsOptimal) score -= 20;

    // Headroom (minimum 1dB recommended)
    if (headroom < 1) score -= 25;
    else if (headroom < 2) score -= 10;

    // Balance score
    if (balanceScore < 0.5) score -= 15;
    else if (balanceScore < 0.7) score -= 8;

    // Track quality assessment
    const poorQualityTracks = tracks.filter(t => t.quality === 'poor').length;
    score -= poorQualityTracks * 10;

    // Overall assessment
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  }

  /**
   * Set cultural context for mixing style
   */
  setCulturalContext(context: 'artist' | 'engineer' | 'producer'): void {
    this.culturalContext = context;
  }

  /**
   * Get cultural context-specific recommendations
   */
  getContextAwareRecommendation(recommendation: EQRecommendation | CompressionRecommendation): string {
    let contextMsg = '';
    
    if (this.culturalContext === 'artist') {
      contextMsg = 'From a performer perspective: ';
    } else if (this.culturalContext === 'engineer') {
      contextMsg = 'From a technical perspective: ';
    } else {
      contextMsg = 'From a production perspective: ';
    }

    return contextMsg + ('reasoning' in recommendation ? recommendation.reasoning : 'Adjustment recommended');
  }
}

export default AdvancedAIMixingEngine;