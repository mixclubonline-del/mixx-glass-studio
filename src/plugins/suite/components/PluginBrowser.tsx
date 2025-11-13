
import React, { useMemo } from 'react';
import { motion, Variants } from 'framer-motion';
import { PLUGIN_TIERS, TierName, PluginKey } from '../constants';
import { pluginPreviews } from './shared/MiniVisualizers';
import { PluginBrowserProps } from '../types';

const browserVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeInOut', staggerChildren: 0.1 } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeInOut' } },
};

const tierVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.05 } }
};

const cardVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } }
};

const tierColorMap: Record<TierName, { text: string, border: string, shadow: string }> = {
  'Core Tier': { text: 'text-cyan-300', border: 'hover:border-cyan-400', shadow: 'hover:shadow-[0_0_20px_var(--glow-cyan)]' },
  'Neural Tier': { text: 'text-pink-300', border: 'hover:border-pink-400', shadow: 'hover:shadow-[0_0_20px_var(--glow-pink)]' },
  'Master Tier': { text: 'text-amber-300', border: 'hover:border-amber-400', shadow: 'hover:shadow-[0_0_20px_#f59e0b]' },
  'Signature / Experimental Tier': { text: 'text-rose-300', border: 'hover:border-rose-400', shadow: 'hover:shadow-[0_0_20px_#f43f5e]' },
  'System Tier': { text: 'text-violet-300', border: 'hover:border-violet-400', shadow: 'hover:shadow-[0_0_20px_#8b5cf6]' },
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

  return (
    <motion.div
      className="w-full h-full overflow-y-auto custom-scrollbar"
      variants={browserVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="p-8 pt-16 max-w-7xl mx-auto">
        {tierNames.map((tierName) => {
          const plugins = Object.entries(PLUGIN_TIERS[tierName]);
          const colors = tierColorMap[tierName];
          return (
            <motion.div key={tierName} className="mb-12" variants={tierVariants}>
              <h2 className={`font-orbitron text-3xl font-bold ${colors.text} mb-6 tracking-wider`}>
                {tierName}
              </h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {plugins.map(([pluginKey, pluginInfo]) => {
                  const PreviewComponent = pluginPreviews[pluginKey as PluginKey];
                  const isSelected = activePlugin === pluginKey;
                  const isInChain = existingSet.has(pluginInfo.id);

                  return (
                    <motion.div
                      key={pluginKey}
                      layoutId={pluginKey}
                      variants={cardVariants}
                      className="w-full"
                      animate={{
                        opacity: isTransitioning && !isSelected ? 0 : 1,
                      }}
                      whileHover={{ y: -10, scale: 1.03 }}
                    >
                      <div
                        className={`flex h-80 w-full flex-col justify-between rounded-2xl border border-white/10 bg-white/5 p-6 text-center transition-all duration-300 backdrop-blur-md ${colors.border} ${colors.shadow} hover:bg-white/10`}
                        onMouseEnter={() => onPreviewPlugin?.(pluginInfo.id)}
                      >
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
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};
