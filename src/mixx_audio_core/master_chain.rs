//! Master Chain Orchestrator
//! 
//! Unified mastering chain that wires all plugins into a professional-grade
//! signal flow with mastering profile presets.
//! 
//! Signal Path:
//! Input → VelvetCurve → HarmonicLattice → PhaseWeave → MixxGlue → MixxDrive → 
//! Soft Limiter → True Peak Limiter → Output Gain → Loudness Meter → Output

use super::processor::AudioProcessor;
use super::velvet_curve::VelvetCurve;
use super::harmonic_lattice::HarmonicLattice;
use super::phase_weave::PhaseWeave;
use super::mixx_plugins::{MixxGlue, MixxDrive, MixxLimiter, VelvetTruePeakLimiter, VelvetLoudnessMeter};
use super::simd_utils;

// ============================================================================
// Mastering Profiles
// ============================================================================

/// Pre-configured mastering profiles for different target platforms
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum MasteringProfile {
    /// Streaming platforms (Spotify, Apple Music): -14 LUFS, -1 dBTP
    Streaming,
    /// Club/DJ: -8 LUFS, -0.5 dBTP (louder, more impact)
    Club,
    /// Broadcast/TV: -24 LUFS, -2 dBTP (EBU R128 compliant)
    Broadcast,
    /// Vinyl mastering: -12 LUFS, -1 dBTP (headroom for vinyl dynamics)
    Vinyl,
    /// Audiophile/Hi-Fi: -16 LUFS, -1 dBTP (dynamic range preserved)
    Audiophile,
}

impl MasteringProfile {
    /// Convert numeric value to profile (for Tauri commands)
    pub fn from_value(value: u32) -> Self {
        match value {
            0 => MasteringProfile::Streaming,
            1 => MasteringProfile::Club,
            2 => MasteringProfile::Broadcast,
            3 => MasteringProfile::Vinyl,
            4 => MasteringProfile::Audiophile,
            _ => MasteringProfile::Streaming,
        }
    }
    
    /// Target LUFS for the profile
    pub fn target_lufs(&self) -> f32 {
        match self {
            MasteringProfile::Streaming => -14.0,
            MasteringProfile::Club => -8.0,
            MasteringProfile::Broadcast => -24.0,
            MasteringProfile::Vinyl => -12.0,
            MasteringProfile::Audiophile => -16.0,
        }
    }
    
    /// Target true peak ceiling in dB
    pub fn target_true_peak(&self) -> f32 {
        match self {
            MasteringProfile::Streaming => -1.0,
            MasteringProfile::Club => -0.5,
            MasteringProfile::Broadcast => -2.0,
            MasteringProfile::Vinyl => -1.0,
            MasteringProfile::Audiophile => -1.0,
        }
    }
}

// ============================================================================
// Master Chain
// ============================================================================

/// Unified mastering chain with all processing stages
pub struct MasterChain {
    sample_rate: f32,
    profile: MasteringProfile,
    
    // === Stage 1: Sonic Pillars (Character) ===
    velvet_curve: VelvetCurve,
    harmonic_lattice: HarmonicLattice,
    phase_weave: PhaseWeave,
    
    // === Stage 2: Dynamics (Glue) ===
    glue: MixxGlue,
    
    // === Stage 3: Color (Saturation) ===
    drive: MixxDrive,
    
    // === Stage 4: Limiting ===
    soft_limiter: MixxLimiter,
    true_peak_limiter: VelvetTruePeakLimiter,
    
    // === Stage 5: Metering (Passthrough) ===
    loudness_meter: VelvetLoudnessMeter,
    
    // === Output ===
    output_gain: f32,
    
    // === Bypass flags ===
    bypass_pillars: bool,
    bypass_dynamics: bool,
    bypass_color: bool,
    bypass_limiting: bool,
}

impl MasterChain {
    /// Create a new master chain with the specified profile
    pub fn new(sample_rate: f32, profile: MasteringProfile) -> Self {
        let mut chain = Self {
            sample_rate,
            profile,
            velvet_curve: VelvetCurve::new(),
            harmonic_lattice: HarmonicLattice::new(),
            phase_weave: PhaseWeave::new(),
            glue: MixxGlue::new(sample_rate),
            drive: MixxDrive::new(),
            soft_limiter: MixxLimiter::new(sample_rate),
            true_peak_limiter: VelvetTruePeakLimiter::new(sample_rate),
            loudness_meter: VelvetLoudnessMeter::new(sample_rate),
            output_gain: 1.0,
            bypass_pillars: false,
            bypass_dynamics: false,
            bypass_color: false,
            bypass_limiting: false,
        };
        chain.apply_profile(profile);
        chain
    }
    
    /// Apply a mastering profile, configuring all processors
    pub fn apply_profile(&mut self, profile: MasteringProfile) {
        self.profile = profile;
        
        match profile {
            MasteringProfile::Streaming => {
                self.velvet_curve.warmth = 0.2;
                self.velvet_curve.silk_edge = 0.15;
                self.velvet_curve.emotion = 0.1;
                self.velvet_curve.power = 0.1;
                self.harmonic_lattice.even_drive = 0.1;
                self.harmonic_lattice.odd_drive = 0.05;
                self.phase_weave.width = 1.1;
                self.phase_weave.rotation = 0.0;
                self.glue.set_parameter("threshold", -18.0);
                self.glue.set_parameter("ratio", 2.2);
                self.glue.set_parameter("release", 100.0);
                self.glue.set_parameter("mix", 50.0);
                self.drive.set_parameter("drive", 0.1);
                self.drive.set_parameter("warmth", 0.3);
                self.drive.set_parameter("mix", 0.2);
                self.soft_limiter.set_parameter("ceiling", -1.5);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-14.0);
            }
            MasteringProfile::Club => {
                self.velvet_curve.warmth = 0.4;
                self.velvet_curve.silk_edge = 0.25;
                self.velvet_curve.emotion = 0.2;
                self.velvet_curve.power = 0.3;
                self.harmonic_lattice.even_drive = 0.2;
                self.harmonic_lattice.odd_drive = 0.15;
                self.phase_weave.width = 1.3;
                self.phase_weave.rotation = 0.0;
                self.glue.set_parameter("threshold", -14.0);
                self.glue.set_parameter("ratio", 2.5);
                self.glue.set_parameter("release", 80.0);
                self.glue.set_parameter("mix", 70.0);
                self.drive.set_parameter("drive", 0.25);
                self.drive.set_parameter("warmth", 0.4);
                self.drive.set_parameter("mix", 0.3);
                self.soft_limiter.set_parameter("ceiling", -1.0);
                self.true_peak_limiter.set_parameter("threshold", -0.5);
                self.output_gain = Self::gain_for_lufs(-8.0);
            }
            MasteringProfile::Broadcast => {
                self.velvet_curve.warmth = 0.1;
                self.velvet_curve.silk_edge = 0.1;
                self.velvet_curve.emotion = 0.05;
                self.velvet_curve.power = 0.05;
                self.harmonic_lattice.even_drive = 0.05;
                self.harmonic_lattice.odd_drive = 0.02;
                self.phase_weave.width = 1.0;
                self.phase_weave.rotation = 0.0;
                self.glue.set_parameter("threshold", -24.0);
                self.glue.set_parameter("ratio", 1.8);
                self.glue.set_parameter("release", 150.0);
                self.glue.set_parameter("mix", 40.0);
                self.drive.set_parameter("drive", 0.05);
                self.drive.set_parameter("warmth", 0.1);
                self.drive.set_parameter("mix", 0.1);
                self.soft_limiter.set_parameter("ceiling", -2.5);
                self.true_peak_limiter.set_parameter("threshold", -2.0);
                self.output_gain = Self::gain_for_lufs(-24.0);
            }
            MasteringProfile::Vinyl => {
                self.velvet_curve.warmth = 0.35;
                self.velvet_curve.silk_edge = 0.2;
                self.velvet_curve.emotion = 0.15;
                self.velvet_curve.power = 0.15;
                self.harmonic_lattice.even_drive = 0.25;
                self.harmonic_lattice.odd_drive = 0.1;
                self.phase_weave.width = 1.0;
                self.phase_weave.rotation = 0.0;
                self.glue.set_parameter("threshold", -20.0);
                self.glue.set_parameter("ratio", 2.0);
                self.glue.set_parameter("release", 120.0);
                self.glue.set_parameter("mix", 55.0);
                self.drive.set_parameter("drive", 0.2);
                self.drive.set_parameter("warmth", 0.5);
                self.drive.set_parameter("mix", 0.25);
                self.soft_limiter.set_parameter("ceiling", -1.5);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-12.0);
            }
            MasteringProfile::Audiophile => {
                self.velvet_curve.warmth = 0.1;
                self.velvet_curve.silk_edge = 0.1;
                self.velvet_curve.emotion = 0.05;
                self.velvet_curve.power = 0.0;
                self.harmonic_lattice.even_drive = 0.05;
                self.harmonic_lattice.odd_drive = 0.0;
                self.phase_weave.width = 1.0;
                self.phase_weave.rotation = 0.0;
                self.glue.set_parameter("threshold", -22.0);
                self.glue.set_parameter("ratio", 1.5);
                self.glue.set_parameter("release", 200.0);
                self.glue.set_parameter("mix", 30.0);
                self.drive.set_parameter("drive", 0.0);
                self.drive.set_parameter("warmth", 0.15);
                self.drive.set_parameter("mix", 0.1);
                self.soft_limiter.set_parameter("ceiling", -1.5);
                self.true_peak_limiter.set_parameter("threshold", -1.0);
                self.output_gain = Self::gain_for_lufs(-16.0);
            }
        }
    }
    
    /// Calculate output gain multiplier for target LUFS
    fn gain_for_lufs(target_lufs: f32) -> f32 {
        let reference_lufs = -14.0;
        let delta_db = target_lufs - reference_lufs;
        10.0_f32.powf(delta_db / 20.0)
    }
    
    /// Process a stereo sample pair through the entire master chain
    #[inline]
    pub fn process_stereo(&mut self, left: f32, right: f32) -> (f32, f32) {
        let (l_no_gain, r_no_gain) = self.process_stereo_no_gain(left, right);
        (l_no_gain * self.output_gain, r_no_gain * self.output_gain)
    }

    /// Process a stereo sample pair through everything EXCEPT output gain
    #[inline]
    fn process_stereo_no_gain(&mut self, left: f32, right: f32) -> (f32, f32) {
        let (mut l, mut r) = (left, right);
        
        // Stage 1: Sonic Pillars
        if !self.bypass_pillars {
            l = self.velvet_curve.process_sample(l);
            r = self.velvet_curve.process_sample(r);
            l = self.harmonic_lattice.process_sample(l);
            r = self.harmonic_lattice.process_sample(r);
            let mut stereo = [l, r];
            self.phase_weave.process_interleaved(&mut stereo, 2);
            l = stereo[0];
            r = stereo[1];
        }
        
        // Stage 2: Dynamics
        if !self.bypass_dynamics {
            (l, r) = self.glue.process_stereo(l, r);
        }
        
        // Stage 3: Color
        if !self.bypass_color {
            (l, r) = self.drive.process_stereo(l, r);
        }
        
        // Stage 4: Limiting
        if !self.bypass_limiting {
            (l, r) = self.soft_limiter.process_stereo(l, r);
            (l, r) = self.true_peak_limiter.process_stereo(l, r);
        }
        
        // Stage 6: Metering (moved before gain for LUFS accuracy relative to profile targets)
        // Note: Metering usually happens post-gain, but profile targets are defined relative to 0dBFS
        // so we process it here and apply gain last via SIMD.
        (l, r) = self.loudness_meter.process_stereo(l, r);
        
        (l, r)
    }
    
    /// Get current loudness meter readings
    pub fn get_meters(&self) -> MasterChainMeters {
        MasterChainMeters {
            momentary_lufs: self.loudness_meter.momentary_lufs,
            short_term_lufs: self.loudness_meter.short_term_lufs,
            integrated_lufs: self.loudness_meter.integrated_lufs,
            true_peak_db: self.loudness_meter.true_peak_db,
        }
    }
    
    /// Reset loudness meters
    pub fn reset_meters(&mut self) {
        self.loudness_meter.reset();
    }
    
    /// Get current profile
    pub fn profile(&self) -> MasteringProfile {
        self.profile
    }
    
    /// Get sample rate
    pub fn sample_rate(&self) -> f32 {
        self.sample_rate
    }
    
    /// Set bypass for a stage
    pub fn set_bypass(&mut self, stage: &str, bypass: bool) {
        match stage {
            "pillars" => self.bypass_pillars = bypass,
            "dynamics" => self.bypass_dynamics = bypass,
            "color" => self.bypass_color = bypass,
            "limiting" => self.bypass_limiting = bypass,
            _ => {}
        }
    }
}

/// Meter readings from the master chain
#[derive(Debug, Clone, Copy)]
pub struct MasterChainMeters {
    pub momentary_lufs: f32,
    pub short_term_lufs: f32,
    pub integrated_lufs: f32,
    pub true_peak_db: f32,
}

impl AudioProcessor for MasterChain {
    fn process(&mut self, data: &mut [f32], channels: usize) {
        if channels != 2 { return; }
        
        // Process all stages sample-by-sample except final gain
        for chunk in data.chunks_mut(2) {
            if chunk.len() == 2 {
                let (l, r) = self.process_stereo_no_gain(chunk[0], chunk[1]);
                chunk[0] = l;
                chunk[1] = r;
            }
        }
        
        // Final Output Gain (SIMD Optimized)
        if self.output_gain != 1.0 {
            simd_utils::simd_gain_stereo(data, self.output_gain);
        }
    }
    
    fn name(&self) -> &str { "MasterChain" }
    
    fn set_parameter(&mut self, name: &str, value: f32) {
        match name {
            "profile" => self.apply_profile(MasteringProfile::from_value(value as u32)),
            "output_gain" => self.output_gain = value.clamp(0.0, 4.0),
            "bypass_pillars" => self.bypass_pillars = value > 0.5,
            "bypass_dynamics" => self.bypass_dynamics = value > 0.5,
            "bypass_color" => self.bypass_color = value > 0.5,
            "bypass_limiting" => self.bypass_limiting = value > 0.5,
            "velvet_warmth" => self.velvet_curve.warmth = value.clamp(0.0, 1.0),
            "velvet_silk" => self.velvet_curve.silk_edge = value.clamp(0.0, 1.0),
            "velvet_emotion" => self.velvet_curve.emotion = value.clamp(0.0, 1.0),
            "velvet_power" => self.velvet_curve.power = value.clamp(0.0, 1.0),
            "harmonic_even" => self.harmonic_lattice.even_drive = value.clamp(0.0, 1.0),
            "harmonic_odd" => self.harmonic_lattice.odd_drive = value.clamp(0.0, 1.0),
            "phase_width" => self.phase_weave.width = value.clamp(0.0, 3.0),
            "phase_rotation" => self.phase_weave.rotation = value.clamp(0.0, 1.0),
            "glue_threshold" => self.glue.set_parameter("threshold", value),
            "glue_ratio" => self.glue.set_parameter("ratio", value),
            "glue_release" => self.glue.set_parameter("release", value),
            "glue_mix" => self.glue.set_parameter("mix", value),
            "drive_amount" => self.drive.set_parameter("drive", value),
            "drive_warmth" => self.drive.set_parameter("warmth", value),
            "drive_mix" => self.drive.set_parameter("mix", value),
            "limiter_ceiling" => self.soft_limiter.set_parameter("ceiling", value),
            "true_peak_threshold" => self.true_peak_limiter.set_parameter("threshold", value),
            "reset_meters" => self.reset_meters(),
            _ => {}
        }
    }
}

unsafe impl Send for MasterChain {}
unsafe impl Sync for MasterChain {}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_master_chain_profiles() {
        let mut chain = MasterChain::new(48000.0, MasteringProfile::Streaming);
        assert_eq!(chain.profile(), MasteringProfile::Streaming);
        chain.apply_profile(MasteringProfile::Club);
        assert_eq!(chain.profile(), MasteringProfile::Club);
    }
    
    #[test]
    fn test_master_chain_process() {
        let mut chain = MasterChain::new(48000.0, MasteringProfile::Streaming);
        let (l, r) = chain.process_stereo(0.0, 0.0);
        assert!(l.is_finite() && r.is_finite());
        let (l, r) = chain.process_stereo(0.5, -0.5);
        assert!(l.is_finite() && r.is_finite());
    }
    
    #[test]
    fn test_gain_for_lufs() {
        let gain = MasterChain::gain_for_lufs(-14.0);
        assert!((gain - 1.0).abs() < 0.001);
        assert!(MasterChain::gain_for_lufs(-8.0) > 1.0);
        assert!(MasterChain::gain_for_lufs(-24.0) < 1.0);
    }
}
