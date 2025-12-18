import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAnimatePresence, AnimatePresence } from '../mixxglass';
import { useAudioExport } from '../../hooks/useAudioExport';
import { ExportBitDepth, ExportFormat } from '../../types/rust-audio';
import { useTimelineStore } from '../../state/timelineStore';
import './ExportModal.css';

interface ExportModalProps {
  onClose: () => void;
  /** Optional audio samples to export. If not provided, shows clip selector. */
  samples?: Float32Array;
  /** Sample rate of the audio */
  sampleRate?: number;
}

interface ExportSettings {
  format: 'wav16' | 'wav24' | 'wav32' | 'flac16' | 'flac24';
  sampleRate: number;
  selectedClipId: string | null;
  useNativeMastering: boolean;
  masteringProfile: number; // 0=Streaming, 1=Club, 2=Broadcast, 3=Vinyl, 4=Audiophile
}

const MASTERING_PROFILES = [
  { id: 0, name: 'Streaming (-14 LUFS)', lufs: -14 },
  { id: 1, name: 'Club (-8 LUFS)', lufs: -8 },
  { id: 2, name: 'Broadcast (-24 LUFS)', lufs: -24 },
  { id: 3, name: 'Vinyl (-10 LUFS)', lufs: -10 },
  { id: 4, name: 'Audiophile (-16 LUFS)', lufs: -16 },
];

// Check if running in Tauri
const isTauri = typeof window !== 'undefined' && '__TAURI__' in window;

const FORMAT_OPTIONS: { id: ExportSettings['format']; name: string; bitDepth: ExportBitDepth }[] = [
  { id: 'wav16', name: 'WAV 16-bit (CD Quality)', bitDepth: 16 },
  { id: 'wav24', name: 'WAV 24-bit (Pro Standard)', bitDepth: 24 },
  { id: 'wav32', name: 'WAV 32-bit Float (Archival)', bitDepth: 32 },
  { id: 'flac16', name: 'FLAC 16-bit (Lossless)', bitDepth: 16 },
  { id: 'flac24', name: 'FLAC 24-bit (Lossless)', bitDepth: 24 },
];

const SAMPLE_RATE_OPTIONS = [
  { value: 44100, label: '44.1 kHz (CD)' },
  { value: 48000, label: '48 kHz (Video)' },
  { value: 96000, label: '96 kHz (Hi-Res)' },
];

// Generate test sine wave for initial validation
function generateTestAudio(duration: number = 3, sampleRate: number = 48000): Float32Array {
  const numSamples = duration * sampleRate * 2; // stereo
  const samples = new Float32Array(numSamples);
  const freq = 440; // A4
  
  for (let i = 0; i < numSamples; i += 2) {
    const t = (i / 2) / sampleRate;
    const amplitude = 0.5 * Math.exp(-t * 0.5); // Fade out
    const value = amplitude * Math.sin(2 * Math.PI * freq * t);
    samples[i] = value;     // L
    samples[i + 1] = value; // R
  }
  
  return samples;
}

/**
 * Convert AudioBuffer to interleaved Float32Array for export
 */
function audioBufferToInterleaved(buffer: AudioBuffer): Float32Array {
  const channels = buffer.numberOfChannels;
  const length = buffer.length;
  const interleaved = new Float32Array(length * channels);
  
  if (channels === 1) {
    // Mono: duplicate to stereo
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      interleaved[i * 2] = channelData[i];
      interleaved[i * 2 + 1] = channelData[i];
    }
  } else {
    // Stereo or multi-channel: interleave first two channels
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(Math.min(1, channels - 1));
    for (let i = 0; i < length; i++) {
      interleaved[i * 2] = left[i];
      interleaved[i * 2 + 1] = right[i];
    }
  }
  
  return interleaved;
}

const ExportModal: React.FC<ExportModalProps> = ({
  onClose,
  samples: providedSamples,
  sampleRate: providedSampleRate = 48000,
}) => {
  // Access timeline store for clips and audio buffers
  const clips = useTimelineStore(state => state.clips);
  const audioBuffers = useTimelineStore(state => state.audioBuffers);
  
  // Memoize available clips with audio
  const availableClips = useMemo(() => {
    return clips.filter(clip => audioBuffers[clip.bufferId]);
  }, [clips, audioBuffers]);

  const [settings, setSettings] = useState<ExportSettings>({
    format: 'wav24',
    sampleRate: providedSampleRate,
    selectedClipId: availableClips.length > 0 ? availableClips[0].id : null,
    useNativeMastering: isTauri, // Default ON in Tauri
    masteringProfile: 0, // Streaming
  });
  
  const {
    isExporting,
    progress,
    error,
    lastExportPath,
    exportWithDialog,
    exportWithMastering,
    clearError,
  } = useAudioExport();

  const selectedFormat = FORMAT_OPTIONS.find(f => f.id === settings.format) ?? FORMAT_OPTIONS[1];
  const selectedClip = settings.selectedClipId 
    ? clips.find(c => c.id === settings.selectedClipId) 
    : null;

  const handleExport = useCallback(async () => {
    clearError();
    
    let audioSamples: Float32Array;
    let exportSampleRate = settings.sampleRate;
    
    if (providedSamples) {
      // Use provided samples (direct export)
      audioSamples = providedSamples;
    } else if (selectedClip && audioBuffers[selectedClip.bufferId]) {
      // Use clip's audio buffer
      const buffer = audioBuffers[selectedClip.bufferId];
      audioSamples = audioBufferToInterleaved(buffer);
      exportSampleRate = buffer.sampleRate; // Use original sample rate
    } else {
      // Fallback to test audio
      audioSamples = generateTestAudio(3, settings.sampleRate);
    }
    
    try {
      let result;
      
      if (settings.useNativeMastering && isTauri) {
        // Use Rust MasterChain processing
        console.log('[ExportModal] Using native Rust mastering (profile:', settings.masteringProfile, ')');
        result = await exportWithMastering({
          samples: audioSamples,
          sampleRate: exportSampleRate,
          channels: 2,
          bitDepth: selectedFormat.bitDepth,
          profile: settings.masteringProfile,
        });
      } else {
        // Standard export
        result = await exportWithDialog({
          samples: audioSamples,
          sampleRate: exportSampleRate,
          channels: 2,
          bitDepth: selectedFormat.bitDepth,
        });
      }
      
      if (result) {
        // Export successful - close modal after short delay
        setTimeout(() => onClose(), 1500);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  }, [providedSamples, settings, selectedFormat, selectedClip, audioBuffers, exportWithDialog, exportWithMastering, clearError, onClose]);

  const overlayAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 300, easing: 'ease-out' },
  });

  const modalAnimation = useAnimatePresence({
    isVisible: true,
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 200, easing: 'ease-out' },
  });

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
        onClick={onClose}
        style={overlayAnimation.style}
      >
        <div
          className="relative flex max-h-[80vh] w-[420px] flex-col rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-slate-900/95 to-cyan-900/30 p-6 shadow-2xl shadow-cyan-500/10"
          onClick={(e) => e.stopPropagation()}
          style={{
            opacity: modalAnimation.style.opacity,
            transform: `scale(${(modalAnimation.style as any).scale})`,
          }}
        >
          {/* Header */}
          <h2 className="mb-2 text-center text-lg font-bold tracking-[0.3em] text-cyan-100">
            AUDIO EXPORT
          </h2>
          <p className="mb-6 text-center text-xs text-cyan-300/60">
            Export with TPDF dithering via native Rust engine
          </p>

          {/* Clip Selector (only if no samples provided) */}
          {!providedSamples && availableClips.length > 0 && (
            <div className="mb-4">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
                Audio Source
              </label>
              <select
                value={settings.selectedClipId ?? ''}
                onChange={(e) => setSettings(s => ({ ...s, selectedClipId: e.target.value || null }))}
                className="w-full rounded-lg border border-cyan-500/30 bg-slate-800/80 px-3 py-2.5 text-sm text-cyan-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                disabled={isExporting}
                title="Select audio clip to export"
              >
                {availableClips.map(clip => (
                  <option key={clip.id} value={clip.id}>{clip.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* No clips message */}
          {!providedSamples && availableClips.length === 0 && (
            <div className="mb-4 rounded-lg border border-amber-500/30 bg-amber-900/20 p-3">
              <p className="text-center text-xs text-amber-300">
                ⚠ No audio clips loaded. Export will use test audio.
              </p>
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
              Format
            </label>
            <select
              value={settings.format}
              onChange={(e) => setSettings(s => ({ ...s, format: e.target.value as ExportSettings['format'] }))}
              className="w-full rounded-lg border border-cyan-500/30 bg-slate-800/80 px-3 py-2.5 text-sm text-cyan-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              disabled={isExporting}
              title="Select export format"
            >
              {FORMAT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>

          {/* Sample Rate */}
          <div className="mb-6">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
              Sample Rate
            </label>
            <select
              value={settings.sampleRate}
              onChange={(e) => setSettings(s => ({ ...s, sampleRate: Number(e.target.value) }))}
              className="w-full rounded-lg border border-cyan-500/30 bg-slate-800/80 px-3 py-2.5 text-sm text-cyan-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
              disabled={isExporting}
              title="Select output sample rate"
            >
              {SAMPLE_RATE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Native Mastering Toggle */}
          {isTauri && (
            <div className="mb-4">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-cyan-500/20 bg-slate-800/40 p-3 transition-colors hover:border-cyan-500/40">
                <input
                  type="checkbox"
                  checked={settings.useNativeMastering}
                  onChange={(e) => setSettings(s => ({ ...s, useNativeMastering: e.target.checked }))}
                  className="h-4 w-4 rounded border-cyan-500/50 bg-slate-700 text-cyan-500 focus:ring-cyan-500/50"
                  disabled={isExporting}
                />
                <div>
                  <span className="text-sm font-medium text-cyan-100">Use Native Mastering</span>
                  <p className="text-xs text-cyan-300/50">Process through Rust MasterChain with TPDF dithering</p>
                </div>
              </label>
              
              {/* Mastering Profile Selector */}
              {settings.useNativeMastering && (
                <div className="mt-3">
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-cyan-200/70">
                    Mastering Profile
                  </label>
                  <select
                    value={settings.masteringProfile}
                    onChange={(e) => setSettings(s => ({ ...s, masteringProfile: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-cyan-500/30 bg-slate-800/80 px-3 py-2.5 text-sm text-cyan-100 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400/50"
                    disabled={isExporting}
                    title="Select mastering profile"
                  >
                    {MASTERING_PROFILES.map(profile => (
                      <option key={profile.id} value={profile.id}>{profile.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Progress Bar */}
          {isExporting && (
            <div className="mb-4">
              <div className="h-2 overflow-hidden rounded-full bg-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-2 text-center text-xs text-cyan-300/60">
                Exporting... {progress}%
              </p>
            </div>
          )}

          {/* Success Message */}
          {lastExportPath && !isExporting && (
            <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-900/20 p-3">
              <p className="text-center text-xs text-emerald-300">
                ✓ Exported to: {lastExportPath.split('/').pop()}
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-900/20 p-3">
              <p className="text-center text-xs text-red-300">
                ✕ {error}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              className="rounded-lg bg-slate-700/50 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="rounded-lg bg-gradient-to-r from-cyan-600 to-emerald-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-500 hover:to-emerald-500 disabled:opacity-50"
            >
              {isExporting ? 'Exporting...' : '⬇ Export'}
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};

export default ExportModal;
