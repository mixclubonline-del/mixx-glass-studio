/**
 * AURA LOCAL LLM ENGINE
 * Phase 37: Proprietary LLM Integration
 * 
 * Provides local AI inference for offline operation using:
 * - Ollama for local LLM inference
 * - WebLLM for in-browser inference (future)
 * - Fallback to cloud (Gemini) when local unavailable
 * 
 * AURA-specific prompts for music production:
 * - Mixing suggestions
 * - Creative inspiration
 * - Technical assistance
 * - Preset generation
 * 
 * @author Prime (Mixx Club)
 */

import { als } from '../utils/alsFeedback';

// LLM Provider types
export type LLMProvider = 'ollama' | 'webllm' | 'gemini' | 'mock';

// Message structure
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Completion options
export interface CompletionOptions {
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  format?: 'text' | 'json';
}

// Completion result
export interface CompletionResult {
  content: string;
  provider: LLMProvider;
  model: string;
  tokens: {
    prompt: number;
    completion: number;
    total: number;
  };
  latencyMs: number;
}

// Model info
export interface ModelInfo {
  id: string;
  name: string;
  provider: LLMProvider;
  contextLength: number;
  capabilities: string[];
}

// Engine status
export interface EngineStatus {
  provider: LLMProvider;
  available: boolean;
  model: string;
  error?: string;
}

// AURA-specific context for music production
export interface AURAContext {
  // Project context
  projectName?: string;
  genre?: string;
  bpm?: number;
  key?: string;
  
  // Track context
  trackCount?: number;
  trackTypes?: string[];
  currentTime?: number;
  
  // Mix context
  lufs?: number;
  dynamicRange?: number;
  spectralBalance?: { low: number; mid: number; high: number };
  
  // User intent
  intent?: 'mix' | 'master' | 'creative' | 'technical' | 'general';
}

/**
 * AURA Local LLM Engine
 * 
 * Manages local and cloud LLM inference with automatic fallback.
 */
class AURALocalLLMEngine {
  private provider: LLMProvider = 'mock';
  private model: string = 'aura-assistant';
  private ollamaEndpoint: string = 'http://localhost:11434';
  private initialized = false;
  private availableModels: ModelInfo[] = [];
  
  // AURA system prompts
  private readonly AURA_SYSTEM_PROMPT = `You are AURA, an AI assistant specialized in music production, mixing, and mastering.
You have deep knowledge of:
- Audio engineering (EQ, compression, reverb, delay, saturation)
- Music theory (keys, scales, chords, progressions)
- Genre-specific production techniques
- DAW workflow optimization
- Creative sound design

Your responses should be:
- Concise and actionable
- Technically accurate
- Creative when appropriate
- Focused on the user's musical goals

You are built into the AURA DAW, so you have context about the current session.`;

  /**
   * Initialize the engine
   */
  async initialize(): Promise<EngineStatus> {
    if (this.initialized) {
      return this.getStatus();
    }
    
    als.info('[AURA LLM] Initializing local LLM engine...');
    
    // Try Ollama first
    const ollamaAvailable = await this.checkOllama();
    
    if (ollamaAvailable) {
      this.provider = 'ollama';
      this.model = 'llama3.2:3b'; // Default local model
      als.success('[AURA LLM] Ollama backend initialized');
    } else {
      // Fallback to mock for now (Gemini handled by PrimeBrainLLM)
      this.provider = 'mock';
      this.model = 'aura-assistant';
      als.info('[AURA LLM] Using mock backend (install Ollama for local AI)');
    }
    
    this.initialized = true;
    return this.getStatus();
  }
  
  /**
   * Check if Ollama is available
   */
  private async checkOllama(): Promise<boolean> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/tags`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Parse available models
        this.availableModels = (data.models || []).map((m: any) => ({
          id: m.name,
          name: m.name,
          provider: 'ollama' as LLMProvider,
          contextLength: 4096,
          capabilities: ['chat', 'completion'],
        }));
        
        // Check for music-specific models
        const musicModels = ['llama3.2:3b', 'mistral', 'mixtral'];
        const hasModel = this.availableModels.some(m => 
          musicModels.some(mm => m.id.includes(mm))
        );
        
        if (hasModel) {
          const preferred = this.availableModels.find(m => m.id.includes('llama3.2:3b'));
          if (preferred) {
            this.model = preferred.id;
          }
        }
        
        return true;
      }
      
      return false;
    } catch {
      return false;
    }
  }
  
  /**
   * Get current status
   */
  getStatus(): EngineStatus {
    return {
      provider: this.provider,
      available: this.initialized,
      model: this.model,
    };
  }
  
  /**
   * Get available models
   */
  getAvailableModels(): ModelInfo[] {
    return [...this.availableModels];
  }
  
  /**
   * Set model
   */
  setModel(modelId: string): void {
    this.model = modelId;
    als.info(`[AURA LLM] Model set to: ${modelId}`);
  }
  
  /**
   * Complete with AURA context
   */
  async complete(
    prompt: string,
    context?: AURAContext,
    options?: CompletionOptions
  ): Promise<CompletionResult> {
    const startTime = performance.now();
    
    // Build messages with context
    const messages = this.buildMessages(prompt, context);
    
    let content: string;
    
    switch (this.provider) {
      case 'ollama':
        content = await this.completeWithOllama(messages, options);
        break;
      case 'mock':
      default:
        content = await this.completeWithMock(prompt, context);
        break;
    }
    
    const latencyMs = performance.now() - startTime;
    
    return {
      content,
      provider: this.provider,
      model: this.model,
      tokens: {
        prompt: prompt.length / 4, // Estimate
        completion: content.length / 4,
        total: (prompt.length + content.length) / 4,
      },
      latencyMs,
    };
  }
  
  /**
   * Stream completion
   */
  async *stream(
    prompt: string,
    context?: AURAContext,
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    const messages = this.buildMessages(prompt, context);
    
    if (this.provider === 'ollama') {
      yield* this.streamWithOllama(messages, options);
    } else {
      // Mock streaming
      const result = await this.completeWithMock(prompt, context);
      for (const word of result.split(' ')) {
        yield word + ' ';
        await new Promise(r => setTimeout(r, 50));
      }
    }
  }
  
  /**
   * Build messages with AURA context
   */
  private buildMessages(prompt: string, context?: AURAContext): LLMMessage[] {
    const messages: LLMMessage[] = [
      { role: 'system', content: this.AURA_SYSTEM_PROMPT },
    ];
    
    // Add context if available
    if (context) {
      const contextStr = this.formatContext(context);
      messages.push({
        role: 'system',
        content: `Current session context:\n${contextStr}`,
      });
    }
    
    messages.push({ role: 'user', content: prompt });
    
    return messages;
  }
  
  /**
   * Format context for prompts
   */
  private formatContext(context: AURAContext): string {
    const parts: string[] = [];
    
    if (context.projectName) parts.push(`Project: ${context.projectName}`);
    if (context.genre) parts.push(`Genre: ${context.genre}`);
    if (context.bpm) parts.push(`BPM: ${context.bpm}`);
    if (context.key) parts.push(`Key: ${context.key}`);
    if (context.trackCount) parts.push(`Tracks: ${context.trackCount}`);
    if (context.lufs) parts.push(`LUFS: ${context.lufs.toFixed(1)}`);
    if (context.dynamicRange) parts.push(`Dynamic Range: ${context.dynamicRange.toFixed(1)} dB`);
    if (context.intent) parts.push(`User intent: ${context.intent}`);
    
    return parts.join('\n');
  }
  
  /**
   * Complete with Ollama
   */
  private async completeWithOllama(
    messages: LLMMessage[],
    options?: CompletionOptions
  ): Promise<string> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: false,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 1024,
          },
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.message?.content || '';
      
    } catch (error) {
      als.error('[AURA LLM] Ollama completion failed', error);
      return this.completeWithMock(messages[messages.length - 1]?.content || '', undefined);
    }
  }
  
  /**
   * Stream with Ollama
   */
  private async *streamWithOllama(
    messages: LLMMessage[],
    options?: CompletionOptions
  ): AsyncGenerator<string, void, unknown> {
    try {
      const response = await fetch(`${this.ollamaEndpoint}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages,
          stream: true,
          options: {
            temperature: options?.temperature ?? 0.7,
            num_predict: options?.maxTokens ?? 1024,
          },
        }),
      });
      
      if (!response.ok || !response.body) {
        throw new Error(`Ollama stream error: ${response.status}`);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.trim());
        
        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              yield data.message.content;
            }
          } catch {
            // Skip malformed lines
          }
        }
      }
      
    } catch (error) {
      als.error('[AURA LLM] Ollama stream failed', error);
      yield 'I apologize, but I encountered an error. Please try again.';
    }
  }
  
  /**
   * Mock completion for testing
   */
  private async completeWithMock(prompt: string, context?: AURAContext): Promise<string> {
    // Simulate latency
    await new Promise(r => setTimeout(r, 100));
    
    const promptLower = prompt.toLowerCase();
    
    // Genre-aware responses
    if (promptLower.includes('mix') || promptLower.includes('mixing')) {
      return this.getMixingAdvice(context);
    }
    
    if (promptLower.includes('master') || promptLower.includes('mastering')) {
      return this.getMasteringAdvice(context);
    }
    
    if (promptLower.includes('eq') || promptLower.includes('equalization')) {
      return this.getEQAdvice(context);
    }
    
    if (promptLower.includes('compress') || promptLower.includes('dynamics')) {
      return this.getCompressionAdvice(context);
    }
    
    if (promptLower.includes('reverb') || promptLower.includes('space')) {
      return this.getReverbAdvice(context);
    }
    
    // Default creative response
    return `Based on your ${context?.genre || 'music'} project at ${context?.bpm || 120} BPM in ${context?.key || 'C major'}, here are my suggestions:

1. **Arrangement**: Consider adding variation every 8-16 bars
2. **Mix Balance**: Ensure your low-end is clean with proper high-pass filtering
3. **Dynamics**: Use compression to add punch while maintaining musicality
4. **Space**: Add subtle reverb to create depth without muddiness

Would you like me to elaborate on any of these areas?`;
  }
  
  private getMixingAdvice(context?: AURAContext): string {
    const genre = context?.genre || 'general';
    return `Here's my mixing advice for your ${genre} project:

**Gain Staging**: Start with all faders at unity and trim inputs to peak around -18dBFS for optimal headroom.

**EQ Strategy**:
- Cut before boosting
- Use high-pass filters on non-bass elements
- Create space by carving complementary EQ curves

**Dynamics**:
- Compress drums for punch (4:1 ratio, fast attack, medium release)
- Use gentle compression on vocals (2:1-3:1)
- Consider parallel compression for energy

**Panning**:
- Keep bass and kick centered
- Create width with guitars, keys, and backing vocals
- Use stereo imaging carefully on synths

**Balance**:
- Reference against professional tracks in your genre
- Check mono compatibility regularly

What specific element needs attention?`;
  }
  
  private getMasteringAdvice(context?: AURAContext): string {
    const lufs = context?.lufs || -14;
    return `Here's my mastering approach for your project (current: ${lufs.toFixed(1)} LUFS):

**Target Loudness**: 
- Streaming: -14 LUFS (Spotify, Apple Music)
- Club: -10 to -8 LUFS
- Broadcast: -24 LUFS

**EQ**: Make subtle, broad adjustments
- Gentle high shelf for air (+1-2dB above 10kHz)
- Address any resonances with narrow cuts

**Compression**: 
- 1.5:1 to 2:1 ratio for glue
- Slow attack to preserve transients
- Auto-release or matched to tempo

**Limiting**:
- Use a quality limiter (AURA's Velvet Curve is excellent)
- Aim for 2-4dB of gain reduction max
- Watch for inter-sample peaks

**Final Check**:
- A/B with reference tracks
- Listen on multiple systems
- Take breaks to avoid ear fatigue`;
  }
  
  private getEQAdvice(context?: AURAContext): string {
    return `EQ Guide for ${context?.genre || 'your genre'}:

**Frequency Ranges**:
- Sub (20-60Hz): Power, felt more than heard
- Bass (60-250Hz): Warmth, body
- Low-mids (250-500Hz): Mud zone - often needs cutting
- Mids (500Hz-2kHz): Presence, clarity
- Hi-mids (2-6kHz): Bite, attack
- Highs (6-20kHz): Air, sparkle

**Quick Tips**:
- Sweep with a narrow boost to find problem frequencies
- Cut narrow, boost wide
- Use your ears, not your eyes
- Less is more

**Genre-Specific**:
- Hip-hop: Emphasize sub, clean low-mids
- Rock: Focus on mid presence
- EDM: Tight low-end, bright highs
- Jazz: Warm, natural, minimal processing

What instrument needs EQ help?`;
  }
  
  private getCompressionAdvice(context?: AURAContext): string {
    return `Compression Guide:

**When to use compression**:
- Tame dynamic range
- Add punch and energy
- Glue elements together
- Shape transients

**Key Parameters**:
- **Threshold**: Where compression begins
- **Ratio**: How much to compress (2:1 gentle, 10:1+ limiting)
- **Attack**: Fast = controlled, Slow = punchy
- **Release**: Match to tempo or use auto
- **Makeup Gain**: Restore perceived loudness

**Common Settings**:
- **Vocals**: 3:1, medium attack, fast release
- **Drums**: 4:1, fast attack (controlled) or slow (punchy)
- **Bass**: 4:1, medium attack, medium release
- **Mix Bus**: 2:1, slow attack, auto release, 1-3dB GR

**Pro Tip**: Try parallel compression for the best of both worlds - blend compressed and dry signals.`;
  }
  
  private getReverbAdvice(context?: AURAContext): string {
    return `Reverb Guide for depth and space:

**Types**:
- **Room**: Small, intimate - vocals, drums
- **Hall**: Lush, cinematic - orchestral, ballads
- **Plate**: Bright, dense - vocals, snares
- **Chamber**: Warm, natural - all-purpose
- **Spring**: Vintage character - guitars, keys

**Key Settings**:
- **Pre-delay**: 20-50ms to separate source from reverb
- **Decay**: Match to tempo (1/4 note at ${context?.bpm || 120} BPM = ${Math.round(60000 / (context?.bpm || 120) / 4)}ms)
- **EQ the reverb**: Roll off lows, tame highs
- **Mix level**: Less is usually more

**Tips**:
- Use sends/returns for reverb (not inserts)
- Different reverbs for different depth planes
- Mono reverb can work for focused sources
- Sidechain reverb to duck during dry hits

Would you like specific reverb settings for a particular instrument?`;
  }
  
  /**
   * AURA-specific methods
   */
  
  /**
   * Get mixing suggestions based on analysis
   */
  async getMixingSuggestions(context: AURAContext): Promise<string> {
    const prompt = `Based on the current mix analysis, provide 3-5 specific, actionable mixing suggestions to improve the sound.`;
    const result = await this.complete(prompt, { ...context, intent: 'mix' });
    return result.content;
  }
  
  /**
   * Generate preset recommendations
   */
  async getPresetRecommendation(
    effectType: 'eq' | 'compressor' | 'reverb' | 'delay' | 'saturation',
    context: AURAContext
  ): Promise<string> {
    const prompt = `Recommend optimal ${effectType} settings for a ${context.genre || 'general'} track at ${context.bpm || 120} BPM. Provide specific parameter values.`;
    const result = await this.complete(prompt, { ...context, intent: 'technical' });
    return result.content;
  }
  
  /**
   * Creative inspiration
   */
  async getCreativeIdea(context: AURAContext): Promise<string> {
    const prompt = `Suggest a creative production idea or technique that could elevate this ${context.genre || 'music'} project. Think outside the box.`;
    const result = await this.complete(prompt, { ...context, intent: 'creative' });
    return result.content;
  }
  
  /**
   * Dispose resources
   */
  dispose(): void {
    this.initialized = false;
    als.info('[AURA LLM] Engine disposed');
  }
}

// Global singleton
let globalEngine: AURALocalLLMEngine | null = null;

/**
 * Get the AURA Local LLM Engine
 */
export function getAURALLMEngine(): AURALocalLLMEngine {
  if (!globalEngine) {
    globalEngine = new AURALocalLLMEngine();
  }
  return globalEngine;
}

/**
 * Initialize AURA LLM Engine
 */
export async function initializeAURALLM(): Promise<EngineStatus> {
  const engine = getAURALLMEngine();
  return engine.initialize();
}

/**
 * Quick completion with AURA context
 */
export async function auraComplete(
  prompt: string,
  context?: AURAContext,
  options?: CompletionOptions
): Promise<string> {
  const engine = getAURALLMEngine();
  if (!engine.getStatus().available) {
    await engine.initialize();
  }
  const result = await engine.complete(prompt, context, options);
  return result.content;
}

export { AURALocalLLMEngine };
export default AURALocalLLMEngine;
