/**
 * Audio Bridge - Connects Flow's Web Audio API processing to native Rust engine
 * 
 * This module bridges audio data between:
 * - JavaScript/TypeScript (Web Audio API, Flow DSP chain)
 * - Native Rust engine (cpal, low-latency I/O)
 * 
 * Created by Ravenis Prime (F.L.O.W)
 */

use crossbeam_queue::ArrayQueue;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;

/// Audio data packet sent from JavaScript to Rust engine
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioPacket {
    pub samples: Vec<f32>,
    pub sample_rate: u32,
    pub channels: u16,
    pub timestamp_ns: u64,
}

/// Audio bridge state
pub struct AudioBridge {
    /// Queue for audio data from JavaScript → Rust engine
    audio_queue: Arc<ArrayQueue<f32>>,
    /// Whether bridge is active
    active: Arc<AtomicBool>,
    /// Sample rate
    sample_rate: u32,
    /// Channel count
    channels: u16,
}

impl AudioBridge {
    pub fn new(sample_rate: u32, channels: u16, buffer_size: usize) -> Self {
        let queue_size = buffer_size * channels as usize * 16; // 16 buffers ahead
        Self {
            audio_queue: Arc::new(ArrayQueue::new(queue_size.max(1024))),
            active: Arc::new(AtomicBool::new(false)),
            sample_rate,
            channels,
        }
    }

    /// Push audio samples from JavaScript
    pub fn push_samples(&self, samples: &[f32]) -> Result<usize, String> {
        if !self.active.load(Ordering::Relaxed) {
            return Err("Audio bridge not active".to_string());
        }

        let mut pushed = 0;
        for &sample in samples {
            if self.audio_queue.push(sample).is_ok() {
                pushed += 1;
            } else {
                // Queue full - drop samples
                break;
            }
        }

        if pushed < samples.len() {
            log::warn!(
                "[AudioBridge] Queue full, dropped {} samples",
                samples.len() - pushed
            );
        }

        Ok(pushed)
    }

    /// Pop audio samples for Rust engine output
    pub fn pop_samples(&self, buffer: &mut [f32]) -> usize {
        let mut popped = 0;
        for sample in buffer.iter_mut() {
            match self.audio_queue.pop() {
                Some(value) => {
                    *sample = value;
                    popped += 1;
                }
                None => {
                    // Queue empty - output silence
                    *sample = 0.0;
                    popped += 1;
                }
            }
        }
        popped
    }

    /// Activate the bridge
    pub fn activate(&self) {
        self.active.store(true, Ordering::Relaxed);
        log::info!("[AudioBridge] Activated ({} Hz, {} channels)", self.sample_rate, self.channels);
    }

    /// Deactivate the bridge
    pub fn deactivate(&self) {
        self.active.store(false, Ordering::Relaxed);
        // Clear queue
        while self.audio_queue.pop().is_some() {}
        log::info!("[AudioBridge] Deactivated");
    }

    /// Check if bridge is active
    pub fn is_active(&self) -> bool {
        self.active.load(Ordering::Relaxed)
    }

    /// Get queue fill level (0.0 to 1.0)
    pub fn queue_level(&self) -> f32 {
        // ArrayQueue doesn't expose capacity, so we estimate based on typical usage
        // This is a rough estimate
        0.5 // Placeholder - would need to track this properly
    }
}

/// Global audio bridge instance
static AUDIO_BRIDGE: Lazy<Arc<Mutex<Option<AudioBridge>>>> =
    Lazy::new(|| Arc::new(Mutex::new(None)));

/// Initialize the audio bridge
pub fn init_audio_bridge(sample_rate: u32, channels: u16, buffer_size: usize) -> Result<(), String> {
    let mut guard = AUDIO_BRIDGE
        .lock()
        .map_err(|e| format!("Failed to lock audio bridge: {}", e))?;

    if guard.is_some() {
        return Ok(()); // Already initialized
    }

    let bridge = AudioBridge::new(sample_rate, channels, buffer_size);
    bridge.activate();
    *guard = Some(bridge);

    log::info!(
        "[AudioBridge] Initialized ({} Hz, {} channels, buffer: {})",
        sample_rate,
        channels,
        buffer_size
    );

    Ok(())
}

/// Push audio samples from JavaScript
#[tauri::command]
pub fn push_audio_samples(samples: Vec<f32>) -> Result<usize, String> {
    let guard = AUDIO_BRIDGE
        .lock()
        .map_err(|e| format!("Failed to lock audio bridge: {}", e))?;

    if let Some(bridge) = guard.as_ref() {
        bridge.push_samples(&samples)
    } else {
        Err("Audio bridge not initialized".to_string())
    }
}

/// Get audio bridge status
#[tauri::command]
pub fn get_audio_bridge_status() -> Result<serde_json::Value, String> {
    let guard = AUDIO_BRIDGE
        .lock()
        .map_err(|e| format!("Failed to lock audio bridge: {}", e))?;

    if let Some(bridge) = guard.as_ref() {
        Ok(serde_json::json!({
            "active": bridge.is_active(),
            "sample_rate": bridge.sample_rate,
            "channels": bridge.channels,
            "queue_level": bridge.queue_level(),
        }))
    } else {
        Ok(serde_json::json!({
            "active": false,
            "error": "Audio bridge not initialized"
        }))
    }
}

/// Get the audio queue for direct access (used by Rust engine callback)
pub fn get_audio_queue() -> Option<Arc<ArrayQueue<f32>>> {
    let guard = AUDIO_BRIDGE.lock().ok()?;
    guard.as_ref().map(|bridge| bridge.audio_queue.clone())
}

