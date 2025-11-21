// Unified ordering for F.L.O.W. stems
export const STEM_PRIORITY_ORDER = [
  'vocals',
  'drums',
  'bass',
  'harmonic',
  'perc',
  'sub',
  'music', // always last (full mix)
] as const;

// Reserved track IDs (should NOT be reassigned)
export const RESERVED_TRACKS = {
  TWO_TRACK: 'track-two-track',
  HUSH: 'track-hush-record',
} as const;


