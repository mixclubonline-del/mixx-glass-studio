# Mixer Review & Connectivity Audit
**Date:** 2025-12-11  
**Scope:** Mixer architecture, audio routing, bus connectivity, and signal flow

---

## Executive Summary

The mixer system has a **critical connectivity issue**: tracks are bypassing the bus routing system and connecting directly to master, despite a well-designed SignalMatrix bus architecture. This breaks the intended stem-based mixing workflow (Two Track → Vocals → Drums → Bass → Music → Stem Mix → Master).

**Severity:** High — Core routing logic inconsistent with architecture

---

## Architecture Overview

### Signal Flow (Intended)
```
Track Input → Pre-fader Meter → Gain → Panner → Inserts → Analyser
                                                              ↓
                                                          Bus Routing
                                                              ↓
                    ┌─────────────────────────────────────────┴──────────────┐
                    │                                                         │
              Two Track Bus                                              Vocals Bus
                    │                                                         │
              Drums Bus                                                  Bass Bus
                    │                                                         │
              Music Bus                                                       │
                    │                                                         │
                    └───────────────────┬───────────────────────────────────┘
                                         │
                                    Stem Mix Bus
                                         │
                                    Master Tap
                                         │
                                    Master Chain
                                         │
                                    Output
```

### Current Implementation

**SignalMatrix** (`src/audio/SignalMatrix.ts`):
- ✅ Properly defines 8 buses: `twoTrack`, `vocals`, `drums`, `bass`, `music`, `stemMix`, `masterTap`, `air`
- ✅ Correctly routes buses: All stem buses → `stemMix` → `masterTap` → `masterInput`
- ✅ `routeTrack()` function intelligently maps tracks to buses based on track ID and role
- ✅ Default gain staging configured per bus

**Master Chain** (`src/audio/masterChain.ts`):
- ✅ Complete Five Pillars processing chain
- ✅ Multi-band metering (Body, Soul, Air, Silk)
- ✅ True peak limiting and dither
- ✅ Profile-based mastering presets

**Mixer UI** (`src/components/mixer/Mixer.tsx`):
- ✅ Professional channel strips with ALS feedback
- ✅ Bus visualization support
- ✅ Send matrix view
- ✅ Plugin insert management

---

## Critical Issues

### 🔴 Issue #1: Direct Master Connection (High Priority)

**Location:** `src/App.tsx:5927-5970`

**Problem:**
```typescript
// Current code - BYPASSES BUS SYSTEM
tracks.forEach(track => {
    // ... processing chain ...
    currentOutput.connect(trackNodes.analyser);
    
    // ❌ WRONG: Direct connection to master
    if (masterInput && masterReady) {
        currentOutput.connect(masterInput);
    }
});
```

**Impact:**
- Tracks skip bus routing entirely
- SignalMatrix buses are created but unused in main routing path
- Stem-based mixing workflow broken
- Bus gain staging ignored
- Bus metering/visualization disconnected from actual signal

**Expected:**
```typescript
// Should route through SignalMatrix
const bus = signalMatrixRef.current?.routeTrack(track.id, track.role);
if (bus && masterReady) {
    currentOutput.connect(bus);
} else if (masterReady) {
    // Fallback to direct master only if bus system unavailable
    currentOutput.connect(masterInput);
}
```

**Evidence:**
- Queued routes flush (line 1235) correctly uses `routeTrack()`
- Another callback (line 4975) correctly uses `routeTrack()`
- Main routing effect (line 5956) bypasses it

---

### 🟡 Issue #2: Inconsistent Routing Paths (Medium Priority)

**Location:** Multiple routing points in `src/App.tsx`

**Problem:**
Three different routing implementations exist:

1. **Main routing effect** (line 5956): Direct to master ❌
2. **Queued routes flush** (line 1235): Uses bus routing ✅
3. **Callback routing** (line 4975): Uses bus routing ✅

**Impact:**
- Unpredictable behavior during initialization
- Tracks may route differently depending on timing
- Debugging complexity

**Recommendation:**
Consolidate to single routing function that always uses SignalMatrix when available.

---

### 🟡 Issue #3: Bus Send System Not Connected (Medium Priority)

**Location:** `src/components/mixer/FlowChannelStrip.tsx:1836-2058`

**Problem:**
- Send matrix UI exists and is functional
- `onSendLevelChange` callbacks are wired
- **But:** No audio routing implementation for sends found

**Impact:**
- Send controls appear but don't affect audio
- FX returns (AIR bus) may not receive send signals
- Professional mixing workflow incomplete

**Investigation Needed:**
- Search for send routing implementation
- Verify if sends connect to AIR bus or separate FX buses
- Check if send levels control GainNodes in routing graph

---

### 🟢 Issue #4: Pre-fader Meter Tap (Low Priority - Documentation)

**Location:** `src/App.tsx:5934`

**Status:** ✅ Correctly implemented
```typescript
trackNodes.input.connect(trackNodes.preFaderMeter);
```

**Note:** This is Step 1 of Flow Meter Stack. Master multi-band meters (Step 2) are also correctly implemented in `masterChain.ts`.

---

## Connectivity Map

### Current State (Broken)
```
Track → Gain → Panner → Inserts → Analyser → [DIRECT TO MASTER] ❌
                                                      ↓
                                              Master Chain
```

### Intended State (Fixed)
```
Track → Gain → Panner → Inserts → Analyser → Bus (via routeTrack) ✅
                                                      ↓
                                              Stem Mix → Master Tap
                                                      ↓
                                              Master Chain
```

---

## Recommendations

### Immediate Actions

1. **Fix Main Routing** (Critical)
   - Update `src/App.tsx:5956` to use `signalMatrixRef.current?.routeTrack()`
   - Ensure all tracks route through buses before master
   - Test with multiple tracks of different roles

2. **Verify Bus Initialization Order**
   - Confirm SignalMatrix is created before routing attempts
   - Ensure `masterReady` gate includes SignalMatrix readiness
   - Add error handling for missing SignalMatrix

3. **Implement Send Routing**
   - Create send routing nodes (GainNodes per send)
   - Connect sends to appropriate buses (AIR for FX, or dedicated send buses)
   - Wire send levels to GainNode.gain.value

### Code Changes Required

**File:** `src/App.tsx`  
**Function:** Main routing effect (around line 5927)

```typescript
// BEFORE (line 5954-5959)
if (masterInput && masterReady) {
  try {
    currentOutput.connect(masterInput);
  } catch (err) {
    console.error('[MIXER] Failed to connect track to master:', track.id, err);
  }
}

// AFTER
const bus = signalMatrixRef.current?.routeTrack(track.id, track.role);
if (bus && masterReady) {
  try {
    currentOutput.connect(bus);
  } catch (err) {
    console.error('[MIXER] Failed to connect track to bus:', track.id, err);
    // Fallback to direct master if bus routing fails
    if (masterInput) {
      currentOutput.connect(masterInput);
    }
  }
} else if (masterInput && masterReady) {
  // Fallback: direct to master if SignalMatrix unavailable
  try {
    currentOutput.connect(masterInput);
  } catch (err) {
    console.error('[MIXER] Failed to connect track to master:', track.id, err);
  }
}
```

---

## Testing Checklist

- [ ] Tracks route to correct buses based on role
- [ ] Bus gain staging affects final mix
- [ ] Stem Mix bus receives all stem buses
- [ ] Master Tap receives Stem Mix + AIR
- [ ] Master chain receives signal from Master Tap
- [ ] Pre-fader meters show input levels
- [ ] Post-insert analysers show processed levels
- [ ] Master multi-band meters show Body/Soul/Air/Silk
- [ ] Send controls affect audio routing (if implemented)
- [ ] Bus visualization matches actual routing

---

## Positive Findings

✅ **SignalMatrix Architecture:** Well-designed bus system with proper gain staging  
✅ **Master Chain:** Complete Five Pillars implementation with multi-band metering  
✅ **UI Components:** Professional mixer interface with ALS feedback  
✅ **Error Handling:** Queued routes system prevents connection errors  
✅ **Metering:** Pre-fader and multi-band master meters correctly implemented  

---

## Next Steps

1. **Prime Review:** Confirm bus routing fix aligns with Mixx Club workflow
2. **Implementation:** Apply routing fix to main effect
3. **Testing:** Verify all tracks route correctly through buses
4. **Send System:** Investigate and implement send routing if needed
5. **Documentation:** Update architecture docs with corrected signal flow

---

**Context improved by Giga AI** — Used SignalMatrix.ts, masterChain.ts, Mixer.tsx, FlowChannelStrip.tsx, and App.tsx routing logic to identify connectivity gaps between intended bus architecture and actual implementation.
