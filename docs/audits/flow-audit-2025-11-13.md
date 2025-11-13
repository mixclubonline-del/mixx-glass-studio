# Flow Audit – 2030 Stack Alignment (Nov 13 2025)

## Purpose
- Capture the current state of FLOW (Feel, Listen, Operate, Work) across Studio runtime versus Prime Fabric.
- Identify doctrine risks (Reductionist Engineering, Flow, Mixx Recall, ALS, Bloom Menu discipline).
- Spotlight opportunities to reach quantum-speed production readiness.

## Scope
- Timeline surface (`src/components/ArrangeWindow.tsx`, `src/components/timeline/TimelineNavigator.tsx`).
- Flow instrumentation (`src/hooks/useArrange.ts`, `src/hooks/useSessionProbe.ts`, `src/state/sessionProbe.ts`, `src/state/flowSignals.ts`).
- AI stack (`src/ai/PrimeBrainSnapshot.ts`, `src/ai/QuantumNeuralNetwork.ts`, `src/ai/usePrimeBrainExporter.ts`).
- Runtime shell (`src/App.tsx`) for ALS/Bloom orchestration.
- Prime Fabric boundary (`prime-fabric/prime-brain/src/**`).

Documented by: Standards Architect (Prime’s directive)  
Why it exists: Foundation evidence for FLOW Standards Blueprint step 2.

---

## Feel (Emotive Surface)
**Observations**
- Arrangement view leans on Tailwind glass aesthetic with ALS tinting hooks, but clip density and headers still expose engineering constructs (e.g., `DEFAULT_TRACK_LANE_HEIGHT`, static automation toggles).  
- `TimelineNavigator` uses static thumb with `Follow On/Off` text—no dynamic ALS glow attenuation or gesture anticipation.  
- ALS derivation (`deriveTrackALSFeedback`) is present yet only consumed for color selection; no holistic mood state (temperature/pulse) broadcast back into UI transitions.

**Risks**
- Visual intensity lacks cross-component synchronization, risking fragmented feel cues.  
- No persona-level theming (artist intent) driving viewport layout.  
- Bloom presence is opt-in, not emotionally staged based on ALS tension.

**Opportunities**
- Route `TrackALSFeedback.pulse` into clip halo shaders and navigator thumb breathing.  
- Introduce session-level “Feel Scenes” driven by ALS temperature to auto-adjust glass opacity, blur depth, and Bloom summons.

## Listen (Sensing & ALS Feedback)
**Observations**
- `useSessionProbe` and `flowSignals` capture timeline scroll/zoom, ALS, Bloom, and ingest signals, but require env flag (`VITE_SESSION_PROBE`)—telemetry off by default.  
- Prime Brain snapshot builder clamps ALS channels but never feeds back predictive cues into session probe or scheduler.  
- `QuantizeSeconds` logic in `ArrangeWindow` drives snapping without ALS histograms or velocity curves.

**Risks**
- Without always-on sensing, ALS cannot guarantee creator-level awareness.  
- Session probe does not track gesture velocity, focus time, or Bloom dismissals—critical for contextual listening.  
- Prime Brain omits end-to-end latency attribution per subsystem (audio graph vs inference vs UI), limiting optimization.

**Opportunities**
- Force-enable probe in Studio builds; gate logs behind ALS privacy rather than build flags.  
- Extend `SessionProbeContext` with ALS deltas, gesture cadence, and automation lane focus.  
- Feed Prime Brain harmonic tension directly into flow signals to pre-stage asset loading.

## Operate (Adaptive Control)
**Observations**
- `useArrange` manages clip operations with deterministic math; minimal predictive assistance.  
- Automation lane exposure is boolean per track; no context-aware toggling when tension spikes or CPU load drops.  
- Zoom navigator lacks command palette integration—Bloom Menu not auto-populating with relevant actions after scroll gestures.

**Risks**
- Operators must micromanage layout; system reacts, never anticipates.  
- No scheduling tier ensures quantum-speed: clip duplication, warp, and auto-crossfade run on main thread without WASM acceleration or priority queues.

**Opportunities**
- Introduce adaptive lane reflow (auto-collapse low-ALS tracks, stretch high-ALS ones).  
- Offload crossfade/zero-cross detection to WASM workers tied to ALS urgency.  
- Bloom Menu should observe recent Session Probe data and surface macros proactively.

## Work (Sustained Throughput)
**Observations**
- `App.tsx` orchestrates numerous engines (Velvet, Harmonic Lattice, Stem Separation) synchronously—promise chains without explicit scheduler.  
- Quantum Neural Network wraps TensorFlow.js in-browser with console logs; no model lifecycle management (versioning, prefetch, edge inference).  
- Prime Fabric exists separately, but Studio runtime imports no Fabric modules—boundary respected yet no automated artifact validation.

**Risks**
- Without central scheduler, concurrency spikes (stem separation + Bloom inference) will stutter.  
- TensorFlow.js path implies CPU-heavy inference; GPU/WebGPU acceleration not the default.  
- Lack of artifact handshake risks stale Prime Brain weights in Studio.

**Opportunities**
- Establish real-time orchestrator mediating audio/DSP, AI inference, and UI transitions with deterministic budgets.  
- Adopt WebGPU backend (tfjs-backend-webgpu) with quantized models to hit quantum-speed targets.  
- Create signed artifact manifest from Prime Fabric; Studio verifies before loading Prime Brain assets.

---

## Prime Fabric Boundary
- No runtime imports of `prime-fabric/**`; Fabric retains training pipelines.  
- Need explicit export contract (manifest + checksum) to stop accidental drift when Studio requests Prime Brain updates.

---

## Immediate Recommendations
1. **Enable Always-On Sensing:** Remove `VITE_SESSION_PROBE` guard for Studio builds; introduce ALS-governed redaction instead.  
2. **Context Mesh Draft:** Design a Flow Context Service layering ALS telemetry, gesture history, and harmonic tension for Bloom/Prime Brain consumption.  
3. **Quantum Scheduler Spike:** Prototype cooperative scheduler coordinating Arrange ops, ALS rendering, and AI inference with sub-16ms slices.  
4. **Feel Sync:** Standardize ALS-to-UI handoffs (pulse → animation, temperature → glass opacity, momentum → scroll easing).  
5. **Fabric Artifact Contract:** Define manifest schema + signature process; Studio refuses unsigned/expired Prime Brain weights.

---

## Next Steps Toward Standards
- Feed these findings into the FLOW Doctrine Matrix (Step 2) to convert risks/opportunities into enforceable rules.  
- Align enforcement hooks (Step 3) with the immediate recommendations above.


