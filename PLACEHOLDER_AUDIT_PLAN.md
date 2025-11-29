# 🔍 Placeholder Audit Plan - MixClub Studio

**Prime**, this is your comprehensive placeholder audit. Every placeholder, stub, and incomplete implementation has been catalogued with clear priorities and action items.

---

## 🎯 Quick Reference

**Immediate Actions** (Can do today):
- ✅ **DELETE** 8 unused empty component files (verified not imported)
- ✅ **FIX** ArrangeWindow TODOs (2 lines - insertCount, sendCount)
- ✅ **REMOVE** debug console.log statements (replace critical ones with ALS feedback)

**Critical Blockers** (Must fix before production):
- 🚨 TimeWarpEngine - Complete placeholder (pass-through)
- 🚨 Stem Separation Model - Using fake-demucs.wasm (silent stems)
- 🚨 PlaceholderAudioEngine - Generic pass-through for unregistered plugins

**Professional Features** (Affects quality):
- ⚠️ HPSS Algorithm - Simplified, needs proper STFT implementation
- ⚠️ AI Vocal Model - Placeholder fallback, needs real model
- ⚠️ Frequency Analysis - Simplified estimation, needs real FFT
- ⚠️ Beat-Locked LFO - Uses Date.now() instead of beat phase

**Polish Items** (Enhancement):
- 📝 PrimeBrainStub - Needs real backend connection
- 📝 Flow Loop Learning - Empty arrays, needs pattern recognition
- 📝 Velvet Curve Analysis - Returns random values

---

## 📊 Audit Summary

- **Critical Placeholders**: 8 (blocking core functionality)
- **Major Placeholders**: 12 (affects professional features)
- **Minor Placeholders**: 15+ (enhancements and polish)
- **Debug Artifacts**: 246 console.log statements (should be replaced with ALS feedback)

---

## 🚨 PRIORITY 1: Critical Placeholders (Must Fix)

These block core DAW functionality and must be addressed before production builds.

### 1. Audio Engine Placeholders

**Location**: `src/audio/TimeWarpEngine.ts`
- **Issue**: Complete placeholder - passes audio through unchanged
- **Impact**: TimeWarp FX does nothing when users expect time-stretching/pitch-shifting
- **Action**: Implement real time-stretch algorithm (e.g., Phase Vocoder or granular synthesis)
- **Dependencies**: None
- **Estimated Complexity**: High (requires DSP knowledge)

**Location**: `src/audio/plugins.ts` - `PlaceholderAudioEngine`
- **Issue**: Generic pass-through for unregistered plugins
- **Impact**: Unknown plugins don't process audio
- **Action**: Either implement plugin discovery OR fail gracefully with clear user messaging
- **Dependencies**: Plugin registry completion
- **Estimated Complexity**: Medium

### 2. Empty UI Components (UNUSED - DELETE)

**Status**: ✅ Verified unused - Safe to delete

These components exist but return empty divs and are NOT imported anywhere in the codebase. Following reductionist engineering principles, they should be deleted.

**Files to DELETE**:
- `src/components/Grid.tsx` - Empty placeholder (not imported)
- `src/components/Waveform.tsx` - Empty placeholder (not imported, actual WaveformRenderer exists)
- `src/components/Track.tsx` - Empty placeholder (not imported, TrackData types exist)
- `src/components/TransportControls.tsx` - Empty placeholder (not imported)
- `src/components/Playhead.tsx` - Empty placeholder (not imported, PlayheadPulse/BreathingPlayhead used instead)
- `src/components/Timeline.tsx` - Empty placeholder (not imported, useTimelineStore/TimelineNavigator used instead)
- `src/components/Ripples.tsx` - Empty placeholder (not imported)
- `src/components/mixer/Fader.tsx` - Empty placeholder (not imported, FlowFader/GlassFader used instead)

**Action**: DELETE all 8 files - they are dead code and add no value.

### 3. Stem Separation AI Model Placeholder

**Location**: `src/workers/stemSeparation.worker.ts`
- **Issue**: Uses `fake-demucs.wasm` - returns zeroed arrays
- **Impact**: Stem separation produces silent stems
- **Action**: 
  - Option A: Integrate real Demucs model (HTDemucs or similar)
  - Option B: Implement fallback DSP-based separation (HPSS + vocal extraction)
- **Dependencies**: Model loading infrastructure
- **Estimated Complexity**: High (AI model integration)

**Related Files**:
- `src/ai/models/fake-demucs.wasm` - Dummy file
- `src/ai/models/model.json` - Dummy model config

---

## ⚠️ PRIORITY 2: Major Placeholders (Affects Professional Features)

These impact professional workflows but have workarounds.

### 4. HPSS Algorithm - Simplified Implementation

**Location**: `src/core/import/hpss.ts`
- **Issue**: Uses simple high-pass/low-pass filters instead of proper HPSS
- **Current**: Frequency filtering (lines 34-86)
- **Expected**: STFT-based median filtering with iterative refinement
- **Impact**: Lower quality harmonic/percussive separation
- **Action**: Implement proper HPSS algorithm:
  1. Compute STFT
  2. Apply median filter in time domain (harmonic)
  3. Apply median filter in frequency domain (percussive)
  4. Iterate until convergence
  5. Reconstruct time-domain signals
- **Dependencies**: FFT library or Web Audio AnalyserNode
- **Estimated Complexity**: High

### 5. AI Vocal Model Integration

**Location**: `src/core/import/vocalModel.ts`
- **Issue**: Placeholder that hooks up to `window.__mixx_ai_vocal` (doesn't exist)
- **Current**: Fallback spectral subtraction (line 28-35)
- **Impact**: Vocal extraction quality is poor
- **Action**: 
  - Integrate real AI model (Spleeter, Demucs vocals, etc.)
  - OR improve spectral subtraction algorithm
- **Dependencies**: AI model infrastructure
- **Estimated Complexity**: Medium-High

### 6. Beat-Locked LFO Placeholder

**Location**: `src/core/beat-locked-lfo.ts`
- **Issue**: Uses `Date.now()` instead of actual beat phase
- **Impact**: Modulation not synchronized to tempo
- **Action**: 
  1. Connect to master clock/tempo system
  2. Calculate actual beat phase (0-1) from BPM and timeline position
  3. Use phase parameter for modulation
- **Dependencies**: Timeline/BPM system
- **Estimated Complexity**: Low-Medium

### 7. Frequency Analysis Placeholders

**Location**: `src/core/import/classifier.ts`
- **Issue**: Simplified frequency estimation instead of real FFT
  - Line 165: "Simple frequency domain analysis (placeholder for real FFT)"
  - Line 190: "Estimate frequency band energy (simplified - placeholder for real FFT)"
  - Line 198: "Placeholder: use autocorrelation to estimate dominant frequency"
- **Impact**: Less accurate audio classification
- **Action**: Implement proper FFT-based analysis using AnalyserNode or FFT library
- **Dependencies**: FFT implementation
- **Estimated Complexity**: Medium

**Location**: `src/types/sonic-architecture.ts`
- **Issue**: Lines 119-126, 157-163 - Placeholder Velvet Curve analysis
- **Current**: Random values (line 125: `Math.floor(Math.random() * 80) + 20`)
- **Impact**: Velvet Curve analysis returns fake data
- **Action**: Implement real frequency band analysis using FFT
- **Dependencies**: FFT implementation
- **Estimated Complexity**: Medium

### 8. PrimeBrainStub - Plugin System Integration

**Location**: `src/plugins/suite/lib/PrimeBrainStub.ts`
- **Issue**: Stub implementation that logs events but doesn't persist/analyze
- **Current**: In-memory event log (lines 55-62)
- **Impact**: Prime Brain doesn't learn from plugin usage
- **Action**: 
  - Connect to real Prime Brain backend/service
  - OR implement local learning/memory system
- **Dependencies**: Prime Brain service architecture
- **Estimated Complexity**: Medium

**Used By**: All plugin components in `src/plugins/suite/components/plugins/`

### 9. ArrangeWindow TODOs

**Location**: `src/components/ArrangeWindow.tsx`
- **Issue**: Lines 1679-1680
  ```typescript
  insertCount={0} // TODO: Get from inserts data
  sendCount={0} // TODO: Get from sends data
  ```
- **Impact**: Track headers show wrong insert/send counts
- **Action**: Pull actual insert/send counts from track state
- **Dependencies**: Track state structure
- **Estimated Complexity**: Low

### 10. Flow Loop Learning Placeholders

**Location**: `src/core/loop/useFlowLoop.ts`
- **Issue**: Lines 140-141
  ```typescript
  commonActions: [], // TODO: Learn from user patterns
  predictions: [], // TODO: Predict next steps
  ```
- **Impact**: Bloom Menu can't adapt to user behavior
- **Action**: Implement pattern learning system
- **Dependencies**: User action tracking, ML model (optional)
- **Estimated Complexity**: Medium-High

---

## 📝 PRIORITY 3: Minor Placeholders (Polish & Enhancement)

These don't block functionality but should be addressed for professional polish.

### 11. PlaceholderPlugin Component

**Location**: `src/plugins/suite/components/plugins/PlaceholderPlugin.tsx`
- **Issue**: Visual placeholder for plugins without implementations
- **Current**: Shows gradient animation and description
- **Impact**: Users see "placeholder" plugins in browser
- **Action**: Either:
  - Hide these from plugin browser until implemented
  - OR convert to "Coming Soon" with clear messaging
- **Estimated Complexity**: Low

### 12. Console.log Statements

**Location**: Throughout codebase (246 instances)
- **Issue**: Debug logging should route through ALS feedback system
- **Impact**: Console clutter, no visual feedback for users
- **Action**: 
  - Replace critical logs with ALS pulse/visual feedback
  - Remove unnecessary logs
  - Keep only error logging for production
- **Estimated Complexity**: Low (but time-consuming)

**Key Files with Many Logs**:
- `src/App.tsx` - 100+ console.log statements
- `src/components/ArrangeWindow.tsx` - Multiple debug logs

### 13. Analysis Stub Comments

**Location**: `src/core/import/analysis.ts`
- **Issue**: Line 16 - "Basic timing analysis stub"
- **Current**: Pass-through function (lines 20-30)
- **Impact**: Minimal - function works but doesn't enhance data
- **Action**: Implement BPM/key detection if not already done upstream
- **Estimated Complexity**: Low-Medium

### 14. StemDebugHUD Placeholder

**Location**: `src/components/ALS/StemDebugHUD.tsx`
- **Issue**: Line 22 - "Minimal placeholder that doesn't break the UI"
- **Action**: Review if this component is needed; remove if not used
- **Estimated Complexity**: Low

### 15. WideGlassConsole Placeholder

**Location**: `src/components/mixer/WideGlassConsole.tsx`
- **Issue**: Line 41 - `<div className="console-placeholder">`
- **Action**: Check if this is intentional empty state or needs implementation
- **Estimated Complexity**: Low

---

## 🎯 Implementation Priority Matrix

| Priority | Component | Complexity | Impact | Dependencies |
|----------|-----------|------------|--------|--------------|
| P1 | TimeWarpEngine | High | High | None |
| P1 | Stem Separation Model | High | High | Model infrastructure |
| P1 | Empty UI Components | Low | Medium | Code review |
| P2 | HPSS Algorithm | High | Medium | FFT library |
| P2 | Vocal AI Model | Medium-High | Medium | AI infrastructure |
| P2 | Beat-Locked LFO | Low-Medium | Low | Timeline/BPM |
| P2 | Frequency Analysis | Medium | Medium | FFT implementation |
| P2 | PrimeBrainStub | Medium | Medium | Prime Brain service |
| P2 | ArrangeWindow TODOs | Low | Low | Track state |
| P3 | Console.log Cleanup | Low | Low | ALS feedback |
| P3 | PlaceholderPlugin | Low | Low | UI decision |
| P3 | Flow Loop Learning | Medium-High | Low | ML/Patterning |

---

## 📋 Recommended Execution Order

### Phase 1: Critical Cleanup (Week 1)
1. **Audit empty UI components** - Delete unused, identify used ones
2. **Fix ArrangeWindow TODOs** - Quick wins (insertCount, sendCount)
3. **Replace console.log** - Critical errors → ALS, remove debug logs
4. **Review PlaceholderPlugin** - Hide or remove from browser

### Phase 2: Core Audio (Week 2-3)
5. **Implement proper HPSS** - Professional separation quality
6. **Fix beat-locked LFO** - Connect to timeline clock
7. **Improve frequency analysis** - Real FFT implementation
8. **Velvet Curve real analysis** - Replace random values

### Phase 3: Advanced Features (Week 4+)
9. **TimeWarp Engine** - Real time-stretch implementation
10. **Stem Separation Model** - Integrate real AI or better DSP fallback
11. **Vocal AI Model** - Integrate or improve spectral subtraction
12. **PrimeBrain Integration** - Connect stub to real service
13. **Flow Loop Learning** - Pattern recognition system

---

## ✅ Verification Checklist

After each placeholder is addressed:

- [ ] **Functionality Test**: Component/function works as expected
- [ ] **No Placeholder Code**: Remove all placeholder comments/stubs
- [ ] **Error Handling**: Proper fallbacks and user messaging
- [ ] **Performance**: No performance regressions
- [ ] **ALS Feedback**: User-visible feedback replaces console.log
- [ ] **Flow Preserved**: No friction added to workflows
- [ ] **Documentation**: Code comments explain what it does and why

---

## 🔧 Tools & Resources Needed

### Audio Processing Libraries
- FFT implementation (e.g., `fft.js`, `dsp.js`, or Web Audio AnalyserNode)
- Time-stretch algorithm (Phase Vocoder or Granular Synthesis)
- Advanced HPSS algorithm reference

### AI Models
- Demucs for stem separation
- Spleeter or similar for vocal extraction
- Model loading infrastructure

### Infrastructure
- Prime Brain service/API connection
- Pattern learning system (ML or rule-based)

---

## 📝 Notes

- **Reductionist Principle**: Delete unused placeholder components rather than implementing them
- **Flow Principle**: Ensure fixes don't add friction
- **ALS Feedback**: Replace console.log with visual feedback where appropriate
- **Working > Pretty**: Prioritize functional implementations over perfect polish

---

**Next Steps**: 
1. Review this audit with Prime
2. Prioritize based on current sprint goals
3. Assign complexity estimates
4. Begin Phase 1 cleanup

---

*Audit Date: 2025-01-XX*
*Total Placeholders Identified: 35+*
*Critical Blockers: 8*

