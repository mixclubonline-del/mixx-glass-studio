use std::sync::atomic::{AtomicU64, AtomicBool, Ordering};
use std::collections::VecDeque;

/// MIDI Processing Engine
/// 
/// Provides MIDI event handling for:
/// - Note on/off with velocity
/// - Control change (CC) messages
/// - Program changes
/// - Pitch bend
/// - MIDI clock synchronization

// ============================================================================
// MIDI Constants
// ============================================================================

/// Standard MIDI channel count
pub const MIDI_CHANNELS: u8 = 16;

/// Control change numbers
pub mod cc {
    pub const MODULATION: u8 = 1;
    pub const BREATH: u8 = 2;
    pub const VOLUME: u8 = 7;
    pub const PAN: u8 = 10;
    pub const EXPRESSION: u8 = 11;
    pub const SUSTAIN: u8 = 64;
    pub const PORTAMENTO: u8 = 65;
    pub const SOSTENUTO: u8 = 66;
    pub const SOFT_PEDAL: u8 = 67;
    pub const ALL_SOUND_OFF: u8 = 120;
    pub const RESET_ALL: u8 = 121;
    pub const ALL_NOTES_OFF: u8 = 123;
}

// ============================================================================
// MIDI Events
// ============================================================================

/// MIDI event types
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum MidiEvent {
    /// Note On: channel, note, velocity
    NoteOn { channel: u8, note: u8, velocity: u8 },
    
    /// Note Off: channel, note, velocity
    NoteOff { channel: u8, note: u8, velocity: u8 },
    
    /// Control Change: channel, controller, value
    ControlChange { channel: u8, controller: u8, value: u8 },
    
    /// Program Change: channel, program
    ProgramChange { channel: u8, program: u8 },
    
    /// Pitch Bend: channel, value (-8192 to 8191)
    PitchBend { channel: u8, value: i16 },
    
    /// Aftertouch (channel pressure): channel, pressure
    Aftertouch { channel: u8, pressure: u8 },
    
    /// Polyphonic Aftertouch: channel, note, pressure
    PolyAftertouch { channel: u8, note: u8, pressure: u8 },
    
    /// MIDI Clock tick
    Clock,
    
    /// Start playback
    Start,
    
    /// Continue playback
    Continue,
    
    /// Stop playback
    Stop,
}

impl MidiEvent {
    /// Create note on event
    pub fn note_on(channel: u8, note: u8, velocity: u8) -> Self {
        Self::NoteOn { 
            channel: channel & 0x0F, 
            note: note & 0x7F, 
            velocity: velocity & 0x7F 
        }
    }
    
    /// Create note off event
    pub fn note_off(channel: u8, note: u8, velocity: u8) -> Self {
        Self::NoteOff { 
            channel: channel & 0x0F, 
            note: note & 0x7F, 
            velocity: velocity & 0x7F 
        }
    }
    
    /// Create control change event
    pub fn control_change(channel: u8, controller: u8, value: u8) -> Self {
        Self::ControlChange { 
            channel: channel & 0x0F, 
            controller: controller & 0x7F, 
            value: value & 0x7F 
        }
    }
    
    /// Create pitch bend event (value: -8192 to 8191)
    pub fn pitch_bend(channel: u8, value: i16) -> Self {
        Self::PitchBend { 
            channel: channel & 0x0F, 
            value: value.clamp(-8192, 8191) 
        }
    }
    
    /// Get channel for channel voice messages
    pub fn channel(&self) -> Option<u8> {
        match self {
            Self::NoteOn { channel, .. } |
            Self::NoteOff { channel, .. } |
            Self::ControlChange { channel, .. } |
            Self::ProgramChange { channel, .. } |
            Self::PitchBend { channel, .. } |
            Self::Aftertouch { channel, .. } |
            Self::PolyAftertouch { channel, .. } => Some(*channel),
            _ => None,
        }
    }
    
    /// Check if this is a note event
    pub fn is_note(&self) -> bool {
        matches!(self, Self::NoteOn { .. } | Self::NoteOff { .. })
    }
    
    /// Check if this is a system real-time event
    pub fn is_realtime(&self) -> bool {
        matches!(self, Self::Clock | Self::Start | Self::Continue | Self::Stop)
    }
}

// ============================================================================
// Timestamped Event
// ============================================================================

/// MIDI event with sample-accurate timestamp
#[derive(Debug, Clone, Copy)]
pub struct TimestampedEvent {
    pub sample_time: u64,
    pub event: MidiEvent,
}

impl TimestampedEvent {
    pub fn new(sample_time: u64, event: MidiEvent) -> Self {
        Self { sample_time, event }
    }
    
    pub fn now(event: MidiEvent) -> Self {
        Self { sample_time: 0, event }
    }
}

impl PartialEq for TimestampedEvent {
    fn eq(&self, other: &Self) -> bool {
        self.sample_time == other.sample_time
    }
}

impl Eq for TimestampedEvent {}

impl PartialOrd for TimestampedEvent {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for TimestampedEvent {
    fn cmp(&self, other: &Self) -> std::cmp::Ordering {
        self.sample_time.cmp(&other.sample_time)
    }
}

// ============================================================================
// MIDI Buffer
// ============================================================================

/// Buffer for collecting and sorting MIDI events
pub struct MidiBuffer {
    events: VecDeque<TimestampedEvent>,
    capacity: usize,
}

impl MidiBuffer {
    pub fn new(capacity: usize) -> Self {
        Self {
            events: VecDeque::with_capacity(capacity),
            capacity,
        }
    }
    
    /// Add event to buffer
    pub fn push(&mut self, event: TimestampedEvent) {
        if self.events.len() < self.capacity {
            self.events.push_back(event);
        }
    }
    
    /// Pop next event (if sample_time <= current_time)
    pub fn pop_ready(&mut self, current_time: u64) -> Option<TimestampedEvent> {
        if let Some(front) = self.events.front() {
            if front.sample_time <= current_time {
                return self.events.pop_front();
            }
        }
        None
    }
    
    /// Get all events ready at current time
    pub fn drain_ready(&mut self, current_time: u64) -> Vec<TimestampedEvent> {
        let mut ready = Vec::new();
        while let Some(event) = self.pop_ready(current_time) {
            ready.push(event);
        }
        ready
    }
    
    /// Sort events by timestamp
    pub fn sort(&mut self) {
        let mut events: Vec<_> = self.events.drain(..).collect();
        events.sort();
        self.events.extend(events);
    }
    
    /// Clear all events
    pub fn clear(&mut self) {
        self.events.clear();
    }
    
    /// Get number of pending events
    pub fn len(&self) -> usize {
        self.events.len()
    }
    
    /// Check if buffer is empty
    pub fn is_empty(&self) -> bool {
        self.events.is_empty()
    }
}

impl Default for MidiBuffer {
    fn default() -> Self {
        Self::new(1024)
    }
}

// ============================================================================
// MIDI Note State
// ============================================================================

/// Track active notes per channel
pub struct NoteState {
    /// Active notes per channel (bitfield for 128 notes)
    active: [[bool; 128]; 16],
    /// Velocity of active notes
    velocities: [[u8; 128]; 16],
}

impl NoteState {
    pub fn new() -> Self {
        Self {
            active: [[false; 128]; 16],
            velocities: [[0; 128]; 16],
        }
    }
    
    /// Process note on
    pub fn note_on(&mut self, channel: u8, note: u8, velocity: u8) {
        let ch = (channel & 0x0F) as usize;
        let n = (note & 0x7F) as usize;
        self.active[ch][n] = true;
        self.velocities[ch][n] = velocity;
    }
    
    /// Process note off
    pub fn note_off(&mut self, channel: u8, note: u8) {
        let ch = (channel & 0x0F) as usize;
        let n = (note & 0x7F) as usize;
        self.active[ch][n] = false;
        self.velocities[ch][n] = 0;
    }
    
    /// Check if note is active
    pub fn is_active(&self, channel: u8, note: u8) -> bool {
        let ch = (channel & 0x0F) as usize;
        let n = (note & 0x7F) as usize;
        self.active[ch][n]
    }
    
    /// Get velocity of active note (0 if not active)
    pub fn velocity(&self, channel: u8, note: u8) -> u8 {
        let ch = (channel & 0x0F) as usize;
        let n = (note & 0x7F) as usize;
        self.velocities[ch][n]
    }
    
    /// Count active notes on channel
    pub fn active_count(&self, channel: u8) -> usize {
        let ch = (channel & 0x0F) as usize;
        self.active[ch].iter().filter(|&&a| a).count()
    }
    
    /// All notes off for channel
    pub fn all_notes_off(&mut self, channel: u8) {
        let ch = (channel & 0x0F) as usize;
        self.active[ch].fill(false);
        self.velocities[ch].fill(0);
    }
    
    /// Reset all channels
    pub fn reset(&mut self) {
        for ch in 0..16 {
            self.active[ch].fill(false);
            self.velocities[ch].fill(0);
        }
    }
}

impl Default for NoteState {
    fn default() -> Self {
        Self::new()
    }
}

// ============================================================================
// MIDI Sequencer
// ============================================================================

/// MIDI Sequencer for playback and recording
pub struct MidiSequencer {
    /// Event buffer for playback
    playback_buffer: MidiBuffer,
    
    /// Recording buffer
    record_buffer: MidiBuffer,
    
    /// Current playback state
    is_playing: AtomicBool,
    is_recording: AtomicBool,
    
    /// Current position in samples
    position: AtomicU64,
    
    /// Note state tracking
    note_state: NoteState,
    
    /// Sample rate for timing
    sample_rate: u32,
    
    /// MIDI clock counter (24 PPQ)
    _clock_counter: u32,
    samples_per_clock: f32,
}

impl MidiSequencer {
    pub fn new(sample_rate: u32, bpm: f32) -> Self {
        // MIDI clock: 24 ticks per quarter note
        let samples_per_beat = (60.0 / bpm) * sample_rate as f32;
        let samples_per_clock = samples_per_beat / 24.0;
        
        Self {
            playback_buffer: MidiBuffer::new(4096),
            record_buffer: MidiBuffer::new(4096),
            is_playing: AtomicBool::new(false),
            is_recording: AtomicBool::new(false),
            position: AtomicU64::new(0),
            note_state: NoteState::new(),
            sample_rate,
            _clock_counter: 0,
            samples_per_clock,
        }
    }
    
    /// Start playback
    pub fn play(&self) {
        self.is_playing.store(true, Ordering::SeqCst);
    }
    
    /// Stop playback
    pub fn stop(&self) {
        self.is_playing.store(false, Ordering::SeqCst);
        self.position.store(0, Ordering::SeqCst);
    }
    
    /// Pause playback
    pub fn pause(&self) {
        self.is_playing.store(false, Ordering::SeqCst);
    }
    
    /// Start recording
    pub fn record(&self) {
        self.is_recording.store(true, Ordering::SeqCst);
        self.is_playing.store(true, Ordering::SeqCst);
    }
    
    /// Check if playing
    pub fn is_playing(&self) -> bool {
        self.is_playing.load(Ordering::Relaxed)
    }
    
    /// Check if recording
    pub fn is_recording(&self) -> bool {
        self.is_recording.load(Ordering::Relaxed)
    }
    
    /// Get current position
    pub fn position(&self) -> u64 {
        self.position.load(Ordering::Relaxed)
    }
    
    /// Seek to position
    pub fn seek(&self, position: u64) {
        self.position.store(position, Ordering::SeqCst);
    }
    
    /// Add event to playback buffer
    pub fn add_event(&mut self, event: TimestampedEvent) {
        self.playback_buffer.push(event);
    }
    
    /// Record incoming event
    pub fn record_event(&mut self, event: MidiEvent) {
        if self.is_recording() {
            let pos = self.position();
            self.record_buffer.push(TimestampedEvent::new(pos, event));
        }
    }
    
    /// Process block and return events for current position
    pub fn process_block(&mut self, block_size: usize) -> Vec<TimestampedEvent> {
        if !self.is_playing() {
            return Vec::new();
        }
        
        let current_pos = self.position.fetch_add(block_size as u64, Ordering::Relaxed);
        let end_pos = current_pos + block_size as u64;
        
        // Get events in this block's time range
        let mut events = Vec::new();
        while let Some(front) = self.playback_buffer.events.front() {
            if front.sample_time < end_pos {
                if let Some(event) = self.playback_buffer.events.pop_front() {
                    // Update note state
                    match event.event {
                        MidiEvent::NoteOn { channel, note, velocity } => {
                            self.note_state.note_on(channel, note, velocity);
                        }
                        MidiEvent::NoteOff { channel, note, .. } => {
                            self.note_state.note_off(channel, note);
                        }
                        _ => {}
                    }
                    events.push(event);
                }
            } else {
                break;
            }
        }
        
        events
    }
    
    /// Get recorded events and clear buffer
    pub fn take_recording(&mut self) -> Vec<TimestampedEvent> {
        self.is_recording.store(false, Ordering::SeqCst);
        let mut events = Vec::new();
        while let Some(event) = self.record_buffer.events.pop_front() {
            events.push(event);
        }
        events
    }
    
    /// Clear all buffers
    pub fn clear(&mut self) {
        self.playback_buffer.clear();
        self.record_buffer.clear();
        self.note_state.reset();
        self.position.store(0, Ordering::SeqCst);
    }
    
    /// Get active note count on channel
    pub fn active_notes(&self, channel: u8) -> usize {
        self.note_state.active_count(channel)
    }
    
    /// Update BPM (recalculates MIDI clock timing)
    pub fn set_bpm(&mut self, bpm: f32) {
        let samples_per_beat = (60.0 / bpm) * self.sample_rate as f32;
        self.samples_per_clock = samples_per_beat / 24.0;
    }
}

unsafe impl Send for MidiSequencer {}
unsafe impl Sync for MidiSequencer {}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_midi_event() {
        let note = MidiEvent::note_on(0, 60, 100);
        assert!(note.is_note());
        assert_eq!(note.channel(), Some(0));
    }
    
    #[test]
    fn test_note_state() {
        let mut state = NoteState::new();
        
        state.note_on(0, 60, 100);
        assert!(state.is_active(0, 60));
        assert_eq!(state.velocity(0, 60), 100);
        
        state.note_off(0, 60);
        assert!(!state.is_active(0, 60));
    }
    
    #[test]
    fn test_midi_buffer() {
        let mut buffer = MidiBuffer::new(16);
        
        buffer.push(TimestampedEvent::new(100, MidiEvent::note_on(0, 60, 100)));
        buffer.push(TimestampedEvent::new(50, MidiEvent::note_on(0, 64, 80)));
        
        buffer.sort();
        
        // Should get event at time 50 first
        let events = buffer.drain_ready(60);
        assert_eq!(events.len(), 1);
        assert_eq!(events[0].sample_time, 50);
    }
    
    #[test]
    fn test_sequencer() {
        let mut seq = MidiSequencer::new(44100, 120.0);
        
        seq.add_event(TimestampedEvent::new(0, MidiEvent::note_on(0, 60, 100)));
        seq.add_event(TimestampedEvent::new(1000, MidiEvent::note_off(0, 60, 0)));
        
        seq.play();
        let events = seq.process_block(512);
        
        // Should get note on at sample 0
        assert_eq!(events.len(), 1);
        assert!(seq.note_state.is_active(0, 60));
    }
}
