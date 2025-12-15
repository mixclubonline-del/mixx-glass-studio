use std::sync::atomic::{AtomicU64, AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use crossbeam_queue::ArrayQueue;
use super::processor::AudioProcessor;

/// Lock-Free Plugin Processing System
/// 
/// Enables parallel plugin execution via ring buffer chains.
/// Each plugin slot has its own input/output buffers for wait-free operation.

/// Plugin Slot - Wraps an AudioProcessor with ring buffers for lock-free I/O
pub struct PluginSlot {
    pub name: String,
    pub processor: Arc<Mutex<dyn AudioProcessor>>,
    pub enabled: AtomicBool,
    pub bypass: AtomicBool,
    
    // Ring buffers for parallel processing
    input_buffer: Arc<ArrayQueue<f32>>,
    output_buffer: Arc<ArrayQueue<f32>>,
    
    // Processing state
    samples_processed: AtomicU64,
    _buffer_size: usize,
}

impl PluginSlot {
    pub fn new(name: &str, processor: Arc<Mutex<dyn AudioProcessor>>, buffer_size: usize) -> Self {
        Self {
            name: name.to_string(),
            processor,
            enabled: AtomicBool::new(true),
            bypass: AtomicBool::new(false),
            input_buffer: Arc::new(ArrayQueue::new(buffer_size)),
            output_buffer: Arc::new(ArrayQueue::new(buffer_size)),
            samples_processed: AtomicU64::new(0),
            _buffer_size: buffer_size,
        }
    }
    
    /// Push samples to input buffer (producer side)
    pub fn push_input(&self, samples: &[f32]) -> usize {
        let mut pushed = 0;
        for &sample in samples {
            if self.input_buffer.push(sample).is_ok() {
                pushed += 1;
            } else {
                break; // Buffer full
            }
        }
        pushed
    }
    
    /// Pop samples from output buffer (consumer side)
    pub fn pop_output(&self, max: usize) -> Vec<f32> {
        let mut samples = Vec::with_capacity(max);
        for _ in 0..max {
            if let Some(sample) = self.output_buffer.pop() {
                samples.push(sample);
            } else {
                break;
            }
        }
        samples
    }
    
    /// Process available input samples
    pub fn process(&self, channels: usize) {
        if !self.enabled.load(Ordering::Relaxed) {
            return;
        }
        
        // Collect available input
        let available = self.input_buffer.len();
        if available == 0 {
            return;
        }
        
        let mut samples: Vec<f32> = Vec::with_capacity(available);
        for _ in 0..available {
            if let Some(s) = self.input_buffer.pop() {
                samples.push(s);
            }
        }
        
        // Process (or bypass)
        if !self.bypass.load(Ordering::Relaxed) {
            if let Ok(mut proc) = self.processor.try_lock() {
                proc.process(&mut samples, channels);
            }
        }
        
        // Push to output
        for sample in samples {
            let _ = self.output_buffer.push(sample);
        }
        
        self.samples_processed.fetch_add(available as u64, Ordering::Relaxed);
    }
    
    pub fn samples_processed(&self) -> u64 {
        self.samples_processed.load(Ordering::Relaxed)
    }
    
    pub fn set_enabled(&self, enabled: bool) {
        self.enabled.store(enabled, Ordering::Relaxed);
    }
    
    pub fn set_bypass(&self, bypass: bool) {
        self.bypass.store(bypass, Ordering::Relaxed);
    }
}

unsafe impl Send for PluginSlot {}
unsafe impl Sync for PluginSlot {}

/// Parallel Plugin Chain - Manages multiple plugin slots
pub struct ParallelPluginChain {
    slots: Vec<Arc<PluginSlot>>,
    _staging_buffer: Vec<f32>,
    channels: usize,
}

impl ParallelPluginChain {
    pub fn new(channels: usize) -> Self {
        Self {
            slots: Vec::new(),
            _staging_buffer: Vec::with_capacity(4096),
            channels,
        }
    }
    
    /// Add a plugin to the chain
    pub fn add_plugin(&mut self, name: &str, processor: Arc<Mutex<dyn AudioProcessor>>, buffer_size: usize) {
        let slot = Arc::new(PluginSlot::new(name, processor, buffer_size));
        self.slots.push(slot);
    }
    
    /// Get plugin slot by index
    pub fn get_slot(&self, index: usize) -> Option<Arc<PluginSlot>> {
        self.slots.get(index).cloned()
    }
    
    /// Get plugin slot by name
    pub fn get_slot_by_name(&self, name: &str) -> Option<Arc<PluginSlot>> {
        self.slots.iter().find(|s| s.name == name).cloned()
    }
    
    /// Process audio through the entire chain (serial for now, parallel future)
    pub fn process(&mut self, data: &mut [f32]) {
        // Stage 1: Feed input to first slot
        if let Some(first_slot) = self.slots.first() {
            first_slot.push_input(data);
            first_slot.process(self.channels);
        }
        
        // Stage 2+: Chain through remaining slots
        for i in 1..self.slots.len() {
            // Get output from previous slot
            let prev_output = {
                let prev_slot = &self.slots[i - 1];
                prev_slot.pop_output(data.len())
            };
            
            // Feed to current slot
            let current_slot = &self.slots[i];
            current_slot.push_input(&prev_output);
            current_slot.process(self.channels);
        }
        
        // Stage 3: Collect from last slot
        if let Some(last_slot) = self.slots.last() {
            let output = last_slot.pop_output(data.len());
            for (i, &sample) in output.iter().enumerate() {
                if i < data.len() {
                    data[i] = sample;
                }
            }
        }
    }
    
    /// Number of plugins in chain
    pub fn len(&self) -> usize {
        self.slots.len()
    }
    
    /// Check if chain is empty
    pub fn is_empty(&self) -> bool {
        self.slots.is_empty()
    }
    
    /// Get total samples processed by all slots
    pub fn total_samples_processed(&self) -> u64 {
        self.slots.iter().map(|s| s.samples_processed()).sum()
    }
}

unsafe impl Send for ParallelPluginChain {}

#[cfg(test)]
mod tests {
    use super::*;
    
    struct TestProcessor;
    
    impl AudioProcessor for TestProcessor {
        fn process(&mut self, data: &mut [f32], _channels: usize) {
            for sample in data.iter_mut() {
                *sample *= 2.0; // Simple gain
            }
        }
        
        fn name(&self) -> &str {
            "TestProcessor"
        }
        
        fn set_parameter(&mut self, _name: &str, _value: f32) {}
    }
    
    #[test]
    fn test_plugin_slot() {
        let proc: Arc<Mutex<dyn AudioProcessor>> = Arc::new(Mutex::new(TestProcessor));
        let slot = PluginSlot::new("test", proc, 1024);
        
        let input = vec![0.5, 0.5, 0.5, 0.5];
        slot.push_input(&input);
        slot.process(2);
        
        let output = slot.pop_output(4);
        assert_eq!(output.len(), 4);
        assert_eq!(output[0], 1.0); // Doubled
    }
    
    #[test]
    fn test_parallel_chain() {
        let mut chain = ParallelPluginChain::new(2);
        
        let proc1: Arc<Mutex<dyn AudioProcessor>> = Arc::new(Mutex::new(TestProcessor));
        let proc2: Arc<Mutex<dyn AudioProcessor>> = Arc::new(Mutex::new(TestProcessor));
        
        chain.add_plugin("proc1", proc1, 1024);
        chain.add_plugin("proc2", proc2, 1024);
        
        assert_eq!(chain.len(), 2);
    }
}
