/**
 * Shared Gemini API utilities for Supabase Functions
 * 
 * Direct Gemini API integration for AI-powered features.
 * Provides low-latency access to Google's generative AI models.
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export interface GeminiRequest {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

/**
 * Call Gemini API directly for AI-powered features
 */
export async function callGeminiAPI(
  request: GeminiRequest,
  apiKey: string
): Promise<GeminiResponse> {
  const url = `${GEMINI_API_BASE}/models/${request.model}:generateContent`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: request.messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        parts: [{ text: msg.content }],
      })),
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxOutputTokens,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

/**
 * Extract text content from Gemini response
 */
export function extractGeminiText(response: GeminiResponse): string {
  return response.candidates[0]?.content?.parts[0]?.text || '';
}



