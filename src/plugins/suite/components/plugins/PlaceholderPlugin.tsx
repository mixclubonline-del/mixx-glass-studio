
import React from 'react';
import { PluginContainer } from '../shared/PluginContainer';
import { PluginComponentProps, PluginState } from '../../types';

interface PlaceholderPluginProps extends PluginComponentProps<PluginState> {
  // name and description are in the base props
  pluginDef?: {
    moodResponse: string;
    lightingProfile: { motion: string };
  }
}

const colorMap: { [key: string]: { gradient: string, shadow: string, text: string } } = {
  core: { gradient: 'from-sky-400 to-blue-500', shadow: 'shadow-sky-500/40', text: 'text-sky-200' },
  neural: { gradient: 'from-fuchsia-500 to-pink-600', shadow: 'shadow-fuchsia-500/40', text: 'text-fuchsia-300' },
  master: { gradient: 'from-yellow-200 to-amber-300', shadow: 'shadow-yellow-400/40', text: 'text-yellow-200' },
  signature: { gradient: 'from-rose-400 to-pink-500', shadow: 'shadow-rose-500/40', text: 'text-rose-200' },
  system: { gradient: 'from-gray-300 to-slate-400', shadow: 'shadow-gray-400/40', text: 'text-gray-200' },
  default: { gradient: 'from-gray-500 to-gray-700', shadow: 'shadow-gray-500/40', text: 'text-gray-300' },
};


export const PlaceholderPlugin: React.FC<PlaceholderPluginProps> = ({ name, description, isDragging, isResizing, pluginDef }) => {
  // This is a simplified lookup. A real implementation would get the tier from the pluginDef.
  const tier = (pluginDef as any)?.tier || 'default';
  const colorClasses = colorMap[tier] || colorMap.default;
  
  return (
    <PluginContainer title={name} subtitle={description} isDragging={isDragging} isResizing={isResizing}>
      <div className="flex flex-col items-center justify-center h-full text-center text-white/70 p-4">
        <div className="relative w-48 h-48 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${colorClasses.gradient} opacity-30 animate-pulse`} style={{ animationDuration: '3s' }}></div>
            <div className={`w-3/4 h-3/4 rounded-full bg-black/50 border border-white/10 flex items-center justify-center p-4 shadow-2xl ${colorClasses.shadow}`}>
                <p className={`font-orbitron text-lg ${colorClasses.text}`}>{name}</p>
            </div>
        </div>
        <div className="mt-8 max-w-md">
            <h4 className="font-bold tracking-wider uppercase text-white/50">Behavioral Response</h4>
            <p className="text-sm mt-2 text-white/60">{pluginDef?.moodResponse || "This plugin's unique behavior is yet to be visualized."}</p>
        </div>
      </div>
    </PluginContainer>
  );
};
