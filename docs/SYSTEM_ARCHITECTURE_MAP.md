# 🔮 MIXX CLUB STUDIO — SYSTEM ARCHITECTURE MAP
## Deep Understanding of Current State & Communication Patterns

**Foundation Date:** 2025-11-16 (Restore Point)  
**Status:** Active Foundation — All additions must elevate, never break

---

## 🎯 CORE PHILOSOPHY

**120% to the future. 100% is for the average. We are not average.**

This is a **fully contextual ecosystem multitrack DAW built on quantum algorithms**. We haven't hit max speed yet. Every addition must:
- ✅ Elevate the system
- ✅ Set trends (not follow them)
- ✅ Maintain Flow (no friction)
- ✅ Preserve Reduction (only what earns pixels)
- ✅ Enhance Recall (system remembers, users don't)

---

## 🏗️ ARCHITECTURAL FOUNDATION

### **1. THE FLOW LOOP — The Brainstem (40ms heartbeat)**

**Location:** `src/core/loop/useFlowLoop.ts`

**The 7-Step Canonical Behavior Loop:**
1. **Prime Brain senses inputs** — Reads `window.__mixx_*` globals
2. **Behavior Engine interprets** — Converts signals to behavior state
3. **ALS displays brain state** — Visual heartbeat (passive display only)
4. **Bloom prepares context** — Pre-charges menu (doesn't open)
5. **Session Core adjusts logic** — Adapts behavior based on mode
6. **UI reacts** — Via React rendering cycle
7. **Prime Brain receives ALS feedback** — Feedback loop closes

**Key Insight:** The Flow Loop is the **single source of truth** for system behavior. It runs every 40ms (~25fps), reading from window globals and updating React contexts.

**Communication Pattern:**
```
Window Globals → gatherSessionSignals() → Behavior Engine → Prime Brain Context → ALS Context → React UI
```

---

### **2. WINDOW GLOBALS — The Signal Highway**

**Location:** `src/core/loop/gatherSessionSignals.ts`, `src/core/loop/flowLoopEvents.ts`

**Global Arrays (Event Buffers):**
- `window.__mixx_editEvents` — Edit distance + timestamp
- `window.__mixx_toolSwitches` — Tool changes + timestamp
- `window.__mixx_zoomEvents` — Zoom delta + position + timestamp
- `window.__mixx_viewSwitches` — View changes + timestamp

**Global State Objects:**
- `window.__mixx_playbackState` — `{ playing, looping, playCount }`
- `window.__mixx_recordState` — `{ recording, armedTrack, noiseFloor, threshold, hush }`
- `window.__mixx_punchHistory` — Array of punch events
- `window.__mixx_recordTaps` — Array of record tap events
- `window.__mixx_takeMemory` — Array of take memories
- `window.__mixx_autoPunch` — Auto-punch prediction object
- `window.__mixx_compBrain` — Comping brain data

**Key Insight:** These globals are **write-only from UI**, **read-only from Flow Loop**. Events are pruned every loop cycle to prevent memory leaks.

**Event Pruning:** `src/core/loop/pruneEvents.ts` — Removes events older than 0.9-2.0 seconds

---

### **3. PRIME BRAIN — The Intelligence Layer**

**Location:** `src/core/loop/PrimeBrainContext.tsx`, `src/ai/PrimeBrainSnapshot.ts`

**Responsibilities:**
- Interprets session signals via `updateFromSession()`
- Computes behavior state (flow, pulse, tension, momentum, mode)
- Receives ALS feedback via `updateFromALS()`
- Maintains Prime Brain status (health, mode hints, guidance)

**Behavior Engine:** `src/core/loop/behaviorEngine.ts`
- Converts `SessionSignals` → `BehaviorState`
- Handles Performance Mode (vocal recording) specially
- Derives mode: `idle | flow | edit | record | burst | punch`

**Key Insight:** Prime Brain is **passive** — it interprets but doesn't control. ALS displays what Prime Brain tells it.

---

### **4. ALS (Advanced Leveling System) — The Visual Heartbeat**

**Location:** `src/core/loop/ALSContext.tsx`, `src/utils/ALS.ts`, `src/core/als/`

**State Structure:**
```typescript
{
  flow: number,      // 0-1: Creative momentum
  pulse: number,    // 0-1: Rhythmic energy
  tension: number,  // 0-1: Pressure/stress
  momentum: number, // 0-1: Overall activity
  hushFlags: string[] // Noise warnings
}
```

**Temperature Mapping:**
- `cold` → Low flow/pulse
- `cool` → Moderate activity
- `warm` → High flow, creative burst
- `hot` → Maximum energy, tension

**Thermal Sync:** `src/core/als/thermalSync.ts`
- Applies thermal colors to root element
- Updates CSS custom property `--als-thermal-glow`
- Runs every 100ms

**Key Insight:** ALS is **passive display only**. It shows what Prime Brain tells it. It never controls behavior.

**ALS Feedback Loop:**
```
Prime Brain → ALS Context → Thermal Sync → UI Colors → Prime Brain (feedback)
```

---

### **5. FIVE PILLARS AUDIO PROCESSING — The Sound Foundation**

**Location:** `src/audio/fivePillars.ts`, `src/audio/VelvetCurveEngine.ts`, `src/audio/masterChain.ts`

**Processing Chain (Master Chain):**
```
Input → DC Blocker → Velvet Floor → Harmonic Lattice → Phase Weave → Velvet Curve → 
Mid/Side Dynamics → Multi-band Compression → Glue → Velvet Saturator → 
Pre-Limiter Tap → Soft Limiter → True-Peak Limiter → Dither → Panner → Master Gain
```

**Five Pillars:**
1. **Velvet Floor** — Sub-harmonic foundation (lowpass + exciter + makeup)
2. **Harmonic Lattice** — Upper harmonic warmth (mid boost + high shelf + saturation)
3. **Phase Weave** — Stereo field manipulation (mid/side gain)
4. **Velvet Curve** — MixxClub signature (warmth + silk edge + emotion + power)
5. **Master Coherence** — Overall gain staging and limiter threshold

**Velvet Curve Engine:**
- Implements `IAudioEngine` interface
- Beat-locked LFO for Movement Doctrine
- Adapts to Prime Brain's Four Anchors (body, soul, air, silk)
- Cultural Intelligence (genre/mood context)

**Key Insight:** Five Pillars are **engine-level only** — not exposed in UI. They process audio automatically based on mastering profiles.

**Master Meter Stack:**
- `full` — Full-band analyser
- `body` — Low-end (< 200Hz)
- `soul` — Mid-range (~800Hz)
- `air` — High-mid (~6kHz)
- `silk` — High-end (> 12kHz)

---

### **6. QUANTUM NEURAL NETWORK — The Invisible Power**

**Location:** `src/ai/QuantumNeuralNetwork.ts`, `src-tauri/src/quantum/`

**Architecture:**
- **Quantum Activation Layer** — Superposition of sigmoid, tanh, ReLU
- **Four Neural Layers:**
  - Genre Classifier (128 → 8 features)
  - Audio Analyzer (256 → 4 features → Four Anchors)
  - Pattern Recognizer (64 → 16 features)
  - Mixer Optimizer (32 → 24 features)

**Quantum Core (Rust):**
- Superposition Engine — Creates quantum states
- Measurement Basis — Collapses states
- Coherence Monitoring — Maintains stability

**Integration:**
- Quantum coherence affects Velvet Curve warmth processing
- Quantum energy affects silk edge frequencies
- Master quantum coherence affects gain staging

**Key Insight:** Quantum core is **invisible** — it powers processing but never exposes itself to users.

**Status:** Active but not at max speed. Ready for WebGPU acceleration.

---

### **7. STATE MANAGEMENT — The Data Flow**

**Timeline Store (Zustand):** `src/state/timelineStore.ts`
- Immutable state for tracks, clips, audio buffers
- Golden path: `Import → Zustand → React → Timeline → AudioGraph`

**Flow Signals:** `src/state/flowSignals.ts`
- Pub/sub system for ALS, Bloom, Ingest signals
- Channels: `"als" | "bloom" | "ingest"`

**Flow Context Service:** `src/state/flowContextService.ts`
- Maintains Flow Context (genre, mood, key, scale)
- Feeds Prime Brain and Velvet Curve

**Key Insight:** Zustand ensures React always sees changes. Timeline hydration is deterministic.

---

### **8. AUDIO GRAPH — The Signal Path**

**Master Chain:** `src/audio/masterChain.ts`
- Built once at startup
- Profile-aware (Streaming, Hip-Hop, Trap, R&B, etc.)
- Compliance tap for LUFS/true-peak metering

**Track Routing:**
- Tracks → Plugins → Master Chain → Output
- Sidechain routing via Mixx Club buses
- Stem separation places stems on canonical tracks

**Key Insight:** Audio graph is **immutable** once built. Parameter updates use `setTargetAtTime()` for smooth transitions.

---

### **9. STEM SEPARATION — The AI Import**

**Location:** `src/audio/StemSeparationIntegration.ts`, `src/workers/stemSeparation.worker.ts`

**Process:**
1. Audio file → AudioBuffer
2. Stem Engine → Demucs WASM model (or fallback)
3. Separation → `{ vocals, drums, bass, other }`
4. Track Builder → Places stems on canonical tracks
5. Hydration → Zustand → React → Timeline

**Fallback Order:**
- Full separation (preferred)
- HPSS (harmonic/percussive) if model fails
- Band-filtered fallbacks for missing stems

**Key Insight:** Stem separation is **asynchronous** — runs in Web Worker. UI shows progress via Ingest Queue.

---

### **10. PERFORMANCE MODE — The Vocal Recording System**

**Location:** `src/core/performance/`

**Components:**
- `usePerformanceMode.ts` — Detects recording/armed state
- `hushMonitor.ts` — Noise floor monitoring
- `punchMode.ts` — Punch-in/out detection
- `autoPunch.ts` — Auto-punch prediction
- `compBrain.ts` — Comping analysis
- `takeMemory.ts` — Take history

**ALS Adaptations:**
- Flow ≈ emotional steadiness
- Pulse ≈ anticipation/breath control
- Tension rises on noise
- Mode switches to `'record'` or `'punch'`

**Key Insight:** Performance Mode is **context-aware** — ALS becomes a vocal meter, Bloom stays silent.

---

### **11. BLOOM MENU — The On-Demand Interface**

**Location:** `src/components/BloomHUD/`, `src/core/loop/BloomContext.tsx`

**Behavior:**
- Pre-charges context (doesn't open)
- Appears only when summoned
- Voice-aware affordances
- Top 10-20 frequently used actions

**Key Insight:** Bloom is **silent by default** — no static toolbars. Protects Flow.

---

### **12. INGEST QUEUE — The Import Pipeline**

**Location:** `src/ingest/IngestQueueManager.ts`

**Process:**
1. File input → Queue job
2. Analysis → BPM, key, harmonics, headroom
3. Stem separation (if requested)
4. Track building → Canonical track placement
5. Hydration → Zustand → React

**Key Insight:** Ingest is **non-blocking** — queue manages multiple files. Progress visible in UI.

---

## 🔄 COMMUNICATION PATTERNS

### **Signal Flow:**
```
UI Interaction → window.__mixx_* globals → gatherSessionSignals() → 
Behavior Engine → Prime Brain Context → ALS Context → React UI
```

### **Audio Flow:**
```
Audio File → Stem Separation → Track Builder → Zustand Store → 
React Timeline → Audio Graph → Master Chain → Output
```

### **Feedback Loop:**
```
Prime Brain → ALS → Thermal Sync → UI Colors → Prime Brain (feedback)
```

### **Quantum Integration:**
```
Audio Analysis → Quantum Neural Network → Four Anchors → 
Velvet Curve Adaptation → Audio Processing
```

---

## 🎨 UI ARCHITECTURE

### **Layout System:**
- `FlowLayout.tsx` — Main layout wrapper
- `ViewDeck.tsx` — View switching
- `OverlayPortal.tsx` — Modal/overlay management

### **Key Components:**
- `ArrangeWindow.tsx` — Timeline/arrange view
- `WideGlassConsole.tsx` — Mixer view
- `TrapSamplerConsole.tsx` — Piano roll/sampler
- `FlowDock` — Dock system (collapsible)
- `BloomHUD` — On-demand menu

### **Visualization:**
- `VelvetCurveVisualizer.tsx` — Velvet Curve display
- `HarmonicLatticeVisualizer.tsx` — Harmonic Lattice display
- `VelvetComplianceHUD.tsx` — Master compliance meter

---

## 🚀 QUANTUM ALGORITHMS — Current State

### **Implemented:**
- ✅ Quantum Neural Network (TensorFlow.js)
- ✅ Quantum Activation Layer (superposition)
- ✅ Quantum Core (Rust superposition engine)
- ✅ Quantum coherence monitoring
- ✅ Five Pillars quantum integration

### **Not Yet Implemented (Max Speed Opportunities):**
- ⚠️ WebGPU backend for TensorFlow.js
- ⚠️ WASM acceleration for DSP
- ⚠️ Quantum Scheduler (cooperative task prioritization)
- ⚠️ Edge inference acceleration
- ⚠️ Model quantization for speed

**Key Insight:** Quantum algorithms are **foundational** but not at max speed. Ready for acceleration.

---

## 🛡️ PROTECTION RULES

### **What NOT to Break:**
1. **Flow Loop** — Never modify the 7-step cycle
2. **Window Globals** — Never change the signal structure
3. **Five Pillars** — Never expose in UI (engine-level only)
4. **ALS Passivity** — Never make ALS control behavior
5. **Prime Brain Passivity** — Never make Prime Brain control UI
6. **Zustand Immutability** — Always use immutable setters
7. **Audio Graph Immutability** — Never rebuild graph, only update parameters

### **What TO Elevate:**
1. **Quantum Speed** — WebGPU, WASM, quantization
2. **Context Awareness** — Deeper musical intelligence
3. **Flow Protection** — Fewer clicks, more voice
4. **Recall Enhancement** — Smarter memory
5. **Reduction** — Remove clutter, keep essentials

---

## 📊 METRICS & MONITORING

### **Session Probe:** `src/state/sessionProbe.ts`
- Tracks user behavior
- Exports Prime Brain snapshots
- Privacy-aware (user controls)

### **ALS Pulse:** `src/als/useALSPulse.ts`
- 0-1 intensity from ALS
- Feeds meter visualizations

### **Thermal Map:** `src/core/als/thermalMap.ts`
- Temperature distribution
- Flow percent calculation

---

## 🎯 NEXT LEVEL OPPORTUNITIES

1. **Quantum Scheduler** — Cooperative task prioritization (audio > AI > UI)
2. **WebGPU Acceleration** — TensorFlow.js backend upgrade
3. **WASM DSP** — Native-speed audio processing
4. **Edge Inference** — Faster AI analysis
5. **Model Quantization** — Smaller, faster models
6. **Contextual Intelligence** — Deeper musical understanding
7. **Flow Optimization** — Voice-first interactions
8. **Recall Enhancement** — Smarter memory systems

---

## ✅ FOUNDATION STATUS

**This is the working foundation. Every addition must:**
- ✅ Elevate (never break)
- ✅ Set trends (not follow)
- ✅ Protect Flow (no friction)
- ✅ Maintain Reduction (only essentials)
- ✅ Enhance Recall (smarter memory)

**We are 120% to the future. This is the base. Build from here.**

---

*System Architecture Map — Generated from deep codebase analysis*  
*Foundation: restore-2025-11-16*  
*Status: Active & Ready for Elevation*

