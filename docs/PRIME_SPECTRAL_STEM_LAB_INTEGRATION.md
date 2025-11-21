# Prime Spectral Stem Lab Integration Guide

## Overview

This guide explains how to integrate your `prime-spectral-stem-lab` technology into the Flow stem separation system.

## Architecture

The integration is modular and non-invasive:

1. **Base Implementation** (`spectralAnalysis.ts`): Provides standard spectral analysis
2. **Integration Point** (`primeSpectralStemLabIntegration.ts`): Where your technology plugs in
3. **Enhanced Engine** (`EnhancedSpectralAnalysisEngine`): Wraps base with your enhancements
4. **Flow Integration** (`flowStemSeparation.ts`): Uses enhanced engine when available

## Integration Steps

### Step 1: Import Your Technology

Edit `src/core/import/primeSpectralStemLabIntegration.ts`:

```typescript
// Import your prime-spectral-stem-lab functions
import { 
  yourAdvancedSTFT,
  yourAdvancedAnalysis,
  yourAdvancedMasking,
  yourAdvancedMaskApplication
} from 'prime-spectral-stem-lab'; // or your import path
```

### Step 2: Implement the Interface

Replace the placeholder functions with your implementations:

```typescript
export const primeSpectralStemLabIntegration: SpectralStemLabIntegration = {
  async computeAdvancedSTFT(audioBuffer: AudioBuffer): Promise<SpectralFrame[]> {
    // Use your STFT implementation
    return await yourAdvancedSTFT(audioBuffer);
  },
  
  async analyzeAdvanced(audioBuffer: AudioBuffer): Promise<SpectralAnalysisResult> {
    // Use your analysis implementation
    return await yourAdvancedAnalysis(audioBuffer);
  },
  
  async generateAdvancedStemMask(
    analysis: SpectralAnalysisResult,
    stemType: SpectralStemMask['stemType']
  ): Promise<SpectralStemMask> {
    // Use your masking implementation
    return await yourAdvancedMasking(analysis, stemType);
  },
  
  async applySpectralMask(
    audioBuffer: AudioBuffer,
    mask: SpectralStemMask
  ): Promise<AudioBuffer> {
    // Use your mask application implementation
    return await yourAdvancedMaskApplication(audioBuffer, mask);
  },
};
```

### Step 3: Enable Integration

Update `isPrimeSpectralLabAvailable()`:

```typescript
export function isPrimeSpectralLabAvailable(): boolean {
  return typeof yourAdvancedSTFT !== 'undefined';
}
```

### Step 4: Enable in Flow

In `src/App.tsx`, change:

```typescript
const useSpectralAnalysis = true; // Enable your technology
```

## What Gets Enhanced

When integrated, your technology enhances:

1. **HPSS Separation**: Uses spectral masks instead of simple filtering
2. **Stem Masking**: Better frequency-domain masks for each stem type
3. **Stem Extraction**: More accurate stem separation using your algorithms

## Interface Requirements

Your implementations must match these interfaces:

### SpectralFrame
```typescript
{
  frequencies: Float32Array;  // Frequency bins
  magnitude: Float32Array;     // Magnitude spectrum
  phase: Float32Array;         // Phase spectrum
  time: number;               // Timestamp in seconds
}
```

### SpectralAnalysisResult
```typescript
{
  frames: SpectralFrame[];
  averageMagnitude: Float32Array;
  peakFrequencies: number[];
  spectralCentroid: number;
  spectralRolloff: number;
  spectralFlux: Float32Array;
  harmonicContent: {
    fundamental: number | null;
    harmonics: number[];
    strength: number;
  };
}
```

### SpectralStemMask
```typescript
{
  mask: Float32Array;         // Frequency mask (0-1)
  confidence: number;         // Confidence score (0-1)
  stemType: 'vocals' | 'drums' | 'bass' | 'music' | 'perc' | 'harmonic' | 'sub';
}
```

## Fallback Behavior

If your integration is not available or fails:
- System falls back to base HPSS implementation
- Flow continues working normally
- No errors break the user experience

## Testing

1. Test with `useSpectralAnalysis = false` (base implementation)
2. Test with `useSpectralAnalysis = true` (your implementation)
3. Compare stem quality
4. Check console logs for integration status

## Benefits

- **Modular**: Can swap implementations without breaking Flow
- **Non-invasive**: Base system works without your technology
- **Flow-aligned**: Respects Flow principles (Reductionist, Flow, Mixx Recall)
- **Performance**: Only uses your technology when enabled

## Next Steps

1. Copy your prime-spectral-stem-lab code into the integration file
2. Map your functions to the interface
3. Test with sample audio
4. Enable in production when ready

---

**Flow Doctrine**: This integration preserves Flow principles - it enhances without replacing, it integrates without breaking, and it serves the creator's momentum.

