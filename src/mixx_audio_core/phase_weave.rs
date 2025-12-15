use super::processor::AudioProcessor;

/// Phase Weave DSP
/// 
/// Implements stereo width enhancement and phase rotation.
/// - Width: Expands or narrows the stereo image using Mid/Side processing.
/// - Rotation: Shifts phase of one channel relative to another (All-pass filter).
#[derive(Debug, Clone)]
pub struct PhaseWeave {
    pub width: f32, // 0.0 to 2.0 (1.0 = normal, <1.0 = mono, >1.0 = wide)
    pub rotation: f32, // 0.0 to 1.0 (Phase shift amount)
    
    // Internal state for all-pass filter (right channel only for phase offset)
    ap_buffer_r: f32,
}

impl PhaseWeave {
    pub fn new() -> Self {
        Self {
            width: 1.0,
            rotation: 0.0,
            ap_buffer_r: 0.0,
        }
    }
    
    // Process stereo buffer (Interleaved)
    pub fn process_interleaved(&mut self, data: &mut [f32], channels: usize) {
        if channels != 2 {
            return; // Only support stereo for now
        }
        
        for frame in data.chunks_mut(2) {
            let left = frame[0];
            let right = frame[1];
            
            // 1. Mid/Side Encoding
            let mid = (left + right) * 0.5;
            let side = (left - right) * 0.5;
            
            // 2. Width Adjustment
            let side_proc = side * self.width;
            
            // 3. Mid/Side Decoding
            let new_left = mid + side_proc;
            let mut new_right = mid - side_proc;
            
            // 4. Phase Rotation (Simple All-Pass on one channel if rotation > 0)
            if self.rotation > 0.001 {
               // Simple 1-pole allpass for phase dispersion
               // coeff related to rotation parameter
               let c = self.rotation * 0.9; // max 0.9 coeff
               
               // Apply to Right channel only for relative shift
               // All-pass filter: y[n] = c * x[n] + x[n-1] - c * y[n-1]
               // Rewritten: y[n] = c * (x[n] - y[n-1]) + x[n-1]

               let output_r = c * new_right + self.ap_buffer_r;
               self.ap_buffer_r = new_right - c * output_r;
               new_right = output_r;
            }
            
            frame[0] = new_left;
            frame[1] = new_right;
        }
    }
}

unsafe impl Send for PhaseWeave {}

impl AudioProcessor for PhaseWeave {
    fn process(&mut self, data: &mut [f32], channels: usize) {
        self.process_interleaved(data, channels);
    }
    
    fn name(&self) -> &str {
        "Phase Weave"
    }

    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "width" => self.width = value.clamp(0.0, 3.0),
            "rotation" => self.rotation = value.clamp(0.0, 1.0),
            _ => (),
        }
    }
}
