mod audio_engine;

use audio_engine::{AudioEngine, FFTAnalyzer, AudioAnalysis, generate_mixing_recommendations, MixingSettings};
use parking_lot::Mutex;
use std::sync::Arc;
use tauri::State;

/// Global audio engine state
struct AudioEngineState {
    engine: Mutex<Option<AudioEngine>>,
    analyzer: Mutex<FFTAnalyzer>,
}

#[tauri::command]
fn start_audio_engine(state: State<Arc<AudioEngineState>>) -> Result<String, String> {
    let mut engine = state.engine.lock();
    let mut new_engine = AudioEngine::new(48000, 2, 256)?;
    new_engine.start()?;
    *engine = Some(new_engine);
    Ok("Audio engine started".to_string())
}

#[tauri::command]
fn stop_audio_engine(state: State<Arc<AudioEngineState>>) -> Result<String, String> {
    let mut engine = state.engine.lock();
    if let Some(mut e) = engine.take() {
        e.stop();
        Ok("Audio engine stopped".to_string())
    } else {
        Err("No engine running".to_string())
    }
}

#[tauri::command]
fn get_audio_metrics(state: State<Arc<AudioEngineState>>) -> Result<serde_json::Value, String> {
    let engine = state.engine.lock();
    if let Some(e) = engine.as_ref() {
        let metrics = e.get_metrics();
        Ok(serde_json::json!({
            "sample_rate": metrics.sample_rate,
            "channels": metrics.channels,
            "buffer_size": metrics.buffer_size,
            "cpu_load": metrics.cpu_load,
            "latency_ms": metrics.latency_ms,
        }))
    } else {
        Err("Engine not running".to_string())
    }
}

#[tauri::command]
fn analyze_audio(samples: Vec<f32>, state: State<Arc<AudioEngineState>>) -> Result<serde_json::Value, String> {
    let mut analyzer = state.analyzer.lock();
    let analysis = analyzer.analyze(&samples);
    
    Ok(serde_json::json!({
        "rms": analysis.rms,
        "peak": analysis.peak,
        "crest_factor": analysis.crest_factor,
        "fundamental_frequency": analysis.fundamental_frequency,
        "loudness_lufs": analysis.loudness_lufs,
        "frequency_bands": analysis.frequency_bands.iter().map(|b| {
            serde_json::json!({
                "frequency": b.frequency,
                "magnitude": b.magnitude,
            })
        }).collect::<Vec<_>>(),
    }))
}

#[tauri::command]
fn get_mixing_recommendations(
    loudness_lufs: f32,
    state: State<Arc<AudioEngineState>>,
) -> Result<serde_json::Value, String> {
    let mut analyzer = state.analyzer.lock();
    let dummy_samples = vec![0.0; 1024];
    let mut analysis = analyzer.analyze(&dummy_samples);
    analysis.loudness_lufs = loudness_lufs;
    
    let settings = MixingSettings::default();
    let recommendations = generate_mixing_recommendations(&analysis, &settings);
    
    Ok(serde_json::json!({
        "recommendations": recommendations.iter().map(|r| {
            serde_json::json!({
                "track_id": r.track_id,
                "parameter": r.parameter,
                "current_value": r.current_value,
                "recommended_value": r.recommended_value,
                "reason": r.reason,
            })
        }).collect::<Vec<_>>(),
    }))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let audio_state = Arc::new(AudioEngineState {
        engine: Mutex::new(None),
        analyzer: Mutex::new(FFTAnalyzer::new(1024)),
    });

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Debug)
                        .build(),
                )?;
            }
            Ok(())
        })
        .manage(audio_state)
        .invoke_handler(tauri::generate_handler![
            start_audio_engine,
            stop_audio_engine,
            get_audio_metrics,
            analyze_audio,
            get_mixing_recommendations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
