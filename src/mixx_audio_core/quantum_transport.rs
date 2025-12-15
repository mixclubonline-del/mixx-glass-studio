use std::sync::atomic::{AtomicU64, AtomicBool, Ordering};
use crossbeam_queue::ArrayQueue;
use std::sync::Arc;

/// Quantum Transport System
/// 
/// Sample-accurate transport with:
/// - Atomic sample position tracking
/// - Pre-calculated beat grid
/// - Lookahead buffer for zero-latency sample access
/// - Transport state (play/pause/stop)

// ============================================================================
// Transport State
// ============================================================================

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum TransportState {
    Stopped,
    Playing,
    Paused,
    Recording,
}

impl Default for TransportState {
    fn default() -> Self {
        Self::Stopped
    }
}

// ============================================================================
// Time Signature
// ============================================================================

#[derive(Debug, Clone, Copy)]
pub struct TimeSignature {
    pub numerator: u8,   // Beats per bar (top number)
    pub denominator: u8, // Note value (bottom number)
}

impl Default for TimeSignature {
    fn default() -> Self {
        Self { numerator: 4, denominator: 4 }
    }
}

// ============================================================================
// Beat Grid
// ============================================================================

/// Pre-calculated beat position
#[derive(Debug, Clone, Copy)]
pub struct BeatPosition {
    pub sample_position: u64,
    pub bar: u32,
    pub beat: u8, // Within bar
    pub subdivision: f32, // 0.0 - 1.0 within beat
}

impl BeatPosition {
    pub fn zero() -> Self {
        Self {
            sample_position: 0,
            bar: 1,
            beat: 1,
            subdivision: 0.0,
        }
    }
}

/// Beat Grid Calculator
pub struct BeatGrid {
    pub bpm: f32,
    pub time_signature: TimeSignature,
    pub sample_rate: u32,
    
    /// Samples per beat
    samples_per_beat: u64,
    /// Samples per bar
    samples_per_bar: u64,
}

impl BeatGrid {
    pub fn new(bpm: f32, time_signature: TimeSignature, sample_rate: u32) -> Self {
        let samples_per_beat = ((60.0 / bpm) * sample_rate as f32) as u64;
        let samples_per_bar = samples_per_beat * time_signature.numerator as u64;
        
        Self {
            bpm,
            time_signature,
            sample_rate,
            samples_per_beat,
            samples_per_bar,
        }
    }
    
    /// Get beat position at sample
    pub fn position_at(&self, sample: u64) -> BeatPosition {
        let bars_completed = sample / self.samples_per_bar;
        let sample_in_bar = sample % self.samples_per_bar;
        let beats_in_bar = sample_in_bar / self.samples_per_beat;
        let sample_in_beat = sample_in_bar % self.samples_per_beat;
        let subdivision = sample_in_beat as f32 / self.samples_per_beat as f32;
        
        BeatPosition {
            sample_position: sample,
            bar: bars_completed as u32 + 1,
            beat: beats_in_bar as u8 + 1,
            subdivision,
        }
    }
    
    /// Get sample position at bar:beat
    pub fn sample_at(&self, bar: u32, beat: u8) -> u64 {
        let bar_samples = (bar.saturating_sub(1) as u64) * self.samples_per_bar;
        let beat_samples = (beat.saturating_sub(1) as u64) * self.samples_per_beat;
        bar_samples + beat_samples
    }
    
    /// Get next beat sample after position
    pub fn next_beat_after(&self, sample: u64) -> u64 {
        let current_beat_start = (sample / self.samples_per_beat) * self.samples_per_beat;
        current_beat_start + self.samples_per_beat
    }
    
    /// Get next bar sample after position
    pub fn next_bar_after(&self, sample: u64) -> u64 {
        let current_bar_start = (sample / self.samples_per_bar) * self.samples_per_bar;
        current_bar_start + self.samples_per_bar
    }
    
    /// Update BPM (recalculates grid)
    pub fn set_bpm(&mut self, bpm: f32) {
        self.bpm = bpm.clamp(20.0, 300.0);
        self.samples_per_beat = ((60.0 / self.bpm) * self.sample_rate as f32) as u64;
        self.samples_per_bar = self.samples_per_beat * self.time_signature.numerator as u64;
    }
    
    pub fn samples_per_beat(&self) -> u64 {
        self.samples_per_beat
    }
    
    pub fn samples_per_bar(&self) -> u64 {
        self.samples_per_bar
    }
}

// ============================================================================
// Quantum Transport
// ============================================================================

/// Quantum-locked Transport
/// 
/// Provides sample-accurate playback position with lookahead buffer
pub struct QuantumTransport {
    /// Current sample position (atomic for audio thread access)
    position: AtomicU64,
    
    /// Transport state
    playing: AtomicBool,
    recording: AtomicBool,
    
    /// Beat grid
    beat_grid: BeatGrid,
    
    /// Lookahead buffer (pre-processed samples)
    lookahead: Arc<ArrayQueue<f32>>,
    _lookahead_size: usize,
    
    /// Loop region (start, end) in samples
    loop_start: AtomicU64,
    loop_end: AtomicU64,
    loop_enabled: AtomicBool,
    
    /// Punch region for recording
    punch_in: AtomicU64,
    punch_out: AtomicU64,
    punch_enabled: AtomicBool,
}

impl QuantumTransport {
    pub fn new(sample_rate: u32, bpm: f32) -> Self {
        let lookahead_size = 4096;
        
        Self {
            position: AtomicU64::new(0),
            playing: AtomicBool::new(false),
            recording: AtomicBool::new(false),
            beat_grid: BeatGrid::new(bpm, TimeSignature::default(), sample_rate),
            lookahead: Arc::new(ArrayQueue::new(lookahead_size)),
            _lookahead_size: lookahead_size,
            loop_start: AtomicU64::new(0),
            loop_end: AtomicU64::new(0),
            loop_enabled: AtomicBool::new(false),
            punch_in: AtomicU64::new(0),
            punch_out: AtomicU64::new(0),
            punch_enabled: AtomicBool::new(false),
        }
    }
    
    // === Transport Controls ===
    
    pub fn play(&self) {
        self.playing.store(true, Ordering::SeqCst);
    }
    
    pub fn pause(&self) {
        self.playing.store(false, Ordering::SeqCst);
    }
    
    pub fn stop(&self) {
        self.playing.store(false, Ordering::SeqCst);
        self.recording.store(false, Ordering::SeqCst);
        self.position.store(0, Ordering::SeqCst);
    }
    
    pub fn record(&self) {
        self.recording.store(true, Ordering::SeqCst);
        self.playing.store(true, Ordering::SeqCst);
    }
    
    pub fn is_playing(&self) -> bool {
        self.playing.load(Ordering::Relaxed)
    }
    
    pub fn is_recording(&self) -> bool {
        self.recording.load(Ordering::Relaxed)
    }
    
    pub fn state(&self) -> TransportState {
        if self.recording.load(Ordering::Relaxed) {
            TransportState::Recording
        } else if self.playing.load(Ordering::Relaxed) {
            TransportState::Playing
        } else if self.position.load(Ordering::Relaxed) > 0 {
            TransportState::Paused
        } else {
            TransportState::Stopped
        }
    }
    
    // === Position ===
    
    pub fn position(&self) -> u64 {
        self.position.load(Ordering::Relaxed)
    }
    
    pub fn seek(&self, sample: u64) {
        self.position.store(sample, Ordering::SeqCst);
    }
    
    pub fn seek_to_bar(&self, bar: u32) {
        let sample = self.beat_grid.sample_at(bar, 1);
        self.seek(sample);
    }
    
    pub fn advance(&self, samples: u64) {
        let new_pos = self.position.fetch_add(samples, Ordering::Relaxed) + samples;
        
        // Handle looping
        if self.loop_enabled.load(Ordering::Relaxed) {
            let loop_end = self.loop_end.load(Ordering::Relaxed);
            if loop_end > 0 && new_pos >= loop_end {
                let loop_start = self.loop_start.load(Ordering::Relaxed);
                self.position.store(loop_start, Ordering::SeqCst);
            }
        }
    }
    
    pub fn beat_position(&self) -> BeatPosition {
        self.beat_grid.position_at(self.position())
    }
    
    // === Beat Grid ===
    
    pub fn set_bpm(&mut self, bpm: f32) {
        self.beat_grid.set_bpm(bpm);
    }
    
    pub fn bpm(&self) -> f32 {
        self.beat_grid.bpm
    }
    
    pub fn time_signature(&self) -> TimeSignature {
        self.beat_grid.time_signature
    }
    
    pub fn samples_per_beat(&self) -> u64 {
        self.beat_grid.samples_per_beat()
    }
    
    pub fn next_beat(&self) -> u64 {
        self.beat_grid.next_beat_after(self.position())
    }
    
    pub fn next_bar(&self) -> u64 {
        self.beat_grid.next_bar_after(self.position())
    }
    
    // === Loop ===
    
    pub fn set_loop(&self, start: u64, end: u64) {
        self.loop_start.store(start, Ordering::SeqCst);
        self.loop_end.store(end, Ordering::SeqCst);
    }
    
    pub fn enable_loop(&self, enabled: bool) {
        self.loop_enabled.store(enabled, Ordering::SeqCst);
    }
    
    pub fn loop_region(&self) -> (u64, u64, bool) {
        (
            self.loop_start.load(Ordering::Relaxed),
            self.loop_end.load(Ordering::Relaxed),
            self.loop_enabled.load(Ordering::Relaxed),
        )
    }
    
    // === Punch ===
    
    pub fn set_punch(&self, punch_in: u64, punch_out: u64) {
        self.punch_in.store(punch_in, Ordering::SeqCst);
        self.punch_out.store(punch_out, Ordering::SeqCst);
    }
    
    pub fn enable_punch(&self, enabled: bool) {
        self.punch_enabled.store(enabled, Ordering::SeqCst);
    }
    
    pub fn is_in_punch_range(&self) -> bool {
        if !self.punch_enabled.load(Ordering::Relaxed) {
            return true; // Not enabled = always record
        }
        let pos = self.position();
        let punch_in = self.punch_in.load(Ordering::Relaxed);
        let punch_out = self.punch_out.load(Ordering::Relaxed);
        pos >= punch_in && pos < punch_out
    }
    
    // === Lookahead ===
    
    pub fn push_lookahead(&self, sample: f32) -> bool {
        self.lookahead.push(sample).is_ok()
    }
    
    pub fn pop_lookahead(&self) -> Option<f32> {
        self.lookahead.pop()
    }
    
    pub fn lookahead_available(&self) -> usize {
        self.lookahead.len()
    }
}

unsafe impl Send for QuantumTransport {}
unsafe impl Sync for QuantumTransport {}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_beat_grid() {
        let grid = BeatGrid::new(120.0, TimeSignature::default(), 44100);
        
        // At 120 BPM, 1 beat = 0.5 seconds = 22050 samples
        assert_eq!(grid.samples_per_beat(), 22050);
        
        // 4/4 time = 4 beats per bar = 88200 samples
        assert_eq!(grid.samples_per_bar(), 88200);
        
        let pos = grid.position_at(0);
        assert_eq!(pos.bar, 1);
        assert_eq!(pos.beat, 1);
    }
    
    #[test]
    fn test_transport() {
        let transport = QuantumTransport::new(44100, 120.0);
        
        assert_eq!(transport.state(), TransportState::Stopped);
        
        transport.play();
        assert_eq!(transport.state(), TransportState::Playing);
        
        transport.advance(1000);
        assert_eq!(transport.position(), 1000);
        
        transport.pause();
        assert_eq!(transport.state(), TransportState::Paused);
        
        transport.stop();
        assert_eq!(transport.position(), 0);
    }
}
