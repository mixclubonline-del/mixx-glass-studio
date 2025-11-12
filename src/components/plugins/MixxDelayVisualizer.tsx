import React from "react";
import { PluginKnob } from "../PluginKnob";
import { VisualizerProps } from "../../App";

type DelayParams = {
  time: number;
  feedback: number;
  mix: number;
  tone: number;
};

const MixxDelayVisualizer: React.FC<VisualizerProps<DelayParams>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[rgba(6,14,32,0.92)] via-[rgba(12,24,48,0.88)] to-[rgba(2,8,20,0.95)]">
      <svg className="absolute inset-0 w-full h-full opacity-30">
        <defs>
          <linearGradient id="delay-grid" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee22" />
            <stop offset="100%" stopColor="#a855f722" />
          </linearGradient>
        </defs>
        <pattern id="beats" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="url(#delay-grid)" strokeWidth="0.75" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#beats)" />
      </svg>

      <div className="relative grid grid-cols-2 gap-x-6 gap-y-6">
        <PluginKnob
          label="Time"
          value={params.time / 1.2}
          onChange={(v) => onChange("time", Math.min(1.2, Math.max(0.02, v * 1.2)))}
        />
        <PluginKnob
          label="Feedback"
          value={params.feedback}
          onChange={(v) => onChange("feedback", v)}
        />
        <PluginKnob label="Mix" value={params.mix} onChange={(v) => onChange("mix", v)} />
        <PluginKnob label="Tone" value={params.tone} onChange={(v) => onChange("tone", v)} />
      </div>

      <div className="absolute bottom-4 right-4 text-right">
        <div className="text-sm tracking-[0.45em] text-sky-200/75 uppercase">Mixx Delay</div>
        <div className="text-[0.65rem] text-sky-100/55 uppercase tracking-[0.35em]">
          feedback lattice · tone sculpt
        </div>
      </div>
    </div>
  );
};

export default MixxDelayVisualizer;


