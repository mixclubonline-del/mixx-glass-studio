use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};

/// Audio I/O Abstraction Layer
/// 
/// Provides unified, platform-agnostic audio device management:
/// - Device enumeration (inputs, outputs)
/// - Stream lifecycle control
/// - Device capabilities querying
/// - Hot-plug detection ready

// ============================================================================
// Audio Device
// ============================================================================

/// Device type enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DeviceType {
    Input,
    Output,
    Duplex,
}

/// Audio device capabilities
#[derive(Debug, Clone)]
pub struct DeviceCapabilities {
    pub min_sample_rate: u32,
    pub max_sample_rate: u32,
    pub min_channels: u16,
    pub max_channels: u16,
    pub min_buffer_size: u32,
    pub max_buffer_size: u32,
    pub supported_formats: Vec<SampleFormat>,
}

impl Default for DeviceCapabilities {
    fn default() -> Self {
        Self {
            min_sample_rate: 44100,
            max_sample_rate: 192000,
            min_channels: 1,
            max_channels: 8,
            min_buffer_size: 64,
            max_buffer_size: 4096,
            supported_formats: vec![SampleFormat::F32, SampleFormat::I16],
        }
    }
}

/// Sample format enumeration
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SampleFormat {
    F32,
    I16,
    I32,
    U16,
}

impl Default for SampleFormat {
    fn default() -> Self {
        Self::F32
    }
}

/// Unified audio device representation
#[derive(Debug, Clone)]
pub struct AudioDevice {
    pub id: String,
    pub name: String,
    pub device_type: DeviceType,
    pub is_default: bool,
    pub capabilities: DeviceCapabilities,
    pub driver_name: String,
}

impl AudioDevice {
    pub fn new(id: &str, name: &str, device_type: DeviceType) -> Self {
        Self {
            id: id.to_string(),
            name: name.to_string(),
            device_type,
            is_default: false,
            capabilities: DeviceCapabilities::default(),
            driver_name: "cpal".to_string(),
        }
    }
    
    pub fn with_default(mut self, is_default: bool) -> Self {
        self.is_default = is_default;
        self
    }
    
    pub fn with_capabilities(mut self, caps: DeviceCapabilities) -> Self {
        self.capabilities = caps;
        self
    }
}

// ============================================================================
// Audio Stream Config
// ============================================================================

/// Stream configuration
#[derive(Debug, Clone)]
pub struct StreamConfig {
    pub sample_rate: u32,
    pub channels: u16,
    pub buffer_size: u32,
    pub format: SampleFormat,
}

impl Default for StreamConfig {
    fn default() -> Self {
        Self {
            sample_rate: 48000,
            channels: 2,
            buffer_size: 256,
            format: SampleFormat::F32,
        }
    }
}

impl StreamConfig {
    pub fn new(sample_rate: u32, channels: u16, buffer_size: u32) -> Self {
        Self {
            sample_rate,
            channels,
            buffer_size,
            format: SampleFormat::F32,
        }
    }
    
    /// Calculate latency in milliseconds
    pub fn latency_ms(&self) -> f32 {
        (self.buffer_size as f32 / self.sample_rate as f32) * 1000.0
    }
    
    /// Calculate samples per millisecond
    pub fn samples_per_ms(&self) -> f32 {
        self.sample_rate as f32 / 1000.0
    }
}

// ============================================================================
// Audio Manager
// ============================================================================

/// Audio I/O Manager
/// 
/// Manages device enumeration and selection
pub struct AudioManager {
    /// Available input devices
    input_devices: Vec<AudioDevice>,
    /// Available output devices
    output_devices: Vec<AudioDevice>,
    
    /// Currently selected devices
    current_input_id: Option<String>,
    current_output_id: Option<String>,
    
    /// Current stream configuration
    config: StreamConfig,
    
    /// Stream state
    is_running: AtomicBool,
    
    /// Statistics
    underruns: AtomicU32,
    overruns: AtomicU32,
}

impl AudioManager {
    pub fn new() -> Self {
        Self {
            input_devices: Vec::new(),
            output_devices: Vec::new(),
            current_input_id: None,
            current_output_id: None,
            config: StreamConfig::default(),
            is_running: AtomicBool::new(false),
            underruns: AtomicU32::new(0),
            overruns: AtomicU32::new(0),
        }
    }
    
    /// Enumerate available devices (placeholder - would use cpal in real impl)
    pub fn enumerate_devices(&mut self) {
        // In production, this would call cpal::default_host().devices()
        // For now, create mock devices for the abstraction layer
        
        self.input_devices.clear();
        self.output_devices.clear();
        
        // Mock default input
        self.input_devices.push(
            AudioDevice::new("input_default", "Built-in Microphone", DeviceType::Input)
                .with_default(true)
        );
        
        // Mock default output
        self.output_devices.push(
            AudioDevice::new("output_default", "Built-in Speakers", DeviceType::Output)
                .with_default(true)
        );
        
        // Mock additional devices
        self.output_devices.push(
            AudioDevice::new("output_headphones", "Headphones", DeviceType::Output)
        );
    }
    
    /// Get available input devices
    pub fn input_devices(&self) -> &[AudioDevice] {
        &self.input_devices
    }
    
    /// Get available output devices
    pub fn output_devices(&self) -> &[AudioDevice] {
        &self.output_devices
    }
    
    /// Get default input device
    pub fn default_input(&self) -> Option<&AudioDevice> {
        self.input_devices.iter().find(|d| d.is_default)
    }
    
    /// Get default output device
    pub fn default_output(&self) -> Option<&AudioDevice> {
        self.output_devices.iter().find(|d| d.is_default)
    }
    
    /// Select input device by ID
    pub fn select_input(&mut self, device_id: &str) -> bool {
        if self.input_devices.iter().any(|d| d.id == device_id) {
            self.current_input_id = Some(device_id.to_string());
            true
        } else {
            false
        }
    }
    
    /// Select output device by ID
    pub fn select_output(&mut self, device_id: &str) -> bool {
        if self.output_devices.iter().any(|d| d.id == device_id) {
            self.current_output_id = Some(device_id.to_string());
            true
        } else {
            false
        }
    }
    
    /// Get currently selected input device
    pub fn current_input(&self) -> Option<&AudioDevice> {
        self.current_input_id.as_ref().and_then(|id| {
            self.input_devices.iter().find(|d| &d.id == id)
        })
    }
    
    /// Get currently selected output device
    pub fn current_output(&self) -> Option<&AudioDevice> {
        self.current_output_id.as_ref().and_then(|id| {
            self.output_devices.iter().find(|d| &d.id == id)
        })
    }
    
    /// Set stream configuration
    pub fn set_config(&mut self, config: StreamConfig) {
        self.config = config;
    }
    
    /// Get current stream configuration
    pub fn config(&self) -> &StreamConfig {
        &self.config
    }
    
    /// Check if audio is running
    pub fn is_running(&self) -> bool {
        self.is_running.load(Ordering::Relaxed)
    }
    
    /// Start audio streams
    pub fn start(&self) {
        self.is_running.store(true, Ordering::SeqCst);
    }
    
    /// Stop audio streams
    pub fn stop(&self) {
        self.is_running.store(false, Ordering::SeqCst);
    }
    
    /// Report underrun (buffer empty during playback)
    pub fn report_underrun(&self) {
        self.underruns.fetch_add(1, Ordering::Relaxed);
    }
    
    /// Report overrun (buffer overflow during capture)
    pub fn report_overrun(&self) {
        self.overruns.fetch_add(1, Ordering::Relaxed);
    }
    
    /// Get statistics
    pub fn stats(&self) -> (u32, u32) {
        (
            self.underruns.load(Ordering::Relaxed),
            self.overruns.load(Ordering::Relaxed),
        )
    }
    
    /// Reset statistics
    pub fn reset_stats(&self) {
        self.underruns.store(0, Ordering::Relaxed);
        self.overruns.store(0, Ordering::Relaxed);
    }
}

impl Default for AudioManager {
    fn default() -> Self {
        Self::new()
    }
}

unsafe impl Send for AudioManager {}
unsafe impl Sync for AudioManager {}

// ============================================================================
// Device Info (Serializable for Tauri)
// ============================================================================

/// Serializable device info for frontend
#[derive(Debug, Clone)]
pub struct DeviceInfo {
    pub id: String,
    pub name: String,
    pub is_input: bool,
    pub is_default: bool,
    pub sample_rates: Vec<u32>,
    pub channels: u16,
}

impl From<&AudioDevice> for DeviceInfo {
    fn from(device: &AudioDevice) -> Self {
        Self {
            id: device.id.clone(),
            name: device.name.clone(),
            is_input: device.device_type == DeviceType::Input,
            is_default: device.is_default,
            sample_rates: vec![44100, 48000, 88200, 96000, 176400, 192000],
            channels: device.capabilities.max_channels,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_device_enumeration() {
        let mut manager = AudioManager::new();
        manager.enumerate_devices();
        
        assert!(!manager.input_devices().is_empty());
        assert!(!manager.output_devices().is_empty());
        assert!(manager.default_output().is_some());
    }
    
    #[test]
    fn test_device_selection() {
        let mut manager = AudioManager::new();
        manager.enumerate_devices();
        
        assert!(manager.select_output("output_default"));
        assert!(manager.current_output().is_some());
        assert!(!manager.select_output("nonexistent"));
    }
    
    #[test]
    fn test_stream_config() {
        let config = StreamConfig::new(48000, 2, 256);
        
        // 256 samples at 48kHz = 5.33ms
        assert!((config.latency_ms() - 5.33).abs() < 0.1);
    }
}
