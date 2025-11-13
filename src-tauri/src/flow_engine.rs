use mixx_core::{
    current_stats as mixx_current_stats, init_engine as mixx_init_engine,
    start_engine as mixx_start_engine, stop_engine as mixx_stop_engine, EngineConfig as MixxEngineConfig,
};
use serde_json;
use std::sync::atomic::{AtomicBool, AtomicU32, AtomicU64, Ordering};
use std::sync::Arc;

// Simplified F.L.O.W. Engine for testing
pub struct FlowEngine {
    is_playing: Arc<AtomicBool>,
    is_recording: Arc<AtomicBool>,
    current_sample: Arc<AtomicU64>,
    bpm: Arc<AtomicU32>,
    space_width: Arc<AtomicU32>,
    space_depth: Arc<AtomicU32>,
    space_presence: Arc<AtomicU32>,
    rms_level: Arc<AtomicU32>,
    peak_level: Arc<AtomicU32>,
    energy_level: Arc<AtomicU32>,
    engine_initialized: Arc<AtomicBool>,
    engine_running: Arc<AtomicBool>,
    engine_config: MixxEngineConfig,
}

impl FlowEngine {
    pub fn new() -> Result<Self, String> {
        Ok(FlowEngine {
            is_playing: Arc::new(AtomicBool::new(false)),
            is_recording: Arc::new(AtomicBool::new(false)),
            current_sample: Arc::new(AtomicU64::new(0)),
            bpm: Arc::new(AtomicU32::new(120)),
            space_width: Arc::new(AtomicU32::new(0)),
            space_depth: Arc::new(AtomicU32::new(0)),
            space_presence: Arc::new(AtomicU32::new(0)),
            rms_level: Arc::new(AtomicU32::new(0)),
            peak_level: Arc::new(AtomicU32::new(0)),
            energy_level: Arc::new(AtomicU32::new(0)),
            engine_initialized: Arc::new(AtomicBool::new(false)),
            engine_running: Arc::new(AtomicBool::new(false)),
            engine_config: MixxEngineConfig::default(),
        })
    }

    pub fn start_audio_stream(&mut self) -> Result<(), String> {
        if !self
            .engine_initialized
            .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
            .is_err()
        {
            println!("🎵 Initializing MixxEngine ({} Hz, {} frames, {} channels)...", 
                self.engine_config.sample_rate, 
                self.engine_config.buffer_size, 
                self.engine_config.channels);
            mixx_init_engine(Some(self.engine_config))
                .map_err(|err| format!("MixxEngine init failed: {}", err.message()))?;
            println!("✅ MixxEngine initialized");
        } else {
            println!("⚠️ MixxEngine already initialized, skipping init");
        }

        println!("▶️ Starting MixxEngine audio streams...");
        mixx_start_engine().map_err(|err| format!("MixxEngine start failed: {}", err.message()))?;
        self.engine_running.store(true, Ordering::Relaxed);
        println!("✅ F.L.O.W. audio stream started successfully!");
        Ok(())
    }

    pub fn play(&self) {
        self.is_playing.store(true, Ordering::Relaxed);
        println!("▶️ F.L.O.W. Transport: PLAY");
    }

    pub fn pause(&self) {
        self.is_playing.store(false, Ordering::Relaxed);
        println!("⏸️ F.L.O.W. Transport: PAUSE");
    }

    pub fn stop(&self) {
        self.is_playing.store(false, Ordering::Relaxed);
        self.current_sample.store(0, Ordering::Relaxed);
        if self
            .engine_running
            .swap(false, Ordering::Relaxed)
        {
            if let Err(err) = mixx_stop_engine() {
                eprintln!("MixxEngine stop failed: {}", err.message());
            }
        }
        println!("⏹️ F.L.O.W. Transport: STOP");
    }

    pub fn set_bpm(&self, bpm: f32) {
        self.bpm.store(bpm as u32, Ordering::Relaxed);
        println!("🎶 F.L.O.W. BPM set to: {}", bpm);
    }

    pub fn arm_recording(&self, armed: bool) {
        self.is_recording.store(armed, Ordering::Relaxed);
        println!("⏺️ F.L.O.W. Recording: {}", if armed { "ARMED" } else { "DISARMED" });
    }

    pub fn set_space_pad(&self, width: f32, depth: f32, presence: f32) {
        self.space_width.store((width * 1000.0) as u32, Ordering::Relaxed);
        self.space_depth.store((depth * 1000.0) as u32, Ordering::Relaxed);
        self.space_presence.store((presence * 1000.0) as u32, Ordering::Relaxed);
    }

    pub fn get_status(&self) -> serde_json::Value {
        let engine_stats_result = mixx_current_stats();
        let engine_stats = engine_stats_result.map(|stats| {
            serde_json::json!({
                "total_callbacks": stats.total_callbacks,
                "average_callback_ns": stats.average_callback_ns,
                "xruns": stats.xruns,
                "last_callback_ns": stats.last_callback_ns,
                "uptime_ms": stats.uptime_ms,
            })
        });

        let is_playing = self.is_playing.load(Ordering::Relaxed);
        let engine_running = self.engine_running.load(Ordering::Relaxed);
        let engine_initialized = self.engine_initialized.load(Ordering::Relaxed);
        
        // Debug: log why stats might not be available
        if engine_running && engine_stats.is_none() {
            eprintln!("[FlowEngine] WARNING: Engine running but mixx_current_stats() returned None. Initialized: {}", engine_initialized);
        }
        
        // If engine is running but stats aren't available yet, provide a placeholder
        let engine_stats_final = if engine_stats.is_some() {
            engine_stats
        } else if engine_running || engine_initialized {
            // Engine is initialized/running but stats not available yet (just started or state issue)
            Some(serde_json::json!({
                "total_callbacks": 0,
                "average_callback_ns": 0.0,
                "xruns": 0,
                "last_callback_ns": 0,
                "uptime_ms": 0,
            }))
        } else {
            None
        };

        serde_json::json!({
            "is_playing": is_playing,
            "is_recording": self.is_recording.load(Ordering::Relaxed),
            "current_sample": self.current_sample.load(Ordering::Relaxed),
            "bpm": self.bpm.load(Ordering::Relaxed) as f32,
            "space_width": self.space_width.load(Ordering::Relaxed) as f32 / 1000.0,
            "space_depth": self.space_depth.load(Ordering::Relaxed) as f32 / 1000.0,
            "space_presence": self.space_presence.load(Ordering::Relaxed) as f32 / 1000.0,
            "rms_level": self.rms_level.load(Ordering::Relaxed) as f32 / 1000.0,
            "peak_level": self.peak_level.load(Ordering::Relaxed) as f32 / 1000.0,
            "energy_level": self.energy_level.load(Ordering::Relaxed) as f32 / 1000.0,
            "engine": engine_stats_final,
            "engine_running": engine_running,
        })
    }
}
