//! MIXX DSP WASM
//! 
//! WebAssembly-compiled DSP algorithms for AURA DAW.
//! Provides high-performance audio processing for Five Pillars mastering chain.
//! 
//! Phase 38: WASM DSP Integration

use wasm_bindgen::prelude::*;
use std::f32::consts::PI;

// ═══════════════════════════════════════════════════════════════════════════
// Initialization
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen(start)]
pub fn init() {
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

// ═══════════════════════════════════════════════════════════════════════════
// Biquad Filter
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub struct BiquadFilter {
    b0: f32, b1: f32, b2: f32,
    a1: f32, a2: f32,
    x1: f32, x2: f32,
    y1: f32, y2: f32,
}

#[wasm_bindgen]
impl BiquadFilter {
    /// Create lowpass filter
    #[wasm_bindgen(constructor)]
    pub fn new_lowpass(frequency: f32, q: f32, sample_rate: f32) -> BiquadFilter {
        let omega = 2.0 * PI * frequency / sample_rate;
        let cos_omega = omega.cos();
        let sin_omega = omega.sin();
        let alpha = sin_omega / (2.0 * q);
        
        let b0 = (1.0 - cos_omega) / 2.0;
        let b1 = 1.0 - cos_omega;
        let b2 = (1.0 - cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;
        
        BiquadFilter {
            b0: b0 / a0, b1: b1 / a0, b2: b2 / a0,
            a1: a1 / a0, a2: a2 / a0,
            x1: 0.0, x2: 0.0, y1: 0.0, y2: 0.0,
        }
    }
    
    /// Create highpass filter
    pub fn new_highpass(frequency: f32, q: f32, sample_rate: f32) -> BiquadFilter {
        let omega = 2.0 * PI * frequency / sample_rate;
        let cos_omega = omega.cos();
        let sin_omega = omega.sin();
        let alpha = sin_omega / (2.0 * q);
        
        let b0 = (1.0 + cos_omega) / 2.0;
        let b1 = -(1.0 + cos_omega);
        let b2 = (1.0 + cos_omega) / 2.0;
        let a0 = 1.0 + alpha;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha;
        
        BiquadFilter {
            b0: b0 / a0, b1: b1 / a0, b2: b2 / a0,
            a1: a1 / a0, a2: a2 / a0,
            x1: 0.0, x2: 0.0, y1: 0.0, y2: 0.0,
        }
    }
    
    /// Create peaking EQ filter
    pub fn new_peaking(frequency: f32, q: f32, gain_db: f32, sample_rate: f32) -> BiquadFilter {
        let omega = 2.0 * PI * frequency / sample_rate;
        let cos_omega = omega.cos();
        let sin_omega = omega.sin();
        let a = 10.0_f32.powf(gain_db / 40.0);
        let alpha = sin_omega / (2.0 * q);
        
        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos_omega;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos_omega;
        let a2 = 1.0 - alpha / a;
        
        BiquadFilter {
            b0: b0 / a0, b1: b1 / a0, b2: b2 / a0,
            a1: a1 / a0, a2: a2 / a0,
            x1: 0.0, x2: 0.0, y1: 0.0, y2: 0.0,
        }
    }
    
    /// Create high shelf filter
    pub fn new_highshelf(frequency: f32, gain_db: f32, sample_rate: f32) -> BiquadFilter {
        let omega = 2.0 * PI * frequency / sample_rate;
        let cos_omega = omega.cos();
        let sin_omega = omega.sin();
        let a = 10.0_f32.powf(gain_db / 40.0);
        let alpha = sin_omega / 2.0 * ((a + 1.0 / a) * (1.0 / 0.9 - 1.0) + 2.0).sqrt();
        
        let b0 = a * ((a + 1.0) + (a - 1.0) * cos_omega + 2.0 * a.sqrt() * alpha);
        let b1 = -2.0 * a * ((a - 1.0) + (a + 1.0) * cos_omega);
        let b2 = a * ((a + 1.0) + (a - 1.0) * cos_omega - 2.0 * a.sqrt() * alpha);
        let a0 = (a + 1.0) - (a - 1.0) * cos_omega + 2.0 * a.sqrt() * alpha;
        let a1 = 2.0 * ((a - 1.0) - (a + 1.0) * cos_omega);
        let a2 = (a + 1.0) - (a - 1.0) * cos_omega - 2.0 * a.sqrt() * alpha;
        
        BiquadFilter {
            b0: b0 / a0, b1: b1 / a0, b2: b2 / a0,
            a1: a1 / a0, a2: a2 / a0,
            x1: 0.0, x2: 0.0, y1: 0.0, y2: 0.0,
        }
    }
    
    /// Process single sample
    pub fn process(&mut self, x: f32) -> f32 {
        let y = self.b0 * x + self.b1 * self.x1 + self.b2 * self.x2
              - self.a1 * self.y1 - self.a2 * self.y2;
        
        self.x2 = self.x1;
        self.x1 = x;
        self.y2 = self.y1;
        self.y1 = y;
        
        y
    }
    
    /// Process buffer in-place
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process(*sample);
        }
    }
    
    /// Reset filter state
    pub fn reset(&mut self) {
        self.x1 = 0.0;
        self.x2 = 0.0;
        self.y1 = 0.0;
        self.y2 = 0.0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Saturation / Waveshaper
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub struct Saturator {
    curve: Vec<f32>,
    curve_size: usize,
}

#[wasm_bindgen]
impl Saturator {
    /// Create saturator with warmth amount (0.0-1.0)
    #[wasm_bindgen(constructor)]
    pub fn new(amount: f32) -> Saturator {
        let curve_size: usize = 1024;
        let mut curve = Vec::with_capacity(curve_size);
        let deg = PI / 180.0;
        
        for i in 0..curve_size {
            let x = (i as f32 * 2.0) / curve_size as f32 - 1.0;
            let y = ((3.0 + amount) * x * 20.0 * deg) / (PI + amount * x.abs());
            curve.push(y);
        }
        
        Saturator { curve, curve_size }
    }
    
    /// Process single sample
    pub fn process(&self, x: f32) -> f32 {
        let index = ((x + 1.0) * (self.curve_size as f32 / 2.0)) as usize;
        let clamped = index.min(self.curve_size - 1);
        self.curve[clamped]
    }
    
    /// Process buffer in-place
    pub fn process_buffer(&self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process(*sample);
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// M/S (Mid-Side) Processor
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub struct MidSideProcessor {
    width: f32, // 0.0-2.0, 1.0 = normal
}

#[wasm_bindgen]
impl MidSideProcessor {
    #[wasm_bindgen(constructor)]
    pub fn new(width: f32) -> MidSideProcessor {
        MidSideProcessor { width }
    }
    
    /// Set stereo width (0.0-2.0)
    pub fn set_width(&mut self, width: f32) {
        self.width = width;
    }
    
    /// Process stereo buffer in-place (interleaved L/R)
    pub fn process_interleaved(&self, buffer: &mut [f32]) {
        for i in (0..buffer.len()).step_by(2) {
            if i + 1 >= buffer.len() { break; }
            
            let left = buffer[i];
            let right = buffer[i + 1];
            
            // Encode to M/S
            let mid = (left + right) * 0.5;
            let side = (left - right) * 0.5;
            
            // Apply width
            let wide_side = side * self.width;
            
            // Decode back to L/R
            buffer[i] = mid + wide_side;
            buffer[i + 1] = mid - wide_side;
        }
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Envelope Follower (for compression)
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub struct EnvelopeFollower {
    attack_coef: f32,
    release_coef: f32,
    envelope: f32,
}

#[wasm_bindgen]
impl EnvelopeFollower {
    #[wasm_bindgen(constructor)]
    pub fn new(attack_ms: f32, release_ms: f32, sample_rate: f32) -> EnvelopeFollower {
        EnvelopeFollower {
            attack_coef: (-1.0 / (attack_ms * 0.001 * sample_rate)).exp(),
            release_coef: (-1.0 / (release_ms * 0.001 * sample_rate)).exp(),
            envelope: 0.0,
        }
    }
    
    /// Process single sample, returns envelope value
    pub fn process(&mut self, x: f32) -> f32 {
        let input_abs = x.abs();
        
        if input_abs > self.envelope {
            self.envelope = self.attack_coef * self.envelope + (1.0 - self.attack_coef) * input_abs;
        } else {
            self.envelope = self.release_coef * self.envelope + (1.0 - self.release_coef) * input_abs;
        }
        
        self.envelope
    }
    
    /// Reset envelope
    pub fn reset(&mut self) {
        self.envelope = 0.0;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// Simple Compressor
// ═══════════════════════════════════════════════════════════════════════════

#[wasm_bindgen]
pub struct Compressor {
    threshold_db: f32,
    ratio: f32,
    envelope: EnvelopeFollower,
}

#[wasm_bindgen]
impl Compressor {
    #[wasm_bindgen(constructor)]
    pub fn new(threshold_db: f32, ratio: f32, attack_ms: f32, release_ms: f32, sample_rate: f32) -> Compressor {
        Compressor {
            threshold_db,
            ratio,
            envelope: EnvelopeFollower::new(attack_ms, release_ms, sample_rate),
        }
    }
    
    /// Process single sample
    pub fn process(&mut self, x: f32) -> f32 {
        let env = self.envelope.process(x);
        let env_db = 20.0 * (env + 1e-10).log10();
        
        let mut gain_reduction = 0.0;
        if env_db > self.threshold_db {
            let over_db = env_db - self.threshold_db;
            gain_reduction = over_db - over_db / self.ratio;
        }
        
        let gain_lin = 10.0_f32.powf(-gain_reduction / 20.0);
        x * gain_lin
    }
    
    /// Process buffer in-place
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process(*sample);
        }
    }
}
