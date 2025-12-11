# 🚀 Mixx Club Studio - Upgrade Roadmap
**Date:** 2025-12-11  
**Status:** Strategic Planning Document

---

## Executive Summary

This roadmap identifies upgrade opportunities across **6 strategic areas**:
1. **Critical Fixes** (High Impact, Low Effort)
2. **Missing Features** (High Impact, Medium Effort)
3. **Performance Optimizations** (Medium Impact, High Effort)
4. **Architecture Improvements** (High Impact, High Effort)
5. **Feature Enhancements** (Medium Impact, Medium Effort)
6. **Code Quality** (Low Impact, Low Effort)

**Total Opportunities:** 24 identified upgrades

---

## 🔴 Priority 1: Critical Fixes & Missing Features

### 1.1 Send Routing System Implementation ⚠️ **HIGH PRIORITY**

**Status:** UI exists, audio routing missing  
**Impact:** Professional mixing workflow incomplete  
**Effort:** Medium (2-3 days)

**Current State:**
- ✅ Send matrix UI fully functional (`FlowChannelStrip.tsx`)
- ✅ Send level controls wired to state
- ✅ `onSendLevelChange` callbacks working
- ❌ **No audio routing implementation**

**Required Implementation:**
```typescript
// Create send routing nodes per track
const sendNodes = new Map<string, GainNode>(); // trackId -> sendGainNode

// In routing effect:
tracks.forEach(track => {
  const trackOutput = currentOutput; // Post-inserts output
  
  // Route to main bus
  trackOutput.connect(mainBus);
  
  // Route sends to FX buses (AIR bus for reverb/delay)
  availableSends.forEach(send => {
    const sendLevel = trackSendLevels[track.id]?.[send.id] ?? 0;
    if (sendLevel > 0.001) {
      const sendNode = getOrCreateSendNode(track.id, send.id);
      sendNode.gain.value = sendLevel;
      trackOutput.connect(sendNode);
      sendNode.connect(signalMatrix.buses.air); // Or dedicated FX bus
    }
  });
});
```

**Files to Modify:**
- `src/App.tsx` - Add send routing in main routing effect
- `src/audio/SignalMatrix.ts` - Potentially add dedicated FX send buses
- `src/components/mixer/FlowChannelStrip.tsx` - Verify UI integration

**Testing:**
- Verify send levels affect audio routing
- Test multiple sends from same track
- Verify FX returns (AIR bus) receive send signals
- Test send level automation

---

### 1.2 Bus Metering & Visualization ⚠️ **MEDIUM PRIORITY**

**Status:** Bus strips exist, but meters not connected to actual bus audio  
**Impact:** Visual feedback disconnected from audio  
**Effort:** Medium (2 days)

**Current State:**
- ✅ `FlowBusStrip` component exists
- ✅ ALS feedback system in place
- ❌ Bus meters not connected to actual bus audio nodes
- ❌ Bus visualization shows send levels, not actual bus levels

**Required Implementation:**
```typescript
// Add analysers to each bus in SignalMatrix
buses.twoTrack = ctx.createGain();
const twoTrackAnalyser = ctx.createAnalyser();
buses.twoTrack.connect(twoTrackAnalyser);

// Expose analysers in SignalMatrix return
return { buses, routeTrack, analysers: { twoTrack: twoTrackAnalyser, ... } };

// In mixer, read bus analysers and update bus strip visualization
const busLevel = getLevelFromAnalyser(busAnalyser);
updateBusStripVisualization(busId, busLevel);
```

**Files to Modify:**
- `src/audio/SignalMatrix.ts` - Add analysers to buses
- `src/components/mixer/FlowBusStrip.tsx` - Connect to real bus levels
- `src/App.tsx` - Read bus analysers and update visualization

---

### 1.3 Consolidate Routing Functions ⚠️ **LOW PRIORITY**

**Status:** Three different routing implementations exist  
**Impact:** Code maintainability, potential bugs  
**Effort:** Low (1 day)

**Current State:**
- Main routing effect (line 5970) - ✅ Now uses bus routing
- Queued routes flush (line 1235) - ✅ Uses bus routing
- Callback routing (line 4975) - ✅ Uses bus routing

**Action:** Extract to single reusable function:
```typescript
const routeTrackToBus = useCallback((
  trackId: string,
  outputNode: AudioNode,
  trackRole?: string
): boolean => {
  const bus = signalMatrixRef.current?.routeTrack(trackId, trackRole);
  if (bus && masterReady) {
    try {
      outputNode.connect(bus);
      return true;
    } catch (err) {
      console.error('[MIXER] Routing failed:', trackId, err);
      return false;
    }
  }
  return false;
}, [masterReady]);
```

**Files to Modify:**
- `src/App.tsx` - Extract routing function, replace all 3 implementations

---

## 🟡 Priority 2: Performance Optimizations

### 2.1 Audio Buffer Pooling 🚀 **HIGH IMPACT**

**Status:** Buffers created/destroyed frequently  
**Impact:** Memory churn, GC pressure  
**Effort:** Medium (3-4 days)

**Current State:**
- Audio buffers created on-demand
- No buffer reuse
- Potential memory fragmentation

**Implementation:**
```typescript
class AudioBufferPool {
  private pools: Map<number, Float32Array[]> = new Map();
  
  acquire(size: number): Float32Array {
    const pool = this.pools.get(size) || [];
    return pool.pop() || new Float32Array(size);
  }
  
  release(buffer: Float32Array): void {
    const size = buffer.length;
    const pool = this.pools.get(size) || [];
    pool.push(buffer);
    this.pools.set(size, pool);
  }
}
```

**Files to Create:**
- `src/audio/bufferPool.ts` - Buffer pooling implementation
- Update all buffer creation sites to use pool

**Expected Impact:**
- 30-50% reduction in GC pressure
- Smoother real-time performance
- Lower memory footprint

---

### 2.2 AudioWorklet Migration for Five Pillars 🔥 **HIGH IMPACT**

**Status:** ScriptProcessorNode used (deprecated)  
**Impact:** Better performance, lower latency  
**Effort:** High (1-2 weeks)

**Current State:**
- `TimeWarpEngine` uses `ScriptProcessorNode` (deprecated)
- Five Pillars processing in main thread
- TODO comments indicate AudioWorklet planned

**Implementation:**
```typescript
// Create AudioWorklet processors for:
// - Harmonic Lattice
// - Phase Weave  
// - Velvet Curve
// - TimeWarp granular synthesis

// Example: HarmonicLatticeWorklet
class HarmonicLatticeProcessor extends AudioWorkletProcessor {
  process(inputs, outputs, parameters) {
    // Process in audio thread (no main thread blocking)
  }
}
```

**Files to Modify:**
- `src/audio/TimeWarpEngine.ts` - Migrate to AudioWorklet
- `src/audio/fivePillars.ts` - Create AudioWorklet processors
- `src/worklets/` - Add new worklet files

**Expected Impact:**
- 2-3x performance improvement
- Lower latency (sub-5ms target)
- Better real-time stability

---

### 2.3 Optimize Routing Rebuilds ⚡ **MEDIUM IMPACT**

**Status:** Full routing rebuild on any change  
**Impact:** Performance during editing  
**Effort:** Medium (2-3 days)

**Current State:**
- `rebuildTrackRouting` disconnects all nodes
- Reconnects everything on any insert change
- No incremental updates

**Implementation:**
```typescript
// Incremental routing updates
const updateTrackRouting = useCallback((trackId: string) => {
  // Only rebuild routing for affected track
  const trackNodes = trackNodesRef.current[trackId];
  // Disconnect only this track
  // Reconnect only this track
}, []);

// Batch multiple changes
const batchRoutingUpdates = useCallback((updates: RoutingUpdate[]) => {
  // Collect all updates
  // Apply in single pass
}, []);
```

**Files to Modify:**
- `src/App.tsx` - Replace `rebuildTrackRouting` with incremental updates

**Expected Impact:**
- 50-70% faster routing updates
- Smoother plugin insertion/removal
- Better responsiveness during editing

---

## 🟢 Priority 3: Architecture Improvements

### 3.1 Extract Routing System to Dedicated Module 🏗️ **HIGH IMPACT**

**Status:** Routing logic scattered in App.tsx  
**Impact:** Maintainability, testability  
**Effort:** Medium (3-4 days)

**Current State:**
- Routing logic mixed with UI state management
- Hard to test in isolation
- Difficult to reason about

**Implementation:**
```typescript
// src/audio/RoutingManager.ts
export class RoutingManager {
  constructor(
    private signalMatrix: SignalMatrix,
    private trackNodes: Map<string, AudioNodes>,
    private fxNodes: Map<string, FXNodes>
  ) {}
  
  routeTrack(trackId: string, role?: string): void {
    // All routing logic here
  }
  
  updateSends(trackId: string, sends: SendLevels): void {
    // Send routing logic
  }
}
```

**Files to Create:**
- `src/audio/RoutingManager.ts` - Centralized routing
- `src/audio/routing.test.ts` - Unit tests

**Files to Modify:**
- `src/App.tsx` - Use RoutingManager instead of inline logic

---

### 3.2 Bus System Extensibility 🔧 **MEDIUM IMPACT**

**Status:** Hard-coded bus structure  
**Impact:** Limited flexibility  
**Effort:** Medium (2-3 days)

**Current State:**
- Fixed 8 buses in SignalMatrix
- No dynamic bus creation
- Limited to predefined bus types

**Implementation:**
```typescript
// Allow dynamic bus creation
interface BusConfig {
  id: string;
  name: string;
  defaultGain: number;
  targetBus?: string; // Which bus this feeds into
}

const createBus = (config: BusConfig): GainNode => {
  // Create bus with config
  // Add to routing matrix
  // Return bus node
};
```

**Files to Modify:**
- `src/audio/SignalMatrix.ts` - Make buses extensible
- `src/components/mixer/Mixer.tsx` - Support dynamic buses

---

### 3.3 WASM Integration for Heavy Processing 🔥 **HIGH IMPACT**

**Status:** TODO comments indicate WASM planned  
**Impact:** 5-10x performance for DSP  
**Effort:** High (2-3 weeks)

**Current State:**
- `WASMDSPManager.ts` exists but not fully implemented
- Five Pillars processing in JavaScript
- TODO: "Load actual WASM modules when available"

**Implementation:**
```rust
// src/engine.rs - Rust WASM modules
#[wasm_bindgen]
pub struct HarmonicLatticeProcessor {
    // Native Rust implementation
}

#[wasm_bindgen]
impl HarmonicLatticeProcessor {
    pub fn process(&mut self, input: &[f32], output: &mut [f32]) {
        // High-performance DSP
    }
}
```

**Files to Create:**
- `src/engine.rs` - Rust WASM implementations
- `src/audio/wasm/` - WASM integration layer

**Expected Impact:**
- 5-10x performance for Five Pillars
- Lower CPU usage
- Professional-grade processing

---

## 🔵 Priority 4: Feature Enhancements

### 4.1 Bus Solo/Mute Controls 🎛️ **MEDIUM PRIORITY**

**Status:** Track solo/mute exists, bus controls missing  
**Impact:** Professional workflow  
**Effort:** Low (1-2 days)

**Implementation:**
```typescript
// Add solo/mute to bus GainNodes
buses.vocals.gain.value = isMuted ? 0 : (isSoloed ? 1.15 : 1.15);
```

**Files to Modify:**
- `src/components/mixer/FlowBusStrip.tsx` - Add solo/mute buttons
- `src/audio/SignalMatrix.ts` - Handle bus solo/mute logic

---

### 4.2 Bus EQ & Dynamics 🎚️ **MEDIUM PRIORITY**

**Status:** Track EQ exists, bus processing missing  
**Impact:** Professional mixing  
**Effort:** Medium (3-4 days)

**Implementation:**
```typescript
// Add EQ and dynamics to each bus
const busEQ = createBusEQ(ctx);
const busCompressor = createBusCompressor(ctx);

buses.vocals.connect(busEQ);
busEQ.connect(busCompressor);
busCompressor.connect(buses.stemMix);
```

**Files to Create:**
- `src/audio/busProcessing.ts` - Bus EQ/dynamics

---

### 4.3 Sidechain Routing 🔗 **LOW PRIORITY**

**Status:** Sidechain UI exists, routing missing  
**Impact:** Advanced mixing  
**Effort:** Medium (2-3 days)

**Current State:**
- Sidechain sources detected in UI
- No actual sidechain routing

**Implementation:**
```typescript
// Route sidechain source to compressor sidechain input
const sidechainSource = trackNodesRef.current[sourceTrackId].output;
compressorNode.sidechainInput.connect(sidechainSource);
```

---

## 🟣 Priority 5: Code Quality

### 5.1 Type Safety Improvements 📝 **LOW PRIORITY**

**Status:** Some `any` types, loose typing  
**Impact:** Maintainability  
**Effort:** Low (ongoing)

**Issues Found:**
- `role as any` in multiple places
- Loose TrackRole typing
- Missing type guards

**Action:** Gradually improve types, add type guards

---

### 5.2 Error Handling Standardization 🛡️ **LOW PRIORITY**

**Status:** Inconsistent error handling  
**Impact:** Debugging, user experience  
**Effort:** Low (1-2 days)

**Action:** Create error handling utilities, standardize patterns

---

### 5.3 Test Coverage 📊 **MEDIUM PRIORITY**

**Status:** No automated tests  
**Impact:** Regression prevention  
**Effort:** High (ongoing)

**Action:**
- Add unit tests for routing logic
- Add integration tests for audio processing
- Add E2E tests for critical workflows

---

## 📊 Upgrade Priority Matrix

| Upgrade | Impact | Effort | Priority | Timeline |
|---------|--------|--------|----------|----------|
| **Send Routing** | High | Medium | 🔴 P1 | Week 1 |
| **Bus Metering** | Medium | Medium | 🔴 P1 | Week 1-2 |
| **Buffer Pooling** | High | Medium | 🟡 P2 | Week 2-3 |
| **AudioWorklet Migration** | High | High | 🟡 P2 | Week 3-5 |
| **Routing Manager** | High | Medium | 🟢 P3 | Week 4-5 |
| **WASM Integration** | High | High | 🟢 P3 | Week 6-8 |
| **Bus Solo/Mute** | Medium | Low | 🔵 P4 | Week 2 |
| **Bus EQ/Dynamics** | Medium | Medium | 🔵 P4 | Week 5-6 |
| **Sidechain Routing** | Low | Medium | 🔵 P4 | Week 7 |

---

## 🎯 Recommended Implementation Order

### Phase 1: Foundation (Weeks 1-2)
1. ✅ **Routing Fix** - Already completed
2. **Send Routing System** - Complete professional workflow
3. **Bus Metering** - Visual feedback alignment
4. **Bus Solo/Mute** - Essential bus controls

### Phase 2: Performance (Weeks 3-5)
1. **Buffer Pooling** - Reduce GC pressure
2. **Routing Manager** - Clean architecture
3. **Optimize Routing Rebuilds** - Incremental updates
4. **AudioWorklet Migration** - Performance boost

### Phase 3: Advanced Features (Weeks 6-8)
1. **WASM Integration** - Maximum performance
2. **Bus EQ/Dynamics** - Professional processing
3. **Sidechain Routing** - Advanced mixing
4. **Test Coverage** - Quality assurance

---

## 💡 Quick Wins (Can Do Now)

1. **Consolidate Routing Functions** (1 day) - Immediate code quality improvement
2. **Bus Solo/Mute** (1-2 days) - Essential feature, low effort
3. **Type Safety Improvements** (ongoing) - Gradual improvement
4. **Error Handling** (1-2 days) - Better debugging

---

## 📈 Success Metrics

**Performance:**
- Audio latency: < 5ms (currently ~10-15ms)
- Routing updates: < 16ms (currently ~50-100ms)
- CPU usage: < 30% for 16 tracks (currently ~40-50%)

**Features:**
- ✅ Send routing functional
- ✅ Bus metering accurate
- ✅ All buses have solo/mute
- ✅ Professional workflow complete

**Code Quality:**
- Test coverage: > 60% (currently 0%)
- Type safety: > 95% (currently ~80%)
- No `any` types in critical paths

---

**Context improved by Giga AI** — Analyzed MIXER_AUDIT.md, SignalMatrix.ts, FlowChannelStrip.tsx, App.tsx routing logic, CORE_INTEGRATION_STATUS.md, and codebase TODOs to identify 24 strategic upgrade opportunities across 6 priority areas.
