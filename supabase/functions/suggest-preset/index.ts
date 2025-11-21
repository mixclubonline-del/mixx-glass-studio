/**
 * AI Preset Suggestion - Generate professional plugin presets
 * Uses AI service to suggest optimal plugin settings
 * Created by Ravenis Prime (F.L.O.W)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PresetRequest {
  genre: string;
  source: 'vocal' | 'drums' | 'bass' | 'keys' | 'guitar' | 'mix-bus';
  reference?: string;
  audioFeatures?: {
    rms: number;
    lufs: number;
    dynamicRange: number;
    spectralCentroid: number;
  };
  pluginType: 'compressor' | 'eq' | 'saturator' | 'reverb';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: PresetRequest = await req.json();
    const { genre, source, reference, audioFeatures, pluginType } = request;

    // Build context-aware prompt for AI
    const prompt = `You are a world-class mixing engineer specializing in ${genre} music.

Generate optimal ${pluginType} settings for: ${source}
${reference ? `Reference style: ${reference}` : ''}
${audioFeatures ? `
Audio Analysis:
- RMS Level: ${audioFeatures.rms.toFixed(2)}
- LUFS: ${audioFeatures.lufs.toFixed(1)}
- Dynamic Range: ${audioFeatures.dynamicRange.toFixed(1)} dB
- Spectral Centroid: ${audioFeatures.spectralCentroid.toFixed(0)} Hz
` : ''}

Provide professional settings considering:
1. Genre-specific characteristics (${genre} typically uses...)
2. Source material needs (${source} requires...)
3. Modern production standards
4. Musicality and transparency

Return JSON with parameter values (0-1 normalized) and brief explanation.

Example format:
{
  "preset_name": "Hip-Hop Lead Vocal",
  "parameters": {
    "threshold": 0.65,
    "ratio": 0.35,
    "attack": 0.25,
    "release": 0.45
  },
  "explanation": "Fast attack to catch transients, medium ratio for control, auto-release for musicality"
}`;

    // Call AI service (configure with GEMINI_API_KEY or alternative)
    const AI_API_KEY = Deno.env.get('GEMINI_API_KEY') || Deno.env.get('AI_API_KEY');
    if (!AI_API_KEY) {
      throw new Error('AI_API_KEY or GEMINI_API_KEY not configured');
    }

    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are a professional audio engineer. Always respond with valid JSON containing preset_name, parameters, and explanation fields.\n\n${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
        },
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse AI response (handle markdown code blocks)
    let presetData;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      presetData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    // Validate preset data
    if (!presetData.preset_name || !presetData.parameters) {
      throw new Error('Missing required preset fields');
    }

    return new Response(
      JSON.stringify({
        success: true,
        preset: presetData,
        model: 'gemini-2.0-flash-exp',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in suggest-preset:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
