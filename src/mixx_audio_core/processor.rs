/// A trait for audio processors in the DSP chain.
/// This allows for a flexible, dynamic graph of audio effects.
pub trait AudioProcessor: Send + Sync {
    /// Process a block of interleaved audio.
    /// data: Interleaved audio samples (L, R, L, R, ...)
    /// channels: Number of channels (typically 2 for stereo)
    fn process(&mut self, data: &mut [f32], channels: usize);
    
    /// Get the name of the processor
    fn name(&self) -> &str;

    /// Set a parameter by name
    fn set_parameter(&mut self, _name: &str, _value: f32) {
        // Default implementation does nothing
    }
}
