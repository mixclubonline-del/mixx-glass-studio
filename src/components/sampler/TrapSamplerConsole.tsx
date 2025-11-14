import React, { useMemo } from "react";
import TrapPadSurface from "./TrapPadSurface";
import InstantSampleFlipPanel from "./InstantSampleFlipPanel";
import Multi808FusionPanel from "./Multi808FusionPanel";
import { useTrapSampler } from "../../hooks/useTrapSampler";
import type { TrapSamplerLayerId } from "../../types/sampler";
import { hexToRgba } from "../../utils/ALS";
import { SamplerIcon } from "../icons";

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
    <aside className="flex w-full flex-col gap-8 rounded-[48px] border border-white/12 bg-[rgba(4,8,18,0.92)] px-10 py-9 shadow-[0_60px_160px_rgba(4,12,26,0.78)] backdrop-blur-[36px]">
      <header className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 shadow-[0_0_18px_rgba(148,163,255,0.6)]">
              <SamplerIcon className="w-4 h-4 text-indigo-200" />
            </div>
            <p className="text-[12px] uppercase tracking-[0.42em] text-ink/55">
              Mixx Drum Grid
            </p>
          </div>
          <h2 className="pt-1 text-xl font-semibold tracking-[0.24em] text-ink">
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

      <div className="grid gap-5 xl:grid-cols-1">
        <InstantSampleFlipPanel
          waveform={snapshot.waveform}
          chopSensitivity={snapshot.chopSensitivity}
          phaseOffset={snapshot.phaseOffset}
          onChopSensitivityChange={sampler.setChopSensitivity}
          onPhaseOffsetChange={sampler.setPhaseOffset}
        />
        <Multi808FusionPanel
          pad={activePad}
          phaseOffset={snapshot.phaseOffset}
          onPhaseOffsetChange={sampler.setPhaseOffset}
          onLayerChange={(layerId: TrapSamplerLayerId, patch) =>
            sampler.updateLayer(snapshot.focusedPadId, layerId, patch)
          }
        />
      </div>
    </aside>
  );
};

export default TrapSamplerConsole;



