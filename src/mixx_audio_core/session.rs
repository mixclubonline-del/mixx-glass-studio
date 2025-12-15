use std::time::{SystemTime, UNIX_EPOCH};
use serde::{Deserialize, Serialize};

/// Project Session Manager
/// 
/// Manages DAW project state:
/// - Project metadata (name, tempo, time signature, etc.)
/// - Serializable project state
/// - Save/load operations
/// - Autosave functionality
/// - Project versioning

// ============================================================================
// Project Metadata
// ============================================================================

/// Time signature representation
#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq)]
pub struct TimeSignature {
    pub numerator: u8,
    pub denominator: u8,
}

impl TimeSignature {
    pub fn new(numerator: u8, denominator: u8) -> Self {
        Self { numerator, denominator }
    }
    
    pub fn common() -> Self {
        Self::new(4, 4)
    }
    
    pub fn waltz() -> Self {
        Self::new(3, 4)
    }
}

impl Default for TimeSignature {
    fn default() -> Self {
        Self::common()
    }
}

/// Project metadata
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectMetadata {
    /// Project name
    pub name: String,
    
    /// Project file path (if saved)
    pub file_path: Option<String>,
    
    /// Tempo in BPM
    pub tempo: f32,
    
    /// Time signature
    pub time_signature: TimeSignature,
    
    /// Sample rate
    pub sample_rate: u32,
    
    /// Project creation timestamp (ms since epoch)
    pub created_at: u64,
    
    /// Last modified timestamp
    pub modified_at: u64,
    
    /// Project version (for format compatibility)
    pub version: u32,
    
    /// Author/creator name
    pub author: String,
    
    /// Project notes/description
    pub notes: String,
}

impl ProjectMetadata {
    pub fn new(name: &str) -> Self {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
        
        Self {
            name: name.to_string(),
            file_path: None,
            tempo: 120.0,
            time_signature: TimeSignature::default(),
            sample_rate: 48000,
            created_at: now,
            modified_at: now,
            version: 1,
            author: String::new(),
            notes: String::new(),
        }
    }
    
    pub fn touch(&mut self) {
        self.modified_at = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
    }
}

impl Default for ProjectMetadata {
    fn default() -> Self {
        Self::new("Untitled Project")
    }
}

// ============================================================================
// Track State
// ============================================================================

/// Serializable track state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackState {
    pub id: u64,
    pub name: String,
    pub track_type: String, // "audio", "midi", "bus", "master"
    pub volume: f32,
    pub pan: f32,
    pub muted: bool,
    pub soloed: bool,
    pub armed: bool,
    pub color: u32,
}

// ============================================================================
// Region State
// ============================================================================

/// Serializable region state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegionState {
    pub id: u64,
    pub clip_id: u64,
    pub track_index: usize,
    pub start_time: u64,
    pub clip_offset: u64,
    pub length: u64,
    pub muted: bool,
    pub looped: bool,
}

// ============================================================================
// Automation State
// ============================================================================

/// Automation point
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationPoint {
    pub time: u64,
    pub value: f32,
}

/// Automation lane state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutomationLaneState {
    pub id: u64,
    pub track_id: u64,
    pub parameter: String,
    pub points: Vec<AutomationPoint>,
}

// ============================================================================
// Project State
// ============================================================================

/// Complete serializable project state
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectState {
    /// Project metadata
    pub metadata: ProjectMetadata,
    
    /// All tracks
    pub tracks: Vec<TrackState>,
    
    /// All regions
    pub regions: Vec<RegionState>,
    
    /// Automation data
    pub automation: Vec<AutomationLaneState>,
    
    /// Transport position
    pub playhead_position: u64,
    
    /// Loop region
    pub loop_start: u64,
    pub loop_end: u64,
    pub loop_enabled: bool,
    
    /// Markers
    pub markers: Vec<(u64, String)>,
}

impl ProjectState {
    pub fn new(name: &str) -> Self {
        Self {
            metadata: ProjectMetadata::new(name),
            tracks: Vec::new(),
            regions: Vec::new(),
            automation: Vec::new(),
            playhead_position: 0,
            loop_start: 0,
            loop_end: 0,
            loop_enabled: false,
            markers: Vec::new(),
        }
    }
    
    /// Serialize to JSON
    pub fn to_json(&self) -> Result<String, String> {
        serde_json::to_string_pretty(self)
            .map_err(|e| format!("Serialization error: {}", e))
    }
    
    /// Deserialize from JSON
    pub fn from_json(json: &str) -> Result<Self, String> {
        serde_json::from_str(json)
            .map_err(|e| format!("Deserialization error: {}", e))
    }
    
    /// Get project size estimate (for display)
    pub fn size_estimate(&self) -> usize {
        self.tracks.len() * 100 + self.regions.len() * 50 + self.automation.len() * 200
    }
}

impl Default for ProjectState {
    fn default() -> Self {
        Self::new("Untitled Project")
    }
}

// ============================================================================
// Session Manager
// ============================================================================

/// Manages project sessions
pub struct SessionManager {
    /// Current project state
    current_project: ProjectState,
    
    /// Has unsaved changes
    is_dirty: bool,
    
    /// Autosave interval in seconds (0 = disabled)
    autosave_interval: u32,
    
    /// Last autosave timestamp
    last_autosave: u64,
    
    /// Recent projects (file paths)
    recent_projects: Vec<String>,
    
    /// Maximum recent projects to track
    max_recent: usize,
}

impl SessionManager {
    pub fn new() -> Self {
        Self {
            current_project: ProjectState::default(),
            is_dirty: false,
            autosave_interval: 60, // 1 minute default
            last_autosave: 0,
            recent_projects: Vec::new(),
            max_recent: 10,
        }
    }
    
    /// Create new project
    pub fn new_project(&mut self, name: &str) {
        self.current_project = ProjectState::new(name);
        self.is_dirty = false;
    }
    
    /// Get current project
    pub fn project(&self) -> &ProjectState {
        &self.current_project
    }
    
    /// Get mutable project
    pub fn project_mut(&mut self) -> &mut ProjectState {
        self.is_dirty = true;
        self.current_project.metadata.touch();
        &mut self.current_project
    }
    
    /// Mark project as dirty (has changes)
    pub fn mark_dirty(&mut self) {
        self.is_dirty = true;
        self.current_project.metadata.touch();
    }
    
    /// Check if project has unsaved changes
    pub fn is_dirty(&self) -> bool {
        self.is_dirty
    }
    
    /// Get project name
    pub fn project_name(&self) -> &str {
        &self.current_project.metadata.name
    }
    
    /// Set project name
    pub fn set_project_name(&mut self, name: &str) {
        self.current_project.metadata.name = name.to_string();
        self.mark_dirty();
    }
    
    /// Get tempo
    pub fn tempo(&self) -> f32 {
        self.current_project.metadata.tempo
    }
    
    /// Set tempo
    pub fn set_tempo(&mut self, tempo: f32) {
        self.current_project.metadata.tempo = tempo.clamp(20.0, 999.0);
        self.mark_dirty();
    }
    
    /// Get time signature
    pub fn time_signature(&self) -> TimeSignature {
        self.current_project.metadata.time_signature
    }
    
    /// Set time signature
    pub fn set_time_signature(&mut self, numerator: u8, denominator: u8) {
        self.current_project.metadata.time_signature = TimeSignature::new(numerator, denominator);
        self.mark_dirty();
    }
    
    /// Save project (returns JSON string)
    pub fn save(&mut self) -> Result<String, String> {
        let json = self.current_project.to_json()?;
        self.is_dirty = false;
        self.current_project.metadata.touch();
        Ok(json)
    }
    
    /// Load project from JSON
    pub fn load(&mut self, json: &str) -> Result<(), String> {
        let project = ProjectState::from_json(json)?;
        
        // Add to recent projects if has file path
        if let Some(ref path) = project.metadata.file_path {
            self.add_recent(path);
        }
        
        self.current_project = project;
        self.is_dirty = false;
        Ok(())
    }
    
    /// Set file path
    pub fn set_file_path(&mut self, path: &str) {
        self.current_project.metadata.file_path = Some(path.to_string());
        self.add_recent(path);
    }
    
    /// Add to recent projects
    fn add_recent(&mut self, path: &str) {
        // Remove if already exists
        self.recent_projects.retain(|p| p != path);
        
        // Add to front
        self.recent_projects.insert(0, path.to_string());
        
        // Trim to max
        while self.recent_projects.len() > self.max_recent {
            self.recent_projects.pop();
        }
    }
    
    /// Get recent projects
    pub fn recent_projects(&self) -> &[String] {
        &self.recent_projects
    }
    
    /// Clear recent projects
    pub fn clear_recent(&mut self) {
        self.recent_projects.clear();
    }
    
    /// Set autosave interval (0 = disabled)
    pub fn set_autosave_interval(&mut self, seconds: u32) {
        self.autosave_interval = seconds;
    }
    
    /// Check if autosave is due
    pub fn should_autosave(&self) -> bool {
        if self.autosave_interval == 0 || !self.is_dirty {
            return false;
        }
        
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_secs())
            .unwrap_or(0);
        
        now - (self.last_autosave / 1000) >= self.autosave_interval as u64
    }
    
    /// Mark autosave as done
    pub fn autosave_done(&mut self) {
        self.last_autosave = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0);
    }
    
    /// Get session stats
    pub fn stats(&self) -> (usize, usize, bool, u64) {
        (
            self.current_project.tracks.len(),
            self.current_project.regions.len(),
            self.is_dirty,
            self.current_project.metadata.modified_at,
        )
    }
    
    /// Add track to project
    pub fn add_track(&mut self, track: TrackState) {
        self.current_project.tracks.push(track);
        self.mark_dirty();
    }
    
    /// Add region to project
    pub fn add_region(&mut self, region: RegionState) {
        self.current_project.regions.push(region);
        self.mark_dirty();
    }
    
    /// Add marker
    pub fn add_marker(&mut self, position: u64, name: &str) {
        self.current_project.markers.push((position, name.to_string()));
        self.current_project.markers.sort_by_key(|(pos, _)| *pos);
        self.mark_dirty();
    }
    
    /// Get markers
    pub fn markers(&self) -> &[(u64, String)] {
        &self.current_project.markers
    }
}

impl Default for SessionManager {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_project_metadata() {
        let meta = ProjectMetadata::new("Test Project");
        assert_eq!(meta.name, "Test Project");
        assert_eq!(meta.tempo, 120.0);
        assert!(meta.created_at > 0);
    }
    
    #[test]
    fn test_project_serialization() {
        let project = ProjectState::new("Test");
        let json = project.to_json().unwrap();
        
        let loaded = ProjectState::from_json(&json).unwrap();
        assert_eq!(loaded.metadata.name, "Test");
    }
    
    #[test]
    fn test_session_manager() {
        let mut session = SessionManager::new();
        
        session.new_project("My Song");
        assert_eq!(session.project_name(), "My Song");
        assert!(!session.is_dirty());
        
        session.set_tempo(140.0);
        assert!(session.is_dirty());
        assert_eq!(session.tempo(), 140.0);
    }
    
    #[test]
    fn test_save_load() {
        let mut session = SessionManager::new();
        session.new_project("Save Test");
        session.set_tempo(128.0);
        
        let json = session.save().unwrap();
        assert!(!session.is_dirty());
        
        let mut session2 = SessionManager::new();
        session2.load(&json).unwrap();
        
        assert_eq!(session2.project_name(), "Save Test");
        assert_eq!(session2.tempo(), 128.0);
    }
}
