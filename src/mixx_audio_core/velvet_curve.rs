use crate::mixx_audio_core::processor::AudioProcessor;

#[derive(Debug, Clone)]
pub struct VelvetCurve {
    pub warmth: f32,       // 0.0 to 1.0
    pub silk_edge: f32,    // 0.0 to 1.0 
    pub emotion: f32,      // 0.0 to 1.0 (Controls modulation depth)
    pub power: f32,        // 0.0 to 1.0 (Output drive/ceiling)
    
    // Internal state
    last_sample: f32,
    envelope: f32,
}

impl VelvetCurve {
    pub fn new() -> Self {
        Self {
            warmth: 0.0,
            silk_edge: 0.0,
            emotion: 0.0,
            power: 0.0,
            last_sample: 0.0,
            envelope: 0.0,
        }
    }

    /// Process a block of samples in place for maximum performance (zero-copy)
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process_sample(*sample);
        }
    }

    /// Process a single sample with the Velvet Curve algorithm
    /// 
    /// The algorithm consists of three stages:
    /// 1. Warmth Saturation: Even-harmonic generation via soft clipping
    /// 2. Silk Edge: High-frequency excitement and air
    /// 3. Power Drive: Output stage limiting and density
    #[inline(always)]
    pub fn process_sample(&mut self, input: f32) -> f32 {
        // Stage 1: Warmth (Saturation)
        // Detailed curve that mimics analog tube saturation
        let saturated = if self.warmth > 0.0 {
            let drive = 1.0 + self.warmth * 4.0;
            let x = input * drive;
            // Hyperbolic tangent-like soft clipper
            (2.0 / (1.0 + (-2.0 * x).exp()) - 1.0) / drive.max(1.0) // Normalize roughly
        } else {
            input
        };

        // Stage 2: Silk (High Frequency Exciter)
        // Uses a simple high-pass differentiator trick (input - last_sample)
        let silk_out = if self.silk_edge > 0.0 {
            let high_freq_content = saturated - self.last_sample;
            // Add air back into the signal
            saturated + (high_freq_content * self.silk_edge * 1.5)
        } else {
            saturated
        };
        self.last_sample = saturated;

        // Stage 3: Emotion (Dynamic Modulation)
        // Subtle envelope following to breath with the signal
        let output = if self.emotion > 0.0 {
            // Simple envelope follower
            self.envelope = self.envelope * 0.999 + silk_out.abs() * 0.001;
            // Modulate output slightly based on envelope (expansion/compression)
            let mod_factor = 1.0 + (self.envelope * self.emotion * 0.2); 
            silk_out * mod_factor
        } else {
            silk_out
        };

        // Stage 4: Power (Output Limiter / Ceiling)
        // Harder knee limiting for "maximized" sound
        if self.power > 0.0 {
            let _ceiling = 1.0;
            let threshold = 1.0 - (self.power * 0.5); // Lowers threshold as power increases
            
            if output.abs() > threshold {
                 // Soft knee compression at the top
                 let excess = output.abs() - threshold;
                 let compressed = threshold + (excess / (1.0 + excess * self.power * 2.0));
                 return if output > 0.0 { compressed } else { -compressed };
            }
        }

        output
    }
}
unsafe impl Send for VelvetCurve {}
unsafe impl Sync for VelvetCurve {}

impl AudioProcessor for VelvetCurve {
    fn process(&mut self, data: &mut [f32], _channels: usize) {
        // Velvet Curve is mono-compatible (process each sample independently)
        self.process_buffer(data);
    }

    fn name(&self) -> &str {
        "Velvet Curve"
    }

    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "warmth" => self.warmth = value.clamp(0.0, 1.0),
            "silk_edge" => self.silk_edge = value.clamp(0.0, 1.0),
            "emotion" => self.emotion = value.clamp(0.0, 1.0),
            "power" => self.power = value.clamp(0.0, 1.0),
            _ => (),
        }
    }
}
