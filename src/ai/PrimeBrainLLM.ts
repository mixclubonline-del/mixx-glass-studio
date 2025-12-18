/**
 * PrimeBrainLLM - Abstraction layer for LLM operations
 * 
 * Provides a unified interface for AI/LLM operations, abstracting away
 * the specific implementation (currently Gemini, future: proprietary model).
 * 
 * Enhanced with:
 * - Intelligent caching to reduce API calls and costs
 * - Mixx Recall integration for personalized responses
 * - Enhanced audio-specific prompt engineering
 * - Cost optimization (rate limiting, batching)
 * 
 * This enables:
 * - Easy migration to proprietary LLM in the future
 * - Audio-specific prompt engineering
 * - Context-aware routing
 * - Mixx Recall integration
 * - Reduced API costs through intelligent caching
 */

import { GoogleGenAI } from "@google/genai";
import { getGeminiAI } from "../utils/gemini";
import { getCachedResponse, setCachedResponse, getCacheStats } from "./PrimeBrainCache";
import { injectMixxRecall, saveProjectContext } from "./MixxRecallContext";

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
 * Enhanced with caching, Mixx Recall, and cost optimization.
 */
export class PrimeBrainLLM {
  private geminiClient: GoogleGenAI;
  private requestQueue: Array<() => Promise<void>> = [];
  private isProcessingQueue = false;
  private readonly RATE_LIMIT_MS = 100; // Minimum 100ms between requests
  private lastRequestTime = 0;

  constructor() {
    this.geminiClient = getGeminiAI();
  }

  /**
   * Access specific Gemini models directly
   */
  get models() {
    return this.geminiClient.models;
  }

  /**
   * Access Gemini Live API directly
   */
  get live() {
    return (this.geminiClient as any).preview.liveSessions;
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return getCacheStats();
  }

  /**
   * Generate text from a prompt (streaming support)
   * Enhanced with Mixx Recall integration
   */
  async *generateTextStream(
    prompt: string,
    context?: AudioContext,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      model?: string;
      thinkingConfig?: {
        thinkingBudget?: number;
      };
      useMixxRecall?: boolean;
      useCache?: boolean;
    }
  ): AsyncGenerator<string, void, unknown> {
    // Inject Mixx Recall context if enabled
    let enhancedPrompt = prompt;
    if (options?.useMixxRecall !== false) {
      enhancedPrompt = injectMixxRecall(enhancedPrompt);
    }

    // Add audio context to prompt if provided
    if (context) {
      enhancedPrompt = this.enhancePromptWithContext(enhancedPrompt, context);
    }

    // Rate limit requests
    await this.rateLimit();

    const messages: any[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
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

    let fullContent = '';
    for await (const chunk of responseStream) {
      const textChunk = chunk.text;
      if (textChunk) {
        fullContent += textChunk;
        yield textChunk;
      }
    }

    // Cache the full response (if we have it)
    if (fullContent && options?.useCache !== false) {
      setCachedResponse(
        enhancedPrompt,
        fullContent,
        context,
        { ...options, model: options?.model ?? 'gemini-2.5-flash' },
        {
          tokens: Math.ceil(fullContent.length / 4),
          cost: (fullContent.length / 4 / 1000) * 0.0001,
        }
      );
    }
  }

  /**
   * Generate text from a prompt (non-streaming)
   * Enhanced with caching and Mixx Recall integration
   */
  async generateText(
    prompt: string,
    context?: AudioContext,
    options?: {
      temperature?: number;
      maxTokens?: number;
      systemPrompt?: string;
      useCache?: boolean;
      useMixxRecall?: boolean;
    }
  ): Promise<string> {
    // Inject Mixx Recall context if enabled
    let enhancedPrompt = prompt;
    if (options?.useMixxRecall !== false) {
      enhancedPrompt = injectMixxRecall(enhancedPrompt);
    }

    // Add audio context to prompt if provided
    if (context) {
      enhancedPrompt = this.enhancePromptWithContext(enhancedPrompt, context);
    }

    // Check cache first (if enabled)
    if (options?.useCache !== false) {
      const cached = getCachedResponse(
        enhancedPrompt,
        context,
        { ...options, model: 'gemini-2.5-flash' },
        24 * 60 * 60 * 1000 // 24 hour TTL
      );
      
      if (cached) {
        return cached;
      }
    }

    // Rate limit requests
    await this.rateLimit();

    // Make API call
    const messages: any[] = [];

    if (options?.systemPrompt) {
      messages.push({
        role: 'system',
        content: options.systemPrompt,
      });
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

    const content = response.text ?? '';

    // Cache the response (if enabled)
    if (options?.useCache !== false) {
      setCachedResponse(
        enhancedPrompt,
        content,
        context,
        { ...options, model: 'gemini-2.5-flash' },
        {
          // Estimate tokens (rough: 1 token ≈ 4 characters)
          tokens: Math.ceil(content.length / 4),
          // Estimate cost (Gemini Flash: ~$0.0001 per 1K tokens)
          cost: (content.length / 4 / 1000) * 0.0001,
        }
      );
    }

    return content;
  }

  /**
   * Rate limiting to prevent API cost spikes
   */
  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.RATE_LIMIT_MS) {
      await new Promise(resolve => 
        setTimeout(resolve, this.RATE_LIMIT_MS - timeSinceLastRequest)
      );
    }
    
    this.lastRequestTime = Date.now();
  }

  /**
   * Analyze audio context (key, chord, scale, etc.)
   * Enhanced with Mixx Recall and caching
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
      useCache: true,
      useMixxRecall: true,
    });

    // Save project context for Mixx Recall
    if (task.context) {
      saveProjectContext({
        bpm: task.context.bpm,
        key: task.context.key,
        lufs: task.context.lufs,
      });
    }

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
    if (!(this.geminiClient as any).preview?.liveSessions) {
      throw new Error("Live sessions are not available or supported by the current Gemini client configuration.");
    }
    const session = await (this.geminiClient as any).preview.liveSessions.create({
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

    return `You are a world-class mixing engineer with 25+ years of experience analyzing professional mixes. 
You specialize in modern hip-hop, trap, R&B, and contemporary music production.

Here are the technical measurements from the current mix:

LOUDNESS & DYNAMICS:
- Integrated LUFS: ${context?.lufs?.toFixed(1) || 'N/A'} LUFS
- Dynamic Range: ${context?.dynamicRange?.toFixed(1) || 'N/A'} dB

FREQUENCY BALANCE:
- Low (20-250Hz): ${spectralBalance ? (spectralBalance.low * 100).toFixed(0) : 'N/A'}%
- Mid (250-5kHz): ${spectralBalance ? (spectralBalance.mid * 100).toFixed(0) : 'N/A'}%
- High (5k-20kHz): ${spectralBalance ? (spectralBalance.high * 100).toFixed(0) : 'N/A'}%

PROFESSIONAL ANALYSIS REQUIRED:
1. Identify specific frequency issues (mud, harshness, missing presence, etc.)
2. Provide targeted plugin recommendations with specific settings
3. Suggest gain staging adjustments
4. Recommend stereo width and spatial processing if needed
5. Consider modern streaming targets (Spotify, Apple Music, etc.)

Respond with actionable, professional mixing advice. Use industry-standard terminology and be specific about parameter values.`;
  }

  private buildPresetSuggestionPrompt(task: AnalysisTask): string {
    const { additionalData } = task;
    const { genre, source, pluginType } = additionalData || {};

    return `You are a world-class mixing engineer with 25+ years of experience specializing in ${genre || 'modern hip-hop and R&B'} music production.

Generate optimal ${pluginType || 'plugin'} settings for: ${source || 'audio source'}

REQUIREMENTS:
1. Provide professional, industry-standard settings
2. Consider genre-specific characteristics (${genre || 'modern hip-hop/R&B'})
3. Account for modern production standards and streaming targets
4. Use parameter values normalized to 0-1 range
5. Include brief explanation of why these settings work for this source

Return valid JSON with this structure:
{
  "preset_name": "Descriptive preset name",
  "parameters": {
    "param1": 0.0-1.0,
    "param2": 0.0-1.0
  },
  "explanation": "Brief explanation of the settings"
}

Be specific and professional. These settings will be used in a professional DAW.`;
  }

  private buildAutoTunePrompt(task: AnalysisTask): string {
    const { additionalData } = task;
    const { vocalStyle, genre, audioFeatures } = additionalData || {};

    return `You are an expert audio engineer with 25+ years specializing in modern hip-hop, trap, and R&B vocal production.
You've worked with top artists and understand the nuances of contemporary vocal processing.

VOCAL ANALYSIS:
- Vocal Style: ${vocalStyle || 'Unknown'}
- Genre: ${genre || 'Hip-Hop/R&B'}
${audioFeatures ? `- Audio Features: ${JSON.stringify(audioFeatures)}` : ''}

Recommend optimal MixxTune (auto-tune) settings for natural, modern vocal processing:

PARAMETERS TO SET:
1. Speed (0-100): How fast to correct pitch deviations
   - Lower = more natural, slower correction
   - Higher = more aggressive, faster correction
2. Strength (0-100): How much pitch correction to apply
   - Lower = subtle correction, preserves natural character
   - Higher = more correction, tighter pitch
3. Tolerance (0-100): Cents deviation before correction kicks in
   - Lower = corrects smaller deviations
   - Higher = only corrects larger pitch errors
4. Style: Preset style (future, drake, natural, t-pain)
   - Choose based on vocal style and genre

PROFESSIONAL GUIDELINES:
- Modern hip-hop vocals typically use moderate speed (40-70) with high strength (70-90)
- R&B vocals often benefit from lower speed (30-50) for natural feel
- Trap vocals may need higher speed (60-80) for that signature sound
- Always consider the vocalist's natural pitch accuracy

Respond with specific numbers for each parameter and a brief explanation of why these settings work for this vocal.`;
  }

  /**
   * Get system prompt for specific task type
   * Enhanced with professional context
   */
  private getSystemPromptForTask(taskType: AnalysisTask['type']): string {
    switch (taskType) {
      case 'music-context':
        return 'You are a music theory expert with deep knowledge of harmony, chord progressions, and scale analysis. You analyze audio chromagrams to identify keys, chords, and musical context. Provide concise, accurate musical analysis using standard music theory terminology.';
      case 'mix-analysis':
        return 'You are a professional mixing engineer with 25+ years of experience in modern music production, specializing in hip-hop, trap, and R&B. You understand professional mixing standards, streaming targets, and modern production techniques. Always respond with valid JSON containing actionable mixing advice.';
      case 'preset-suggestion':
        return 'You are a professional audio engineer with extensive experience creating and using plugin presets. You understand how different parameter combinations create specific sonic characteristics. Always respond with valid JSON containing preset_name, parameters (0-1 normalized), and explanation fields.';
      case 'auto-tune-settings':
        return 'You are a professional audio engineer expert in modern vocal production for hip-hop, trap, and R&B. You understand the nuances of auto-tune processing and how different settings create different vocal aesthetics. Provide precise, actionable settings recommendations with specific parameter values.';
      default:
        return 'You are a professional audio engineer with 25+ years of experience in music production, specializing in modern hip-hop, trap, and R&B.';
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

