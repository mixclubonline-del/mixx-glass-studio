import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGeminiAPI, extractGeminiText } from "../_shared/gemini-api.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audioFeatures, vocalStyle, genre } = await req.json();
    
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const prompt = `You are an expert audio engineer specializing in modern hip-hop, trap, and R&B vocal production.

Based on this vocal recording analysis:
- Vocal Style: ${vocalStyle || 'Unknown'}
- Genre: ${genre || 'Hip-Hop/R&B'}
- Pitch Variance: ${audioFeatures?.pitchVariance || 'Medium'}
- Vibrato Presence: ${audioFeatures?.hasVibrato ? 'Yes' : 'No'}
- Breathiness: ${audioFeatures?.breathiness || 'Medium'}

Recommend optimal MixxTune settings for natural, modern auto-tune:

Provide these exact values:
- Speed (0-100): How fast to correct pitch
- Strength (0-100): How much to correct
- Tolerance (0-100): Cents off before correction
- Style: Which preset (future, drake, natural, t-pain)

Consider:
- Future style: Fast, strong correction (85 speed, 95 strength, 15 tolerance)
- Drake style: Moderate, musical correction (60 speed, 85 strength, 25 tolerance)
- Natural style: Subtle correction (30 speed, 60 strength, 40 tolerance)
- T-Pain style: Instant, full correction (100 speed, 100 strength, 5 tolerance)

Respond with specific numbers and brief explanation.`;

    // Call Gemini API directly
    const geminiResponse = await callGeminiAPI({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'You are a professional audio engineer expert in modern vocal production for hip-hop, trap, and R&B. Provide precise, actionable settings recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.4,
      maxOutputTokens: 400
    }, GEMINI_API_KEY);

    const recommendation = extractGeminiText(geminiResponse);

    // Parse AI response
    const settings = {
      speed: extractNumber(recommendation, 'speed') || 60,
      strength: extractNumber(recommendation, 'strength') || 80,
      tolerance: extractNumber(recommendation, 'tolerance') || 25,
      style: extractStyle(recommendation) || 'drake',
      explanation: recommendation
    };

    return new Response(JSON.stringify(settings), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in suggest-mixxtune-settings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractNumber(text: string, param: string): number | null {
  const regex = new RegExp(`${param}[:\\s]+(\\d+)`, 'i');
  const match = text.match(regex);
  return match ? parseInt(match[1]) : null;
}

function extractStyle(text: string): string | null {
  const styles = ['future', 'drake', 'natural', 't-pain'];
  for (const style of styles) {
    if (text.toLowerCase().includes(style)) {
      return style;
    }
  }
  return null;
}
