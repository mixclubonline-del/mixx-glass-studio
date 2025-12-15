---
description: Phase 23 - SIMD optimization for DSP hot paths
---

# Phase 23: SIMD Optimization

**Goal:** Accelerate hot paths with SIMD intrinsics for 2-4x performance gains.

## Prerequisites
- Phases 2-19 complete with zero-warning build
- Familiarity with CPU feature detection

---

## Step 1: Create the module file

Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/simd_utils.rs`

## Step 2: Add CPU feature detection

```rust
//! SIMD utilities for audio DSP acceleration
//! 
//! Provides vectorized implementations of common DSP operations:
//! - Gain application
//! - Wet/dry mixing
//! - Biquad filtering (future)
//! - Fast math approximations (tanh, exp)

/// Runtime CPU feature detection
pub struct SimdFeatures {
    pub has_sse2: bool,
    pub has_avx: bool,
    pub has_avx2: bool,
    pub has_fma: bool,
    pub has_neon: bool,
}

impl SimdFeatures {
    pub fn detect() -> Self {
        #[cfg(target_arch = "x86_64")]
        {
            Self {
                has_sse2: is_x86_feature_detected!("sse2"),
                has_avx: is_x86_feature_detected!("avx"),
                has_avx2: is_x86_feature_detected!("avx2"),
                has_fma: is_x86_feature_detected!("fma"),
                has_neon: false,
            }
        }
        
        #[cfg(target_arch = "aarch64")]
        {
            Self {
                has_sse2: false,
                has_avx: false,
                has_avx2: false,
                has_fma: false,
                has_neon: true, // All aarch64 has NEON
            }
        }
        
        #[cfg(not(any(target_arch = "x86_64", target_arch = "aarch64")))]
        {
            Self {
                has_sse2: false,
                has_avx: false,
                has_avx2: false,
                has_fma: false,
                has_neon: false,
            }
        }
    }
    
    pub fn best_vector_width(&self) -> usize {
        if self.has_avx2 { 8 }
        else if self.has_sse2 { 4 }
        else if self.has_neon { 4 }
        else { 1 }
    }
}

lazy_static::lazy_static! {
    pub static ref FEATURES: SimdFeatures = SimdFeatures::detect();
}
```

## Step 3: Implement SIMD gain (x86_64 AVX)

```rust
#[cfg(target_arch = "x86_64")]
use std::arch::x86_64::*;

/// Apply gain to stereo buffer using AVX (8 samples at a time)
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx")]
pub unsafe fn simd_gain_avx(buffer: &mut [f32], gain: f32) {
    let gain_vec = _mm256_set1_ps(gain);
    let chunks = buffer.len() / 8;
    
    for i in 0..chunks {
        let ptr = buffer.as_mut_ptr().add(i * 8);
        let samples = _mm256_loadu_ps(ptr);
        let result = _mm256_mul_ps(samples, gain_vec);
        _mm256_storeu_ps(ptr, result);
    }
    
    // Handle remaining samples
    let remainder_start = chunks * 8;
    for i in remainder_start..buffer.len() {
        buffer[i] *= gain;
    }
}

/// Apply gain to stereo buffer (runtime dispatch)
pub fn simd_gain(buffer: &mut [f32], gain: f32) {
    #[cfg(target_arch = "x86_64")]
    {
        if FEATURES.has_avx {
            unsafe { simd_gain_avx(buffer, gain); }
            return;
        }
    }
    
    // Scalar fallback
    for sample in buffer.iter_mut() {
        *sample *= gain;
    }
}
```

## Step 4: Implement SIMD wet/dry mix

```rust
/// Mix wet and dry signals using AVX
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx")]
pub unsafe fn simd_mix_avx(dry: &[f32], wet: &[f32], mix: f32, out: &mut [f32]) {
    let mix_vec = _mm256_set1_ps(mix);
    let inv_mix_vec = _mm256_set1_ps(1.0 - mix);
    let chunks = dry.len().min(wet.len()).min(out.len()) / 8;
    
    for i in 0..chunks {
        let offset = i * 8;
        let dry_samples = _mm256_loadu_ps(dry.as_ptr().add(offset));
        let wet_samples = _mm256_loadu_ps(wet.as_ptr().add(offset));
        
        let dry_scaled = _mm256_mul_ps(dry_samples, inv_mix_vec);
        let wet_scaled = _mm256_mul_ps(wet_samples, mix_vec);
        let result = _mm256_add_ps(dry_scaled, wet_scaled);
        
        _mm256_storeu_ps(out.as_mut_ptr().add(offset), result);
    }
    
    // Handle remaining
    let remainder_start = chunks * 8;
    for i in remainder_start..out.len() {
        out[i] = dry[i] * (1.0 - mix) + wet[i] * mix;
    }
}

/// Mix wet/dry signals (runtime dispatch)
pub fn simd_mix(dry: &[f32], wet: &[f32], mix: f32, out: &mut [f32]) {
    #[cfg(target_arch = "x86_64")]
    {
        if FEATURES.has_avx {
            unsafe { simd_mix_avx(dry, wet, mix, out); }
            return;
        }
    }
    
    // Scalar fallback
    let len = dry.len().min(wet.len()).min(out.len());
    for i in 0..len {
        out[i] = dry[i] * (1.0 - mix) + wet[i] * mix;
    }
}
```

## Step 5: Implement fast SIMD tanh approximation

```rust
/// Fast tanh approximation (Pade approximant)
/// tanh(x) ≈ x * (27 + x²) / (27 + 9x²) for |x| < 3
#[cfg(target_arch = "x86_64")]
#[target_feature(enable = "avx")]
pub unsafe fn simd_tanh_avx(buffer: &mut [f32]) {
    let c27 = _mm256_set1_ps(27.0);
    let c9 = _mm256_set1_ps(9.0);
    let chunks = buffer.len() / 8;
    
    for i in 0..chunks {
        let ptr = buffer.as_mut_ptr().add(i * 8);
        let x = _mm256_loadu_ps(ptr);
        let x2 = _mm256_mul_ps(x, x);
        
        // numerator = x * (27 + x²)
        let num = _mm256_mul_ps(x, _mm256_add_ps(c27, x2));
        
        // denominator = 27 + 9x²
        let den = _mm256_add_ps(c27, _mm256_mul_ps(c9, x2));
        
        // result = num / den
        let result = _mm256_div_ps(num, den);
        
        _mm256_storeu_ps(ptr, result);
    }
    
    // Handle remaining with scalar tanh
    let remainder_start = chunks * 8;
    for i in remainder_start..buffer.len() {
        buffer[i] = buffer[i].tanh();
    }
}

/// Fast tanh (runtime dispatch)
pub fn simd_tanh(buffer: &mut [f32]) {
    #[cfg(target_arch = "x86_64")]
    {
        if FEATURES.has_avx {
            unsafe { simd_tanh_avx(buffer); }
            return;
        }
    }
    
    // Scalar fallback
    for sample in buffer.iter_mut() {
        *sample = sample.tanh();
    }
}
```

## Step 6: Add to mod.rs

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/mod.rs`:
```rust
pub mod simd_utils;
```

## Step 7: Add lazy_static dependency

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/Cargo.toml`:
```toml
[dependencies]
lazy_static = "1.4"
```

## Step 8: Integrate into MixxDrive

Update `MixxDrive::process` in `mixx_plugins.rs` to use SIMD tanh:

```rust
// In MixxDrive::process_stereo or process:
// Replace: sample.tanh()
// With: Use simd_tanh for buffer processing
```

// turbo
## Step 9: Verify

```bash
cargo check --workspace
```

Must pass with zero warnings.

---

## Completion Checklist

- [ ] `simd_utils.rs` created
- [ ] `SimdFeatures` struct with CPU detection
- [ ] `simd_gain` implemented (AVX + fallback)
- [ ] `simd_mix` implemented (AVX + fallback)
- [ ] `simd_tanh` implemented (AVX + fallback)
- [ ] `lazy_static` dependency added
- [ ] Added to `mod.rs`
- [ ] Integrated into at least one plugin
- [ ] Zero-warning build

## Benchmarking (Optional)

Add benchmark tests to measure performance improvement:

```rust
#[cfg(test)]
mod bench {
    use super::*;
    use std::time::Instant;
    
    #[test]
    fn bench_gain() {
        let mut buffer = vec![0.5f32; 1_000_000];
        
        // Warm up
        simd_gain(&mut buffer, 0.8);
        
        // Benchmark
        let start = Instant::now();
        for _ in 0..100 {
            simd_gain(&mut buffer, 0.8);
        }
        let duration = start.elapsed();
        
        println!("SIMD gain: {:?} per iteration", duration / 100);
    }
}
```
