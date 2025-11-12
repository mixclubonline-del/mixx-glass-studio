import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
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

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
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
        max_tokens: 400
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const recommendation = aiData.choices[0].message.content;

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
