/**
 * AI Preset Suggestion - Generate professional plugin presets
 * Uses Lovable AI (Gemini 2.5 Flash) to suggest optimal plugin settings
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

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a professional audio engineer. Always respond with valid JSON containing preset_name, parameters, and explanation fields.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices[0].message.content;

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
        model: 'google/gemini-2.5-flash',
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
