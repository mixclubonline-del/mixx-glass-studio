use tauri::command;
use mixx_core::{
    master_chain_set_profile as core_set_profile,
    master_chain_get_meters as core_get_meters,
    master_chain_set_param as core_set_param,
    audio_export::{AudioExporter, ExportConfig, ExportFormat},
    mixx_plugins::{Dither, DitherType},
};
use serde_json;

// ============================================================================
// Master Chain Commands
// ============================================================================

#[command]
pub fn master_chain_create(_sample_rate: f32, _profile: u32) -> Result<String, String> {
    // MasterChain is created as part of mixx_init_engine
    // This command just confirms it exists
    Ok("Master chain ready (managed by engine)".to_string())
}

#[command]
pub fn master_chain_set_profile(profile: u32) -> Result<String, String> {
    core_set_profile(profile);
    let profile_name = match profile {
        0 => "Streaming",
        1 => "Club",
        2 => "Broadcast",
        3 => "Vinyl",
        4 => "Audiophile",
        _ => "Unknown",
    };
    Ok(format!("Profile set to {}", profile_name))
}

#[command]
pub fn master_chain_get_meters() -> serde_json::Value {
    let (integrated, short_term, peak_l, peak_r) = core_get_meters();
    serde_json::json!({
        "momentary_lufs": short_term,
        "short_term_lufs": short_term,
        "integrated_lufs": integrated,
        "true_peak_db": peak_l.max(peak_r),
        "profile": "Active"
    })
}

#[command]
pub fn master_chain_set_parameter(name: String, value: f32) -> Result<String, String> {
    core_set_param(&name, value);
    Ok(format!("Parameter {} set to {}", name, value))
}

// ============================================================================
// Audio Export Commands
// ============================================================================

#[command]
pub async fn audio_export_wav(
    path: String,
    sample_rate: u32,
    channels: u16,
    bit_depth: u8,
    samples: Vec<f32>,
) -> Result<String, String> {
    let format = match bit_depth {
        16 => ExportFormat::Wav16,
        24 => ExportFormat::Wav24,
        32 => ExportFormat::Wav32Float,
        _ => return Err(format!("Unsupported bit depth: {}", bit_depth)),
    };

    // Apply TPDF dithering for non-float exports
    let processed_samples = if bit_depth < 32 {
        let mut dither = Dither::new();
        dither.bit_depth = bit_depth as u32;
        dither.dither_type = DitherType::Triangular;
        dither.noise_shaping = bit_depth == 16;

        let mut output = samples.clone();
        for chunk in output.chunks_mut(2) {
            if chunk.len() == 2 {
                let (l, r) = dither.process_stereo(chunk[0], chunk[1]);
                chunk[0] = l;
                chunk[1] = r;
            }
        }
        output
    } else {
        samples
    };

    let config = ExportConfig {
        format,
        sample_rate,
        channels,
        dither: false,
        normalize: false,
        normalize_target_lufs: -14.0,
    };

    AudioExporter::export(&path, &processed_samples, &config, None)
        .map_err(|e| format!("Export failed: {}", e))?;

    Ok(format!("Exported to {}", path))
}

#[command]
pub fn audio_export_formats() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({"id": "wav16", "name": "WAV 16-bit", "extension": "wav"}),
        serde_json::json!({"id": "wav24", "name": "WAV 24-bit", "extension": "wav"}),
        serde_json::json!({"id": "wav32", "name": "WAV 32-bit float", "extension": "wav"}),
        serde_json::json!({"id": "flac16", "name": "FLAC 16-bit", "extension": "flac"}),
        serde_json::json!({"id": "flac24", "name": "FLAC 24-bit", "extension": "flac"}),
    ]
}

// ============================================================================
// Plugin Info Commands
// ============================================================================

#[command]
pub fn mixx_plugins_info() -> Vec<serde_json::Value> {
    vec![
        serde_json::json!({"name": "MixxVerb", "type": "Reverb", "params": ["mix", "time", "preDelay"]}),
        serde_json::json!({"name": "MixxDelay", "type": "Delay", "params": ["time", "feedback", "mix", "tone"]}),
        serde_json::json!({"name": "MixxGlue", "type": "Compressor", "params": ["threshold", "ratio", "release", "mix"]}),
        serde_json::json!({"name": "MixxDrive", "type": "Saturator", "params": ["drive", "warmth", "mix", "color"]}),
        serde_json::json!({"name": "MixxLimiter", "type": "Limiter", "params": ["ceiling", "drive", "lookahead"]}),
        serde_json::json!({"name": "VelvetCurve", "type": "Sonic Sculpting", "params": ["warmth", "silkEdge", "emotion", "power"]}),
        serde_json::json!({"name": "HarmonicLattice", "type": "Harmonics", "params": ["evenDrive", "oddDrive", "tension"]}),
        serde_json::json!({"name": "PhaseWeave", "type": "Stereo", "params": ["width", "rotation"]}),
        serde_json::json!({"name": "Dither", "type": "Dither", "params": ["bit_depth", "dither_type", "noise_shaping"]}),
    ]
}
