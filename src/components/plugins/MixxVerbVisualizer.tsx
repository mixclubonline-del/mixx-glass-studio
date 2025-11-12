import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type VerbParams = {
  mix: number;
  time: number;
  preDelay: number;
};

const MixxVerbVisualizer: React.FC<VisualizerProps<VerbParams>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[rgba(10,22,40,0.85)] via-[rgba(16,32,58,0.9)] to-[rgba(6,12,24,0.9)]">
      <svg className="absolute inset-0 w-full h-full opacity-70">
        <defs>
          <radialGradient id="verb-halo" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.35" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#verb-halo)" />
      </svg>

      <div className="relative grid grid-cols-3 gap-6">
        <PluginKnob label="Mix" value={params.mix} onChange={(v) => onChange("mix", v)} />
        <PluginKnob label="Time" value={params.time / 8} onChange={(v) => onChange("time", v * 8)} />
        <PluginKnob
          label="Pre Delay"
          value={params.preDelay / 0.12}
          onChange={(v) => onChange("preDelay", v * 0.12)}
        />
      </div>

      <div className="absolute bottom-4 text-center">
        <div className="text-sm tracking-[0.45em] text-cyan-200/75 uppercase">Mixx Verb</div>
        <div className="text-[0.65rem] text-cyan-100/55 uppercase tracking-[0.35em]">
          Velvet diffusion · convolution bloom
        </div>
      </div>
    </div>
  );
};

export default MixxVerbVisualizer;


