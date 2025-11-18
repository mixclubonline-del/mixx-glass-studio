/**
 * Native Audio Stream Processor - AudioWorklet
 * 
 * Streams audio from Flow's master chain to the native Rust engine.
 * Runs in the audio thread for low-latency processing.
 */

class NativeAudioStreamProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 128; // Process in small chunks
    this.buffer = new Float32Array(this.bufferSize * 2); // Stereo
    this.bufferIndex = 0;
    this.active = true;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0 || !this.active) {
      return true; // Keep processor alive
    }

    const inputChannel0 = input[0] || new Float32Array(128);
    const inputChannel1 = input[1] || inputChannel0; // Mono fallback

    // Interleave stereo samples
    for (let i = 0; i < inputChannel0.length; i++) {
      this.buffer[this.bufferIndex * 2] = inputChannel0[i];
      this.buffer[this.bufferIndex * 2 + 1] = inputChannel1[i];
      this.bufferIndex++;

      // When buffer is full, send to main thread
      if (this.bufferIndex >= this.bufferSize) {
        // Send to main thread (can't call Tauri directly from worklet)
        // Main thread will forward to native engine
        this.port.postMessage({
          type: 'audio_data',
          samples: Array.from(this.buffer), // Convert to regular array for serialization
        });
        this.bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('native-audio-stream-processor', NativeAudioStreamProcessor);

