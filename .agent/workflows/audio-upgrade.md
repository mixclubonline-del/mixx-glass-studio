---
description: Multi-Agent Audio Engine Upgrade Workflow
---

# 🔊 Multi-Agent Audio Engine Upgrade Workflow

This workflow orchestrates multiple specialized agents to enhance the Flow DAW audio engine with advanced DSP capabilities (Sidechaining, Parallel Processing, Dynamic EQ, etc.).

## 🤖 Agent Roles

1.  **Lead Architect (Lead):** Designs the signal routing logic and motherboard architecture.
2.  **DSP Engineer:** Implements the math, Web Audio nodes, and internal engine logic.
3.  **Integration Agent:** Wires the new engines into the React lifecycle and `SignalMatrix`.
4.  **Aesthetics Designer:** Creates the visual controls (knobs, sliders) and real-time visualizations.
5.  **QA/Mastering Monitor:** Validates signal hierarchy, LUFS compliance, and performance.

## 🛠️ Phase 1: Signal Blueprint (Lead Architect)
Analyzing the existing routing in `SignalMatrix.ts` and `masterChain.ts`.

1.  Identify the slot for the new improvement (e.g., Pre-Master, Bus-Level, or Insert).
2.  Define the I/O interface for the new Engine class.
3.  Create a technical specification for the DSP Engineer.

## ⚡ Phase 2: Core DSP Development (DSP Engineer)
Implementing the actual audio processing logic.

1.  Create the new engine file in `src/audio/` (e.g., `MixxSidechainEngine.ts`).
2.  Implement the Web Audio Node graph (Gain, Compressor, BiquadFilter, etc.).
3.  Ensure 100% coherence with the **Five Pillars Doctrine**.

## 🔌 Phase 3: Integration & Wiring (Integration Agent)
Connecting the new engine to the global state.

1.  Update `createSignalMatrix` or `buildMasterChain` to instantiate the new engine.
2.  Expose control methods to the `audioContextManager` or `App.tsx`.
3.  Connect existing AI anchors (Prime Brain) to the new parameters.

## 🎨 Phase 4: Visual Controls (Aesthetics Designer)
Building the UI for the new feature.

1.  Add new controls to the `Mixer` or `PluginBrowser` interface.
2.  Implement real-time visualizations (Gain Reduction, Frequency Curves).
3.  Apply AURA glass styling to all new elements.

## ✅ Phase 5: Validation (QA Agent)
Ensuring the engine is production-ready.

1.  Check for clicking/popping during parameter changes.
2.  Validate true-peak compliance across the master chain.
3.  Stress test CPU usage for complex routing.

---

// turbo
## 🚀 To Start Implementation:
Run `/audio-upgrade` followed by the feature name (e.g., `/audio-upgrade sidechain`).
