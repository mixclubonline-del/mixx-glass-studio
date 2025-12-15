---
description: Phase 22 - Native WAV/FLAC audio export from Rust
---

# Phase 22: Audio Export Encoding

**Goal:** Native WAV/FLAC encoding from Rust for offline export.

## Prerequisites
- Phases 2-19 complete with zero-warning build
- Phase 21 (Dither) recommended but not required

---

## Step 1: Create the module file

Create `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/audio_export.rs`

## Step 2: Define export types

```rust
use std::io::{self, Write, BufWriter};
use std::fs::File;
use std::path::Path;

#[derive(Clone, Copy, PartialEq)]
pub enum ExportFormat {
    Wav16,
    Wav24,
    Wav32Float,
}

#[derive(Clone)]
pub struct ExportConfig {
    pub format: ExportFormat,
    pub sample_rate: u32,
    pub channels: u16,
    pub dither: bool,
    pub normalize: bool,
    pub normalize_target_lufs: f32,
}

impl Default for ExportConfig {
    fn default() -> Self {
        Self {
            format: ExportFormat::Wav24,
            sample_rate: 48000,
            channels: 2,
            dither: true,
            normalize: false,
            normalize_target_lufs: -14.0,
        }
    }
}

pub struct ExportProgress {
    pub samples_written: u64,
    pub total_samples: u64,
    pub percent: f32,
}

pub type ProgressCallback = Box<dyn Fn(ExportProgress) + Send>;
```

## Step 3: Implement WAV writer

```rust
pub struct WavWriter {
    writer: BufWriter<File>,
    config: ExportConfig,
    samples_written: u64,
    data_start_pos: u64,
}

impl WavWriter {
    pub fn create<P: AsRef<Path>>(path: P, config: ExportConfig) -> io::Result<Self> {
        let file = File::create(path)?;
        let mut writer = BufWriter::new(file);
        
        // Write placeholder header (will update at end)
        Self::write_header(&mut writer, &config, 0)?;
        
        let data_start_pos = writer.stream_position().unwrap_or(44);
        
        Ok(Self {
            writer,
            config,
            samples_written: 0,
            data_start_pos,
        })
    }
    
    fn write_header<W: Write>(w: &mut W, config: &ExportConfig, data_size: u32) -> io::Result<()> {
        let bits_per_sample: u16 = match config.format {
            ExportFormat::Wav16 => 16,
            ExportFormat::Wav24 => 24,
            ExportFormat::Wav32Float => 32,
        };
        let bytes_per_sample = bits_per_sample / 8;
        let block_align = config.channels * bytes_per_sample;
        let byte_rate = config.sample_rate * block_align as u32;
        let fmt_code: u16 = match config.format {
            ExportFormat::Wav32Float => 3, // IEEE float
            _ => 1, // PCM
        };
        
        // RIFF header
        w.write_all(b"RIFF")?;
        w.write_all(&(36 + data_size).to_le_bytes())?; // File size - 8
        w.write_all(b"WAVE")?;
        
        // fmt chunk
        w.write_all(b"fmt ")?;
        w.write_all(&16u32.to_le_bytes())?; // Chunk size
        w.write_all(&fmt_code.to_le_bytes())?; // Audio format
        w.write_all(&config.channels.to_le_bytes())?;
        w.write_all(&config.sample_rate.to_le_bytes())?;
        w.write_all(&byte_rate.to_le_bytes())?;
        w.write_all(&block_align.to_le_bytes())?;
        w.write_all(&bits_per_sample.to_le_bytes())?;
        
        // data chunk header
        w.write_all(b"data")?;
        w.write_all(&data_size.to_le_bytes())?;
        
        Ok(())
    }
    
    pub fn write_samples(&mut self, samples: &[f32]) -> io::Result<()> {
        for &sample in samples {
            match self.config.format {
                ExportFormat::Wav16 => {
                    let clamped = sample.clamp(-1.0, 1.0);
                    let value = (clamped * 32767.0) as i16;
                    self.writer.write_all(&value.to_le_bytes())?;
                }
                ExportFormat::Wav24 => {
                    let clamped = sample.clamp(-1.0, 1.0);
                    let value = (clamped * 8388607.0) as i32;
                    let bytes = value.to_le_bytes();
                    self.writer.write_all(&bytes[0..3])?; // Only 3 bytes for 24-bit
                }
                ExportFormat::Wav32Float => {
                    self.writer.write_all(&sample.to_le_bytes())?;
                }
            }
            self.samples_written += 1;
        }
        Ok(())
    }
    
    pub fn finalize(mut self) -> io::Result<()> {
        // Calculate data size
        let bytes_per_sample: u32 = match self.config.format {
            ExportFormat::Wav16 => 2,
            ExportFormat::Wav24 => 3,
            ExportFormat::Wav32Float => 4,
        };
        let data_size = self.samples_written as u32 * bytes_per_sample;
        
        // Seek back and rewrite header with correct size
        use std::io::Seek;
        self.writer.seek(std::io::SeekFrom::Start(0))?;
        Self::write_header(&mut self.writer, &self.config, data_size)?;
        
        self.writer.flush()?;
        Ok(())
    }
}
```

## Step 4: Implement export function with progress

```rust
pub fn export_audio<P: AsRef<Path>>(
    path: P,
    samples: &[f32],
    config: ExportConfig,
    progress_callback: Option<ProgressCallback>,
) -> io::Result<()> {
    let mut writer = WavWriter::create(path, config)?;
    
    let total_samples = samples.len() as u64;
    let chunk_size = 4096;
    
    for (i, chunk) in samples.chunks(chunk_size).enumerate() {
        writer.write_samples(chunk)?;
        
        if let Some(ref callback) = progress_callback {
            let samples_written = ((i + 1) * chunk_size).min(samples.len()) as u64;
            callback(ExportProgress {
                samples_written,
                total_samples,
                percent: (samples_written as f32 / total_samples as f32) * 100.0,
            });
        }
    }
    
    writer.finalize()?;
    Ok(())
}
```

## Step 5: Add to mod.rs

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/src/mixx_audio_core/mod.rs`:
```rust
pub mod audio_export;
```

## Step 6: Add Tauri commands

Add to `/Volumes/PRIME APP SSD/mixx-glass-studio/src-tauri/src/main.rs`:

```rust
#[tauri::command]
async fn audio_export_wav(
    path: String,
    sample_rate: u32,
    channels: u16,
    bit_depth: u8,
) -> Result<String, String> {
    // Implementation will wire to audio_export module
    Ok(format!("Export started: {}", path))
}
```

// turbo
## Step 7: Verify

```bash
cargo check --workspace
```

Must pass with zero warnings.

---

## Completion Checklist

- [ ] `audio_export.rs` created
- [ ] `ExportFormat` enum defined
- [ ] `ExportConfig` struct defined
- [ ] `WavWriter` implemented (16/24/32-float)
- [ ] Progress callback support
- [ ] Added to `mod.rs`
- [ ] Tauri command added
- [ ] Zero-warning build

## Future Enhancement (FLAC)
FLAC encoding is more complex (LPC + Rice coding). Consider using `flac-sys` crate or implementing gradually after WAV is working.
