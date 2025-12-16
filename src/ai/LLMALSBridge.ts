/**
 * AURA LLM ALS BRIDGE
 * 
 * FLOW Doctrine Compliant LLM Output Layer
 * 
 * Translates LLM responses to whisper-style, number-free recommendations.
 * Routes all LLM outputs through ALS and Bloom channels.
 * Adds Mixx Recall anchors for session memory.
 * 
 * The Prime Brain whispers, never shouts.
 * 
 * @author Prime (Mixx Club)
 */

import { publishAlsSignal, publishBloomSignal } from '../state/flowSignals';
import type { ALSTemperature } from '../utils/ALS';
import type { AURAContext, CompletionResult } from './AURALocalLLMEngine';

// ============================================================================
// WHISPER-STYLE RESPONSE TYPES
// ============================================================================

/**
 * Intent categories for Prime Brain responses
 */
export type WhisperIntent = 
  | 'mix-guidance'      // Mixing suggestions
  | 'master-guidance'   // Mastering suggestions
  | 'creative-spark'    // Creative inspiration
  | 'tone-shape'        // EQ/tonal guidance
  | 'dynamic-shape'     // Compression/dynamics guidance
  | 'space-shape'       // Reverb/spatial guidance
  | 'general-guidance'; // General advice

/**
 * ALS-compatible LLM response
 */
export interface ALSWhisperResponse {
  // The translated, number-free guidance
  whisper: string;
  
  // Intent classification
  intent: WhisperIntent;
  
  // Key insights (bullet points, no numbers)
  insights: string[];
  
  // Suggested Bloom actions
  bloomActions: Array<{
    label: string;
    action: string;
    payload?: unknown;
  }>;
  
  // ALS state update
  alsUpdate: {
    temperature: ALSTemperature;
    flow: number;
    pulse: number;
    tension: number;
    momentum: number;
  };
  
  // Mixx Recall anchor
  recallAnchor: {
    id: string;
    timestamp: number;
    context: string;
    summary: string;
  };
}

// ============================================================================
// NUMBER ELIMINATION PATTERNS
// ============================================================================

/**
 * Patterns to detect and replace raw numbers
 */
const NUMBER_PATTERNS: Array<{
  pattern: RegExp;
  replacement: (match: string, value: string) => string;
}> = [
  // dB values
  { 
    pattern: /(-?\d+(?:\.\d+)?)\s*dB(?:FS)?/gi, 
    replacement: (_, val) => describeLevel(parseFloat(val))
  },
  // Hz values
  { 
    pattern: /(\d+(?:\.\d+)?)\s*(?:Hz|kHz)/gi, 
    replacement: (_, val) => describeFrequency(parseFloat(val))
  },
  // Ratios (compression)
  { 
    pattern: /(\d+(?:\.\d+)?)\s*:\s*1/g, 
    replacement: (_, val) => describeRatio(parseFloat(val))
  },
  // Percentages
  { 
    pattern: /(\d+(?:\.\d+)?)\s*%/g, 
    replacement: (_, val) => describePercentage(parseFloat(val))
  },
  // Milliseconds
  { 
    pattern: /(\d+(?:\.\d+)?)\s*ms/gi, 
    replacement: (_, val) => describeTime(parseFloat(val))
  },
  // BPM (keep as is, it's musical context)
  // LUFS
  { 
    pattern: /(-?\d+(?:\.\d+)?)\s*LUFS/gi, 
    replacement: (_, val) => describeLoudness(parseFloat(val))
  },
  // Bare numbers with context
  { 
    pattern: /\b(\d+(?:\.\d+)?)\s*(seconds?|sec)/gi, 
    replacement: (_, val) => describeTime(parseFloat(val) * 1000)
  },
];

// ============================================================================
// DESCRIPTION FUNCTIONS (No numbers!)
// ============================================================================

function describeLevel(db: number): string {
  if (db >= 0) return 'at peak';
  if (db >= -3) return 'very hot';
  if (db >= -6) return 'loud';
  if (db >= -12) return 'present';
  if (db >= -18) return 'comfortable';
  if (db >= -24) return 'moderate';
  if (db >= -30) return 'subtle';
  return 'quiet';
}

function describeFrequency(hz: number): string {
  if (hz < 60) return 'sub-bass territory';
  if (hz < 250) return 'low-end region';
  if (hz < 500) return 'lower midrange';
  if (hz < 2000) return 'midrange presence';
  if (hz < 4000) return 'upper midrange';
  if (hz < 8000) return 'presence region';
  if (hz < 12000) return 'brilliance zone';
  return 'air frequencies';
}

function describeRatio(ratio: number): string {
  if (ratio <= 1.5) return 'very gentle';
  if (ratio <= 2) return 'gentle';
  if (ratio <= 3) return 'moderate';
  if (ratio <= 4) return 'firm';
  if (ratio <= 6) return 'aggressive';
  if (ratio <= 10) return 'heavy';
  return 'limiting';
}

function describePercentage(pct: number): string {
  if (pct <= 10) return 'a touch';
  if (pct <= 25) return 'subtle';
  if (pct <= 40) return 'moderate';
  if (pct <= 60) return 'balanced';
  if (pct <= 75) return 'prominent';
  if (pct <= 90) return 'heavy';
  return 'full';
}

function describeTime(ms: number): string {
  if (ms <= 1) return 'instant';
  if (ms <= 5) return 'snappy';
  if (ms <= 20) return 'quick';
  if (ms <= 50) return 'moderate';
  if (ms <= 100) return 'relaxed';
  if (ms <= 300) return 'slow';
  if (ms <= 1000) return 'gradual';
  return 'sustained';
}

function describeLoudness(lufs: number): string {
  if (lufs >= -8) return 'club-loud';
  if (lufs >= -11) return 'punchy';
  if (lufs >= -14) return 'streaming-ready';
  if (lufs >= -18) return 'dynamic';
  if (lufs >= -24) return 'broadcast-ready';
  return 'cinematic dynamic range';
}

// ============================================================================
// TRANSLATION FUNCTIONS
// ============================================================================

/**
 * Strip all numbers from LLM response
 */
export function stripNumbers(text: string): string {
  let result = text;
  
  for (const { pattern, replacement } of NUMBER_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  
  // Remove any remaining standalone numbers (be careful with lists)
  // Keep numbers that are part of ordered lists (1., 2., etc.)
  result = result.replace(/(?<!\d\.)\b\d+(?:\.\d+)?\b(?!\.\s)/g, '');
  
  // Clean up double spaces
  result = result.replace(/\s{2,}/g, ' ').trim();
  
  return result;
}

/**
 * Extract key insights from LLM response
 */
export function extractInsights(text: string): string[] {
  const insights: string[] = [];
  
  // Look for bullet points
  const bulletMatches = text.match(/[-•*]\s*([^\n]+)/g);
  if (bulletMatches) {
    for (const match of bulletMatches.slice(0, 5)) {
      const cleaned = stripNumbers(match.replace(/^[-•*]\s*/, '').trim());
      if (cleaned.length > 10) {
        insights.push(cleaned);
      }
    }
  }
  
  // Look for numbered lists if no bullets
  if (insights.length === 0) {
    const numberedMatches = text.match(/\d+\.\s*([^\n]+)/g);
    if (numberedMatches) {
      for (const match of numberedMatches.slice(0, 5)) {
        const cleaned = stripNumbers(match.replace(/^\d+\.\s*/, '').trim());
        if (cleaned.length > 10) {
          insights.push(cleaned);
        }
      }
    }
  }
  
  // Look for bold text (** **)
  if (insights.length === 0) {
    const boldMatches = text.match(/\*\*([^*]+)\*\*/g);
    if (boldMatches) {
      for (const match of boldMatches.slice(0, 5)) {
        const cleaned = match.replace(/\*\*/g, '').trim();
        if (cleaned.length > 5 && cleaned.length < 50) {
          insights.push(cleaned);
        }
      }
    }
  }
  
  return insights;
}

/**
 * Classify intent from context and content
 */
export function classifyIntent(context: AURAContext | undefined, content: string): WhisperIntent {
  const lower = content.toLowerCase();
  
  // Check context intent first
  if (context?.intent === 'mix') return 'mix-guidance';
  if (context?.intent === 'master') return 'master-guidance';
  if (context?.intent === 'creative') return 'creative-spark';
  
  // Check content
  if (lower.includes('master') && !lower.includes('masterpiece')) return 'master-guidance';
  if (lower.includes('mix') || lower.includes('balance')) return 'mix-guidance';
  if (lower.includes('eq') || lower.includes('frequency') || lower.includes('tone')) return 'tone-shape';
  if (lower.includes('compress') || lower.includes('dynamic')) return 'dynamic-shape';
  if (lower.includes('reverb') || lower.includes('delay') || lower.includes('space')) return 'space-shape';
  if (lower.includes('creative') || lower.includes('idea') || lower.includes('inspire')) return 'creative-spark';
  
  return 'general-guidance';
}

/**
 * Generate Bloom actions based on intent
 */
export function generateBloomActions(intent: WhisperIntent): ALSWhisperResponse['bloomActions'] {
  const actions: ALSWhisperResponse['bloomActions'] = [];
  
  switch (intent) {
    case 'mix-guidance':
      actions.push(
        { label: 'Apply Suggestions', action: 'auto-mix:apply', payload: { mode: 'suggested' } },
        { label: 'Analyze Mix', action: 'auto-mix:analyze', payload: {} }
      );
      break;
    case 'master-guidance':
      actions.push(
        { label: 'Open Master', action: 'master:open', payload: {} },
        { label: 'Check Loudness', action: 'master:check-loudness', payload: {} }
      );
      break;
    case 'tone-shape':
      actions.push(
        { label: 'Open EQ', action: 'fx:open', payload: { type: 'eq' } },
        { label: 'Spectral View', action: 'view:spectrum', payload: {} }
      );
      break;
    case 'dynamic-shape':
      actions.push(
        { label: 'Open Compressor', action: 'fx:open', payload: { type: 'compressor' } },
        { label: 'Check Dynamics', action: 'view:dynamics', payload: {} }
      );
      break;
    case 'space-shape':
      actions.push(
        { label: 'Open Reverb', action: 'fx:open', payload: { type: 'reverb' } },
        { label: 'Open Delay', action: 'fx:open', payload: { type: 'delay' } }
      );
      break;
    case 'creative-spark':
      actions.push(
        { label: 'Generate Variation', action: 'creative:variation', payload: {} },
        { label: 'More Ideas', action: 'prime-brain:inspire', payload: {} }
      );
      break;
    default:
      actions.push(
        { label: 'Ask Follow-up', action: 'prime-brain:follow-up', payload: {} }
      );
  }
  
  return actions;
}

/**
 * Generate Mixx Recall anchor
 */
export function generateRecallAnchor(
  context: AURAContext | undefined,
  summary: string
): ALSWhisperResponse['recallAnchor'] {
  return {
    id: `recall-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    context: context ? JSON.stringify({
      genre: context.genre,
      intent: context.intent,
      trackCount: context.trackCount,
    }) : '{}',
    summary: summary.slice(0, 200),
  };
}

/**
 * Calculate ALS update based on intent and content
 */
export function calculateALSUpdate(
  intent: WhisperIntent,
  insights: string[]
): ALSWhisperResponse['alsUpdate'] {
  const intentTemperatures: Record<WhisperIntent, ALSTemperature> = {
    'mix-guidance': 'warm',
    'master-guidance': 'warm',
    'creative-spark': 'hot',
    'tone-shape': 'cool',
    'dynamic-shape': 'warm',
    'space-shape': 'cool',
    'general-guidance': 'cool',
  };
  
  return {
    temperature: intentTemperatures[intent],
    flow: 0.6 + (insights.length * 0.1),
    pulse: intent === 'creative-spark' ? 0.8 : 0.5,
    tension: 0.2, // Prime Brain guidance is low tension
    momentum: 0.7, // We're making progress!
  };
}

/**
 * Transform raw LLM completion to ALS-compatible whisper
 */
export function transformToWhisper(
  result: CompletionResult,
  context?: AURAContext
): ALSWhisperResponse {
  // Strip all numbers from content
  const whisper = stripNumbers(result.content);
  
  // Extract insights
  const insights = extractInsights(result.content);
  
  // Classify intent
  const intent = classifyIntent(context, result.content);
  
  // Generate Bloom actions
  const bloomActions = generateBloomActions(intent);
  
  // Calculate ALS update
  const alsUpdate = calculateALSUpdate(intent, insights);
  
  // Generate recall anchor
  const recallAnchor = generateRecallAnchor(context, whisper.slice(0, 100));
  
  return {
    whisper,
    intent,
    insights,
    bloomActions,
    alsUpdate,
    recallAnchor,
  };
}

/**
 * Publish Prime Brain whisper to ALS and Bloom
 */
export function publishWhisper(response: ALSWhisperResponse): void {
  // Publish to ALS
  publishAlsSignal({
    source: 'prime-brain',
    meta: {
      event: 'whisper',
      intent: response.intent,
      temperature: response.alsUpdate.temperature,
    },
  });
  
  // Publish to Bloom with actions
  publishBloomSignal({
    source: 'prime-brain',
    action: 'whisper',
    payload: {
      content: response.whisper.slice(0, 500), // Limit display length
      insights: response.insights,
      actions: response.bloomActions,
    },
  });
}

// ============================================================================
// MIXX RECALL INTEGRATION
// ============================================================================

// In-memory recall store (would connect to persistence layer)
const recallStore: ALSWhisperResponse['recallAnchor'][] = [];

/**
 * Save a recall anchor to memory
 */
export function saveRecallAnchor(anchor: ALSWhisperResponse['recallAnchor']): void {
  recallStore.push(anchor);
  
  // Keep only last 100 anchors in memory
  if (recallStore.length > 100) {
    recallStore.shift();
  }
  
  // TODO: Persist to Mixx Recall storage layer
  console.log('[Mixx Recall] Anchor saved:', anchor.id);
}

/**
 * Get recent recall anchors
 */
export function getRecentRecalls(count = 10): ALSWhisperResponse['recallAnchor'][] {
  return recallStore.slice(-count);
}
