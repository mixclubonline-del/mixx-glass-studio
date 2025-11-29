/**
 * FLOW CONSOLE ANALYZER VIEW
 * 
 * Console-wide analyzer tools: Spectrum, Correlation, LUFS.
 * Flow Doctrine: ALS-driven, color/energy visualization, no raw numbers where avoidable.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { TrackData } from '../../App';
import type { TrackALSFeedback } from '../../utils/ALS';
import { hexToRgba } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';

export type AnalyzerType = 'spectrum' | 'correlation' | 'lufs';

interface FlowConsoleAnalyzerViewProps {
  analyzerType: AnalyzerType;
  tracks: TrackData[];
  trackFeedbackMap: Record<string, TrackALSFeedback>;
  masterAnalysis?: {
    level: number;
    transient: boolean;
    waveform: Uint8Array;
  };
  className?: string;
}

export const FlowConsoleAnalyzerView: React.FC<FlowConsoleAnalyzerViewProps> = ({
  analyzerType,
  tracks,
  trackFeedbackMap,
  masterAnalysis,
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [spectrumData, setSpectrumData] = useState<Float32Array>(new Float32Array(512));
  const [correlation, setCorrelation] = useState(0.85);
  const [lufs, setLufs] = useState({ i: -18.5, s: -16.2, m: -14.8 });

  // Simulate spectrum data from master analysis
  useEffect(() => {
    if (analyzerType !== 'spectrum') return;

    const interval = setInterval(() => {
      if (masterAnalysis?.waveform) {
        // Convert waveform to frequency spectrum (simplified)
        const spectrum = new Float32Array(512);
        for (let i = 0; i < spectrum.length; i++) {
          const index = Math.floor((i / spectrum.length) * masterAnalysis.waveform.length);
          const raw = masterAnalysis.waveform[index] / 255;
          spectrum[i] = raw * (0.7 + Math.random() * 0.3);
        }
        setSpectrumData(spectrum);
      } else {
        // Generate synthetic spectrum for demo
        const spectrum = new Float32Array(512);
        for (let i = 0; i < spectrum.length; i++) {
          spectrum[i] = Math.random() * 0.6 * Math.pow(1 - i / spectrum.length, 2);
        }
        setSpectrumData(spectrum);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [analyzerType, masterAnalysis]);

  // Simulate correlation data
  useEffect(() => {
    if (analyzerType !== 'correlation') return;

    const interval = setInterval(() => {
      setCorrelation(0.7 + Math.random() * 0.3);
    }, 200);

    return () => clearInterval(interval);
  }, [analyzerType]);

  // Simulate LUFS data
  useEffect(() => {
    if (analyzerType !== 'lufs') return;

    const interval = setInterval(() => {
      const base = -20;
      setLufs({
        i: base + Math.random() * 4,
        s: base - 2 + Math.random() * 4,
        m: base - 4 + Math.random() * 4,
      });
    }, 500);

    return () => clearInterval(interval);
  }, [analyzerType]);

  // Draw spectrum canvas
  useEffect(() => {
    if (analyzerType !== 'spectrum' || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = canvas;
    const barWidth = width / spectrumData.length;

    // Clear with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, 'rgba(8, 12, 24, 0.95)');
    bgGradient.addColorStop(1, 'rgba(4, 8, 18, 0.95)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw spectrum bars
    for (let i = 0; i < spectrumData.length; i++) {
      const value = spectrumData[i];
      const barHeight = value * height * 0.9;
      const x = i * barWidth;
      const hue = 210 + (i / spectrumData.length) * 60;
      const saturation = 70 + value * 30;
      const lightness = 50 + value * 30;

      const gradient = ctx.createLinearGradient(x, height, x, height - barHeight);
      gradient.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`);
      gradient.addColorStop(1, `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 1)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

      // Peak hold
      if (value > 0.8) {
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, 85%, 0.9)`;
        ctx.fillRect(x, height - barHeight - 2, barWidth - 1, 2);
      }
    }
  }, [analyzerType, spectrumData]);

  const renderSpectrum = () => (
    <div className="flex h-full flex-col gap-4">
      <canvas
        ref={canvasRef}
        width={1200}
        height={400}
        className="h-full w-full rounded-xl border border-glass-border/60"
      />
      <div className="flex items-center justify-between rounded-xl border border-glass-border/60 bg-[rgba(6,14,28,0.7)] px-4 py-3">
        <div className="flex items-center gap-6 text-[0.42rem] uppercase tracking-[0.3em] text-ink/60">
          <div>
            <span className="block">Frequency Range</span>
            <span className="text-[0.55rem] font-semibold text-ink">20 Hz - 20 kHz</span>
          </div>
          <div>
            <span className="block">Resolution</span>
            <span className="text-[0.55rem] font-semibold text-ink">512 Bins</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {['Low', 'Mid', 'High'].map((band, idx) => {
            const startIdx = Math.floor((idx / 3) * spectrumData.length);
            const endIdx = Math.floor(((idx + 1) / 3) * spectrumData.length);
            const avg = Array.from(spectrumData.slice(startIdx, endIdx)).reduce((a, b) => a + b, 0) / (endIdx - startIdx);
            const hue = 210 + idx * 30;
            return (
              <div key={band} className="flex flex-col items-center gap-1">
                <span className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/55">{band}</span>
                <div
                  className="h-2 w-16 rounded-full"
                  style={{
                    background: `linear-gradient(90deg, hsl(${hue}, 70%, 50%), hsl(${hue}, 90%, 70%))`,
                    width: `${avg * 100}%`,
                    boxShadow: `0 0 8px hsl(${hue}, 90%, 60%)`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCorrelation = () => {
    const normalizedCorr = (correlation + 1) / 2; // -1 to +1 → 0 to 1

    return (
      <div className="flex h-full flex-col items-center justify-center gap-8">
        <div className="relative">
          {/* Correlation Meter */}
          <div className="h-64 w-64 rounded-full border-4 border-glass-border/60 bg-[rgba(6,14,28,0.7)] p-4">
            <div className="relative h-full w-full">
              {/* Arc Background */}
              <svg className="h-full w-full -rotate-90 transform">
                <path
                  d="M 128 128 m -100 0 a 100 100 0 1 1 200 0"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="8"
                />
                <path
                  d="M 128 128 m -100 0 a 100 100 0 1 1 200 0"
                  fill="none"
                  stroke={`hsl(${correlation > 0 ? 120 : 0}, 70%, 60%)`}
                  strokeWidth="8"
                  strokeDasharray={`${normalizedCorr * 628} 628`}
                  className="transition-all duration-300"
                />
              </svg>

              {/* Center Value */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/60">
                  Correlation
                </span>
                <span
                  className="text-4xl font-bold"
                  style={{
                    color: `hsl(${correlation > 0 ? 120 : 0}, 70%, 65%)`,
                    textShadow: `0 0 20px hsl(${correlation > 0 ? 120 : 0}, 70%, 50%)`,
                  }}
                >
                  {correlation.toFixed(2)}
                </span>
                <span className="mt-1 text-[0.42rem] uppercase tracking-[0.3em] text-ink/50">
                  {correlation > 0.9 ? 'Mono' : correlation > 0.7 ? 'Wide' : correlation > 0 ? 'Stereo' : 'Out of Phase'}
                </span>
              </div>
            </div>
          </div>

          {/* Track Correlation Indicators */}
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 flex gap-2">
            {tracks.slice(0, 4).map((track) => {
              const feedback = trackFeedbackMap[track.id];
              const { glow } = TRACK_COLOR_SWATCH[track.trackColor];
              return (
                <div
                  key={track.id}
                  className="h-2 w-2 rounded-full"
                  style={{
                    background: hexToRgba(glow, 0.8),
                    boxShadow: `0 0 8px ${hexToRgba(glow, 0.6)}`,
                    opacity: 0.6 + (feedback?.intensity ?? 0) * 0.4,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLUFS = () => (
    <div className="flex h-full flex-col gap-6">
      <div className="grid grid-cols-3 gap-4">
        {(['i', 's', 'm'] as const).map((key) => {
          const value = lufs[key];
          const label = key === 'i' ? 'Integrated' : key === 's' ? 'Short Term' : 'Momentary';
          const color = value > -16 ? 'red' : value > -18 ? 'yellow' : 'green';

          return (
            <motion.div
              key={key}
              className="flex flex-col items-center gap-3 rounded-xl border border-glass-border/60 bg-[rgba(6,14,28,0.7)] p-6"
              animate={{
                boxShadow: value > -16 ? [`0 0 8px rgba(239,68,68,0.3)`, `0 0 16px rgba(239,68,68,0.5)`, `0 0 8px rgba(239,68,68,0.3)`] : [],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-[0.45rem] uppercase tracking-[0.3em] text-ink/60">
                {label}
              </span>
              <span
                className="text-3xl font-bold"
                style={{
                  color: color === 'red' ? '#ef4444' : color === 'yellow' ? '#eab308' : '#10b981',
                }}
              >
                {value.toFixed(1)}
              </span>
              <span className="text-[0.42rem] uppercase tracking-[0.3em] text-ink/50">
                LUFS
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* LUFS History Graph */}
      <div className="flex-1 rounded-xl border border-glass-border/60 bg-[rgba(6,14,28,0.7)] p-4">
        <div className="mb-2 text-[0.45rem] uppercase tracking-[0.3em] text-ink/60">
          Loudness Trend
        </div>
        <div className="h-32 w-full rounded-lg bg-[rgba(4,8,18,0.8)] p-2">
          {/* Simplified trend visualization */}
          <div className="relative h-full w-full">
            <div className="absolute inset-0 flex items-end justify-around">
              {Array.from({ length: 20 }).map((_, i) => {
                const height = 0.4 + Math.random() * 0.6;
                const target = -18;
                const value = lufs.i;
                const hue = value > -16 ? 0 : value > -18 ? 60 : 120;
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t"
                    style={{
                      height: `${height * 100}%`,
                      background: `linear-gradient(180deg, hsl(${hue}, 70%, 55%), hsl(${hue}, 90%, 70%))`,
                      opacity: 0.6 + height * 0.4,
                      margin: '0 1px',
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`flex h-full flex-col gap-4 px-6 py-4 ${className}`}>
      {analyzerType === 'spectrum' && renderSpectrum()}
      {analyzerType === 'correlation' && renderCorrelation()}
      {analyzerType === 'lufs' && renderLUFS()}
    </div>
  );
};

export default FlowConsoleAnalyzerView;



