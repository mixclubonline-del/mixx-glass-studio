use std::sync::atomic::{AtomicBool, Ordering};

/// Track Mixer System
/// 
/// Provides track management and mixing:
/// - Per-track volume, pan, mute, solo
/// - Track types (Audio, MIDI, Master, Bus)
/// - Metering (peak, RMS)
/// - Send/return routing

// ============================================================================
// Track ID Generation
// ============================================================================

use std::sync::atomic::AtomicU64;

static NEXT_TRACK_ID: AtomicU64 = AtomicU64::new(1);

/// Generate unique track ID
pub fn next_track_id() -> u64 {
    NEXT_TRACK_ID.fetch_add(1, Ordering::Relaxed)
}

// ============================================================================
// Track Types
// ============================================================================

/// Track type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TrackType {
    /// Audio track (plays audio clips)
    Audio,
    /// MIDI track (plays MIDI clips through instrument)
    Midi,
    /// Bus track (receives from sends)
    Bus,
    /// Master track (final output)
    Master,
}

impl Default for TrackType {
    fn default() -> Self {
        Self::Audio
    }
}

// ============================================================================
// Metering
// ============================================================================

/// Peak and RMS metering
#[derive(Debug, Clone, Copy, Default)]
pub struct Meter {
    pub peak_l: f32,
    pub peak_r: f32,
    pub rms_l: f32,
    pub rms_r: f32,
}

impl Meter {
    pub fn new() -> Self {
        Self::default()
    }
    
    /// Update meter with new sample block (stereo interleaved)
    pub fn update(&mut self, samples: &[f32], decay: f32) {
        if samples.is_empty() {
            return;
        }
        
        let mut sum_l = 0.0f32;
        let mut sum_r = 0.0f32;
        let mut max_l = 0.0f32;
        let mut max_r = 0.0f32;
        let mut count = 0;
        
        for chunk in samples.chunks(2) {
            if chunk.len() >= 2 {
                let l = chunk[0].abs();
                let r = chunk[1].abs();
                max_l = max_l.max(l);
                max_r = max_r.max(r);
                sum_l += l * l;
                sum_r += r * r;
                count += 1;
            }
        }
        
        if count > 0 {
            // Update peak with decay
            self.peak_l = self.peak_l.max(max_l) * decay;
            self.peak_r = self.peak_r.max(max_r) * decay;
            
            // Update RMS
            self.rms_l = (sum_l / count as f32).sqrt();
            self.rms_r = (sum_r / count as f32).sqrt();
        }
    }
    
    /// Get peak as dB
    pub fn peak_db(&self) -> (f32, f32) {
        (
            if self.peak_l > 0.0 { 20.0 * self.peak_l.log10() } else { -96.0 },
            if self.peak_r > 0.0 { 20.0 * self.peak_r.log10() } else { -96.0 },
        )
    }
    
    /// Get RMS as dB
    pub fn rms_db(&self) -> (f32, f32) {
        (
            if self.rms_l > 0.0 { 20.0 * self.rms_l.log10() } else { -96.0 },
            if self.rms_r > 0.0 { 20.0 * self.rms_r.log10() } else { -96.0 },
        )
    }
    
    /// Reset meters
    pub fn reset(&mut self) {
        *self = Self::default();
    }
}

// ============================================================================
// Send
// ============================================================================

/// Send to a bus track
#[derive(Debug, Clone)]
pub struct Send {
    pub target_track_id: u64,
    pub gain: f32,  // 0.0 to 1.0+
    pub enabled: bool,
    pub pre_fader: bool,
}

impl Send {
    pub fn new(target_track_id: u64) -> Self {
        Self {
            target_track_id,
            gain: 0.0,
            enabled: true,
            pre_fader: false,
        }
    }
    
    pub fn with_gain(mut self, gain: f32) -> Self {
        self.gain = gain;
        self
    }
}

// ============================================================================
// Track
// ============================================================================

/// Audio/MIDI track with mixing controls
pub struct Track {
    pub id: u64,
    pub name: String,
    pub track_type: TrackType,
    
    /// Volume (0.0 to 2.0, 1.0 = unity)
    pub volume: f32,
    
    /// Pan (-1.0 to 1.0, 0.0 = center)
    pub pan: f32,
    
    /// Mute state
    muted: AtomicBool,
    
    /// Solo state
    soloed: AtomicBool,
    
    /// Armed for recording
    armed: AtomicBool,
    
    /// Input monitoring
    monitoring: AtomicBool,
    
    /// Sends to bus tracks
    sends: Vec<Send>,
    
    /// Metering
    pub meter: Meter,
    
    /// Color for UI (RGB hex)
    pub color: u32,
}

impl Track {
    pub fn new(name: &str, track_type: TrackType) -> Self {
        Self {
            id: next_track_id(),
            name: name.to_string(),
            track_type,
            volume: 1.0,
            pan: 0.0,
            muted: AtomicBool::new(false),
            soloed: AtomicBool::new(false),
            armed: AtomicBool::new(false),
            monitoring: AtomicBool::new(false),
            sends: Vec::new(),
            meter: Meter::new(),
            color: 0x4A90D9, // Default blue
        }
    }
    
    pub fn audio(name: &str) -> Self {
        Self::new(name, TrackType::Audio)
    }
    
    pub fn midi(name: &str) -> Self {
        Self::new(name, TrackType::Midi)
    }
    
    pub fn bus(name: &str) -> Self {
        Self::new(name, TrackType::Bus)
    }
    
    pub fn master() -> Self {
        let mut track = Self::new("Master", TrackType::Master);
        track.color = 0xD94A4A; // Red for master
        track
    }
    
    // === Mute/Solo ===
    
    pub fn mute(&self) {
        self.muted.store(true, Ordering::SeqCst);
    }
    
    pub fn unmute(&self) {
        self.muted.store(false, Ordering::SeqCst);
    }
    
    pub fn toggle_mute(&self) -> bool {
        let current = self.muted.load(Ordering::Relaxed);
        self.muted.store(!current, Ordering::SeqCst);
        !current
    }
    
    pub fn is_muted(&self) -> bool {
        self.muted.load(Ordering::Relaxed)
    }
    
    pub fn solo(&self) {
        self.soloed.store(true, Ordering::SeqCst);
    }
    
    pub fn unsolo(&self) {
        self.soloed.store(false, Ordering::SeqCst);
    }
    
    pub fn toggle_solo(&self) -> bool {
        let current = self.soloed.load(Ordering::Relaxed);
        self.soloed.store(!current, Ordering::SeqCst);
        !current
    }
    
    pub fn is_soloed(&self) -> bool {
        self.soloed.load(Ordering::Relaxed)
    }
    
    // === Recording ===
    
    pub fn arm(&self) {
        self.armed.store(true, Ordering::SeqCst);
    }
    
    pub fn disarm(&self) {
        self.armed.store(false, Ordering::SeqCst);
    }
    
    pub fn is_armed(&self) -> bool {
        self.armed.load(Ordering::Relaxed)
    }
    
    pub fn set_monitoring(&self, enabled: bool) {
        self.monitoring.store(enabled, Ordering::SeqCst);
    }
    
    pub fn is_monitoring(&self) -> bool {
        self.monitoring.load(Ordering::Relaxed)
    }
    
    // === Sends ===
    
    pub fn add_send(&mut self, target_id: u64, gain: f32) {
        self.sends.push(Send::new(target_id).with_gain(gain));
    }
    
    pub fn sends(&self) -> &[Send] {
        &self.sends
    }
    
    // === Pan Law ===
    
    /// Calculate stereo gains from pan position (-1 to 1)
    /// Uses constant power pan law
    pub fn pan_gains(&self) -> (f32, f32) {
        let angle = (self.pan + 1.0) * 0.25 * std::f32::consts::PI;
        (angle.cos(), angle.sin())
    }
    
    /// Process sample through track (volume + pan)
    pub fn process_sample(&self, left: f32, right: f32) -> (f32, f32) {
        if self.is_muted() {
            return (0.0, 0.0);
        }
        
        let (pan_l, pan_r) = self.pan_gains();
        (
            left * self.volume * pan_l,
            right * self.volume * pan_r,
        )
    }
}

// ============================================================================
// Mixer
// ============================================================================

/// Mixer manages all tracks and routing
pub struct Mixer {
    tracks: Vec<Track>,
    master_id: u64,
    
    /// Sample rate for metering
    _sample_rate: u32,
    
    /// Any track soloed?
    any_solo: AtomicBool,
}

impl Mixer {
    pub fn new(sample_rate: u32) -> Self {
        let master = Track::master();
        let master_id = master.id;
        
        Self {
            tracks: vec![master],
            master_id,
            _sample_rate: sample_rate,
            any_solo: AtomicBool::new(false),
        }
    }
    
    /// Add track to mixer
    pub fn add_track(&mut self, track: Track) -> u64 {
        let id = track.id;
        self.tracks.push(track);
        id
    }
    
    /// Create and add audio track
    pub fn add_audio_track(&mut self, name: &str) -> u64 {
        self.add_track(Track::audio(name))
    }
    
    /// Create and add MIDI track
    pub fn add_midi_track(&mut self, name: &str) -> u64 {
        self.add_track(Track::midi(name))
    }
    
    /// Create and add bus track
    pub fn add_bus(&mut self, name: &str) -> u64 {
        self.add_track(Track::bus(name))
    }
    
    /// Get track by ID
    pub fn get_track(&self, id: u64) -> Option<&Track> {
        self.tracks.iter().find(|t| t.id == id)
    }
    
    /// Get mutable track by ID
    pub fn get_track_mut(&mut self, id: u64) -> Option<&mut Track> {
        self.tracks.iter_mut().find(|t| t.id == id)
    }
    
    /// Get master track
    pub fn master(&self) -> Option<&Track> {
        self.get_track(self.master_id)
    }
    
    /// Get master track mutable
    pub fn master_mut(&mut self) -> Option<&mut Track> {
        self.get_track_mut(self.master_id)
    }
    
    /// Get all tracks (excluding master)
    pub fn tracks(&self) -> impl Iterator<Item = &Track> {
        self.tracks.iter().filter(|t| t.track_type != TrackType::Master)
    }
    
    /// Track count (excluding master)
    pub fn track_count(&self) -> usize {
        self.tracks.iter().filter(|t| t.track_type != TrackType::Master).count()
    }
    
    /// Delete track by ID
    pub fn delete_track(&mut self, id: u64) {
        // Never delete master
        if id != self.master_id {
            self.tracks.retain(|t| t.id != id);
        }
    }
    
    /// Update solo state (call after any solo change)
    pub fn update_solo_state(&self) {
        let any = self.tracks.iter().any(|t| t.is_soloed());
        self.any_solo.store(any, Ordering::SeqCst);
    }
    
    /// Check if track should be audible (considering solo)
    pub fn is_track_audible(&self, id: u64) -> bool {
        if let Some(track) = self.get_track(id) {
            if track.is_muted() {
                return false;
            }
            if self.any_solo.load(Ordering::Relaxed) {
                return track.is_soloed();
            }
            true
        } else {
            false
        }
    }
    
    /// Set track volume
    pub fn set_volume(&mut self, track_id: u64, volume: f32) {
        if let Some(track) = self.get_track_mut(track_id) {
            track.volume = volume.clamp(0.0, 2.0);
        }
    }
    
    /// Set track pan
    pub fn set_pan(&mut self, track_id: u64, pan: f32) {
        if let Some(track) = self.get_track_mut(track_id) {
            track.pan = pan.clamp(-1.0, 1.0);
        }
    }
    
    /// Toggle mute
    pub fn toggle_mute(&self, track_id: u64) -> bool {
        if let Some(track) = self.get_track(track_id) {
            track.toggle_mute()
        } else {
            false
        }
    }
    
    /// Toggle solo
    pub fn toggle_solo(&self, track_id: u64) -> bool {
        let result = if let Some(track) = self.get_track(track_id) {
            track.toggle_solo()
        } else {
            false
        };
        self.update_solo_state();
        result
    }
    
    /// Get mixer stats
    pub fn stats(&self) -> (usize, usize, usize) {
        let audio = self.tracks.iter().filter(|t| t.track_type == TrackType::Audio).count();
        let midi = self.tracks.iter().filter(|t| t.track_type == TrackType::Midi).count();
        let bus = self.tracks.iter().filter(|t| t.track_type == TrackType::Bus).count();
        (audio, midi, bus)
    }
}

impl Default for Mixer {
    fn default() -> Self {
        Self::new(48000)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_track_mute_solo() {
        let track = Track::audio("Test");
        
        assert!(!track.is_muted());
        track.mute();
        assert!(track.is_muted());
        
        assert!(!track.is_soloed());
        track.solo();
        assert!(track.is_soloed());
    }
    
    #[test]
    fn test_pan_law() {
        let track = Track::audio("Test");
        
        // Center pan should be equal
        let (l, r) = track.pan_gains();
        assert!((l - r).abs() < 0.01);
    }
    
    #[test]
    fn test_mixer() {
        let mut mixer = Mixer::new(44100);
        
        let id1 = mixer.add_audio_track("Track 1");
        let id2 = mixer.add_midi_track("MIDI 1");
        
        assert_eq!(mixer.track_count(), 2);
        
        mixer.toggle_mute(id1);
        assert!(!mixer.is_track_audible(id1));
        assert!(mixer.is_track_audible(id2));
    }
    
    #[test]
    fn test_meter() {
        let mut meter = Meter::new();
        
        let samples = vec![0.5, 0.5, 1.0, 1.0, 0.25, 0.25];
        meter.update(&samples, 0.99);
        
        assert!(meter.peak_l > 0.9); // Should catch the 1.0 peak
    }
}
