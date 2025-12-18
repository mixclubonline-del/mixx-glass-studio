/**
 * FLOW CONSOLE ANALYZER VIEW
 * 
 * Console-wide analyzer tools: Spectrum, Correlation, LUFS.
 * Flow Doctrine: ALS-driven, color/energy visualization, no raw numbers where avoidable.
 */

import React, { useRef, useEffect, useState, useMemo } from 'react';
import { usePulseAnimation } from '../mixxglass';
import type { TrackData } from '../../App';
import type { TrackALSFeedback } from '../../utils/ALS';
import { hexToRgba } from '../../utils/ALS';
import { TRACK_COLOR_SWATCH } from '../../utils/ALS';
import { spacing, typography, layout, effects, transitions, composeStyles } from '../../design-system';

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
    <div style={composeStyles(
      layout.flex.container('col'),
      { height: '100%' },
      spacing.gap(4)
    )}>
      <canvas
        ref={canvasRef}
        width={1200}
        height={400}
        style={composeStyles(
          layout.width.full,
          { height: '100%' },
          effects.border.radius.xl,
          {
            border: '1px solid rgba(102, 140, 198, 0.6)',
          }
        )}
      />
      <div style={composeStyles(
        layout.flex.container('row'),
        layout.flex.align.center,
        layout.flex.justify.between,
        spacing.px(4),
        spacing.py(3),
        effects.border.radius.xl,
        {
          border: '1px solid rgba(102, 140, 198, 0.6)',
          background: 'rgba(6,14,28,0.7)',
        }
      )}>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(6),
          typography.transform('uppercase'),
          typography.tracking.widest,
          {
            fontSize: '0.42rem',
            color: 'rgba(230, 240, 255, 0.6)',
          }
        )}>
          <div>
            <span style={{ display: 'block' }}>Frequency Range</span>
            <span style={composeStyles(
              typography.weight('semibold'),
              {
                fontSize: '0.55rem',
                color: '#e6f0ff',
              }
            )}>20 Hz - 20 kHz</span>
          </div>
          <div>
            <span style={{ display: 'block' }}>Resolution</span>
            <span style={composeStyles(
              typography.weight('semibold'),
              {
                fontSize: '0.55rem',
                color: '#e6f0ff',
              }
            )}>512 Bins</span>
          </div>
        </div>
        <div style={composeStyles(
          layout.flex.container('row'),
          layout.flex.align.center,
          spacing.gap(4)
        )}>
          {['Low', 'Mid', 'High'].map((band, idx) => {
            const startIdx = Math.floor((idx / 3) * spectrumData.length);
            const endIdx = Math.floor(((idx + 1) / 3) * spectrumData.length);
            const avg = Array.from(spectrumData.slice(startIdx, endIdx)).reduce((a, b) => a + b, 0) / (endIdx - startIdx);
            const hue = 210 + idx * 30;
            return (
              <div key={band} style={composeStyles(
                layout.flex.container('col'),
                layout.flex.align.center,
                spacing.gap(1)
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.42rem',
                    color: 'rgba(230, 240, 255, 0.55)',
                  }
                )}>{band}</span>
                <div
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      height: '8px',
                      width: `${avg * 100}%`,
                      maxWidth: '64px',
                      background: `linear-gradient(90deg, hsl(${hue}, 70%, 50%), hsl(${hue}, 90%, 70%))`,
                      boxShadow: `0 0 8px hsl(${hue}, 90%, 60%)`,
                    }
                  )}
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
      <div style={composeStyles(
        layout.flex.container('col'),
        layout.flex.align.center,
        layout.flex.justify.center,
        { height: '100%' },
        spacing.gap(8)
      )}>
        <div style={composeStyles(
          layout.position.relative
        )}>
          {/* Correlation Meter */}
          <div style={composeStyles(
            spacing.p(4),
            effects.border.radius.full,
            {
              width: '256px',
              height: '256px',
              border: '4px solid rgba(102, 140, 198, 0.6)',
              background: 'rgba(6,14,28,0.7)',
            }
          )}>
            <div style={composeStyles(
              layout.position.relative,
              layout.width.full,
              layout.height.full
            )}>
              {/* Arc Background */}
              <svg style={composeStyles(
                layout.width.full,
                layout.height.full,
                transitions.transform.combine('rotate(-90deg)')
              )}>
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
                  style={transitions.transition.standard('all', 300, 'ease-out')}
                />
              </svg>

              {/* Center Value */}
              <div style={composeStyles(
                layout.position.absolute,
                { inset: 0 },
                layout.flex.container('col'),
                layout.flex.align.center,
                layout.flex.justify.center
              )}>
                <span style={composeStyles(
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.45rem',
                    color: 'rgba(230, 240, 255, 0.6)',
                  }
                )}>
                  Correlation
                </span>
                <span
                  style={composeStyles(
                    typography.weight('bold'),
                    {
                      fontSize: '2.25rem',
                      color: `hsl(${correlation > 0 ? 120 : 0}, 70%, 65%)`,
                      textShadow: `0 0 20px hsl(${correlation > 0 ? 120 : 0}, 70%, 50%)`,
                    }
                  )}
                >
                  {correlation > 0.9 ? 'Mono' : correlation > 0.7 ? 'Wide' : correlation > 0 ? 'Stereo' : 'Phase!'}
                </span>
                <span style={composeStyles(
                  spacing.mt(1),
                  typography.transform('uppercase'),
                  typography.tracking.widest,
                  {
                    fontSize: '0.42rem',
                    color: 'rgba(230, 240, 255, 0.5)',
                  }
                )}>
                  {correlation > 0.9 ? 'Strong Center' : correlation > 0.7 ? 'Balanced Spread' : correlation > 0 ? 'Full Width' : 'Check Phase'}
                </span>
              </div>
            </div>
          </div>

          {/* Track Correlation Indicators */}
          <div style={composeStyles(
            layout.position.absolute,
            { bottom: '-48px', left: '50%' },
            transitions.transform.combine('translateX(-50%)'),
            layout.flex.container('row'),
            spacing.gap(2)
          )}>
            {tracks.slice(0, 4).map((track) => {
              const feedback = trackFeedbackMap[track.id];
              const { glow } = TRACK_COLOR_SWATCH[track.trackColor];
              return (
                <div
                  key={track.id}
                  style={composeStyles(
                    effects.border.radius.full,
                    {
                      width: '8px',
                      height: '8px',
                      background: hexToRgba(glow, 0.8),
                      boxShadow: `0 0 8px ${hexToRgba(glow, 0.6)}`,
                      opacity: 0.6 + (feedback?.intensity ?? 0) * 0.4,
                    }
                  )}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderLUFS = () => (
    <div style={composeStyles(
      layout.flex.container('col'),
      { height: '100%' },
      spacing.gap(6)
    )}>
      <div style={composeStyles(
        layout.grid.container(3),
        spacing.gap(4)
      )}>
        {(['i', 's', 'm'] as const).map((key) => {
          const value = lufs[key];
          const label = key === 'i' ? 'Integrated' : key === 's' ? 'Short Term' : 'Momentary';
          const color = value > -16 ? 'red' : value > -18 ? 'yellow' : 'green';

          return (
            <PulsingLUFSIndicator
              key={key}
              value={value}
              label={label}
            />
          );
        })}
      </div>

      {/* LUFS History Graph */}
      <div style={composeStyles(
        { flex: 1 },
        spacing.p(4),
        effects.border.radius.xl,
        {
          border: '1px solid rgba(102, 140, 198, 0.6)',
          background: 'rgba(6,14,28,0.7)',
        }
      )}>
        <div style={composeStyles(
          spacing.mb(2),
          typography.transform('uppercase'),
          typography.tracking.widest,
          {
            fontSize: '0.45rem',
            color: 'rgba(230, 240, 255, 0.6)',
          }
        )}>
          Loudness Trend
        </div>
        <div style={composeStyles(
          layout.width.full,
          spacing.p(2),
          effects.border.radius.lg,
          {
            height: '128px',
            background: 'rgba(4,8,18,0.8)',
          }
        )}>
          {/* Simplified trend visualization */}
          <div style={composeStyles(
            layout.position.relative,
            layout.width.full,
            layout.height.full
          )}>
            <div style={composeStyles(
              layout.position.absolute,
              { inset: 0 },
              layout.flex.container('row'),
              layout.flex.align.end,
              layout.flex.justify.around
            )}>
              {Array.from({ length: 20 }).map((_, i) => {
                const height = 0.4 + Math.random() * 0.6;
                const target = -18;
                const value = lufs.i;
                const hue = value > -16 ? 0 : value > -18 ? 60 : 120;
                return (
                  <div
                    key={i}
                    style={composeStyles(
                      { flex: 1 },
                      effects.border.radius.custom('4px 4px 0 0'),
                      {
                        height: `${height * 100}%`,
                        background: `linear-gradient(180deg, hsl(${hue}, 70%, 55%), hsl(${hue}, 90%, 70%))`,
                        opacity: 0.6 + height * 0.4,
                        margin: '0 1px',
                      }
                    )}
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
    <div 
      className={className}
      style={composeStyles(
        layout.flex.container('col'),
        { height: '100%' },
        spacing.gap(4),
        spacing.px(6),
        spacing.py(4),
      )}
    >
      {analyzerType === 'spectrum' && renderSpectrum()}
      {analyzerType === 'correlation' && renderCorrelation()}
      {analyzerType === 'lufs' && renderLUFS()}
    </div>
  );
};

// FLOW Doctrine: Convert LUFS to energy vocabulary
const lufsToEnergy = (lufs: number): string => {
  if (!isFinite(lufs) || lufs < -50) return "Silent";
  if (lufs < -30) return "Quiet";
  if (lufs < -20) return "Subtle";
  if (lufs < -16) return "Moderate";
  if (lufs < -12) return "Present";
  if (lufs < -8) return "Warm";
  if (lufs < -4) return "Hot";
  return "Loud";
};

// Component for pulsing LUFS indicator
const PulsingLUFSIndicator: React.FC<{
  value: number;
  label: string;
}> = ({ value, label }) => {
  const pulseGlow = usePulseAnimation(0.3, 0.5, 2000, 'ease-in-out');
  const color = value > -16 ? 'red' : value > -18 ? 'yellow' : 'green';
  const colorValue = color === 'red' ? '#ef4444' : color === 'yellow' ? '#eab308' : '#10b981';
  
  const boxShadow = value > -16
    ? `0 0 ${8 + pulseGlow * 8}px rgba(239,68,68, ${0.3 + pulseGlow * 0.2})`
    : undefined;

  return (
    <div
      style={composeStyles(
        layout.flex.container('col'),
        layout.flex.align.center,
        spacing.gap(3),
        spacing.p(6),
        effects.border.radius.xl,
        {
          border: '1px solid rgba(102, 140, 198, 0.6)',
          background: 'rgba(6,14,28,0.7)',
          boxShadow,
        }
      )}
    >
      <span style={composeStyles(
        typography.transform('uppercase'),
        typography.tracking.widest,
        {
          fontSize: '0.45rem',
          color: 'rgba(230, 240, 255, 0.6)',
        }
      )}>
        {label}
      </span>
      <span
        style={composeStyles(
          typography.weight('bold'),
          {
            fontSize: '1.875rem',
            color: colorValue,
          }
        )}
      >
        {lufsToEnergy(value)}
      </span>
      <span style={composeStyles(
        typography.transform('uppercase'),
        typography.tracking.widest,
        {
          fontSize: '0.42rem',
          color: 'rgba(230, 240, 255, 0.5)',
        }
      )}>
        LEVEL
      </span>
    </div>
  );
};

export default FlowConsoleAnalyzerView;










