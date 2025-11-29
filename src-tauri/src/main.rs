// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod flow_engine;
mod quantum;
mod git;

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
            // Quantum Superposition Engine Commands
            quantum_create_superposition,
            quantum_measure_superposition,
            quantum_dissolve_superposition,
            quantum_get_superposition_status,
            // Git Operations
            git::git_status,
            git::git_pull,
            git::git_fetch
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
