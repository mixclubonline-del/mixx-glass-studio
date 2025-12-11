/**
 * MixxDSPMath - Audio-Optimized DSP Math Library
 * 
 * Replaces: nalgebra, num-complex, num-traits
 * 
 * Provides audio-specific mathematical operations optimized for
 * Five Pillars processing and general DSP tasks.
 */

use std::ops::{Add, Mul, Sub};

/// Complex number for FFT operations
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Complex {
    pub real: f32,
    pub imag: f32,
}

impl Complex {
    pub fn new(real: f32, imag: f32) -> Self {
        Self { real, imag }
    }

    pub fn from_polar(magnitude: f32, phase: f32) -> Self {
        Self {
            real: magnitude * phase.cos(),
            imag: magnitude * phase.sin(),
        }
    }

    pub fn magnitude(&self) -> f32 {
        (self.real * self.real + self.imag * self.imag).sqrt()
    }

    pub fn phase(&self) -> f32 {
        self.imag.atan2(self.real)
    }

    pub fn conjugate(&self) -> Self {
        Self {
            real: self.real,
            imag: -self.imag,
        }
    }
}

impl Add for Complex {
    type Output = Self;

    fn add(self, other: Self) -> Self {
        Self {
            real: self.real + other.real,
            imag: self.imag + other.imag,
        }
    }
}

impl Sub for Complex {
    type Output = Self;

    fn sub(self, other: Self) -> Self {
        Self {
            real: self.real - other.real,
            imag: self.imag - other.imag,
        }
    }
}

impl Mul for Complex {
    type Output = Self;

    fn mul(self, other: Self) -> Self {
        Self {
            real: self.real * other.real - self.imag * other.imag,
            imag: self.real * other.imag + self.imag * other.real,
        }
    }
}

impl Mul<f32> for Complex {
    type Output = Self;

    fn mul(self, scalar: f32) -> Self {
        Self {
            real: self.real * scalar,
            imag: self.imag * scalar,
        }
    }
}

/// Vector operations optimized for audio processing
pub mod vector {
    use super::*;

    /// Add two vectors element-wise
    pub fn add_vectors(a: &[f32], b: &[f32]) -> Vec<f32> {
        assert_eq!(a.len(), b.len());
        a.iter().zip(b.iter()).map(|(x, y)| x + y).collect()
    }

    /// Multiply two vectors element-wise
    pub fn multiply_vectors(a: &[f32], b: &[f32]) -> Vec<f32> {
        assert_eq!(a.len(), b.len());
        a.iter().zip(b.iter()).map(|(x, y)| x * y).collect()
    }

    /// Scale vector by scalar
    pub fn scale_vector(v: &[f32], scalar: f32) -> Vec<f32> {
        v.iter().map(|x| x * scalar).collect()
    }

    /// Compute RMS (Root Mean Square) of vector
    pub fn rms(v: &[f32]) -> f32 {
        if v.is_empty() {
            return 0.0;
        }
        let sum_squares: f32 = v.iter().map(|x| x * x).sum();
        (sum_squares / v.len() as f32).sqrt()
    }

    /// Compute peak value
    pub fn peak(v: &[f32]) -> f32 {
        v.iter()
            .map(|x| x.abs())
            .fold(0.0f32, |a, b| a.max(b))
    }

    /// Normalize vector to [-1, 1] range
    pub fn normalize(v: &mut [f32]) {
        let peak_val = peak(v);
        if peak_val > 0.0 {
            let scale = 1.0 / peak_val;
            for sample in v.iter_mut() {
                *sample *= scale;
            }
        }
    }
}

/// FFT operations for frequency domain processing
pub mod fft {
    use super::Complex;

    /// Simple FFT implementation (Cooley-Tukey algorithm)
    /// For production, consider using a more optimized library
    pub fn fft(input: &[f32]) -> Vec<Complex> {
        let n = input.len();
        if n == 0 {
            return Vec::new();
        }

        // Pad to next power of 2
        let padded_len = n.next_power_of_two();
        let mut complex_input: Vec<Complex> = input
            .iter()
            .map(|&x| Complex::new(x, 0.0))
            .collect();
        complex_input.resize(padded_len, Complex::new(0.0, 0.0));

        fft_recursive(&mut complex_input)
    }

    /// Inverse FFT
    pub fn ifft(input: &[Complex]) -> Vec<f32> {
        let n = input.len();
        if n == 0 {
            return Vec::new();
        }

        let mut complex_input: Vec<Complex> = input.to_vec();
        let result = fft_recursive(&mut complex_input);

        // Conjugate and scale
        result
            .iter()
            .take(n)
            .map(|c| c.conjugate().real / n as f32)
            .collect()
    }

    fn fft_recursive(x: &mut [Complex]) -> Vec<Complex> {
        let n = x.len();
        if n <= 1 {
            return x.to_vec();
        }

        // Divide
        let mut even: Vec<Complex> = x.iter().step_by(2).copied().collect();
        let mut odd: Vec<Complex> = x.iter().skip(1).step_by(2).copied().collect();

        // Conquer
        let even_fft = fft_recursive(&mut even);
        let odd_fft = fft_recursive(&mut odd);

        // Combine
        let mut result = vec![Complex::new(0.0, 0.0); n];
        for k in 0..n / 2 {
            let t = Complex::from_polar(1.0, -2.0 * std::f32::consts::PI * k as f32 / n as f32)
                * odd_fft[k];
            result[k] = even_fft[k] + t;
            result[k + n / 2] = even_fft[k] - t;
        }

        result
    }
}

/// Five Pillars specific operations
pub mod five_pillars {
    /// Velvet Curve processing
    /// Applies the signature MixxClub velvet curve to audio samples
    pub fn velvet_curve_process(samples: &[f32], warmth: f32, silk: f32) -> Vec<f32> {
        samples
            .iter()
            .map(|&sample| {
                // Velvet curve: smooth saturation with warmth and silk
                let saturated = sample * (1.0 + warmth * sample.abs());
                saturated * (1.0 + silk * (1.0 - sample.abs()))
            })
            .collect()
    }

    /// Harmonic Lattice processing
    /// Enhances upper harmonics
    pub fn harmonic_lattice_process(samples: &[f32], intensity: f32) -> Vec<f32> {
        samples
            .iter()
            .map(|&sample| {
                // Add subtle harmonic content
                let harmonic = (sample * 2.0).tanh() * intensity;
                sample + harmonic * 0.1
            })
            .collect()
    }

    /// Phase Weave processing
    /// Stereo field manipulation
    pub fn phase_weave_process(left: &[f32], right: &[f32], width: f32) -> (Vec<f32>, Vec<f32>) {
        let mid: Vec<f32> = vector::add_vectors(left, right)
            .iter()
            .map(|x| x * 0.5)
            .collect();
        let side: Vec<f32> = vector::add_vectors(left, &vector::scale_vector(right, -1.0))
            .iter()
            .map(|x| x * 0.5)
            .collect();

        let scaled_side = vector::scale_vector(&side, width);

        let new_left = vector::add_vectors(&mid, &scaled_side);
        let new_right = vector::add_vectors(&mid, &vector::scale_vector(&scaled_side, -1.0));

        (new_left, new_right)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_complex_operations() {
        let a = Complex::new(1.0, 2.0);
        let b = Complex::new(3.0, 4.0);
        let sum = a + b;
        assert_eq!(sum.real, 4.0);
        assert_eq!(sum.imag, 6.0);
    }

    #[test]
    fn test_vector_operations() {
        let a = vec![1.0, 2.0, 3.0];
        let b = vec![4.0, 5.0, 6.0];
        let sum = vector::add_vectors(&a, &b);
        assert_eq!(sum, vec![5.0, 7.0, 9.0]);
    }

    #[test]
    fn test_fft() {
        // Test with simple sine wave
        let input: Vec<f32> = (0..8)
            .map(|i| (2.0 * std::f32::consts::PI * i as f32 / 8.0).sin())
            .collect();
        let result = fft::fft(&input);
        assert_eq!(result.len(), 8);
    }
}



