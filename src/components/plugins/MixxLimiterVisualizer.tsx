import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type LimiterParams = {
  threshold: number;
  release: number;
  makeupGain: number;
};

const MixxLimiterVisualizer: React.FC<VisualizerProps<LimiterParams>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[rgba(32,5,14,0.9)] via-[rgba(64,18,28,0.85)] to-[rgba(12,2,8,0.92)] overflow-hidden">
      <svg className="absolute inset-0 w-full h-full opacity-40">
        <defs>
          <linearGradient id="limiter-lines" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path
          d="M 0 100 L 100 0"
          stroke="url(#limiter-lines)"
          strokeWidth="120"
          strokeOpacity="0.18"
        />
      </svg>

      <div className="relative grid grid-cols-3 gap-6">
        <PluginKnob
          label="Threshold"
          value={(params.threshold + 30) / 30}
          onChange={(v) => onChange("threshold", v * 30 - 30)}
        />
        <PluginKnob
          label="Release"
          value={(params.release - 0.05) / (0.6 - 0.05)}
          onChange={(v) => onChange("release", 0.05 + v * (0.6 - 0.05))}
        />
        <PluginKnob
          label="Makeup"
          value={(params.makeupGain - 0.5) / (3 - 0.5)}
          onChange={(v) => onChange("makeupGain", 0.5 + v * (3 - 0.5))}
        />
      </div>

      <div className="absolute bottom-4 text-center">
        <div className="text-sm tracking-[0.45em] text-amber-200/75 uppercase">Mixx Limiter</div>
        <div className="text-[0.65rem] text-amber-100/55 uppercase tracking-[0.35em]">
          crest control · recall safe
        </div>
      </div>
    </div>
  );
};

export default MixxLimiterVisualizer;


