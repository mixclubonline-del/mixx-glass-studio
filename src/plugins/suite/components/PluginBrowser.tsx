
import React, { useMemo } from 'react';
import { useFlowMotion } from '../../../components/mixxglass';
import { PLUGIN_TIERS, TierName, PluginKey } from '../constants';
import { pluginPreviews } from './shared/MiniVisualizers';
import { PluginBrowserProps } from '../types';


const tierColorMap: Record<TierName, { text: string, border: string, shadow: string }> = {
  'Core Tier': { text: 'text-cyan-300', border: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_var(--glow-cyan)]' },
  'Neural Tier': { text: 'text-pink-300', border: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_var(--glow-pink)]' },
  'Master Tier': { text: 'text-amber-300', border: 'hover:border-amber-400', shadow: 'hover:shadow-[0_0_20px_#f59e0b]' },
  'Signature / Experimental Tier': { text: 'text-rose-300', border: 'hover:border-rose-400', shadow: 'hover:shadow-[0_0_20px_#f43f5e]' },
  'System Tier': { text: 'text-violet-300', border: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_#8b5cf6]' },
};

// Plugin Card Component - uses hook at component level
const PluginCard: React.FC<{
  pluginKey: string;
  pluginInfo: any;
  isSelected: boolean;
  isInChain: boolean;
  isTransitioning: boolean;
  onSelectPlugin: (pluginKey: PluginKey) => void;
  onAddToTrack?: (pluginId: string) => void;
}> = ({ pluginKey, pluginInfo, isSelected, isInChain, isTransitioning, onSelectPlugin, onAddToTrack }) => {
  const PreviewComponent = pluginPreviews[pluginKey as PluginKey];
  
  // Hook is now called at component level
  const cardStyle = useFlowMotion(
    { opacity: isTransitioning && !isSelected ? 0 : 1, scale: 1 },
    { duration: 300, easing: 'ease-out' }
  );

  return (
    <div
      key={pluginKey}
      className="w-full transition-transform hover:-translate-y-2.5 hover:scale-[1.03]"
      style={{ opacity: cardStyle.opacity, transform: `scale(${cardStyle.scale})` }}
    >
      <div className="group relative flex flex-col rounded-lg border border-white/10 bg-black/30 p-6 transition-all duration-300 hover:border-cyan-400 hover:bg-black/40 hover:shadow-[0_0_15px_var(--glow-cyan)]">
        <button
          onClick={() => onSelectPlugin(pluginKey as PluginKey)}
          className="flex flex-1 flex-col items-center justify-between"
        >
          <div className="flex h-20 w-32 items-center justify-center rounded-lg border border-white/10 bg-black/20 transition-all duration-300 group-hover:border-cyan-400 group-hover:shadow-[0_0_15px_var(--glow-cyan)]">
            {PreviewComponent && <PreviewComponent />}
          </div>
          <div className="mt-6 flex flex-1 flex-col justify-center">
            <h3 className="font-orbitron text-xl font-bold text-white transition-colors group-hover:text-cyan-200">
              {pluginInfo.name}
            </h3>
            <p className="mt-3 px-2 text-sm text-white/60">{pluginInfo.description}</p>
          </div>
        </button>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[0.55rem] uppercase tracking-[0.32em] text-white/70">
            {pluginInfo.moodResponse}
          </span>
          <button
            onClick={() => onAddToTrack?.(pluginInfo.id)}
            disabled={isInChain}
            className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[0.55rem] uppercase tracking-[0.28em] transition-all ${
              isInChain
                ? 'cursor-default border-white/15 bg-white/12 text-white/45'
                : 'border-white/25 bg-white/15 text-white/85 hover:bg-white/25'
            }`}
          >
            {isInChain ? 'Loaded' : 'Route to Track'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Tier Section Component - uses hook at component level
const TierSection: React.FC<{
  tierName: TierName;
  tierNames: TierName[];
  activePlugin: PluginKey | null;
  isTransitioning: boolean;
  existingSet: Set<string>;
  onSelectPlugin: (pluginKey: PluginKey) => void;
  onAddToTrack?: (pluginId: string) => void;
}> = ({ tierName, tierNames, activePlugin, isTransitioning, existingSet, onSelectPlugin, onAddToTrack }) => {
  const plugins = Object.entries(PLUGIN_TIERS[tierName]);
  const colors = tierColorMap[tierName];
  
  // Hook is now called at component level
  const tierStyle = useFlowMotion(
    { opacity: 1, y: 0 },
    { duration: 300, delay: tierNames.indexOf(tierName) * 50, easing: 'ease-out' }
  );

  return (
    <div className="mb-12" style={{ opacity: tierStyle.opacity, transform: `translateY(${tierStyle.y}px)` }}>
      <h2 className={`font-orbitron text-3xl font-bold ${colors.text} mb-6 tracking-wider`}>
        {tierName}
      </h2>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {plugins.map(([pluginKey, pluginInfo]) => (
          <PluginCard
            key={pluginKey}
            pluginKey={pluginKey}
            pluginInfo={pluginInfo}
            isSelected={activePlugin === pluginKey}
            isInChain={existingSet.has(pluginInfo.id)}
            isTransitioning={isTransitioning}
            onSelectPlugin={onSelectPlugin}
            onAddToTrack={onAddToTrack}
          />
        ))}
      </div>
    </div>
  );
};

export const PluginBrowser: React.FC<PluginBrowserProps> = ({
  onSelectPlugin,
  activePlugin,
  isTransitioning,
  existingPluginIds = [],
  onAddToTrack,
  onPreviewPlugin,
}) => {
  const tierNames = Object.keys(PLUGIN_TIERS) as TierName[];
  const existingSet = useMemo(() => new Set(existingPluginIds), [existingPluginIds]);

  const browserStyle = useFlowMotion(
    { opacity: 1 },
    { duration: 500, easing: 'ease-in-out' }
  );

  return (
    <div
      className="w-full h-full overflow-y-auto custom-scrollbar"
      style={{ opacity: browserStyle.opacity }}
    >
      <div className="p-8 pt-16 max-w-7xl mx-auto">
        {tierNames.map((tierName) => (
          <TierSection
            key={tierName}
            tierName={tierName}
            tierNames={tierNames}
            activePlugin={activePlugin}
            isTransitioning={isTransitioning}
            existingSet={existingSet}
            onSelectPlugin={onSelectPlugin}
            onAddToTrack={onAddToTrack}
          />
        ))}
      </div>
    </div>
  );
};
