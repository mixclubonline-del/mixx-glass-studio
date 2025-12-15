use serde::{Deserialize, Serialize};

/// Tempo Map and Markers
/// 
/// Provides tempo automation:
/// - Tempo events with interpolation
/// - Time signature changes
/// - Timeline markers (cue points, sections)
/// - Beat/bar position calculations

// ============================================================================
// Time Signature
// ============================================================================

/// Time signature at a specific point
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct TimeSignature {
    pub numerator: u8,
    pub denominator: u8,
}

impl TimeSignature {
    pub fn new(numerator: u8, denominator: u8) -> Self {
        Self { 
            numerator: numerator.max(1).min(16),
            denominator: denominator.max(1).min(16),
        }
    }
    
    /// Beats per bar
    pub fn beats_per_bar(&self) -> u8 {
        self.numerator
    }
    
    /// Beat value (4 = quarter, 8 = eighth)
    pub fn beat_value(&self) -> u8 {
        self.denominator
    }
    
    /// Quarter notes per bar
    pub fn quarters_per_bar(&self) -> f32 {
        self.numerator as f32 * (4.0 / self.denominator as f32)
    }
}

impl Default for TimeSignature {
    fn default() -> Self {
        Self::new(4, 4)
    }
}

// ============================================================================
// Tempo Event
// ============================================================================

/// Tempo change event
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct TempoEvent {
    /// Position in samples
    pub position: u64,
    
    /// Tempo in BPM
    pub bpm: f32,
    
    /// Curve type for interpolation to next event
    pub curve: TempoCurve,
}

/// Tempo interpolation curve
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum TempoCurve {
    /// Instant jump
    Step,
    /// Linear ramp
    Linear,
    /// S-curve (smooth)
    SCurve,
}

impl Default for TempoCurve {
    fn default() -> Self {
        Self::Step
    }
}

impl TempoEvent {
    pub fn new(position: u64, bpm: f32) -> Self {
        Self {
            position,
            bpm: bpm.clamp(20.0, 999.0),
            curve: TempoCurve::Step,
        }
    }
    
    pub fn with_curve(mut self, curve: TempoCurve) -> Self {
        self.curve = curve;
        self
    }
}

// ============================================================================
// Time Signature Event
// ============================================================================

/// Time signature change event
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct TimeSignatureEvent {
    /// Position in samples
    pub position: u64,
    
    /// Time signature
    pub time_sig: TimeSignature,
}

impl TimeSignatureEvent {
    pub fn new(position: u64, numerator: u8, denominator: u8) -> Self {
        Self {
            position,
            time_sig: TimeSignature::new(numerator, denominator),
        }
    }
}

// ============================================================================
// Marker
// ============================================================================

/// Marker type
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub enum MarkerType {
    /// General marker
    Marker,
    /// Song section (verse, chorus, etc.)
    Section,
    /// Cue point for DJ/performance
    Cue,
    /// Loop start
    LoopStart,
    /// Loop end
    LoopEnd,
    /// Punch in point
    PunchIn,
    /// Punch out point
    PunchOut,
}

impl Default for MarkerType {
    fn default() -> Self {
        Self::Marker
    }
}

/// Timeline marker
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Marker {
    /// Unique ID
    pub id: u64,
    
    /// Position in samples
    pub position: u64,
    
    /// Marker name
    pub name: String,
    
    /// Marker type
    pub marker_type: MarkerType,
    
    /// Color (RGB hex)
    pub color: u32,
}

impl Marker {
    pub fn new(id: u64, position: u64, name: &str) -> Self {
        Self {
            id,
            position,
            name: name.to_string(),
            marker_type: MarkerType::Marker,
            color: 0xFFD700, // Gold
        }
    }
    
    pub fn section(id: u64, position: u64, name: &str) -> Self {
        Self {
            id,
            position,
            name: name.to_string(),
            marker_type: MarkerType::Section,
            color: 0x4A90D9, // Blue
        }
    }
    
    pub fn cue(id: u64, position: u64, name: &str) -> Self {
        Self {
            id,
            position,
            name: name.to_string(),
            marker_type: MarkerType::Cue,
            color: 0xFF4444, // Red
        }
    }
}

// ============================================================================
// Tempo Map
// ============================================================================

use std::sync::atomic::{AtomicU64, Ordering};

static NEXT_MARKER_ID: AtomicU64 = AtomicU64::new(1);

fn next_marker_id() -> u64 {
    NEXT_MARKER_ID.fetch_add(1, Ordering::Relaxed)
}

/// Tempo map for managing tempo/time sig changes
pub struct TempoMap {
    /// Tempo events (sorted by position)
    tempo_events: Vec<TempoEvent>,
    
    /// Time signature events (sorted by position)
    time_sig_events: Vec<TimeSignatureEvent>,
    
    /// Markers (sorted by position)
    markers: Vec<Marker>,
    
    /// Sample rate for calculations
    sample_rate: u32,
}

impl TempoMap {
    pub fn new(sample_rate: u32, initial_bpm: f32) -> Self {
        let mut map = Self {
            tempo_events: Vec::new(),
            time_sig_events: Vec::new(),
            markers: Vec::new(),
            sample_rate,
        };
        
        // Add initial tempo and time sig
        map.tempo_events.push(TempoEvent::new(0, initial_bpm));
        map.time_sig_events.push(TimeSignatureEvent::new(0, 4, 4));
        
        map
    }
    
    // === Tempo ===
    
    /// Add tempo event
    pub fn add_tempo(&mut self, position: u64, bpm: f32, curve: TempoCurve) {
        let event = TempoEvent::new(position, bpm).with_curve(curve);
        
        // Remove existing event at same position
        self.tempo_events.retain(|e| e.position != position);
        
        self.tempo_events.push(event);
        self.tempo_events.sort_by_key(|e| e.position);
    }
    
    /// Remove tempo event (won't remove position 0)
    pub fn remove_tempo(&mut self, position: u64) {
        if position > 0 {
            self.tempo_events.retain(|e| e.position != position);
        }
    }
    
    /// Get tempo at position
    pub fn tempo_at(&self, position: u64) -> f32 {
        // Find the two events around this position
        let mut prev_event = &self.tempo_events[0];
        let mut next_event: Option<&TempoEvent> = None;
        
        for event in &self.tempo_events {
            if event.position <= position {
                prev_event = event;
            } else {
                next_event = Some(event);
                break;
            }
        }
        
        match (prev_event.curve, next_event) {
            (TempoCurve::Step, _) => prev_event.bpm,
            (TempoCurve::Linear, Some(next)) => {
                let t = (position - prev_event.position) as f32 
                    / (next.position - prev_event.position) as f32;
                prev_event.bpm + t * (next.bpm - prev_event.bpm)
            }
            (TempoCurve::SCurve, Some(next)) => {
                let t = (position - prev_event.position) as f32 
                    / (next.position - prev_event.position) as f32;
                // Smoothstep interpolation
                let s = t * t * (3.0 - 2.0 * t);
                prev_event.bpm + s * (next.bpm - prev_event.bpm)
            }
            _ => prev_event.bpm,
        }
    }
    
    /// Get all tempo events
    pub fn tempo_events(&self) -> &[TempoEvent] {
        &self.tempo_events
    }
    
    // === Time Signature ===
    
    /// Add time signature event
    pub fn add_time_sig(&mut self, position: u64, numerator: u8, denominator: u8) {
        let event = TimeSignatureEvent::new(position, numerator, denominator);
        
        // Remove existing at same position
        self.time_sig_events.retain(|e| e.position != position);
        
        self.time_sig_events.push(event);
        self.time_sig_events.sort_by_key(|e| e.position);
    }
    
    /// Get time signature at position
    pub fn time_sig_at(&self, position: u64) -> TimeSignature {
        let mut result = self.time_sig_events[0].time_sig;
        
        for event in &self.time_sig_events {
            if event.position <= position {
                result = event.time_sig;
            } else {
                break;
            }
        }
        
        result
    }
    
    // === Markers ===
    
    /// Add marker
    pub fn add_marker(&mut self, position: u64, name: &str, marker_type: MarkerType) -> u64 {
        let id = next_marker_id();
        let mut marker = Marker::new(id, position, name);
        marker.marker_type = marker_type;
        
        self.markers.push(marker);
        self.markers.sort_by_key(|m| m.position);
        
        id
    }
    
    /// Remove marker
    pub fn remove_marker(&mut self, id: u64) {
        self.markers.retain(|m| m.id != id);
    }
    
    /// Get marker by ID
    pub fn get_marker(&self, id: u64) -> Option<&Marker> {
        self.markers.iter().find(|m| m.id == id)
    }
    
    /// Get all markers
    pub fn markers(&self) -> &[Marker] {
        &self.markers
    }
    
    /// Get markers in range
    pub fn markers_in_range(&self, start: u64, end: u64) -> Vec<&Marker> {
        self.markers.iter()
            .filter(|m| m.position >= start && m.position < end)
            .collect()
    }
    
    // === Conversions ===
    
    /// Samples to beats at given position
    pub fn samples_to_beats(&self, samples: u64, at_position: u64) -> f64 {
        let bpm = self.tempo_at(at_position);
        let samples_per_beat = (60.0 / bpm) * self.sample_rate as f32;
        samples as f64 / samples_per_beat as f64
    }
    
    /// Beats to samples at given position
    pub fn beats_to_samples(&self, beats: f64, at_position: u64) -> u64 {
        let bpm = self.tempo_at(at_position);
        let samples_per_beat = (60.0 / bpm) * self.sample_rate as f32;
        (beats * samples_per_beat as f64) as u64
    }
    
    /// Samples to bar:beat position
    pub fn samples_to_bar_beat(&self, samples: u64) -> (u32, u8, f32) {
        let bpm = self.tempo_at(samples);
        let time_sig = self.time_sig_at(samples);
        
        let samples_per_beat = (60.0 / bpm) * self.sample_rate as f32;
        let total_beats = samples as f32 / samples_per_beat;
        
        let beats_per_bar = time_sig.beats_per_bar() as f32;
        let bar = (total_beats / beats_per_bar) as u32;
        let beat_in_bar = (total_beats % beats_per_bar) as u8;
        let fraction = total_beats.fract();
        
        (bar + 1, beat_in_bar + 1, fraction) // 1-indexed
    }
    
    /// Snap to grid (returns snapped position)
    pub fn snap_to_grid(&self, position: u64, grid_division: u8) -> u64 {
        let bpm = self.tempo_at(position);
        let samples_per_beat = (60.0 / bpm) * self.sample_rate as f32;
        let samples_per_grid = samples_per_beat / grid_division as f32;
        
        let grid_count = (position as f32 / samples_per_grid).round() as u64;
        (grid_count as f32 * samples_per_grid) as u64
    }
    
    /// Get stats
    pub fn stats(&self) -> (usize, usize, usize) {
        (self.tempo_events.len(), self.time_sig_events.len(), self.markers.len())
    }
}

impl Default for TempoMap {
    fn default() -> Self {
        Self::new(48000, 120.0)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_time_signature() {
        let ts = TimeSignature::new(6, 8);
        assert_eq!(ts.beats_per_bar(), 6);
        assert_eq!(ts.beat_value(), 8);
        assert_eq!(ts.quarters_per_bar(), 3.0);
    }
    
    #[test]
    fn test_tempo_at() {
        let mut map = TempoMap::new(48000, 120.0);
        map.add_tempo(48000 * 10, 140.0, TempoCurve::Step);
        
        assert_eq!(map.tempo_at(0), 120.0);
        assert_eq!(map.tempo_at(48000 * 5), 120.0);
        assert_eq!(map.tempo_at(48000 * 10), 140.0);
        assert_eq!(map.tempo_at(48000 * 20), 140.0);
    }
    
    #[test]
    fn test_linear_tempo() {
        let mut map = TempoMap::new(48000, 100.0);
        map.tempo_events[0].curve = TempoCurve::Linear;
        map.add_tempo(48000, 200.0, TempoCurve::Step);
        
        // Midpoint should be 150 BPM
        let mid_tempo = map.tempo_at(24000);
        assert!((mid_tempo - 150.0).abs() < 1.0);
    }
    
    #[test]
    fn test_markers() {
        let mut map = TempoMap::new(48000, 120.0);
        
        let id1 = map.add_marker(0, "Intro", MarkerType::Section);
        let id2 = map.add_marker(48000 * 10, "Verse", MarkerType::Section);
        
        assert_eq!(map.markers().len(), 2);
        assert_eq!(map.get_marker(id1).unwrap().name, "Intro");
        
        map.remove_marker(id1);
        assert_eq!(map.markers().len(), 1);
    }
    
    #[test]
    fn test_snap_to_grid() {
        let map = TempoMap::new(48000, 120.0);
        
        // At 120 BPM, samples_per_beat = 24000
        let pos = 24500; // Slightly after beat 1
        let snapped = map.snap_to_grid(pos, 1);
        assert_eq!(snapped, 24000); // Should snap to beat 1
    }
}
