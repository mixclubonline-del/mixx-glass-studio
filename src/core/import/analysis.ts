/**
 * Timing Analysis Layer
 * 
 * Browser-safe, ESM-safe timing analysis for Flow import pipeline.
 * Provides BPM detection, key detection, and punch zone prediction.
 */

export interface TimingAnalysis {
  bpm: number | null;
  key: string;
  confidence: number;
  // future: swing, grid, bar alignment, etc.
}

/**
 * Basic timing analysis stub.
 * You can hook detectBPM/detectKey here or keep it as a pass-through
 * if you're already populating from upstream.
 */
export function analyzeTiming(input: {
  bpm?: number | null;
  key?: string;
  confidence?: number;
}): TimingAnalysis {
  return {
    bpm: input.bpm ?? null,
    key: input.key ?? 'C',
    confidence: input.confidence ?? 0.7,
  };
}

/**
 * Predict punch zones from BPM.
 * This is intentionally simple for now – later we can use transients + phrasing.
 */
export function predictPunchZones(bpm: number | null): Array<{
  start: number;
  end: number;
  type: 'verse' | 'chorus' | 'bridge' | 'hook';
}> {
  if (!bpm || bpm <= 0) {
    return [];
  }

  // assume 4/4, 16-bar sections
  const secondsPerBeat = 60 / bpm;
  const barsPerSection = 16;
  const beatsPerBar = 4;
  const secondsPerSection = secondsPerBeat * beatsPerBar * barsPerSection;

  const zones: Array<{
    start: number;
    end: number;
    type: 'verse' | 'chorus' | 'bridge' | 'hook';
  }> = [];

  // simple structure:
  // 0–16 bars: intro/hook
  // 16–32: verse
  // 32–48: hook
  // 48–64: verse / bridge
  for (let i = 0; i < 4; i++) {
    const sectionStart = i * secondsPerSection;
    const sectionEnd = sectionStart + secondsPerSection;
    let type: 'verse' | 'chorus' | 'bridge' | 'hook' = 'verse';
    if (i === 0 || i === 2) type = 'hook';
    if (i === 3) type = 'bridge';
    zones.push({
      start: sectionStart,
      end: sectionEnd,
      type,
    });
  }

  return zones;
}
