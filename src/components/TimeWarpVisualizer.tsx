
// components/TimeWarpVisualizer.tsx
import React from 'react';
import { VisualizerProps } from '../App';
import { PluginKnob } from './PluginKnob';

const TimeWarpVisualizer: React.FC<VisualizerProps<{ warp: number; intensity: number }>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gray-900/50 overflow-hidden">
        <div className="relative grid grid-cols-2 gap-x-4 gap-y-6">
            <PluginKnob label="Warp" value={params.warp} onChange={(v) => onChange('warp', v)} />
            <PluginKnob label="Intensity" value={params.intensity} onChange={(v) => onChange('intensity', v)} />
        </div>
    </div>
  );
};

export default TimeWarpVisualizer;
