use std::sync::atomic::{AtomicU64, Ordering};
use std::collections::VecDeque;

/// Quantum Neural Inference System
/// 
/// Bridges audio DSP with AI inference for:
/// - Genre classification
/// - Pattern/beat prediction
/// - Parameter suggestion
/// 
/// Architecture-ready for WebGPU compute, currently CPU-based.

// ============================================================================
// Feature Extraction
// ============================================================================

/// Audio features extracted for neural inference
#[derive(Debug, Clone, Default)]
pub struct AudioFeatures {
    /// Root Mean Square (loudness)
    pub rms: f32,
    /// Zero Crossing Rate (brightness/noisiness)
    pub zcr: f32,
    /// Spectral centroid (brightness)
    pub spectral_centroid: f32,
    /// Spectral flatness (tonalness vs noise)
    pub spectral_flatness: f32,
    /// Peak amplitude
    pub peak: f32,
    /// Crest factor (peak/RMS ratio)
    pub crest_factor: f32,
    /// Simple energy bins (low, mid, high)
    pub energy_bands: [f32; 3],
}

impl AudioFeatures {
    /// Extract features from audio buffer
    pub fn from_buffer(samples: &[f32], sample_rate: u32) -> Self {
        let n = samples.len();
        if n == 0 {
            return Self::default();
        }
        
        // RMS
        let rms = (samples.iter().map(|s| s * s).sum::<f32>() / n as f32).sqrt();
        
        // Peak
        let peak = samples.iter().map(|s| s.abs()).fold(0.0f32, |a, b| a.max(b));
        
        // Crest factor
        let crest_factor = if rms > 0.0001 { peak / rms } else { 0.0 };
        
        // Zero Crossing Rate
        let mut zcr_count = 0;
        for i in 1..n {
            if (samples[i] >= 0.0) != (samples[i - 1] >= 0.0) {
                zcr_count += 1;
            }
        }
        let zcr = zcr_count as f32 / n as f32;
        
        // Simple energy bands (low < 300Hz, mid 300-2000Hz, high > 2000Hz)
        // Using zero-crossing as proxy for frequency content
        let energy_bands = Self::estimate_energy_bands(samples, sample_rate);
        
        // Spectral centroid approximation using ZCR
        let spectral_centroid = zcr * (sample_rate as f32 / 2.0);
        
        // Spectral flatness (geometric mean / arithmetic mean)
        // Simplified: use variance of absolute values as proxy
        let mean_abs = samples.iter().map(|s| s.abs()).sum::<f32>() / n as f32;
        let variance = samples.iter()
            .map(|s| (s.abs() - mean_abs).powi(2))
            .sum::<f32>() / n as f32;
        let spectral_flatness = if mean_abs > 0.0001 { 
            1.0 - (variance / (mean_abs * mean_abs)).min(1.0) 
        } else { 
            0.0 
        };
        
        Self {
            rms,
            zcr,
            spectral_centroid,
            spectral_flatness,
            peak,
            crest_factor,
            energy_bands,
        }
    }
    
    fn estimate_energy_bands(samples: &[f32], _sample_rate: u32) -> [f32; 3] {
        // Simple approximation: split buffer into thirds and measure energy
        let n = samples.len();
        if n < 3 {
            return [0.0, 0.0, 0.0];
        }
        
        let third = n / 3;
        let low = samples[..third].iter().map(|s| s * s).sum::<f32>() / third as f32;
        let mid = samples[third..2*third].iter().map(|s| s * s).sum::<f32>() / third as f32;
        let high = samples[2*third..].iter().map(|s| s * s).sum::<f32>() / (n - 2*third) as f32;
        
        [low.sqrt(), mid.sqrt(), high.sqrt()]
    }
    
    /// Convert to feature vector for inference
    pub fn to_vector(&self) -> Vec<f32> {
        vec![
            self.rms,
            self.zcr,
            self.spectral_centroid / 1000.0, // Normalize
            self.spectral_flatness,
            self.peak,
            self.crest_factor / 10.0, // Normalize
            self.energy_bands[0],
            self.energy_bands[1],
            self.energy_bands[2],
        ]
    }
}

// ============================================================================
// Inference Results
// ============================================================================

/// Genre classification result
#[derive(Debug, Clone)]
pub struct GenreClassification {
    pub genre: String,
    pub confidence: f32,
    pub alternatives: Vec<(String, f32)>,
}

impl Default for GenreClassification {
    fn default() -> Self {
        Self {
            genre: "Unknown".to_string(),
            confidence: 0.0,
            alternatives: Vec::new(),
        }
    }
}

/// Pattern/beat prediction result
#[derive(Debug, Clone, Default)]
pub struct PatternPrediction {
    pub bpm: f32,
    pub bpm_confidence: f32,
    pub time_signature: (u8, u8), // (beats, note value)
    pub next_beat_samples: u64,
    pub pattern_type: String,
}

/// Parameter suggestion from AI
#[derive(Debug, Clone)]
pub struct ParameterSuggestion {
    pub parameter_name: String,
    pub suggested_value: f32,
    pub confidence: f32,
    pub reason: String,
}

// ============================================================================
// Neural Bridge
// ============================================================================

/// Neural Bridge - Coordinates AI inference
pub struct NeuralBridge {
    /// Feature history for temporal analysis
    feature_history: VecDeque<AudioFeatures>,
    history_max: usize,
    
    /// Last inference results
    last_genre: GenreClassification,
    last_pattern: PatternPrediction,
    
    /// Inference counters
    inferences_run: AtomicU64,
    sample_rate: u32,
}

impl NeuralBridge {
    pub fn new(sample_rate: u32) -> Self {
        Self {
            feature_history: VecDeque::with_capacity(64),
            history_max: 64,
            last_genre: GenreClassification::default(),
            last_pattern: PatternPrediction::default(),
            inferences_run: AtomicU64::new(0),
            sample_rate,
        }
    }
    
    /// Extract features and add to history
    pub fn analyze(&mut self, samples: &[f32]) {
        let features = AudioFeatures::from_buffer(samples, self.sample_rate);
        
        if self.feature_history.len() >= self.history_max {
            self.feature_history.pop_front();
        }
        self.feature_history.push_back(features);
    }
    
    /// Get current audio features
    pub fn current_features(&self) -> Option<AudioFeatures> {
        self.feature_history.back().cloned()
    }
    
    /// Get average features over history
    pub fn average_features(&self) -> AudioFeatures {
        if self.feature_history.is_empty() {
            return AudioFeatures::default();
        }
        
        let n = self.feature_history.len() as f32;
        let mut avg = AudioFeatures::default();
        
        for f in &self.feature_history {
            avg.rms += f.rms;
            avg.zcr += f.zcr;
            avg.spectral_centroid += f.spectral_centroid;
            avg.spectral_flatness += f.spectral_flatness;
            avg.peak += f.peak;
            avg.crest_factor += f.crest_factor;
            avg.energy_bands[0] += f.energy_bands[0];
            avg.energy_bands[1] += f.energy_bands[1];
            avg.energy_bands[2] += f.energy_bands[2];
        }
        
        avg.rms /= n;
        avg.zcr /= n;
        avg.spectral_centroid /= n;
        avg.spectral_flatness /= n;
        avg.peak /= n;
        avg.crest_factor /= n;
        avg.energy_bands[0] /= n;
        avg.energy_bands[1] /= n;
        avg.energy_bands[2] /= n;
        
        avg
    }
    
    /// Infer genre from current features (placeholder for real ML model)
    pub fn infer_genre(&mut self) -> GenreClassification {
        let features = self.average_features();
        self.inferences_run.fetch_add(1, Ordering::Relaxed);
        
        // Heuristic genre classification based on features
        // In production, this would call a real ML model
        let genre = if features.energy_bands[0] > 0.3 && features.crest_factor < 3.0 {
            ("Electronic/EDM", 0.7)
        } else if features.zcr > 0.15 && features.spectral_flatness > 0.5 {
            ("Rock/Metal", 0.6)
        } else if features.rms < 0.2 && features.spectral_flatness < 0.3 {
            ("Ambient/Chill", 0.65)
        } else if features.energy_bands[1] > features.energy_bands[0] {
            ("Pop/Vocal", 0.55)
        } else {
            ("Unknown", 0.3)
        };
        
        let result = GenreClassification {
            genre: genre.0.to_string(),
            confidence: genre.1,
            alternatives: vec![
                ("Electronic".to_string(), 0.3),
                ("Hip-Hop".to_string(), 0.2),
            ],
        };
        
        self.last_genre = result.clone();
        result
    }
    
    /// Infer pattern/tempo from features (placeholder for real ML model)
    pub fn infer_pattern(&mut self) -> PatternPrediction {
        let features = self.average_features();
        self.inferences_run.fetch_add(1, Ordering::Relaxed);
        
        // Heuristic BPM estimation based on ZCR and energy
        let estimated_bpm = if features.zcr > 0.1 {
            120.0 + (features.zcr * 100.0)
        } else {
            90.0 + (features.rms * 50.0)
        };
        
        let result = PatternPrediction {
            bpm: estimated_bpm.clamp(60.0, 200.0),
            bpm_confidence: 0.5,
            time_signature: (4, 4),
            next_beat_samples: (self.sample_rate as f64 * 60.0 / estimated_bpm as f64) as u64,
            pattern_type: "4-on-the-floor".to_string(),
        };
        
        self.last_pattern = result.clone();
        result
    }
    
    /// Suggest DSP parameters based on genre
    pub fn suggest_parameters(&self) -> Vec<ParameterSuggestion> {
        let genre = &self.last_genre.genre;
        
        let suggestions = match genre.as_str() {
            "Electronic/EDM" => vec![
                ParameterSuggestion {
                    parameter_name: "velvet_warmth".to_string(),
                    suggested_value: 0.4,
                    confidence: 0.7,
                    reason: "EDM typically benefits from cleaner sound".to_string(),
                },
                ParameterSuggestion {
                    parameter_name: "phase_width".to_string(),
                    suggested_value: 1.5,
                    confidence: 0.8,
                    reason: "Wide stereo image for electronic music".to_string(),
                },
            ],
            "Rock/Metal" => vec![
                ParameterSuggestion {
                    parameter_name: "harmonic_drive".to_string(),
                    suggested_value: 0.6,
                    confidence: 0.75,
                    reason: "Add harmonic saturation for aggressive sound".to_string(),
                },
                ParameterSuggestion {
                    parameter_name: "velvet_power".to_string(),
                    suggested_value: 0.7,
                    confidence: 0.7,
                    reason: "Push the limiter for loudness".to_string(),
                },
            ],
            "Ambient/Chill" => vec![
                ParameterSuggestion {
                    parameter_name: "velvet_silk".to_string(),
                    suggested_value: 0.8,
                    confidence: 0.8,
                    reason: "Smooth high frequencies for relaxed sound".to_string(),
                },
                ParameterSuggestion {
                    parameter_name: "phase_rotation".to_string(),
                    suggested_value: 0.2,
                    confidence: 0.6,
                    reason: "Subtle phase for depth".to_string(),
                },
            ],
            _ => vec![],
        };
        
        suggestions
    }
    
    /// Get inference statistics
    pub fn stats(&self) -> (u64, usize) {
        (
            self.inferences_run.load(Ordering::Relaxed),
            self.feature_history.len(),
        )
    }
    
    /// Get last genre result
    pub fn last_genre(&self) -> &GenreClassification {
        &self.last_genre
    }
    
    /// Get last pattern result
    pub fn last_pattern(&self) -> &PatternPrediction {
        &self.last_pattern
    }
}

unsafe impl Send for NeuralBridge {}
unsafe impl Sync for NeuralBridge {}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_feature_extraction() {
        let samples: Vec<f32> = (0..1024).map(|i| (i as f32 * 0.01).sin()).collect();
        let features = AudioFeatures::from_buffer(&samples, 44100);
        
        assert!(features.rms > 0.0);
        assert!(features.zcr > 0.0);
    }
    
    #[test]
    fn test_neural_bridge() {
        let mut bridge = NeuralBridge::new(44100);
        let samples: Vec<f32> = (0..1024).map(|i| (i as f32 * 0.01).sin()).collect();
        
        bridge.analyze(&samples);
        let genre = bridge.infer_genre();
        
        assert!(!genre.genre.is_empty());
        assert!(genre.confidence > 0.0);
    }
}
