import React, { useMemo } from "react";
import type { TrapSampleWaveform } from "../../types/sampler";
import { PluginKnob } from "../PluginKnob";
import { hexToRgba } from "../../utils/ALS";

interface InstantSampleFlipPanelProps {
  waveform: TrapSampleWaveform | null;
  chopSensitivity: number;
  phaseOffset: number;
  onChopSensitivityChange: (value: number) => void;
  onPhaseOffsetChange: (value: number) => void;
}

const buildPath = (wave: TrapSampleWaveform | null) => {
  if (!wave || wave.samples.length === 0) {
    return "M 0 50 L 100 50";
  }

  const samples = wave.samples;
  const step = Math.max(1, Math.floor(samples.length / 128));
  const points: string[] = [];
  for (let i = 0; i < samples.length; i += step) {
    const value = samples[i];
    const x = (i / (samples.length - 1)) * 100;
    const y = 50 - value * 45;
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return points.length ? `M ${points.join(" L ")}` : "M 0 50 L 100 50";
};

const InstantSampleFlipPanel: React.FC<InstantSampleFlipPanelProps> = ({
  waveform,
  chopSensitivity,
  phaseOffset,
  onChopSensitivityChange,
  onPhaseOffsetChange,
}) => {
  const path = useMemo(() => buildPath(waveform), [waveform]);
  const playbackLabel = useMemo(() => {
    if (!waveform) return "Idle";
    const velocityIndex = Math.round(phaseOffset * 3);
    return ["Velvet Flip", "Rapid Slice", "Glide Loop", "Strobe Flip"][
      velocityIndex
    ];
  }, [phaseOffset, waveform]);

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-[rgba(10,12,20,0.88)] p-5 shadow-[0_24px_70px_rgba(4,12,26,0.58)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.36em] text-ink/60">
          Instant Sample Flip Workflow
        </span>
        <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-cyan-200">
          {playbackLabel}
        </span>
      </div>
      <div className="relative h-40 overflow-hidden rounded-2xl border border-white/12 bg-[rgba(5,8,18,0.86)]">
        <svg viewBox="0 0 100 100" className="h-full w-full">
          <defs>
            <linearGradient id="wavefill" x1="0%" x2="0%" y1="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.55)" />
              <stop offset="100%" stopColor="rgba(14,165,233,0.15)" />
            </linearGradient>
          </defs>
          <path
            d={path}
            stroke="url(#wavefill)"
            strokeWidth="2.4"
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(0,0,0,0.45)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[rgba(0,0,0,0.38)]" />
      </div>
      <div className="grid grid-cols-[2fr_3fr] gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.32em] text-ink/50">
            Chop Sensitivity
          </span>
          <div className="flex items-center gap-3">
            <PluginKnob
              label="Chop"
              value={chopSensitivity}
              onChange={onChopSensitivityChange}
            />
            <div className="flex-1 rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400 shadow-[0_0_12px_rgba(56,189,248,0.65)]"
                  style={{ width: `${Math.round(chopSensitivity * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-ink/45">
                {chopSensitivity > 0.7
                  ? "Staccato Flip"
                  : chopSensitivity > 0.4
                  ? "Syncopated Glide"
                  : "Wide Slice"}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <span className="text-[10px] uppercase tracking-[0.32em] text-ink/50">
            Phase Offset
          </span>
          <div className="flex items-center gap-3">
            <PluginKnob
              label="Phase"
              value={phaseOffset}
              onChange={onPhaseOffsetChange}
            />
            <div className="flex-1 rounded-xl border border-white/10 bg-black/40 p-3">
              <div className="relative h-20">
                <div className="absolute inset-x-0 top-1/2 h-[1px] bg-white/10" />
                <div
                  className="absolute left-0 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full border border-cyan-200/60 bg-cyan-200/20 shadow-[0_0_12px_rgba(94,234,212,0.4)]"
                  style={{ transform: `translate(${phaseOffset * 180}px, -50%)` }}
                />
              </div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-ink/45">
                {phaseOffset < 0.33
                  ? "Velvet Blend"
                  : phaseOffset < 0.66
                  ? "Phase Drift"
                  : "Offset Snap"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InstantSampleFlipPanel;



