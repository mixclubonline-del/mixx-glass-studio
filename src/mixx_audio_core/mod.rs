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

pub mod resampler;
pub mod dsp_math;
pub mod audio_format;
// pub mod audio_io;  // Future: will replace cpal
// pub mod simd_utils;  // Future: will replace wide

pub use resampler::{MixxResampler, ResampleQuality, ResampleError};
pub use dsp_math::*;
pub use audio_format::{MixxAudioFormat, AudioFile, AudioMetadata, FormatError};

