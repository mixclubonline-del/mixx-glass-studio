import React from "react";
import type {
  TrapPadLayerState,
  TrapSamplerLayerId,
  TrapPadState,
} from "../../types/sampler";
import { TRACK_COLOR_SWATCH, hexToRgba } from "../../utils/ALS";
import { PluginKnob } from "../PluginKnob";

interface Multi808FusionPanelProps {
  pad: TrapPadState | null;
  phaseOffset: number;
  onPhaseOffsetChange: (value: number) => void;
  onLayerChange: (
    layerId: TrapSamplerLayerId,
    patch: Partial<TrapPadLayerState>
  ) => void;
}

const LayerCard: React.FC<{
  layer: TrapPadLayerState;
  onChange: (patch: Partial<TrapPadLayerState>) => void;
}> = ({ layer, onChange }) => {
  const swatch = TRACK_COLOR_SWATCH[layer.color];

  return (
    <div
      className="flex flex-col gap-3 rounded-2xl border border-white/12 bg-[rgba(6,8,16,0.85)] p-4 shadow-[0_18px_45px_rgba(4,12,26,0.55)]"
      style={{
        boxShadow: `0 22px 55px ${hexToRgba(swatch.glow, 0.2)}`,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-[0.32em] text-ink/60">
          {layer.label}
        </span>
        <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[9px] uppercase tracking-[0.28em] text-ink/45">
          {layer.sampleName}
        </span>
      </div>
      <div className="grid grid-cols-4 gap-3">
        <div className="flex flex-col items-center gap-2">
          <PluginKnob
            label="Drive"
            value={layer.drive}
            onChange={(value) => onChange({ drive: value })}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <PluginKnob
            label="Decay"
            value={layer.decay}
            onChange={(value) => onChange({ decay: value })}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <PluginKnob
            label="Blend"
            value={layer.volume}
            onChange={(value) => onChange({ volume: value })}
          />
        </div>
        <div className="flex flex-col items-center gap-2">
          <PluginKnob
            label="Pitch"
            value={(layer.pitch + 12) / 24}
            onChange={(value) => onChange({ pitch: value * 24 - 12 })}
          />
        </div>
      </div>
    </div>
  );
};

const Multi808FusionPanel: React.FC<Multi808FusionPanelProps> = ({
  pad,
  phaseOffset,
  onPhaseOffsetChange,
  onLayerChange,
}) => {
  if (!pad) {
    return (
      <div className="rounded-3xl border border-white/12 bg-[rgba(6,8,16,0.78)] p-5 text-[11px] uppercase tracking-[0.32em] text-ink/40">
        Select a pad to tune the fusion layers.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-white/12 bg-[rgba(8,9,20,0.86)] p-5 shadow-[0_26px_70px_rgba(4,12,26,0.6)]">
      <div className="flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-[0.36em] text-ink/60">
          Multi-808 Fusion View
        </span>
        <div className="flex items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3 py-1">
          <span className="text-[9px] uppercase tracking-[0.28em] text-ink/40">
            Pad
          </span>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-ink/70">
            {pad.label}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-black/40 p-4">
        <PluginKnob
          label="Phase Grid"
          value={phaseOffset}
          onChange={onPhaseOffsetChange}
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-[0.28em] text-ink/45">
              Phase Drift Meter
            </span>
            <span className="text-[9px] uppercase tracking-[0.28em] text-cyan-200">
              {phaseOffset < 0.33
                ? "Locked"
                : phaseOffset < 0.66
                ? "Wavy"
                : "Off-axis"}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-violet-400 to-indigo-400 shadow-[0_0_16px_rgba(192,132,252,0.6)]"
              style={{ width: `${Math.round(phaseOffset * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {(Object.values(pad.layers) as TrapPadLayerState[]).map((layer) => (
          <LayerCard
            key={layer.id}
            layer={layer}
            onChange={(patch) => onLayerChange(layer.id, patch)}
          />
        ))}
      </div>
    </div>
  );
};

export default Multi808FusionPanel;


