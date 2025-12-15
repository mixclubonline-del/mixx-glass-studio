/**
 * MixxAudioFormat - Audio File Format Handling
 * 
 * Replaces: hound
 * 
 * Provides WAV file reading/writing with extended metadata support.
 * Future: FLAC, AIFF support
 */

use std::fs::File;
use std::io::{BufReader, BufWriter, Read, Write};
use std::path::Path;

/// Audio file metadata
#[derive(Debug, Clone)]
pub struct AudioMetadata {
    pub sample_rate: u32,
    pub channels: u16,
    pub bits_per_sample: u16,
    pub duration_seconds: f64,
    pub bpm: Option<f32>,
    pub key: Option<String>,
    pub title: Option<String>,
    pub artist: Option<String>,
}

/// Audio file data
#[derive(Debug, Clone)]
pub struct AudioFile {
    pub metadata: AudioMetadata,
    pub samples: Vec<Vec<f32>>, // Channels as separate vectors
}

/// Format error types
#[derive(Debug, Clone)]
pub enum FormatError {
    UnsupportedFormat,
    InvalidFile,
    IoError(String),
    CorruptedData,
}

impl std::fmt::Display for FormatError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            FormatError::UnsupportedFormat => write!(f, "Unsupported audio format"),
            FormatError::InvalidFile => write!(f, "Invalid audio file"),
            FormatError::IoError(msg) => write!(f, "IO error: {}", msg),
            FormatError::CorruptedData => write!(f, "Corrupted audio data"),
        }
    }
}

impl std::error::Error for FormatError {}

/// MixxAudioFormat - Audio file format handler
pub struct MixxAudioFormat;

impl MixxAudioFormat {
    /// Read WAV file
    pub fn read_wav<P: AsRef<Path>>(path: P) -> Result<AudioFile, FormatError> {
        let file = File::open(path).map_err(|e| FormatError::IoError(e.to_string()))?;
        let mut reader = BufReader::new(file);

        // Read WAV header
        let mut header = [0u8; 12];
        reader
            .read_exact(&mut header)
            .map_err(|e| FormatError::IoError(e.to_string()))?;

        // Check RIFF header
        if &header[0..4] != b"RIFF" {
            return Err(FormatError::InvalidFile);
        }

        // Check WAVE format
        if &header[8..12] != b"WAVE" {
            return Err(FormatError::UnsupportedFormat);
        }

        // Read fmt chunk
        let mut fmt_chunk_id = [0u8; 4];
        reader
            .read_exact(&mut fmt_chunk_id)
            .map_err(|e| FormatError::IoError(e.to_string()))?;

        if &fmt_chunk_id != b"fmt " {
            return Err(FormatError::InvalidFile);
        }

        let mut fmt_chunk_size = [0u8; 4];
        reader
            .read_exact(&mut fmt_chunk_size)
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        let fmt_size = u32::from_le_bytes(fmt_chunk_size) as usize;

        let mut fmt_data = vec![0u8; fmt_size];
        reader
            .read_exact(&mut fmt_data)
            .map_err(|e| FormatError::IoError(e.to_string()))?;

        // Parse fmt chunk
        let _audio_format = u16::from_le_bytes([fmt_data[0], fmt_data[1]]);
        let channels = u16::from_le_bytes([fmt_data[2], fmt_data[3]]);
        let sample_rate = u32::from_le_bytes([
            fmt_data[4],
            fmt_data[5],
            fmt_data[6],
            fmt_data[7],
        ]);
        let bits_per_sample = u16::from_le_bytes([fmt_data[14], fmt_data[15]]);

        // Find data chunk
        let mut chunk_id = [0u8; 4];
        loop {
            reader
                .read_exact(&mut chunk_id)
                .map_err(|e| FormatError::IoError(e.to_string()))?;

            if &chunk_id == b"data" {
                break;
            }

            // Skip unknown chunks
            let mut chunk_size = [0u8; 4];
            reader
                .read_exact(&mut chunk_size)
                .map_err(|e| FormatError::IoError(e.to_string()))?;
            let size = u32::from_le_bytes(chunk_size) as u64;
            // Skip chunk data
            let mut skip_buf = vec![0u8; size.min(4096) as usize];
            let mut remaining = size;
            while remaining > 0 {
                let to_read = remaining.min(4096);
                reader
                    .read_exact(&mut skip_buf[..to_read as usize])
                    .map_err(|e| FormatError::IoError(e.to_string()))?;
                remaining -= to_read;
            }
        }

        // Read data chunk size
        let mut data_size = [0u8; 4];
        reader
            .read_exact(&mut data_size)
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        let data_len = u32::from_le_bytes(data_size) as usize;

        // Read audio data
        let bytes_per_sample = bits_per_sample / 8;
        let samples_per_channel = data_len / (bytes_per_sample as usize * channels as usize);

        let mut samples = vec![vec![0.0f32; samples_per_channel]; channels as usize];

        match bits_per_sample {
            16 => {
                let mut buffer = vec![0u8; data_len];
                reader
                    .read_exact(&mut buffer)
                    .map_err(|e| FormatError::IoError(e.to_string()))?;

                for i in 0..samples_per_channel {
                    for ch in 0..channels as usize {
                        let idx = (i * channels as usize + ch) * 2;
                        let sample = i16::from_le_bytes([buffer[idx], buffer[idx + 1]]) as f32
                            / 32768.0;
                        samples[ch][i] = sample;
                    }
                }
            }
            24 => {
                // 24-bit support (read as 32-bit with padding)
                let mut buffer = vec![0u8; data_len];
                reader
                    .read_exact(&mut buffer)
                    .map_err(|e| FormatError::IoError(e.to_string()))?;

                for i in 0..samples_per_channel {
                    for ch in 0..channels as usize {
                        let idx = (i * channels as usize + ch) * 3;
                        let sample = i32::from_le_bytes([
                            buffer[idx],
                            buffer[idx + 1],
                            buffer[idx + 2],
                            0,
                        ]) as f32
                            / 8388608.0;
                        samples[ch][i] = sample;
                    }
                }
            }
            32 => {
                let mut buffer = vec![0u8; data_len];
                reader
                    .read_exact(&mut buffer)
                    .map_err(|e| FormatError::IoError(e.to_string()))?;

                for i in 0..samples_per_channel {
                    for ch in 0..channels as usize {
                        let idx = (i * channels as usize + ch) * 4;
                        let sample = f32::from_le_bytes([
                            buffer[idx],
                            buffer[idx + 1],
                            buffer[idx + 2],
                            buffer[idx + 3],
                        ]);
                        samples[ch][i] = sample;
                    }
                }
            }
            _ => return Err(FormatError::UnsupportedFormat),
        }

        let duration = samples_per_channel as f64 / sample_rate as f64;

        Ok(AudioFile {
            metadata: AudioMetadata {
                sample_rate,
                channels,
                bits_per_sample,
                duration_seconds: duration,
                bpm: None,
                key: None,
                title: None,
                artist: None,
            },
            samples,
        })
    }

    /// Write WAV file
    pub fn write_wav<P: AsRef<Path>>(
        path: P,
        samples: &[Vec<f32>],
        sample_rate: u32,
        bits_per_sample: u16,
    ) -> Result<(), FormatError> {
        if samples.is_empty() || samples[0].is_empty() {
            return Err(FormatError::InvalidFile);
        }

        let channels = samples.len() as u16;
        let samples_per_channel = samples[0].len();

        // Verify all channels have same length
        for channel in samples {
            if channel.len() != samples_per_channel {
                return Err(FormatError::InvalidFile);
            }
        }

        let file = File::create(path).map_err(|e| FormatError::IoError(e.to_string()))?;
        let mut writer = BufWriter::new(file);

        let bytes_per_sample = bits_per_sample / 8;
        let data_size = (samples_per_channel * channels as usize * bytes_per_sample as usize) as u32;

        // Write RIFF header
        writer.write_all(b"RIFF").map_err(|e| FormatError::IoError(e.to_string()))?;
        writer
            .write_all(&(36u32 + data_size).to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        writer.write_all(b"WAVE").map_err(|e| FormatError::IoError(e.to_string()))?;

        // Write fmt chunk
        writer.write_all(b"fmt ").map_err(|e| FormatError::IoError(e.to_string()))?;
        writer
            .write_all(&16u32.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?; // fmt chunk size
        writer
            .write_all(&1u16.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?; // PCM format
        writer
            .write_all(&channels.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        writer
            .write_all(&sample_rate.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        let byte_rate = sample_rate as u32 * channels as u32 * bytes_per_sample as u32;
        writer
            .write_all(&byte_rate.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        let block_align = channels as u16 * bytes_per_sample as u16;
        writer
            .write_all(&block_align.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;
        writer
            .write_all(&bits_per_sample.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;

        // Write data chunk
        writer.write_all(b"data").map_err(|e| FormatError::IoError(e.to_string()))?;
        writer
            .write_all(&data_size.to_le_bytes())
            .map_err(|e| FormatError::IoError(e.to_string()))?;

        // Write audio data
        match bits_per_sample {
            16 => {
                for i in 0..samples_per_channel {
                    for channel in samples {
                        let sample = (channel[i].clamp(-1.0, 1.0) * 32767.0) as i16;
                        writer
                            .write_all(&sample.to_le_bytes())
                            .map_err(|e| FormatError::IoError(e.to_string()))?;
                    }
                }
            }
            32 => {
                for i in 0..samples_per_channel {
                    for channel in samples {
                        let sample = channel[i].clamp(-1.0, 1.0);
                        writer
                            .write_all(&sample.to_le_bytes())
                            .map_err(|e| FormatError::IoError(e.to_string()))?;
                    }
                }
            }
            _ => return Err(FormatError::UnsupportedFormat),
        }

        writer.flush().map_err(|e| FormatError::IoError(e.to_string()))?;
        Ok(())
    }
}


#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_write_and_read_wav() {
        // Create test audio data
        let sample_rate = 44100;
        let channels = 2;
        let samples_per_channel = 1000;

        let mut samples = vec![];
        for _ch in 0..channels {
            let channel_samples: Vec<f32> = (0..samples_per_channel)
                .map(|i| (2.0 * std::f32::consts::PI * 440.0 * i as f32 / sample_rate as f32).sin())
                .collect();
            samples.push(channel_samples);
        }

        // Write to temp file
        let path = "/tmp/test_mixx_audio.wav";
        MixxAudioFormat::write_wav(path, &samples, sample_rate, 32).unwrap();

        // Read back
        let audio_file = MixxAudioFormat::read_wav(path).unwrap();
        assert_eq!(audio_file.metadata.sample_rate, sample_rate);
        assert_eq!(audio_file.metadata.channels, channels);
        assert_eq!(audio_file.samples.len(), channels as usize);

        // Cleanup
        let _ = fs::remove_file(path);
    }
}

