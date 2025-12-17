import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type MixxGlueParams = {
  threshold: number;
  ratio: number;
  release: number;
  mix: number;
};

const MixxGlueVisualizer: React.FC<VisualizerProps<MixxGlueParams>> = ({
  params,
  onChange,
}) => {
  const compressionAmount = Math.max(0, (-params.threshold - 6) / 30);
  return (
    <div className="relative w-full h-full flex flex-col gap-6 p-6 bg-gradient-to-br from-[rgba(10,24,42,0.92)] via-[rgba(14,32,54,0.94)] to-[rgba(4,12,26,0.96)]">
      <div className="relative flex-1 rounded-2xl border border-sky-300/30 bg-black/20 overflow-hidden">
        <svg className="absolute inset-0 w-full h-full opacity-40">
          <defs>
            <linearGradient id="glue-grid" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <pattern id="compress-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path d="M24 0H0V24" fill="none" stroke="url(#glue-grid)" strokeWidth="0.75" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#compress-grid)" />
        </svg>
        <div className="absolute inset-6 rounded-xl border border-white/10 bg-black/25 backdrop-blur-xl flex flex-col justify-center items-center gap-6">
          <div className="text-xs uppercase tracking-[0.4em] text-sky-200/75">
            Gain Reduction
          </div>
          <div className="flex items-end gap-1 h-32">
            {[...Array(40)].map((_, idx) => {
              const ratioInfluence = params.ratio / 20;
              const height = 8 + compressionAmount * 90 * Math.sin(idx * 0.4 + ratioInfluence);
              const on = idx < compressionAmount * 40;
              return (
                <div
                  key={idx}
                  className={`w-1 rounded-full ${
                    on ? "bg-sky-400/80" : "bg-white/10"
                  }`}
                  style={{ height }}
                />
              );
            })}
          </div>
          <div className="text-[0.65rem] uppercase tracking-[0.35em] text-sky-200/70">
            {params.mix >= 75 ? 'Full Glue' : params.mix >= 50 ? 'Blended' : params.mix >= 25 ? 'Touch' : 'Parallel'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-6">
        <PluginKnob
          label="Threshold"
          value={(params.threshold + 48) / 48}
          onChange={(v) => onChange("threshold", Math.round(v * 48 - 48))}
        />
        <PluginKnob
          label="Ratio"
          value={(params.ratio - 1) / 19}
          onChange={(v) => onChange("ratio", Math.round(1 + v * 19))}
        />
        <PluginKnob
          label="Release"
          value={(params.release - 20) / (1000 - 20)}
          onChange={(v) => onChange("release", Math.round(20 + v * (1000 - 20)))}
        />
        <PluginKnob
          label="Mix"
          value={params.mix / 100}
          onChange={(v) => onChange("mix", Math.round(v * 100))}
        />
      </div>
    </div>
  );
};

export default MixxGlueVisualizer;

