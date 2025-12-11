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

// Lazy-loaded detection functions
let bpmDetector: ((buffer: AudioBuffer) => number | null) | null = null;
let keyDetector: ((buffer: AudioBuffer) => string) | null = null;

async function loadBPMDetector() {
  if (!bpmDetector) {
    const module = await import('./bpm');
    bpmDetector = module.detectBPM;
  }
  return bpmDetector;
}

async function loadKeyDetector() {
  if (!keyDetector) {
    const module = await import('./key');
    keyDetector = module.detectKey;
  }
  return keyDetector;
}

/**
 * Timing analysis with automatic BPM/key detection.
 * 
 * If BPM/key are not provided, automatically detects them from the audio buffer.
 * This ensures timing analysis always has complete data.
 * 
 * Flow Doctrine: Professional audio analysis - complete data, no placeholders.
 */
export async function analyzeTiming(input: {
  bpm?: number | null;
  key?: string;
  confidence?: number;
  audioBuffer?: AudioBuffer; // Optional buffer for detection
}): Promise<TimingAnalysis> {
  let detectedBPM = input.bpm ?? null;
  let detectedKey = input.key ?? 'C';
  let confidence = input.confidence ?? 0.7;

  // Auto-detect if not provided and buffer is available
  if (input.audioBuffer) {
    if (!detectedBPM) {
      // Lazy-load BPM detection
      const detectBPM = await loadBPMDetector();
      detectedBPM = detectBPM(input.audioBuffer);
      if (detectedBPM) {
        confidence = Math.max(confidence, 0.6); // BPM detection adds confidence
      }
    }

    if (!detectedKey || detectedKey === 'C') {
      // Lazy-load key detection
      const detectKey = await loadKeyDetector();
      const key = detectKey(input.audioBuffer);
      if (key && key !== 'C') {
        detectedKey = key;
        confidence = Math.max(confidence, 0.5); // Key detection adds confidence
      }
    }
  }

  return {
    bpm: detectedBPM,
    key: detectedKey,
    confidence,
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
