---
description: Rust DSP Engine - Advanced Phases Multi-Agent Workflow
---

# Rust DSP Engine: Phases 20-23 Multi-Agent Workflow

This workflow orchestrates 4 parallel agent tracks to complete the advanced audio engine features. Each phase can be worked on independently after the prerequisites are met.

## Prerequisites
- Phases 2-19 complete with zero-warning build
- `mixx_plugins.rs` contains 14 plugin implementations
- All plugins implement `AudioProcessor` trait

---

## Phase 20: Master Chain Orchestrator

**Goal:** Wire all plugins into a unified mastering chain in Rust, mirroring `masterChain.ts`.

### Steps:

1. Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/master_chain.rs`

2. Define `MasterChain` struct with the following stages:
   ```rust
   pub struct MasterChain {
       // Stage 1: Input conditioning
       dc_blocker: DcBlocker,
       
       // Stage 2: Sonic pillars
       velvet_floor: VelvetCurve,
       harmonic_lattice: HarmonicLattice,
       phase_weave: PhaseWeave,
       
       // Stage 3: Multi-band processing
       low_band: MultiBandProcessor,
       mid_band: MultiBandProcessor,
       high_band: MultiBandProcessor,
       
       // Stage 4: Dynamics
       glue_compressor: MixxGlue,
       
       // Stage 5: Color/Saturation
       drive: MixxDrive,
       
       // Stage 6: Limiting
       soft_limiter: MixxLimiter,
       true_peak_limiter: VelvetTruePeakLimiter,
       
       // Stage 7: Final
       dither: Dither,  // From Phase 21
       loudness_meter: VelvetLoudnessMeter,
       
       // Config
       sample_rate: f32,
       profile: MasteringProfile,
   }
   ```

3. Implement `AudioProcessor` trait for `MasterChain`

4. Add profile presets: `streaming`, `club`, `broadcast`, `vinyl`, `audiophile`

5. Expose via Tauri command: `master_chain_set_profile`, `master_chain_get_meters`

6. Add to `mod.rs`: `pub mod master_chain;`

// turbo
7. Run `cargo check --workspace` - must pass with zero warnings

---

## Phase 21: Dithering Plugin

**Goal:** Add triangular PDF dither for high-quality 16-bit export.

### Steps:

1. Add `Dither` struct to `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/mixx_plugins.rs`:
   ```rust
   pub struct Dither {
       pub bit_depth: u32,        // Target bit depth (16, 24)
       pub dither_type: DitherType, // Triangular, Rectangular, Shaped
       pub noise_shaping: bool,   // Enable noise shaping
       
       // TPDF state
       prev_random: f32,
       rng_state: u64,
   }
   
   pub enum DitherType {
       None,
       Rectangular,  // RPDF
       Triangular,   // TPDF (preferred)
       Shaped,       // Noise-shaped
   }
   ```

2. Implement TPDF (Triangular Probability Density Function) algorithm:
   - Generate two random samples
   - Sum them for triangular distribution
   - Scale to 1 LSB at target bit depth
   - Add to signal before quantization

3. Implement noise shaping (optional):
   - First-order highpass filter on quantization error
   - Feedback to next sample

4. Implement `AudioProcessor` trait

5. Add unit test for dither noise floor measurement

// turbo
6. Run `cargo check --workspace` - must pass with zero warnings

---

## Phase 22: Audio Export Encoding

**Goal:** Native WAV/FLAC encoding from Rust for offline export.

### Steps:

1. Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/audio_export.rs`

2. Define export types:
   ```rust
   pub enum ExportFormat {
       Wav16,
       Wav24,
       Wav32Float,
       Flac16,
       Flac24,
   }
   
   pub struct ExportConfig {
       pub format: ExportFormat,
       pub sample_rate: u32,
       pub channels: u16,
       pub dither: bool,
       pub normalize: bool,
       pub normalize_target_lufs: f32,
   }
   ```

3. Implement WAV writer (native, no dependencies):
   - Write RIFF header
   - Write fmt chunk (PCM format)
   - Write data chunk with samples
   - Handle 16-bit, 24-bit, 32-bit float

4. Implement FLAC encoder (or use `flac-sys` if needed):
   - Frame-based encoding
   - LPC prediction
   - Rice coding

5. Add progress callback for long exports

6. Expose via Tauri command: `audio_export_start`, `audio_export_progress`, `audio_export_cancel`

7. Add to `mod.rs`: `pub mod audio_export;`

// turbo
8. Run `cargo check --workspace` - must pass with zero warnings

---

## Phase 23: SIMD Optimization

**Goal:** Accelerate hot paths with SIMD intrinsics for 2-4x performance gains.

### Steps:

1. Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/simd_utils.rs`

2. Add feature detection:
   ```rust
   #[cfg(target_arch = "x86_64")]
   use std::arch::x86_64::*;
   
   #[cfg(target_arch = "aarch64")]
   use std::arch::aarch64::*;
   
   pub fn has_avx2() -> bool;
   pub fn has_neon() -> bool;
   ```

3. Implement SIMD versions of hot paths:
   - `simd_gain_stereo(buffer: &mut [f32], gain: f32)` - vectorized gain
   - `simd_mix_stereo(dry: &[f32], wet: &[f32], mix: f32, out: &mut [f32])`
   - `simd_biquad_process(...)` - 4-sample parallel biquad
   - `simd_tanh_approx(x: __m256) -> __m256` - fast SIMD tanh for saturation

4. Create benchmark tests comparing scalar vs SIMD:
   ```rust
   #[bench]
   fn bench_gain_scalar(b: &mut Bencher);
   
   #[bench]
   fn bench_gain_simd(b: &mut Bencher);
   ```

5. Add runtime dispatch wrapper that selects SIMD or scalar based on CPU features

6. Integrate SIMD paths into `MixxDrive`, `MixxGlue`, `PrimeEQ` (most CPU-intensive)

7. Add to `mod.rs`: `pub mod simd_utils;`

// turbo
8. Run `cargo check --workspace` - must pass with zero warnings

---

## Verification Checklist

After all phases complete:

- [ ] `cargo check --workspace` passes with zero warnings
- [ ] `cargo test --workspace` passes all tests
- [ ] Master chain processes audio correctly
- [ ] Dithered 16-bit export has correct noise floor
- [ ] WAV/FLAC files are valid and playable
- [ ] SIMD benchmarks show >2x improvement on supported CPUs

---

## Agent Assignment Suggestions

| Phase | Complexity | Est. Time | Dependencies |
|-------|------------|-----------|--------------|
| 20: Master Chain | Medium | 2-3 hours | None |
| 21: Dither | Low | 30 min | None |
| 22: Export | Medium | 2-3 hours | Phase 21 (optional) |
| 23: SIMD | High | 3-4 hours | None |

**Parallel Execution:** Phases 20, 21, and 23 can run in parallel. Phase 22 benefits from Phase 21 (dither) but isn't blocked.

// turbo-all
