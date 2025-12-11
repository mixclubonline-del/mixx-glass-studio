/**
 * MixxAudioCore Usage Examples
 * 
 * Demonstrates how to use the proprietary audio engine modules.
 * 
 * Run examples with:
 * cargo run --example mixx_audio_core_examples
 */

use crate::mixx_audio_core::*;

/// Example: Resampling audio
pub fn example_resampling() {
    println!("=== Resampling Example ===");
    
    // Create test signal (440Hz sine wave at 44.1kHz)
    let input_rate = 44100;
    let output_rate = 48000;
    let duration_samples = 4410; // 0.1 seconds
    
    let input: Vec<f32> = (0..duration_samples)
        .map(|i| (2.0 * std::f32::consts::PI * 440.0 * i as f32 / input_rate as f32).sin())
        .collect();
    
    // Create resampler
    let mut resampler = MixxResampler::new(
        input_rate,
        output_rate,
        ResampleQuality::High,
    ).expect("Failed to create resampler");
    
    // Resample
    let expected_output_len = ((input.len() as f64) * resampler.ratio()).ceil() as usize;
    let mut output = vec![0.0f32; expected_output_len];
    
    let output_len = resampler.resample(&input, &mut output)
        .expect("Resampling failed");
    
    println!("Input: {} samples at {}Hz", input.len(), input_rate);
    println!("Output: {} samples at {}Hz", output_len, output_rate);
    println!("Ratio: {:.4}", resampler.ratio());
}

/// Example: DSP Math operations
pub fn example_dsp_math() {
    println!("\n=== DSP Math Example ===");
    
    // Create test signal
    let samples: Vec<f32> = (0..1000)
        .map(|i| (2.0 * std::f32::consts::PI * 440.0 * i as f32 / 44100.0).sin())
        .collect();
    
    // Vector operations
    let rms = dsp_math::vector::rms(&samples);
    let peak = dsp_math::vector::peak(&samples);
    
    println!("RMS: {:.4}", rms);
    println!("Peak: {:.4}", peak);
    
    // FFT
    let freq_domain = dsp_math::fft::fft(&samples);
    println!("FFT: {} frequency bins", freq_domain.len());
    
    // Five Pillars processing
    let velvet = dsp_math::five_pillars::velvet_curve_process(&samples, 0.5, 0.3);
    println!("Velvet Curve: {} samples processed", velvet.len());
}

/// Example: Audio file I/O
pub fn example_audio_format() {
    println!("\n=== Audio Format Example ===");
    
    // Create test audio data
    let sample_rate = 44100;
    let channels = 2;
    let samples_per_channel = 4410; // 0.1 seconds
    
    let mut samples = vec![];
    for ch in 0..channels {
        let channel_samples: Vec<f32> = (0..samples_per_channel)
            .map(|i| {
                let freq = 440.0 + (ch as f32 * 110.0); // Different frequency per channel
                (2.0 * std::f32::consts::PI * freq * i as f32 / sample_rate as f32).sin()
            })
            .collect();
        samples.push(channel_samples);
    }
    
    // Write WAV file
    let test_file = "/tmp/mixx_test.wav";
    MixxAudioFormat::write_wav(test_file, &samples, sample_rate, 32)
        .expect("Failed to write WAV file");
    
    println!("Wrote WAV file: {}", test_file);
    println!("Channels: {}, Sample Rate: {}Hz", channels, sample_rate);
    
    // Read WAV file back
    let audio_file = MixxAudioFormat::read_wav(test_file)
        .expect("Failed to read WAV file");
    
    println!("Read WAV file:");
    println!("  Sample Rate: {}Hz", audio_file.metadata.sample_rate);
    println!("  Channels: {}", audio_file.metadata.channels);
    println!("  Duration: {:.2}s", audio_file.metadata.duration_seconds);
    println!("  Bits per Sample: {}", audio_file.metadata.bits_per_sample);
}

/// Run all examples
pub fn run_all_examples() {
    example_resampling();
    example_dsp_math();
    example_audio_format();
    println!("\n=== All Examples Complete ===");
}



