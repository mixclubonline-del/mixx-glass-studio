/**
 * MixxTune AI Service
 * Handles AI-powered features for MixxTune
 */

import { supabase } from '@/integrations/supabase/client';

export interface AudioFeatures {
  pitchVariance: 'Low' | 'Medium' | 'High';
  hasVibrato: boolean;
  breathiness: 'Low' | 'Medium' | 'High';
}

export interface AISettings {
  speed: number;
  strength: number;
  tolerance: number;
  style: 'future' | 'drake' | 'natural' | 't-pain';
  explanation: string;
}

export interface MusicalContextAI {
  key: string;
  chord: string;
  scale: string;
  nextChord?: string;
  tension: number;
  aiInsight: string;
}

export class MixxTuneAIService {
  /**
   * Get AI-powered setting recommendations
   */
  static async getSuggestedSettings(
    audioFeatures: AudioFeatures,
    vocalStyle?: string,
    genre?: string
  ): Promise<AISettings> {
    try {
      const { data, error } = await supabase.functions.invoke('suggest-mixxtune-settings', {
        body: {
          audioFeatures,
          vocalStyle,
          genre
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      throw new Error('Failed to get AI recommendations');
    }
  }

  /**
   * Analyze musical context using AI
   */
  static async analyzeMusicalContext(
    chroma: Float32Array,
    bpm: number,
    timeSignature: { numerator: number; denominator: number }
  ): Promise<MusicalContextAI> {
    try {
      const { data, error } = await supabase.functions.invoke('analyze-music-context', {
        body: {
          chroma: Array.from(chroma),
          bpm,
          timeSignature
        }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error analyzing musical context:', error);
      throw new Error('Failed to analyze musical context');
    }
  }

  /**
   * Analyze audio features from pitch data
   */
  static analyzeAudioFeatures(pitchHistory: number[]): AudioFeatures {
    if (pitchHistory.length === 0) {
      return {
        pitchVariance: 'Medium',
        hasVibrato: false,
        breathiness: 'Medium'
      };
    }

    // Calculate variance
    const mean = pitchHistory.reduce((a, b) => a + b, 0) / pitchHistory.length;
    const variance = pitchHistory.reduce((sum, f) => sum + Math.pow(f - mean, 2), 0) / pitchHistory.length;
    const stdDev = Math.sqrt(variance);

    // Detect vibrato (oscillating pitch)
    const hasVibrato = stdDev > 2 && stdDev < 15;

    // Classify variance
    let pitchVariance: 'Low' | 'Medium' | 'High';
    if (stdDev < 5) pitchVariance = 'Low';
    else if (stdDev < 15) pitchVariance = 'Medium';
    else pitchVariance = 'High';

    // Breathiness estimation (simplified)
    const breathiness = pitchVariance === 'High' ? 'High' : 'Medium';

    return {
      pitchVariance,
      hasVibrato,
      breathiness
    };
  }
}
