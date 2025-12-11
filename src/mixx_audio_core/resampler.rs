/**
 * MixxResampler - Proprietary Resampling Engine
 * 
 * Replaces: rubato
 * 
 * High-quality sample rate conversion with musical quality preservation.
 * Supports real-time and offline processing modes.
 */

use std::f32::consts::PI;

/// Resampling quality modes
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResampleQuality {
    /// Fast mode - Linear interpolation, lowest CPU, acceptable quality
    Fast,
    /// High mode - Windowed sinc, high quality, moderate CPU
    High,
    /// Ultra mode - Highest quality, preserves all harmonics, highest CPU
    Ultra,
}

/// Resampling error types
#[derive(Debug, Clone)]
pub enum ResampleError {
    InvalidRate,
    BufferTooSmall,
    InternalError(String),
}

impl std::fmt::Display for ResampleError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ResampleError::InvalidRate => write!(f, "Invalid sample rate"),
            ResampleError::BufferTooSmall => write!(f, "Output buffer too small"),
            ResampleError::InternalError(msg) => write!(f, "Internal error: {}", msg),
        }
    }
}

impl std::error::Error for ResampleError {}

/// MixxResampler - Proprietary resampling engine
pub struct MixxResampler {
    input_rate: u32,
    output_rate: u32,
    ratio: f64,
    quality: ResampleQuality,
    // State for windowed sinc interpolation
    sinc_table: Vec<f32>,
    window_size: usize,
    // State for linear interpolation
    last_sample: f32,
    position: f64,
}

impl MixxResampler {
    /// Create a new resampler
    /// 
    /// # Arguments
    /// * `input_rate` - Input sample rate (Hz)
    /// * `output_rate` - Output sample rate (Hz)
    /// * `quality` - Quality mode (Fast, High, Ultra)
    /// 
    /// # Returns
    /// New resampler instance or error if rates are invalid
    pub fn new(
        input_rate: u32,
        output_rate: u32,
        quality: ResampleQuality,
    ) -> Result<Self, ResampleError> {
        if input_rate == 0 || output_rate == 0 {
            return Err(ResampleError::InvalidRate);
        }

        let ratio = output_rate as f64 / input_rate as f64;

        // Build sinc table for High/Ultra quality
        let (sinc_table, window_size) = match quality {
            ResampleQuality::Fast => (Vec::new(), 0),
            ResampleQuality::High => Self::build_sinc_table(64, 8.0),
            ResampleQuality::Ultra => Self::build_sinc_table(128, 16.0),
        };

        Ok(Self {
            input_rate,
            output_rate,
            ratio,
            quality,
            sinc_table,
            window_size,
            last_sample: 0.0,
            position: 0.0,
        })
    }

    /// Resample audio buffer
    /// 
    /// # Arguments
    /// * `input` - Input audio samples
    /// * `output` - Output buffer (must be large enough)
    /// 
    /// # Returns
    /// Number of output samples generated
    pub fn resample(
        &mut self,
        input: &[f32],
        output: &mut [f32],
    ) -> Result<usize, ResampleError> {
        if input.is_empty() {
            return Ok(0);
        }

        let expected_output_len = ((input.len() as f64) * self.ratio).ceil() as usize;
        if output.len() < expected_output_len {
            return Err(ResampleError::BufferTooSmall);
        }

        match self.quality {
            ResampleQuality::Fast => self.resample_linear(input, output),
            ResampleQuality::High | ResampleQuality::Ultra => {
                self.resample_sinc(input, output)
            }
        }
    }

    /// Linear interpolation (Fast mode)
    fn resample_linear(
        &mut self,
        input: &[f32],
        output: &mut [f32],
    ) -> Result<usize, ResampleError> {
        let mut out_idx = 0;
        let mut pos = self.position;

        for &sample in input.iter() {
            while pos < 1.0 && out_idx < output.len() {
                // Linear interpolation between last_sample and current sample
                let t = pos as f32;
                output[out_idx] = self.last_sample * (1.0 - t) + sample * t;
                out_idx += 1;
                pos += self.ratio as f32;
            }

            self.last_sample = sample;
            pos -= 1.0;
        }

        self.position = pos;
        Ok(out_idx)
    }

    /// Windowed sinc interpolation (High/Ultra mode)
    fn resample_sinc(
        &mut self,
        input: &[f32],
        output: &mut [f32],
    ) -> Result<usize, ResampleError> {
        if self.sinc_table.is_empty() {
            return Err(ResampleError::InternalError(
                "Sinc table not initialized".to_string(),
            ));
        }

        let mut out_idx = 0;
        let mut pos = self.position;
        let half_window = self.window_size / 2;

        // Pad input with zeros for boundary handling
        let mut padded_input = vec![0.0f32; half_window];
        padded_input.extend_from_slice(input);
        padded_input.extend_from_slice(&vec![0.0f32; half_window]);

        while pos < input.len() as f64 && out_idx < output.len() {
            let input_pos = pos as usize;
            let fractional = pos - input_pos as f64;

            // Convolve with sinc kernel
            let mut sum = 0.0f32;
            for i in 0..self.window_size {
                let idx = input_pos + i;
                if idx < padded_input.len() {
                    let sinc_idx = ((i as f64 - half_window as f64 + fractional)
                        * (self.sinc_table.len() as f64 / self.window_size as f64))
                        as usize;
                    if sinc_idx < self.sinc_table.len() {
                        sum += padded_input[idx] * self.sinc_table[sinc_idx];
                    }
                }
            }

            output[out_idx] = sum;
            out_idx += 1;
            pos += self.ratio;
        }

        self.position = pos - input.len() as f64;
        Ok(out_idx)
    }

    /// Build sinc interpolation table
    fn build_sinc_table(table_size: usize, cutoff: f32) -> (Vec<f32>, usize) {
        let mut table = Vec::with_capacity(table_size);
        let window_size = table_size / 2;

        for i in 0..table_size {
            let x = (i as f32 - table_size as f32 / 2.0) / (table_size as f32 / 2.0);
            let sinc = if x.abs() < 1e-6 {
                1.0
            } else {
                let sinc_arg = PI * cutoff * x;
                sinc_arg.sin() / sinc_arg
            };

            // Apply Blackman window for better frequency response
            let window = Self::blackman_window(i, table_size);
            table.push(sinc * window);
        }

        (table, window_size)
    }

    /// Blackman window function
    fn blackman_window(i: usize, n: usize) -> f32 {
        let a0 = 0.42;
        let a1 = 0.5;
        let a2 = 0.08;
        let x = 2.0 * PI * i as f32 / (n as f32 - 1.0);
        a0 - a1 * x.cos() + a2 * (2.0 * x).cos()
    }

    /// Reset resampler state (useful for streaming)
    pub fn reset(&mut self) {
        self.last_sample = 0.0;
        self.position = 0.0;
    }

    /// Get input sample rate
    pub fn input_rate(&self) -> u32 {
        self.input_rate
    }

    /// Get output sample rate
    pub fn output_rate(&self) -> u32 {
        self.output_rate
    }

    /// Get resampling ratio
    pub fn ratio(&self) -> f64 {
        self.ratio
    }

    /// Get quality mode
    pub fn quality(&self) -> ResampleQuality {
        self.quality
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_resampler_creation() {
        let resampler = MixxResampler::new(44100, 48000, ResampleQuality::High);
        assert!(resampler.is_ok());
    }

    #[test]
    fn test_resampler_invalid_rate() {
        let resampler = MixxResampler::new(0, 48000, ResampleQuality::Fast);
        assert!(resampler.is_err());
    }

    #[test]
    fn test_fast_resampling() {
        let mut resampler =
            MixxResampler::new(44100, 48000, ResampleQuality::Fast).unwrap();

        // Generate test signal (sine wave)
        let input: Vec<f32> = (0..4410)
            .map(|i| (2.0 * PI * 440.0 * i as f32 / 44100.0).sin())
            .collect();

        let mut output = vec![0.0f32; 5000];
        let result = resampler.resample(&input, &mut output);
        assert!(result.is_ok());
        assert!(result.unwrap() > 0);
    }

    #[test]
    fn test_high_quality_resampling() {
        let mut resampler =
            MixxResampler::new(44100, 48000, ResampleQuality::High).unwrap();

        let input: Vec<f32> = (0..4410)
            .map(|i| (2.0 * PI * 440.0 * i as f32 / 44100.0).sin())
            .collect();

        let mut output = vec![0.0f32; 5000];
        let result = resampler.resample(&input, &mut output);
        assert!(result.is_ok());
        assert!(result.unwrap() > 0);
    }
}



