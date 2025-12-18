mod engine;
mod ffi;
mod mixx_audio_core;

pub use engine::{
    current_stats, init_engine, pop_analysis_samples, pop_metric, shutdown_engine, start_engine,
    stop_engine, update_velvet_curve_params, update_harmonic_lattice_params,
    update_phase_weave_params, analyze_clip_pitch,
    quantum_set_parameter, quantum_undo_parameter, quantum_predict, quantum_get_parameter,
    plugin_chain_set_enabled, plugin_chain_set_bypass, plugin_chain_status,
    neural_analyze, neural_infer_genre, neural_infer_pattern, neural_suggest_parameters, neural_stats,
    transport_play, transport_pause, transport_stop, transport_seek, transport_state,
    transport_set_bpm, transport_set_loop, transport_loop_region,
    audio_list_inputs, audio_list_outputs, audio_select_input, audio_select_output, audio_get_stats,
    midi_play, midi_stop, midi_record, midi_state, midi_note_on, midi_note_off,
    clip_create_audio, clip_create_midi, clip_create_region, clip_delete_region, clip_stats,
    mixer_add_audio_track, mixer_add_midi_track, mixer_set_volume, mixer_set_pan,
    mixer_toggle_mute, mixer_toggle_solo, mixer_stats,
    history_undo, history_redo, history_can_undo, history_can_redo,
    history_descriptions, history_stats, history_clear,
    session_new_project, session_project_name, session_set_tempo, session_tempo,
    session_save, session_load, session_is_dirty, session_stats,
    tempo_add, tempo_at, tempo_add_marker, tempo_remove_marker,
    tempo_position_to_bar_beat, tempo_snap_to_grid, tempo_stats,
    // Phase 26: Master Chain
    master_chain_set_profile, master_chain_get_meters, master_chain_set_param, master_chain_set_enabled,
    master_chain_process_samples,

    EngineConfig, EngineError, EngineMetric, EngineStats,
};
pub use ffi::{
    mixx_engine_get_stats, mixx_engine_init, mixx_engine_last_error, mixx_engine_pop_metric,
    mixx_engine_shutdown, mixx_engine_start, mixx_engine_stop, MixxEngineConfig, MixxEngineMetric,
    MixxEngineStats,
};

// Export MixxAudioCore modules
pub use mixx_audio_core::*;

pub fn apply_spectral_edit(
    clip_id: u64,
    start_sample: usize,
    num_samples: usize,
    pitch_shift: f32,
    time_stretch: f32,
) -> Result<(), String> {
    engine::apply_spectral_edit(clip_id, start_sample, num_samples, pitch_shift, time_stretch)
}


