/**
 * MixxAudioCore - Proprietary Audio Engine
 * 
 * Replaces third-party Rust audio libraries with custom implementations
 * optimized for Five Pillars Doctrine and DAW workflows.
 * 
 * Architecture:
 * - MixxResampler: High-quality sample rate conversion
 * - MixxDSPMath: Audio-optimized DSP math library
 * - MixxAudioFormat: Audio file format handling
 * - MixxAudioIO: Cross-platform audio I/O (future)
 * - MixxSIMD: SIMD utilities (future)
 */

pub mod audio_format;
pub mod audio_io;
pub mod clip_region;
pub mod dsp_math;
pub mod mixx_plugins;
pub mod harmonic_lattice;
pub mod history;
pub mod midi_engine;
pub mod neural_bridge;
pub mod phase_weave;
pub mod plugin_chain;
pub mod processor;
pub mod quantum_automation;
pub mod quantum_transport;
pub mod resampler;
pub mod session;
pub mod tempo_map;
pub mod track_mixer;
pub mod velvet_curve;
pub mod simd_utils;
pub mod master_chain;
pub mod audio_export;

pub use audio_format::{AudioFile, AudioMetadata, FormatError, MixxAudioFormat};
pub use dsp_math::Complex;
