use std::collections::VecDeque;
use std::time::{SystemTime, UNIX_EPOCH};

/// Undo/Redo History System
/// 
/// Provides non-destructive editing with:
/// - Command pattern for reversible actions
/// - Unlimited undo/redo stacks
/// - Action grouping for compound operations
/// - Timestamp tracking

// ============================================================================
// Action Types
// ============================================================================

/// Types of undoable/redoable actions
#[derive(Debug, Clone)]
pub enum ActionType {
    // Track operations
    TrackCreate { track_id: u64, name: String },
    TrackDelete { track_id: u64, name: String },
    TrackVolumeChange { track_id: u64, old_value: f32, new_value: f32 },
    TrackPanChange { track_id: u64, old_value: f32, new_value: f32 },
    TrackMuteToggle { track_id: u64, was_muted: bool },
    TrackSoloToggle { track_id: u64, was_soloed: bool },
    TrackRename { track_id: u64, old_name: String, new_name: String },
    
    // Clip operations
    ClipCreate { clip_id: u64, name: String },
    ClipDelete { clip_id: u64, name: String },
    
    // Region operations
    RegionCreate { region_id: u64, clip_id: u64, track_index: usize, start_time: u64 },
    RegionDelete { region_id: u64, clip_id: u64, track_index: usize, start_time: u64 },
    RegionMove { region_id: u64, old_start: u64, new_start: u64, old_track: usize, new_track: usize },
    RegionTrimStart { region_id: u64, old_offset: u64, new_offset: u64 },
    RegionTrimEnd { region_id: u64, old_length: u64, new_length: u64 },
    
    // Transport operations
    TempoChange { old_bpm: f32, new_bpm: f32 },
    TimeSignatureChange { old_num: u8, old_den: u8, new_num: u8, new_den: u8 },
    
    // Automation
    AutomationPointAdd { lane_id: u64, time: u64, value: f32 },
    AutomationPointDelete { lane_id: u64, time: u64, value: f32 },
    AutomationPointMove { lane_id: u64, old_time: u64, new_time: u64, old_value: f32, new_value: f32 },
    
    // Plugin operations
    PluginAdd { track_id: u64, slot_index: usize, plugin_name: String },
    PluginRemove { track_id: u64, slot_index: usize, plugin_name: String },
    PluginBypass { track_id: u64, slot_index: usize, was_bypassed: bool },
    PluginParameterChange { track_id: u64, slot_index: usize, param_id: u32, old_value: f32, new_value: f32 },
    
    // MIDI operations
    MidiNoteAdd { clip_id: u64, channel: u8, note: u8, velocity: u8, start: u64, duration: u64 },
    MidiNoteDelete { clip_id: u64, channel: u8, note: u8, velocity: u8, start: u64, duration: u64 },
    MidiNoteMove { clip_id: u64, note: u8, old_start: u64, new_start: u64 },
    MidiNoteResize { clip_id: u64, note: u8, start: u64, old_duration: u64, new_duration: u64 },
    
    // Selection (for undo to restore selection state)
    SelectionChange { old_selection: Vec<u64>, new_selection: Vec<u64> },
    
    // Compound action group
    Group { name: String, actions: Vec<ActionType> },
}

impl ActionType {
    /// Get human-readable description
    pub fn description(&self) -> String {
        match self {
            Self::TrackCreate { name, .. } => format!("Create Track '{}'", name),
            Self::TrackDelete { name, .. } => format!("Delete Track '{}'", name),
            Self::TrackVolumeChange { new_value, .. } => format!("Set Volume to {:.1}", new_value),
            Self::TrackPanChange { new_value, .. } => format!("Set Pan to {:.2}", new_value),
            Self::TrackMuteToggle { was_muted, .. } => {
                if *was_muted { "Unmute Track".to_string() } else { "Mute Track".to_string() }
            }
            Self::TrackSoloToggle { was_soloed, .. } => {
                if *was_soloed { "Unsolo Track".to_string() } else { "Solo Track".to_string() }
            }
            Self::TrackRename { new_name, .. } => format!("Rename Track to '{}'", new_name),
            Self::ClipCreate { name, .. } => format!("Create Clip '{}'", name),
            Self::ClipDelete { name, .. } => format!("Delete Clip '{}'", name),
            Self::RegionCreate { .. } => "Create Region".to_string(),
            Self::RegionDelete { .. } => "Delete Region".to_string(),
            Self::RegionMove { .. } => "Move Region".to_string(),
            Self::RegionTrimStart { .. } => "Trim Region Start".to_string(),
            Self::RegionTrimEnd { .. } => "Trim Region End".to_string(),
            Self::TempoChange { new_bpm, .. } => format!("Set Tempo to {:.1} BPM", new_bpm),
            Self::TimeSignatureChange { new_num, new_den, .. } => {
                format!("Set Time Signature to {}/{}", new_num, new_den)
            }
            Self::AutomationPointAdd { .. } => "Add Automation Point".to_string(),
            Self::AutomationPointDelete { .. } => "Delete Automation Point".to_string(),
            Self::AutomationPointMove { .. } => "Move Automation Point".to_string(),
            Self::PluginAdd { plugin_name, .. } => format!("Add Plugin '{}'", plugin_name),
            Self::PluginRemove { plugin_name, .. } => format!("Remove Plugin '{}'", plugin_name),
            Self::PluginBypass { was_bypassed, .. } => {
                if *was_bypassed { "Enable Plugin".to_string() } else { "Bypass Plugin".to_string() }
            }
            Self::PluginParameterChange { param_id, .. } => format!("Change Parameter {}", param_id),
            Self::MidiNoteAdd { note, .. } => format!("Add Note {}", note),
            Self::MidiNoteDelete { note, .. } => format!("Delete Note {}", note),
            Self::MidiNoteMove { note, .. } => format!("Move Note {}", note),
            Self::MidiNoteResize { note, .. } => format!("Resize Note {}", note),
            Self::SelectionChange { .. } => "Change Selection".to_string(),
            Self::Group { name, .. } => name.clone(),
        }
    }
    
    /// Create the inverse action for undo
    pub fn inverse(&self) -> Self {
        match self.clone() {
            Self::TrackCreate { track_id, name } => Self::TrackDelete { track_id, name },
            Self::TrackDelete { track_id, name } => Self::TrackCreate { track_id, name },
            Self::TrackVolumeChange { track_id, old_value, new_value } => {
                Self::TrackVolumeChange { track_id, old_value: new_value, new_value: old_value }
            }
            Self::TrackPanChange { track_id, old_value, new_value } => {
                Self::TrackPanChange { track_id, old_value: new_value, new_value: old_value }
            }
            Self::TrackMuteToggle { track_id, was_muted } => {
                Self::TrackMuteToggle { track_id, was_muted: !was_muted }
            }
            Self::TrackSoloToggle { track_id, was_soloed } => {
                Self::TrackSoloToggle { track_id, was_soloed: !was_soloed }
            }
            Self::TrackRename { track_id, old_name, new_name } => {
                Self::TrackRename { track_id, old_name: new_name, new_name: old_name }
            }
            Self::ClipCreate { clip_id, name } => Self::ClipDelete { clip_id, name },
            Self::ClipDelete { clip_id, name } => Self::ClipCreate { clip_id, name },
            Self::RegionCreate { region_id, clip_id, track_index, start_time } => {
                Self::RegionDelete { region_id, clip_id, track_index, start_time }
            }
            Self::RegionDelete { region_id, clip_id, track_index, start_time } => {
                Self::RegionCreate { region_id, clip_id, track_index, start_time }
            }
            Self::RegionMove { region_id, old_start, new_start, old_track, new_track } => {
                Self::RegionMove { region_id, old_start: new_start, new_start: old_start, old_track: new_track, new_track: old_track }
            }
            Self::RegionTrimStart { region_id, old_offset, new_offset } => {
                Self::RegionTrimStart { region_id, old_offset: new_offset, new_offset: old_offset }
            }
            Self::RegionTrimEnd { region_id, old_length, new_length } => {
                Self::RegionTrimEnd { region_id, old_length: new_length, new_length: old_length }
            }
            Self::TempoChange { old_bpm, new_bpm } => {
                Self::TempoChange { old_bpm: new_bpm, new_bpm: old_bpm }
            }
            Self::TimeSignatureChange { old_num, old_den, new_num, new_den } => {
                Self::TimeSignatureChange { old_num: new_num, old_den: new_den, new_num: old_num, new_den: old_den }
            }
            Self::AutomationPointAdd { lane_id, time, value } => {
                Self::AutomationPointDelete { lane_id, time, value }
            }
            Self::AutomationPointDelete { lane_id, time, value } => {
                Self::AutomationPointAdd { lane_id, time, value }
            }
            Self::AutomationPointMove { lane_id, old_time, new_time, old_value, new_value } => {
                Self::AutomationPointMove { lane_id, old_time: new_time, new_time: old_time, old_value: new_value, new_value: old_value }
            }
            Self::PluginAdd { track_id, slot_index, plugin_name } => {
                Self::PluginRemove { track_id, slot_index, plugin_name }
            }
            Self::PluginRemove { track_id, slot_index, plugin_name } => {
                Self::PluginAdd { track_id, slot_index, plugin_name }
            }
            Self::PluginBypass { track_id, slot_index, was_bypassed } => {
                Self::PluginBypass { track_id, slot_index, was_bypassed: !was_bypassed }
            }
            Self::PluginParameterChange { track_id, slot_index, param_id, old_value, new_value } => {
                Self::PluginParameterChange { track_id, slot_index, param_id, old_value: new_value, new_value: old_value }
            }
            Self::MidiNoteAdd { clip_id, channel, note, velocity, start, duration } => {
                Self::MidiNoteDelete { clip_id, channel, note, velocity, start, duration }
            }
            Self::MidiNoteDelete { clip_id, channel, note, velocity, start, duration } => {
                Self::MidiNoteAdd { clip_id, channel, note, velocity, start, duration }
            }
            Self::MidiNoteMove { clip_id, note, old_start, new_start } => {
                Self::MidiNoteMove { clip_id, note, old_start: new_start, new_start: old_start }
            }
            Self::MidiNoteResize { clip_id, note, start, old_duration, new_duration } => {
                Self::MidiNoteResize { clip_id, note, start, old_duration: new_duration, new_duration: old_duration }
            }
            Self::SelectionChange { old_selection, new_selection } => {
                Self::SelectionChange { old_selection: new_selection, new_selection: old_selection }
            }
            Self::Group { name, actions } => {
                Self::Group { 
                    name: format!("Undo {}", name),
                    actions: actions.into_iter().rev().map(|a| a.inverse()).collect()
                }
            }
        }
    }
}

// ============================================================================
// History Entry
// ============================================================================

/// A single entry in the history
#[derive(Debug, Clone)]
pub struct HistoryEntry {
    pub action: ActionType,
    pub timestamp_ms: u64,
    pub description: String,
}

impl HistoryEntry {
    pub fn new(action: ActionType) -> Self {
        let description = action.description();
        let timestamp_ms = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        
        Self {
            action,
            timestamp_ms,
            description,
        }
    }
}

// ============================================================================
// History Manager
// ============================================================================

/// Manages undo/redo history
pub struct HistoryManager {
    /// Undo stack (most recent at back)
    undo_stack: VecDeque<HistoryEntry>,
    
    /// Redo stack (most recent at back)
    redo_stack: VecDeque<HistoryEntry>,
    
    /// Maximum history size
    max_size: usize,
    
    /// Currently grouping actions?
    grouping: bool,
    group_name: String,
    group_actions: Vec<ActionType>,
    
    /// Total actions performed
    action_count: u64,
}

impl HistoryManager {
    pub fn new(max_size: usize) -> Self {
        Self {
            undo_stack: VecDeque::with_capacity(max_size),
            redo_stack: VecDeque::with_capacity(max_size),
            max_size,
            grouping: false,
            group_name: String::new(),
            group_actions: Vec::new(),
            action_count: 0,
        }
    }
    
    /// Record an action
    pub fn record(&mut self, action: ActionType) {
        if self.grouping {
            self.group_actions.push(action);
            return;
        }
        
        self.push_action(action);
    }
    
    fn push_action(&mut self, action: ActionType) {
        // Clear redo stack on new action
        self.redo_stack.clear();
        
        let entry = HistoryEntry::new(action);
        self.undo_stack.push_back(entry);
        
        // Enforce max size
        while self.undo_stack.len() > self.max_size {
            self.undo_stack.pop_front();
        }
        
        self.action_count += 1;
    }
    
    /// Start grouping actions
    pub fn begin_group(&mut self, name: &str) {
        if !self.grouping {
            self.grouping = true;
            self.group_name = name.to_string();
            self.group_actions.clear();
        }
    }
    
    /// End grouping and commit as single action
    pub fn end_group(&mut self) {
        if self.grouping && !self.group_actions.is_empty() {
            let group_action = ActionType::Group {
                name: std::mem::take(&mut self.group_name),
                actions: std::mem::take(&mut self.group_actions),
            };
            self.grouping = false;
            self.push_action(group_action);
        } else {
            self.grouping = false;
            self.group_name.clear();
            self.group_actions.clear();
        }
    }
    
    /// Cancel current group without recording
    pub fn cancel_group(&mut self) {
        self.grouping = false;
        self.group_name.clear();
        self.group_actions.clear();
    }
    
    /// Undo last action (returns the inverse action to apply)
    pub fn undo(&mut self) -> Option<ActionType> {
        if let Some(entry) = self.undo_stack.pop_back() {
            let inverse = entry.action.inverse();
            self.redo_stack.push_back(entry);
            Some(inverse)
        } else {
            None
        }
    }
    
    /// Redo last undone action (returns the action to apply)
    pub fn redo(&mut self) -> Option<ActionType> {
        if let Some(entry) = self.redo_stack.pop_back() {
            let action = entry.action.clone();
            self.undo_stack.push_back(entry);
            Some(action)
        } else {
            None
        }
    }
    
    /// Check if undo is available
    pub fn can_undo(&self) -> bool {
        !self.undo_stack.is_empty()
    }
    
    /// Check if redo is available
    pub fn can_redo(&self) -> bool {
        !self.redo_stack.is_empty()
    }
    
    /// Get undo description
    pub fn undo_description(&self) -> Option<&str> {
        self.undo_stack.back().map(|e| e.description.as_str())
    }
    
    /// Get redo description
    pub fn redo_description(&self) -> Option<&str> {
        self.redo_stack.back().map(|e| e.description.as_str())
    }
    
    /// Get history stats
    pub fn stats(&self) -> (usize, usize, u64) {
        (self.undo_stack.len(), self.redo_stack.len(), self.action_count)
    }
    
    /// Clear all history
    pub fn clear(&mut self) {
        self.undo_stack.clear();
        self.redo_stack.clear();
        self.cancel_group();
    }
    
    /// Get recent undo entries (for UI display)
    pub fn recent_undo(&self, count: usize) -> Vec<&str> {
        self.undo_stack.iter()
            .rev()
            .take(count)
            .map(|e| e.description.as_str())
            .collect()
    }
    
    /// Get recent redo entries (for UI display)
    pub fn recent_redo(&self, count: usize) -> Vec<&str> {
        self.redo_stack.iter()
            .rev()
            .take(count)
            .map(|e| e.description.as_str())
            .collect()
    }
}

impl Default for HistoryManager {
    fn default() -> Self {
        Self::new(1000) // 1000 undo levels
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_basic_undo_redo() {
        let mut history = HistoryManager::new(100);
        
        history.record(ActionType::TrackVolumeChange {
            track_id: 1,
            old_value: 1.0,
            new_value: 0.5,
        });
        
        assert!(history.can_undo());
        assert!(!history.can_redo());
        
        let inverse = history.undo().unwrap();
        if let ActionType::TrackVolumeChange { new_value, .. } = inverse {
            assert_eq!(new_value, 1.0); // Should restore to old value
        } else {
            panic!("Wrong action type");
        }
        
        assert!(!history.can_undo());
        assert!(history.can_redo());
    }
    
    #[test]
    fn test_action_grouping() {
        let mut history = HistoryManager::new(100);
        
        history.begin_group("Multiple Changes");
        history.record(ActionType::TrackVolumeChange { track_id: 1, old_value: 1.0, new_value: 0.5 });
        history.record(ActionType::TrackPanChange { track_id: 1, old_value: 0.0, new_value: 0.5 });
        history.end_group();
        
        // Should be only 1 undo entry
        let (undo_count, _, _) = history.stats();
        assert_eq!(undo_count, 1);
        
        // Undo should include both actions
        if let Some(ActionType::Group { actions, .. }) = history.undo() {
            assert_eq!(actions.len(), 2);
        } else {
            panic!("Expected group action");
        }
    }
    
    #[test]
    fn test_inverse_actions() {
        let create = ActionType::TrackCreate { track_id: 1, name: "Test".to_string() };
        let inverse = create.inverse();
        
        if let ActionType::TrackDelete { track_id, name } = inverse {
            assert_eq!(track_id, 1);
            assert_eq!(name, "Test");
        } else {
            panic!("Wrong inverse type");
        }
    }
}
