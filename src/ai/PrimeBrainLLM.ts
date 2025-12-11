/**
 * PrimeBrainLLM - Abstraction layer for LLM operations
 * 
 * Provides a unified interface for AI/LLM operations, abstracting away
 * the specific implementation (currently Gemini, future: proprietary model).
 * 
 * This enables:
 * - Easy migration to proprietary LLM in the future
 * - Audio-specific prompt engineering
 * - Context-aware routing
 * - Mixx Recall integration
 */

import { GoogleGenAI } from "@google/genai";
import { getGeminiAI } from "../utils/gemini";

export interface AudioContext {
  bpm?: number;
  key?: string;
  chord?: string;
  scale?: string;
  lufs?: number;
  dynamicRange?: number;
  spectralBalance?: { low: number; mid: number; high: number };
}

export interface AnalysisTask {
  type: 'music-context' | 'mix-analysis' | 'preset-suggestion' | 'auto-tune-settings';
  context?: AudioContext;
  additionalData?: Record<string, any>;
}

export interface AnalysisResult {
  content: string;
  structured?: Record<string, any>;
  model: string;
}

export interface LiveSessionConfig {
  voiceName?: string;
  sampleRate?: number;
}

export interface LiveSession {
  sendRealtimeInput: (data: { media: { data: string; mimeType: string } }) => void;
  onRealtimeOutput: (callback: (data: any) => void) => void;
  close: () => void;
}

/**
 * PrimeBrainLLM - Unified LLM interface
 * 
 * Currently implements Gemini API, but abstracted for future proprietary model.
 */
export class PrimeBrainLLM {
  private geminiClient: GoogleGenAI;

  constructor() {
    this.geminiClient = getGeminiAI();
  }

  /**
   * Generate text from a prompt (streaming support)
   */
  async *generateTextStream(
    prompt: string,
    context?: AudioContext,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      model?: string;
      thinkingConfig?: { thinkingBudget?: number };
    }
  ): AsyncGenerator<string, void, unknown> {
    const messages: any[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // Add audio context to prompt if provided
    let enhancedPrompt = prompt;
    if (context) {
      enhancedPrompt = this.enhancePromptWithContext(prompt, context);
    }

    messages.push({
      role: 'user',
      content: enhancedPrompt,
    });

    const config: any = {
      model: options?.model ?? 'gemini-2.5-flash',
      contents: messages.map(m => ({ text: m.content })),
      config: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens,
        ...(options?.thinkingConfig && { thinkingConfig: options.thinkingConfig }),
      },
    };

    const responseStream = await this.geminiClient.models.generateContentStream(config);

    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        yield textChunk;
      }
    }
  }

  /**
   * Generate text from a prompt (non-streaming)
   */
  async generateText(
    prompt: string,
    context?: AudioContext,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
    }
  ): Promise<string> {
    const messages: any[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
    }

    // Add audio context to prompt if provided
    let enhancedPrompt = prompt;
    if (context) {
      enhancedPrompt = this.enhancePromptWithContext(prompt, context);
    }

    messages.push({
      role: 'user',
      content: enhancedPrompt,
    });

    const response = await this.geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: messages.map(m => ({ text: m.content })) },
      config: {
        temperature: options?.temperature ?? 0.7,
        maxOutputTokens: options?.maxTokens,
      },
    });

    return response.text ?? '';
  }

  /**
   * Analyze audio context (key, chord, scale, etc.)
   */
  async analyzeAudio(
    audioBuffer: AudioBuffer,
    task: AnalysisTask
  ): Promise<AnalysisResult> {
    // For now, this is a placeholder that uses text-based analysis
    // Future: could include audio data directly
    const prompt = this.buildAudioAnalysisPrompt(task);
    
    const content = await this.generateText(prompt, task.context, {
      temperature: 0.3,
      maxTokens: 300,
      systemPrompt: this.getSystemPromptForTask(task.type),
    });

    return {
      content,
      model: 'gemini-2.5-flash',
    };
  }

  /**
   * Analyze image with text prompt
   */
  async analyzeImage(
    imageData: string, // base64 encoded image
    prompt: string,
    mimeType: string = 'image/jpeg'
  ): Promise<string> {
    const imagePart = {
      inlineData: {
        mimeType,
        data: imageData,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await this.geminiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [imagePart, textPart] },
    });

    return response.text ?? '';
  }

  /**
   * Create a live session for real-time audio transcription
   */
  async createLiveSession(config?: LiveSessionConfig): Promise<LiveSession> {
    const session = await this.geminiClient.preview.liveSessions.create({
      model: 'gemini-2.5-flash',
      config: {
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: config?.voiceName ?? 'Aoede',
            },
          },
        },
      },
    });

    return {
      sendRealtimeInput: (data) => {
        if (session.sendRealtimeInput) {
          session.sendRealtimeInput(data);
        }
      },
      onRealtimeOutput: (callback) => {
        if (session.onRealtimeOutput) {
          session.onRealtimeOutput(callback);
        }
      },
      close: () => {
        if (session.close) {
          session.close();
        }
      },
    };
  }

  /**
   * Enhance prompt with audio context
   */
  private enhancePromptWithContext(prompt: string, context: AudioContext): string {
    let enhanced = prompt;

    if (context.bpm) {
      enhanced += `\n\nContext: BPM ${context.bpm}`;
    }
    if (context.key) {
      enhanced += `, Key: ${context.key}`;
    }
    if (context.chord) {
      enhanced += `, Current Chord: ${context.chord}`;
    }
    if (context.scale) {
      enhanced += `, Scale: ${context.scale}`;
    }
    if (context.lufs !== undefined) {
      enhanced += `\nMix Level: ${context.lufs.toFixed(1)} LUFS`;
    }
    if (context.dynamicRange !== undefined) {
      enhanced += `, Dynamic Range: ${context.dynamicRange.toFixed(1)} dB`;
    }

    return enhanced;
  }

  /**
   * Build prompt for audio analysis tasks
   */
  private buildAudioAnalysisPrompt(task: AnalysisTask): string {
    switch (task.type) {
      case 'music-context':
        return this.buildMusicContextPrompt(task);
      case 'mix-analysis':
        return this.buildMixAnalysisPrompt(task);
      case 'preset-suggestion':
        return this.buildPresetSuggestionPrompt(task);
      case 'auto-tune-settings':
        return this.buildAutoTunePrompt(task);
      default:
        return '';
    }
  }

  private buildMusicContextPrompt(task: AnalysisTask): string {
    const { context, additionalData } = task;
    const chroma = additionalData?.chroma || [];
    const bpm = context?.bpm || additionalData?.bpm;
    const timeSignature = additionalData?.timeSignature;

    const chromaStr = chroma.map((v: number, i: number) => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return `${notes[i]}: ${v.toFixed(2)}`;
    }).join(', ');

    return `Analyze this musical context and provide structured output:

Chromagram (pitch class energy): ${chromaStr}
BPM: ${bpm}
Time Signature: ${timeSignature?.numerator || 4}/${timeSignature?.denominator || 4}

Based on this audio analysis, determine:
1. The most likely key (e.g., "C", "Gm", "F#")
2. The current chord being played
3. The scale type (major, minor, pentatonic, blues, harmonic-minor, melodic-minor)
4. Predict the next likely chord based on common progressions
5. Harmonic tension level (0.0 to 1.0)

Respond with musical theory knowledge to identify the key and chords accurately.`;
  }

  private buildMixAnalysisPrompt(task: AnalysisTask): string {
    const { context, additionalData } = task;
    const spectralBalance = context?.spectralBalance || additionalData?.spectralBalance;

    return `You are a world-class mixing engineer analyzing a mix. Here are the technical measurements:

LOUDNESS & DYNAMICS:
- Integrated LUFS: ${context?.lufs?.toFixed(1) || 'N/A'} LUFS
- Dynamic Range: ${context?.dynamicRange?.toFixed(1) || 'N/A'} dB

FREQUENCY BALANCE:
- Low (20-250Hz): ${spectralBalance ? (spectralBalance.low * 100).toFixed(0) : 'N/A'}%
- Mid (250-5kHz): ${spectralBalance ? (spectralBalance.mid * 100).toFixed(0) : 'N/A'}%
- High (5k-20kHz): ${spectralBalance ? (spectralBalance.high * 100).toFixed(0) : 'N/A'}%

Analyze this mix professionally and provide actionable suggestions.`;
  }

  private buildPresetSuggestionPrompt(task: AnalysisTask): string {
    const { additionalData } = task;
    const { genre, source, pluginType } = additionalData || {};

    return `You are a world-class mixing engineer specializing in ${genre || 'modern'} music.

Generate optimal ${pluginType || 'plugin'} settings for: ${source || 'audio'}
Provide professional settings considering genre-specific characteristics and modern production standards.

Return JSON with parameter values (0-1 normalized) and brief explanation.`;
  }

  private buildAutoTunePrompt(task: AnalysisTask): string {
    const { additionalData } = task;
    const { vocalStyle, genre, audioFeatures } = additionalData || {};

    return `You are an expert audio engineer specializing in modern hip-hop, trap, and R&B vocal production.

Based on this vocal recording analysis:
- Vocal Style: ${vocalStyle || 'Unknown'}
- Genre: ${genre || 'Hip-Hop/R&B'}

Recommend optimal MixxTune settings for natural, modern auto-tune:
- Speed (0-100): How fast to correct pitch
- Strength (0-100): How much to correct
- Tolerance (0-100): Cents off before correction
- Style: Which preset (future, drake, natural, t-pain)

Respond with specific numbers and brief explanation.`;
  }

  /**
   * Get system prompt for specific task type
   */
  private getSystemPromptForTask(taskType: AnalysisTask['type']): string {
    switch (taskType) {
      case 'music-context':
        return 'You are a music theory expert analyzing audio chromagrams. Provide concise, accurate musical analysis.';
      case 'mix-analysis':
        return 'You are a professional mixing engineer with expertise in modern music production. Always respond with valid JSON.';
      case 'preset-suggestion':
        return 'You are a professional audio engineer. Always respond with valid JSON containing preset_name, parameters, and explanation fields.';
      case 'auto-tune-settings':
        return 'You are a professional audio engineer expert in modern vocal production for hip-hop, trap, and R&B. Provide precise, actionable settings recommendations.';
      default:
        return 'You are a professional audio engineer.';
    }
  }
}

/**
 * Singleton instance
 */
let primeBrainLLMInstance: PrimeBrainLLM | null = null;

/**
 * Get PrimeBrainLLM instance (singleton)
 */
export function getPrimeBrainLLM(): PrimeBrainLLM {
  if (!primeBrainLLMInstance) {
    primeBrainLLMInstance = new PrimeBrainLLM();
  }
  return primeBrainLLMInstance;
}

