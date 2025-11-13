# MixxEngine Audio I/O Prototype Plan (macOS Focus – Nov 13 2025)

Objective: Prove the Rust-powered MixxEngine core can deliver glitch-free, ultra-low latency audio on macOS while remaining JUCE-compatible. Serves as P-1 milestone in the hybrid architecture roadmap.

---

## Target Environment
- **OS:** macOS 14+ (Apple Silicon priority, Intel validation optional)
- **Rust Toolchain:** stable (1.73+) with nightly optional for SIMD experiments
- **Audio Backend:** `cpal` (CoreAudio host)
- **Bridge Layer:** C ABI exposed via `cxx` or `ffi-support`
- **JUCE Host:** Minimal C++ runner (Xcode project) invoking Rust pass-through

---

## Deliverables
1. **Rust crate `mixxengine-core`**
   - Opens duplex CoreAudio stream at 48 kHz, 64-sample buffer.
   - Processes audio via callback that simply copies input → output (proof of latency).
   - Exposes `extern "C"` functions:
     - `mixx_engine_init(sample_rate, buffer_size)`
     - `mixx_engine_start()`
     - `mixx_engine_stop()`
     - `mixx_engine_shutdown()`
   - Emits structured logs (ring buffer) for latency stats.
2. **C++/JUCE shim (`MixxEngineHost`)**
   - Uses JUCE `AudioAppComponent` to request same buffer settings.
   - Loads Rust symbols (static link or dylib) and forwards JUCE callbacks.
   - Displays minimal ALS-style health indicator (green if callbacks within deadline).
3. **Latency & Stability Report**
   - Capture round-trip latency, xrun counts, CPU usage.
   - Document methodology (buffer settings, hardware).

---

## Work Breakdown
| Step | Scope | Details |
| --- | --- | --- |
| P-1A | Rust audio harness | Scaffold crate, configure `cpal`, implement callback, add ring buffer for metrics. |
| P-1B | C ABI + bindings | Generate `cbindgen` header, expose safe wrapper via `ffi-support`. |
| P-1C | JUCE host app | Minimal JUCE project linking Rust static lib; request 64 buffer, 48 kHz. |
| P-1D | Stability run | Execute 30-minute loopback test; log dropouts, latency histogram. |
| P-1E | Report | Summarize findings; note hardware, OS, buffer, CPU load, comparison vs native JUCE stub. |

---

## Instrumentation & Metrics
- **Callback duration:** measure Rust audio callback execution time (nanoseconds).
- **Round-trip latency:** feed impulse through loopback, measure return via Juce meter.
- **XRuns:** track CoreAudio device callbacks where deadline missed.
- **CPU utilisation:** sample via macOS `host_statistics64`.

---

## Risks & Mitigations
- **FFI overhead:** keep wrappers zero-copy; consider direct pointer access. Validate with bench harness.
- **Buffer underruns:** if 64-sample fails, step through 128 → 96 → 64 after optimising thread priorities.
- **Build tooling:** create `Makefile` or `cargo xtask` for cross-language build to keep Prime Fabric isolated.

---

## Next Steps After P-1
- Implement SIMD-heavy DSP benchmark (P-2).
- Introduce lock-free parameter bus (P-3).
- Wire JUCE UI control → Rust parameter update via ALS-aware conduit (P-4).

Maintainer: Standards Architect (Prime directive). Update as experiments progress.


