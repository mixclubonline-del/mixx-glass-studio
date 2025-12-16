// Stem Separation Commands for Tauri
// Phase 33: Local Demucs Integration
//
// This module provides Tauri commands to invoke Demucs for AI-powered stem separation.
// Falls back to reporting an error if Demucs is not installed.

use std::path::PathBuf;
use std::process::Command;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct StemSeparationResult {
    pub success: bool,
    pub stems: Vec<String>,  // Paths to separated stem files
    pub model: String,
    pub processing_time_ms: u64,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StemSeparationRequest {
    pub input_path: String,
    pub output_dir: String,
    pub model: Option<String>,  // htdemucs, htdemucs_6s, mdx_extra
    pub two_stems: Option<String>,  // "vocals" for vocals/accompaniment split
}

/// Find Demucs executable path
fn find_demucs_path() -> Option<String> {
    let home = std::env::var("HOME").unwrap_or_default();
    let paths = vec![
        "demucs".to_string(),
        format!("{}/Library/Python/3.9/bin/demucs", home),
        format!("{}/Library/Python/3.10/bin/demucs", home),
        format!("{}/Library/Python/3.11/bin/demucs", home),
        format!("{}/Library/Python/3.12/bin/demucs", home),
        format!("{}/.local/bin/demucs", home),
        "/usr/local/bin/demucs".to_string(),
        "/opt/homebrew/bin/demucs".to_string(),
    ];
    
    for path in paths {
        if Command::new(&path).arg("--help").output().map(|o| o.status.success()).unwrap_or(false) {
            return Some(path);
        }
    }
    None
}

/// Check if Demucs is available in the system
#[tauri::command]
pub fn stem_check_demucs() -> Result<serde_json::Value, String> {
    // Check common paths for demucs
    if let Some(path) = find_demucs_path() {
        return Ok(serde_json::json!({
            "available": true,
            "path": path,
            "models": ["htdemucs", "htdemucs_6s", "mdx_extra", "mdx_extra_q"]
        }));
    }
    
    // Try python -m demucs
    let result2 = Command::new("python3")
        .args(["-m", "demucs", "--help"])
        .output();
    
    match result2 {
        Ok(output) if output.status.success() => {
            Ok(serde_json::json!({
                "available": true,
                "method": "python_module",
                "models": ["htdemucs", "htdemucs_6s", "mdx_extra", "mdx_extra_q"]
            }))
        }
        _ => {
            Ok(serde_json::json!({
                "available": false,
                "error": "Demucs not found",
                "install_hint": "pip install demucs",
                "fallback": "dsp"
            }))
        }
    }
}

/// Run Demucs stem separation on an audio file
#[tauri::command]
pub async fn stem_separate_with_demucs(
    input_path: String,
    output_dir: String,
    model: Option<String>,
    two_stems: Option<String>,
) -> Result<StemSeparationResult, String> {
    use std::time::Instant;
    
    let start = Instant::now();
    let model_name = model.unwrap_or_else(|| "htdemucs".to_string());
    
    // Build command arguments
    let mut args = vec![
        "-n".to_string(),
        model_name.clone(),
        "-o".to_string(),
        output_dir.clone(),
    ];
    
    // Add two-stems option if specified
    if let Some(stem) = &two_stems {
        args.push("--two-stems".to_string());
        args.push(stem.clone());
    }
    
    args.push(input_path.clone());
    
    // Find demucs path
    let output = if let Some(demucs_path) = find_demucs_path() {
        Command::new(&demucs_path)
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to run Demucs: {}", e))?
    } else {
        // Fallback to python -m demucs
        let mut py_args = vec!["-m".to_string(), "demucs".to_string()];
        py_args.extend(args.clone());
        
        Command::new("python3")
            .args(&py_args)
            .output()
            .map_err(|e| format!("Failed to run Demucs: {}", e))?
    };
    
    let processing_time_ms = start.elapsed().as_millis() as u64;
    
    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Ok(StemSeparationResult {
            success: false,
            stems: vec![],
            model: model_name,
            processing_time_ms,
            error: Some(format!("Demucs error: {}", stderr)),
        });
    }
    
    // Find the separated stems in the output directory
    // Demucs outputs to: output_dir/model_name/track_name/stem.wav
    let input_path_buf = PathBuf::from(&input_path);
    let track_name = input_path_buf
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("track");
    
    let stems_dir = PathBuf::from(&output_dir)
        .join(&model_name)
        .join(track_name);
    
    let mut stem_paths = vec![];
    
    // Standard htdemucs stems
    let expected_stems = if two_stems.is_some() {
        vec!["vocals.wav", "no_vocals.wav"]
    } else if model_name.contains("6s") {
        vec!["vocals.wav", "drums.wav", "bass.wav", "guitar.wav", "piano.wav", "other.wav"]
    } else {
        vec!["vocals.wav", "drums.wav", "bass.wav", "other.wav"]
    };
    
    for stem_name in expected_stems {
        let stem_path = stems_dir.join(stem_name);
        if stem_path.exists() {
            stem_paths.push(stem_path.to_string_lossy().to_string());
        }
    }
    
    Ok(StemSeparationResult {
        success: true,
        stems: stem_paths,
        model: model_name,
        processing_time_ms,
        error: None,
    })
}

/// Get available stem separation models
#[tauri::command]
pub fn stem_get_models() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({
            "id": "htdemucs",
            "name": "HT Demucs",
            "stems": 4,
            "stem_names": ["vocals", "drums", "bass", "other"],
            "quality": "high",
            "speed": "medium"
        }),
        serde_json::json!({
            "id": "htdemucs_6s",
            "name": "HT Demucs 6-Stem",
            "stems": 6,
            "stem_names": ["vocals", "drums", "bass", "guitar", "piano", "other"],
            "quality": "high",
            "speed": "slow"
        }),
        serde_json::json!({
            "id": "mdx_extra",
            "name": "MDX Extra",
            "stems": 4,
            "stem_names": ["vocals", "drums", "bass", "other"],
            "quality": "best",
            "speed": "slow"
        }),
        serde_json::json!({
            "id": "mdx_extra_q",
            "name": "MDX Extra (Quantized)",
            "stems": 4,
            "stem_names": ["vocals", "drums", "bass", "other"],
            "quality": "good",
            "speed": "fast"
        }),
    ]
}
