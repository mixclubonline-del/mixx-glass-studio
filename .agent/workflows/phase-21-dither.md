---
description: Phase 21 - Add TPDF dithering for 16-bit export
---

# Phase 21: Dithering Plugin

**Goal:** Add triangular PDF dither for high-quality 16-bit export.

## Prerequisites
- Phases 2-19 complete with zero-warning build
- `mixx_plugins.rs` exists

---

## Step 1: Add Dither struct to mixx_plugins.rs

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/mixx_plugins.rs`:

```rust
// ============================================================================
// Dither - Triangular PDF Dithering (for 16-bit export)
// ============================================================================

#[derive(Clone, Copy, PartialEq)]
pub enum DitherType {
    None,
    Rectangular,  // RPDF - simple random
    Triangular,   // TPDF - preferred for audio
    Shaped,       // Noise-shaped TPDF
}

/// Dither - High-quality dithering for bit-depth reduction
/// Params: bit_depth, dither_type, noise_shaping
pub struct Dither {
    pub bit_depth: u32,        // Target bit depth (16, 24)
    pub dither_type: DitherType,
    pub noise_shaping: bool,
    
    // TPDF state (need two random values for triangular distribution)
    rng_state: u64,
    prev_error_l: f32,
    prev_error_r: f32,
}

impl Dither {
    pub fn new() -> Self {
        Self {
            bit_depth: 16,
            dither_type: DitherType::Triangular,
            noise_shaping: false,
            rng_state: 0x853c49e6748fea9b, // Seed
            prev_error_l: 0.0,
            prev_error_r: 0.0,
        }
    }
    
    // Fast xorshift64 PRNG
    fn next_random(&mut self) -> f32 {
        let mut x = self.rng_state;
        x ^= x << 13;
        x ^= x >> 7;
        x ^= x << 17;
        self.rng_state = x;
        // Convert to -1.0 to 1.0 range
        (x as i64 as f32) / (i64::MAX as f32)
    }
    
    fn get_dither_noise(&mut self) -> f32 {
        match self.dither_type {
            DitherType::None => 0.0,
            DitherType::Rectangular => {
                // RPDF: single random sample
                self.next_random()
            }
            DitherType::Triangular | DitherType::Shaped => {
                // TPDF: sum of two random samples gives triangular distribution
                let r1 = self.next_random();
                let r2 = self.next_random();
                (r1 + r2) * 0.5
            }
        }
    }
    
    fn quantize(&self, sample: f32) -> f32 {
        // Scale to target bit depth
        let max_val = (1 << (self.bit_depth - 1)) as f32;
        let scaled = sample * max_val;
        let quantized = scaled.round();
        quantized / max_val
    }
    
    pub fn process_stereo(&mut self, left: f32, right: f32) -> (f32, f32) {
        // Calculate LSB value at target bit depth
        let lsb = 1.0 / ((1 << (self.bit_depth - 1)) as f32);
        
        // Get shaped error feedback (if enabled)
        let error_feedback_l = if self.noise_shaping { self.prev_error_l } else { 0.0 };
        let error_feedback_r = if self.noise_shaping { self.prev_error_r } else { 0.0 };
        
        // Add dither noise (scaled to 1 LSB)
        let dither_l = self.get_dither_noise() * lsb;
        let dither_r = self.get_dither_noise() * lsb;
        
        // Apply dither and error feedback
        let dithered_l = left + dither_l - error_feedback_l;
        let dithered_r = right + dither_r - error_feedback_r;
        
        // Quantize
        let out_l = self.quantize(dithered_l);
        let out_r = self.quantize(dithered_r);
        
        // Calculate quantization error for noise shaping
        if self.noise_shaping {
            self.prev_error_l = out_l - dithered_l;
            self.prev_error_r = out_r - dithered_r;
        }
        
        (out_l, out_r)
    }
}

impl AudioProcessor for Dither {
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
    
    fn name(&self) -> &str { "Dither" }
    
    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "bit_depth" => self.bit_depth = (value as u32).clamp(8, 32),
            "dither_type" => {
                self.dither_type = match value as u32 {
                    0 => DitherType::None,
                    1 => DitherType::Rectangular,
                    2 => DitherType::Triangular,
                    3 => DitherType::Shaped,
                    _ => DitherType::Triangular,
                };
            }
            "noise_shaping" => self.noise_shaping = value > 0.5,
            _ => {}
        }
    }
}

unsafe impl Send for Dither {}
unsafe impl Sync for Dither {}
```

## Step 2: Add unit test

```rust
#[test]
fn test_dither() {
    let mut dither = Dither::new();
    dither.bit_depth = 16;
    dither.dither_type = DitherType::Triangular;
    
    // Process some samples
    let mut sum_diff = 0.0f32;
    for i in 0..1000 {
        let input = (i as f32 / 1000.0) * 2.0 - 1.0; // -1 to 1 sweep
        let (out_l, _) = dither.process_stereo(input, input);
        sum_diff += (out_l - input).abs();
        assert!(out_l.is_finite());
        assert!(out_l >= -1.0 && out_l <= 1.0);
    }
    
    // Average quantization error should be small
    let avg_diff = sum_diff / 1000.0;
    assert!(avg_diff < 0.001, "Quantization error too large: {}", avg_diff);
}
```

// turbo
## Step 3: Verify

```bash
cargo check --workspace
```

Must pass with zero warnings.

---

## Completion Checklist

- [ ] `Dither` struct added to `mixx_plugins.rs`
- [ ] `DitherType` enum defined
- [ ] TPDF algorithm implemented
- [ ] Noise shaping implemented
- [ ] `AudioProcessor` trait implemented
- [ ] Unit test added
- [ ] Zero-warning build
