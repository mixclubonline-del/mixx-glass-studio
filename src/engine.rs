use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{BufferSize, Sample, SampleFormat, SampleRate, Stream};
use dasp_sample::FromSample;
use crossbeam_queue::ArrayQueue;
use log::{info, warn};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};
use crate::mixx_audio_core::velvet_curve::VelvetCurve;
use crate::mixx_audio_core::harmonic_lattice::HarmonicLattice;
use crate::mixx_audio_core::phase_weave::PhaseWeave;
use crate::mixx_audio_core::processor::AudioProcessor;
use crate::mixx_audio_core::quantum_automation::QuantumAutomation;
use crate::mixx_audio_core::plugin_chain::ParallelPluginChain;
use crate::mixx_audio_core::neural_bridge::NeuralBridge;
use crate::mixx_audio_core::quantum_transport::QuantumTransport;
use crate::mixx_audio_core::audio_io::AudioManager;
use crate::mixx_audio_core::midi_engine::MidiSequencer;
use crate::mixx_audio_core::clip_region::ClipManager;
use crate::mixx_audio_core::track_mixer::Mixer;
use crate::mixx_audio_core::history::HistoryManager;
use crate::mixx_audio_core::session::SessionManager;
use crate::mixx_audio_core::tempo_map::TempoMap;
use crate::mixx_audio_core::master_chain::{MasterChain, MasteringProfile};

static ENGINE_STATE: LazyLock<Mutex<Option<EngineState>>> =
    LazyLock::new(|| Mutex::new(None));

#[derive(Debug)]
pub struct EngineError {
    message: String,
}

impl EngineError {
    pub fn new(message: impl Into<String>) -> Self {
        Self {
            message: message.into(),
        }
    }

    pub fn message(&self) -> &str {
        &self.message
    }
}

impl From<cpal::BuildStreamError> for EngineError {
    fn from(value: cpal::BuildStreamError) -> Self {
        Self::new(value.to_string())
    }
}

impl From<cpal::PlayStreamError> for EngineError {
    fn from(value: cpal::PlayStreamError) -> Self {
        Self::new(value.to_string())
    }
}

impl From<cpal::PauseStreamError> for EngineError {
    fn from(value: cpal::PauseStreamError) -> Self {
        Self::new(value.to_string())
    }
}

impl std::fmt::Display for EngineError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.message)
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct EngineConfig {
    pub sample_rate: u32,
    pub buffer_size: u32,
    pub channels: u16,
}

impl Default for EngineConfig {
    fn default() -> Self {
        Self {
            sample_rate: 48_000,
            buffer_size: 64,
            channels: 2,
        }
    }
}

#[repr(C)]
#[derive(Debug, Default, Clone, Copy)]
pub struct EngineStats {
    pub total_callbacks: u64,
    pub average_callback_ns: f64,
    pub xruns: u64,
    pub last_callback_ns: u64,
    pub uptime_ms: u64,
}

#[repr(C)]
#[derive(Debug, Default, Clone, Copy)]
pub struct EngineMetric {
    pub timestamp_ns: u64,
    pub callback_ns: u64,
    pub frames_processed: u32,
    pub xruns: u32,
}

struct EngineState {
    engine: MixxEngine,
}

// Safety: cpal::Stream is Send-safe on macOS/Linux/Windows in cpal 0.15+
// The streams are only accessed from the audio callback thread and main thread
unsafe impl Send for EngineState {}

struct MixxEngine {
    _config: EngineConfig,
    input_stream: Option<Stream>,
    output_stream: Stream,
    running_since: Arc<LastStart>,
    _shared_buffer: Arc<ArrayQueue<f32>>,
    metrics_queue: Arc<ArrayQueue<EngineMetric>>,
    stats: Arc<EngineStatsInner>,
    analysis_queue: Arc<ArrayQueue<f32>>,
    pipeline: Vec<Arc<Mutex<dyn AudioProcessor>>>,
    quantum_automation: Arc<Mutex<QuantumAutomation>>,
    plugin_chain: Arc<Mutex<ParallelPluginChain>>,
    neural_bridge: Arc<Mutex<NeuralBridge>>,
    transport: Arc<QuantumTransport>,
    audio_manager: Arc<Mutex<AudioManager>>,
    midi_sequencer: Arc<Mutex<MidiSequencer>>,
    clip_manager: Arc<Mutex<ClipManager>>,
    mixer: Arc<Mutex<Mixer>>,
    history: Arc<Mutex<HistoryManager>>,
    session: Arc<Mutex<SessionManager>>,
    tempo_map: Arc<Mutex<TempoMap>>,
    master_chain: Arc<Mutex<MasterChain>>,
}

#[derive(Default)]
struct EngineStatsInner {
    total_callbacks: AtomicU64,
    total_callback_time_ns: AtomicU64,
    xruns: AtomicU64,
    last_callback_ns: AtomicU64,
}

#[derive(Default)]
struct LastStart {
    started: AtomicBool,
    started_at_ns: AtomicU64,
}

pub fn init_engine(config: Option<EngineConfig>) -> Result<(), EngineError> {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");

    if guard.is_some() {
        return Ok(());
    }

    let config = config.unwrap_or_default();
    let engine = MixxEngine::new(config)?;
    *guard = Some(EngineState { engine });
    info!(
        "MixxEngine initialized ({} Hz, {} frames, {} channels)",
        config.sample_rate, config.buffer_size, config.channels
    );
    Ok(())
}

pub fn start_engine() -> Result<(), EngineError> {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");

    let state = guard
        .as_mut()
        .ok_or_else(|| EngineError::new("MixxEngine not initialized"))?;
    
    info!("MixxEngine: Starting audio streams...");
    state.engine.start()?;
    info!("MixxEngine: Audio streams started successfully");
    Ok(())
}

pub fn stop_engine() -> Result<(), EngineError> {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");

    if let Some(state) = guard.as_mut() {
        state.engine.stop()?;
    }
    Ok(())
}

pub fn shutdown_engine() {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    guard.take();
}

pub fn current_stats() -> Option<EngineStats> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    guard.as_ref().map(|state| {
        let stats = state.engine.stats();
        // Log if we're getting stats but they're all zeros (engine might not be running)
        if stats.total_callbacks == 0 && stats.uptime_ms == 0 {
            log::debug!("MixxEngine stats: engine state exists but no callbacks yet");
        }
        stats
    })
}

pub fn pop_metric() -> Option<EngineMetric> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    guard.as_ref().and_then(|state| state.engine.pop_metric())
}

pub fn update_velvet_curve_params(warmth: f32, silk_edge: f32, emotion: f32, power: f32) {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_mut() {
        for processor in &state.engine.pipeline {
            if let Ok(mut p) = processor.lock() {
                if p.name() == "Velvet Curve" {
                    p.set_parameter("warmth", warmth);
                    p.set_parameter("silk_edge", silk_edge);
                    p.set_parameter("emotion", emotion);
                    p.set_parameter("power", power);
                }
            }
        }
    }
}

pub fn update_harmonic_lattice_params(even_drive: f32, odd_drive: f32, tension: f32, output_gain: f32) {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_mut() {
        for processor in &state.engine.pipeline {
            if let Ok(mut p) = processor.lock() {
                if p.name() == "Harmonic Lattice" {
                    p.set_parameter("even_drive", even_drive);
                    p.set_parameter("odd_drive", odd_drive);
                    p.set_parameter("tension", tension);
                    p.set_parameter("output_gain", output_gain);
                }
            }
        }
    }
}

pub fn update_phase_weave_params(width: f32, rotation: f32) {
    let mut guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_mut() {
        for processor in &state.engine.pipeline {
            if let Ok(mut p) = processor.lock() {
                if p.name() == "Phase Weave" {
                    p.set_parameter("width", width);
                    p.set_parameter("rotation", rotation);
                }
            }
        }
    }
}

pub fn pop_analysis_samples(max: usize) -> Vec<f32> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(Vec::new(), |state| {
        let mut samples = Vec::with_capacity(max);
        for _ in 0..max {
            if let Some(sample) = state.engine.analysis_queue.pop() {
                samples.push(sample);
            } else {
                break;
            }
        }
        samples
    })
}

// ============================================================================
// Master Chain Control Functions (Phase 26)
// ============================================================================

/// Set the mastering profile (0=Streaming, 1=Club, 2=Broadcast, 3=Vinyl, 4=Audiophile)
pub fn master_chain_set_profile(profile_id: u32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut chain) = state.engine.master_chain.lock() {
            let profile = MasteringProfile::from_value(profile_id);
            chain.apply_profile(profile);
            info!("MasterChain: Profile set to {:?}", profile);
        }
    }
}

/// Get current LUFS meters from the MasterChain
pub fn master_chain_get_meters() -> (f32, f32, f32, f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((-100.0, -100.0, -100.0, -100.0), |state| {
        if let Ok(chain) = state.engine.master_chain.lock() {
            let m = chain.get_meters();
            (m.momentary_lufs, m.short_term_lufs, m.integrated_lufs, m.true_peak_db)
        } else {
            (-100.0, -100.0, -100.0, -100.0)
        }
    })
}

/// Set a parameter on the MasterChain
pub fn master_chain_set_param(name: &str, value: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut chain) = state.engine.master_chain.lock() {
            chain.set_parameter(name, value);
        }
    }
}

/// Enable or disable MasterChain processing (bypass)
pub fn master_chain_set_enabled(enabled: bool) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut chain) = state.engine.master_chain.lock() {
            chain.set_parameter("enabled", if enabled { 1.0 } else { 0.0 });
        }
    }
}

impl MixxEngine {
    fn new(config: EngineConfig) -> Result<Self, EngineError> {
        let host = cpal::default_host();

        let output_device = host
            .default_output_device()
            .ok_or_else(|| EngineError::new("No default output device available"))?;

        let output_supported = output_device
            .default_output_config()
            .map_err(|err| EngineError::new(format!("Output config error: {err}")))?;

        let output_config = Self::configure_stream_config(&output_supported, &config);

        let shared_buffer = Arc::new(ArrayQueue::<f32>::new(
            (config.buffer_size as usize * config.channels as usize * 16).max(1024),
        ));
        let metrics_queue = Arc::new(ArrayQueue::<EngineMetric>::new(1024));
        let stats = Arc::new(EngineStatsInner::default());
        let running_since = Arc::new(LastStart::default());
        
        // Build Pipeline
        let mut pipeline: Vec<Arc<Mutex<dyn AudioProcessor>>> = Vec::new();
        pipeline.push(Arc::new(Mutex::new(VelvetCurve::new())));
        let harmonic_proc: Arc<Mutex<dyn AudioProcessor>> = Arc::new(Mutex::new(HarmonicLattice::new()));
        pipeline.push(harmonic_proc);
        let phase_proc: Arc<Mutex<dyn AudioProcessor>> = Arc::new(Mutex::new(PhaseWeave::new()));
        pipeline.push(phase_proc);

        // Buffer for ~85ms of audio at 48kHz for visualization dispatch
        let analysis_queue = Arc::new(ArrayQueue::<f32>::new(4096));

        // Initialize Quantum Automation with DSP parameters
        let mut quantum_auto = QuantumAutomation::new(config.sample_rate);
        quantum_auto.register_parameter("velvet_warmth", 0.5);
        quantum_auto.register_parameter("velvet_silk", 0.5);
        quantum_auto.register_parameter("velvet_presence", 0.5);
        quantum_auto.register_parameter("velvet_power", 0.5);
        quantum_auto.register_parameter("harmonic_blend", 0.5);
        quantum_auto.register_parameter("harmonic_drive", 0.3);
        quantum_auto.register_parameter("phase_width", 1.0);
        quantum_auto.register_parameter("phase_rotation", 0.0);
        quantum_auto.predict_all(); // Pre-calculate lookahead
        let quantum_automation = Arc::new(Mutex::new(quantum_auto));

        // Initialize Plugin Chain
        let plugin_chain = Arc::new(Mutex::new(ParallelPluginChain::new(config.channels as usize)));

        // Initialize Neural Bridge
        let neural_bridge = Arc::new(Mutex::new(NeuralBridge::new(config.sample_rate)));

        // Initialize Quantum Transport
        let transport = Arc::new(QuantumTransport::new(config.sample_rate, 120.0));

        // Initialize Audio Manager
        let mut audio_mgr = AudioManager::new();
        audio_mgr.enumerate_devices();
        let audio_manager = Arc::new(Mutex::new(audio_mgr));

        // Initialize MIDI Sequencer
        let midi_sequencer = Arc::new(Mutex::new(MidiSequencer::new(config.sample_rate, 120.0)));

        // Initialize Clip Manager
        let clip_manager = Arc::new(Mutex::new(ClipManager::new()));

        // Initialize Mixer
        let mixer = Arc::new(Mutex::new(Mixer::new(config.sample_rate)));

        // Initialize History Manager (1000 undo levels)
        let history = Arc::new(Mutex::new(HistoryManager::new(1000)));

        // Initialize Session Manager
        let session = Arc::new(Mutex::new(SessionManager::new()));

        // Initialize Tempo Map
        let tempo_map = Arc::new(Mutex::new(TempoMap::new(config.sample_rate, 120.0)));

        // Initialize Master Chain (Phase 26)
        let master = MasterChain::new(config.sample_rate as f32, MasteringProfile::Streaming);
        let master_chain = Arc::new(Mutex::new(master));

        // Add MasterChain to the pipeline as final processor
        let master_proc: Arc<Mutex<dyn AudioProcessor>> = master_chain.clone();
        pipeline.push(master_proc);

        let input_stream =
            Self::maybe_build_input_stream(&host, &config, shared_buffer.clone(), stats.clone(), metrics_queue.clone())?;

        let output_stream = Self::build_output_stream(
            &output_device,
            output_config,
            shared_buffer.clone(),
            stats.clone(),
            metrics_queue.clone(),
            pipeline.clone(),
            analysis_queue.clone(),
        )?;

        Ok(Self {
            _config: config,
            input_stream,
            output_stream,
            running_since,
            _shared_buffer: shared_buffer,
            metrics_queue,
            stats,
            analysis_queue,
            pipeline,
            quantum_automation,
            plugin_chain,
            neural_bridge,
            transport,
            audio_manager,
            midi_sequencer,
            clip_manager,
            mixer,
            history,
            session,
            tempo_map,
            master_chain,
        })
    }

    fn start(&mut self) -> Result<(), EngineError> {
        if let Some(stream) = &self.input_stream {
            stream.play()?;
        }
        self.output_stream.play()?;
        self.running_since
            .started_at_ns
            .store(current_time_ns(), Ordering::Relaxed);
        self.running_since.started.store(true, Ordering::Relaxed);
        info!("MixxEngine audio streams started");
        Ok(())
    }

    fn stop(&mut self) -> Result<(), EngineError> {
        if let Some(stream) = &self.input_stream {
            stream.pause()?;
        }
        self.output_stream.pause()?;
        self.running_since.started.store(false, Ordering::Relaxed);
        info!("MixxEngine audio streams stopped");
        Ok(())
    }

    fn stats(&self) -> EngineStats {
        let total_callbacks = self.stats.total_callbacks.load(Ordering::Relaxed);
        let total_ns = self
            .stats
            .total_callback_time_ns
            .load(Ordering::Relaxed);
        let average_callback_ns = if total_callbacks > 0 {
            total_ns as f64 / total_callbacks as f64
        } else {
            0.0
        };
        let last_callback_ns = self.stats.last_callback_ns.load(Ordering::Relaxed);
        let xruns = self.stats.xruns.load(Ordering::Relaxed);
        let uptime_ms = if self.running_since.started.load(Ordering::Relaxed) {
            let started = self.running_since.started_at_ns.load(Ordering::Relaxed);
            if started > 0 {
                (current_time_ns() - started) / 1_000_000
            } else {
                0
            }
        } else {
            0
        };

        EngineStats {
            total_callbacks,
            average_callback_ns,
            xruns,
            last_callback_ns,
            uptime_ms,
        }
    }

    fn pop_metric(&self) -> Option<EngineMetric> {
        self.metrics_queue.pop()
    }

    fn configure_stream_config(
        supported: &cpal::SupportedStreamConfig,
        config: &EngineConfig,
    ) -> cpal::StreamConfig {
        let mut cfg = supported.config();
        cfg.sample_rate = SampleRate(config.sample_rate);
        cfg.channels = config.channels;
        cfg.buffer_size = BufferSize::Fixed(config.buffer_size);
        cfg
    }

    fn maybe_build_input_stream(
        host: &cpal::Host,
        config: &EngineConfig,
        queue: Arc<ArrayQueue<f32>>,
        stats: Arc<EngineStatsInner>,
        metrics: Arc<ArrayQueue<EngineMetric>>,
    ) -> Result<Option<Stream>, EngineError> {
        let input_device = match host.default_input_device() {
            Some(device) => device,
            None => {
                warn!("No default input device detected; MixxEngine will output silence");
                return Ok(None);
            }
        };

        let supported_config = match input_device.default_input_config() {
            Ok(cfg) => cfg,
            Err(err) => {
                warn!("Failed to read input config: {err}");
                return Ok(None);
            }
        };

        let stream_config = Self::configure_stream_config(&supported_config, config);
        let channels = stream_config.channels as usize;

        let build_attempt = Self::build_input_stream_internal(
            &input_device,
            stream_config.clone(),
            supported_config.sample_format(),
            channels,
            queue.clone(),
            stats.clone(),
            metrics.clone(),
        );

        match build_attempt {
            Ok(stream) => Ok(Some(stream)),
            Err(err) => {
                warn!("Failed to build input stream with requested config: {err}. Falling back to default.");
                let fallback_config = supported_config.config();
                let channels = fallback_config.channels as usize;
                let fallback = Self::build_input_stream_internal(
                    &input_device,
                    fallback_config,
                    supported_config.sample_format(),
                    channels,
                    queue,
                    stats,
                    metrics,
                );
                match fallback {
                    Ok(stream) => Ok(Some(stream)),
                    Err(fallback_err) => {
                        warn!("Failed to build input stream: {fallback_err}. Continuing without input.");
                        Ok(None)
                    }
                }
            }
        }
    }

    fn build_output_stream(
        device: &cpal::Device,
        config: cpal::StreamConfig,
        queue: Arc<ArrayQueue<f32>>,
        stats: Arc<EngineStatsInner>,
        metrics: Arc<ArrayQueue<EngineMetric>>,
        pipeline: Vec<Arc<Mutex<dyn AudioProcessor>>>,
        analysis_queue: Arc<ArrayQueue<f32>>,
    ) -> Result<Stream, EngineError> {
        let channels = config.channels as usize;
        let queue_clone = queue.clone();
        let stats_clone = stats.clone();
        let metrics_clone = metrics.clone();
        let pipeline_clone = pipeline.clone();
        let analysis_queue_clone = analysis_queue.clone();

        let default_supported = device
            .default_output_config()
            .map_err(|err| EngineError::new(format!("Failed to read default output config: {err}")))?;

        Self::build_output_stream_internal(
            device,
            config.clone(),
            default_supported.sample_format(),
            channels,
            queue_clone.clone(),
            stats_clone.clone(),
            metrics_clone.clone(),
            pipeline_clone.clone(),
            analysis_queue_clone.clone(),
        )
        .or_else(|err| {
            warn!("Failed to build output stream with requested config: {err}. Falling back to default output config.");
            let fallback_config = default_supported.config();
            let fallback_channels = fallback_config.channels as usize;
            Self::build_output_stream_internal(
                device,
                fallback_config,
                default_supported.sample_format(),
                fallback_channels,
                queue_clone,
                stats_clone,
                metrics_clone,
                pipeline_clone,
                analysis_queue_clone,
            )
        })
    }

    fn handle_input_callback<T>(
        data: &[T],
        channels: usize,
        queue: &ArrayQueue<f32>,
        stats: &EngineStatsInner,
        metrics: &ArrayQueue<EngineMetric>,
    ) where
        T: Sample,
        f32: FromSample<T>,
    {
        let start = Instant::now();
        let mut dropped = 0_u32;
        let frames = data.len() / channels;

        for sample in data.iter() {
            // Convert sample to f32 using Sample trait
            let value: f32 = f32::from_sample(*sample);
            if queue.push(value).is_err() {
                dropped += 1;
            }
        }

        if dropped > 0 {
            stats.xruns.fetch_add(1, Ordering::Relaxed);
        }

        let elapsed = start.elapsed();
        let elapsed_ns = elapsed.as_nanos() as u64;

        stats.total_callbacks.fetch_add(1, Ordering::Relaxed);
        stats
            .total_callback_time_ns
            .fetch_add(elapsed_ns, Ordering::Relaxed);
        stats.last_callback_ns.store(elapsed_ns, Ordering::Relaxed);

        let metric = EngineMetric {
            timestamp_ns: current_time_ns(),
            callback_ns: elapsed_ns,
            frames_processed: frames as u32,
            xruns: dropped,
        };

        let _ = metrics.push(metric);
    }

    fn handle_output_callback<T>(
        data: &mut [T],
        channels: usize,
        queue: &ArrayQueue<f32>,
        stats: &EngineStatsInner,
        metrics: &ArrayQueue<EngineMetric>,
        pipeline: &Vec<Arc<Mutex<dyn AudioProcessor>>>,
        analysis_queue: &ArrayQueue<f32>,
    ) where
        T: Sample,
        T: Sample + FromSample<f32>,
        f32: FromSample<T>,
    {
        let start = Instant::now();
        let mut underruns = 0_u32;
        let frames = data.len() / channels;
        
        // Log first callback to confirm audio is working
        let callback_count = stats.total_callbacks.load(Ordering::Relaxed);
        if callback_count == 0 {
            info!("MixxEngine: First output callback received ({} frames, {} channels)", frames, channels);
        }

        // 1. Fill scratch buffer from input queue
        // We use a Vec<f32> to ensure we have a valid buffer for the DSP pipeline,
        // regardless of the output format T.
        // Allocation in audio thread is not ideal but acceptable for this phase.
        let mut scratch_buffer: Vec<f32> = Vec::with_capacity(data.len());
        
        for _ in 0..data.len() {
            if let Some(s) = queue.pop() {
                scratch_buffer.push(s);
            } else {
                underruns += 1;
                scratch_buffer.push(0.0);
            }
        }

        // Apply DSP Pipeline (in place on scratch buffer)
        for processor in pipeline {
             if let Ok(mut p) = processor.try_lock() {
                 p.process(&mut scratch_buffer, channels);
             }
        }

        // Push to analysis queue (mono sum) and Write to Output
        for (i, sample) in data.iter_mut().enumerate() {
            let processed_sample = scratch_buffer[i];
            
            // Push to analysis queue (decimated or full)
            // Ideally we only push left channel or mono sum of first frame
            // But doing it per sample is simple for now, relying on analysis queue behavior
            // Or better: push every Nth sample or push first channel only
            if i % channels == 0 {
                 let _ = analysis_queue.force_push(processed_sample);
            }
            
            *sample = T::from_sample(processed_sample);
        }

        if underruns > 0 {
            stats.xruns.fetch_add(1, Ordering::Relaxed);
        }

        let elapsed = start.elapsed();
        let elapsed_ns = elapsed.as_nanos() as u64;

        stats.total_callbacks.fetch_add(1, Ordering::Relaxed);
        stats
            .total_callback_time_ns
            .fetch_add(elapsed_ns, Ordering::Relaxed);
        stats.last_callback_ns.store(elapsed_ns, Ordering::Relaxed);

        let metric = EngineMetric {
            timestamp_ns: current_time_ns(),
            callback_ns: elapsed_ns,
            frames_processed: frames as u32,
            xruns: underruns,
        };

        let _ = metrics.push(metric);
    }

    fn build_input_stream_internal(
        device: &cpal::Device,
        config: cpal::StreamConfig,
        format: SampleFormat,
        channels: usize,
        queue: Arc<ArrayQueue<f32>>,
        stats: Arc<EngineStatsInner>,
        metrics: Arc<ArrayQueue<EngineMetric>>,
    ) -> Result<Stream, EngineError> {
        match format {
            SampleFormat::F32 => Ok(device.build_input_stream(
                &config,
                move |data: &[f32], _| {
                    Self::handle_input_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_input_error,
                None,
            )?),
            SampleFormat::I16 => Ok(device.build_input_stream(
                &config,
                move |data: &[i16], _| {
                    Self::handle_input_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_input_error,
                None,
            )?),
            SampleFormat::U16 => Ok(device.build_input_stream(
                &config,
                move |data: &[u16], _| {
                    Self::handle_input_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_input_error,
                None,
            )?),
            other => Err(EngineError::new(format!(
                "Unsupported input sample format {other:?}"
            ))),
        }
    }

    fn build_output_stream_internal(
        device: &cpal::Device,
        config: cpal::StreamConfig,
        format: SampleFormat,
        channels: usize,
        queue: Arc<ArrayQueue<f32>>,
        stats: Arc<EngineStatsInner>,
        metrics: Arc<ArrayQueue<EngineMetric>>,
        pipeline: Vec<Arc<Mutex<dyn AudioProcessor>>>,
        analysis_queue: Arc<ArrayQueue<f32>>,
    ) -> Result<Stream, EngineError> {
        match format {
            SampleFormat::F32 => Ok(device.build_output_stream(
                &config,
                move |data: &mut [f32], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                        &pipeline,
                        &analysis_queue,
                    )
                },
                handle_output_error,
                None,
            )?),
            SampleFormat::I16 => Ok(device.build_output_stream(
                &config,
                move |data: &mut [i16], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                        &pipeline,
                        &analysis_queue,
                    )
                },
                handle_output_error,
                None,
            )?),
            SampleFormat::U16 => Ok(device.build_output_stream(
                &config,
                move |data: &mut [u16], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                        &pipeline,
                        &analysis_queue,
                    )
                },
                handle_output_error,
                None,
            )?),
            other => Err(EngineError::new(format!(
                "Unsupported output sample format {other:?}"
            ))),
        }
    }
}

fn current_time_ns() -> u64 {
    use std::time::{SystemTime, UNIX_EPOCH};

    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_else(|_| Duration::from_secs(0))
        .as_nanos() as u64
}

fn handle_input_error(err: cpal::StreamError) {
    warn!("MixxEngine input stream error: {err}");
}

fn handle_output_error(err: cpal::StreamError) {
    warn!("MixxEngine output stream error: {err}");
}

// ============================================================================
// Quantum Automation Public API
// ============================================================================

/// Set a quantum-controlled parameter value (collapses superposition)
pub fn quantum_set_parameter(name: &str, value: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut qa) = state.engine.quantum_automation.lock() {
            qa.set_parameter(name, value);
        }
    }
}

/// Undo last parameter change (restores from history superposition)
pub fn quantum_undo_parameter(name: &str) -> Option<f32> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().and_then(|state| {
        state.engine.quantum_automation.lock().ok().and_then(|mut qa| {
            qa.undo_parameter(name)
        })
    })
}

/// Trigger prediction for all quantum automation lanes
pub fn quantum_predict() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut qa) = state.engine.quantum_automation.lock() {
            qa.predict_all();
        }
    }
}

/// Get current value of a quantum-controlled parameter
pub fn quantum_get_parameter(name: &str) -> Option<f32> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().and_then(|state| {
        state.engine.quantum_automation.lock().ok().and_then(|mut qa| {
            let pos = qa.position();
            qa.get_parameter(name, pos)
        })
    })
}

// ============================================================================
// Plugin Chain Public API
// ============================================================================

/// Set plugin slot enabled state
pub fn plugin_chain_set_enabled(slot_name: &str, enabled: bool) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(chain) = state.engine.plugin_chain.lock() {
            if let Some(slot) = chain.get_slot_by_name(slot_name) {
                slot.set_enabled(enabled);
            }
        }
    }
}

/// Set plugin slot bypass state
pub fn plugin_chain_set_bypass(slot_name: &str, bypass: bool) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(chain) = state.engine.plugin_chain.lock() {
            if let Some(slot) = chain.get_slot_by_name(slot_name) {
                slot.set_bypass(bypass);
            }
        }
    }
}

/// Get plugin chain status (number of slots, total samples processed)
pub fn plugin_chain_status() -> (usize, u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0), |state| {
        state.engine.plugin_chain.lock().ok().map_or((0, 0), |chain| {
            (chain.len(), chain.total_samples_processed())
        })
    })
}

// ============================================================================
// Neural Inference Public API
// ============================================================================

/// Analyze audio samples for feature extraction
pub fn neural_analyze(samples: &[f32]) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut bridge) = state.engine.neural_bridge.lock() {
            bridge.analyze(samples);
        }
    }
}

/// Infer genre from analyzed audio
pub fn neural_infer_genre() -> (String, f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(("Unknown".to_string(), 0.0), |state| {
        state.engine.neural_bridge.lock().ok().map_or(
            ("Unknown".to_string(), 0.0),
            |mut bridge| {
                let result = bridge.infer_genre();
                (result.genre, result.confidence)
            }
        )
    })
}

/// Infer pattern/tempo from analyzed audio
pub fn neural_infer_pattern() -> (f32, f32, String) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((120.0, 0.0, "Unknown".to_string()), |state| {
        state.engine.neural_bridge.lock().ok().map_or(
            (120.0, 0.0, "Unknown".to_string()),
            |mut bridge| {
                let result = bridge.infer_pattern();
                (result.bpm, result.bpm_confidence, result.pattern_type)
            }
        )
    })
}

/// Get parameter suggestions based on detected genre
pub fn neural_suggest_parameters() -> Vec<(String, f32, f32)> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(Vec::new(), |state| {
        state.engine.neural_bridge.lock().ok().map_or(
            Vec::new(),
            |bridge| {
                bridge.suggest_parameters()
                    .into_iter()
                    .map(|s| (s.parameter_name, s.suggested_value, s.confidence))
                    .collect()
            }
        )
    })
}

/// Get neural bridge statistics (inferences run, history length)
pub fn neural_stats() -> (u64, usize) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0), |state| {
        state.engine.neural_bridge.lock().ok().map_or((0, 0), |bridge| bridge.stats())
    })
}

// ============================================================================
// Quantum Transport Public API
// ============================================================================

/// Play transport
pub fn transport_play() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        state.engine.transport.play();
    }
}

/// Pause transport
pub fn transport_pause() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        state.engine.transport.pause();
    }
}

/// Stop transport (reset to beginning)
pub fn transport_stop() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        state.engine.transport.stop();
    }
}

/// Seek to sample position
pub fn transport_seek(sample: u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        state.engine.transport.seek(sample);
    }
}

/// Get transport state (playing, position, bar, beat, bpm)
pub fn transport_state() -> (bool, u64, u32, u8, f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((false, 0, 1, 1, 120.0), |state| {
        let t = &state.engine.transport;
        let pos = t.beat_position();
        (t.is_playing(), t.position(), pos.bar, pos.beat, t.bpm())
    })
}

/// Set BPM
pub fn transport_set_bpm(bpm: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(_state) = guard.as_ref() {
        // Note: BeatGrid::set_bpm requires &mut, but transport is behind Arc
        // For lock-free access, BPM should be atomic - this is a design limitation
        // For now, we'll just log that BPM change was requested
        let _ = bpm; // Placeholder - would need mutable access redesign
    }
}

/// Set loop region
pub fn transport_set_loop(start: u64, end: u64, enabled: bool) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        state.engine.transport.set_loop(start, end);
        state.engine.transport.enable_loop(enabled);
    }
}

/// Get loop region
pub fn transport_loop_region() -> (u64, u64, bool) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0, false), |state| {
        state.engine.transport.loop_region()
    })
}

// ============================================================================
// Audio Device Management Public API
// ============================================================================

/// Get list of input devices (id, name, is_default)
pub fn audio_list_inputs() -> Vec<(String, String, bool)> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(Vec::new(), |state| {
        state.engine.audio_manager.lock().ok().map_or(Vec::new(), |mgr| {
            mgr.input_devices().iter()
                .map(|d| (d.id.clone(), d.name.clone(), d.is_default))
                .collect()
        })
    })
}

/// Get list of output devices (id, name, is_default)
pub fn audio_list_outputs() -> Vec<(String, String, bool)> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(Vec::new(), |state| {
        state.engine.audio_manager.lock().ok().map_or(Vec::new(), |mgr| {
            mgr.output_devices().iter()
                .map(|d| (d.id.clone(), d.name.clone(), d.is_default))
                .collect()
        })
    })
}

/// Select input device by ID
pub fn audio_select_input(device_id: &str) -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.audio_manager.lock().ok().map_or(false, |mut mgr| {
            mgr.select_input(device_id)
        })
    })
}

/// Select output device by ID
pub fn audio_select_output(device_id: &str) -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.audio_manager.lock().ok().map_or(false, |mut mgr| {
            mgr.select_output(device_id)
        })
    })
}

/// Get audio manager stats (underruns, overruns)
pub fn audio_get_stats() -> (u32, u32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0), |state| {
        state.engine.audio_manager.lock().ok().map_or((0, 0), |mgr| mgr.stats())
    })
}

// ============================================================================
// MIDI Sequencer Public API
// ============================================================================

/// Play MIDI sequencer
pub fn midi_play() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(seq) = state.engine.midi_sequencer.lock() {
            seq.play();
        }
    }
}

/// Stop MIDI sequencer
pub fn midi_stop() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(seq) = state.engine.midi_sequencer.lock() {
            seq.stop();
        }
    }
}

/// Start MIDI recording
pub fn midi_record() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(seq) = state.engine.midi_sequencer.lock() {
            seq.record();
        }
    }
}

/// Get MIDI sequencer state (playing, recording, position)
pub fn midi_state() -> (bool, bool, u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((false, false, 0), |state| {
        state.engine.midi_sequencer.lock().ok().map_or(
            (false, false, 0),
            |seq| (seq.is_playing(), seq.is_recording(), seq.position())
        )
    })
}

/// Send MIDI note on
pub fn midi_note_on(channel: u8, note: u8, velocity: u8) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut seq) = state.engine.midi_sequencer.lock() {
            use crate::mixx_audio_core::midi_engine::MidiEvent;
            seq.record_event(MidiEvent::note_on(channel, note, velocity));
        }
    }
}

/// Send MIDI note off
pub fn midi_note_off(channel: u8, note: u8) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut seq) = state.engine.midi_sequencer.lock() {
            use crate::mixx_audio_core::midi_engine::MidiEvent;
            seq.record_event(MidiEvent::note_off(channel, note, 0));
        }
    }
}

// ============================================================================
// Clip Manager Public API
// ============================================================================

/// Create audio clip from samples (returns clip ID)
pub fn clip_create_audio(name: &str, samples: Vec<f32>, channels: u16, sample_rate: u32) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.clip_manager.lock().ok().map_or(0, |mut mgr| {
            use crate::mixx_audio_core::clip_region::AudioClip;
            mgr.add_audio_clip(AudioClip::new(name, samples, channels, sample_rate))
        })
    })
}

/// Create MIDI clip (returns clip ID)
pub fn clip_create_midi(name: &str, length_samples: u64) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.clip_manager.lock().ok().map_or(0, |mut mgr| {
            use crate::mixx_audio_core::clip_region::MidiClip;
            mgr.add_midi_clip(MidiClip::new(name, length_samples))
        })
    })
}

/// Create region from clip (returns region ID)
pub fn clip_create_region(clip_id: u64, start_time: u64, track_index: usize) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.clip_manager.lock().ok().map_or(0, |mut mgr| {
            mgr.create_region(clip_id, start_time, track_index).unwrap_or(0)
        })
    })
}

/// Delete region
pub fn clip_delete_region(region_id: u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut mgr) = state.engine.clip_manager.lock() {
            mgr.delete_region(region_id);
        }
    }
}

/// Get clip manager stats (clip count, region count)
pub fn clip_stats() -> (usize, usize) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0), |state| {
        state.engine.clip_manager.lock().ok().map_or((0, 0), |mgr| mgr.stats())
    })
}

// ============================================================================
// Mixer Public API
// ============================================================================

/// Add audio track (returns track ID)
pub fn mixer_add_audio_track(name: &str) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.mixer.lock().ok().map_or(0, |mut m| m.add_audio_track(name))
    })
}

/// Add MIDI track (returns track ID)
pub fn mixer_add_midi_track(name: &str) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.mixer.lock().ok().map_or(0, |mut m| m.add_midi_track(name))
    })
}

/// Set track volume (0.0 - 2.0)
pub fn mixer_set_volume(track_id: u64, volume: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut m) = state.engine.mixer.lock() {
            m.set_volume(track_id, volume);
        }
    }
}

/// Set track pan (-1.0 to 1.0)
pub fn mixer_set_pan(track_id: u64, pan: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut m) = state.engine.mixer.lock() {
            m.set_pan(track_id, pan);
        }
    }
}

/// Toggle track mute (returns new state)
pub fn mixer_toggle_mute(track_id: u64) -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.mixer.lock().ok().map_or(false, |m| m.toggle_mute(track_id))
    })
}

/// Toggle track solo (returns new state)
pub fn mixer_toggle_solo(track_id: u64) -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.mixer.lock().ok().map_or(false, |m| m.toggle_solo(track_id))
    })
}

/// Get mixer stats (audio tracks, midi tracks, buses)
pub fn mixer_stats() -> (usize, usize, usize) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0, 0), |state| {
        state.engine.mixer.lock().ok().map_or((0, 0, 0), |m| m.stats())
    })
}

// ============================================================================
// History Manager Public API
// ============================================================================

/// Perform undo (returns description of undone action)
pub fn history_undo() -> Option<String> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().and_then(|state| {
        state.engine.history.lock().ok().and_then(|mut h| {
            h.undo().map(|action| action.description())
        })
    })
}

/// Perform redo (returns description of redone action)
pub fn history_redo() -> Option<String> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().and_then(|state| {
        state.engine.history.lock().ok().and_then(|mut h| {
            h.redo().map(|action| action.description())
        })
    })
}

/// Check if undo is available
pub fn history_can_undo() -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.history.lock().ok().map_or(false, |h| h.can_undo())
    })
}

/// Check if redo is available
pub fn history_can_redo() -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.history.lock().ok().map_or(false, |h| h.can_redo())
    })
}

/// Get undo/redo descriptions
pub fn history_descriptions() -> (Option<String>, Option<String>) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((None, None), |state| {
        state.engine.history.lock().ok().map_or((None, None), |h| {
            (h.undo_description().map(|s| s.to_string()), h.redo_description().map(|s| s.to_string()))
        })
    })
}

/// Get history stats (undo count, redo count, total actions)
pub fn history_stats() -> (usize, usize, u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0, 0), |state| {
        state.engine.history.lock().ok().map_or((0, 0, 0), |h| h.stats())
    })
}

/// Clear history
pub fn history_clear() {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut h) = state.engine.history.lock() {
            h.clear();
        }
    }
}

// ============================================================================
// Session Manager Public API
// ============================================================================

/// Create new project
pub fn session_new_project(name: &str) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut s) = state.engine.session.lock() {
            s.new_project(name);
        }
    }
}

/// Get project name
pub fn session_project_name() -> String {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(String::new(), |state| {
        state.engine.session.lock().ok().map_or(String::new(), |s| s.project_name().to_string())
    })
}

/// Set project tempo
pub fn session_set_tempo(tempo: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut s) = state.engine.session.lock() {
            s.set_tempo(tempo);
        }
    }
}

/// Get project tempo
pub fn session_tempo() -> f32 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(120.0, |state| {
        state.engine.session.lock().ok().map_or(120.0, |s| s.tempo())
    })
}

/// Save project (returns JSON)
pub fn session_save() -> Result<String, String> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref()
        .ok_or_else(|| "Engine not initialized".to_string())
        .and_then(|state| {
            state.engine.session.lock()
                .map_err(|_| "Session lock failed".to_string())
                .and_then(|mut s| s.save())
        })
}

/// Load project from JSON
pub fn session_load(json: &str) -> Result<(), String> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref()
        .ok_or_else(|| "Engine not initialized".to_string())
        .and_then(|state| {
            state.engine.session.lock()
                .map_err(|_| "Session lock failed".to_string())
                .and_then(|mut s| s.load(json))
        })
}

/// Check if project has unsaved changes
pub fn session_is_dirty() -> bool {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(false, |state| {
        state.engine.session.lock().ok().map_or(false, |s| s.is_dirty())
    })
}

/// Get session stats (tracks, regions, is_dirty, modified_at)
pub fn session_stats() -> (usize, usize, bool, u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0, false, 0), |state| {
        state.engine.session.lock().ok().map_or((0, 0, false, 0), |s| s.stats())
    })
}

// ============================================================================
// Tempo Map Public API
// ============================================================================

/// Add tempo event
pub fn tempo_add(position: u64, bpm: f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut tm) = state.engine.tempo_map.lock() {
            use crate::mixx_audio_core::tempo_map::TempoCurve;
            tm.add_tempo(position, bpm, TempoCurve::Step);
        }
    }
}

/// Get tempo at position
pub fn tempo_at(position: u64) -> f32 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(120.0, |state| {
        state.engine.tempo_map.lock().ok().map_or(120.0, |tm| tm.tempo_at(position))
    })
}

/// Add marker
pub fn tempo_add_marker(position: u64, name: &str) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(0, |state| {
        state.engine.tempo_map.lock().ok().map_or(0, |mut tm| {
            use crate::mixx_audio_core::tempo_map::MarkerType;
            tm.add_marker(position, name, MarkerType::Marker)
        })
    })
}

/// Remove marker
pub fn tempo_remove_marker(id: u64) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    if let Some(state) = guard.as_ref() {
        if let Ok(mut tm) = state.engine.tempo_map.lock() {
            tm.remove_marker(id);
        }
    }
}

/// Samples to bar:beat (returns bar, beat, fraction)
pub fn tempo_position_to_bar_beat(position: u64) -> (u32, u8, f32) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((1, 1, 0.0), |state| {
        state.engine.tempo_map.lock().ok().map_or((1, 1, 0.0), |tm| tm.samples_to_bar_beat(position))
    })
}

/// Snap to grid
pub fn tempo_snap_to_grid(position: u64, grid_division: u8) -> u64 {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or(position, |state| {
        state.engine.tempo_map.lock().ok().map_or(position, |tm| tm.snap_to_grid(position, grid_division))
    })
}

/// Get tempo map stats (tempo_events, time_sig_events, markers)
pub fn tempo_stats() -> (usize, usize, usize) {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    
    guard.as_ref().map_or((0, 0, 0), |state| {
        state.engine.tempo_map.lock().ok().map_or((0, 0, 0), |tm| tm.stats())
    })
}
