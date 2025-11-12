

import React from 'react';
import { PluginKnob } from './PluginKnob';
import { VisualizerProps } from '../App';


const MixxFXVisualizer: React.FC<VisualizerProps<{ 
      drive: number;
      tone: number;
      depth: number;
      mix: number;
  }>> = ({ params, onChange }) => {
  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-gray-900/50 overflow-hidden">
      {/* Background SVG */}
      <svg width="100%" height="100%" className="absolute inset-0 w-full h-full">
          <defs>
              <pattern id="brushed-metal" patternUnits="userSpaceOnUse" width="100" height="100">
                  <image href="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZmlsdGVlciBpZD0ibm9pc2UiPjxmZVR1cmJ1bGVuY2UgdHlwZT0iZnJhY3RhbE5vaXNlIiBiYXNlRnJlcXVlbmN5PSIxLjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsdGVyPSJ1cmwoI25vaXNlKSIgb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==" x="0" y="0" width="100%" height="100%"/>
              </pattern>
              <linearGradient id="panel-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#374151" />
                  <stop offset="100%" stopColor="#111827" />
              </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#panel-gradient)" />
          <rect width="100%" height="100%" fill="url(#brushed-metal)" />
      </svg>

      {/* Controls */}
      <div className="relative grid grid-cols-2 gap-x-4 gap-y-6">
          <PluginKnob label="Drive" value={params.drive} onChange={(v) => onChange('drive', v)} />
          <PluginKnob label="Tone" value={params.tone} onChange={(v) => onChange('tone', v)} />
          <PluginKnob label="Depth" value={params.depth} onChange={(v) => onChange('depth', v)} />
          <PluginKnob label="Mix" value={params.mix} onChange={(v) => onChange('mix', v)} />
      </div>
      
      {/* Branding */}
      <div className="absolute bottom-2 right-4 text-right">
          <p className="font-bold text-lg text-gray-400 tracking-widest">MIXX FX</p>
          <p className="text-xs text-cyan-400/70">Custom Series</p>
      </div>
    </div>
  );
};

export default MixxFXVisualizer;