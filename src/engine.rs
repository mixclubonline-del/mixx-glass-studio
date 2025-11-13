use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use cpal::{BufferSize, Sample, SampleFormat, SampleRate, Stream};
use crossbeam_queue::ArrayQueue;
use log::{info, warn};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::{Arc, LazyLock, Mutex};
use std::time::{Duration, Instant};

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

struct MixxEngine {
    config: EngineConfig,
    input_stream: Option<Stream>,
    output_stream: Stream,
    running_since: Arc<LastStart>,
    shared_buffer: Arc<ArrayQueue<f32>>,
    metrics_queue: Arc<ArrayQueue<EngineMetric>>,
    stats: Arc<EngineStatsInner>,
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
    state.engine.start()?;
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
    guard.as_ref().map(|state| state.engine.stats())
}

pub fn pop_metric() -> Option<EngineMetric> {
    let guard = ENGINE_STATE
        .lock()
        .expect("MixxEngine global mutex poisoned");
    guard.as_ref().and_then(|state| state.engine.pop_metric())
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

        let input_stream =
            Self::maybe_build_input_stream(&host, &config, shared_buffer.clone(), stats.clone(), metrics_queue.clone())?;

        let output_stream = Self::build_output_stream(
            &output_device,
            output_config,
            shared_buffer.clone(),
            stats.clone(),
            metrics_queue.clone(),
        )?;

        Ok(Self {
            config,
            input_stream,
            output_stream,
            running_since,
            shared_buffer,
            metrics_queue,
            stats,
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
        self.metrics_queue.pop().ok()
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
    ) -> Result<Stream, EngineError> {
        let channels = config.channels as usize;
        let queue_clone = queue.clone();
        let stats_clone = stats.clone();
        let metrics_clone = metrics.clone();

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
    {
        let start = Instant::now();
        let mut dropped = 0_u32;
        let frames = data.len() / channels;

        for sample in data.iter() {
            let value = sample.to_f32();
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
    ) where
        T: Sample,
    {
        let start = Instant::now();
        let mut underruns = 0_u32;
        let frames = data.len() / channels;

        for sample in data.iter_mut() {
            match queue.pop() {
                Ok(value) => {
                    *sample = T::from(&value);
                }
                Err(_) => {
                    *sample = T::from(&0.0);
                    underruns += 1;
                }
            }
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
            SampleFormat::F32 => device.build_input_stream(
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
            ),
            SampleFormat::I16 => device.build_input_stream(
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
            ),
            SampleFormat::U16 => device.build_input_stream(
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
            ),
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
    ) -> Result<Stream, EngineError> {
        match format {
            SampleFormat::F32 => device.build_output_stream(
                &config,
                move |data: &mut [f32], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_output_error,
                None,
            ),
            SampleFormat::I16 => device.build_output_stream(
                &config,
                move |data: &mut [i16], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_output_error,
                None,
            ),
            SampleFormat::U16 => device.build_output_stream(
                &config,
                move |data: &mut [u16], _| {
                    Self::handle_output_callback(
                        data,
                        channels,
                        &queue,
                        &stats,
                        &metrics,
                    )
                },
                handle_output_error,
                None,
            ),
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

pub fn engine_error_message(err: EngineError) -> String {
    err.message
}

