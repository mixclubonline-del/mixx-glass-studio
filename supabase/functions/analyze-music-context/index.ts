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
    const { chroma, bpm, timeSignature } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Prepare context for AI
    const chromaStr = chroma.map((v: number, i: number) => {
      const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
      return `${notes[i]}: ${v.toFixed(2)}`;
    }).join(', ');

    const prompt = `Analyze this musical context and provide structured output:

Chromagram (pitch class energy): ${chromaStr}
BPM: ${bpm}
Time Signature: ${timeSignature.numerator}/${timeSignature.denominator}

Based on this audio analysis, determine:
1. The most likely key (e.g., "C", "Gm", "F#")
2. The current chord being played
3. The scale type (major, minor, pentatonic, blues, harmonic-minor, melodic-minor)
4. Predict the next likely chord based on common progressions
5. Harmonic tension level (0.0 to 1.0)

Respond with musical theory knowledge to identify the key and chords accurately.`;

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
            content: 'You are a music theory expert analyzing audio chromagrams. Provide concise, accurate musical analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 300
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const analysisText = aiData.choices[0].message.content;

    // Parse AI response
    const context = {
      key: extractKey(analysisText),
      chord: extractChord(analysisText),
      scale: extractScale(analysisText),
      nextChord: extractNextChord(analysisText),
      tension: extractTension(analysisText),
      aiInsight: analysisText
    };

    return new Response(JSON.stringify(context), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-music-context:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractKey(text: string): string {
  const keyMatch = text.match(/key[:\s]+([A-G][#b]?m?)/i);
  return keyMatch ? keyMatch[1] : 'C';
}

function extractChord(text: string): string {
  const chordMatch = text.match(/chord[:\s]+([A-G][#b]?(?:m|maj|min|dim|aug|sus|7|maj7|m7)?)/i);
  return chordMatch ? chordMatch[1] : 'C';
}

function extractScale(text: string): string {
  const scaleMatch = text.match(/scale[:\s]+(major|minor|pentatonic|blues|harmonic-minor|melodic-minor)/i);
  return scaleMatch ? scaleMatch[1].toLowerCase() : 'major';
}

function extractNextChord(text: string): string | undefined {
  const nextMatch = text.match(/next[:\s]+([A-G][#b]?(?:m|maj|min)?)/i);
  return nextMatch ? nextMatch[1] : undefined;
}

function extractTension(text: string): number {
  const tensionMatch = text.match(/tension[:\s]+([\d.]+)/i);
  return tensionMatch ? parseFloat(tensionMatch[1]) : 0.5;
}
