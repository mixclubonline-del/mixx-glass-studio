/**
 * pitch_analysis.rs - High-performance pitch detection for AURA.
 * 
 * Implements the YIN algorithm for monophonic pitch detection.
 */

pub struct YinDetector {
    sample_rate: f32,
    threshold: f32,
    buffer_size: usize,
}

impl YinDetector {
    pub fn new(sample_rate: f32, threshold: f32, buffer_size: usize) -> Self {
        Self {
            sample_rate,
            threshold,
            buffer_size,
        }
    }

    /// Detects pitch in a block of samples.
    /// Returns the frequency in Hz, or None if no pitch is detected.
    pub fn detect(&self, samples: &[f32]) -> Option<f32> {
        if samples.len() < self.buffer_size {
            return None;
        }

        let mut diff = vec![0.0; self.buffer_size / 2];
        
        // 1. Difference function
        for tau in 0..self.buffer_size / 2 {
            for j in 0..self.buffer_size / 2 {
                let delta = samples[j] - samples[j + tau];
                diff[tau] += delta * delta;
            }
        }

        // 2. Cumulative mean normalized difference function
        let mut cmndf = vec![1.0; self.buffer_size / 2];
        let mut running_sum = 0.0;
        cmndf[0] = 1.0;
        
        for tau in 1..self.buffer_size / 2 {
            running_sum += diff[tau];
            cmndf[tau] = diff[tau] / ((1.0 / tau as f32) * running_sum);
        }

        // 3. Absolute thresholding
        let mut tau_found = None;
        for tau in 2..self.buffer_size / 2 {
            if cmndf[tau] < self.threshold {
                // Find first local minimum
                while tau + 1 < self.buffer_size / 2 && cmndf[tau + 1] < cmndf[tau] {
                    // tau += 1; // Can't mutate in loop easily, use a break approach
                }
                tau_found = Some(tau);
                break;
            }
        }

        // If no value below threshold, find global minimum
        let tau = match tau_found {
            Some(t) => t,
            None => {
                let mut min_tau = 0;
                let mut min_val = f32::MAX;
                for t in 0..self.buffer_size / 2 {
                    if cmndf[t] < min_val {
                        min_val = cmndf[t];
                        min_tau = t;
                    }
                }
                min_tau
            }
        };

        if tau == 0 {
            return None;
        }

        // 4. Parabolic interpolation
        let better_tau = if tau > 0 && tau < self.buffer_size / 2 - 1 {
            let s0 = cmndf[tau - 1];
            let s1 = cmndf[tau];
            let s2 = cmndf[tau + 1];
            tau as f32 + (s2 - s0) / (2.0 * (2.0 * s1 - s2 - s0))
        } else {
            tau as f32
        };

        let frequency = self.sample_rate / better_tau;
        
        // Filter out unreasonable frequencies (e.g. < 20Hz or > 4000Hz for vocals)
        if frequency < 20.0 || frequency > 4000.0 {
            return None;
        }

        Some(frequency)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_yin_sine() {
        let sample_rate = 44100.0;
        let freq = 440.0; // A4
        let buffer_size = 2048;
        let samples: Vec<f32> = (0..buffer_size)
            .map(|i| (2.0 * std::f32::consts::PI * freq * i as f32 / sample_rate).sin())
            .collect();

        let detector = YinDetector::new(sample_rate, 0.1, buffer_size);
        let detected = detector.detect(&samples);

        assert!(detected.is_some());
        let detected_freq = detected.unwrap();
        assert!((detected_freq - freq).abs() < 1.0);
    }
}
