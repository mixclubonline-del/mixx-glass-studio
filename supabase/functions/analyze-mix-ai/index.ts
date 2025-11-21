/**
 * AI Mix Analysis - Analyze mix and provide intelligent feedback
 * Uses AI service for professional mixing suggestions
 * Created by Ravenis Prime (F.L.O.W)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MixFeatures {
  lufs: number;
  peakLevel: number;
  dynamicRange: number;
  spectralBalance: { low: number; mid: number; high: number };
  stereoWidth: number;
  phaseCorrelation: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const mixFeatures: MixFeatures = await req.json();

    const prompt = `You are a world-class mixing engineer analyzing a mix. Here are the technical measurements:

LOUDNESS & DYNAMICS:
- Integrated LUFS: ${mixFeatures.lufs.toFixed(1)} LUFS
- True Peak: ${mixFeatures.peakLevel.toFixed(1)} dBTP
- Dynamic Range: ${mixFeatures.dynamicRange.toFixed(1)} dB

FREQUENCY BALANCE:
- Low (20-250Hz): ${(mixFeatures.spectralBalance.low * 100).toFixed(0)}%
- Mid (250-5kHz): ${(mixFeatures.spectralBalance.mid * 100).toFixed(0)}%
- High (5k-20kHz): ${(mixFeatures.spectralBalance.high * 100).toFixed(0)}%

STEREO FIELD:
- Stereo Width: ${(mixFeatures.stereoWidth * 100).toFixed(0)}%
- Phase Correlation: ${mixFeatures.phaseCorrelation.toFixed(2)}

Analyze this mix professionally and provide:
1. A quality score (0-100)
2. Detected issues (if any) with severity
3. Actionable suggestions with specific frequencies, ratios, and values
4. Consider streaming standards (Spotify: -14 LUFS, Apple Music: -16 LUFS)

Return JSON format:
{
  "score": 85,
  "issues": [
    {
      "type": "frequency-masking" | "phase" | "dynamics" | "stereo" | "loudness",
      "severity": "low" | "medium" | "high",
      "description": "Clear explanation of the problem",
      "affectedTracks": ["Track 1", "Track 2"]
    }
  ],
  "suggestions": [
    {
      "action": "Short actionable title",
      "details": "Detailed explanation with specific values",
      "priority": 1-10
    }
  ],
  "lufs": ${mixFeatures.lufs},
  "dynamicRange": ${mixFeatures.dynamicRange}
}`;

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
            text: `You are a professional mixing engineer with expertise in modern music production. Always respond with valid JSON.\n\n${prompt}`
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

    // Parse AI response
    let analysis;
    try {
      const jsonMatch = aiContent.match(/```json\n([\s\S]*?)\n```/) || 
                       aiContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiContent);
      throw new Error('Invalid AI response format');
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        model: 'gemini-2.0-flash-exp',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-mix-ai:', error);
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
