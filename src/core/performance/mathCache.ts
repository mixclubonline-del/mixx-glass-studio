/**
 * QUANTUM MATH CACHE - Precomputed Lookup Tables
 * 
 * Caches expensive math operations:
 * - dB conversions (log10)
 * - Linear to dB mappings
 * - Common audio calculations
 * 
 * Flow Doctrine: Speed through precomputation
 * Reductionist Engineering: Lookup tables instead of calculations
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

// dB lookup table: linear value (0-1) -> dB value
// Precomputed for 0.0001 to 1.0 in 10000 steps
const DB_LOOKUP_SIZE = 10000;
const DB_LOOKUP_MIN = 0.0001;
const DB_LOOKUP_MAX = 1.0;
const DB_LOOKUP_STEP = (DB_LOOKUP_MAX - DB_LOOKUP_MIN) / DB_LOOKUP_SIZE;

let dbLookupTable: Float32Array | null = null;

function buildDbLookupTable(): Float32Array {
  if (dbLookupTable) return dbLookupTable;
  
  dbLookupTable = new Float32Array(DB_LOOKUP_SIZE);
  for (let i = 0; i < DB_LOOKUP_SIZE; i++) {
    const linear = DB_LOOKUP_MIN + i * DB_LOOKUP_STEP;
    dbLookupTable[i] = 20 * Math.log10(linear);
  }
  
  return dbLookupTable;
}

/**
 * Fast dB conversion using lookup table
 * Falls back to Math.log10 for values outside table range
 */
export function fastLinearToDb(linear: number): number {
  if (linear <= 0) return -Infinity;
  if (linear < DB_LOOKUP_MIN) return 20 * Math.log10(linear);
  if (linear > DB_LOOKUP_MAX) return 20 * Math.log10(linear);
  
  const table = buildDbLookupTable();
  const index = Math.floor((linear - DB_LOOKUP_MIN) / DB_LOOKUP_STEP);
  const clampedIndex = Math.max(0, Math.min(DB_LOOKUP_SIZE - 1, index));
  
  return table[clampedIndex];
}

/**
 * Fast dB to linear conversion
 */
export function fastDbToLinear(db: number): number {
  if (db === -Infinity || !isFinite(db)) return 0;
  return Math.pow(10, db / 20);
}

/**
 * Fast abs operation (for known positive/negative ranges)
 */
export function fastAbs(value: number): number {
  // Bit manipulation for faster abs (only works for integers, but can be optimized)
  // For floats, Math.abs is already fast, but we can avoid branching
  return value < 0 ? -value : value;
}

/**
 * Fast sqrt approximation (for visual meters where precision isn't critical)
 * Uses Newton's method with fewer iterations
 */
export function fastSqrt(value: number): number {
  if (value <= 0) return 0;
  if (value === 1) return 1;
  
  // Newton's method with 3 iterations (good enough for meters)
  let x = value;
  for (let i = 0; i < 3; i++) {
    x = 0.5 * (x + value / x);
  }
  return x;
}

/**
 * Fast RMS calculation using optimized loop
 */
export function fastRMS(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  
  let sum = 0;
  const len = samples.length;
  
  // Unroll loop for better performance (process 4 at a time)
  let i = 0;
  for (; i < len - 3; i += 4) {
    const s0 = samples[i];
    const s1 = samples[i + 1];
    const s2 = samples[i + 2];
    const s3 = samples[i + 3];
    sum += s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3;
  }
  
  // Handle remaining samples
  for (; i < len; i++) {
    const s = samples[i];
    sum += s * s;
  }
  
  return Math.sqrt(sum / len);
}

/**
 * Fast peak calculation
 */
export function fastPeak(samples: Float32Array): number {
  if (samples.length === 0) return 0;
  
  let max = 0;
  const len = samples.length;
  
  // Unroll loop
  let i = 0;
  for (; i < len - 3; i += 4) {
    const abs0 = Math.abs(samples[i]);
    const abs1 = Math.abs(samples[i + 1]);
    const abs2 = Math.abs(samples[i + 2]);
    const abs3 = Math.abs(samples[i + 3]);
    if (abs0 > max) max = abs0;
    if (abs1 > max) max = abs1;
    if (abs2 > max) max = abs2;
    if (abs3 > max) max = abs3;
  }
  
  // Handle remaining
  for (; i < len; i++) {
    const abs = Math.abs(samples[i]);
    if (abs > max) max = abs;
  }
  
  return max;
}





