pub mod superposition;

use superposition::SuperpositionEngine;
use std::sync::{Arc, Mutex};
use once_cell::sync::Lazy;

// Global Superposition Engine instance
static SUPERPOSITION_ENGINE: Lazy<Arc<Mutex<SuperpositionEngine>>> = Lazy::new(|| {
    Arc::new(Mutex::new(SuperpositionEngine::new()))
});

// Re-export specific types instead of wildcard
pub use superposition::{SuperpositionHandle, MeasurementBasis, CollapsePolicy, QuantumState, QuantumAudioBuffer, QuantumSample, MemberRef, MeasurementEvent, QuantumError};