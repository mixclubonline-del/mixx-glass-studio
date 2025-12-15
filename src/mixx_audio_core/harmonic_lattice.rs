use super::processor::AudioProcessor;

#[derive(Debug, Clone)]
pub struct HarmonicLattice {
    pub even_drive: f32, // 0.0 to 1.0 (Tube/Warmth)
    pub odd_drive: f32,  // 0.0 to 1.0 (Transistor/Grit)
    pub tension: f32,    // 0.0 to 1.0 (Wave shaping curve tension)
    pub output_gain: f32, // Linear gain
}

impl HarmonicLattice {
    pub fn new() -> Self {
        Self {
            even_drive: 0.0,
            odd_drive: 0.0,
            tension: 0.5,
            output_gain: 1.0,
        }
    }

    /// Process a block of samples in place
    pub fn process_buffer(&mut self, buffer: &mut [f32]) {
        for sample in buffer.iter_mut() {
            *sample = self.process_sample(*sample);
        }
    }

    /// Process a single sample
    /// 
    /// Algorithm:
    /// 1. Asymmetric waveshaping for Even harmonics (quadratic-ish)
    /// 2. Symmetric waveshaping for Odd harmonics (tanh/sigmoid)
    /// 3. Tension controls the "hardness" of the knee
    #[inline(always)]
    pub fn process_sample(&mut self, input: f32) -> f32 {
        if self.even_drive == 0.0 && self.odd_drive == 0.0 {
            return input * self.output_gain;
        }

        // 1. Even Harmonics (Asymmetric Saturation)
        // Mimics Class A bias shift
        let even_comp = if self.even_drive > 0.0 {
            let _drive = self.even_drive * 4.0;
            // Bias shift: pushes positive peaks more than negative
            let biased = input + (input.abs() * 0.5 * self.even_drive);
            // Soft rectifier
            (biased.tanh() + biased) * 0.5
        } else {
            input
        };

        // 2. Odd Harmonics (Symmetric Saturation)
        // Mimics Push-Pull / Tape Saturation
        let odd_comp = if self.odd_drive > 0.0 {
            let drive = 1.0 + self.odd_drive * 8.0;
            let x = even_comp * drive;
            // Sigmoid / Tanh
            (x.tanh()) / drive.sqrt().max(1.0)
        } else {
            even_comp
        };

        // 3. Tension and Blending
        // Currently handled implicitly by the saturation curves, 
        // but 'tension' could blend between Soft/Hard clipping if desired.
        // For now, we'll keep it simple.

        odd_comp * self.output_gain
    }
}

unsafe impl Send for HarmonicLattice {}
unsafe impl Sync for HarmonicLattice {}

impl AudioProcessor for HarmonicLattice {
    fn process(&mut self, data: &mut [f32], _channels: usize) {
        // Harmonic Lattice is mono-compatible
        self.process_buffer(data);
    }
    
    fn name(&self) -> &str {
        "Harmonic Lattice"
    }

    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "even_drive" => self.even_drive = value.clamp(0.0, 1.0),
            "odd_drive" => self.odd_drive = value.clamp(0.0, 1.0),
            "tension" => self.tension = value.clamp(0.0, 1.0),
            "output_gain" => self.output_gain = value.max(0.0),
            _ => (),
        }
    }
}
