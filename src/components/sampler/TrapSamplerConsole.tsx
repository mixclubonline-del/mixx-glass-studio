import React, { useMemo } from "react";
import TrapPadSurface from "./TrapPadSurface";
import InstantSampleFlipPanel from "./InstantSampleFlipPanel";
import Multi808FusionPanel from "./Multi808FusionPanel";
import { useTrapSampler } from "../../hooks/useTrapSampler";
import type { TrapSamplerLayerId } from "../../types/sampler";
import { hexToRgba } from "../../utils/ALS";

interface TrapSamplerConsoleProps {
  tempoBpm: number;
}

const tempoToDescriptor = (tempo: number) => {
  if (tempo >= 150) return { label: "Blaze Mode", color: "#f472b6" };
  if (tempo >= 125) return { label: "High Drive", color: "#38bdf8" };
  if (tempo >= 100) return { label: "Cruise Flow", color: "#34d399" };
  return { label: "Deep Glide", color: "#818cf8" };
};

const TrapSamplerConsole: React.FC<TrapSamplerConsoleProps> = ({ tempoBpm }) => {
  const sampler = useTrapSampler({ tempoBpm });
  const { snapshot } = sampler;
  const activePad = useMemo(
    () => snapshot.pads.find((pad) => pad.id === snapshot.focusedPadId) ?? null,
    [snapshot.focusedPadId, snapshot.pads]
  );
  const tempoDescriptor = tempoToDescriptor(tempoBpm);

  return (
    <aside className="flex w-full max-w-[420px] flex-col gap-5 rounded-[36px] border border-white/12 bg-[rgba(4,8,18,0.92)] p-6 shadow-[0_40px_120px_rgba(4,12,26,0.72)] backdrop-blur-[28px]">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.4em] text-ink/60">
            Mixx Drum Grid
          </p>
          <h2 className="text-lg font-semibold tracking-[0.2em] text-ink">
            Trap Pad Matrix
          </h2>
        </div>
        <div
          className="rounded-full border px-3 py-1 text-[10px] uppercase tracking-[0.32em]"
          style={{
            borderColor: hexToRgba(tempoDescriptor.color, 0.55),
            background: hexToRgba(tempoDescriptor.color, 0.16),
            color: tempoDescriptor.color,
          }}
        >
          {tempoDescriptor.label}
        </div>
      </header>

      <TrapPadSurface
        pads={snapshot.pads}
        focusedPadId={snapshot.focusedPadId}
        activePadId={snapshot.activePadId}
        onTriggerPad={sampler.triggerPad}
        onFocusPad={sampler.setFocusedPad}
      />

      <InstantSampleFlipPanel
        waveform={snapshot.waveform}
        chopSensitivity={snapshot.chopSensitivity}
        phaseOffset={snapshot.phaseOffset}
        onChopSensitivityChange={sampler.setChopSensitivity}
        onPhaseOffsetChange={(value) => {
          sampler.setPhaseOffset(value);
        }}
      />

      <Multi808FusionPanel
        pad={activePad}
        phaseOffset={snapshot.phaseOffset}
        onPhaseOffsetChange={sampler.setPhaseOffset}
        onLayerChange={(layerId: TrapSamplerLayerId, patch) =>
          sampler.updateLayer(snapshot.focusedPadId, layerId, patch)
        }
      />
    </aside>
  );
};

export default TrapSamplerConsole;


