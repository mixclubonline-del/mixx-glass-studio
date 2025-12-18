// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod flow_engine;
mod quantum;
mod git;
mod dsp;
mod stem_separation;  // Phase 33: Local Demucs
use dsp::commands::*;
use stem_separation::*;
mod analysis_engine;
mod local_llm;  // Phase 37: Local LLM
use local_llm::*; // Added

use flow_engine::FlowEngine;
use quantum::superposition::{SuperpositionEngine, MeasurementBasis, CollapsePolicy};
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;
use serde_json;

// Global F.L.O.W. Engine instance using Lazy for safe static initialization
static FLOW_ENGINE: Lazy<Arc<Mutex<Option<FlowEngine>>>> = Lazy::new(|| Arc::new(Mutex::new(None)));

// Global Superposition Engine instance
static SUPERPOSITION_ENGINE: Lazy<Arc<Mutex<SuperpositionEngine>>> = Lazy::new(|| {
    Arc::new(Mutex::new(SuperpositionEngine::new()))
});

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// F.L.O.W. Engine Commands
#[tauri::command]
fn initialize_flow_engine() -> Result<String, String> {
    println!("🎵 Initializing F.L.O.W. Engine...");

    let mut engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if engine_guard.is_some() {
        return Ok("F.L.O.W. Engine already initialized".to_string());
    }

    let mut engine = FlowEngine::new().map_err(|e| format!("Failed to create engine: {}", e))?;
    engine.start_audio_stream().map_err(|e| format!("Failed to start audio stream: {}", e))?;

    *engine_guard = Some(engine);

    println!("✅ F.L.O.W. Engine initialized successfully!");
    Ok("F.L.O.W. Engine initialized successfully!".to_string())
}

#[tauri::command]
fn get_flow_status() -> Result<serde_json::Value, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        Ok(engine.get_status())
    } else {
        Ok(serde_json::json!({
            "error": "F.L.O.W. Engine not initialized"
        }))
    }
}

#[tauri::command]
fn flow_play() -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.play();
        Ok("F.L.O.W. Transport: PLAY".to_string())
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

#[tauri::command]
fn flow_pause() -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.pause();
        Ok("F.L.O.W. Transport: PAUSE".to_string())
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

#[tauri::command]
fn flow_stop() -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.stop();
        Ok("F.L.O.W. Transport: STOP".to_string())
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

#[tauri::command]
fn flow_set_bpm(bpm: f32) -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.set_bpm(bpm);
        Ok(format!("F.L.O.W. BPM set to: {}", bpm))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

#[tauri::command]
fn flow_set_space_pad(width: f32, depth: f32, presence: f32) -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.set_space_pad(width, depth, presence);
        Ok(format!("Space Pad: Width={:.2}, Depth={:.2}, Presence={:.2}", width, depth, presence))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

#[tauri::command]
fn flow_arm_recording(armed: bool) -> Result<String, String> {
    let engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_ref() {
        engine.arm_recording(armed);
        Ok(format!("F.L.O.W. Recording: {}", if armed { "ARMED" } else { "DISARMED" }))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

// Added: Velvet Curve Commands
#[tauri::command]
fn set_velvet_curve_params(warmth: f32, silk_edge: f32, emotion: f32, power: f32) -> Result<String, String> {
    let mut engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_mut() {
        // Assuming update_velvet_curve is implemented on FlowEngine
        engine.update_velvet_curve(warmth, silk_edge, emotion, power);
        Ok(format!("Velvet Curve Updated: W={:.2} S={:.2} E={:.2} P={:.2}", warmth, silk_edge, emotion, power))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

// Added: Harmonic Lattice Commands
#[tauri::command]
fn set_harmonic_lattice_params(even_drive: f32, odd_drive: f32, tension: f32, output_gain: f32) -> Result<String, String> {
    let mut engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(engine) = engine_guard.as_mut() {
        engine.update_harmonic_lattice(even_drive, odd_drive, tension, output_gain);
        Ok(format!("Harmonic Lattice Updated: E={:.2} O={:.2} T={:.2} G={:.2}", even_drive, odd_drive, tension, output_gain))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}


// Quantum Superposition Engine Commands
#[tauri::command]
fn quantum_create_superposition(state_ids: Vec<String>, weights: Option<Vec<f64>>) -> Result<String, String> {
    println!("🔮 Creating quantum superposition...");
    
    let mut engine_guard = SUPERPOSITION_ENGINE.lock().map_err(|e| format!("Failed to lock superposition engine: {}", e))?;
    
    let weights_slice = weights.as_deref();
    let handle = engine_guard.create_superposition(&state_ids, weights_slice)
        .map_err(|e| format!("Failed to create superposition: {:?}", e))?;
    
    println!("✅ Superposition created: {}", handle.id);
    Ok(format!("Superposition created: {}", handle.id))
}

#[tauri::command]
fn quantum_measure_superposition(handle_id: String, basis: String, policy: String) -> Result<String, String> {
    println!("🔮 Measuring quantum superposition: {}", handle_id);
    
    let mut engine_guard = SUPERPOSITION_ENGINE.lock().map_err(|e| format!("Failed to lock superposition engine: {}", e))?;
    
    // Parse measurement basis
    let measurement_basis = match basis.as_str() {
        "energy" => MeasurementBasis::Energy,
        "phase" => MeasurementBasis::Phase,
        _ => MeasurementBasis::Energy, // Default to energy
    };
    
    // Parse collapse policy
    let collapse_policy = match policy.as_str() {
        "most_coherent" => CollapsePolicy::MostCoherent,
        "max_intent" => CollapsePolicy::MaxIntentAlignment,
        "hybrid" => CollapsePolicy::Hybrid { alpha: 0.7 },
        _ => CollapsePolicy::MostCoherent, // Default to most coherent
    };
    
    // Find the superposition handle
    let superpositions = engine_guard.active_superpositions.lock().unwrap();
    if let Some(handle) = superpositions.get(&handle_id) {
        let handle_clone = handle.clone();
        drop(superpositions); // Release the lock
        
        let result = engine_guard.measure(&handle_clone, measurement_basis, collapse_policy)
            .map_err(|e| format!("Failed to measure superposition: {:?}", e))?;
        
        println!("✅ Superposition measured: {}", result.id);
        Ok(format!("Measurement result: {}", result.id))
    } else {
        Err(format!("Superposition not found: {}", handle_id))
    }
}

#[tauri::command]
fn quantum_dissolve_superposition(handle_id: String) -> Result<String, String> {
    println!("🔮 Dissolving quantum superposition: {}", handle_id);
    
    let mut engine_guard = SUPERPOSITION_ENGINE.lock().map_err(|e| format!("Failed to lock superposition engine: {}", e))?;
    
    // Find and dissolve the superposition
    let superpositions = engine_guard.active_superpositions.lock().unwrap();
    if let Some(handle) = superpositions.get(&handle_id) {
        let handle_clone = handle.clone();
        drop(superpositions); // Release the lock
        
        engine_guard.dissolve(handle_clone)
            .map_err(|e| format!("Failed to dissolve superposition: {:?}", e))?;
        
        println!("✅ Superposition dissolved: {}", handle_id);
        Ok(format!("Superposition dissolved: {}", handle_id))
    } else {
        Err(format!("Superposition not found: {}", handle_id))
    }
}

#[tauri::command]
fn quantum_get_superposition_status() -> Result<serde_json::Value, String> {
    let engine_guard = SUPERPOSITION_ENGINE.lock().map_err(|e| format!("Failed to lock superposition engine: {}", e))?;
    
    let superpositions = engine_guard.active_superpositions.lock().unwrap();
    let active_count = superpositions.len();
    
    let status = serde_json::json!({
        "active_superpositions": active_count,
        "coherence_threshold": engine_guard.coherence_threshold,
        "max_superposition_size": engine_guard.max_superposition_size,
        "superpositions": superpositions.iter().map(|(id, handle)| {
            serde_json::json!({
                "id": id,
                "member_count": handle.members.len(),
                "coherence_cost": handle.coherence_cost,
                "created_at": handle.created_at.elapsed().as_millis()
            })
        }).collect::<Vec<_>>()
    });
    
    Ok(status)
}


// Added: Phase Weave Commands
#[tauri::command]
fn set_phase_weave_params(width: f32, rotation: f32) -> Result<String, String> {
    let mut engine_guard = FLOW_ENGINE.lock().map_err(|e| format!("Failed to lock engine: {}", e))?;

    if let Some(_engine) = engine_guard.as_mut() {
        mixx_core::update_phase_weave_params(width, rotation);
        Ok(format!("Phase Weave Updated: Width={:.2} Rotation={:.2}", width, rotation))
    } else {
        Err("F.L.O.W. Engine not initialized".to_string())
    }
}

// Quantum Automation Commands
#[tauri::command]
fn quantum_auto_set_param(name: String, value: f32) {
    mixx_core::quantum_set_parameter(&name, value);
}

#[tauri::command]
fn quantum_auto_undo(name: String) -> Option<f32> {
    mixx_core::quantum_undo_parameter(&name)
}

#[tauri::command]
fn quantum_auto_predict() {
    mixx_core::quantum_predict();
}

#[tauri::command]
fn quantum_auto_get_param(name: String) -> Option<f32> {
    mixx_core::quantum_get_parameter(&name)
}

// Plugin Chain Commands
#[tauri::command]
fn plugin_set_enabled(slot_name: String, enabled: bool) {
    mixx_core::plugin_chain_set_enabled(&slot_name, enabled);
}

#[tauri::command]
fn plugin_set_bypass(slot_name: String, bypass: bool) {
    mixx_core::plugin_chain_set_bypass(&slot_name, bypass);
}

#[tauri::command]
fn plugin_chain_get_status() -> (usize, u64) {
    mixx_core::plugin_chain_status()
}

// Neural Inference Commands
#[tauri::command]
fn neural_infer_genre_cmd() -> (String, f32) {
    mixx_core::neural_infer_genre()
}

#[tauri::command]
fn neural_infer_pattern_cmd() -> (f32, f32, String) {
    mixx_core::neural_infer_pattern()
}

#[tauri::command]
fn neural_suggest_params() -> Vec<(String, f32, f32)> {
    mixx_core::neural_suggest_parameters()
}

#[tauri::command]
fn neural_get_stats() -> (u64, usize) {
    mixx_core::neural_stats()
}

// Transport Commands
#[tauri::command]
fn transport_play_cmd() {
    mixx_core::transport_play();
}

#[tauri::command]
fn transport_pause_cmd() {
    mixx_core::transport_pause();
}

#[tauri::command]
fn transport_stop_cmd() {
    mixx_core::transport_stop();
}

#[tauri::command]
fn transport_seek_cmd(sample: u64) {
    mixx_core::transport_seek(sample);
}

#[tauri::command]
fn transport_get_state() -> (bool, u64, u32, u8, f32) {
    mixx_core::transport_state()
}

// Audio Device Management Commands
#[tauri::command]
fn audio_list_inputs_cmd() -> Vec<(String, String, bool)> {
    mixx_core::audio_list_inputs()
}

#[tauri::command]
fn audio_list_outputs_cmd() -> Vec<(String, String, bool)> {
    mixx_core::audio_list_outputs()
}

#[tauri::command]
fn audio_select_input_cmd(device_id: String) -> bool {
    mixx_core::audio_select_input(&device_id)
}

#[tauri::command]
fn audio_select_output_cmd(device_id: String) -> bool {
    mixx_core::audio_select_output(&device_id)
}

// MIDI Commands
#[tauri::command]
fn midi_play_cmd() {
    mixx_core::midi_play();
}

#[tauri::command]
fn midi_stop_cmd() {
    mixx_core::midi_stop();
}

#[tauri::command]
fn midi_record_cmd() {
    mixx_core::midi_record();
}

#[tauri::command]
fn midi_get_state() -> (bool, bool, u64) {
    mixx_core::midi_state()
}

#[tauri::command]
fn midi_send_note(channel: u8, note: u8, velocity: u8, note_on: bool) {
    if note_on {
        mixx_core::midi_note_on(channel, note, velocity);
    } else {
        mixx_core::midi_note_off(channel, note);
    }
}

// Clip Manager Commands
#[tauri::command]
fn clip_create_midi_cmd(name: String, length_samples: u64) -> u64 {
    mixx_core::clip_create_midi(&name, length_samples)
}

#[tauri::command]
fn clip_create_region_cmd(clip_id: u64, start_time: u64, track_index: usize) -> u64 {
    mixx_core::clip_create_region(clip_id, start_time, track_index)
}

#[tauri::command]
fn clip_delete_region_cmd(region_id: u64) {
    mixx_core::clip_delete_region(region_id);
}

#[tauri::command]
fn clip_analyze_pitch_cmd(clip_id: u64) -> Vec<(f32, f32, f32)> {
    mixx_core::analyze_clip_pitch(clip_id)
}

#[tauri::command]
fn clip_apply_spectral_edit_cmd(
    clip_id: u64,
    start_sample: usize,
    num_samples: usize,
    pitch_shift: f32,
    time_stretch: f32,
) -> Result<(), String> {
    mixx_core::apply_spectral_edit(clip_id, start_sample, num_samples, pitch_shift, time_stretch)
}

#[tauri::command]
fn clip_get_stats() -> (usize, usize) {
    mixx_core::clip_stats()
}

// Mixer Commands
#[tauri::command]
fn mixer_add_audio_track_cmd(name: String) -> u64 {
    mixx_core::mixer_add_audio_track(&name)
}

#[tauri::command]
fn mixer_add_midi_track_cmd(name: String) -> u64 {
    mixx_core::mixer_add_midi_track(&name)
}

#[tauri::command]
fn mixer_set_volume_cmd(track_id: u64, volume: f32) {
    mixx_core::mixer_set_volume(track_id, volume);
}

#[tauri::command]
fn mixer_toggle_mute_cmd(track_id: u64) -> bool {
    mixx_core::mixer_toggle_mute(track_id)
}

#[tauri::command]
fn mixer_toggle_solo_cmd(track_id: u64) -> bool {
    mixx_core::mixer_toggle_solo(track_id)
}

#[tauri::command]
fn mixer_get_stats() -> (usize, usize, usize) {
    mixx_core::mixer_stats()
}

// History Commands
#[tauri::command]
fn history_undo_cmd() -> Option<String> {
    mixx_core::history_undo()
}

#[tauri::command]
fn history_redo_cmd() -> Option<String> {
    mixx_core::history_redo()
}

#[tauri::command]
fn history_can_undo_redo() -> (bool, bool) {
    (mixx_core::history_can_undo(), mixx_core::history_can_redo())
}

#[tauri::command]
fn history_get_descriptions() -> (Option<String>, Option<String>) {
    mixx_core::history_descriptions()
}

#[tauri::command]
fn history_get_stats() -> (usize, usize, u64) {
    mixx_core::history_stats()
}

// Session Commands
#[tauri::command]
fn session_new_project_cmd(name: String) {
    mixx_core::session_new_project(&name);
}

#[tauri::command]
fn session_get_project_name() -> String {
    mixx_core::session_project_name()
}

#[tauri::command]
fn session_set_tempo_cmd(tempo: f32) {
    mixx_core::session_set_tempo(tempo);
}

#[tauri::command]
fn session_save_cmd() -> Result<String, String> {
    mixx_core::session_save()
}

#[tauri::command]
fn session_load_cmd(json: String) -> Result<(), String> {
    mixx_core::session_load(&json)
}

#[tauri::command]
fn session_get_stats() -> (usize, usize, bool, u64) {
    mixx_core::session_stats()
}

// Tempo Map Commands
#[tauri::command]
fn tempo_add_cmd(position: u64, bpm: f32) {
    mixx_core::tempo_add(position, bpm);
}

#[tauri::command]
fn tempo_at_cmd(position: u64) -> f32 {
    mixx_core::tempo_at(position)
}

#[tauri::command]
fn tempo_add_marker_cmd(position: u64, name: String) -> u64 {
    mixx_core::tempo_add_marker(position, &name)
}

#[tauri::command]
fn tempo_snap_cmd(position: u64, grid_division: u8) -> u64 {
    mixx_core::tempo_snap_to_grid(position, grid_division)
}

#[tauri::command]
fn tempo_get_stats() -> (usize, usize, usize) {
    mixx_core::tempo_stats()
}

// Effects info command (effects use plugin chain system)
#[tauri::command]
fn effects_info() -> Vec<String> {
    vec![
        "ParametricEQ - 4-band EQ with biquad filters".to_string(),
        "Compressor - Dynamics processor with attack/release".to_string(),
        "Delay - Stereo delay with feedback".to_string(),
        "Reverb - Algorithmic Freeverb-style reverb".to_string(),
    ]
}

// ============================================================================
fn main() {
    // Initialize logger for MixxEngine debug output
    // Set RUST_LOG=mixx_core=info to see engine logs, or RUST_LOG=debug for verbose
    env_logger::Builder::from_default_env()
        .filter_level(log::LevelFilter::Info)
        .filter_module("mixx_core", log::LevelFilter::Info)
        .init();
    
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                    let _ = window.show();
                }
            }
            
            // Start Analysis Engine Loop
            analysis_engine::start_analysis_loop(app.handle().clone());
            
            // Start Loudness Metering Loop (Phase 24)
            analysis_engine::start_metering_loop(app.handle().clone());
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            // F.L.O.W. Engine Commands
            initialize_flow_engine,
            get_flow_status,
            flow_play,
            flow_pause,
            flow_stop,
            flow_set_bpm,
            flow_set_space_pad,
            flow_arm_recording,
            flow_arm_recording,
            set_velvet_curve_params,
            set_harmonic_lattice_params, // Added
            set_phase_weave_params, // Added
            // Quantum Superposition Engine Commands
            quantum_create_superposition,
            quantum_measure_superposition,
            quantum_dissolve_superposition,
            quantum_get_superposition_status,
            // Git Operations
            git::git_status,
            git::git_pull,
            git::git_fetch,
            // Quantum Automation Commands
            quantum_auto_set_param,
            quantum_auto_undo,
            quantum_auto_predict,
            quantum_auto_get_param,
            // Plugin Chain Commands
            plugin_set_enabled,
            plugin_set_bypass,
            plugin_chain_get_status,
            // Neural Inference Commands
            neural_infer_genre_cmd,
            neural_infer_pattern_cmd,
            neural_suggest_params,
            neural_get_stats,
            // Transport Commands
            transport_play_cmd,
            transport_pause_cmd,
            transport_stop_cmd,
            transport_seek_cmd,
            transport_get_state,
            // Audio Device Management Commands
            audio_list_inputs_cmd,
            audio_list_outputs_cmd,
            audio_select_input_cmd,
            audio_select_output_cmd,
            // MIDI Commands
            midi_play_cmd,
            midi_stop_cmd,
            midi_record_cmd,
            midi_get_state,
            midi_send_note,
            // Clip Manager Commands
            clip_create_midi_cmd,
            clip_create_region_cmd,
            clip_delete_region_cmd,
            clip_analyze_pitch_cmd,
            clip_apply_spectral_edit_cmd,
            clip_get_stats,
            // Mixer Commands
            mixer_add_audio_track_cmd,
            mixer_add_midi_track_cmd,
            mixer_set_volume_cmd,
            mixer_toggle_mute_cmd,
            mixer_toggle_solo_cmd,
            mixer_get_stats,
            // History Commands
            history_undo_cmd,
            history_redo_cmd,
            history_can_undo_redo,
            history_get_descriptions,
            history_get_stats,
            // Session Commands
            session_new_project_cmd,
            session_get_project_name,
            session_set_tempo_cmd,
            session_save_cmd,
            session_load_cmd,
            session_get_stats,
            // Tempo Map Commands
            tempo_add_cmd,
            tempo_at_cmd,
            tempo_add_marker_cmd,
            tempo_snap_cmd,
            tempo_get_stats,
            // Effects Commands (use plugin chain API)
            effects_info,
            // Phase 24: Master Chain Commands
            master_chain_create,
            master_chain_set_profile,
            master_chain_get_meters,
            master_chain_set_parameter,
            // Phase 24: Audio Export Commands
            audio_export_wav,
            audio_export_formats,
            // Phase 24: Plugin Info
            mixx_plugins_info,
            plugin_set_enabled,
            plugin_set_bypass,
            // Phase 33: Stem Separation Commands
            stem_check_demucs,
            stem_separate_with_demucs,
            stem_get_models,
            // Phase 37: Local LLM Commands
            llm_check_ollama,
            llm_complete,
            llm_list_models,
            llm_pull_model,
            llm_aura_mixing_suggestion
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
