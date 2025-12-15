use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;

/// Clip and Region System
/// 
/// Manages audio and MIDI clips for timeline arrangement:
/// - Clips hold raw data (samples or MIDI events)
/// - Regions position clips on the timeline
/// - Supports trim, split, fade, and loop operations

// ============================================================================
// Clip ID Generation
// ============================================================================

static NEXT_CLIP_ID: AtomicU64 = AtomicU64::new(1);

/// Generate unique clip ID
pub fn next_clip_id() -> u64 {
    NEXT_CLIP_ID.fetch_add(1, Ordering::Relaxed)
}

// ============================================================================
// Fade Types
// ============================================================================

/// Fade curve type
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum FadeCurve {
    Linear,
    Exponential,
    Logarithmic,
    SCurve,
}

impl Default for FadeCurve {
    fn default() -> Self {
        Self::Linear
    }
}

impl FadeCurve {
    /// Calculate fade gain at position (0.0 to 1.0)
    pub fn gain_at(&self, position: f32) -> f32 {
        let p = position.clamp(0.0, 1.0);
        match self {
            Self::Linear => p,
            Self::Exponential => p * p,
            Self::Logarithmic => p.sqrt(),
            Self::SCurve => {
                // Smoothstep S-curve
                let t = p * p * (3.0 - 2.0 * p);
                t
            }
        }
    }
}

/// Fade configuration
#[derive(Debug, Clone, Copy)]
pub struct Fade {
    pub length_samples: u64,
    pub curve: FadeCurve,
}

impl Fade {
    pub fn new(length_samples: u64, curve: FadeCurve) -> Self {
        Self { length_samples, curve }
    }
    
    pub fn linear(length_samples: u64) -> Self {
        Self::new(length_samples, FadeCurve::Linear)
    }
}

impl Default for Fade {
    fn default() -> Self {
        Self { length_samples: 0, curve: FadeCurve::Linear }
    }
}

// ============================================================================
// Audio Clip
// ============================================================================

/// Audio clip containing sample data
#[derive(Clone)]
pub struct AudioClip {
    pub id: u64,
    pub name: String,
    
    /// Sample data (interleaved if stereo)
    data: Arc<Vec<f32>>,
    
    /// Number of channels
    pub channels: u16,
    
    /// Sample rate
    pub sample_rate: u32,
    
    /// Gain adjustment (linear)
    pub gain: f32,
    
    /// Fade in/out
    pub fade_in: Fade,
    pub fade_out: Fade,
}

impl AudioClip {
    pub fn new(name: &str, data: Vec<f32>, channels: u16, sample_rate: u32) -> Self {
        Self {
            id: next_clip_id(),
            name: name.to_string(),
            data: Arc::new(data),
            channels,
            sample_rate,
            gain: 1.0,
            fade_in: Fade::default(),
            fade_out: Fade::default(),
        }
    }
    
    /// Get total length in samples (per channel)
    pub fn length_samples(&self) -> u64 {
        (self.data.len() / self.channels as usize) as u64
    }
    
    /// Get duration in seconds
    pub fn duration_seconds(&self) -> f64 {
        self.length_samples() as f64 / self.sample_rate as f64
    }
    
    /// Get sample at position with fade and gain applied
    pub fn sample_at(&self, position: u64, channel: u16) -> f32 {
        let length = self.length_samples();
        if position >= length {
            return 0.0;
        }
        
        let idx = (position * self.channels as u64 + channel as u64) as usize;
        if idx >= self.data.len() {
            return 0.0;
        }
        
        let mut sample = self.data[idx] * self.gain;
        
        // Apply fade in
        if self.fade_in.length_samples > 0 && position < self.fade_in.length_samples {
            let fade_pos = position as f32 / self.fade_in.length_samples as f32;
            sample *= self.fade_in.curve.gain_at(fade_pos);
        }
        
        // Apply fade out
        if self.fade_out.length_samples > 0 {
            let fade_start = length - self.fade_out.length_samples;
            if position >= fade_start {
                let fade_pos = (position - fade_start) as f32 / self.fade_out.length_samples as f32;
                sample *= self.fade_out.curve.gain_at(1.0 - fade_pos);
            }
        }
        
        sample
    }
    
    /// Set fade in
    pub fn set_fade_in(&mut self, length_samples: u64, curve: FadeCurve) {
        self.fade_in = Fade::new(length_samples, curve);
    }
    
    /// Set fade out
    pub fn set_fade_out(&mut self, length_samples: u64, curve: FadeCurve) {
        self.fade_out = Fade::new(length_samples, curve);
    }
}

// ============================================================================
// MIDI Clip
// ============================================================================

use crate::mixx_audio_core::midi_engine::{MidiEvent, TimestampedEvent};

/// MIDI clip containing note/CC events
#[derive(Clone)]
pub struct MidiClip {
    pub id: u64,
    pub name: String,
    
    /// MIDI events (relative to clip start)
    events: Vec<TimestampedEvent>,
    
    /// Clip length in samples
    pub length_samples: u64,
}

impl MidiClip {
    pub fn new(name: &str, length_samples: u64) -> Self {
        Self {
            id: next_clip_id(),
            name: name.to_string(),
            events: Vec::new(),
            length_samples,
        }
    }
    
    /// Add event to clip
    pub fn add_event(&mut self, event: TimestampedEvent) {
        self.events.push(event);
        // Keep sorted
        self.events.sort_by_key(|e| e.sample_time);
    }
    
    /// Add note (convenience method)
    pub fn add_note(&mut self, channel: u8, note: u8, velocity: u8, start: u64, duration: u64) {
        self.add_event(TimestampedEvent::new(start, MidiEvent::note_on(channel, note, velocity)));
        self.add_event(TimestampedEvent::new(start + duration, MidiEvent::note_off(channel, note, 0)));
    }
    
    /// Get events in time range (relative to clip)
    pub fn events_in_range(&self, start: u64, end: u64) -> Vec<TimestampedEvent> {
        self.events.iter()
            .filter(|e| e.sample_time >= start && e.sample_time < end)
            .cloned()
            .collect()
    }
    
    /// Get all events
    pub fn events(&self) -> &[TimestampedEvent] {
        &self.events
    }
    
    /// Clear all events
    pub fn clear(&mut self) {
        self.events.clear();
    }
    
    /// Event count
    pub fn event_count(&self) -> usize {
        self.events.len()
    }
}

// ============================================================================
// Clip Type Enum
// ============================================================================

/// Unified clip type
#[derive(Clone)]
pub enum ClipType {
    Audio(AudioClip),
    Midi(MidiClip),
}

impl ClipType {
    pub fn id(&self) -> u64 {
        match self {
            Self::Audio(c) => c.id,
            Self::Midi(c) => c.id,
        }
    }
    
    pub fn name(&self) -> &str {
        match self {
            Self::Audio(c) => &c.name,
            Self::Midi(c) => &c.name,
        }
    }
    
    pub fn length_samples(&self) -> u64 {
        match self {
            Self::Audio(c) => c.length_samples(),
            Self::Midi(c) => c.length_samples,
        }
    }
    
    pub fn is_audio(&self) -> bool {
        matches!(self, Self::Audio(_))
    }
    
    pub fn is_midi(&self) -> bool {
        matches!(self, Self::Midi(_))
    }
}

// ============================================================================
// Region (Timeline Placement)
// ============================================================================

/// Region places a clip on the timeline
#[derive(Clone)]
pub struct Region {
    pub id: u64,
    pub clip: ClipType,
    
    /// Position on timeline (samples)
    pub start_time: u64,
    
    /// Offset into clip (for trimming start)
    pub clip_offset: u64,
    
    /// Length of region (may be shorter than clip)
    pub length: u64,
    
    /// Track index this region belongs to
    pub track_index: usize,
    
    /// Muted state
    pub muted: bool,
    
    /// Loop enabled
    pub looped: bool,
}

impl Region {
    pub fn new(clip: ClipType, start_time: u64, track_index: usize) -> Self {
        let length = clip.length_samples();
        Self {
            id: next_clip_id(),
            clip,
            start_time,
            clip_offset: 0,
            length,
            track_index,
            muted: false,
            looped: false,
        }
    }
    
    /// End time on timeline
    pub fn end_time(&self) -> u64 {
        self.start_time + self.length
    }
    
    /// Check if position is within this region
    pub fn contains(&self, position: u64) -> bool {
        position >= self.start_time && position < self.end_time()
    }
    
    /// Move region to new position
    pub fn move_to(&mut self, new_start: u64) {
        self.start_time = new_start;
    }
    
    /// Trim region from start (increases clip_offset)
    pub fn trim_start(&mut self, amount: u64) {
        let max_trim = self.length.saturating_sub(1);
        let trim = amount.min(max_trim);
        self.clip_offset += trim;
        self.length -= trim;
        self.start_time += trim;
    }
    
    /// Trim region from end
    pub fn trim_end(&mut self, amount: u64) {
        let max_trim = self.length.saturating_sub(1);
        self.length -= amount.min(max_trim);
    }
    
    /// Get position within clip for timeline position
    pub fn clip_position(&self, timeline_pos: u64) -> Option<u64> {
        if !self.contains(timeline_pos) {
            return None;
        }
        
        let relative = timeline_pos - self.start_time;
        
        if self.looped {
            let clip_len = self.clip.length_samples() - self.clip_offset;
            if clip_len > 0 {
                Some(self.clip_offset + (relative % clip_len))
            } else {
                None
            }
        } else {
            Some(self.clip_offset + relative)
        }
    }
    
    /// Get audio sample at timeline position
    pub fn audio_sample_at(&self, timeline_pos: u64, channel: u16) -> Option<f32> {
        if self.muted {
            return Some(0.0);
        }
        
        if let ClipType::Audio(ref audio_clip) = self.clip {
            self.clip_position(timeline_pos)
                .map(|pos| audio_clip.sample_at(pos, channel))
        } else {
            None
        }
    }
    
    /// Get MIDI events in timeline range
    pub fn midi_events_in_range(&self, start: u64, end: u64) -> Vec<TimestampedEvent> {
        if self.muted {
            return Vec::new();
        }
        
        if let ClipType::Midi(ref midi_clip) = self.clip {
            // Convert timeline range to clip-relative range
            let clip_start = if start > self.start_time {
                start - self.start_time + self.clip_offset
            } else {
                self.clip_offset
            };
            let clip_end = if end > self.start_time {
                (end - self.start_time + self.clip_offset).min(self.clip_offset + self.length)
            } else {
                return Vec::new();
            };
            
            // Get events and adjust timestamps to timeline
            midi_clip.events_in_range(clip_start, clip_end)
                .into_iter()
                .map(|mut e| {
                    e.sample_time = e.sample_time - self.clip_offset + self.start_time;
                    e
                })
                .collect()
        } else {
            Vec::new()
        }
    }
}

// ============================================================================
// Clip Manager
// ============================================================================

/// Manages all clips and regions
pub struct ClipManager {
    /// All clips (shared between regions)
    clips: Vec<ClipType>,
    
    /// All regions on timeline
    regions: Vec<Region>,
}

impl ClipManager {
    pub fn new() -> Self {
        Self {
            clips: Vec::new(),
            regions: Vec::new(),
        }
    }
    
    /// Add audio clip
    pub fn add_audio_clip(&mut self, clip: AudioClip) -> u64 {
        let id = clip.id;
        self.clips.push(ClipType::Audio(clip));
        id
    }
    
    /// Add MIDI clip
    pub fn add_midi_clip(&mut self, clip: MidiClip) -> u64 {
        let id = clip.id;
        self.clips.push(ClipType::Midi(clip));
        id
    }
    
    /// Get clip by ID
    pub fn get_clip(&self, id: u64) -> Option<&ClipType> {
        self.clips.iter().find(|c| c.id() == id)
    }
    
    /// Create region from clip
    pub fn create_region(&mut self, clip_id: u64, start_time: u64, track_index: usize) -> Option<u64> {
        let clip = self.clips.iter().find(|c| c.id() == clip_id)?.clone();
        let region = Region::new(clip, start_time, track_index);
        let region_id = region.id;
        self.regions.push(region);
        Some(region_id)
    }
    
    /// Get region by ID
    pub fn get_region(&self, id: u64) -> Option<&Region> {
        self.regions.iter().find(|r| r.id == id)
    }
    
    /// Get mutable region by ID
    pub fn get_region_mut(&mut self, id: u64) -> Option<&mut Region> {
        self.regions.iter_mut().find(|r| r.id == id)
    }
    
    /// Get regions on track
    pub fn regions_on_track(&self, track_index: usize) -> Vec<&Region> {
        self.regions.iter().filter(|r| r.track_index == track_index).collect()
    }
    
    /// Get regions at timeline position
    pub fn regions_at(&self, position: u64) -> Vec<&Region> {
        self.regions.iter().filter(|r| r.contains(position)).collect()
    }
    
    /// Delete region
    pub fn delete_region(&mut self, id: u64) {
        self.regions.retain(|r| r.id != id);
    }
    
    /// Count clips and regions
    pub fn stats(&self) -> (usize, usize) {
        (self.clips.len(), self.regions.len())
    }
}

impl Default for ClipManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_audio_clip() {
        let samples: Vec<f32> = (0..1024).map(|i| (i as f32 * 0.01).sin()).collect();
        let clip = AudioClip::new("Test", samples, 2, 44100);
        
        assert_eq!(clip.length_samples(), 512); // 1024 / 2 channels
        assert!(clip.sample_at(0, 0).abs() < 0.01);
    }
    
    #[test]
    fn test_fade() {
        let mut clip = AudioClip::new("Test", vec![1.0; 100], 1, 44100);
        clip.set_fade_in(10, FadeCurve::Linear);
        
        // At position 0, fade should be 0
        assert!(clip.sample_at(0, 0) < 0.1);
        // At position 5, fade should be ~0.5
        assert!((clip.sample_at(5, 0) - 0.5).abs() < 0.1);
        // At position 10+, fade complete
        assert!((clip.sample_at(50, 0) - 1.0).abs() < 0.01);
    }
    
    #[test]
    fn test_region() {
        let clip = AudioClip::new("Test", vec![1.0; 100], 1, 44100);
        let mut region = Region::new(ClipType::Audio(clip), 1000, 0);
        
        assert_eq!(region.start_time, 1000);
        assert_eq!(region.end_time(), 1100);
        assert!(region.contains(1050));
        assert!(!region.contains(500));
        
        region.trim_start(20);
        assert_eq!(region.start_time, 1020);
        assert_eq!(region.length, 80);
    }
}
