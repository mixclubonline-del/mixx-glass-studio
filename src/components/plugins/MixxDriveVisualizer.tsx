import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type MixxDriveParams = {
  drive: number;
  warmth: number;
  mix: number;
  color: number;
};

const MixxDriveVisualizer: React.FC<VisualizerProps<MixxDriveParams>> = ({
  params,
  onChange,
}) => {
  return (
    <div className="relative w-full h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-[rgba(32,8,22,0.9)] via-[rgba(24,6,18,0.92)] to-[rgba(10,2,8,0.95)]">
      <div className="relative flex-1 rounded-2xl border border-rose-300/30 bg-black/20 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <radialGradient id="drive-core" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#fb7185" stopOpacity="0.35" />
              <stop offset="75%" stopColor="#0f172a" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#drive-core)" />
        </svg>
        <div className="absolute inset-6 rounded-xl bg-gradient-to-br from-white/8 via-transparent to-white/5 backdrop-blur-md border border-white/10 flex flex-col justify-center items-center gap-4">
          <div className="text-xs uppercase tracking-[0.4em] text-rose-200/75">
            Harmonic Density
          </div>
          <div className="flex gap-2">
            {[...Array(32)].map((_, index) => {
              const energy = (params.drive / 100) * (1 + Math.sin(index * 0.45) * 0.25);
              return (
                <div
                  key={index}
                  className="w-1 rounded-full"
                  style={{
                    height: `${40 + energy * 120}px`,
                    background: `linear-gradient(180deg, rgba(251,113,133,0.8), rgba(244,114,182,0.6))`,
                    opacity: 0.35 + energy * 0.5,
                  }}
                />
              );
            })}
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.35em] text-rose-100/70">
            Warmth {params.warmth}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <PluginKnob
          label="Drive"
          value={params.drive / 100}
          onChange={(v) => onChange("drive", Math.round(v * 100))}
        />
        <PluginKnob
          label="Warmth"
          value={params.warmth / 100}
          onChange={(v) => onChange("warmth", Math.round(v * 100))}
        />
        <PluginKnob
          label="Mix"
          value={params.mix / 100}
          onChange={(v) => onChange("mix", Math.round(v * 100))}
        />
        <PluginKnob
          label="Color"
          value={params.color / 100}
          onChange={(v) => onChange("color", Math.round(v * 100))}
        />
      </div>
    </div>
  );
};

export default MixxDriveVisualizer;

