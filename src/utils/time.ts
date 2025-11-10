

// src/utils/time.ts
export type GridUnit = "bars" | "beats" | "seconds";

export function secondsPerBeat(bpm: number) {
  return 60 / bpm;
}

export function secondsPerBar(bpm: number, beatsPerBar: number) {
  return secondsPerBeat(bpm) * beatsPerBar;
}

export function quantizeSeconds(
  seconds: number,
  bpm: number,
  beatsPerBar: number,
  grid: GridUnit,
  division: number // e.g., 4 = quarter, 8 = eighth, etc.
) {
  const spb = secondsPerBeat(bpm);
  if (grid === "seconds") {
    const step = 1 / division;
    return Math.round(seconds / step) * step;
  }
  if (grid === "beats") {
    const step = spb / (division / 4); // division relative to quarter note
    return Math.round(seconds / step) * step;
  }
  // bars
  const spbar = secondsPerBar(bpm, beatsPerBar);
  const step = spbar / division;
  return Math.round(seconds / step) * step;
}