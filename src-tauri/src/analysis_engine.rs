use mixx_core::pop_analysis_samples;
use std::thread;
use std::time::Duration;
use tauri::{AppHandle, Emitter};

pub struct AnalysisEngine {
    _running: bool,
}

pub fn start_analysis_loop(app_handle: AppHandle) {
    let handle = app_handle.clone();
    
    thread::spawn(move || {
        println!("📊 Analysis Engine Loop Started");
        loop {
            // Target ~60 FPS
            thread::sleep(Duration::from_millis(16));
            
            // Pop samples from the core engine's analysis queue
            // We fetch up to 1024 samples (approx 21ms at 48kHz)
            // This is enough for visualization while keeping payload reasonable
            let samples = pop_analysis_samples(1024);
            
            if !samples.is_empty() {
                // Emit event to frontend
                // Event: "analysis-data"
                // Payload: Vec<f32>
                if let Err(_e) = handle.emit("analysis-data", &samples) {
                    // Only log error occasionally to avoid spam if frontend is closed
                    // eprintln!("Failed to emit analysis data: {}", e);
                }
            }
        }
    });
}

// Phase 26: Loudness metering event loop using engine's master_chain_get_meters
pub fn start_metering_loop(app_handle: AppHandle) {
    let handle = app_handle.clone();
    
    thread::spawn(move || {
        println!("📈 Loudness Metering Loop Started");
        loop {
            // Update at 10 FPS (100ms) - sufficient for metering display
            thread::sleep(Duration::from_millis(100));
            
            // Get meters from the engine's MasterChain
            let (momentary, short_term, integrated, true_peak) = mixx_core::master_chain_get_meters();
            
            // Only emit if we have valid readings (not -100 default)
            if momentary > -99.0 || integrated > -99.0 {
                let meter_data = serde_json::json!({
                    "momentary_lufs": momentary,
                    "short_term_lufs": short_term,
                    "integrated_lufs": integrated,
                    "true_peak_db": true_peak
                });
                
                if let Err(_e) = handle.emit("loudness-meters", meter_data) {
                    // Silently ignore if frontend not listening
                }
            }
        }
    });
}
