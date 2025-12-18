/**
 * Spectral Intelligence Service
 * Phase 33: Prime Brain Integration
 * 
 * AI-powered harmony and pitch manipulation suggestions for the Spectral Editor.
 * Uses PrimeBrainLLM to analyze spectral blobs and suggest harmonizations.
 */

import { getPrimeBrainLLM, type AudioContext } from './PrimeBrainLLM';
import type { AudioBlob as AudioBlobType } from '../types/spectral';

// ═══════════════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════════════

export interface HarmonySuggestion {
  blobId: string;
  originalPitch: number;     // MIDI note
  suggestedPitch: number;    // MIDI note
  pitchShift: number;        // Semitones to shift
  confidence: number;        // 0-1
  reason: string;            // Why this suggestion
  harmonyType: 'unison' | 'third' | 'fifth' | 'octave' | 'custom';
}

export interface HarmonizeResult {
  suggestions: HarmonySuggestion[];
  detectedChord: string;
  scaleAnalysis: string;
  overallAdvice: string;
}

export interface SpectralContext {
  key: string;
  scale: string;
  blobs: AudioBlobType[];
  clipName?: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Harmony Analysis
// ═══════════════════════════════════════════════════════════════════════════

const SYSTEM_PROMPT = `You are a world-class vocal producer and music theorist specializing in modern hip-hop, R&B, and trap production.
You analyze spectral pitch data and provide professional harmony suggestions.
Always respond with valid JSON containing harmony suggestions.
Your suggestions should be musically informed, considering:
- The detected key and scale
- Common chord voicings in modern production
- Practical vocal harmony arrangements (3rds, 5ths, octaves)
- Modern production aesthetics (stacked vocals, harmonies)`;

/**
 * Analyze spectral blobs and suggest harmonizations
 */
export async function analyzeAndSuggestHarmonies(
  context: SpectralContext
): Promise<HarmonizeResult> {
  const primeBrain = getPrimeBrainLLM();
  
  // Build blob summary for the prompt
  const blobSummary = context.blobs.slice(0, 10).map(blob => ({
    id: blob.id,
    pitch: Math.round(blob.pitch),
    note: midiToNoteName(Math.round(blob.pitch)),
    startTime: blob.startTime.toFixed(2),
    duration: blob.duration.toFixed(2),
  }));

  const prompt = `Analyze these spectral pitch blobs and suggest professional vocal harmonies.

MUSICAL CONTEXT:
- Key: ${context.key}
- Scale: ${context.scale}
- Clip: ${context.clipName || 'Unknown'}

DETECTED PITCH BLOBS (first 10):
${JSON.stringify(blobSummary, null, 2)}

REQUIREMENTS:
1. For each blob, suggest a harmony pitch that works with the key/scale
2. Consider common vocal stacking patterns (unison, 3rd above, 3rd below, 5th, octave)
3. Prioritize harmonies that create pleasing intervals
4. Be conservative - not every note needs a harmony

Respond with valid JSON in this exact format:
{
  "suggestions": [
    {
      "blobId": "blob-id",
      "originalPitch": 60,
      "suggestedPitch": 64,
      "pitchShift": 4,
      "confidence": 0.9,
      "reason": "Major 3rd creates bright harmony",
      "harmonyType": "third"
    }
  ],
  "detectedChord": "Detected chord progression summary",
  "scaleAnalysis": "Brief scale/key analysis",
  "overallAdvice": "Overall harmony strategy suggestion"
}`;

  const audioContext: AudioContext = {
    key: context.key,
    scale: context.scale,
  };

  try {
    const response = await primeBrain.generateText(prompt, audioContext, {
      temperature: 0.4,
      maxTokens: 1000,
      systemPrompt: SYSTEM_PROMPT,
      useCache: true,
      useMixxRecall: true,
    });

    // Parse JSON response
    const parsed = parseJSONResponse(response);
    return parsed;
  } catch (error) {
    console.error('[SpectralIntelligence] Harmony analysis failed:', error);
    
    // Return fallback suggestions based on simple music theory
    return generateFallbackHarmonies(context);
  }
}

/**
 * Parse JSON response from LLM, handling markdown code blocks
 */
function parseJSONResponse(response: string): HarmonizeResult {
  // Strip markdown code blocks if present
  let cleaned = response.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();

  try {
    const parsed = JSON.parse(cleaned);
    return {
      suggestions: parsed.suggestions || [],
      detectedChord: parsed.detectedChord || '',
      scaleAnalysis: parsed.scaleAnalysis || '',
      overallAdvice: parsed.overallAdvice || '',
    };
  } catch {
    // Return empty result on parse failure
    return {
      suggestions: [],
      detectedChord: 'Unable to analyze',
      scaleAnalysis: 'Parse error',
      overallAdvice: 'Please try again',
    };
  }
}

/**
 * Generate fallback harmonies using simple music theory rules
 */
function generateFallbackHarmonies(context: SpectralContext): HarmonizeResult {
  const scaleType = context.scale.toLowerCase();
  const isMinor = scaleType.includes('minor') || scaleType.includes('dorian') || scaleType.includes('phrygian');
  
  // Major 3rd for major, minor 3rd for minor
  const thirdInterval = isMinor ? 3 : 4;
  
  const suggestions: HarmonySuggestion[] = context.blobs.slice(0, 5).map(blob => ({
    blobId: blob.id,
    originalPitch: Math.round(blob.pitch),
    suggestedPitch: Math.round(blob.pitch) + thirdInterval,
    pitchShift: thirdInterval,
    confidence: 0.7,
    reason: `${isMinor ? 'Minor' : 'Major'} 3rd harmony (fallback)`,
    harmonyType: 'third' as const,
  }));

  return {
    suggestions,
    detectedChord: `${context.key} ${isMinor ? 'minor' : 'major'}`,
    scaleAnalysis: `Detected ${context.scale} scale`,
    overallAdvice: 'Using simple third harmonies. Connect to Prime Brain for intelligent suggestions.',
  };
}

/**
 * Convert MIDI note to note name
 */
function midiToNoteName(midi: number): string {
  const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(midi / 12) - 1;
  const note = notes[midi % 12];
  return `${note}${octave}`;
}

/**
 * Quick suggestion for single blob (used during editing)
 */
export async function suggestHarmonyForBlob(
  blob: AudioBlobType,
  key: string,
  scale: string
): Promise<HarmonySuggestion | null> {
  const primeBrain = getPrimeBrainLLM();
  const pitch = Math.round(blob.pitch);
  const noteName = midiToNoteName(pitch);

  const prompt = `Suggest ONE harmony note for this pitch:
- Note: ${noteName} (MIDI ${pitch})
- Key: ${key}
- Scale: ${scale}

Reply with ONLY a JSON object:
{"suggestedPitch": <number>, "pitchShift": <number>, "reason": "<brief reason>", "harmonyType": "third|fifth|octave"}`;

  try {
    const response = await primeBrain.generateText(prompt, { key, scale }, {
      temperature: 0.3,
      maxTokens: 100,
      useCache: true,
    });

    const parsed = parseJSONResponse(`{"suggestions": [${response}]}`);
    if (parsed.suggestions.length > 0) {
      const s = parsed.suggestions[0];
      return {
        blobId: blob.id,
        originalPitch: pitch,
        suggestedPitch: s.suggestedPitch || pitch + 4,
        pitchShift: s.pitchShift || 4,
        confidence: 0.8,
        reason: s.reason || 'AI suggestion',
        harmonyType: s.harmonyType || 'third',
      };
    }
  } catch (error) {
    console.error('[SpectralIntelligence] Single blob analysis failed:', error);
  }

  return null;
}
