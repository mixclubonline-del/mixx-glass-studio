---
description: Phase 20 - Create unified Rust mastering chain
---

# Phase 20: Master Chain Orchestrator

**Goal:** Wire all plugins into a unified mastering chain in Rust, mirroring `masterChain.ts`.

## Prerequisites
- Phases 2-19 complete with zero-warning build
- `mixx_plugins.rs` contains 14 plugin implementations

---

## Step 1: Create the module file

Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/master_chain.rs`

## Step 2: Define the MasterChain struct

```rust
use super::processor::AudioProcessor;
use super::velvet_curve::VelvetCurve;
use super::harmonic_lattice::HarmonicLattice;
use super::phase_weave::PhaseWeave;
use super::mixx_plugins::{MixxGlue, MixxDrive, MixxLimiter, VelvetTruePeakLimiter, VelvetLoudnessMeter};

#[derive(Clone, Copy, PartialEq)]
pub enum MasteringProfile {
    Streaming,   // -14 LUFS, -1 dBTP
    Club,        // -8 LUFS, -0.5 dBTP
    Broadcast,   // -24 LUFS, -2 dBTP
    Vinyl,       // -12 LUFS, -1 dBTP
    Audiophile,  // -16 LUFS, -1 dBTP
}

pub struct MasterChain {
    sample_rate: f32,
    profile: MasteringProfile,
    
    // Stage 1: Sonic pillars
    velvet_curve: VelvetCurve,
    harmonic_lattice: HarmonicLattice,
    phase_weave: PhaseWeave,
    
    // Stage 2: Dynamics
    glue: MixxGlue,
    
    // Stage 3: Color
    drive: MixxDrive,
    
    // Stage 4: Limiting
    soft_limiter: MixxLimiter,
    true_peak_limiter: VelvetTruePeakLimiter,
    
    // Stage 5: Metering
    loudness_meter: VelvetLoudnessMeter,
    
    // Master gain
    output_gain: f32,
}
```

## Step 3: Implement constructor with profile presets

```rust
impl MasterChain {
    pub fn new(sample_rate: f32, profile: MasteringProfile) -> Self {
        let mut chain = Self {
            sample_rate,
            profile,
            velvet_curve: VelvetCurve::new(sample_rate),
            harmonic_lattice: HarmonicLattice::new(),
            phase_weave: PhaseWeave::new(),
            glue: MixxGlue::new(sample_rate),
            drive: MixxDrive::new(),
            soft_limiter: MixxLimiter::new(sample_rate),
            true_peak_limiter: VelvetTruePeakLimiter::new(sample_rate),
            loudness_meter: VelvetLoudnessMeter::new(sample_rate),
            output_gain: 1.0,
        };
        chain.apply_profile(profile);
        chain
    }
    
    pub fn apply_profile(&mut self, profile: MasteringProfile) {
        self.profile = profile;
        match profile {
            MasteringProfile::Streaming => {
                self.glue.set_parameter("threshold", -18.0);
                self.glue.set_parameter("ratio", 2.2);
                self.soft_limiter.set_parameter("ceiling", -1.0);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-14.0);
            }
            MasteringProfile::Club => {
                self.glue.set_parameter("threshold", -14.0);
                self.glue.set_parameter("ratio", 2.5);
                self.soft_limiter.set_parameter("ceiling", -0.5);
                self.true_peak_limiter.set_parameter("threshold", -0.5);
                self.output_gain = Self::gain_for_lufs(-8.0);
            }
            MasteringProfile::Broadcast => {
                self.glue.set_parameter("threshold", -24.0);
                self.glue.set_parameter("ratio", 1.8);
                self.soft_limiter.set_parameter("ceiling", -2.0);
                self.true_peak_limiter.set_parameter("threshold", -2.0);
                self.output_gain = Self::gain_for_lufs(-24.0);
            }
            MasteringProfile::Vinyl => {
                self.glue.set_parameter("threshold", -20.0);
                self.glue.set_parameter("ratio", 2.0);
                self.soft_limiter.set_parameter("ceiling", -1.0);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-12.0);
            }
            MasteringProfile::Audiophile => {
                self.glue.set_parameter("threshold", -22.0);
                self.glue.set_parameter("ratio", 1.5);
                self.soft_limiter.set_parameter("ceiling", -1.0);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-16.0);
            }
        }
    }
    
    fn gain_for_lufs(target_lufs: f32) -> f32 {
        let reference_lufs = -14.0;
        let delta = target_lufs - reference_lufs;
        10.0_f32.powf(delta / 20.0)
    }
}
```

## Step 4: Implement process_stereo

```rust
impl MasterChain {
    pub fn process_stereo(&mut self, left: f32, right: f32) -> (f32, f32) {
        // Stage 1: Velvet Curve
        let (l, r) = self.velvet_curve.process_stereo(left, right);
        
        // Stage 2: Harmonic Lattice
        let (l, r) = self.harmonic_lattice.process_stereo(l, r);
        
        // Stage 3: Phase Weave
        let (l, r) = self.phase_weave.process_stereo(l, r);
        
        // Stage 4: Glue compression
        let (l, r) = self.glue.process_stereo(l, r);
        
        // Stage 5: Color/Drive
        let (l, r) = self.drive.process_stereo(l, r);
        
        // Stage 6: Soft limiter
        let (l, r) = self.soft_limiter.process_stereo(l, r);
        
        // Stage 7: True peak limiter
        let (l, r) = self.true_peak_limiter.process_stereo(l, r);
        
        // Stage 8: Output gain
        let l = l * self.output_gain;
        let r = r * self.output_gain;
        
        // Metering (passthrough)
        let (l, r) = self.loudness_meter.process_stereo(l, r);
        
        (l, r)
    }
    
    pub fn get_meters(&self) -> (f32, f32, f32, f32) {
        (
            self.loudness_meter.momentary_lufs,
            self.loudness_meter.short_term_lufs,
            self.loudness_meter.integrated_lufs,
            self.loudness_meter.true_peak_db,
        )
    }
}
```

## Step 5: Implement AudioProcessor trait

```rust
impl AudioProcessor for MasterChain {
    fn process(&mut self, data: &mut [f32], channels: usize) {
        if channels != 2 { return; }
        for chunk in data.chunks_mut(2) {
            if chunk.len() == 2 {
                let (l, r) = self.process_stereo(chunk[0], chunk[1]);
                chunk[0] = l;
                chunk[1] = r;
            }
        }
    }
    
    fn name(&self) -> &str { "MasterChain" }
    
    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "output_gain" => self.output_gain = value.clamp(0.0, 2.0),
            "profile" => {
                let profile = match value as u32 {
                    0 => MasteringProfile::Streaming,
                    1 => MasteringProfile::Club,
                    2 => MasteringProfile::Broadcast,
                    3 => MasteringProfile::Vinyl,
                    4 => MasteringProfile::Audiophile,
                    _ => MasteringProfile::Streaming,
                };
                self.apply_profile(profile);
            }
            _ => {}
        }
    }
}

unsafe impl Send for MasterChain {}
unsafe impl Sync for MasterChain {}
```

## Step 6: Add to mod.rs

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/mod.rs`:
```rust
pub mod master_chain;
```

// turbo
## Step 7: Verify

```bash
cargo check --workspace
```

Must pass with zero warnings.

---

## Completion Checklist

- [ ] `master_chain.rs` created
- [ ] `MasterChain` struct with all stages
- [ ] Profile presets implemented
- [ ] `AudioProcessor` trait implemented
- [ ] Added to `mod.rs`
- [ ] Zero-warning build
