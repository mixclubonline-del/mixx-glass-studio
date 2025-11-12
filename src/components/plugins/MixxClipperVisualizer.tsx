import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type ClipParams = {
  amount: number;
  bias: number;
  mix: number;
};

const MixxClipperVisualizer: React.FC<VisualizerProps<ClipParams>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[rgba(8,8,8,0.95)] via-[rgba(24,24,24,0.92)] to-[rgba(4,4,4,0.98)]">
      <svg className="absolute inset-0 w-full h-full opacity-45">
        <defs>
          <radialGradient id="clip-core" cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="#f87171" stopOpacity="0.45" />
            <stop offset="70%" stopColor="#0f172a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#clip-core)" />
      </svg>

      <div className="relative grid grid-cols-3 gap-6">
        <PluginKnob
          label="Amount"
          value={(params.amount - 0.1) / (1.4 - 0.1)}
          onChange={(v) => onChange("amount", 0.1 + v * (1.4 - 0.1))}
        />
        <PluginKnob
          label="Bias"
          value={(params.bias + 0.4) / 0.8}
          onChange={(v) => onChange("bias", v * 0.8 - 0.4)}
        />
        <PluginKnob label="Mix" value={params.mix} onChange={(v) => onChange("mix", v)} />
      </div>

      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-sm tracking-[0.45em] text-rose-200/75 uppercase">Mixx Clip</div>
        <div className="text-[0.65rem] text-rose-100/55 uppercase tracking-[0.35em]">
          harmonic drive · bias sculpt
        </div>
      </div>
    </div>
  );
};

export default MixxClipperVisualizer;


