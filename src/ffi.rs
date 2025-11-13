use crate::engine::{
    current_stats, init_engine, pop_metric, shutdown_engine, start_engine, stop_engine, EngineConfig,
    EngineError, EngineMetric, EngineStats,
};
use std::ffi::CString;
use std::os::raw::c_char;
use std::sync::{LazyLock, Mutex};

static LAST_ERROR: LazyLock<Mutex<Option<CString>>> = LazyLock::new(|| Mutex::new(None));

#[repr(C)]
pub struct MixxEngineConfig {
    pub sample_rate: u32,
    pub buffer_size: u32,
    pub channels: u16,
    pub reserved: u16,
}

impl From<MixxEngineConfig> for EngineConfig {
    fn from(value: MixxEngineConfig) -> Self {
        Self {
            sample_rate: value.sample_rate,
            buffer_size: value.buffer_size,
            channels: value.channels,
        }
    }
}

#[repr(C)]
pub struct MixxEngineStats {
    pub total_callbacks: u64,
    pub average_callback_ns: f64,
    pub xruns: u64,
    pub last_callback_ns: u64,
    pub uptime_ms: u64,
}

impl From<EngineStats> for MixxEngineStats {
    fn from(value: EngineStats) -> Self {
        Self {
            total_callbacks: value.total_callbacks,
            average_callback_ns: value.average_callback_ns,
            xruns: value.xruns,
            last_callback_ns: value.last_callback_ns,
            uptime_ms: value.uptime_ms,
        }
    }
}

#[repr(C)]
pub struct MixxEngineMetric {
    pub timestamp_ns: u64,
    pub callback_ns: u64,
    pub frames_processed: u32,
    pub xruns: u32,
}

impl From<EngineMetric> for MixxEngineMetric {
    fn from(value: EngineMetric) -> Self {
        Self {
            timestamp_ns: value.timestamp_ns,
            callback_ns: value.callback_ns,
            frames_processed: value.frames_processed,
            xruns: value.xruns,
        }
    }
}

fn set_last_error(error: EngineError) {
    let cstring = CString::new(error.message()).unwrap_or_else(|_| {
        CString::new("MixxEngine encountered an unknown error").expect("CString creation failed")
    });
    let mut guard = LAST_ERROR.lock().expect("LAST_ERROR mutex poisoned");
    *guard = Some(cstring);
}

fn clear_last_error() {
    let mut guard = LAST_ERROR.lock().expect("LAST_ERROR mutex poisoned");
    guard.take();
}

#[no_mangle]
pub extern "C" fn mixx_engine_init(config: *const MixxEngineConfig) -> bool {
    let rust_config = unsafe { config.as_ref() }.copied().map(EngineConfig::from);
    match init_engine(rust_config) {
        Ok(()) => {
            clear_last_error();
            true
        }
        Err(err) => {
            set_last_error(err);
            false
        }
    }
}

#[no_mangle]
pub extern "C" fn mixx_engine_start() -> bool {
    match start_engine() {
        Ok(()) => {
            clear_last_error();
            true
        }
        Err(err) => {
            set_last_error(err);
            false
        }
    }
}

#[no_mangle]
pub extern "C" fn mixx_engine_stop() -> bool {
    match stop_engine() {
        Ok(()) => {
            clear_last_error();
            true
        }
        Err(err) => {
            set_last_error(err);
            false
        }
    }
}

#[no_mangle]
pub extern "C" fn mixx_engine_shutdown() {
    shutdown_engine();
    clear_last_error();
}

#[no_mangle]
pub extern "C" fn mixx_engine_get_stats(out_stats: *mut MixxEngineStats) -> bool {
    if out_stats.is_null() {
        return false;
    }

    match current_stats() {
        Some(stats) => {
            let converted: MixxEngineStats = stats.into();
            unsafe {
                out_stats.write(converted);
            }
            true
        }
        None => false,
    }
}

#[no_mangle]
pub extern "C" fn mixx_engine_pop_metric(out_metric: *mut MixxEngineMetric) -> bool {
    if out_metric.is_null() {
        return false;
    }

    match pop_metric() {
        Some(metric) => {
            let converted: MixxEngineMetric = metric.into();
            unsafe {
                out_metric.write(converted);
            }
            true
        }
        None => false,
    }
}

#[no_mangle]
pub extern "C" fn mixx_engine_last_error() -> *const c_char {
    let guard = LAST_ERROR.lock().expect("LAST_ERROR mutex poisoned");
    guard
        .as_ref()
        .map(|err| err.as_ptr())
        .unwrap_or(std::ptr::null())
}

